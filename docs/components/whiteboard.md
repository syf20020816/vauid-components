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
| `onShapesChange` | `(shapes) => void`   | -                                 | 图形集合变化回调（可用于持久化，绘制中高频触发）  |
| `onCollapsed`    | `(collapsed) => void`| -                                 | 工具栏收缩/展开回调                               |

### WhiteboardTool

单独使用的工具栏（无画布），支持受控/非受控，需配合 `showTool={false}` 的自定义工具条场景。

| 属性             | 类型               | 默认值        | 说明                        |
| ---------------- | ------------------ | ------------- | --------------------------- |
| `position`       | `PositionType`     | `"bottom-center"` | 工具栏位置              |
| `direction`      | `DirectionType`    | `"horizontal"` | 工具栏方向                |
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