---
title: RemoteSupport 远程支持
order: 19
---

# RemoteSupport 远程支持

面向远程协助场景的叠加层组件组：在被共享画面（如屏幕共享 `<video>`）上叠加**远程指针映射**与**协作标注**。包含三个组件：

- `RemoteSupport`：组合模板（children + 标注层 + 指针层叠放）
- `MouseMapper`：鼠标映射，双角色（capture 捕获外发 / display 展示远端指针）
- `AnnotationLayer`：Canvas 2D 标注层（笔 / 矩形 / 椭圆 / 箭头 / 橡皮 + 撤销重做，协作走 Yjs）；工具栏直接复用白板的 `WhiteboardTool`——标注层可以理解为叠在画面上的「透明白板」

传输层由使用方注入：标注数据复用 `collab` 基座的 `createYjsBridge`（Yjs update 走 reliable）；指针帧直走 `CollabTransport` 的 Pointer envelope **不经 Yjs**（瞬时控制流，move 帧走 unreliable 可丢帧通道）。

## 组合用法（双端）

下方 demo 用内存双端通道本地模拟「控制端 → 演示端」：左侧移动 / 点击 / 滚轮，右侧远端光标实时跟随并打印收到的可靠动作；两侧标注（同 doc）实时互通，均可用工具栏绘制。

```tsx
import { useEffect, useMemo, useState } from "react";
import * as Y from "yjs";
import { Awareness } from "y-protocols/awareness";
import {
  RemoteSupport,
  createMemoryTransportPair,
  createYjsBridge,
  type CollabTransport,
  type PointerAction,
} from "vauid-components";

/** 模拟画面：四个色块（实际使用时替换为 <video> 等共享内容） */
const Screen = () => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      padding: 8,
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gridTemplateRows: "1fr 1fr",
      gap: 8,
    }}
  >
    {["#2563eb", "#7c3aed", "#0d9488", "#b45309"].map((color) => (
      <div key={color} style={{ background: color, borderRadius: 8, opacity: 0.72 }} />
    ))}
  </div>
);

/** 单个端：doc / awareness / 桥随端创建与销毁，引用全程稳定 */
function Peer({
  name,
  role,
  transport,
}: {
  name: string;
  role: "capture" | "display";
  transport: CollabTransport;
}) {
  // doc / awareness 引用必须保持稳定（挂载后不变），统一 useMemo 持有
  const collab = useMemo(() => {
    const doc = new Y.Doc();
    return { doc, awareness: new Awareness(doc) };
  }, []);
  // 双端共用同一份标注数据：各端把 doc 桥接到自己的 transport
  useEffect(() => {
    const bridge = createYjsBridge(collab.doc, transport, { awareness: collab.awareness });
    return () => {
      bridge.destroy();
      collab.awareness.destroy();
    };
  }, [collab, transport]);

  // display 端：收到的可靠指针动作（使用方决定是否真实执行）
  const [lastAction, setLastAction] = useState("（暂无）");
  const onAction = (action: PointerAction) => {
    setLastAction(`${action.kind} @ (${action.x.toFixed(2)}, ${action.y.toFixed(2)})`);
  };

  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ position: "relative", height: 320, border: "1px solid #333", borderRadius: 8, overflow: "hidden" }}>
        <RemoteSupport
          annotations={{ doc: collab.doc, awareness: collab.awareness, name }}
          pointer={{ transport, role, name, onAction: role === "display" ? onAction : undefined }}
        >
          <Screen />
        </RemoteSupport>
      </div>
      <p style={{ margin: "8px 0 0", fontSize: 12, color: "#999" }}>
        {name}（{role}）最近动作：{lastAction}
      </p>
    </div>
  );
}

export default () => {
  // 内存双端通道（仅演示）；真实项目换成 WebSocket / RTCDataChannel 实现的 CollabTransport
  const [pair] = useState(createMemoryTransportPair);
  return (
    <div style={{ display: "flex", gap: 16 }}>
      <Peer name="控制端" role="capture" transport={pair[0]} />
      <Peer name="演示端" role="display" transport={pair[1]} />
    </div>
  );
};
```

## 单独使用 MouseMapper

