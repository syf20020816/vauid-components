//! 布局计算方式

import type { Nullable } from "../../_std";
import type {
  LayoutEntity,
  LayoutNode,
  LayoutType,
  LayoutNodes,
  DeviceType,
  LayoutStyleProperties,
} from "../types";
import { Areas, DeviceTypes, LayoutTypes } from "../types";

const Z_INDEX = {
  Main: 2,
  Rail: 1,
  Float: 3,
};

const RATIOS = {
  /** 移动端主区占比 */
  MOBILE_FOCUS_MAIN: 0.72,
  /** 桌面端侧边栏占比 */
  DESKTOP_FOCUS_RAIL: 0.28,
};

const LAYOUT_GAP = 4;

/**
 * # 布局计算配置
 * 每次计算时由 Engine 传入当前状态
 */
export interface ComputeConfig<Entity extends LayoutEntity = LayoutEntity> {
  entities: Entity[];
  height: number;
  width: number;
  focusEntity?: Nullable<Entity>;
  fullScreen: boolean;
  deviceType: DeviceType;
  layoutType: LayoutType;
  pageSize: number;
  page: number;
  minRailWidth: number;
  maxRailWidth: number;
  fixedSize: boolean;
  aspectRatio: { w: number; h: number };
}

/**
 * # LayoutCompute
 * 纯布局计算类，不维护任何状态，所有数据通过方法参数传入
 * 只负责根据输入的配置计算出布局结果
 */
export class LayoutCompute {
  /**
   * ## 计算布局
   * 根据传入的配置计算每个实体的布局位置和大小
   *
   * 计算顺序如下：
   * 1. 先校验容器尺寸和实体集合是否有效。
   * 2. 再校验 focusEntity 是否仍存在于当前 entities 中，不存在就自动回退为 grid。
   * 3. 如果处于 fullScreen，则只输出一个覆盖整个容器的 main 节点。
   * 4. 否则根据 layoutType 进入 grid 或 focus 计算。
   */
  static compute<Entity extends LayoutEntity>(
    config: ComputeConfig<Entity>,
    styleBuildFn?: (node: LayoutNode<Entity>) => LayoutStyleProperties,
  ): LayoutNodes<Entity> {
    const activeFocusEntity = this.resolveFocusEntity(config);
    // 如果尺寸无效或者没有实体，则直接返回空布局。
    if (
      config.width <= 0 ||
      config.height <= 0 ||
      config.entities.length === 0
    ) {
      return new Map();
    }
    // 如果是 全屏 模式，那么默认只会有一个布局节点，即 focusEntity（如果有的话，否则使用第一个实体），并且这个节点会占满整个容器。
    if (config.fullScreen) {
      const fullScreenEntity =
        activeFocusEntity ??
        this.getEntitiesForCurrentPage(
          config.entities,
          config.pageSize,
          config.page,
        )[0] ??
        config.entities[0];
      if (fullScreenEntity) {
        const nodes = new Map<string, LayoutNode<Entity>>();
        const node: LayoutNode<Entity> = {
          entity: fullScreenEntity,
          x: 0,
          y: 0,
          width: config.width,
          height: config.height,
          area: Areas.Main,
          page: 1,
          isFocus: true,
          zIndex: Z_INDEX.Main,
          hidden: false,
        };
        node.styleSheet = styleBuildFn?.(node);
        nodes.set(fullScreenEntity.id, node);
        return nodes;
      }
      return new Map();
    }

    return this.isFocus(config.layoutType) && activeFocusEntity
      ? this.computeFocusLayout(config, activeFocusEntity, styleBuildFn)
      : this.computeGridLayout(config, styleBuildFn);
  }

  /**
   * 计算标准网格布局。
   */
  private static computeGridLayout<Entity extends LayoutEntity>(
    config: ComputeConfig<Entity>,
    styleBuildFn?: (node: LayoutNode<Entity>) => LayoutStyleProperties,
  ): LayoutNodes<Entity> {
    const pageEntities = this.getEntitiesForCurrentPage(
      config.entities,
      config.pageSize,
      config.page,
    );
    const pageEntityIds = new Set(pageEntities.map((e) => e.id));
    const { columns, rows } = this.resolveGridDimensions(
      pageEntities.length,
      config.width,
      config.height,
      config.deviceType,
    );
    const cellWidth = this.resolveCellSize(
      config.width,
      columns,
      "width",
      config.height,
      config.aspectRatio,
      config.fixedSize,
    );
    const cellHeight = this.resolveCellSize(
      config.height,
      rows,
      "height",
      config.width,
      config.aspectRatio,
      config.fixedSize,
    );

    const layoutMap = new Map<string, LayoutNode<Entity>>();
    config.entities.forEach((entity) => {
      const isCurrentPage = pageEntityIds.has(entity.id);
      if (!isCurrentPage) {
        const node: LayoutNode<Entity> = {
          entity,
          x: 0,
          y: 0,
          width: 0,
          height: 0,
          area: Areas.Grid,
          page: config.page,
          isFocus: false,
          zIndex: 1,
          hidden: true,
        };
        node.styleSheet = styleBuildFn?.(node);
        layoutMap.set(entity.id, node);
        return;
      }

      const pageEntityIndex = pageEntities.findIndex((e) => e.id === entity.id);
      const columnIndex = pageEntityIndex % columns;
      const rowIndex = Math.floor(pageEntityIndex / columns);

      const node: LayoutNode<Entity> = {
        entity,
        x: columnIndex * (cellWidth + LAYOUT_GAP),
        y: rowIndex * (cellHeight + LAYOUT_GAP),
        width: cellWidth,
        height: cellHeight,
        area: Areas.Grid,
        page: config.page,
        isFocus: false,
        zIndex: 1,
        hidden: false,
      };
      node.styleSheet = styleBuildFn?.(node);
      layoutMap.set(entity.id, node);
    });
    return layoutMap;
  }

