# 中期任务清单（第 5-9 周）

> 对应 [plan.md](./plan.md) 中期阶段。优先级：P0=必须 / P1=重要 / P2=可选

## W5-6：功能层完整化

| # | 任务 | 涉及文件 | 验收标准 | 优先级 |
|---|------|----------|----------|--------|
| 5.1 | `ChatPanel` 聊天面板 | `components/chat/`（新建） | 虚拟列表渲染海量消息；支持 @提及、消息回复；DataChannel 或 HTTP 传输 | P0 |
| 5.2 | `ParticipantList` 参会者列表 | `components/participant/list.tsx`（新建） | 虚拟滚动；搜索/筛选；拖拽排序；批量静音/取消静音 | P0 |
| 5.3 | `ScreenShare` 完善 | `components/controller/`、`components/tile/` | 共享源切换（屏幕/窗口/标签页）；共享者标识；共享画面录制 | P1 |

## W7：插件生态 + 设置

| # | 任务 | 涉及文件 | 验收标准 | 优先级 |
|---|------|----------|----------|--------|
| 7.1 | 插件系统完善 | `components/room/plugins/` | 生命周期（install/uninstall）、事件完善；声网/腾讯云适配示例 | P1 |
| 7.2 | `SettingsPanel` 设置面板 | `components/settings/`（新建） | 设备管理（枚举/切换）；主题切换（CSS 变量）；暗色模式 | P1 |
| 7.3 | `Toast` 通知 | `components/toast/`（新建） | 消息通知队列；类型（成功/错误/信息）；可配置位置 | P2 |

## W8：Layout 高级特性

| # | 任务 | 涉及文件 | 验收标准 | 优先级 |
|---|------|----------|----------|--------|
| 8.1 | 拖拽排序 | `components/layout/engine/` | 用户手动调整实体位置并持久化 | P1 |
| 8.2 | 自定义布局模式 | `components/layout/` | 支持 Sidebar / Custom Grid 扩展注册 | P1 |
| 8.3 | 键盘导航 | `components/layout/` | Tab / 方向键切换焦点实体 | P2 |

## W9：性能专项

| # | 任务 | 涉及文件 | 验收标准 | 优先级 |
|---|------|----------|----------|--------|
| 9.1 | 0 帧渲染 | `components/tile/` | 非可视区 video.pause 停止解码、Canvas 降帧 | P1 |
| 9.2 | Worker 计算与缓存基准 | `components/layout/engine/worker/`、`cache.ts` | 布局计算耗时、LRU 命中率 benchmark 报告 | P2 |
| 9.3 | 弱网自适应降级 | `components/layout/` | 弱网时自动 Grid → Focus 降级 | P2 |
