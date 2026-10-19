//! 协作信封编解码与 seq 生成
//! 二进制形态：type(1 字节枚举索引) + seq(varUint) + ts(varUint) + payload(原始字节)
//! varUint 手写编码，不依赖 Node Buffer（dumi 环境二进制兼容）
//! JSON 形态：{"v":1,"t":...,"seq":...,"ts":...,"payload":...}，仅用于 JSON 安全负载

import {
  CollabMessageTypes,
  type CollabEnvelope,
  type CollabMessageType,
} from "./types";

/**
 * 二进制 envelope 的「type 索引 ↔ 消息类型」对照表。
 * 索引与 CollabMessageTypes 的声明顺序一一绑定（0..4），一旦对外发布不可调整，
 * 否则新旧端点二进制不兼容；新增消息类型只能追加到表尾。
 */
const BINARY_TYPE_TABLE: readonly CollabMessageType[] = [
  CollabMessageTypes.YjsUpdate,
  CollabMessageTypes.Pointer,
  CollabMessageTypes.Annotation,
  CollabMessageTypes.Awareness,
  CollabMessageTypes.Room,
];

/** 全部消息类型值集合（JSON 形态解码校验用） */
const MESSAGE_TYPE_SET: ReadonlySet<string> = new Set<string>(
  Object.values(CollabMessageTypes),
);

/**
 * # createSeq - 单调递增 seq 生成器（闭包工厂）
 * 每个 transport / 桥实例各持有一个，从 0 起步，用于支撑断线检测与重连续传
 */
export function createSeq(): () => number {
  let current = 0;
  return () => {
    const value = current;
    current += 1;
    return value;
  };
}

/** 写一个 varUint：每 7bit 一段 + 高位 continuation 标记（与 yjs/lib0 同款） */
function writeVarUint(bytes: number[], value: number): void {
  // seq/ts 可能 > 2^31（如 Date.now()），不能用位移，用除法保证精度（< 2^53 内精确）
  let num = value;
  while (num > 0b1111111) {
    bytes.push(0b10000000 | (0b1111111 & num));
    num = Math.floor(num / 128);
  }
  bytes.push(num);
}

/** 读一个 varUint；pos 为共享游标（decode 内部推进），越界立即报错 */
function readVarUint(bytes: Uint8Array, pos: { i: number }): number {
  let num = 0;
  let mult = 1;
  for (;;) {
    if (pos.i >= bytes.length) {
      throw new Error("[collab] varUint 解码越界：envelope 字节流不完整");
    }
    const byte = bytes[pos.i];
    pos.i += 1;
    num += (byte & 0b1111111) * mult;
    mult *= 128;
    if (byte < 0b10000000) {
      return num;
    }
  }
}

/**
 * 二进制编码 envelope（encodeEnvelopeJson 的兄弟形态）。
 * payload 必须是 Uint8Array（二进制形态只承载字节负载）；
 * JSON 安全负载请改用 encodeEnvelopeJson。
 * v 不编入二进制：版本由编码格式自身演进表达，结构变更时整体换协议。
 */
export function encodeEnvelope(envelope: CollabEnvelope): Uint8Array {
  const typeIndex = BINARY_TYPE_TABLE.indexOf(envelope.t);
  if (typeIndex < 0) {
    throw new Error(`[collab] 未知消息类型，无法二进制编码：${String(envelope.t)}`);
  }
  const payload = envelope.payload;
  if (!(payload instanceof Uint8Array)) {
    throw new TypeError(
      "[collab] 二进制编码要求 payload 为 Uint8Array，JSON 负载请使用 encodeEnvelopeJson",
    );
  }
  const header: number[] = [];
  // type：1 字节枚举索引（见 BINARY_TYPE_TABLE 顺序绑定说明）
  header.push(typeIndex);
  writeVarUint(header, envelope.seq);
  writeVarUint(header, envelope.ts);
  const bytes = new Uint8Array(header.length + payload.byteLength);
  bytes.set(header, 0);
  bytes.set(payload, header.length);
  return bytes;
}

/** 二进制解码 envelope（encodeEnvelope 的逆操作）；payload 为源字节的独立副本 */
export function decodeEnvelope(bytes: Uint8Array): CollabEnvelope {
  if (bytes.length < 1) {
    throw new Error("[collab] envelope 字节流为空");
  }
  const type = BINARY_TYPE_TABLE[bytes[0]];
  if (type === undefined) {
    throw new Error(`[collab] 未知的消息类型索引：${bytes[0]}`);
  }
  const pos = { i: 1 };
  const seq = readVarUint(bytes, pos);
  const ts = readVarUint(bytes, pos);
  // 用 slice 复制而非 subarray 引用，避免信封钉住外部大 buffer
  const payload = bytes.slice(pos.i);
  return { v: 1, t: type, seq, ts, payload };
}

/** JSON 编码 envelope（仅当 payload 为 JSON 安全值时使用；Uint8Array 会被 stringify 破坏） */
export function encodeEnvelopeJson(envelope: CollabEnvelope): string {
  return JSON.stringify({
    v: envelope.v,
    t: envelope.t,
    seq: envelope.seq,
    ts: envelope.ts,
    payload: envelope.payload,
  });
}

/** JSON 解码 envelope（encodeEnvelopeJson 的逆操作）；校验协议版本与消息类型合法性 */
export function decodeEnvelopeJson(json: string): CollabEnvelope {
  const raw = JSON.parse(json) as {
    v?: unknown;
    t?: unknown;
    seq?: unknown;
    ts?: unknown;
    payload?: unknown;
  };
  if (raw.v !== 1) {
    throw new Error(`[collab] 不支持的 envelope 协议版本：${String(raw.v)}`);
  }
  if (typeof raw.t !== "string" || !MESSAGE_TYPE_SET.has(raw.t)) {
    throw new Error(`[collab] 未知的消息类型：${String(raw.t)}`);
  }
  if (typeof raw.seq !== "number" || typeof raw.ts !== "number") {
    throw new Error("[collab] envelope 的 seq / ts 必须是 number");
  }
  return {
    v: 1,
    t: raw.t as CollabMessageType,
    seq: raw.seq,
    ts: raw.ts,
    payload: raw.payload,
  };
}
