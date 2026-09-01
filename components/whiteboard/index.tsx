import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type HTMLAttributes,
} from "react";
import {
  Arrow,
  Ellipse,
  Layer,
  Line,
  Rect,
  Stage,
  Text as KonvaText,
} from "react-konva";
import type Konva from "konva";
import type { KonvaEventObject } from "konva/lib/Node";
import { useCls } from "../std/hooks/cls";
import { WhiteboardTool } from "./tool";
import {
  PenType,
  Tool,
  type DirectionType,
  type PenTypeValue,
  type PenShape,
  type PositionType,
  type ShapeTypeValue,
  type ToolValue,
  type WhiteboardShape,
} from "./types";
import "./index.scss";

export interface WhiteboardProps extends HTMLAttributes<HTMLDivElement> {
  /** 画笔/形状描边、文字颜色 */
  color?: string;
  /** 画布背景色（任意 CSS 色值，默认主题次背景色 var(--vauid-color-bg-secondary)） */
  background?: string;
  /** 工具栏位置（默认底部居中） */
  position?: PositionType;
  /** 工具栏方向：横向（默认）/ 纵向 */
  direction?: DirectionType;
  iconSize?: number | string;
  /** 是否显示内置工具栏 */
  showTool?: boolean;
  /** 内置工具栏渲染容器：undefined 绑到 document.body（fixed 定位）；"self" 绑到白板自身；或传具体元素（absolute 定位，容器需为 position: relative） */
  toolContainer?: Element | DocumentFragment | "self";
  /** 图形集合变化回调（可用于持久化，注意绘制过程中会高频触发） */
  onShapesChange?: (shapes: WhiteboardShape[]) => void;
  /** 工具栏收缩回调（收缩后画布禁用绘制） */
  onCollapsed?: (collapsed: boolean) => void;
}

/** 文档状态：图形 + 撤销/重做栈（单一 state 保证 StrictMode 下更新纯函数化） */
interface Doc {
  shapes: WhiteboardShape[];
  past: WhiteboardShape[][];
  future: WhiteboardShape[][];
}

/** 生成图形 id（仅在事件回调中调用，不在渲染期） */
let shapeSeq = 0;
const uid = () => `vauid-wb-${++shapeSeq}-${Math.random().toString(36).slice(2, 8)}`;

/** 笔类型 → 线宽/透明度（钢笔实线、水笔粗软、铅笔细淡） */
const getPenStyle = (penType: PenTypeValue, size: number) => {
  switch (penType) {
    case PenType.Brush:
      return { strokeWidth: size * 1.8, opacity: 0.85 };
    case PenType.Pencil:
      return { strokeWidth: Math.max(1, size * 0.6), opacity: 0.55 };
    default:
      return { strokeWidth: size, opacity: 1 };
  }
};

/** 文本字号：由线条粗细推导 */
const getTextFontSize = (size: number) => 12 + size * 2;

/**
 * # Whiteboard - 白板组件
 * 基于 react-konva 的画布白板，组合内置 WhiteboardTool：
 * - 笔（钢笔/水笔/铅笔）、橡皮（点击/划过删除图形）、形状（方形/圆形/箭头）、文本
 * - 撤销/重做/清空（工具栏 footer 按钮）
 * - 图形为纯 JSON 模型（WhiteboardShape），可通过 onShapesChange 持久化
 *
 * 工具栏收缩后画布只读（不具备绘制能力）。
 */
