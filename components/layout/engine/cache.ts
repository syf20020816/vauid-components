import type { LayoutNodes, LayoutType, LayoutEntity } from "../types";

/**
 * # 缓存键
 * 基于影响布局结果的核心维度生成唯一标识
 */
interface CacheKey {
  /** 实体数量 */
  entityCount: number;
  /** 布局类型 */
  layoutType: LayoutType;
  /** 每页显示数量 */
  pageSize: number;
  /** 设备类型 */
  deviceType: "mobile" | "desktop";
  /** 是否全屏 */
  fullScreen: boolean;
  /** 容器宽度 */
  width: number;
  /** 容器高度 */
  height: number;
}

/**
 * # 缓存条目
 * 存储一次完整计算的结果
 */
interface CacheEntry<Entity extends LayoutEntity = LayoutEntity> {
  /** 布局节点 */
  nodes: LayoutNodes<Entity>;
  /** 缓存时的容器尺寸 */
  containerSize: { width: number; height: number };
  /** 缓存时的实体数量 */
  entityCount: number;
  /** 缓存时的布局类型 */
  layoutType: LayoutType;
  /** 缓存时的每页数量 */
  pageSize: number;
  /** 缓存时的设备类型 */
  deviceType: "mobile" | "desktop";
  /** 缓存时的全屏状态 */
  fullScreen: boolean;
  /** 最后访问时间，用于 LRU 淘汰 */
  lastAccessed: number;
}

/**
 * # 尺寸推导配置
 * 用于在容器尺寸变化时快速推导节点尺寸，无需完整重算
 */
interface SizeDerivationConfig {
  /** 原始容器宽度 */
  originalWidth: number;
  /** 原始容器高度 */
  originalHeight: number;
  /** 目标容器宽度 */
  targetWidth: number;
  /** 目标容器高度 */
  targetHeight: number;
}

/**
 * # LayoutCache - 布局计算结果缓存
 *
 * ## 设计目标
 * 1. 缓存完整布局计算结果，避免相同条件下重复计算
 * 2. 分离容器尺寸与节点尺寸，支持容器微调时快速推导节点尺寸
 * 3. LRU 淘汰策略，控制内存占用
 *
 * ## 缓存策略
 * - 缓存键由 `entityCount + layoutType + pageSize + deviceType + fullScreen + width + height` 组成
 * - 当容器尺寸变化时，优先查找最接近的缓存条目，通过比例缩放快速推导新尺寸
 * - 只有当布局拓扑发生变化（实体数量变化、布局模式切换等）时才需要完整重算
 */
export class LayoutCache<Entity extends LayoutEntity = LayoutEntity> {
  /** 最大缓存条目数 */
  private maxEntries: number;
  /** 缓存存储 */
  private entries: Map<string, CacheEntry<Entity>> = new Map();
  /** 缓存命中统计 */
  private stats = { hits: 0, misses: 0, derivations: 0 };

  constructor(maxEntries: number = 50) {
    this.maxEntries = maxEntries;
  }

  /**
   * ## 生成缓存键
   * 基于影响布局结果的核心维度生成唯一标识
   */
  static generateKey(config: Omit<CacheKey, "width" | "height">): string {
    return `${config.entityCount}_${config.layoutType}_${config.pageSize}_${config.deviceType}_${config.fullScreen}`;
  }

  /**
   * ## 生成完整缓存键（含尺寸）
   */
  static generateFullKey(config: CacheKey): string {
    return `${this.generateKey(config)}_${Math.round(config.width)}_${Math.round(config.height)}`;
  }

  /**
   * ## 获取缓存
   * 精确匹配缓存键，命中则返回缓存的布局节点
   */
  get(config: CacheKey): LayoutNodes<Entity> | null {
    const key = LayoutCache.generateFullKey(config);
    const entry = this.entries.get(key);

    if (entry) {
      entry.lastAccessed = Date.now();
      this.stats.hits++;
      return entry.nodes;
    }

    this.stats.misses++;
    return null;
  }

