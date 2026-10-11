# 中期任务清单（第 5-9 周）

> 对应 [plan.md](./plan.md) 中期阶段。优先级：P0=必须 / P1=重要 / P2=可选

## W5-6：功能层完整化

> **2026-10 范围调整**：ChatPanel / ParticipantList / ScreenShare 完善移出范围（决策见下），W5-6 聚焦右键菜单能力（Dropdown contextMenu 升级 + RightCtxMenu）。

| # | 任务 | 涉及文件 | 验收标准 | 优先级 | 状态 |
|---|------|----------|----------|--------|------|
| 5.1 | Dropdown 支持 `contextMenu` 触发 | `components/dropdown/index.tsx` | `trigger="contextMenu"` 在鼠标位置弹出（alignPoint）；再次右键可位移；点击外部/菜单项后关闭 | P0 | ✅ 已完成 |
| 5.2 | `RightCtxMenu` 音视频右键菜单 | `components/dropdown/rightCtxMenu.tsx`（新建） | Dropdown 薄封装：默认右键触发；可 `trigger="click"` 作为 more 按钮展开层；items 复用 Option | P0 | ✅ 已完成 |
| 5.3 | ParticipantItem 集成 more 菜单 | `components/participant/item.tsx` | more 按钮可选渲染，点击/右键展开 RightCtxMenu | P1 | ⏳ |

**范围决策（2026-10-10）**：

- ~~ChatPanel 聊天面板~~：移出组件库范围——聊天不属于音视频组件库职责，使用成熟方案更优（如 antdx Sender + 消息列表），由使用方自行组合
- ~~ParticipantList 参会者列表~~：不提供列表容器——已有 `ParticipantItem` 展示件，分页 / 虚拟滚动由使用方按需组合
- ~~ScreenShare 完善~~：现有 `useScreenShare`（getDisplayMedia + stop + sharing 状态）已满足当前需求，共享源切换等按需增强

## W7：设置

> **2026-10 调整**：Toast / 主题切换 / 暗色模式移出范围——Toast/Note/Alert 等通用 UI 应由 antd 等通用组件库提供，设置面板聚焦音视频场景能力（设备管理、统计等）。

| # | 任务 | 涉及文件 | 验收标准 | 优先级 | 状态 |
|---|------|----------|----------|--------|------|
| 7.1 | `Select` / `Checkbox` 基础件 | `components/select/`、`components/checkbox/`（新建） | Select 受控 value/onChange + options；Checkbox 受控/非受控 + label | P0 | ✅ 已完成 |
| 7.2 | `LangSelect` 语言选择 | `components/settings/langSelect.tsx` | 基于 Select，内置常用语言列表 | P1 | ✅ 已完成 |
| 7.3 | `SettingsPanel` 设置面板 | `components/settings/`（新建） | 常规/音频/视频/系统四分区；设置项 localStorage 持久化 | P0 | ✅ 已完成 |
| 7.4 | 系统统计卡片 | `components/settings/cards.tsx` | 负载/网络/音频/视频四类卡片，stats 由 props 驱动（使用方从 RTCStats 传入） | P1 | ✅ 已完成 |

**设置分区规格**：

- **常规**（`settings/normal.tsx`）：通知（会议开始通知、参会者进出提醒 × Checkbox）；性能模式（标准 / 节能 / 仅音频 × Select）；语言（LangSelect）
- **音频**（`settings/audio.tsx`）：麦克风选择（Device 组件）；输入音量（DeviceSlider.Microphone，真实增益）；扬声器选择（Select，enumerateDevices audiooutput）；输出音量（Slider）；噪声消除（Checkbox）；自动调节（Checkbox）；音量增强（Slider 0-100，0 表示不增强）
- **视频**（`settings/video.tsx`）：摄像头选择（Device 组件）；加入会议自动开启摄像头（Checkbox）；视频镜像（Checkbox）；布局单页人数（Slider 1-9，联动 `engine.setPageSize`）
- **系统**（`settings/system.tsx`）：负载卡片（CPU 核数 / 内存 / 应用占用）；网络卡片（带宽 / 丢包率 / 抖动 / 延迟 / 网络类型）；音频卡片（码率 / 输入音量 / 输出音量）；视频卡片（分辨率 / 帧率 / 码率）

## W8：Layout 高级特性

> **2026-10 形态调整**：拖拽排序做成设置开关（勾选才允许长按拖拽，仅 Grid 可见 Tile）；自定义布局模式做成注册器模式（`LayoutModeDefinition` interface 注册到引擎，Thumbnail 自动渲染切换项）；键盘导航做成独立"快捷键"设置分区（游戏键位绑定式 UI，支持改键与拒绝式冲突检测）。

| # | 任务 | 涉及文件 | 验收标准 | 优先级 | 状态 |
|---|------|----------|----------|--------|------|
| 8.1 | 拖拽排序 | `components/layout/`、`components/settings/video.tsx` | 设置勾选后 Grid Tile 长按 250ms 拖拽换位（指示器提示），`moveEntity`/`reorderEntities` 重排并持久化 `vauid-layout-order`，刷新恢复 | P1 | ✅ 已完成 |
| 8.2 | 自定义布局模式 | `components/layout/engine/layoutMode.ts`、`engine/index.ts`、`thumbnail.tsx` | `registerLayoutMode` 注册自定义 compute（内建拒绝/重复覆盖），Thumbnail 动态渲染注册项，`activateLayout`/`cycleLayoutMode` 统一激活 | P1 | ✅ 已完成 |
| 8.3 | 键盘导航 | `components/layout/shortcut.ts`、`hooks/useKeyboardNav.ts`、`settings/shortcuts.tsx` | 默认键位（←/→ 翻页、Ctrl+←/→ 聚焦、Ctrl+/ 切布局）；快捷键分区可改键，冲突拒绝式保存；输入控件内不触发 | P2 | ✅ 已完成 |

## W9：性能专项

| # | 任务 | 涉及文件 | 验收标准 | 优先级 |
|---|------|----------|----------|--------|
| 9.1 | 0 帧渲染 | `components/tile/` | 非可视区 video.pause 停止解码、Canvas 降帧 | P1 |
| 9.2 | Worker 计算与缓存基准 | `components/layout/engine/worker/`、`cache.ts` | 布局计算耗时、LRU 命中率 benchmark 报告 | P2 |
| 9.3 | 弱网自适应降级 | `components/layout/` | 弱网时自动 Grid → Focus 降级 | P2 |
