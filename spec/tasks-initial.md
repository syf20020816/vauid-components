# 初期任务清单（第 1-4 周）

> 对应 [plan.md](./plan.md) 初期阶段。优先级：P0=必须 / P1=重要 / P2=可选
>
> **架构调整（2026-08）**：移除 RoomAdapter/LiveKitAdapter 房间抽象层。
> 组件库不提供房间级包裹（连接/订阅由使用方自行对接音视频厂商），
> 只提供组件级能力；房间上下文（std/ctx）只维护布局引擎与使用者放入的额外数据。

## W1：RoomCtx（布局引擎上下文）

| #   | 任务                                       | 涉及文件                       | 验收标准                                                                                    | 优先级 | 状态      |
| --- | ------------------------------------------ | ------------------------------ | ------------------------------------------------------------------------------------------- | ------ | --------- |
| 1.1 | 定义 `RoomCtx` 类型（layout 引擎 + extra） | `components/std/ctx/types.ts`  | 只含布局引擎与额外数据，不含任何音视频厂商依赖                                              | P0     | ✅ 已完成 |
| 1.2 | 实现 `RoomCtxProvider` / `useRoomCtx`      | `components/std/ctx/index.tsx` | Provider 创建并持有唯一 Engine，卸载时 destroy；useRoomCtx 未在 Provider 内返回 null + warn | P0     | ✅ 已完成 |
| 1.3 | barrel 导出 Room 相关 API                  | `components/index.ts`          | MeetingRoom/RoomCtxProvider/useRoomCtx/RoomCtx 类型可导入                                   | P0     | ✅ 已完成 |
| 1.4 | 组件库去除 livekit-client 依赖             | `package.json`                 | 移除 peerDependencies/devDependencies 中的 livekit-client（厂商依赖由使用方引入）           | P0     | ✅ 已完成 |

## W2：MeetingRoom v1（组件级）

| #   | 任务                        | 涉及文件                               | 验收标准                                                                                              | 优先级 | 状态      |
| --- | --------------------------- | -------------------------------------- | ----------------------------------------------------------------------------------------------------- | ------ | --------- |
| 2.1 | 改造 `useEngine` hook       | `components/layout/hooks/useEngine.ts` | 优先消费 RoomCtx 中的共享引擎；无 Provider 时兜底自建（独立可用）；entities 变化自动 setEntities 同步 | P0     | ✅ 已完成 |
| 2.2 | 实现 `MeetingRoom` 组合组件 | `components/room/index.tsx`            | RoomCtxProvider + RoomHeader + Layout + Controller 组合；entities 驱动布局，不感知音视频厂商          | P0     | ✅ 已完成 |
| 2.3 | MeetingRoom 样式            | `components/room/index.scss`           | `@include cmp("meeting-room")` 根布局（flex column、全屏、深色背景）                                  | P1     | ✅ 已完成 |
| 2.4 | MeetingRoom 可定制性        | `components/room/index.tsx`            | renderEntity/header/controller/extra 均可定制，默认渲染名字标签                                       | P1     | ✅ 已完成 |

## W3：核心层补缺

| #   | 任务                        | 涉及文件                             | 验收标准                                            | 优先级 | 状态                                                |
| --- | --------------------------- | ------------------------------------ | --------------------------------------------------- | ------ | --------------------------------------------------- |
| 3.1 | `Tile.Iframe`               | `components/tile/iframe.tsx`         | sandbox 隔离、postMessage 通信、非可视区懒加载/暂停 | P1     | ⏳ 未完成                                           |
| 3.2 | `AudioLevel` 音频电平指示器 | `components/status/` 或新目录        | AnalyserNode + rAF 驱动，条形/圆形/波形模式         | P1     | ⏳ 未完成                                           |
| 3.3 | `VideoPreview` 本地预览     | `components/preview/` 或复用 prejoin | getUserMedia 预览、镜像切换、分辨率切换             | P2     | 🔶 部分完成（prejoin/useVideoPreview 已有基础预览） |

## W4：串联与验收

| #   | 任务                                 | 涉及文件                                              | 验收标准                                                                                          | 优先级 | 状态      |
| --- | ------------------------------------ | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------ | --------- |
| 4.1 | Prejoin ↔ MeetingRoom 状态机串联     | `__tests__/livekit-vauid/app/page.tsx`、`app/pages/*` | 加入 → 入会 → 离开全流程可跑通                                                                    | P0     | ✅ 已完成 |
| 4.2 | 测试项目以组件级方式接入 MeetingRoom | `__tests__/livekit-vauid/app/pages/room.tsx`          | 页面层直接订阅 livekit 参与者 → entities 驱动 `<MeetingRoom entities={...} renderEntity={...} />` | P0     | ✅ 已完成 |
| 4.3 | 类型与构建验证                       | 全局                                                  | 组件库 tsc、docs:build、测试项目 tsc、dev server 均通过                                           | P0     | ⏳ 待验证 |
| 4.4 | 组件级用法文档示例                   | `docs/components/meeting-room.md`（新建）             | 含 entities/renderEntity/useRoomCtx（引擎操作）用法示例                                           | P2     | ⏳ 未完成 |

## 已移除（架构调整）

| 原任务                                     | 说明                                                               |
| ------------------------------------------ | ------------------------------------------------------------------ |
| ~~RoomAdapter 抽象接口~~                   | 维护成本高、需跟随厂商 API 变动频繁更新，已放弃                    |
| ~~LiveKitAdapter 插件~~                    | 厂商对接由使用方在页面层完成（见测试项目 room.tsx）                |
| ~~RoomProvider / useRoom / room 事件转译~~ | 由 std/ctx（RoomCtxProvider/useRoomCtx）替代，只管布局引擎 + extra |
