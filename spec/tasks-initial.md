# 初期任务清单（第 1-4 周）

> 对应 [plan.md](./plan.md) 初期阶段。优先级：P0=必须 / P1=重要 / P2=可选

## W1：Room 抽象层

| # | 任务 | 涉及文件 | 验收标准 | 优先级 |
|---|------|----------|----------|--------|
| 1.1 | 定义抽象 `RoomAdapter` 接口与参与者/事件类型 | `components/room/types.ts`（新建） | 包含 connect/disconnect/on/off/设备控制/track 挂载；类型不含 livekit 依赖 | P0 |
| 1.2 | 实现 `LiveKitAdapter`（抽象接口 → livekit 适配） | `components/room/plugins/livekit.ts`（新建） | 事件转译正确；`import type` + 运行时动态 import；接收已连接 Room 实例 | P0 |
| 1.3 | 实现 `RoomCtx` / `RoomProvider` / `useRoomCtx` | `components/room/ctx/index.tsx`（替换空文件） | Provider 挂载订阅、卸载取消订阅并 disconnect；useRoomCtx 未在 Provider 内返回 null + warn | P0 |
| 1.4 | package.json 声明 livekit-client 依赖 | `package.json` | peerDependencies + devDependencies 均含 livekit-client，pnpm install 通过 | P0 |
| 1.5 | barrel 导出 Room 相关 API | `components/index.ts` | MeetingRoom/RoomProvider/useRoomCtx/LiveKitAdapter 及类型可导入 | P0 |

## W2：MeetingRoom v1

| # | 任务 | 涉及文件 | 验收标准 | 优先级 |
|---|------|----------|----------|--------|
| 2.1 | 实现 `useRoom` hook（参与者/设备状态） | `components/room/hooks/useRoom.ts`（新建） | 订阅 adapter 事件同步 remotes/micOn/camOn；track 挂载时序正确（rAF） | P0 |
| 2.2 | 实现 `MeetingRoom` 组合组件 | `components/room/index.tsx`（重写） | RoomProvider + RoomHeader + Layout + Controller 组合；实体动态增删 + 补发已存在参与者 | P0 |
| 2.3 | MeetingRoom 样式 | `components/room/index.scss` | `@include cmp("meeting-room")` 根布局（flex column、全屏、深色背景） | P1 |
| 2.4 | MeetingRoom 默认渲染与可覆盖性 | `components/room/index.tsx` | renderEntity/header/controller 均可定制，默认渲染 video + 标签 | P1 |

## W3：核心层补缺

| # | 任务 | 涉及文件 | 验收标准 | 优先级 |
|---|------|----------|----------|--------|
| 3.1 | `Tile.Iframe` | `components/tile/iframe.tsx` | sandbox 隔离、postMessage 通信、非可视区懒加载/暂停 | P1 |
| 3.2 | `AudioLevel` 音频电平指示器 | `components/status/` 或新目录 | AnalyserNode + rAF 驱动，条形/圆形/波形模式 | P1 |
| 3.3 | `VideoPreview` 本地预览 | `components/preview/` 或复用 prejoin | getUserMedia 预览、镜像切换、分辨率切换 | P2 |

## W4：串联与验收

| # | 任务 | 涉及文件 | 验收标准 | 优先级 |
|---|------|----------|----------|--------|
| 4.1 | Prejoin ↔ MeetingRoom 状态机串联 | `__tests__/livekit-vauid/app/page.tsx`、`app/pages/*` | 加入 → 入会 → 离开全流程可跑通 | P0 |
| 4.2 | 测试项目替换为 MeetingRoom | `__tests__/livekit-vauid/app/pages/room.tsx` | `<MeetingRoom adapter={new LiveKitAdapter(room)} roomName={...} />` 渲染正常 | P0 |
| 4.3 | 类型与构建验证 | 全局 | 组件库 tsc、docs:build、测试项目 tsc、dev server 均通过 | P0 |
| 4.4 | 自定义 adapter 文档示例 | `docs/components/meeting-room.md`（新建） | 含 LiveKitAdapter 用法与自定义 adapter 示例 | P2 |
