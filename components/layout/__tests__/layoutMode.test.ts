import { describe, expect, it } from "vitest";
import { Engine } from "../engine";
import type { LayoutEntity, LayoutTypeId } from "../types";
import type { LayoutModeDefinition } from "../engine/layoutMode";

/** 构造最小实体 */
const ent = (id: string): LayoutEntity => ({ id, label: id });

const entIds = (engine: Engine): string[] =>
  engine.getState().entities.map((e) => e.id);

/** 构造自定义布局定义（compute 不参与断言，仅记录调用） */
const def = (
  type: string,
  label: string,
  onCompute?: (layoutType: LayoutTypeId) => void,
): LayoutModeDefinition => ({
  type,
  label,
  compute: (config) => {
    onCompute?.(config.layoutType);
    return new Map();
  },
});

describe("LayoutMode 注册器", () => {
  it("注册后可在注册表中查到", () => {
    const engine = new Engine();
    engine.registerLayoutMode(def("spotlight", "聚光"));
    expect(engine.getLayoutModes().map((d) => d.type)).toEqual(["spotlight"]);
  });

  it("内建布局类型拒绝注册", () => {
    const engine = new Engine();
    engine.registerLayoutMode(def("grid", "假网格"));
    expect(engine.getLayoutModes()).toHaveLength(0);
  });

  it("重复 type 覆盖且告警不新增", () => {
    const engine = new Engine();
    engine.registerLayoutMode(def("spotlight", "聚光"));
    engine.registerLayoutMode(def("spotlight", "聚光 V2"));
    const modes = engine.getLayoutModes();
    expect(modes).toHaveLength(1);
    expect(modes[0].label).toBe("聚光 V2");
  });

  it("注销后从注册表移除；注销当前激活布局回退 Grid", () => {
    const engine = new Engine();
    engine.setEntities([ent("A"), ent("B")]);
    engine.registerLayoutMode(def("spotlight", "聚光"));
    engine.activateLayout("spotlight");
    expect(engine.getLayoutType()).toBe("spotlight");
    engine.unregisterLayoutMode("spotlight");
    expect(engine.getLayoutModes()).toHaveLength(0);
    expect(engine.getLayoutType()).toBe("grid");
  });

  it("激活自定义布局时引擎调用其 compute 并传入 layoutType", () => {
    const engine = new Engine();
    let seen: LayoutTypeId | null = null;
    engine.registerLayoutMode(def("spotlight", "聚光", (t) => (seen = t)));
    engine.setEntities([ent("A")]);
    engine.activateLayout("spotlight");
    expect(seen).toBe("spotlight");
    expect(engine.getLayoutType()).toBe("spotlight");
  });
});

describe("cycleLayoutMode 循环切换", () => {
  it("按 Grid → Focus → FullScreen → 自定义 → Grid 循环", () => {
    const engine = new Engine();
    engine.setEntities([ent("A"), ent("B")]);
    engine.registerLayoutMode(def("spotlight", "聚光"));

    expect(engine.getLayoutType()).toBe("grid");
    engine.cycleLayoutMode();
    expect(engine.getLayoutType()).toBe("focus");
    // FullScreen 与 layoutType 正交：fullScreenFirst 不改 layoutType，仅置 fullScreen
    engine.cycleLayoutMode();
    expect(engine.getState().fullScreen).toBe(true);
    engine.cycleLayoutMode();
    // 自定义布局激活时清除全屏态
    expect(engine.getState().fullScreen).toBe(false);
    expect(engine.getLayoutType()).toBe("spotlight");
    engine.cycleLayoutMode();
    expect(engine.getLayoutType()).toBe("grid");
  });
});

describe("实体重排", () => {
  it("moveEntity 视觉语义：[A,B,C] moveEntity(A,2) → [B,C,A]", () => {
    const engine = new Engine();
    engine.setEntities([ent("A"), ent("B"), ent("C")]);
    engine.moveEntity("A", 2);
    expect(entIds(engine)).toEqual(["B", "C", "A"]);
  });

  it("moveEntity 索引越界时钳制到末尾", () => {
    const engine = new Engine();
    engine.setEntities([ent("A"), ent("B"), ent("C")]);
    engine.moveEntity("A", 99);
    expect(entIds(engine)).toEqual(["B", "C", "A"]);
  });

  it("reorderEntities 缺席 id 忽略（追加末尾）", () => {
    const engine = new Engine();
    engine.setEntities([ent("A"), ent("B"), ent("C")]);
    engine.reorderEntities(["B"]);
    expect(entIds(engine)).toEqual(["B", "A", "C"]);
  });

  it("reorderEntities 顺序未变化时跳过", () => {
    const engine = new Engine();
    engine.setEntities([ent("A"), ent("B"), ent("C")]);
    // 顺序一致：不应有任何副作用（此处仅验证顺序保持）
    engine.reorderEntities(["A", "B", "C"]);
    expect(entIds(engine)).toEqual(["A", "B", "C"]);
  });
});

describe("聚焦移动与空实体守卫", () => {
  it("focusStep 沿实体列表循环移动焦点", () => {
    const engine = new Engine();
    engine.setEntities([ent("A"), ent("B"), ent("C")]);
    engine.focusFirst();
    expect(engine.getState().focusEntity?.id).toBe("A");
    engine.focusNext();
    expect(engine.getState().focusEntity?.id).toBe("B");
    engine.focusPrev();
    expect(engine.getState().focusEntity?.id).toBe("A");
    engine.focusPrev();
    // 循环：首个再向前回绕到末个
    expect(engine.getState().focusEntity?.id).toBe("C");
  });

  it("无实体时 focusFirst/focusNext 安全返回", () => {
    const engine = new Engine();
    expect(() => engine.focusFirst()).not.toThrow();
    expect(() => engine.focusNext()).not.toThrow();
    expect(engine.getState().focusEntity).toBeFalsy();
  });
});
