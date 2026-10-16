//! 布局引擎性能基准（W9.2）
//! 运行：npx vitest run components/layout/engine/__tests__/benchmark.test.ts
//! 输出：布局计算耗时矩阵（实体规模 × 布局类型）+ LRU 缓存命中率（四类场景）
//! 断言宽松（耗时 > 0、命中率 ∈ [0,1] 与确定性场景的区间），避免 CI 机器抖动导致失败

import { describe, expect, it } from "vitest";
import { LayoutCompute } from "../compute";
import { LayoutCache } from "../cache";
import type { ComputeConfig } from "../compute";
import type { LayoutEntity } from "../../types";
import { DeviceTypes, LayoutTypes } from "../../types";

/** 构造测试实体 */
const makeEntities = (n: number): LayoutEntity[] =>
  Array.from({ length: n }, (_, i) => ({ id: `entity-${i}`, label: id(i) }));
const id = (i: number) => `entity-${i}`;

/** 构造完整计算配置（容器 1280×720 桌面端，grid 6 宫格） */
const buildConfig = (
  overrides: Partial<ComputeConfig> = {},
): ComputeConfig => ({
  entities: makeEntities(30),
  width: 1280,
  height: 720,
  fullScreen: false,
  deviceType: DeviceTypes.Desktop,
  layoutType: LayoutTypes.Grid,
  pageSize: 6,
  page: 1,
  railWidth: 220,
  railHeight: 140,
  fixedSize: true,
  gridFixedSize: false,
  aspectRatio: { w: 16, h: 9 },
  smart: true,
  ...overrides,
});

/** 简易基准：预热后采样 rounds 轮，返回 mean / p95（ms） */
const bench = (fn: () => void, rounds: number, warmup = 5) => {
  for (let i = 0; i < warmup; i++) fn();
  const samples: number[] = [];
  for (let i = 0; i < rounds; i++) {
    const t0 = performance.now();
    fn();
    samples.push(performance.now() - t0);
  }
  samples.sort((a, b) => a - b);
  const mean = samples.reduce((s, v) => s + v, 0) / samples.length;
  const p95 = samples[Math.min(samples.length - 1, Math.floor(samples.length * 0.95))];
  return { mean, p95 };
};

describe("布局计算耗时基准", () => {
  it("实体规模 × 布局类型矩阵", () => {
    const SIZES = [6, 12, 30, 60, 100];
    const LAYOUTS = [
      ["grid", LayoutTypes.Grid],
      ["focus", LayoutTypes.Focus],
    ] as const;

    const rows: Record<string, string | number>[] = [];
    for (const n of SIZES) {
      for (const [name, type] of LAYOUTS) {
        const entities = makeEntities(n);
        const config = buildConfig({
          entities,
          layoutType: type,
          // focus 布局需要聚焦实体，否则回退为 grid
          focusEntity: type === LayoutTypes.Focus ? entities[0] : null,
        });
        const { mean, p95 } = bench(
          () => LayoutCompute.compute(config),
          n > 30 ? 20 : 30,
        );
        rows.push({
          实体数: n,
          布局: name,
          "均值(ms)": mean.toFixed(3),
          "P95(ms)": p95.toFixed(3),
        });
      }
    }
    console.table(rows);
    for (const row of rows) {
      expect(Number(row["均值(ms)"])).toBeGreaterThan(0);
      expect(Number(row["P95(ms)"])).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("LRU 缓存命中率基准", () => {
  /** 缓存键基准形态（key = entityCount_layoutType_pageSize_deviceType_fullScreen_width_height） */
  const keyOf = (over: Record<string, unknown> = {}) => ({
    entityCount: 30,
    layoutType: LayoutTypes.Grid as typeof LayoutTypes.Grid,
    pageSize: 6,
    deviceType: "desktop" as const,
    fullScreen: false,
    width: 1280,
    height: 720,
    ...over,
  });

  it("场景一：重复同配置计算 → 期望接近全命中", () => {
    const cache = new LayoutCache();
    const key = keyOf();
    for (let i = 0; i < 100; i++) {
      const hit = cache.get(key);
      if (!hit) cache.set(key, new Map());
    }
    const stats = cache.getStats();
    console.table([
      { 场景: "重复同配置", ...stats, 命中率: `${((stats.hits / (stats.hits + stats.misses)) * 100).toFixed(1)}%` },
    ]);
    expect(stats.hits + stats.misses).toBe(100);
    // set 一次后同一 key 必然命中（确定性）
    expect(stats.hits).toBe(99);
  });

  it("场景二：翻页/聚焦切换（page 与 focus 不在缓存键中）→ 命中即复用", () => {
    const cache = new LayoutCache();
    for (let page = 1; page <= 50; page++) {
      // 翻页只改变 page：LayoutCache 的键不含 page，等价于同配置重复计算
      const hit = cache.get(keyOf());
      if (!hit) cache.set(keyOf(), new Map());
    }
    const stats = cache.getStats();
    console.table([
      { 场景: "翻页(键不含page)", ...stats, 命中率: `${((stats.hits / (stats.hits + stats.misses)) * 100).toFixed(1)}%` },
    ]);
    // 注意：这意味着翻页后拿到的是旧 page 的节点数据（正确性隐患，见 benchmark 报告）
    expect(stats.hits).toBe(49);
  });

  it("场景三：连续 resize（每轮宽度 +7px）→ 期望低命中", () => {
    const cache = new LayoutCache();
    for (let i = 0; i < 60; i++) {
      const key = keyOf({ width: 1280 + i * 7 });
      const hit = cache.get(key);
      if (!hit) cache.set(key, new Map());
    }
    const stats = cache.getStats();
    console.table([
      { 场景: "连续resize", ...stats, 命中率: `${((stats.hits / (stats.hits + stats.misses)) * 100).toFixed(1)}%` },
    ]);
    // 每轮尺寸都是新键，精确匹配全部 miss
    expect(stats.hits).toBe(0);
    // 60 条写入触发 LRU 淘汰，条目数不超过上限 50
    expect(stats.size).toBeLessThanOrEqual(50);
  });

  it("场景四：实体进出（entityCount 递变）→ 期望低命中", () => {
    const cache = new LayoutCache();
    // 会议室成员进出的往返序列：30 → 80 → 30，共 101 步
    for (let i = 0; i <= 50; i++) {
      const key = keyOf({ entityCount: 30 + i });
      const hit = cache.get(key);
      if (!hit) cache.set(key, new Map());
    }
    for (let i = 49; i >= 0; i--) {
      const key = keyOf({ entityCount: 30 + i });
      const hit = cache.get(key);
      if (!hit) cache.set(key, new Map());
    }
    const stats = cache.getStats();
    console.table([
      { 场景: "实体进出", ...stats, 命中率: `${((stats.hits / (stats.hits + stats.misses)) * 100).toFixed(1)}%` },
    ]);
    // 去程 51 步全 miss（新实体数）；回程 49 步命中去程条目（仅 entityCount=30
    // 那条被 LRU 淘汰，30 步本身仍 miss）→ LRU 对成员往返进出有真实收益
    expect(stats.hits).toBe(49);
    expect(stats.size).toBeLessThanOrEqual(50);
  });
});
