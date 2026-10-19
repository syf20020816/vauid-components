//! AnnotationLayer 远程标注层（12.3，Yjs）
//! Canvas 2D 全量重绘（annotations 快照变化 → 重绘，devicePixelRatio 适配）
//! 不传 doc = 本地模式（单机标注 + 本地历史栈，与白板双轨一致）；
//! 传 doc = 协作模式（Y.Array<Annotation> + UndoManager，复用 collab 基座 yjs-update envelope）
//! awareness 存在时展示他人光标——直接复用白板 collabShapes 的 useCollabCursors / cursorColor
//! （同一套归一化坐标 awareness 协议，避免复制实现）
//! 工具栏复用白板 WhiteboardTool（标注层 = 叠在画面上的透明白板，不造第二套工具栏）：
//! tools 裁剪为 笔/形状/橡皮（无文字），square/circle/arrow 映射为 rect/ellipse/arrow 标注

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { Doc } from "yjs";
import type { Awareness } from "y-protocols/awareness";
import { WhiteboardTool } from "../whiteboard/tool";
import {
  Position,
  ShapeType,
  Tool,
  type DirectionType,
  type PositionType,
  type ShapeTypeValue,
  type ToolValue,
} from "../whiteboard/types";
import { useCls } from "../std/hooks/cls";
import { cursorColor, useCollabCursors } from "../whiteboard/collabShapes";
import {
  ANNOTATIONS_KEY,
  ERASER_HIT_PX,
  advanceAnnotation,
  createAnnotationId,
  drawAnnotation,
  hitTestAnnotation,
  useYAnnotations,
  type Annotation,
  type AnnotationPoint,
  type AnnotationType,
} from "./annotationShapes";
import { normalizePoint } from "./pointerFrame";
import "./index.scss";

/** 默认标注线宽（对应工具栏 Size 滑杆范围 1-10，写入标注 size，单位 px） */
const DEFAULT_LINE_SIZE = 3;

export interface AnnotationLayerProps {
  /** 不传 = 本地模式（行为不变的单机标注）；传入即协作模式（引用需稳定，建议 useMemo） */
  doc?: Doc;
  /** 协作 awareness（远程光标 presence），不传则无光标同步 */
  awareness?: Awareness;
  /** 本端用户名（随光标广播 + 写入新标注的 author 字段） */
  name?: string;
  /** 当前工具（受控模式，复用白板 Tool 枚举；标注层支持 Pen / Shape / Eraser） */
  tool?: ToolValue;
  /** 非受控模式的初始工具（默认 pen） */
  defaultTool?: ToolValue;
  onToolChange?: (tool: ToolValue) => void;
  /** 形状工具的当前形状（受控模式）：square→rect / circle→ellipse / arrow→arrow */
  shapeType?: ShapeTypeValue;
  /** 非受控模式的初始形状（默认 square） */
  defaultShapeType?: ShapeTypeValue;
  onShapeTypeChange?: (shapeType: ShapeTypeValue) => void;
  /** 线宽（受控模式，1-10，写入标注 size） */
  lineSize?: number;
  /** 非受控模式的初始线宽（默认 3） */
  defaultLineSize?: number;
  onLineSizeChange?: (lineSize: number) => void;
  /** 标注颜色（默认红 #ff4d4f；WhiteboardTool 无颜色选择，改色由此 prop 控制） */
  color?: string;
  /** 是否显示工具栏（复用 WhiteboardTool，默认 true） */
  showToolbar?: boolean;
  /** 工具栏位置（默认右上角，见白板 Position） */
  toolbarPosition?: PositionType;
  /** 工具栏方向（默认横向） */
  toolbarDirection?: DirectionType;
  /** 工具栏渲染容器（默认标注层根元素，absolute 定位相对根元素） */
  toolbarContainer?: Element | DocumentFragment;
  className?: string;
}

/** 白板形状工具 → 标注数据 type（square 画矩形 / circle 画椭圆 / arrow 画箭头） */
const SHAPE_TO_ANNOTATION: Record<ShapeTypeValue, Exclude<AnnotationType, "pen">> = {
  [ShapeType.Square]: "rect",
  [ShapeType.Circle]: "ellipse",
  [ShapeType.Arrow]: "arrow",
};

/** 本地模式文档：标注快照 + 撤销/重做栈（单一 state 保证更新纯函数化，与白板同构） */
interface LocalDoc {
  annotations: Annotation[];
  past: Annotation[][];
  future: Annotation[][];
}

/**
 * # AnnotationLayer - Canvas 2D 标注层
 * 根元素 absolute inset-0（由外层容器定位）；交互落在 canvas 上：
 * pointerdown 开始 → move 采样归一化点 → up 提交（协作模式在 down 即插入、move 增量更新，
 * 远端可看到笔画生长；本地模式同样先插入再更新，历史由 past/future 栈或 UndoManager 承担）
 */