  /**
   * ## 查找最接近的缓存条目
   * 当精确匹配未命中时，查找相同布局拓扑下尺寸最接近的缓存条目
   * 用于快速推导节点尺寸，避免完整重算
   */
  findNearest(
    config: CacheKey,
  ): CacheEntry<Entity> | null {
    const topologyKey = LayoutCache.generateKey(config);
    let nearestEntry: CacheEntry<Entity> | null = null;
    let minDistance = Infinity;

    for (const [key, entry] of this.entries) {
      if (!key.startsWith(topologyKey)) continue;

      const distance = this.calculateSizeDistance(
        entry.containerSize,
        config.width,
        config.height,
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearestEntry = entry;
      }
    }

    return nearestEntry;
  }

  /**
   * ## 快速推导节点尺寸
   * 基于缓存的布局结果，通过容器尺寸比例缩放快速推导新的节点尺寸
   *
   * 这个方法适用于容器尺寸微调的场景，例如窗口拖拽调整大小时，
   * 不需要重新计算整个布局，只需按比例缩放已有节点的宽高和坐标即可。
   *
   * @param cachedNodes 缓存的布局节点
   * @param config 尺寸推导配置
   * @returns 推导后的新布局节点
   */
  static deriveNodeSizes<Entity extends LayoutEntity = LayoutEntity>(
    cachedNodes: LayoutNodes<Entity>,
    config: SizeDerivationConfig,
  ): LayoutNodes<Entity> {
    const { originalWidth, originalHeight, targetWidth, targetHeight } = config;

    if (originalWidth <= 0 || originalHeight <= 0) {
      return cachedNodes;
    }

    const widthRatio = targetWidth / originalWidth;
    const heightRatio = targetHeight / originalHeight;

    const derivedNodes: LayoutNodes<Entity> = new Map();

    for (const [id, node] of cachedNodes) {
      derivedNodes.set(id, {
        ...node,
        x: node.x * widthRatio,
        y: node.y * heightRatio,
        width: node.width * widthRatio,
        height: node.height * heightRatio,
      });
    }

    return derivedNodes;
  }

  /**
   * ## 设置缓存
   * 将计算结果存入缓存，如果缓存已满则淘汰最久未使用的条目
   */
  set(config: CacheKey, nodes: LayoutNodes<Entity>): void {
    const key = LayoutCache.generateFullKey(config);

    // 如果缓存已满且是新条目，淘汰 LRU
    if (!this.entries.has(key) && this.entries.size >= this.maxEntries) {
      this.evictLRU();
    }

    this.entries.set(key, {
      nodes,
      containerSize: { width: config.width, height: config.height },
      entityCount: config.entityCount,
      layoutType: config.layoutType,
      pageSize: config.pageSize,
      deviceType: config.deviceType,
      fullScreen: config.fullScreen,
      lastAccessed: Date.now(),
    });
  }

  /**
   * ## 清除缓存
   */
  clear(): void {
    this.entries.clear();
    this.stats = { hits: 0, misses: 0, derivations: 0 };
  }

  /**
   * ## 获取缓存统计信息
   */
  getStats() {
    return { ...this.stats, size: this.entries.size };
  }

  /**
   * ## 淘汰最久未使用的缓存条目
   */
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.entries) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.entries.delete(oldestKey);
    }
  }

  /**
   * ## 计算尺寸距离
   * 用于查找最接近的缓存条目
   */
  private calculateSizeDistance(
    cachedSize: { width: number; height: number },
    targetWidth: number,
    targetHeight: number,
  ): number {
    const widthDiff = Math.abs(cachedSize.width - targetWidth);
    const heightDiff = Math.abs(cachedSize.height - targetHeight);
    return Math.sqrt(widthDiff * widthDiff + heightDiff * heightDiff);
  }
}
