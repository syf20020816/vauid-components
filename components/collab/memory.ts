//! 内存 Transport（测试 / 单机联调用）
//! createMemoryTransportPair 创建一对直连端点：send 同步按序直达对端（reliable-ordered 语义）
//! close 后本端不可再 send，向已关闭一侧投递同样抛错；close 幂等

import type { CollabEnvelope, CollabTransport } from "./types";

/** 单端内部状态：订阅列表 + 关闭标记 */
interface MemorySide {
  handlers: Set<(envelope: CollabEnvelope) => void>;
  closed: boolean;
}

/**
 * # createMemoryTransportPair - 内存双端通道
 * 返回互为对端的 [A, B] 两个 CollabTransport：
 * - A.send 的信封同步、按调用顺序投递到 B 的订阅者（反之亦然），
 *   天然满足 reliable-ordered，Yjs 双 doc 同步无需等待
 * - send 的 options 保留在接口上，内存通道恒为可靠有序，忽略该差异
 */
export function createMemoryTransportPair(): [CollabTransport, CollabTransport] {
  const sideA: MemorySide = { handlers: new Set(), closed: false };
  const sideB: MemorySide = { handlers: new Set(), closed: false };

  const build = (own: MemorySide, peer: MemorySide): CollabTransport => ({
    // 少参实现即可满足 send(envelope, options?) 的签名（options 对内存通道无意义）
    send(envelope) {
      if (own.closed) {
        throw new Error("[collab] 内存通道本端已关闭，无法 send");
      }
      if (peer.closed) {
        throw new Error("[collab] 内存通道对端已关闭，无法投递");
      }
      // Map/Set 迭代统一 Array.from 包裹（IDE downlevelIteration 规避，项目先例）
      for (const handler of Array.from(peer.handlers)) {
        handler(envelope);
      }
    },
    onMessage(handler) {
      own.handlers.add(handler);
      return () => {
        own.handlers.delete(handler);
      };
    },
    close() {
      own.closed = true;
      own.handlers.clear();
    },
  });

  return [build(sideA, sideB), build(sideB, sideA)];
}
