import { describe, expect, it } from "vitest";
import {
  DEFAULT_SHORTCUTS,
  findConflicts,
  matchEvent,
  normalizeKey,
  parseBinding,
  serializeEvent,
} from "../shortcut";

/** 构造伪键盘事件（仅取序列化/匹配所需字段） */
const ev = (overrides: Partial<KeyboardEvent>): KeyboardEvent =>
  ({
    key: "ArrowRight",
    ctrlKey: false,
    altKey: false,
    metaKey: false,
    shiftKey: false,
    ...overrides,
  }) as KeyboardEvent;

describe("shortcut 序列化", () => {
  it("Ctrl+Right 序列化为 ctrl+ArrowRight", () => {
    expect(serializeEvent(ev({ key: "ArrowRight", ctrlKey: true }))).toBe(
      "ctrl+ArrowRight",
    );
  });

  it("修饰键固定 ctrl+alt+meta+shift 顺序", () => {
    expect(
      serializeEvent(
        ev({
          key: "ArrowRight",
          ctrlKey: true,
          shiftKey: true,
          altKey: true,
          metaKey: true,
        }),
      ),
    ).toBe("ctrl+alt+meta+shift+ArrowRight");
  });

  it("纯修饰键按下返回 null", () => {
    expect(serializeEvent(ev({ key: "Control", ctrlKey: true }))).toBeNull();
    expect(serializeEvent(ev({ key: "Shift", shiftKey: true }))).toBeNull();
  });

  it("空格归一化为 Space，单字符转小写", () => {
    expect(serializeEvent(ev({ key: " " }))).toBe("Space");
    expect(serializeEvent(ev({ key: "Q" }))).toBe("q");
  });

  it("单字符变形键不记录 shift（避免 shift+?）", () => {
    expect(serializeEvent(ev({ key: "?", shiftKey: true }))).toBe("?");
    expect(serializeEvent(ev({ key: "ArrowRight", shiftKey: true }))).toBe(
      "shift+ArrowRight",
    );
  });

  it("normalizeKey 空格与大小写", () => {
    expect(normalizeKey(" ")).toBe("Space");
    expect(normalizeKey("A")).toBe("a");
    expect(normalizeKey("ArrowLeft")).toBe("ArrowLeft");
  });
});

describe("shortcut 解析与匹配", () => {
  it("parseBinding 还原修饰键与 key", () => {
    expect(parseBinding("ctrl+ArrowRight")).toEqual({
      ctrl: true,
      alt: false,
      meta: false,
      shift: false,
      key: "ArrowRight",
    });
  });

  it("parseBinding 兼容 key 本身为 + 的序列化结果", () => {
    const serialized = serializeEvent(ev({ key: "+", ctrlKey: true }));
    expect(serialized).toBe("ctrl++");
    expect(parseBinding("ctrl++")).toEqual({
      ctrl: true,
      alt: false,
      meta: false,
      shift: false,
      key: "+",
    });
  });

  it("matchEvent 命中默认键位", () => {
    expect(matchEvent(ev({ ctrlKey: true }), "ctrl+ArrowRight")).toBe(true);
    expect(matchEvent(ev({}), "ctrl+ArrowRight")).toBe(false);
  });

  it("matchEvent 修饰键顺序无关", () => {
    expect(
      matchEvent(
        ev({ ctrlKey: true, shiftKey: true }),
        "shift+ctrl+ArrowRight",
      ),
    ).toBe(true);
    expect(matchEvent(ev({ ctrlKey: true }), "shift+ctrl+ArrowRight")).toBe(
      false,
    );
  });

  it("单字符键位不比较 shift（键盘布局差异容错）", () => {
    expect(matchEvent(ev({ key: "/", ctrlKey: true, shiftKey: true }), "ctrl+/")).toBe(true);
    expect(matchEvent(ev({ key: "/", ctrlKey: true }), "ctrl+/")).toBe(true);
    expect(matchEvent(ev({ key: "/", shiftKey: true }), "ctrl+/")).toBe(false);
  });
});

describe("findConflicts 冲突检测", () => {
  it("默认键位下 Ctrl+Right 与聚焦下一个冲突", () => {
    expect(findConflicts("ctrl+ArrowRight", DEFAULT_SHORTCUTS)).toEqual([
      "focusNext",
    ]);
  });

  it("排除自身 action", () => {
    expect(
      findConflicts("ArrowLeft", DEFAULT_SHORTCUTS, "pagePrev"),
    ).toEqual([]);
  });

  it("无冲突返回空数组", () => {
    expect(findConflicts("KeyQ", DEFAULT_SHORTCUTS)).toEqual([]);
  });
});
