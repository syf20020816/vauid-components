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
  railWidth: number;
  fixedSize: boolean;
  /** grid 布局是否固定宽高比，默认 false（均分容器） */
  gridFixedSize: boolean;
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
    // 当 fixedSize 为 true 时，根据容器尺寸修正宽高比
    const effectiveAspectRatio = config.fixedSize
      ? this.fixAspectRatio(config.width, config.height)
      : config.aspectRatio;

    const effectiveConfig = { ...config, aspectRatio: effectiveAspectRatio };
    const activeFocusEntity = this.resolveFocusEntity(effectiveConfig);
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
      ? this.computeFocusLayout(effectiveConfig, activeFocusEntity, styleBuildFn)
      : this.computeGridLayout(effectiveConfig, styleBuildFn);
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
      config.pageSize,
      config.width,
      config.height,
      config.deviceType,
      config.aspectRatio,
      config.gridFixedSize,
    );
    // 计算每个单元格的可用宽高
    const availableCellWidth =
      columns <= 1
        ? config.width
        : (config.width - LAYOUT_GAP * (columns - 1)) / columns;
    const availableCellHeight =
      rows <= 1
        ? config.height
        : (config.height - LAYOUT_GAP * (rows - 1)) / rows;

    let cellWidth: number;
    let cellHeight: number;
    let offsetX = 0;
    let offsetY = 0;

    // 只有1个实体时，直接占满容器
    if (pageEntities.length <= 1) {
      cellWidth = config.width;
      cellHeight = config.height;
    } else if (config.gridFixedSize) {
      // 固定宽高比：从可用宽度推导理想高度
      const idealHeightFromWidth =
        (availableCellWidth * config.aspectRatio.h) / config.aspectRatio.w;
      // 从可用高度推导理想宽度
      const idealWidthFromHeight =
        (availableCellHeight * config.aspectRatio.w) / config.aspectRatio.h;

      // 选择更合适的方案：优先保证不超出容器
      if (idealHeightFromWidth <= availableCellHeight) {
        cellWidth = availableCellWidth;
        cellHeight = idealHeightFromWidth;
      } else {
        cellWidth = idealWidthFromHeight;
        cellHeight = availableCellHeight;
      }

      // 计算剩余空间并居中偏移
      const totalGridWidth = cellWidth * columns + LAYOUT_GAP * (columns - 1);
      const totalGridHeight = cellHeight * rows + LAYOUT_GAP * (rows - 1);
      offsetX = (config.width - totalGridWidth) / 2;
      offsetY = (config.height - totalGridHeight) / 2;
    } else {
      // 不固定宽高比，直接均分，无空隙
      cellWidth = availableCellWidth;
      cellHeight = availableCellHeight;
    }

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
        x: columnIndex * (cellWidth + LAYOUT_GAP) + offsetX,
        y: rowIndex * (cellHeight + LAYOUT_GAP) + offsetY,
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
   * 采用类似 flex 的策略：
   * 1. 实体数量为 1 时，占满整个容器（1列1行）
   * 2. 实体数量 > 1 时，列数必须是 pageSize 的约数
   * 3. 当 gridFixedSize 为 true 时，对每个候选列数计算填充率，选择最优方案
   * 4. 当 gridFixedSize 为 false 时，选择行列数最接近的方案（更方正）
   */
  private static resolveGridDimensions(
    entityCount: number,
    pageSize: number,
    width: number,
    height: number,
    deviceType: DeviceType,
    aspectRatio: { w: number; h: number },
    gridFixedSize: boolean,
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

    // 获取 pageSize 的所有约数（例如 pageSize=6 → [1, 2, 3, 6]）
    const getDivisors = (n: number): number[] => {
      const divs: number[] = [];
      for (let i = 1; i <= n; i++) {
        if (n % i === 0) divs.push(i);
      }
      return divs;
    };

    // 候选列数：pageSize 的约数，且不超过实体数量
    const candidates = getDivisors(pageSize).filter(c => c <= entityCount);

    if (!gridFixedSize) {
      // 不固定宽高比时，选择行列数最接近的方案（更方正）
      // 差值相同时根据容器宽高比决定：宽容器优先多列，高容器优先多行
      const containerAspect = width / height;
      let bestColumns = candidates[0];
      let bestDiff = Infinity;
      for (const cols of candidates) {
        const rows = Math.ceil(entityCount / cols);
        const diff = Math.abs(cols - rows);
        if (diff < bestDiff) {
          bestDiff = diff;
          bestColumns = cols;
        } else if (diff === bestDiff) {
          // 容器宽高比 > 1（宽 > 高）时优先多列，否则优先多行
          const preferMoreCols = containerAspect > 1;
          if (preferMoreCols && cols > bestColumns) {
            bestColumns = cols;
          } else if (!preferMoreCols && cols < bestColumns) {
            bestColumns = cols;
          }
        }
      }
      return { columns: bestColumns, rows: Math.ceil(entityCount / bestColumns) };
    }

    // gridFixedSize 为 true 时，选择容器填充率最高的方案
    let bestColumns = 1;
    let bestFillRate = -1;

    for (const cols of candidates) {
      const rows = Math.ceil(entityCount / cols);

      // 计算在该行列数下，每个单元格的可用空间
      const availableCellWidth =
        cols <= 1
          ? width
          : (width - LAYOUT_GAP * (cols - 1)) / cols;
      const availableCellHeight =
        rows <= 1
          ? height
          : (height - LAYOUT_GAP * (rows - 1)) / rows;

      // 计算实体在该单元格中能达到的实际尺寸（保持 aspectRatio 比例）
      const entityWidthFromW = availableCellWidth;
      const entityHeightFromW = (entityWidthFromW * aspectRatio.h) / aspectRatio.w;

      let actualEntityWidth: number;
      let actualEntityHeight: number;

      if (entityHeightFromW <= availableCellHeight) {
        // 宽度推导的高度能放下
        actualEntityWidth = entityWidthFromW;
        actualEntityHeight = entityHeightFromW;
      } else {
        // 高度放不下，用高度推导宽度
        actualEntityHeight = availableCellHeight;
        actualEntityWidth = (actualEntityHeight * aspectRatio.w) / aspectRatio.h;
      }

      // 容器填充率 = 所有实体总面积 / 容器总面积
      const totalEntityArea = actualEntityWidth * actualEntityHeight * entityCount;
      const containerArea = width * height;
      const fillRate = totalEntityArea / containerArea;

      if (fillRate > bestFillRate) {
        bestFillRate = fillRate;
        bestColumns = cols;
      }
    }

    return { columns: bestColumns, rows: Math.ceil(entityCount / bestColumns) };
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
    // pageSize 包含 focus 实体，所以 rail 中每页显示 pageSize - 1 个
    const railPageSize = Math.max(1, config.pageSize - 1);
    const visibleRailEntities = this.getEntitiesForCurrentPage(
      restEntities,
      railPageSize,
      config.page,
    );
    const visibleRailEntityIds = new Set(visibleRailEntities.map((e) => e.id));

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

      // 为所有非 focus 实体创建隐藏节点
      restEntities.forEach((entity) => {
        const hiddenNode: LayoutNode<Entity> = {
          entity,
          x: 0,
          y: 0,
          width: 0,
          height: 0,
          area: Areas.Rail,
          page: config.page,
          isFocus: false,
          zIndex: 1,
          hidden: true,
        };
        hiddenNode.styleSheet = styleBuildFn?.(hiddenNode);
        nodes.set(entity.id, hiddenNode);
      });

      return nodes;
    }

    // 使用 config.entities 而不是 restEntities，确保所有实体都有节点
    return config.deviceType === DeviceTypes.Mobile
      ? this.computeMobileFocusLayout(config, focusEntity, visibleRailEntities, visibleRailEntityIds, styleBuildFn)
      : this.computeDesktopFocusLayout(
          config,
          focusEntity,
          visibleRailEntities,
          visibleRailEntityIds,
          styleBuildFn,
        );
  }

  /**
   * ## 修正宽高比
   * 如果直接使用 height 和 width 做长宽比可能出现: 1020.23 : 710.1 这种值，但实际上我们更关心的是一个相对稳定的宽高比，比如 16:9 或 4:3，
   * 这样在 fixedSize 模式下推导单元尺寸时才不会出现过大或过小的情况。这个方法会根据当前的设备类型和容器尺寸，修正 aspectRatio 的值，使其更接近一个合理的宽高比。
   * @param currentW 当前原始宽度（可带小数）
   * @param currentH 当前原始高度（可带小数）
   * @returns 修正后的标准宽高比 { w: number, h: number }
   */
  private static fixAspectRatio(
    currentW: number,
    currentH: number,
  ): { w: number; h: number } {
    // 1. 安全判断：避免 0 或负数
    if (currentW <= 0 || currentH <= 0) {
      return { w: 16, h: 9 }; // 默认 fallback
    }

    // 2. 计算当前真实比例（宽/高）
    const currentRatio = currentW / currentH;

    // 3. 定义常用标准宽高比（你可以自由增删）
    const standardRatios = [
      { w: 16, h: 9, ratio: 16 / 9 },
      { w: 4, h: 3, ratio: 4 / 3 },
      { w: 3, h: 2, ratio: 3 / 2 },
      { w: 1, h: 1, ratio: 1 / 1 },
      { w: 2, h: 3, ratio: 2 / 3 },
      { w: 9, h: 16, ratio: 9 / 16 },
    ];

    // 4. 找到与当前比例最接近的标准比例
    let closest = standardRatios[0];
    let minDiff = Math.abs(currentRatio - closest.ratio);

    for (const item of standardRatios) {
      const diff = Math.abs(currentRatio - item.ratio);
      if (diff < minDiff) {
        minDiff = diff;
        closest = item;
      }
    }

    // 5. 返回修正后的干净比例
    return { w: closest.w, h: closest.h };
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
    visibleRailEntityIds: Set<string>,
    styleBuildFn?: (node: LayoutNode<Entity>) => LayoutStyleProperties,
  ): LayoutNodes<Entity> {
    // 1. rail 项目高度 = (容器高度 - gap) / (pageSize - 1)
    const railItemCount = config.pageSize - 1;
    const railItemHeight =
      railItemCount <= 1
        ? config.height
        : (config.height - LAYOUT_GAP * (railItemCount - 1)) / railItemCount;

    // 2. 根据 fixedSize 决定 rail 宽高
    let effectiveRailWidth: number;
    let effectiveRailItemHeight = railItemHeight;

    if (config.fixedSize) {
      // 固定宽高比：高度固定为容器高度/pageSize，从高度推导宽度
      effectiveRailItemHeight = railItemHeight;
      effectiveRailWidth = (railItemHeight * config.aspectRatio.w) / config.aspectRatio.h;
    } else {
      // 不固定宽高比，使用配置的 railWidth
      effectiveRailWidth = config.railWidth;
    }

    const effectiveMainWidth = Math.max(config.width - effectiveRailWidth - LAYOUT_GAP, 0);

    const result = new Map<string, LayoutNode<Entity>>();
    const focusNode: LayoutNode<Entity> = {
      entity: focusEntity,
      x: effectiveRailWidth + LAYOUT_GAP,
      y: 0,
      width: effectiveMainWidth,
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
        y: index * (effectiveRailItemHeight + LAYOUT_GAP),
        width: effectiveRailWidth,
        height: effectiveRailItemHeight,
        area: Areas.Rail,
        page: config.page,
        isFocus: false,
        zIndex: 1,
        hidden: false,
      };
      node.styleSheet = styleBuildFn?.(node);
      result.set(entity.id, node);
    });

    // 为 config.entities 中不可见的实体创建隐藏节点
    config.entities.forEach((entity) => {
      if (
        !this.isSameEntity(entity, focusEntity) &&
        !visibleRailEntityIds.has(entity.id)
      ) {
        const hiddenNode: LayoutNode<Entity> = {
          entity,
          x: 0,
          y: 0,
          width: 0,
          height: 0,
          area: Areas.Rail,
          page: config.page,
          isFocus: false,
          zIndex: 1,
          hidden: true,
        };
        hiddenNode.styleSheet = styleBuildFn?.(hiddenNode);
        result.set(entity.id, hiddenNode);
      }
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
    visibleRailEntityIds: Set<string>,
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

    // 为 config.entities 中不可见的实体创建隐藏节点
    config.entities.forEach((entity) => {
      if (
        !this.isSameEntity(entity, focusEntity) &&
        !visibleRailEntityIds.has(entity.id)
      ) {
        const hiddenNode: LayoutNode<Entity> = {
          entity,
          x: 0,
          y: 0,
          width: 0,
          height: 0,
          area: Areas.Rail,
          page: config.page,
          isFocus: false,
          zIndex: 1,
          hidden: true,
        };
        hiddenNode.styleSheet = styleBuildFn?.(hiddenNode);
        result.set(entity.id, hiddenNode);
      }
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

    // focus 模式下 rail 每页显示 pageSize - 1 个
    const railPageSize = focusEntity ? Math.max(1, pageSize - 1) : pageSize;

    return Math.max(1, Math.ceil(pagedEntityCount / railPageSize));
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