  /**
   * 推导 grid 布局的行列数。
   */
  private static resolveGridDimensions(
    entityCount: number,
    width: number,
    height: number,
    deviceType: DeviceType,
  ) {
    if (entityCount <= 1) {
      return { columns: 1, rows: 1 };
    }

    if (deviceType === DeviceTypes.Mobile) {
      const isPortrait = height >= width;
      if (entityCount === 2) {
        return isPortrait ? { columns: 1, rows: 2 } : { columns: 2, rows: 1 };
      }

      if (entityCount <= 4) {
        return { columns: 2, rows: 2 };
      }
    }

    const containerAspect = width / Math.max(height, 1);
    const columns = Math.max(
      1,
      Math.ceil(Math.sqrt(entityCount * containerAspect)),
    );
    const rows = Math.max(1, Math.ceil(entityCount / columns));

    return { columns, rows };
  }

  /**
   * 计算 focus 布局。
   */
  private static computeFocusLayout<Entity extends LayoutEntity>(
    config: ComputeConfig<Entity>,
    focusEntity: Entity,
    styleBuildFn?: (node: LayoutNode<Entity>) => LayoutStyleProperties,
  ): LayoutNodes<Entity> {
    const restEntities = config.entities.filter(
      (entity) => !this.isSameEntity(entity, focusEntity),
    );
    const visibleRailEntities = this.getEntitiesForCurrentPage(
      restEntities,
      config.pageSize,
      config.page,
    );

    if (visibleRailEntities.length === 0) {
      const nodes = new Map<string, LayoutNode<Entity>>();
      const node: LayoutNode<Entity> = {
        entity: focusEntity,
        x: 0,
        y: 0,
        width: config.width,
        height: config.height,
        area: Areas.Main,
        page: 1,
        isFocus: true,
        zIndex: Z_INDEX.Main,
        hidden: false,
      };
      node.styleSheet = styleBuildFn?.(node);
      nodes.set(focusEntity.id, node);
      return nodes;
    }

    return config.deviceType === DeviceTypes.Mobile
      ? this.computeMobileFocusLayout(config, focusEntity, visibleRailEntities, styleBuildFn)
      : this.computeDesktopFocusLayout(
          config,
          focusEntity,
          visibleRailEntities,
          styleBuildFn,
        );
  }

  /**
   * ## 计算单个网格单元在指定轴上的尺寸。
   */
  private static resolveCellSize(
    totalSize: number,
    divisions: number,
    axis: "width" | "height",
    crossSize: number,
    aspectRatio: { w: number; h: number },
    fixedSize: boolean,
  ) {
    if (fixedSize) {
      const availableSize =
        divisions <= 1
          ? totalSize
          : (totalSize - LAYOUT_GAP * (divisions - 1)) / divisions;

      if (axis === "width") {
        const maxFromHeight = (crossSize * aspectRatio.w) / aspectRatio.h;
        return Math.min(availableSize, maxFromHeight);
      } else {
        const maxFromWidth = (crossSize * aspectRatio.h) / aspectRatio.w;
        return Math.min(availableSize, maxFromWidth);
      }
    } else {
      if (divisions <= 1) {
        return totalSize;
      }
      return Math.max(
        (totalSize - LAYOUT_GAP * (divisions - 1)) / divisions,
        0,
      );
    }
  }

