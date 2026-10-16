//! 协作基座单测
//! 运行：npx vitest run components/collab/__tests__/collab.test.ts
//! 覆盖：envelope 二进制 / JSON roundtrip、seq 单调性、内存通道双向同步、
//!       Yjs 双 doc 经内存通道同步（含并发 set 收敛）、awareness 同步、destroy 后不再收发

import { describe, expect, it } from "vitest";
import * as Y from "yjs";
import { Awareness } from "y-protocols/awareness";
import {
  CollabMessageTypes,
  createMemoryTransportPair,
  createSeq,
  createYjsBridge,
  decodeEnvelope,
  decodeEnvelopeJson,
  encodeEnvelope,
  encodeEnvelopeJson,
  type CollabEnvelope,
} from "../index";

/** 构造一条二进制形态信封 */
const binaryEnvelope = (payload: Uint8Array): CollabEnvelope => ({
  v: 1,
  t: CollabMessageTypes.YjsUpdate,
  seq: 42,
  ts: 1729000000000,
  payload,
});

describe("collab/envelope", () => {
  it("二进制 roundtrip：type/seq/ts/payload 保真", () => {
    const envelope = binaryEnvelope(new Uint8Array([1, 2, 3, 255]));
    const decoded = decodeEnvelope(encodeEnvelope(envelope));
    expect(decoded.v).toBe(1);
    expect(decoded.t).toBe(CollabMessageTypes.YjsUpdate);
    expect(decoded.seq).toBe(42);
    expect(decoded.ts).toBe(1729000000000);
    expect(Array.from(decoded.payload as Uint8Array)).toEqual([1, 2, 3, 255]);
  });

  it("二进制 roundtrip：大 seq / 当前时间戳 / 空负载 / 其他消息类型", () => {
    const envelope: CollabEnvelope = {
      v: 1,
      t: CollabMessageTypes.Room,
      seq: 2 ** 40,
      ts: Date.now(),
      payload: new Uint8Array(0),
    };
    const decoded = decodeEnvelope(encodeEnvelope(envelope));
    expect(decoded.t).toBe(CollabMessageTypes.Room);
    expect(decoded.seq).toBe(2 ** 40);
    expect(decoded.ts).toBe(envelope.ts);
    expect((decoded.payload as Uint8Array).byteLength).toBe(0);
  });

  it("JSON roundtrip：JSON 安全负载保真", () => {
    const envelope: CollabEnvelope = {
      v: 1,
      t: CollabMessageTypes.Annotation,
      seq: 7,
      ts: 1729000000123,
      payload: { room: "r1", items: [1, "a", { ok: true }] },
    };
    const decoded = decodeEnvelopeJson(encodeEnvelopeJson(envelope));
    expect(decoded).toEqual(envelope);
  });

  it("seq 生成器单调递增，且各实例独立", () => {
    const seqA = createSeq();
    const seqB = createSeq();
    const a1 = seqA();
    const a2 = seqA();
    const a3 = seqA();
    expect(a1 < a2 && a2 < a3).toBe(true);
    expect(seqB()).toBe(a1); // 实例独立，各自从 0 起
  });
});

describe("collab/memory", () => {
  it("双向同步 + 顺序保真 + 退订", () => {
    const [a, b] = createMemoryTransportPair();
    const gotA: CollabEnvelope[] = [];
    const gotB: CollabEnvelope[] = [];
    const offA = a.onMessage((envelope) => {
      gotA.push(envelope);
    });
    b.onMessage((envelope) => {
      gotB.push(envelope);
    });

    const envelope: CollabEnvelope = {
      v: 1,
      t: CollabMessageTypes.Pointer,
      seq: 1,
      ts: 1,
      payload: { x: 1 },
    };
    a.send(envelope);
    b.send({ ...envelope, seq: 2 });
    expect(gotB.length).toBe(1);
    expect(gotA.length).toBe(1);
    expect(gotB[0].seq).toBe(1);
    expect(gotA[0].seq).toBe(2);

    // reliable-ordered：多条按调用顺序到达
    a.send({ ...envelope, seq: 3 });
    a.send({ ...envelope, seq: 4 });
    expect(gotB.map((item) => item.seq)).toEqual([1, 3, 4]);

    // 退订后不再接收
    offA();
    b.send({ ...envelope, seq: 5 });
    expect(gotA.length).toBe(1);
  });

  it("close 后 send 抛错，向已关闭对端投递也抛错，close 幂等", () => {
    const [a, b] = createMemoryTransportPair();
    const gotB: CollabEnvelope[] = [];
    b.onMessage((envelope) => {
      gotB.push(envelope);
    });
    a.close();
    a.close(); // 幂等
    expect(() =>
      a.send({ v: 1, t: CollabMessageTypes.Room, seq: 1, ts: 1, payload: null }),
    ).toThrow();
    expect(() =>
      b.send({ v: 1, t: CollabMessageTypes.Room, seq: 2, ts: 1, payload: null }),
    ).toThrow();
    expect(gotB.length).toBe(0);
    b.close();
  });
});

