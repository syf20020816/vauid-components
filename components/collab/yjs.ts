//! Yjs ↔ CollabTransport 桥（10.3b）
//! 把 doc 增量 update（及可选 awareness presence）桥接到注入的 Transport，
//! 替代 y-webrtc / y-websocket 自建 provider；先 reliable-only 最小版
//! 回环防护：远端 apply 一律带 REMOTE_ORIGIN 作为 transaction origin，发送侧据此过滤

import * as Y from "yjs";
import { applyAwarenessUpdate, encodeAwarenessUpdate } from "y-protocols/awareness";
import type { Awareness } from "y-protocols/awareness";
import {
  CollabMessageTypes,
  type CollabEnvelope,
  type CollabMessageType,
  type CollabTransport,
} from "./types";
import { createSeq } from "./envelope";

/** createYjsBridge 可选项 */
export interface YjsBridgeOptions {
  /** 可选 awareness 实例（光标/选区等 presence 状态），存在时自动双向同步 */
  awareness?: Awareness;
}

/** createYjsBridge 返回值 */
export interface YjsBridge {
  /**
   * 销毁桥：移除 doc / awareness 监听与 transport 的消息订阅。
   * 不关闭 transport 本身（通道生命周期归使用方管理）
   */
  destroy(): void;
}

/**
 * 远端 apply 的 transaction origin 标记。
 * y-websocket 同款「以 provider 为 origin」模式：apply 时传入，update/awareness
 * 事件会原样带出该 origin，发送侧据此识别「自己 apply 下来的远端数据」。
 */
const REMOTE_ORIGIN = Symbol("vauid-collab-remote");

/**
 * # createYjsBridge - 把 Y.Doc 的增量 update（及可选 awareness）桥接到 CollabTransport
 *
 * 回环防护方案（选型说明）：
 * - 本端直接修改（ymap.set 等）的 transaction origin 为 null → 正常发送
 * - 桥收到远端 update 后以 REMOTE_ORIGIN apply（Y.applyUpdate(doc, update, REMOTE_ORIGIN)），
 *   update / awareness 事件会带出该 origin → 发送侧 `origin === REMOTE_ORIGIN` 直接跳过，
 *   杜绝「收到 → apply → 再次 send」的广播回环
 * - 不用 `transaction.local === false` 过滤：它会把「使用方自行 applyUpdate」也吞掉
 *   （例如离线缓存恢复、第三方导入），origin 标记能精确区分「本桥 apply 的远端数据」
 *   与「其他来源的 apply」，后者仍会被正常广播给其他端点
 */
export function createYjsBridge(
  doc: Y.Doc,
  transport: CollabTransport,
  opts?: YjsBridgeOptions,
): YjsBridge {
  const nextSeq = createSeq();
  /** 统一登记的清理函数，destroy 时全量执行 */
  const cleanups: Array<() => void> = [];

  const sendEnvelope = (t: CollabMessageType, payload: CollabEnvelope["payload"]): void => {
    transport.send({ v: 1, t, seq: nextSeq(), ts: Date.now(), payload });
  };

  // ---- doc update：本端变更 → transport ----
  const docUpdateHandler = (update: Uint8Array, origin: unknown): void => {
    if (origin === REMOTE_ORIGIN) {
      return; // 回环防护：远端 apply 触发的 update 不再回发
    }
    sendEnvelope(CollabMessageTypes.YjsUpdate, update);
  };
  doc.on("update", docUpdateHandler);
  cleanups.push(() => {
    doc.off("update", docUpdateHandler);
  });

  // ---- transport → doc：远端 update 落到本地 doc ----
  cleanups.push(
    transport.onMessage((envelope) => {
      if (envelope.t !== CollabMessageTypes.YjsUpdate) {
        return;
      }
      // YjsUpdate 走二进制语义；非 Uint8Array 负载（JSON 形态误用）直接忽略
      if (!(envelope.payload instanceof Uint8Array)) {
        return;
      }
      Y.applyUpdate(doc, envelope.payload, REMOTE_ORIGIN);
    }),
  );

  // ---- awareness（可选）：presence 双向同步 ----
  const awareness = opts?.awareness;
  if (awareness) {
    const awarenessHandler = (
      change: { added: Array<number>; updated: Array<number>; removed: Array<number> },
      origin: unknown,
    ): void => {
      if (origin === REMOTE_ORIGIN) {
        return; // 回环防护：远端 awareness 不回发
      }
      const changedClients = change.added.concat(change.updated, change.removed);
      sendEnvelope(CollabMessageTypes.Awareness, encodeAwarenessUpdate(awareness, changedClients));
    };
    awareness.on("update", awarenessHandler);
    cleanups.push(() => {
      awareness.off("update", awarenessHandler);
    });

    cleanups.push(
      transport.onMessage((envelope) => {
        if (envelope.t !== CollabMessageTypes.Awareness) {
          return;
        }
        if (!(envelope.payload instanceof Uint8Array)) {
          return;
        }
        // origin 一并透传为 REMOTE_ORIGIN，保证本地 update 事件可据此过滤回环
        applyAwarenessUpdate(awareness, envelope.payload, REMOTE_ORIGIN);
      }),
    );
  }

  return {
    destroy() {
      for (const cleanup of cleanups) {
        cleanup();
      }
      cleanups.length = 0;
    },
  };
}
