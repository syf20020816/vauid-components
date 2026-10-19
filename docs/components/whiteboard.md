---
title: Whiteboard 白板
order: 18
---

# Whiteboard 白板

基于 react-konva 的画布白板，内置工具栏，支持笔、橡皮、形状、文本绘制，以及撤销/重做/清空。

## 基础用法

`Whiteboard` 默认自带深色画布（跟随主题）和底部居中的工具栏，容器需给定尺寸。

```tsx
import { Whiteboard } from "vauid-components";

export default () => (
  <div style={{ height: "50vh", width: "100%" }}>
    <Whiteboard />
  </div>
);
```

## 功能特性

- **笔**：钢笔（实线）/ 水笔（粗软）/ 铅笔（细淡）
- **形状**：方形 / 圆形 / 箭头，按住拖拽拉伸
- **橡皮**：点击或划过删除图形
- **文本**：点击画布进入编辑，Enter 提交、Shift+Enter 换行、Esc 取消
- **撤销 / 重做 / 清空**：工具栏底部按钮
- **收缩**：点击顶部箭头收缩为图标（画布进入只读），再点展开
- **持久化**：图形为纯 JSON 模型，通过 `onShapesChange` 导出

```tsx
import { useMemo, useState } from "react";
import { Whiteboard } from "vauid-components";

export default () => {
  const [shapes, setShapes] = useState([]);
  return (
    <div style={{ height: "50vh", width: "100%" }}>
      <Whiteboard
        color="#ffffff"
        background="#111113"
        onShapesChange={setShapes}
        toolContainer="self"
      />
    </div>
  );
};
```

## API

### Whiteboard

