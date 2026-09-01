export const Position = {
  LeftTop: "left-top",
  LeftCenter: "left-center",
  LeftBottom: "left-bottom",
  RightTop: "right-top",
  RightCenter: "right-center",
  RightBottom: "right-bottom",
  TopCenter: "top-center",
  BottomCenter: "bottom-center",
};

export type PositionType = (typeof Position)[keyof typeof Position];

/** 工具栏方向：纵向（垂直堆叠）/ 横向（水平排列，默认） */
export const Direction = {
  Vertical: "vertical",
  Horizontal: "horizontal",
} as const;

export type DirectionType = (typeof Direction)[keyof typeof Direction];

/** 笔类型 */
export const PenType = {
  Pen: "pen",
  Brush: "brush",
  Pencil: "pencil",
} as const;

export type PenTypeValue = (typeof PenType)[keyof typeof PenType];

/** 形状类型 */
export const ShapeType = {
  Square: "square",
  Circle: "circle",
  Arrow: "arrow",
} as const;

export type ShapeTypeValue = (typeof ShapeType)[keyof typeof ShapeType];

/** 画板工具（互斥选中） */
export const Tool = {
  Pen: "pen",
  Eraser: "eraser",
  Shape: "shape",
  Text: "text",
} as const;

export type ToolValue = (typeof Tool)[keyof typeof Tool];
