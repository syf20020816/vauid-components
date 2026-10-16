import type { Awareness } from "y-protocols/awareness";
import type { Doc } from "yjs";

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

/**
 * # 白板图形数据模型
 * 纯 JSON 描述（不依赖 Konva 节点），可序列化持久化，
 * 渲染层（react-konva）根据 type 映射为对应 Konva 图元。
 */
export interface BaseShape {
  id: string;
  /** 描边/文字颜色（创建时的快照，后续改色不影响已有图形） */
  color: string;
  /** 创建时的线条粗细快照 */
  size: number;
}

/** 笔迹（points 为扁平坐标 [x1,y1,x2,y2,...]） */
export interface PenShape extends BaseShape {
  type: "pen";
  penType: PenTypeValue;
  points: number[];
}

/** 矩形（x/y 为左上角） */
export interface RectShape extends BaseShape {
  type: "rect";
  x: number;
  y: number;
  width: number;
  height: number;
}

/** 椭圆（x/y 为圆心） */
export interface EllipseShape extends BaseShape {
  type: "ellipse";
  x: number;
  y: number;
  radiusX: number;
  radiusY: number;
}

/** 箭头（points 为 [起点x, 起点y, 终点x, 终点y]） */
export interface ArrowShape extends BaseShape {
  type: "arrow";
  points: [number, number, number, number];
}

/** 文本（x/y 为左上角） */
export interface TextShape extends BaseShape {
  type: "text";
  x: number;
  y: number;
  text: string;
}

export type WhiteboardShape =
  | PenShape
  | RectShape
  | EllipseShape
  | ArrowShape
  | TextShape;

/**
 * # 白板协作配置（传入 Whiteboard 的 collab prop 即进入协作模式）
 * 组件只依赖 Y.Doc + Awareness，不感知传输层——transport 由使用方在 doc 外
 * 通过 collab/createYjsBridge 自行桥接（保持 UI 与传输解耦）。
 * doc / awareness 需保持稳定引用（建议 useMemo），组件不做运行时热切换。
 */
export interface WhiteboardCollabProps {
  /** 协作文档（形状存于 Y.Array<WhiteboardShape>，key 为 "shapes"） */
  doc: Doc;
  /** 可选 awareness（远程光标 presence），不传则无光标同步 */
  awareness?: Awareness;
  /** 本端用户名（随光标广播，显示在远端光标名牌上） */
  name?: string;
}
