# 布局引擎性能基准报告（W9.2）

- 测试代码：`components/layout/engine/__tests__/benchmark.test.ts`
- 复现命令：`npx vitest run components/layout/engine/__tests__/benchmark.test.ts`
- 测试环境：Node（vitest 4.1.10）、macOS、主线程同步计算（未启用 Worker）
- 测试日期：2026-10-15

## 一、布局计算耗时

### 数据

容器 1280×720、桌面端、pageSize 6、gridFixedSize=false、smart=true，预热 5 轮后采样（≤30 实体 30 轮、>30 实体 20 轮）：

| 实体数 | grid 均值 (ms) | grid P95 (ms) | focus 均值 (ms) | focus P95 (ms) |
|-------:|---------------:|--------------:|----------------:|---------------:|
|      6 |         0.006  |        0.015  |          0.005  |         0.012  |
|     12 |         0.005  |        0.008  |          0.005  |         0.008  |
|     30 |         0.008  |        0.012  |          0.008  |         0.016  |
|     60 |         0.008  |        0.015  |          0.007  |         0.015  |
|    100 |         0.011  |        0.013  |          0.013  |         0.051  |

### 结论

1. **耗时随实体规模近线性（O(n)）**：`computeGridLayout` 对全量实体做一次 `forEach` 输出节点（含非当前页 hidden 节点），6 → 100 实体的均值从 0.006ms 增长到 0.011ms，增长平缓。
2. **grid 与 focus 差异可忽略**：两者在同一数量级（focus 多一次焦点回退判定，常量级）。focus 在 100 实体时的 P95 抖动（0.051ms）来自采样噪声，非算法差异。
3. **主线程直接计算的开销在百人级会议下依然可忽略**（< 0.02ms/次）。**启用 Web Worker 的收益不在均值，而在避免与渲染/交互争抢主线程的长任务与 GC 抖动**——建议在大规模（数百实体）或频繁 resize 场景下开启。
4. Worker 路径已具备耗时观测能力：worker 端计算前后 `performance.now()` 测量，`compute_response` 消息携带 `duration` 字段；主线程可通过 `LayoutWorkerProxy.getLastComputeDuration()` 读取最近一次耗时（[proxy.ts](../components/layout/engine/worker/proxy.ts)）。
5. **Worker 零配置启用**（2026-10-12 起）：不传 `workerUrl` 时使用 `new Worker(new URL('./index.ts', import.meta.url))` 内联模式，vite/webpack 构建下自动产出独立 chunk；**dumi（babel 转译破坏 webpack 的 worker 识别）不会产出 chunk**，运行时 Worker 加载 404 → onerror → 自动回退主线程同步计算，功能无损。需要在该环境强制启用时仍可显式传 `workerUrl`（自建产物）。

## 二、LRU 缓存命中率

### 缓存键构成

`LayoutCache` 的键为 `entityCount_layoutType_pageSize_deviceType_fullScreen_width_height`（[cache.ts](../components/layout/engine/cache.ts)，maxEntries 默认 50，LRU 淘汰）。**page 与 focusEntity 不参与键生成**。

### 数据

| 场景 | 步数 | hits | misses | 命中率 | 最终 size |
|------|-----:|-----:|-------:|-------:|----------:|
| ① 重复同配置计算 | 100 | 99 | 1 | 99.0% | 1 |
| ② 翻页/聚焦切换（page、focus 不在键中） | 50 | 49 | 1 | 98.0% | 1 |
| ③ 连续 resize（每轮宽度 +7px） | 60 | 0 | 60 | 0.0% | 50（触发 LRU 淘汰） |
| ④ 实体进出（30→80→30 往返） | 101 | 49 | 52 | 48.5% | 50 |

### 分析

1. **场景① 99.0%**：同一配置首次 miss 后持续命中，符合预期。
2. **场景② 98.0%（正确性隐患）**：键不含 `page`，翻页后查询会**命中旧 page 的布局节点**。当前这不是线上 bug——因为 Engine 的计算管线（`computeAndCache` / `computeAndCacheAsync`）**尚未接入 LayoutCache**（仅有实例声明与 `clear()`，无 get/set 调用），数据反映的是缓存类自身的语义。**后续若接入管线，必须先把 page/focus 纳入键或改按 (page, focusEntityId) 分键**，否则翻页会复用错误布局。
3. **场景③ 0.0%**：每轮尺寸都是新键，精确匹配全 miss，LRU 正常淘汰（size 收敛到 50）。这正是 `findNearest` + `deriveNodeSizes`（尺寸微调按比例推导，免完整重算）设计针对的场景——**resize 抖动的优化路径不是精确命中，而是尺寸推导**，本次基准未覆盖推导路径（`derivations` 计数器即为此预留）。
4. **场景④ 48.5%**：去程 51 步全 miss，回程 49 步命中去程条目（仅 entityCount=30 一条被淘汰后仍 miss）。说明 **LRU 对成员往返进出（典型会议场景）有真实收益**。

### 建议

- 接入管线前先修正键设计（纳入 page/focusEntity），再启用 `LayoutCache` 并打开 `findNearest` 推导路径，resize 抖动场景收益最大。
- benchmark 中 `derivations` 恒为 0，与"推导路径未接线"一致，可在接入后补充场景③'（resize 走推导）的对比数据。

## 三、W9.1 零帧渲染配套说明

与基准同期落地的渲染侧优化（非本报告测量项）：

- `VideoTile` 新增 `visible` prop：false 时 `video.pause()` 停止解码，恢复自动续播（布局场景传 `visible={!node.hidden}`）
- `AudioLevel` 新增 `visible` / `fps` props：不可见时 rAF 空转跳过全部计算与绘制（0 帧），`fps` 限制绘制帧率上限

配合布局引擎已有的隐藏策略（非当前页 `opacity: 0 + pointer-events: none`，[stylesheet.ts](../components/layout/engine/stylesheet.ts)），非可视区 Tile 可达成 0 帧渲染。
