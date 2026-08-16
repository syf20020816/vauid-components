# Vauid Components 项目阶段规划

> 技术愿景参考 `技术.md`（四层组件体系：基础层 → 核心层 → 功能层 → 业务层）
> 本文档将随项目进展持续更新，各阶段验收后勾选 ✅

## 阶段总览

| 阶段 | 建议工期 | 核心目标 | 状态 |
|------|----------|----------|------|
| 初期 | 4 周 | 业务层首版（Room 抽象 + MeetingRoom + RoomCtx）+ 核心层补缺 | ⬜ |
| 中期 | 5 周 | 功能层完整化（聊天/参会者列表/设置）+ 插件生态 + Layout 高级特性 | ⬜ |
| 后期 | 6 周 | 业务层扩展（Classroom/LiveStream/RemoteSupport）+ 工程质量 + 发布 | ⬜ |

---

## 初期（第 1-4 周）

**目标**：打通"加入 → 入会 → 离开"完整链路；`<MeetingRoom adapter={...} />` 一行接入；抽象层可扩展多音视频厂商。

### W1：Room 抽象层
- `RoomAdapter` 接口（connect / disconnect / on / off / 设备控制 / track 挂载）
- `LiveKitAdapter` 插件（实现抽象接口，动态 import livekit-client，主 bundle 不包含 livekit）
- `RoomCtx` + `useRoomCtx` + `RoomProvider`（挂载连接、卸载清理）

### W2：MeetingRoom v1
- RoomHeader + Layout + Controller 组合组件
- 本地/远端视频绑定、布局实体动态增删（engine.addEntity/delEntity）
- `useRoom` hook：参与者、麦克风/摄像头状态管理

### W3：核心层补缺
- `Tile.Iframe`（沙箱嵌入、postMessage 通信、懒加载）
- `AudioLevel`（音频电平指示器：AnalyserNode + rAF，条形/圆形/波形模式）
- `VideoPreview`（本地摄像头预览：镜像、分辨率切换、设备枚举）

### W4：串联与验收
- Prejoin ↔ MeetingRoom 状态机串联
- 测试项目端到端替换验证
- 初期 tasks 逐项验收

**阶段性成果** ✅（验收后勾选）：
- [ ] `<MeetingRoom adapter={new LiveKitAdapter(room)} />` 一行接入完整会议房间
- [ ] 抽象层可扩展多音视频厂商（文档含自定义 adapter 示例）
- [ ] 测试项目跑通 加入 → 入会 → 离开 全流程

---

## 中期（第 5-9 周）

**目标**：开箱即用的标准视频会议套件；Layout 支持交互式调整；插件生态成型。

### W5-6：功能层完整化
- `ChatPanel`（聊天面板：虚拟列表、@提及、消息回复）
- `ParticipantList`（参会者列表：虚拟滚动、搜索/筛选、拖拽排序、批量静音）
- `ScreenShare` 完善（共享源切换：屏幕/窗口/标签页；共享者标识）

### W7：插件生态 + 设置
- 插件系统完善（生命周期、事件、第三方适配示例如声网）
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
- [ ] 插件生态成型，第三方适配示例可用

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