  /**
   * 桌面端 focus 布局。
   */
  private static computeDesktopFocusLayout<Entity extends LayoutEntity>(
    config: ComputeConfig<Entity>,
    focusEntity: Entity,
    railEntities: Entity[],
    styleBuildFn?: (node: LayoutNode<Entity>) => LayoutStyleProperties,
  ): LayoutNodes<Entity> {
    const railWidth = Math.min(
      Math.max(config.width * RATIOS.DESKTOP_FOCUS_RAIL, config.minRailWidth),
      config.maxRailWidth,
    );
    const mainWidth = Math.max(config.width - railWidth - LAYOUT_GAP, 0);
    const railItemHeight = this.resolveCellSize(
      config.height,
      railEntities.length,
      "height",
      config.width,
      config.aspectRatio,
      config.fixedSize,
    );

    const result = new Map<string, LayoutNode<Entity>>();
    const focusNode: LayoutNode<Entity> = {
      entity: focusEntity,
      x: railWidth + LAYOUT_GAP,
      y: 0,
      width: mainWidth,
      height: config.height,
      area: Areas.Main,
      page: config.page,
      isFocus: true,
      zIndex: 2,
      hidden: false,
    };
    focusNode.styleSheet = styleBuildFn?.(focusNode);
    result.set(focusEntity.id, focusNode);

    railEntities.forEach((entity, index) => {
      const node: LayoutNode<Entity> = {
        entity,
        x: 0,
        y: index * (railItemHeight + LAYOUT_GAP),
        width: railWidth,
        height: railItemHeight,
        area: Areas.Rail,
        page: config.page,
        isFocus: false,
        zIndex: 1,
        hidden: false,
      };
      node.styleSheet = styleBuildFn?.(node);
      result.set(entity.id, node);
    });

    return result;
  }

  /**
   * 移动端 focus 布局。
   */
  private static computeMobileFocusLayout<Entity extends LayoutEntity>(
    config: ComputeConfig<Entity>,
    focusEntity: Entity,
    railEntities: Entity[],
    styleBuildFn?: (node: LayoutNode<Entity>) => LayoutStyleProperties,
  ): LayoutNodes<Entity> {
    const mainHeight = Math.max(config.height * RATIOS.MOBILE_FOCUS_MAIN, 0);
    const railHeight = Math.max(config.height - mainHeight - LAYOUT_GAP, 0);
    const railItemWidth = this.resolveCellSize(
      config.width,
      railEntities.length,
      "width",
      config.height,
      config.aspectRatio,
      config.fixedSize,
    );

    const result = new Map<string, LayoutNode<Entity>>();
    const focusNode: LayoutNode<Entity> = {
      entity: focusEntity,
      x: 0,
      y: 0,
      width: config.width,
      height: mainHeight,
      area: Areas.Main,
      page: config.page,
      isFocus: true,
      zIndex: 2,
      hidden: false,
    };
    focusNode.styleSheet = styleBuildFn?.(focusNode);
    result.set(focusEntity.id, focusNode);

    railEntities.forEach((entity, index) => {
      const node: LayoutNode<Entity> = {
        entity,
        x: index * (railItemWidth + LAYOUT_GAP),
        y: mainHeight + LAYOUT_GAP,
        width: railItemWidth,
        height: railHeight,
        area: Areas.Rail,
        page: config.page,
        isFocus: false,
        zIndex: 1,
        hidden: false,
      };
      node.styleSheet = styleBuildFn?.(node);
      result.set(entity.id, node);
    });

    return result;
  }

  // --- 分页相关 ---------------------------------------------------------------------------------

  /**
   * 根据当前 page 对传入的实体集合做分页切片。
   */
  private static getEntitiesForCurrentPage<Entity extends LayoutEntity>(
    entities: Entity[],
    pageSize: number,
    page: number,
  ): Entity[] {
    if (entities.length === 0) {
      return [];
    }

    const totalPages = this.totalPages(entities, pageSize, page, false, null);
    const currentPage = Math.min(Math.max(page, 1), totalPages);

    const startIndex = (currentPage - 1) * pageSize;
    return entities.slice(startIndex, startIndex + pageSize);
  }

  /**
   * 计算总页数。
   */
  static totalPages<Entity extends LayoutEntity>(
    entities: Entity[],
    pageSize: number,
    _page: number,
    fullScreen: boolean,
    focusEntity: Nullable<Entity>,
  ): number {
    if (fullScreen) {
      return 1;
    }

    const pagedEntityCount = focusEntity
      ? entities.filter((entity) => !this.isSameEntity(entity, focusEntity))
          .length
      : entities.length;

    return Math.max(1, Math.ceil(pagedEntityCount / pageSize));
  }

  // --- 辅助方法 ---------------------------------------------------------------------------------

  /**
   * 校验并返回当前可用的 focusEntity。
   */
  private static resolveFocusEntity<Entity extends LayoutEntity>(
    config: ComputeConfig<Entity>,
  ): Nullable<Entity> {
    if (!config.focusEntity) {
      return null;
    }

    const matchedEntity = config.entities.find((entity) =>
      this.isSameEntity(entity, config.focusEntity as Entity),
    );

    return matchedEntity || null;
  }

  /** 是否处于聚焦布局模式 */
  private static isFocus(layoutType: LayoutType): boolean {
    return layoutType === LayoutTypes.Focus;
  }

  /** 判断两个实体是否可以视为同一个布局节点。 */
  private static isSameEntity<Entity extends LayoutEntity>(
    leftEntity: Entity,
    rightEntity: Entity,
  ): boolean {
    const sameId = leftEntity.id === rightEntity.id;
    const sameSource = leftEntity?.source === rightEntity?.source;
    const sameCategory = leftEntity?.category === rightEntity?.category;
    return (sameId && sameSource && sameCategory) || sameId;
  }
}
