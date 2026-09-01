import {
  ArrowUpRight,
  Brush,
  ChevronUp,
  Circle,
  Eraser,
  Pen,
  Pencil,
  Redo,
  Square,
  Trash,
  Type,
  Undo,
} from "lucide-react";
import { useState, type CSSProperties, type HTMLAttributes } from "react";
import { createPortal } from "react-dom";
import { Button } from "vauid-components/button";
import { useCls } from "vauid-components/std/hooks/cls";
import "./index.scss";
import {
  Direction,
  PenType,
  Position,
  ShapeType,
  Tool,
  type DirectionType,
  type PenTypeValue,
  type PositionType,
  type ShapeTypeValue,
  type ToolValue,
} from "./types";
import { Slider } from "vauid-components/slider";
import { Trigger } from "vauid-components/trigger";

export interface WhiteboardToolProps extends HTMLAttributes<HTMLDivElement> {
  container?: Element | DocumentFragment;
  position?: PositionType;
  /** 工具栏方向：横向（默认）/ 纵向 */
  direction?: DirectionType;
  iconSize?: number | string;
  /** 线条粗细（受控模式），不传则使用内部状态 */
  lineSize?: number;
  onLineSizeChange?: (lineSize: number) => void;
  /** 当前选中工具（受控模式），不传则使用内部状态 */
  tool?: ToolValue;
  onToolChange?: (tool: ToolValue) => void;
  /** 当前笔类型（受控模式），不传则使用内部状态 */
  penType?: PenTypeValue;
  onPenTypeChange?: (penType: PenTypeValue) => void;
  /** 当前形状类型（受控模式），不传则使用内部状态 */
  shapeType?: ShapeTypeValue;
  onShapeTypeChange?: (shapeType: ShapeTypeValue) => void;
  /** 收缩/展开回调 */
  onCollapsed?: (collapsed: boolean) => void;
  /** 撤销（由画布实现历史栈） */
  onUndo?: () => void;
  /** 重做 */
  onRedo?: () => void;
  /** 清空画布 */
  onClear?: () => void;
  offset?: {
    top: CSSProperties["top"];
    left: CSSProperties["left"];
    right?: CSSProperties["right"];
    bottom?: CSSProperties["bottom"];
  };
}

/** 笔类型 → 图标 */
const PEN_ICONS = {
  [PenType.Pen]: Pen,
  [PenType.Brush]: Brush,
  [PenType.Pencil]: Pencil,
} as const;

/** 形状类型 → 图标 */
const SHAPE_ICONS = {
  [ShapeType.Square]: Square,
  [ShapeType.Circle]: Circle,
  [ShapeType.Arrow]: ArrowUpRight,
} as const;

/**
 * 收缩箭头的基础旋转角（ChevronUp 默认朝上，顺时针为正）：
 * - 横向：left* 往左、right* 往右、top-center 往上、bottom-center 往下
 * - 纵向：top* 往上、bottom* 往下、left-center 往左、right-center 往右
 */
const getChevronRotate = (
  direction: DirectionType,
  position: PositionType,
): number => {
  const [edge, align] = position.split("-");
  if (direction === Direction.Horizontal) {
    // 横向：左右边缘的锚点指向对应侧，居中锚点指上下
    if (edge === "left") return -90;
    if (edge === "right") return 90;
    return align === "top" ? 0 : 180;
  }
  // 纵向：上下边缘的锚点指上下，居中锚点指左右
  if (edge === "top") return 0;
  if (edge === "bottom") return 180;
  return align === "left" ? -90 : 90;
};

