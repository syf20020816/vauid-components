//! 远程标注数据层（12.3，Yjs）
//! Y.Array<Annotation> 的增删改 helper + React 订阅 hook + Canvas 绘制 + 橡皮命中检测
//! 标注为纯 JSON（Annotation，坐标 0-1 归一化，与显示尺寸解耦），更新一律
//! 「transact 内 delete+insert」整对象替换（照抄白板 collabShapes 模式，定位按 id 不按下标）
//! 本文件无组件导出（fast-refresh），可被纯 node 环境测试

import { useEffect, useMemo, useState } from "react";
import * as Y from "yjs";

/** 标注数据 type（与白板 ShapeType 映射：square→rect / circle→ellipse / arrow→arrow） */
export type AnnotationType = "pen" | "rect" | "ellipse" | "arrow";

/** 归一化坐标点（0-1，相对标注层容器） */
export interface AnnotationPoint {
  x: number;
  y: number;
}

/**
 * # 标注数据模型（纯 JSON，可序列化）
 * points 语义按 type 区分：pen 为轨迹点列；rect / ellipse / arrow 取首尾两点（对角 / 对角 / 起终点）
 */
export interface Annotation {
  id: string;
  type: AnnotationType;
  points: AnnotationPoint[];
  color: string;
  /** 线宽（px） */
  size: number;
  author?: string;
}

/** Y.Doc 内标注数组的固定 key（与白板 SHAPES_KEY 同构） */
export const ANNOTATIONS_KEY = "annotations";

/** 标注 id 生成（与白板 createShapeId 同款，前缀 vauid-rs-*；仅在事件回调中调用） */
let annotationIdSeq = 0;
export const createAnnotationId = (): string =>
  `vauid-rs-${++annotationIdSeq}-${Math.random().toString(36).slice(2, 8)}`;

/** 把 Y.Array 转成普通数组快照（元素为存储中的纯 JSON 标注，引用只读约定） */
export const snapshotAnnotations = (
  yAnnotations: Y.Array<Annotation> | null | undefined,
): Annotation[] => (yAnnotations ? yAnnotations.toArray() : []);

/** 按 id 定位标注下标（找不到返回 -1） */
export const indexOfAnnotation = (
  yAnnotations: Y.Array<Annotation>,
  id: string,
): number => yAnnotations.toArray().findIndex((a) => a.id === id);

/** 追加一条标注（触发 observe → 本端订阅与远端同步） */
export const addAnnotation = (
  yAnnotations: Y.Array<Annotation>,
  annotation: Annotation,
): void => {
  yAnnotations.push([annotation]);
};

/** 删除指定 id 的标注；不存在则忽略 */
export const removeAnnotation = (
  yAnnotations: Y.Array<Annotation>,
  id: string,
): void => {
  const index = indexOfAnnotation(yAnnotations, id);
  if (index < 0) return;
  yAnnotations.delete(index, 1);
};

/**
 * 更新指定 id 的标注：updater 收到存储中的标注（纯 JSON），返回新对象；
 * 返回同引用视为无变化跳过写入。updater 必须纯（不可原地修改入参）。
 * delete+insert 包在同一 transact 内：UndoManager 记为单项，网络层合并为一次 update
 */
export const updateAnnotation = (
  yAnnotations: Y.Array<Annotation>,
  id: string,
  updater: (annotation: Annotation) => Annotation,
): void => {
  const index = indexOfAnnotation(yAnnotations, id);
  if (index < 0) return;
  const prev = yAnnotations.get(index);
  const next = updater(prev);
  if (next === prev) return;
  yAnnotations.doc?.transact(() => {
    yAnnotations.delete(index, 1);
    yAnnotations.insert(index, [next]);
  });
};

/** 清空全部标注（协作语义 = 删除全部，可被 UndoManager 撤销） */
export const clearAnnotations = (yAnnotations: Y.Array<Annotation>): void => {
  if (yAnnotations.length === 0) return;
  yAnnotations.delete(0, yAnnotations.length);
};

/**
 * 创建协作模式撤销管理器：只跟踪标注数组上的本端事务，远端 apply 的数据不进撤销栈；
 * 一笔标注内的 add + 多次 update 在 captureTimeout 窗口内合并为一个撤销项
 */
