# Vauid Components 项目阶段规划

> 技术愿景参考 `技术.md`（四层组件体系：基础层 → 核心层 → 功能层 → 业务层）
> 本文档将随项目进展持续更新，各阶段验收后勾选 ✅

## 阶段总览

| 阶段 | 建议工期 | 核心目标 | 状态 |
|------|----------|----------|------|
| 初期 | 4 周 | 业务层首版（RoomCtx 布局引擎上下文 + 组件级 MeetingRoom）+ 核心层补缺 | ⬜ |
| 中期 | 5 周 | 功能层完整化（聊天/参会者列表/设置）+ Layout 高级特性 | ⬜ |
| 后期 | 6 周 | 业务层扩展（Classroom/LiveStream/RemoteSupport）+ 工程质量 + 发布 | ⬜ |

---

## 初期（第 1-4 周）

**目标**：打通"加入 → 入会 → 离开"完整链路；`<MeetingRoom entities={...} />` 组件级接入。组件库不感知音视频厂商，厂商对接由使用方完成。

### W1：RoomCtx（布局引擎上下文）
- `RoomCtx` 类型（layout 引擎 + extra 额外数据）
- `RoomCtxProvider` + `useRoomCtx`（Provider 创建/销毁引擎）
- 组件库去除 livekit-client 依赖

### W2：MeetingRoom v1（组件级）
- RoomHeader + Layout + Controller 组合组件
- entities 驱动布局（useEngine 自动同步，支持动态增删）
- renderEntity/renderHeader/controller/extra 可定制

### W3：核心层补缺
- `Tile.Iframe`（沙箱嵌入、postMessage 通信、懒加载）
- `AudioLevel`（音频电平指示器：AnalyserNode + rAF，条形/圆形/波形模式）
- `VideoPreview`（本地摄像头预览：镜像、分辨率切换、设备枚举）

### W4：串联与验收
- Prejoin ↔ MeetingRoom 状态机串联
- 测试项目端到端替换验证
- 初期 tasks 逐项验收

**阶段性成果** ✅（验收后勾选）：
- [ ] `<MeetingRoom entities={...} renderEntity={...} />` 组件级接入完整会议房间
- [ ] 测试项目跑通 加入 → 入会 → 离开 全流程（页面层对接 livekit）

---

## 中期（第 5-9 周）

**目标**：开箱即用的标准视频会议套件；Layout 支持交互式调整。

### W5-6：功能层完整化
- `ChatPanel`（聊天面板：虚拟列表、@提及、消息回复）
- `ParticipantList`（参会者列表：虚拟滚动、搜索/筛选、拖拽排序、批量静音）
- `ScreenShare` 完善（共享源切换：屏幕/窗口/标签页；共享者标识）

### W7：设置
- `SettingsPanel`（设备管理、主题切换、暗色模式）
- `Toast` 通知

### W8：Layout 高级特性
- 拖拽排序（用户手动调整实体位置）
- 自定义布局模式（Sidebar / Custom Grid）
- 键盘导航（Tab / 方向键切换焦点）

### W9：性能专项
- 0 帧渲染验证（非可视区 pause 视频、降帧）
- Web Worker 计算完善、LRU 缓存基准测试
- 弱网自适应降级（Grid → Focus）

**阶段性成果** ✅（验收后勾选）：
- [ ] 标准视频会议套件（聊天 / 参会者列表 / 设置 / 通知）
- [ ] Layout 支持交互式调整（拖拽、自定义模式、键盘导航）

---

## 后期（第 10-15 周）

**目标**：多业务场景组件就绪；工程质量达标；发布 v1.0。

### W10-11：业务层扩展
- `Classroom`（Layout + Whiteboard + ChatPanel + ControlBar）
- `LiveStream`（Layout + AudioLevel + 聊天 + 观看人数）

### W12-13：远程协作
- `RemoteSupport`（ScreenShare + MouseMapper + AnnotationLayer）
- `EffectsLayer`（虚拟背景 / 美颜 / 滤镜，WebGL）

### W14：工程质量
- 无障碍（键盘导航、aria、高对比度、字体缩放）
- 安全（CSP、iframe 沙箱、XSS 防护）
- 移动端适配（触控手势、iOS/Android）
- 测试覆盖率（核心 >80%、UI >60%）、Benchmark

### W15：发布
- npm 包发布流程、changelog
- dumi 文档补全、CI/CD 完善

**阶段性成果** ✅（验收后勾选）：
- [ ] 3+ 业务场景组件就绪（Classroom / LiveStream / RemoteSupport）
- [ ] 测试 / 文档完备，覆盖率达标
- [ ] v1.0 可发布

---

## 任务清单

各阶段详细任务见对应文件：
- [tasks-initial.md](./tasks-initial.md) — 初期（第 1-4 周）
- [tasks-mid.md](./tasks-mid.md) — 中期（第 5-9 周）
- [tasks-late.md](./tasks-late.md) — 后期（第 10-15 周）