export const WhiteboardTool = ({
  container,
  className,
  direction = Direction.Horizontal,
  iconSize = 16,
  offset,
  position = Position.BottomCenter,
  onCollapsed,
  // 受控/非受控：外部值优先，否则使用内部状态
  tool: toolProp,
  onToolChange,
  penType: penTypeProp,
  onPenTypeChange,
  shapeType: shapeTypeProp,
  onShapeTypeChange,
  lineSize: lineSizeProp,
  onLineSizeChange,
  onUndo,
  onRedo,
  onClear,
  ...props
}: WhiteboardToolProps) => {
  const { cls, vcls } = useCls(
    [
      "whiteboard-tool",
      `whiteboard-tool--${position}`,
      `whiteboard-tool--${direction}`,
    ],
    className,
  );
  const [collapsed, setCollapsed] = useState(false);
  const [iTool, setITool] = useState<ToolValue>(Tool.Pen);
  const [iPenType, setIPenType] = useState<PenTypeValue>(PenType.Brush);
  const [iShapeType, setIShapeType] = useState<ShapeTypeValue>(ShapeType.Square);
  const [iLineSize, setILineSize] = useState(4);

  const tool = toolProp ?? iTool;
  const penType = penTypeProp ?? iPenType;
  const shapeType = shapeTypeProp ?? iShapeType;
  const lineSize = lineSizeProp ?? iLineSize;

  const flexDirection = direction === Direction.Vertical ? "column" : "row";

  // 收缩箭头：基础朝向 + 收缩后反转（指向展开方向）
  const chevronRotate =
    getChevronRotate(direction, position) + (collapsed ? 180 : 0);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    onCollapsed?.(next);
  };

  const switchTool = (next: ToolValue) => {
    setITool(next);
    onToolChange?.(next);
  };

  // 工具按钮类名：选中态追加 -active（warning 色，见 index.scss）
  const toolBtnCls = (name: ToolValue) =>
    [vcls("btn"), tool === name && vcls("btn-active")]
      .filter(Boolean)
      .join(" ");

  const PenIcon = PEN_ICONS[penType];
  const ShapeIcon = SHAPE_ICONS[shapeType];

  const penOptions = [
    { label: "钢笔", value: PenType.Pen, icon: <Pen size={iconSize} /> },
    { label: "水笔", value: PenType.Brush, icon: <Brush size={iconSize} /> },
    { label: "铅笔", value: PenType.Pencil, icon: <Pencil size={iconSize} /> },
  ];
  const shapeOptions = [
    {
      label: "方形",
      value: ShapeType.Square,
      icon: <Square size={iconSize} />,
    },
    {
      label: "圆形",
      value: ShapeType.Circle,
      icon: <Circle size={iconSize} />,
    },
    {
      label: "箭头",
      value: ShapeType.Arrow,
      icon: <ArrowUpRight size={iconSize} />,
    },
  ];

  const handleLineSizeChange = (value: number) => {
    setILineSize(value);
    onLineSizeChange?.(value);
  };

  return createPortal(
    <div {...props} className={cls} style={{ ...offset }}>
      <header className={vcls("toggle")} onClick={toggleCollapsed}>
        <ChevronUp
          size={iconSize}
          style={{ transform: `rotate(${chevronRotate}deg)` }}
        />
      </header>
      {collapsed ? (
        // 收缩态：仅展示当前笔图标（纯展示，不具备绘制能力）
        <div className={vcls("collapsed")}>
          <Button icon={<PenIcon size={iconSize} />} />
        </div>
      ) : (
        <>
          <Divider direction={anotherD(direction)} />
          <main
            className={vcls("main")}
            style={{
              flexDirection,
            }}
          >
            <div
              className={vcls("main-tools")}
              style={{
                flexDirection,
              }}
            >
              <Trigger
                direction={direction}
                prefix={<PenIcon size={iconSize} />}
                options={penOptions}
                value={penType}
                showLabel={false}
                onChange={(value) => {
                  setIPenType(value as PenTypeValue);
                  onPenTypeChange?.(value as PenTypeValue);
                }}
                onClick={() => switchTool(Tool.Pen)}
                classNames={{ trigger: toolBtnCls(Tool.Pen) }}
              />
              <Trigger
                direction={direction}
                prefix={<ShapeIcon size={iconSize} />}
                options={shapeOptions}
                value={shapeType}
                showLabel={false}
                onChange={(value) => {
                  setIShapeType(value as ShapeTypeValue);
                  onShapeTypeChange?.(value as ShapeTypeValue);
                }}
                onClick={() => switchTool(Tool.Shape)}
                classNames={{ trigger: toolBtnCls(Tool.Shape) }}
              />
              <Button
                icon={<Eraser size={iconSize} />}
                className={toolBtnCls(Tool.Eraser)}
                onClick={() => switchTool(Tool.Eraser)}
              />
              <Button
                icon={<Type size={iconSize} />}
                className={toolBtnCls(Tool.Text)}
                onClick={() => switchTool(Tool.Text)}
              />
            </div>
            <Divider direction={anotherD(direction)} />
            <div className={vcls("main-size")} style={{ flexDirection }}>
              Size:{" "}
              <Slider
                min={1}
                max={10}
                step={0.5}
                value={lineSize}
                onChange={handleLineSizeChange}
                direction={direction}
              ></Slider>
              <span>{lineSize}</span>
            </div>
          </main>
          <Divider direction={anotherD(direction)} />
          <footer className={vcls("footer")} style={{ flexDirection }}>
            <Button icon={<Undo size={iconSize} />} onClick={onUndo} />
            <Button icon={<Redo size={iconSize} />} onClick={onRedo} />
            <Button
              className={vcls("delete")}
              icon={<Trash size={iconSize} />}
              onClick={onClear}
            />
          </footer>
        </>
      )}
    </div>,
    container || document.body,
  );
};

interface DividerProps extends HTMLAttributes<HTMLDivElement> {
  direction: DirectionType;
}

const Divider = ({ direction, ...props }: DividerProps) => {
  const { cls } = useCls(["divider", `divider--${direction}`]);
  return <div className={cls} {...props}></div>;
};

const anotherD = (direction: DirectionType) =>
  direction === Direction.Horizontal
    ? Direction.Vertical
    : Direction.Horizontal;
