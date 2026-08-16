# 项目阶段规划 + MeetingRoom/RoomCtx 实现计划

## 摘要

本计划包含三部分交付物：
1. **`/spec/plan.md`**：整个 vauid-components 项目的阶段规划（初期/中期/后期），含各阶段建议工期与阶段性成果
2. **`/spec/tasks-*.md`**：基于 plan 生成的每个阶段任务清单（3 份：初期/中期/后期）
3. **`components/room/` 首版实现**：抽象 Room 接口 + LiveKit 插件 + RoomCtx 上下文 + MeetingRoom 组合组件

已确认的关键决策：
- **Room 抽象方式**：抽象接口 + 插件（组件库不依赖 livekit-client，LiveKitPlugin 实现抽象接口）
- **工期**：由我给出建议工期
- **MeetingRoom 首版范围**：本地 + 远端视频网格 + 控制栏（等价于把 livekit-vauid 测试项目的 room.tsx 能力封装进组件库）

## 当前状态分析（基于探索）

**已完成组件**（对照 [技术.md](file:///Users/shengyifei/projects/avdio/vauid-components/技术.md) 的四层体系）：
- 基础层 ✅：Button / Input(+Password/Number/TextArea) / Dropdown / Trigger / Slider / Tag
- 核心层（部分）✅：Layout（Grid/Focus/Fullscreen + Web Worker + LRU 缓存 + 动画）、Tile（Video/Audio/Note 已完成，**Iframe 未实现**）
- 功能层（部分）✅：Controller（mic/cam/screenShare/leave/participantNum）、Participant（item/name/num/avatar/role）、Status（during/focus/fullScreen/raise/network）、Prejoin
- 业务层 ⬜：`components/room/` 起步 —— `RoomHeader` 已完成（[header.tsx](file:///Users/shengyifei/projects/avdio/vauid-components/components/room/header.tsx)），但：
  - [room/index.tsx](file:///Users/shengyifei/projects/avdio/vauid-components/components/room/index.tsx) 中 `MeetingRoom` 是**空实现**，注释描述了愿景（RoomCtx + 插件接口）
  - [room/ctx/index.ts](file:///Users/shengyifei/projects/avdio/vauid-components/components/room/ctx/index.ts) 是**空文件**
- 依赖现状：组件库 package.json **不含 livekit-client**（只有测试项目 `__tests__/livekit-vauid` 有）；vite 构建 external 仅 react/react-dom
- 可参考的集成样板：`__tests__/livekit-vauid/app/pages/room.tsx`（useEngine + Layout + Controller 的完整本地/远端视频实现，已在上一轮会话完成）

## 交付物 1：`/spec/plan.md` 内容规划

在项目根新建 `spec/` 目录，写入 `plan.md`，结构如下（用中文撰写）：

### 阶段总览

| 阶段 | 建议工期 | 核心目标 |
|------|----------|----------|
| 初期 | 4 周 | 业务层首版（Room 抽象 + MeetingRoom + RoomCtx）+ 核心层补缺 |
| 中期 | 5 周 | 功能层完整化（聊天/参会者列表/设置）+ 插件生态 + Layout 高级特性 |
| 后期 | 6 周 | 业务层扩展（Classroom/LiveStream/RemoteSupport）+ 工程质量 + 发布 |

### 初期（第 1-4 周）

- **W1**：Room 抽象层
  - `RoomAdapter` 接口（connect/disconnect/on/off/设备控制/track 挂载）
  - `LiveKitAdapter` 插件（实现抽象接口，动态 import livekit-client）
  - `RoomCtx` + `useRoomCtx` + `RoomProvider`（挂载连接、卸载清理）
- **W2**：`MeetingRoom` v1 —— RoomHeader + Layout + Controller 组合，本地/远端视频绑定、实体动态增删
- **W3**：核心层补缺：`Tile.Iframe`、`AudioLevel`（音频电平指示器）、`VideoPreview`（本地摄像头预览）
- **W4**：Prejoin ↔ MeetingRoom 状态机串联；测试项目端到端替换验证；初期 tasks 验收

**阶段性成果**：`<MeetingRoom adapter={new LiveKitAdapter(room)} />` 一行接入的完整会议房间；抽象层可扩展多音视频厂商；测试项目跑通 加入→入会→离开 全流程。

### 中期（第 5-9 周）

- **W5-6**：功能层：`ChatPanel`（聊天面板，虚拟列表）、`ParticipantList`（参会者列表，虚拟滚动 + 搜索）、`ScreenShare` 完善（共享源切换 + 标注标识）
- **W7**：插件系统完善（生命周期/事件/第三方适配示例如声网）；设置面板（设备管理、主题切换、暗色模式）；Toast 通知
- **W8**：Layout 高级特性：拖拽排序、自定义布局模式（Sidebar/Custom Grid）、键盘导航（Tab/方向键）
- **W9**：性能专项：0 帧渲染验证、Worker 计算完善、LRU 缓存基准测试、弱网自适应降级

**阶段性成果**：开箱即用的标准视频会议套件（含聊天/列表/设置）；Layout 支持交互式调整；插件生态成型。

### 后期（第 10-15 周）

- **W10-11**：业务组件：`Classroom`（Layout + Whiteboard + ChatPanel）、`LiveStream`（Layout + AudioLevel + 聊天）
- **W12-13**：`RemoteSupport`（ScreenShare + MouseMapper + AnnotationLayer）；`EffectsLayer`（虚拟背景/美颜，WebGL）
- **W14**：工程质量：无障碍（键盘/aria）、CSP 安全、移动端适配；测试覆盖率（核心 >80%、UI >60%）、Benchmark
- **W15**：发布：npm 包发布流程、dumi 文档补全、CI/CD 完善、changelog

**阶段性成果**：3+ 业务场景组件就绪；测试/文档完备；可发布 v1.0。

## 交付物 2：`/spec/tasks-*.md` 内容规划

生成三份任务清单（与 plan.md 阶段一一对应）：
- `/spec/tasks-initial.md`（初期）
- `/spec/tasks-mid.md`（中期）
- `/spec/tasks-late.md`（后期）

每份清单按阶段内周次组织，每条任务包含：**任务描述 / 涉及文件 / 验收标准 / 优先级**。初期清单需与本计划第三部分（MeetingRoom 实现）逐项对齐。

## 交付物 3：MeetingRoom + RoomCtx 首版实现

### 3.1 `components/room/types.ts`（新建）—— 抽象 Room 接口

```ts
/** 参与者最小抽象（不依赖 livekit） */
export interface RoomParticipant {
  identity: string;
  name?: string;
  isLocal: boolean;
}

/** 连接参数 */
export interface ConnectOptions {
  url: string;
  token: string;
  roomName?: string;
}

/** 事件名（映射 livekit RoomEvent 的子集） */
export const RoomEvents = {
  ParticipantConnected: "participantConnected",
  ParticipantDisconnected: "participantDisconnected",
  TrackSubscribed: "trackSubscribed",
  TrackUnsubscribed: "trackUnsubscribed",
  LocalTrackPublished: "localTrackPublished",
  LocalTrackUnpublished: "localTrackUnpublished",
} as const;
export type RoomEventName = (typeof RoomEvents)[keyof typeof RoomEvents];

export interface RoomEventMap {
  participantConnected: (p: RoomParticipant) => void;
  participantDisconnected: (p: RoomParticipant) => void;
  trackSubscribed: (p: RoomParticipant) => void;
  trackUnsubscribed: (p: RoomParticipant) => void;
  localTrackPublished: () => void;
  localTrackUnpublished: () => void;
}

/** Room 适配器契约：布局/上下文层只依赖此接口，不感知具体厂商 */
export interface RoomAdapter {
  readonly kind: string;
  connect(options: ConnectOptions): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  getLocalParticipant(): RoomParticipant;
  getRemoteParticipants(): RoomParticipant[];
  isMicrophoneEnabled(): boolean;
  isCameraEnabled(): boolean;
  setMicrophoneEnabled(enabled: boolean): Promise<void>;
  setCameraEnabled(enabled: boolean): Promise<void>;
  /** 将某参与者的摄像头 track 挂载/卸载到 video 元素（不存在则忽略） */
  attachCameraTrack(identity: string, element: HTMLVideoElement): void;
  detachCameraTrack(identity: string, element: HTMLVideoElement): void;
  on<K extends RoomEventName>(event: K, handler: RoomEventMap[K]): void;
  off<K extends RoomEventName>(event: K, handler: RoomEventMap[K]): void;
}
```

### 3.2 `components/room/plugins/livekit.ts`（新建）—— LiveKitAdapter

- 使用 `import type` 引入 livekit-client 类型；运行时通过 `() => import("livekit-client")` **动态加载**（避免打进主 bundle；rollup 会拆出独立 chunk）
- 构造入参：外部已创建并连接的 `livekit-client` Room 实例（`new LiveKitAdapter(room)`），**connect 生命周期由 RoomProvider/外部管理**——首版约定 adapter 持有已连接实例，disconnect 由组件卸载触发
- 将 livekit 的 `RoomEvent.ParticipantConnected/Disconnected/TrackSubscribed/TrackUnsubscribed/LocalTrackPublished/LocalTrackUnpublished` 转译为抽象事件；`attachCameraTrack` 内部用 `getTrackPublication(Track.Source.Camera)` 取 track 并 `attach(el)`
- 依赖声明：package.json 增加 `"livekit-client"` 到 `peerDependencies`（optional 语义，文档说明）与 `devDependencies`（构建期类型解析）

### 3.3 `components/room/ctx/index.tsx`（替换现有空文件 `ctx/index.ts`）

- `RoomCtx = createContext<RoomAdapter | null>(null)`
- `RoomProvider({ adapter, children })`：挂载时 `adapter.connect(options)`（若未连接）+ 订阅事件 + 注入 context；卸载时 `off` 全部 + `disconnect()`（含容错 catch）
- `useRoomCtx(): RoomAdapter | null`：`useContext` 读取，未在 Provider 内返回 null 并 `console.warn`
- 注意：现有 [room/index.tsx](file:///Users/shengyifei/projects/avdio/vauid-components/components/room/index.tsx#L1) 没有引用 `ctx/index`，无循环引用风险；文件从 `.ts` 改为 `.tsx`

### 3.4 `components/room/hooks/useRoom.ts`（新建）—— 状态管理

把测试项目 [room.tsx](file:///Users/shengyifei/projects/avdio/vauid-components/__tests__/livekit-vauid/app/pages/room.tsx) 的逻辑抽象为 hook：
- 状态：`remotes: RoomParticipant[]`、`micOn`、`camOn`、`localVideoRef` 等
- 订阅 adapter 事件同步状态；`enableCamera/enableMicrophone` 封装（try/catch）
- 视频绑定：`setVideoRef(identity)` 回调注册到 ref map，`trackSubscribed`/`localTrackPublished` 时 `attachCameraTrack`（rAF 后执行，沿用现有 room.tsx 的时序处理）

### 3.5 `components/room/index.tsx`（重写）—— MeetingRoom

```ts
export interface MeetingRoomProps<A extends RoomAdapter = RoomAdapter>
  extends HTMLAttributes<HTMLDivElement> {
  adapter: A;                 // 房间适配器实例
  roomName?: string;          // 传给 RoomHeader
  connectOptions?: ConnectOptions; // 未连接时自动 connect
  header?: ReactNode;         // 覆盖默认 RoomHeader
  renderEntity?: (participant: RoomParticipant, node: LayoutNode) => ReactNode;
  controller?: ControllerProps;   // 透传 Controller 定制
}
```

实现要点：
- 外层 `<RoomProvider adapter>` 包裹
- 内部 `useRoom(adapter)` + `containerRef` + `useEngine`：初始 entities 为本地参与者，远端经 `engine.addEntity/delEntity` 动态增删（复用测试项目 room.tsx 已验证的模式，含"补发已存在参与者"逻辑）
- 布局：`RoomHeader`（默认含 During/Thumbnail）+ `<Layout>`（默认 renderEntity 渲染 video + 名字标签，`tileStyle` 圆角裁剪）+ `<Controller>`（默认渲染 DeviceTrigger 三件套 + Leave）
- SCSS：新增 `meeting-room` 根类（flex column、`100vh`、深色背景），沿用 [index.scss](file:///Users/shengyifei/projects/avdio/vauid-components/components/room/index.scss) 现有 `@include cmp()` 约定

### 3.6 导出与依赖

- [components/index.ts](file:///Users/shengyifei/projects/avdio/vauid-components/components/index.ts) 追加导出：`MeetingRoom`、`RoomProvider`、`useRoomCtx`、`LiveKitAdapter`，以及类型 `RoomAdapter/RoomParticipant/ConnectOptions/RoomEventName`
- `package.json`：`peerDependencies` 增 `livekit-client`；`devDependencies` 增 `livekit-client`（pnpm 安装）

### 3.7 测试项目端到端替换（验证手段）

- [livekit-vauid/app/pages/room.tsx](file:///Users/shengyifei/projects/avdio/vauid-components/__tests__/livekit-vauid/app/pages/room.tsx) 改为用 `<MeetingRoom adapter={new LiveKitAdapter(room)} roomName={roomName} />` 渲染（room 由现有 prejoin 流程创建）
- 若 tsconfig/next alias 需补充 `vauid-components/room/*` 路径，同步更新（现有 `vauid-components/*` → `../../components/*` 通配已覆盖）

## 假设与决策

1. **adapter 构造方式**：首版 `LiveKitAdapter` 接收**已连接**的 livekit Room 实例（连接逻辑仍由 Prejoin/外部负责，如测试项目 `lib/livekit.ts` 的 `connectRoom`）；`RoomProvider` 只在卸载时负责 disconnect。保持简单，避免在组件库内再造连接层。若后续需要，可在 ConnectOptions 流程中增强。
2. **livekit 动态加载**：`import type` + 运行时 `import()`，主 bundle 不包含 livekit-client；消费者需自行安装 livekit-client（peerDependency）。
3. **任务粒度**：tasks.md 按"周"组织，初期清单与 3.1-3.7 实现步骤逐项对应。
4. **不在本轮范围**：Whiteboard/AudioLevel/VideoPreview 等核心层补缺只写进 plan.md/tasks.md，不在本轮实现；MeetingRoom 高级功能（拖拽、设置面板）同理。

## 验证步骤

1. `pnpm exec tsc --noEmit`（组件库）+ `tsc -p tsconfig.app.json --noEmit` 无新增错误
2. 组件库 `pnpm docs:build` 或 dev server 正常
3. 测试项目 `pnpm exec tsc --noEmit` 通过；`next dev` 下 Prejoin → 加入 → 房间页出现本地/远端视频网格与控制栏，离开正常
4. 检查 bundle 未包含 livekit-client（vite 构建产物中 livekit 为独立 chunk 或 external）
5. 检查 `components/index.ts` 新导出在 dumi/测试项目两种导入路径下均可解析
