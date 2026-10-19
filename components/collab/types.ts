//! 协作基座（collab）类型契约
//! 定义消息信封、消息类型、Transport 注入接口与连接状态——纯 TS，无 React 组件
//! 组件库不内置任何 RTC/WS 实现，传输层由使用方按 CollabTransport 注入

/**
 * # 协作消息类型
 * 多业务（Yjs update / 指针 / 标注 / awareness / 房间状态）复用同一通道的多路复用类型。
 * 二进制 envelope 中 type 以 1 字节枚举索引传输，索引与这里的声明顺序绑定（见 envelope.ts）。
 */
export const CollabMessageTypes = {
  /** Yjs 二进制增量 update（白板/文档协作主数据流，reliable） */
  YjsUpdate: "yjs-update",
  /** 远端指针/鼠标帧（unreliable，latest-wins，只保留最新值） */
  Pointer: "pointer",
  /** 标注层操作（reliable） */
  Annotation: "annotation",
  /** awareness presence 状态（光标/选区/在线信息） */
  Awareness: "awareness",
  /** 房间状态 / presence 元信息（预留扩展） */
  Room: "room",
} as const;

export type CollabMessageType = (typeof CollabMessageTypes)[keyof typeof CollabMessageTypes];

/**
 * 信封负载：二进制形态用 Uint8Array（如 Yjs update / awareness 帧），
 * JSON 形态放 JSON 安全值（普通对象 / 数组 / 基础类型）。
 */
export type CollabPayload = Uint8Array | unknown;

/**
 * # 协作消息信封
 * 控制流走二进制编码（encodeEnvelope），状态流走 JSON（encodeEnvelopeJson），
 * 两种形态共享同一结构。
 */
export interface CollabEnvelope {
  /** 协议版本，当前固定为 1（二进制形态不编码 v，版本由编码格式自身演进表达） */
  v: 1;
  /** 消息类型 */
  t: CollabMessageType;
  /** 发送端内单调递增序号（断线检测 / 重连续传的基础） */
  seq: number;
  /** 发送时间戳（Date.now()，ms） */
  ts: number;
  /** 负载 */
  payload: CollabPayload;
}

/** CollabTransport.send 的可选参数 */
export interface CollabSendOptions {
  /**
   * 是否走可靠有序通道，默认 true。
   * 最小版只做 reliable；unreliable 语义（可丢帧 / latest-wins）由使用方在实现内区分
   */
  reliable?: boolean;
}

/**
 * # CollabTransport - 协作传输注入接口
 * 使用方按自身场景实现（RTCDataChannel / WebSocket / 测试内存通道等），
 * 组件库只依赖此接口，不内置任何具体传输实现。
 */
export interface CollabTransport {
  /** 发送一条信封 */
  send(envelope: CollabEnvelope, options?: CollabSendOptions): void;
  /** 订阅消息，返回退订函数 */
  onMessage(handler: (envelope: CollabEnvelope) => void): () => void;
  /** 关闭通道（幂等） */
  close(): void;
}

/**
 * # 连接状态
 * 供使用方在 transport 之上自行上报 / 展示，组件库不强制使用
 */
export const CollabStatus = {
  /** 连接中 */
  Connecting: "connecting",
  /** 已连接 */
  Connected: "connected",
  /** 已关闭 */
  Closed: "closed",
} as const;

export type CollabStatusValue = (typeof CollabStatus)[keyof typeof CollabStatus];
