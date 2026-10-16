//! 协作基座（collab）公共 API 汇出
//! 纯 TS 基础设施：Transport 注入接口 + envelope 编解码 + Yjs 桥，无 React 组件

export {
  CollabMessageTypes,
  CollabStatus,
  type CollabEnvelope,
  type CollabMessageType,
  type CollabPayload,
  type CollabSendOptions,
  type CollabStatusValue,
  type CollabTransport,
} from "./types";
export {
  createSeq,
  decodeEnvelope,
  decodeEnvelopeJson,
  encodeEnvelope,
  encodeEnvelopeJson,
} from "./envelope";
export { createMemoryTransportPair } from "./memory";
export { createYjsBridge, type YjsBridge, type YjsBridgeOptions } from "./yjs";