describe("collab/yjs bridge", () => {
  it("双 doc 经内存通道同步：单端写入 / 反向 / 并发收敛", () => {
    const [ta, tb] = createMemoryTransportPair();
    const docA = new Y.Doc();
    const docB = new Y.Doc();
    const bridgeA = createYjsBridge(docA, ta);
    const bridgeB = createYjsBridge(docB, tb);

    // 单端写入 → 另一端可读（含普通值与嵌套 JSON）
    docA.getMap("shared").set("count", 1);
    docA.getMap("shared").set("nested", { a: 1 });
    expect(docB.getMap("shared").get("count")).toBe(1);
    expect(docB.getMap("shared").toJSON()).toEqual({ count: 1, nested: { a: 1 } });

    // 反向同步
    docB.getMap("shared").set("from", "b");
    expect(docA.getMap("shared").get("from")).toBe("b");

    // 桥接后两端各自写入 → CRDT 收敛，最终状态一致
    docA.getMap("conflict").set("k", "a");
    docB.getMap("conflict").set("k", "b");
    expect(docA.getMap("conflict").get("k")).toBe(docB.getMap("conflict").get("k"));
    expect(docA.getMap("conflict").toJSON()).toEqual(docB.getMap("conflict").toJSON());

    bridgeA.destroy();
    bridgeB.destroy();
  });

  it("并发 set 收敛：两端离线各自写入，全量状态经桥互通后收敛", () => {
    // 最小桥只广播增量、不做初始全量同步（y-sync 握手不在 10.3b 范围），
    // 「入会即有历史状态」的并发场景由使用方先发一次 Y.encodeStateAsUpdate 全量帧，
    // 此处模拟该用法：两端写入互不知晓（真并发），再互通全量状态
    const docC = new Y.Doc();
    const docD = new Y.Doc();
    docC.getMap("m").set("k", "c");
    docD.getMap("m").set("k", "d");

    const [tc, td] = createMemoryTransportPair();
    const bridgeC = createYjsBridge(docC, tc);
    const bridgeD = createYjsBridge(docD, td);

    tc.send({
      v: 1,
      t: CollabMessageTypes.YjsUpdate,
      seq: 0,
      ts: 0,
      payload: Y.encodeStateAsUpdate(docC),
    });
    td.send({
      v: 1,
      t: CollabMessageTypes.YjsUpdate,
      seq: 1,
      ts: 0,
      payload: Y.encodeStateAsUpdate(docD),
    });

    const valueC = docC.getMap("m").get("k");
    expect(["c", "d"]).toContain(valueC);
    expect(docD.getMap("m").get("k")).toBe(valueC);
    expect(docC.getMap("m").toJSON()).toEqual(docD.getMap("m").toJSON());

    bridgeC.destroy();
    bridgeD.destroy();
  });

  it("awareness 状态同步：一端 setLocalState，另一端 getStates 可读", () => {
    const [ta, tb] = createMemoryTransportPair();
    const docA = new Y.Doc();
    const docB = new Y.Doc();
    const awarenessA = new Awareness(docA);
    const awarenessB = new Awareness(docB);
    createYjsBridge(docA, ta, { awareness: awarenessA });
    createYjsBridge(docB, tb, { awareness: awarenessB });

    awarenessA.setLocalState({ cursor: { x: 10, y: 20 }, name: "A" });
    expect(awarenessB.getStates().get(awarenessA.clientID)).toEqual({
      cursor: { x: 10, y: 20 },
      name: "A",
    });

    // 反向
    awarenessB.setLocalState({ name: "B" });
    expect(awarenessA.getStates().get(awarenessB.clientID)).toEqual({ name: "B" });

    // 增量更新已有字段
    awarenessA.setLocalStateField("cursor", { x: 0, y: 0 });
    expect(awarenessB.getStates().get(awarenessA.clientID)).toEqual({
      cursor: { x: 0, y: 0 },
      name: "A",
    });
  });

  it("destroy 后不再收发，transport 本身不受影响", () => {
    const [ta, tb] = createMemoryTransportPair();
    const docA = new Y.Doc();
    const docB = new Y.Doc();
    const bridgeA = createYjsBridge(docA, ta);
    createYjsBridge(docB, tb);

    bridgeA.destroy();

    // 本端变更不再外发
    docA.getMap("shared").set("k", "after-destroy");
    expect(docB.getMap("shared").has("k")).toBe(false);

    // 对端消息不再落入本端 doc（A 侧 transport 订阅已被 destroy 撤销）
    const remoteDoc = new Y.Doc();
    remoteDoc.getMap("shared").set("remote-key", "remote");
    tb.send({
      v: 1,
      t: CollabMessageTypes.YjsUpdate,
      seq: 0,
      ts: 0,
      payload: Y.encodeStateAsUpdate(remoteDoc),
    });
    expect(docA.getMap("shared").has("remote-key")).toBe(false);

    // destroy 只拆桥：transport 仍可正常收发
    const got: CollabEnvelope[] = [];
    const off = tb.onMessage((envelope) => {
      got.push(envelope);
    });
    ta.send({ v: 1, t: CollabMessageTypes.Room, seq: 1, ts: 0, payload: null });
    expect(got.length).toBe(1);
    off();
  });
});