export const createAnnotationUndoManager = (
  yAnnotations: Y.Array<Annotation>,
  captureTimeout = 500,
): Y.UndoManager => new Y.UndoManager(yAnnotations, { captureTimeout });

/** useYAnnotations 返回句柄：渲染快照 + 变更操作 + 撤销管理器 */
export interface YAnnotationsHandle {
  annotations: Annotation[];
  add(annotation: Annotation): void;
  remove(id: string): void;
  update(id: string, updater: (annotation: Annotation) => Annotation): void;
  clear(): void;
  undoManager: Y.UndoManager;
}

/**
 * # useYAnnotations - 订阅 Y.Array<Annotation> → 转出普通数组给渲染
 * yAnnotations 为 null（本地模式）时返回 null 不订阅；增删改一律走返回的操作方法
 */
export const useYAnnotations = (
  yAnnotations: Y.Array<Annotation> | null | undefined,
): YAnnotationsHandle | null => {
  const [annotations, setAnnotations] = useState<Annotation[]>(() =>
    snapshotAnnotations(yAnnotations),
  );

  useEffect(() => {
    if (!yAnnotations) return;
    const handler = () => setAnnotations(snapshotAnnotations(yAnnotations));
    yAnnotations.observeDeep(handler);
    return () => {
      yAnnotations.unobserveDeep(handler);
    };
  }, [yAnnotations]);

  // 生命周期与使用方持有的 doc 绑定（组件卸载不销毁）
  const undoManager = useMemo(
    () => (yAnnotations ? createAnnotationUndoManager(yAnnotations) : null),
    [yAnnotations],
  );

  return useMemo(() => {
    if (!yAnnotations || !undoManager) return null;
    return {
      annotations,
      add: (annotation) => {
        addAnnotation(yAnnotations, annotation);
      },
      remove: (id) => {
        removeAnnotation(yAnnotations, id);
      },
      update: (id, updater) => {
        updateAnnotation(yAnnotations, id, updater);
      },
      clear: () => {
        clearAnnotations(yAnnotations);
      },
      undoManager,
    };
  }, [yAnnotations, undoManager, annotations]);
};

/** 橡皮默认命中半径（px，换算归一化时按容器短边折算） */
export const ERASER_HIT_PX = 10;

/** 点到线段的最短距离（命中检测的几何基础；零长度线段退化为点距） */
export const distToSegment = (
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
): number => {
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSq = dx * dx + dy * dy;
  if (lengthSq === 0) return Math.hypot(px - ax, py - ay);
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lengthSq));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
};

/**
 * # hitTestAnnotation - 橡皮命中检测（纯函数）
 * p 与 tolerance 均为归一化值（tolerance 由组件按 ERASER_HIT_PX / 短边换算）；
 * rect / ellipse / arrow 检测轮廓（空心），pen 检测相邻采样点连线（单点视为圆点）
 */
export const hitTestAnnotation = (
  annotation: Annotation,
  p: AnnotationPoint,
  tolerance: number,
): boolean => {
  const points = annotation.points;
  if (points.length === 0) return false;
  if (annotation.type === "rect") {
    if (points.length < 2) return false;
    // 四条边由两对角点展开；命中任一边即视为命中
    const corners = [
      points[0],
      { x: points[1].x, y: points[0].y },
      points[1],
      { x: points[0].x, y: points[1].y },
    ];
    for (let i = 0; i < corners.length; i++) {
      const from = corners[i];
      const to = corners[(i + 1) % corners.length];
      if (distToSegment(p.x, p.y, from.x, from.y, to.x, to.y) <= tolerance) return true;
    }
    return false;
  }
  if (annotation.type === "ellipse") {
    if (points.length < 2) return false;
    const x0 = points[0].x;
    const y0 = points[0].y;
    const x1 = points[points.length - 1].x;
    const y1 = points[points.length - 1].y;
    const rx = Math.abs(x1 - x0) / 2;
    const ry = Math.abs(y1 - y0) / 2;
    // 退化（单轴为零成线段/起终点重合成点）：按线段/点距处理
    if (rx === 0 || ry === 0) {
      return distToSegment(p.x, p.y, x0, y0, x1, y1) <= tolerance;
    }
    // 径向投影近似：把点变换到单位圆空间求最近轮廓点，再换算回原空间距离
    const cx = (x0 + x1) / 2;
    const cy = (y0 + y1) / 2;
    const u = (p.x - cx) / rx;
    const v = (p.y - cy) / ry;
    const len = Math.hypot(u, v);
    // 圆心位于空心椭圆内部，远离轮廓
    if (len === 0) return false;
    const nx = cx + (u / len) * rx;
    const ny = cy + (v / len) * ry;
    return Math.hypot(p.x - nx, p.y - ny) <= tolerance;
  }
  if (annotation.type === "arrow") {
    if (points.length < 2) return false;
    return distToSegment(p.x, p.y, points[0].x, points[0].y, points[1].x, points[1].y) <= tolerance;
  }
  if (points.length === 1) {
    return Math.hypot(p.x - points[0].x, p.y - points[0].y) <= tolerance;
  }
  for (let i = 0; i < points.length - 1; i++) {
    if (distToSegment(p.x, p.y, points[i].x, points[i].y, points[i + 1].x, points[i + 1].y) <= tolerance) {
      return true;
    }
  }
  return false;
};

