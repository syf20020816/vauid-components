# 协作能力技术勘测报告（W10-13 前置）

> 对应 [tasks-late.md](../spec/tasks-late.md) W10-11（白板协作）与 W12-13（远程协作）。
> 结论先行：**白板同步用 Yjs（CRDT）；远程协作用注入式 Transport + RTCDataChannel 二进制控制流；统一消息 envelope**。组件库不内置任何 RTC/WS 实现，传输层由使用方注入。

## 一、范围调整（已确认）

- **10.1 Classroom / 10.2 LiveStream 移除**：属业务层组合，非组件库职责
- 保留：10.3 白板协作、12.1-12.3 远程支持/鼠标映射/标注层
- 暂不处理：12.4 特效层、W14、W15

## 二、现状勘察

### 白板（components/whiteboard/，已存在）

| 项 | 现状 |
|---|---|
| 渲染 | react-konva（konva ^10.3.2）Canvas |
| 数据模型 | 纯 JSON 形状：`PenShape` / `RectShape` / `EllipseShape` / `ArrowShape` / `TextShape`（types.ts） |
| 历史 | 本地历史栈：`pushHistory` / `undo` / `redo` / `clear` |
| 导出 | `onShapesChange` 全量回调 |
| 同步 | **无任何协作/同步痕迹** |

### 传输层（从零开始）

- `package.json` **零传输依赖**：无 livekit-client、无 yjs、无 socket.io（仅 UI 依赖）
- RoomCtx / std 无连接、信令、DataChannel、消息收发抽象
- `remote-support/`、`effects/` 目录不存在

**结论**：协作传输完全从零建；按组件库定位（不做服务端），传输层必须设计为**使用方注入**。

## 三、选型结论

### 3.1 白板多人同步 → Yjs（CRDT）

| 候选 | 判定 | 理由 |
|---|---|---|
| **Yjs** | **采用** | core ~13KB gzip + provider ~7KB；update 是与传输无关的二进制流（可塞进任何通道）；awareness 协议现成传光标/选区；`y-indexeddb` 离线恢复原生支持 |
| ShareDB (OT) | 排除 | 强依赖 Node 服务端，更新缓慢 |
| 自研 LWW（追加笔画 + 最后写赢） | 排除 | excalidraw 验证过可行，但断线补发/离线恢复/undo 冲突全要自建，省下 ~20KB 被 these 成本吃掉 |

业界对照：tldraw 自研 server-authoritative 协议（需要中心服务端）、excalidraw 自研 LWW、liveblocks 托管收费——均不符合"组件库 + 传输注入"定位。

**关键改造点**：白板数据模型迁 `Y.Array<Shape>`；`undo/redo` 用 `Y.UndoManager` 替换现有本地历史栈（协作场景下本地栈语义不成立）；光标/选区走 awareness。

### 3.2 远程协作传输 → 注入式 Transport + DataChannel 控制流

- **鼠标映射**：RTCDataChannel **unreliable + latest-wins**（move 事件 ~60Hz 可丢帧，只发最新值）；click/键盘走 **reliable-ordered**；**二进制**（定长帧）优于 JSON（省解析、带宽可预期）。业界远程桌面均"输入走独立 DataChannel，不进视频流"（IETF 用例清单明确含 co-browsing/远程键鼠）。
- **白板 CRDT update**：reliable-ordered 通道透传 Yjs 二进制 update。
- **房间状态 / presence**：WebSocket 或 reliable DataChannel（使用方选择）。
- **混合架构**（控制流 unreliable DC + 状态流 reliable 通道）是游戏联网/远程桌面业界常见做法。
- **y-webrtc 不引入**：需要自建信令 + STUN/TURN，且 P2P 拓扑与会议房间的服务器中转模型不匹配；Yjs update 桥接到自有 Transport 只需薄适配层。

### 3.3 统一消息协议 → 要，做一层 envelope

多业务（Yjs update / 指针 / 标注 / 房间状态）复用同一通道的前提。参考：

- **y-protocols**：`varUint(messageType) + payload`，单 envelope 多路复用子协议（0=sync、1=awareness，更高留给应用）——二进制 envelope 的最佳范本
- **tldraw sync**：JSON `{type, payload}`，`push_result` 做 ack，`serverClock` 支持断线增量重连，presence 独立不落盘

**设计**：控制流二进制（`type:varUint + seq:varUint + ts + payload`），状态流 JSON（`{v, t, roomId, seq, ts, payload}`）；类型分段：0=yjs-update、1=pointer、2=annotation、3=awareness、4+=room/扩展。seq/ack 支撑断线检测与重连续传。

## 四、落地架构

```
┌ Whiteboard（协作化）────────┐  ┌ RemoteSupport / MouseMapper / AnnotationLayer ┐
│ Y.Array<Shape> + UndoManager │  │ PointerEvent 捕获 / 坐标归一化 / Canvas 叠加    │
│ awareness 光标/选区          │  │ 撤销/清除（reliable 事件）                     │
└──────────┬─────────────────┘  └──────────────┬───────────────────────────────┘
           │ yjs-update（二进制，reliable）      │ pointer（unreliable 二进制帧）
           │                                    │ annotation/click（reliable）
           ▼                                    ▼
     ┌──────────── CollabTransport（组件库定义的注入接口）────────────┐
     │ send(envelope, {reliable}) / onMessage / presence() / close() │
     └─────────────────────────────────────────────────────────────┘
        使用方实现：livekit-client DC / 裸 WebRTC / WebSocket / 测试内存通道
```

新增目录 `components/collab/`：transport 接口 + envelope 编解码 + Yjs 通道适配（桥 doc update/awareness 到 Transport，替代 y-webrtc/websocket 自建 provider）。

## 五、建议任务分解

**W10-11 白板协作（P0）**
1. `collab/types.ts` + `collab/envelope.ts`：Transport 接口、消息类型枚举、二进制/JSON 编解码、seq/ack
2. `collab/yjs.ts`：Yjs ↔ Transport 桥（update 收发 + awareness），先 reliable-only 最小版
3. `whiteboard/` 协作化：Y.Array 迁移、UndoManager 替换本地历史、远程光标渲染、`provider` prop 注入
4. 测试：内存 Transport 单测（本地双端同步、断线补发、undo 合并）

**W12-13 远程支持（P1）**
5. `remote-support/mouse.tsx`：PointerEvent 捕获、0-1 归一化坐标、unreliable 帧发送（节流 latest-wins）
6. `remote-support/annotation.tsx`：Canvas 叠加、操作事件 reliable 通道、撤销/清除
7. `remote-support/index.tsx`：ScreenShare + MouseMapper + Annotation 组合（对应 12.1）
8. 测试：帧编解码 roundtrip、坐标归一化边界

## 六、风险与决策点

| 项 | 说明 | 建议 |
|---|---|---|
| Yjs 依赖引入 | +20KB gzip | 接受（自研成本更高）；按需 dynamic import 可后续做 |
| 白板历史栈重构 | UndoManager 语义与现有 pushHistory 不同（跨端合并），是 10.3 最大改造量 | 单独提交，保留非协作模式回退（不传 provider 时行为不变） |
| dumi 环境二进制兼容 | Uint8Array/Blob 在 dumi 构建下需验证 | envelope 编解码纯手写 varUint，不依赖 Buffer |
| Transport 最小集 | 先 reliable-only 还是直接双通道 | 先 reliable-only 跑通白板，指针场景再加 unreliable 通道 |