`MouseMapper` 可脱离组合模板独立叠放在任意容器上（根元素 `absolute inset-0`，容器需 `position: relative`）。下方 demo 用一条内存通道让 capture 与 display 互通——容器内移动指针，光标即被「远端」实时映射。

```tsx
import { useState } from "react";
import { MouseMapper, createMemoryTransportPair } from "vauid-components";

export default () => {
  const [pair] = useState(createMemoryTransportPair);
  return (
    <div
      style={{
        position: "relative",
        height: 200,
        background: "#1a1a1d",
        borderRadius: 8,
        overflow: "hidden",
      }}
    >
      <MouseMapper transport={pair[0]} role="capture" />
      <MouseMapper transport={pair[1]} role="display" name="控制端" />
    </div>
  );
};
```

## 单独使用 AnnotationLayer

不传 `doc` 即本地模式（行为不变的单机标注，本地历史栈）；传 `doc` 进入协作模式（`Y.Array<Annotation>` + `Y.UndoManager`）。

```tsx
import { AnnotationLayer } from "vauid-components";

export default () => (
  <div style={{ position: "relative", height: 240, border: "1px solid #333", borderRadius: 8 }}>
    <AnnotationLayer color="#ff4d4f" />
  </div>
);
```

## API

### RemoteSupport

| 属性          | 类型                                                                     | 默认值 | 说明                                                                 |
| ------------- | ------------------------------------------------------------------------ | ------ | -------------------------------------------------------------------- |
| `children`    | `ReactNode`                                                              | -      | 被叠加的内容（如屏幕共享 `<video>` 画面）                             |
| `annotations` | `{ doc?, awareness?, name? }`                                            | -      | 标注层配置（不传则无标注层）；doc / awareness 引用需稳定（建议 useMemo） |
| `pointer`     | `{ transport, role: "capture" \| "display", onAction?, name? }`          | -      | 指针层配置（不传则无指针层）                                          |
| `className`   | `string`                                                                 | -      | 根元素附加类名                                                        |

### MouseMapper

| 属性        | 类型                                 | 默认值 | 说明                                                                          |
| ----------- | ------------------------------------ | ------ | ----------------------------------------------------------------------------- |
| `transport` | `CollabTransport`                    | -      | 协作传输注入接口                                                               |
| `role`      | `"capture"` \| `"display"`           | -      | capture：捕获本端指针并外发；display：显示远端指针 + 接收可靠动作回调           |
| `onAction`  | `(action: PointerAction) => void`    | -      | display 模式：可靠指针动作回调（使用方决定是否真实执行，组件库不注入输入）       |
| `name`      | `string`                             | -      | display 模式：远端指针名牌文字（capture 端名字）                                |
| `className` | `string`                             | -      | 根元素附加类名                                                                 |

### AnnotationLayer

工具为白板 `ToolValue` 枚举（`pen` / `shape` / `eraser`），工具栏复用 `WhiteboardTool`（见 [WhiteboardTool](/components/whiteboard)）并裁剪掉文字工具。

| 属性                 | 类型                            | 默认值     | 说明                                                          |
| ------------------- | ------------------------------- | ---------- | ------------------------------------------------------------- |
| `doc`               | `Y.Doc`                         | -          | 不传 = 本地模式；传入即协作模式（引用需稳定）                  |
| `awareness`         | `Awareness`                     | -          | 协作 awareness（远程光标 presence），不传则无光标同步          |
| `name`              | `string`                        | -          | 本端用户名（随光标广播 + 写入新标注的 `author`）               |
| `tool`              | `ToolValue`                     | -          | 当前工具（受控模式）：`pen` / `shape` / `eraser`               |
| `defaultTool`       | `ToolValue`                     | `"pen"`    | 非受控模式的初始工具                                          |
| `onToolChange`      | `(tool: ToolValue) => void`     | -          | 工具切换回调                                                  |
| `shapeType`         | `ShapeTypeValue`                | -          | 形状工具的当前形状（受控）：`square`→矩形 / `circle`→椭圆 / `arrow`→箭头 |
| `defaultShapeType`  | `ShapeTypeValue`                | `"square"` | 非受控模式的初始形状                                          |
| `onShapeTypeChange` | `(shapeType) => void`           | -          | 形状切换回调                                                  |
| `lineSize`          | `number`                        | -          | 线宽（受控，1-10，写入标注 `size`）                            |
| `defaultLineSize`   | `number`                        | `3`        | 非受控模式的初始线宽                                          |
| `onLineSizeChange`  | `(lineSize) => void`            | -          | 线宽变更回调                                                  |
| `color`             | `string`                        | `"#ff4d4f"`| 标注颜色（WhiteboardTool 无颜色选择，改色由此 prop 控制）       |
| `showToolbar`       | `boolean`                       | `true`     | 是否显示内置工具栏（复用 WhiteboardTool）                      |
| `toolbarPosition`   | `PositionType`                  | `"right-top"` | 工具栏位置，见白板 [Position](/components/whiteboard)       |
| `toolbarDirection`  | `DirectionType`                 | `"horizontal"` | 工具栏方向                                                |
| `toolbarContainer`  | `Element` \| `DocumentFragment` | 标注层根元素 | 工具栏渲染容器（默认 portal 进根元素，absolute 定位）          |
| `className`         | `string`                        | -          | 根元素附加类名                                                |

