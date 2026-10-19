# W9 性能专项：9.1 零帧渲染 + 9.2 计算与缓存基准

## Context

W9 性能专项只做 9.1 与 9.2（9.3 弱网降级暂缓）：

- **9.1 零帧渲染**（P1）：布局引擎已把非当前页/隐藏 Tile 渲染为 `opacity:0 + pointer-events:none`（[stylesheet.ts](components/layout/engine/stylesheet.ts)），但 `VideoTile` 的 `<video>` 仍在持续解码、`AudioLevel` 的 rAF 仍在每帧计算+绘制。需要把"布局 hidden 信号"接到播放与绘制循环上，实现非可视区 video.pause 停止解码、Canvas 降帧。
- **9.2 基准报告**（P2）：产出"布局计算耗时、LRU 命中率"benchmark 报告；顺带给 Worker 响应加耗时埋点（node 环境测不了真 Worker，报告以主线程计算 + 缓存模拟为主）。

## 9.1 零帧渲染

### VideoTile（[components/tile/video.tsx](components/tile/video.tsx)）

- `VideoTileProps` 新增 `visible?: boolean`（默认 `true`），从 props 解构避免透传到 video DOM
- 新增 effect（置于现有 bind/unbind effect 之后）：
  - `visible === false` → `el.pause()`（浏览器停止解码，0 帧渲染）
  - 恢复 `true` → `el.paused && el.play().catch(() => {})`（autoplay 政策静默失败）
- 音频不受影响：video 元素 `muted`，会议音频走 audio 元素/WebAudio 管道
- 使用方式：布局场景由 `renderEntity(node)` 传入 `visible={!node.hidden}`

### AudioLevel（[components/tile/audio.tsx](components/tile/audio.tsx)）

- `AudioLevelProps` 新增：
  - `visible?: boolean`（默认 `true`）
  - `fps?: number`（绘制帧率上限，`undefined` = 全速；用于限帧降负载）
- `dynamicRef` 补充 `visible/fps`（rAF 每帧读取，不重建分析链——沿用现有模式 L246-252）
- `tick` 改造（L293-366）：
  - `requestAnimationFrame(tick)` 移到 tick 开头统一排队（原在末尾），early return 分支不会断循环
  - `visible === false` → 直接 return（跳过频谱计算、平滑管线与 draw；rAF 空转开销可忽略，页面后台时浏览器自动暂停 rAF）
  - `fps` 限帧：`now - lastDraw < 1000 / fps` 时 return（跳帧但保留缓动状态，恢复流畅无跳变）
- `levels/targets/shape` 状态保留，恢复可见时无视觉跳变

### 文档与 demo

- [docs/components/video-tile.md](docs/components/video-tile.md)：API 表加 `visible` 行 + "0 帧渲染"说明段（含 `renderEntity` 传 `visible={!node.hidden}` 的完整 demo，遵守 dumi tsx 块规则：函数组件 + default export）
- audio-tile.md（若存在 AudioLevel 文档段）同步 `visible/fps` API 行
- barrel 不需要新增导出（VideoTile/AudioLevel 已导出）

## 9.2 Worker 计算与缓存基准

### Worker 耗时埋点（[components/layout/engine/worker/index.ts](components/layout/engine/worker/index.ts)、[proxy.ts](components/layout/engine/worker/proxy.ts)）

- worker 端 `compute` 前后 `performance.now()`，`compute_response` 消息增加 `duration: number`（消息类型同步加字段）
- proxy 收到响应时记录 `lastDuration`，暴露 `getLastComputeDuration(): number | null`（Engine 不动，保持克制）

### Benchmark 测试（新建 `components/layout/engine/__tests__/benchmark.test.ts`，vitest node 环境）

纯计算无 DOM 依赖，vitest 裸跑可执行：

- **布局计算耗时**：实体规模 [6, 12, 30, 60, 100] × 布局 [grid, focus]，容器 1280×720，warmup 5 轮 + 计量 30 轮，统计 mean / P95（ms），`console.table` 输出
- **LRU 命中率**（基于 `LayoutCache.getStats()` 的 hits/misses，[cache.ts L105-117](components/layout/engine/cache.ts#L105-L117)）：先读 cache.ts 确认 key 构成（entityCount/layoutType/pageSize/deviceType/fullScreen/width/height）后设计场景，预计四类：
  1. 重复同配置计算 → 期望命中 ≈ 100%
  2. 翻页序列（page 变化、其余不变）→ 依 key 是否含 page 而定，报告如实分析
  3. 连续 resize（width 每轮 +7px）→ 期望低命中
  4. 实体增删（entityCount 变化）→ 期望低命中
  每场景输出 hits/misses/hitRate/size/evictions，`console.table`
- 断言宽松（耗时 > 0、hitRate ∈ [0,1]、size ≤ maxEntries），保证 CI 不因机器抖动失败

### Benchmark 报告（新建 `spec/benchmark-report.md`）

- 运行 `npx vitest run components/layout/engine/__tests__/benchmark.test.ts` 收集控制台表格
- 报告内容：测试环境说明、计算耗时表（含随实体规模的结论：O(n) 线性、grid vs focus 差异）、LRU 命中率表（各场景命中率与缓存 key 设计的分析）、Worker duration 埋点说明与启用方式（`worker: { enabled: true, workerUrl }`）
- 更新 [spec/tasks-mid.md](spec/tasks-mid.md)：9.1 / 9.2 状态标 ✅（9.3 保持待办）

## 实施顺序

1. AudioLevel 降帧（visible/fps + tick 改造）
2. VideoTile pause（visible + play/pause effect）
3. tsc + vitest 全量回归
4. worker duration 埋点 + proxy 记录
5. benchmark.test.ts（先读 cache.ts 全文确认 key，再写场景）
6. 跑 benchmark → 整理 spec/benchmark-report.md
7. 文档更新（video-tile.md / audio-tile.md）+ tasks-mid.md 状态

## 验证

- `npx tsc --noEmit -p tsconfig.json` 全量干净
- `npx vitest run` 全量通过（含新 benchmark 用例，宽松断言）
- dumi 文档页编译通过（video-tile.md 新 demo 无 wasm 崩溃：完整组件 + default export）
- 9.1 手动验证路径：文档页 demo / src demo 中把 Tile 放到非当前页（hidden），观察 video 元素 paused 状态与 canvas 帧停止