export const Whiteboard = ({
  color = "#ffffff",
  // 默认取主题次背景色（暗色主题下为深色画布），保证默认白色笔迹可见；可传任意 CSS 色值覆盖
  background = "var(--vauid-color-bg-secondary)",
  position,
  direction,
  iconSize,
  showTool = true,
  toolContainer,
  onShapesChange,
  onCollapsed,
  className,
  ...props
}: WhiteboardProps) => {
  const { cls, vcls } = useCls("whiteboard", className);
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // 白板容器 DOM（callback ref 收集，供 toolContainer="self" 时渲染期使用；不能用渲染期读 ref）
  const [mountContainer, setMountContainer] = useState<HTMLDivElement | null>(null);

  // 画布尺寸：跟随容器（ResizeObserver）
  const [size, setSize] = useState({ width: 0, height: 0 });

  // 工具状态（Whiteboard 持有并受控传给 WhiteboardTool）
  const [tool, setTool] = useState<ToolValue>(Tool.Pen);
  const [penType, setPenType] = useState<PenTypeValue>(PenType.Brush);
  const [shapeType, setShapeType] = useState<ShapeTypeValue>("square");
  const [lineSize, setLineSize] = useState(4);
  const [collapsed, setCollapsed] = useState(false);

  // 文档（图形 + 历史）
  const [doc, setDoc] = useState<Doc>({ shapes: [], past: [], future: [] });

  // 文本编辑会话（null 表示不在编辑）
  const [editing, setEditing] = useState<{
    x: number;
    y: number;
    value: string;
  } | null>(null);

  // 绘制会话标记（ref 仅在事件回调中读写）
  const isDrawingRef = useRef(false);
  const isErasingRef = useRef(false);
  const currentIdRef = useRef<string | null>(null);
  const startPointRef = useRef<{ x: number; y: number } | null>(null);

  const interactive = !collapsed;

  // 容器尺寸监听
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setSize({ width: el.clientWidth, height: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // 图形变化回调
  useEffect(() => {
    onShapesChange?.(doc.shapes);
  }, [doc.shapes, onShapesChange]);

  // 文本编辑开始后自动聚焦（延迟到宏任务，确保不被事件默认行为覆盖）
  useEffect(() => {
    if (!editing) return;
    const timer = setTimeout(() => textareaRef.current?.focus(), 0);
    return () => clearTimeout(timer);
  }, [editing]);

  // 全局 mouseup：指针移出画布后释放也能结束笔画
  useEffect(() => {
    const endStroke = () => {
      isDrawingRef.current = false;
      isErasingRef.current = false;
      currentIdRef.current = null;
      startPointRef.current = null;
    };
    window.addEventListener("mouseup", endStroke);
    return () => window.removeEventListener("mouseup", endStroke);
  }, []);

  /** 将当前图形集快照压入撤销栈（新动作开始时调用） */
  const pushHistory = () =>
    setDoc((d) => ({ ...d, past: [...d.past, d.shapes], future: [] }));

  const undo = () =>
    setDoc((d) =>
      d.past.length === 0
        ? d
        : {
            shapes: d.past[d.past.length - 1],
            past: d.past.slice(0, -1),
            future: [d.shapes, ...d.future],
          },
    );

  const redo = () =>
    setDoc((d) =>
      d.future.length === 0
        ? d
        : {
            shapes: d.future[0],
            past: [...d.past, d.shapes],
            future: d.future.slice(1),
          },
    );

  const clear = () =>
    setDoc((d) =>
      d.shapes.length === 0
        ? d
        : { shapes: [], past: [...d.past, d.shapes], future: [] },
    );

  /** 橡皮：命中检测删除指针处的图形 */
  const eraseAt = (pos: { x: number; y: number }) => {
    const node = stageRef.current?.getIntersection(pos);
    const id = node?.id();
    if (!id) return;
    setDoc((d) => {
      const next = d.shapes.filter((s) => s.id !== id);
      return next.length === d.shapes.length ? d : { ...d, shapes: next };
    });
  };

  const handleMouseDown = (e: KonvaEventObject<MouseEvent>) => {
    if (!interactive) return;
    // 阻止 mousedown 默认行为（焦点转移到 body/文本选择）：
    // 否则浏览器会在事件派发结束后抢走刚挂载的 textarea 的焦点，导致文字工具无法输入
    e.evt.preventDefault();
    const pos = stageRef.current?.getPointerPosition();
    if (!pos) return;

    if (tool === Tool.Eraser) {
      isErasingRef.current = true;
      pushHistory();
      eraseAt(pos);
      return;
    }

    if (tool === Tool.Text) {
      // 点击画布开启文本编辑（若正在编辑则先由 blur 提交）
      setEditing({ x: pos.x, y: pos.y, value: "" });
      return;
    }

    // 笔 / 形状：落笔前快照历史
    isDrawingRef.current = true;
    pushHistory();
    const id = uid();
    currentIdRef.current = id;
    startPointRef.current = pos;

    if (tool === Tool.Pen) {
      const shape: PenShape = {
        id,
        type: "pen",
        penType,
        color,
        size: lineSize,
        // 双点渲染为圆点（单击落笔也可见）
        points: [pos.x, pos.y, pos.x, pos.y],
      };
      setDoc((d) => ({ ...d, shapes: [...d.shapes, shape] }));
      return;
    }

    // 形状工具：创建零尺寸图形，mousemove 中拉伸
    const base = { id, color, size: lineSize };
    const shape: WhiteboardShape =
      shapeType === "circle"
        ? { ...base, type: "ellipse", x: pos.x, y: pos.y, radiusX: 0, radiusY: 0 }
        : shapeType === "arrow"
          ? { ...base, type: "arrow", points: [pos.x, pos.y, pos.x, pos.y] }
          : { ...base, type: "rect", x: pos.x, y: pos.y, width: 0, height: 0 };
    setDoc((d) => ({ ...d, shapes: [...d.shapes, shape] }));
  };

  const handleMouseMove = () => {
    if (!interactive) return;
    const pos = stageRef.current?.getPointerPosition();
    if (!pos) return;

    if (isErasingRef.current) {
      eraseAt(pos);
      return;
    }
    if (!isDrawingRef.current) return;

    const id = currentIdRef.current;
    const start = startPointRef.current;
    if (!id || !start) return;

    setDoc((d) => ({
      ...d,
      shapes: d.shapes.map((s): WhiteboardShape => {
        if (s.id !== id) return s;
        switch (s.type) {
          case "pen":
            return { ...s, points: [...s.points, pos.x, pos.y] };
          case "rect":
            return {
              ...s,
              x: Math.min(start.x, pos.x),
              y: Math.min(start.y, pos.y),
              width: Math.abs(pos.x - start.x),
              height: Math.abs(pos.y - start.y),
            };
          case "ellipse":
            return {
              ...s,
              x: (start.x + pos.x) / 2,
              y: (start.y + pos.y) / 2,
              radiusX: Math.abs(pos.x - start.x) / 2,
              radiusY: Math.abs(pos.y - start.y) / 2,
            };
          case "arrow":
            return {
              ...s,
              points: [s.points[0], s.points[1], pos.x, pos.y],
            };
          default:
            return s;
        }
      }),
    }));
  };

  /** 提交文本编辑：非空则写入图形集 */
  const commitText = () => {
    if (editing && editing.value.trim()) {
      const shape: WhiteboardShape = {
        id: uid(),
        type: "text",
        x: editing.x,
        y: editing.y,
        text: editing.value,
        color,
        size: lineSize,
      };
      setDoc((d) => ({
        shapes: [...d.shapes, shape],
        past: [...d.past, d.shapes],
        future: [],
      }));
    }
    setEditing(null);
  };

  /** 图形 → Konva 图元 */
  const renderShape = (s: WhiteboardShape) => {
    switch (s.type) {
      case "pen": {
        const { strokeWidth, opacity } = getPenStyle(s.penType, s.size);
        return (
          <Line
            key={s.id}
            id={s.id}
            points={s.points}
            stroke={s.color}
            strokeWidth={strokeWidth}
            opacity={opacity}
            tension={0.4}
            lineCap="round"
            lineJoin="round"
            // 放大命中区域，方便橡皮擦除细线
            hitStrokeWidth={Math.max(strokeWidth, 16)}
          />
        );
      }
      case "rect":
        return (
          <Rect
            key={s.id}
            id={s.id}
            x={s.x}
            y={s.y}
            width={s.width}
            height={s.height}
            stroke={s.color}
            strokeWidth={s.size}
            fill="transparent"
          />
        );
      case "ellipse":
        return (
          <Ellipse
            key={s.id}
            id={s.id}
            x={s.x}
            y={s.y}
            radiusX={s.radiusX}
            radiusY={s.radiusY}
            stroke={s.color}
            strokeWidth={s.size}
            fill="transparent"
          />
        );
      case "arrow":
        return (
          <Arrow
            key={s.id}
            id={s.id}
            points={s.points}
            stroke={s.color}
            fill={s.color}
            strokeWidth={s.size}
            pointerLength={10 + s.size}
            pointerWidth={8 + s.size}
          />
        );
      case "text":
        return (
          <KonvaText
            key={s.id}
            id={s.id}
            x={s.x}
            y={s.y}
            text={s.text}
            fill={s.color}
            fontSize={getTextFontSize(s.size)}
          />
        );
    }
  };

  const fontSize = getTextFontSize(lineSize);

  return (
    <div
      {...props}
      ref={(el) => {
        containerRef.current = el;
        setMountContainer(el);
      }}
      className={interactive ? `${cls} ${vcls("interactive")}` : cls}
      style={{ backgroundColor: background, ...props.style }}
    >
      <Stage
        ref={stageRef}
        width={size.width}
        height={size.height}
        listening={interactive}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
      >
        <Layer>{doc.shapes.map(renderShape)}</Layer>
      </Stage>

      {/* 文本编辑浮层：与画布坐标对齐（Stage 位于容器原点） */}
      {editing && (
        <textarea
          ref={textareaRef}
          className={vcls("text-editor")}
          style={{ left: editing.x, top: editing.y, fontSize, color }}
          value={editing.value}
          onChange={(e) =>
            setEditing((prev) => (prev ? { ...prev, value: e.target.value } : prev))
          }
          onBlur={commitText}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setEditing(null);
            } else if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              commitText();
            }
          }}
        />
      )}

      {showTool && (
        <WhiteboardTool
          // self / 自定义容器模式：附加修饰类将 fixed 改为 absolute（坐标相对容器定位，容器需 position: relative）
          className={
            toolContainer !== undefined && toolContainer !== document.body
              ? vcls("tool-self")
              : undefined
          }
          position={position}
          direction={direction}
          iconSize={iconSize}
          tool={tool}
          onToolChange={setTool}
          penType={penType}
          onPenTypeChange={setPenType}
          shapeType={shapeType}
          onShapeTypeChange={setShapeType}
          lineSize={lineSize}
          onLineSizeChange={setLineSize}
          onCollapsed={(next) => {
            setCollapsed(next);
            onCollapsed?.(next);
          }}
          onUndo={undo}
          onRedo={redo}
          onClear={clear}
          // toolContainer：undefined → document.body（tool 默认）；"self" → 白板自身；否则为具体容器
          container={toolContainer === "self" ? (mountContainer ?? undefined) : toolContainer}
        />
      )}
    </div>
  );
};