| 属性             | 类型                 | 默认值                            | 说明                                             |
| ---------------- | -------------------- | --------------------------------- | ------------------------------------------------ |
| `color`          | `string`             | `"#ffffff"`                       | 笔/形状描边、文字颜色                             |
| `background`     | `string`             | `var(--vauid-color-bg-secondary)` | 画布背景色（任意 CSS 色值）                       |
| `position`       | `PositionType`       | `"bottom-center"`                 | 工具栏位置，见 [Position](#position)               |
| `direction`      | `DirectionType`      | `"horizontal"`                    | 工具栏方向，`horizontal` / `vertical`             |
| `iconSize`       | `number` \| `string` | `16`                              | 工具栏图标尺寸                                    |
| `showTool`       | `boolean`            | `true`                            | 是否显示内置工具栏（配合单独使用 WhiteboardTool） |
| `toolContainer`  | `Element` \| `DocumentFragment` \| `"self"` | 白板自身    | 工具栏渲染容器；默认挂白板自身（absolute）；传 `document.body` 时 fixed 定位（多实例会重叠，不推荐） |
| `onShapesChange` | `(shapes) => void`   | -                                 | 图形集合变化回调（可用于持久化，绘制中高频触发）  |
| `onCollapsed`    | `(collapsed) => void`| -                                 | 工具栏收缩/展开回调                               |
| `collab`         | `WhiteboardCollabProps` | -                              | 协作配置（传入即进入协作模式），见 [多人协作](#多人协作) |

### WhiteboardTool

单独使用的工具栏（无画布），支持受控/非受控，需配合 `showTool={false}` 的自定义工具条场景。

| 属性             | 类型               | 默认值        | 说明                        |
| ---------------- | ------------------ | ------------- | --------------------------- |
| `position`       | `PositionType`     | `"bottom-center"` | 工具栏位置              |
| `direction`      | `DirectionType`    | `"horizontal"` | 工具栏方向                |
| `tools`          | `ToolValue[]`      | 全部          | 可见工具集合（能力裁剪口）：不在集合内的工具按钮不渲染，如标注层传 `[Tool.Pen, Tool.Shape, Tool.Eraser]` 隐藏文字 |
| `container`      | `Element` \| `DocumentFragment` | `document.body` | 渲染容器（body 时 fixed 定位；挂容器内建议配合 `vauid-whiteboard-tool-self` 类切 absolute） |
| `iconSize`       | `number`\|`string` | `16`          | 图标尺寸                    |
| `tool`           | `ToolValue`        | -             | 当前工具（受控），见 [Tool](#tool) |
| `onToolChange`   | `(tool) => void`   | -             | 工具切换回调                  |
| `penType`        | `PenTypeValue`     | -             | 当前笔类型（受控）           |
| `onPenTypeChange`| `(penType) => void`| -             | 笔类型切换回调                |
| `shapeType`      | `ShapeTypeValue`   | -             | 当前形状类型（受控）         |
| `onShapeTypeChange` | `(shapeType) => void` | -        | 形状切换回调               |
| `lineSize`       | `number`           | -             | 线条粗细（受控）             |
| `onLineSizeChange` | `(lineSize) => void` | -          | 粗细变更回调                 |
| `onUndo` / `onRedo` / `onClear` | `() => void` | - | 撤销/重做/清空            |
| `onCollapsed`    | `(collapsed) => void` | -           | 收缩/展开回调                |

## 多人协作

传入 `collab` prop 即进入协作模式（不传时行为与单机完全一致）。组件只依赖 `Y.Doc` + `Awareness`，**不感知传输层**——transport 由使用方在 doc 外通过 `createYjsBridge` 桥接到任意 `CollabTransport`（WebSocket / RTCDataChannel / 内存通道等），保持 UI 与传输解耦。

协作模式下的行为差异：

- 形状以 doc 内 `Y.Array<WhiteboardShape>`（key 为 `"shapes"`）为数据源，仍是纯 JSON 模型（`WhiteboardShape`），与单机模型一致
- **撤销/重做**走 `Y.UndoManager`：只回退本端事务（远端形状不受影响），一笔画内的连续更新合并为一个撤销项；**清空** = 删除全部形状，可撤销
- `onShapesChange` 依旧全量快照回调（本地或远端任何形状变化都触发），持久化 API 不变
- 传入 `awareness` 时同步**远程光标**：本端 pointermove 以 0-1 归一化坐标上报（约 20Hz 节流），远端渲染箭头点 + 用户名名牌

下方 demo 用内存双端通道本地模拟两个协作端：在任一白板绘制，另一端实时同步；移动指针可见对端光标与名牌。

```tsx
import { useEffect, useMemo, useState } from "react";
import * as Y from "yjs";
import { Awareness } from "y-protocols/awareness";
import {
  Whiteboard,
  createMemoryTransportPair,
  createYjsBridge,
  type CollabTransport,
} from "vauid-components";

/** 单个协作端：doc / awareness / 桥均随端创建与销毁 */
function CollabPeer({
  name,
  color,
  transport,
}: {
  name: string;
  color: string;
  transport: CollabTransport;
}) {
  // doc / awareness 引用必须保持稳定（挂载后不变），统一 useMemo 持有
  const collab = useMemo(() => {
    const doc = new Y.Doc();
    return { doc, awareness: new Awareness(doc), name };
  }, [name]);

  // 使用方自行把 doc 桥接到传输层（Whiteboard 不感知 transport）
  useEffect(() => {
    const bridge = createYjsBridge(collab.doc, transport, {
      awareness: collab.awareness,
    });
    return () => {
      bridge.destroy();
      collab.awareness.destroy();
    };
  }, [collab, transport]);

  return (
    <div style={{ flex: 1, display: "flex" }}>
      <Whiteboard color={color} collab={collab} />
    </div>
  );
}

export default () => {
  // 内存双端通道（仅演示）；真实项目换成 WebSocket / RTCDataChannel 实现的 CollabTransport
  const [pair] = useState(createMemoryTransportPair);
  return (
    <div style={{ display: "flex", gap: 16, height: "60vh" }}>
      <CollabPeer name="用户 A" color="#f59e0b" transport={pair[0]} />
      <CollabPeer name="用户 B" color="#10b981" transport={pair[1]} />
    </div>
  );
};
```

真实项目中的接入方式（传输层自行实现 `CollabTransport` 接口后一行桥接）：

```ts
import * as Y from "yjs";
import type { Awareness } from "y-protocols/awareness";
import { createYjsBridge, type CollabTransport } from "vauid-components";

declare const doc: Y.Doc;
declare const awareness: Awareness;
declare const myTransport: CollabTransport; // WebSocket / RTCDataChannel 等实现

// 把 doc 增量 update 与 awareness presence 桥接到自有传输通道
const bridge = createYjsBridge(doc, myTransport, { awareness });

// 断开 / 卸载时销毁桥（只拆监听与订阅，不关闭 transport 本身）
bridge.destroy();
```

注意事项：

- `doc` / `awareness` 需保持稳定引用（建议 `useMemo`），组件不做运行时热切换
- `awareness` 实例生命周期归使用方管理（组件卸载时只清空本端 `cursor` 字段）
- 「入会即有历史内容」的场景，由使用方在建桥后先发送一次 `Y.encodeStateAsUpdate(doc)` 全量帧（增量桥不做握手同步）

## 常量

### Position

工具栏锚定位置，支持 8 个方向：`left-top` `left-center` `left-bottom` `right-top` `right-center` `right-bottom` `top-center` `bottom-center`。

### Tool

工具枚举：`pen` `eraser` `shape` `text`。

### PenType

笔类型：`pen`（钢笔）`brush`（水笔）`pencil`（铅笔）。

### ShapeType

形状类型：`square` `circle` `arrow`。

## 数据模型

图形是纯 JSON 描述（不依赖 Konva 节点），可序列化持久化，由 `onShapesChange` 导出的数组即 `WhiteboardShape[]`：

| 类型       | `type`    | 附加字段                                  |
| ---------- | --------- | ----------------------------------------- |
| 笔迹       | `pen`     | `penType`、`points: number[]`（扁平坐标）  |
| 矩形       | `rect`    | `x` `y` `width` `height`                 |
| 圆形       | `ellipse` | `x` `y`（圆心）`radiusX` `radiusY`        |
| 箭头       | `arrow`   | `points: [x1,y1,x2,y2]`                  |
| 文本       | `text`    | `x` `y` `text`                           |

所有图形共享 `id` `color` `size` 基础字段（颜色与粗细为创建时快照）。