## 指针协议（不经 Yjs）

move 与 action 都走 `CollabTransport` 的 Pointer envelope（`t === CollabMessageTypes.Pointer`），但通道语义不同：

- **move 帧**：定长二进制 `[x: f32 LE][y: f32 LE][buttons: u8]`，坐标 0-1 归一化，`reliable=false` 发送；capture 端 rAF 对齐 latest-wins 节流（每渲染帧最多一帧，~60Hz 只发最新值），display 端收即覆盖。帧编解码/节流/归一化均为导出的纯函数（`encodePointerMove` / `decodePointerMove` / `createMoveThrottle` / `normalizePoint`），可独立测试与复用
- **action 帧**：JSON 负载 `{ kind, button, x, y, deltaX?, deltaY? }`，`reliable=true` 发送；`kind` 为 `click` / `down` / `up` / `wheel` / `leave`（leave 表示指针离开 capture 区域，display 端据此隐藏光标）

真实接入示例（传输层自行实现 `CollabTransport` 接口）：

```ts
import * as Y from "yjs";
import { createYjsBridge, type CollabTransport } from "vauid-components";

declare const doc: Y.Doc;
declare const myTransport: CollabTransport; // WebSocket / RTCDataChannel 等实现

// 标注数据：一行桥接，Yjs update / awareness 经 transport 的 reliable 通道同步
const bridge = createYjsBridge(doc, myTransport);

// 指针帧无需额外接入：MouseMapper 内部直发 Pointer envelope。
// 使用方在 CollabTransport 实现内把 reliable=false 的信封映射到
// RTCDataChannel 的 unreliable（maxRetransmits: 0）通道即可：
//
//   send(envelope, { reliable }) {
//     reliable ? reliableDc.send(JSON.stringify(envelope))
//              : unreliableDc.send(encodeEnvelope(envelope));
//   }
```

## 标注数据模型（Yjs）

标注存于 `doc.getArray<Annotation>("annotations")`，与白板同构（整对象 delete+insert 更新，按 id 定位）：

| 字段     | 类型                                       | 说明                                       |
| -------- | ------------------------------------------ | ------------------------------------------ |
| `id`     | `string`                                   | `vauid-rs-*` 前缀自增 id                    |
| `type`   | `"pen"` \| `"rect"` \| `"ellipse"` \| `"arrow"` | 标注类型                                |
| `points` | `{ x, y }[]`                               | 0-1 归一化坐标；rect/ellipse/arrow 取首尾两点，pen 为轨迹 |
| `color`  | `string`                                   | 颜色（创建时快照）                          |
| `size`   | `number`                                   | 线宽（px）                                  |
| `author` | `string?`                                  | 作者（AnnotationLayer 的 `name` prop）      |

注意事项：

- 协作模式下撤销/重做走 `Y.UndoManager`（一笔标注合并为一个撤销项，只回退本端事务）；清空 = 删除全部，可撤销
- `doc` / `awareness` 需保持稳定引用（建议 `useMemo`），组件不做运行时热切换
- 「入会即有历史标注」的场景，由使用方建桥后先发送一次 `Y.encodeStateAsUpdate(doc)` 全量帧
- display 端 `onAction` 只做回调不注入真实输入（组件库不代替使用方控制远端）