/** 绘制推进（纯函数，本地/协作两模式共用）：pen 追加轨迹点，rect / ellipse / arrow 尾点跟随首点固定 */
export const advanceAnnotation = (
  annotation: Annotation,
  p: AnnotationPoint,
): Annotation => {
  if (annotation.type === "pen") {
    return { ...annotation, points: [...annotation.points, p] };
  }
  return { ...annotation, points: [annotation.points[0], p] };
};

/** 箭头头部张角（半角，弧度） */
const ARROW_HEAD_ANGLE = Math.PI / 6;

/** 画箭头头部：终点处两条反向短线的实心感描边 */
const drawArrowHead = (
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  size: number,
): void => {
  const angle = Math.atan2(y1 - y0, x1 - x0);
  const headLength = 8 + size * 2;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(
    x1 - headLength * Math.cos(angle - ARROW_HEAD_ANGLE),
    y1 - headLength * Math.sin(angle - ARROW_HEAD_ANGLE),
  );
  ctx.moveTo(x1, y1);
  ctx.lineTo(
    x1 - headLength * Math.cos(angle + ARROW_HEAD_ANGLE),
    y1 - headLength * Math.sin(angle + ARROW_HEAD_ANGLE),
  );
  ctx.stroke();
};

/**
 * # drawAnnotation - 把一条归一化标注绘制到 Canvas 2D 上下文
 * width / height 为画布 CSS 尺寸（归一化坐标 × 尺寸 = 像素坐标），
 * 上下文已由调用方完成 devicePixelRatio 缩放
 */
export const drawAnnotation = (
  ctx: CanvasRenderingContext2D,
  annotation: Annotation,
  width: number,
  height: number,
): void => {
  if (annotation.points.length === 0 || width <= 0 || height <= 0) return;
  const toPx = (p: AnnotationPoint): [number, number] => [p.x * width, p.y * height];
  ctx.save();
  ctx.strokeStyle = annotation.color;
  ctx.fillStyle = annotation.color;
  ctx.lineWidth = annotation.size;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  if (annotation.type === "rect") {
    const [x0, y0] = toPx(annotation.points[0]);
    const [x1, y1] = toPx(annotation.points[annotation.points.length - 1]);
    ctx.strokeRect(Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0), Math.abs(y1 - y0));
  } else if (annotation.type === "ellipse") {
    const [x0, y0] = toPx(annotation.points[0]);
    const [x1, y1] = toPx(annotation.points[annotation.points.length - 1]);
    ctx.beginPath();
    ctx.ellipse(
      (x0 + x1) / 2,
      (y0 + y1) / 2,
      Math.abs(x1 - x0) / 2,
      Math.abs(y1 - y0) / 2,
      0,
      0,
      Math.PI * 2,
    );
    ctx.stroke();
  } else if (annotation.type === "arrow") {
    const [x0, y0] = toPx(annotation.points[0]);
    const [x1, y1] = toPx(annotation.points[annotation.points.length - 1]);
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    drawArrowHead(ctx, x0, y0, x1, y1, annotation.size);
  } else {
    // pen：轨迹折线；单点画圆点（单击落笔也可见）
    if (annotation.points.length === 1) {
      const [x, y] = toPx(annotation.points[0]);
      ctx.beginPath();
      ctx.arc(x, y, annotation.size / 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      annotation.points.forEach((p, i) => {
        const [x, y] = toPx(p);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }
  }
  ctx.restore();
};
