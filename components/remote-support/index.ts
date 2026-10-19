//! 远程支持（remote-support）公共 API 汇出
//! RemoteSupport 组合模板 + MouseMapper 指针映射（12.2，Pointer 帧不经 Yjs）+ AnnotationLayer 标注层（12.3，Yjs）

export { MouseMapper, type MouseMapperProps } from "./mouse";
export { AnnotationLayer, type AnnotationLayerProps } from "./annotation";
export { RemoteSupport, type RemoteSupportProps } from "./index.tsx";
export {
  ANNOTATIONS_KEY,
  ERASER_HIT_PX,
  addAnnotation,
  advanceAnnotation,
  clearAnnotations,
  createAnnotationId,
  createAnnotationUndoManager,
  distToSegment,
  drawAnnotation,
  hitTestAnnotation,
  indexOfAnnotation,
  removeAnnotation,
  snapshotAnnotations,
  updateAnnotation,
  useYAnnotations,
  type Annotation,
  type AnnotationPoint,
  type AnnotationType,
  type YAnnotationsHandle,
} from "./annotationShapes";
export {
  POINTER_MOVE_FRAME_BYTES,
  createMoveThrottle,
  createRafScheduler,
  decodePointerAction,
  decodePointerMove,
  encodePointerAction,
  encodePointerMove,
  normalizePoint,
  type FrameScheduler,
  type MoveThrottle,
  type PointerAction,
  type PointerActionKind,
  type PointerMoveFrame,
} from "./pointerFrame";