export const AnnotationLayer = ({
  doc,
  awareness,
  name,
  tool: toolProp,
  defaultTool,
  onToolChange,
  shapeType: shapeTypeProp,
  defaultShapeType,
  onShapeTypeChange,
  lineSize: lineSizeProp,
  defaultLineSize,
  onLineSizeChange,
  color = "#ff4d4f",
  showToolbar = true,
  toolbarPosition = Position.RightTop,
  toolbarDirection,
  toolbarContainer,
  className,
}: AnnotationLayerProps) => {
  const { cls, vcls } = useCls("annotation-layer", className);
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  // 工具栏 portal 容器（布局 effect 收集根元素，首帧渲染后立即可用）
  const [mountEl, setMountEl] = useState<HTMLDivElement | null>(null);

  // 工具状态（受控/非受控双模式：外部值优先，与 WhiteboardTool 同构）
  const [iTool, setITool] = useState<ToolValue>(defaultTool ?? Tool.Pen);
  const [iShapeType, setIShapeType] = useState<ShapeTypeValue>(
    defaultShapeType ?? ShapeType.Square,
  );
  const [iLineSize, setILineSize] = useState(defaultLineSize ?? DEFAULT_LINE_SIZE);
  const tool = toolProp ?? iTool;
  const shapeType = shapeTypeProp ?? iShapeType;
  const lineSize = lineSizeProp ?? iLineSize;

  // 本地模式文档（doc 不传时生效）
  const [localDoc, setLocalDoc] = useState<LocalDoc>({
    annotations: [],
    past: [],
    future: [],
  });

  // 协作模式：Y.Array<Annotation> 订阅（与白板 useYShapes 同构）
  const yAnnotations = useMemo(
    () => (doc ? doc.getArray<Annotation>(ANNOTATIONS_KEY) : null),
    [doc],
  );
  const yState = useYAnnotations(yAnnotations);
  // 渲染统一取快照：本地 = localDoc.annotations；协作 = 订阅快照
  const annotations = yState ? yState.annotations : localDoc.annotations;

  // 远程光标（awareness 存在时启用上报与订阅；复用白板实现）
  const remoteCursors = useCollabCursors({ awareness, name, containerRef: rootRef });

  // 绘制会话标记（ref 仅在事件回调中读写）
  const isDrawingRef = useRef(false);
  const isErasingRef = useRef(false);
  const draftIdRef = useRef<string | null>(null);

  // 容器尺寸监听（canvas 位图尺寸随 CSS 尺寸 × dpr 重设）+ 收集工具栏挂载容器
  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    setMountEl(el);
    const update = () => setSize({ width: el.clientWidth, height: el.clientHeight });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  /** 全量重绘：clear → 已提交标注 → （绘制中笔画已在数组内随之重画） */
  const drawAll = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.round(size.width * dpr));
    canvas.height = Math.max(1, Math.round(size.height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size.width, size.height);
    for (const annotation of annotations) {
      drawAnnotation(ctx, annotation, size.width, size.height);
    }
  }, [annotations, size]);

  useEffect(() => {
    drawAll();
  }, [drawAll]);

  /** 事件坐标 → 相对标注层的 0-1 归一化（rect 事件时实时读取，resize 天然跟随） */
  const toPoint = (e: ReactPointerEvent<HTMLCanvasElement>): AnnotationPoint => {
    const el = canvasRef.current;
    const rect = el
      ? el.getBoundingClientRect()
      : { left: 0, top: 0, width: 0, height: 0 };
    return normalizePoint(e.clientX, e.clientY, rect);
  };

  /** 插入新标注：协作走 Y.Array（UndoManager 跟踪），本地原子压历史快照 */
  const commitAdd = (annotation: Annotation) => {
    if (yState) {
      yState.add(annotation);
      return;
    }
    setLocalDoc((d) => ({
      annotations: [...d.annotations, annotation],
      past: [...d.past, d.annotations],
      future: [],
    }));
  };

  /** 橡皮：命中检测删除指针处的最上层标注（本地模式命中才压历史） */
  const eraseAt = (p: AnnotationPoint) => {
    // 命中半径按容器短边折算成归一化值（像素体验一致）
    const tolerance = ERASER_HIT_PX / Math.max(1, Math.min(size.width, size.height));
    for (let i = annotations.length - 1; i >= 0; i--) {
      const annotation = annotations[i];
      if (!hitTestAnnotation(annotation, p, tolerance)) continue;
      if (yState) {
        yState.remove(annotation.id);
      } else {
        setLocalDoc((d) => {
          const next = d.annotations.filter((item) => item.id !== annotation.id);
          // 未命中变化（并发已删）不产生事务
          return next.length === d.annotations.length
            ? d
            : { annotations: next, past: [...d.past, d.annotations], future: [] };
        });
      }
      return;
    }
  };

  const handlePointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const p = toPoint(e);
    if (tool === Tool.Eraser) {
      isErasingRef.current = true;
      eraseAt(p);
      return;
    }
    isDrawingRef.current = true;
    // pen 双点渲染为圆点（单击落笔也可见）；形状起终两点重合后由 move 拉伸
    const type: AnnotationType =
      tool === Tool.Shape ? SHAPE_TO_ANNOTATION[shapeType] : "pen";
    const annotation: Annotation = {
      id: createAnnotationId(),
      type,
      points: [p, p],
      color,
      size: lineSize,
      author: name,
    };
    draftIdRef.current = annotation.id;
    commitAdd(annotation);
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const p = toPoint(e);
    if (isErasingRef.current) {
      eraseAt(p);
      return;
    }
    if (!isDrawingRef.current) return;
    const id = draftIdRef.current;
    if (!id) return;
    if (yState) {
      // 协作模式：按 id 定位存储中的标注更新（远端并发增删不影响定位）
      yState.update(id, (a) => advanceAnnotation(a, p));
      return;
    }
    setLocalDoc((d) => ({
      ...d,
      annotations: d.annotations.map((a) => (a.id === id ? advanceAnnotation(a, p) : a)),
    }));
  };

  // 全局 pointerup：指针移出画布后释放也能结束笔画
  useEffect(() => {
    const endStroke = () => {
      isDrawingRef.current = false;
      isErasingRef.current = false;
      draftIdRef.current = null;
    };
    window.addEventListener("pointerup", endStroke);
    return () => window.removeEventListener("pointerup", endStroke);
  }, []);

  const undo = () => {
    if (yState) {
      yState.undoManager.undo();
      return;
    }
    setLocalDoc((d) =>
      d.past.length === 0
        ? d
        : {
            annotations: d.past[d.past.length - 1],
            past: d.past.slice(0, -1),
            future: [d.annotations, ...d.future],
          },
    );
  };

  const redo = () => {
    if (yState) {
      yState.undoManager.redo();
      return;
    }
    setLocalDoc((d) =>
      d.future.length === 0
        ? d
        : {
            annotations: d.future[0],
            past: [...d.past, d.annotations],
            future: d.future.slice(1),
          },
    );
  };

  const clear = () => {
    if (yState) {
      yState.clear();
      return;
    }
    setLocalDoc((d) =>
      d.annotations.length === 0
        ? d
        : { annotations: [], past: [...d.past, d.annotations], future: [] },
    );
  };

  const switchTool = (next: ToolValue) => {
    setITool(next);
    onToolChange?.(next);
  };

  const handleShapeTypeChange = (next: ShapeTypeValue) => {
    setIShapeType(next);
    onShapeTypeChange?.(next);
  };

  const handleLineSizeChange = (next: number) => {
    setILineSize(next);
    onLineSizeChange?.(next);
  };

  return (
    <div ref={rootRef} className={cls}>
      <canvas
        ref={canvasRef}
        className={vcls("canvas")}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onContextMenu={(e) => e.preventDefault()}
      />

      {remoteCursors.map((c) => (
        <div
          key={c.clientId}
          className={vcls("remote-cursor")}
          style={{
            left: `${c.x * 100}%`,
            top: `${c.y * 100}%`,
            backgroundColor: cursorColor(c.clientId),
          }}
        >
          <svg width="12" height="16" viewBox="0 0 12 16" aria-hidden="true">
            <polygon points="0,0 0,14 10,9" fill="#ffffff" strokeWidth="0" />
          </svg>
          {c.name ? <span>{c.name}</span> : null}
        </div>
      ))}

      {showToolbar ? (
        <WhiteboardTool
          // 复用白板工具栏：附加 -self 修饰类切 absolute（portal 进标注层根元素，
          // 坐标相对根元素；根元素 absolute 已建立定位上下文）
          className="vauid-whiteboard-tool-self"
          // 标注层无文字工具：能力裁剪为 笔/形状/橡皮
          tools={[Tool.Pen, Tool.Shape, Tool.Eraser]}
          tool={tool}
          onToolChange={switchTool}
          shapeType={shapeType}
          onShapeTypeChange={handleShapeTypeChange}
          lineSize={lineSize}
          onLineSizeChange={handleLineSizeChange}
          onUndo={undo}
          onRedo={redo}
          onClear={clear}
          position={toolbarPosition}
          direction={toolbarDirection}
          container={toolbarContainer ?? (mountEl ?? undefined)}
        />
      ) : null}
    </div>
  );
};
