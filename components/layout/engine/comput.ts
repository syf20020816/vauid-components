import { Nullable } from "../../_std";
import { LayoutEntity, LayoutNode, LayoutType, Area } from "../types";

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
 * # LayoutCompute
 * 负责根据当前的 entities、focusEntity、分页状态、设备类型等信息，计算出每个实体的布局位置和大小。
 * 计算出的布局会存储在 this.layoutNodes 中，供后续渲染使用。
 *
 * 这个类只做纯布局计算
 */
export class LayoutCompute<Entity extends LayoutEntity = LayoutEntity> {
  // 所有的布局实体。
  protected entities: Entity[];
  // 当前被选中的布局实体，如果有选中（切换）则会转为 focus 布局。
  protected focusEntity: Nullable<Entity> = null;
  // 是否全屏显示, 全屏显示时只会显示聚焦实体，且该实体会占满整个布局舞台
  fullScreen: boolean = false;
  // 外部容器宽高
  height: number = 0;
  width: number = 0;
  // 计算出的布局节点
  private layoutNodes: LayoutNode<Entity>[] = [];
  // 当前布局类型，默认为 grid
  layoutType: LayoutType = "grid";
  // 设备类型, 不同设备类型可能会有不同的布局策略，比如移动端可能更倾向于单列布局，桌面端则可以使用多列布局
  deviceType: "mobile" | "desktop" = "desktop";
  // 分页状态 ---------------------------------------
  // 当前页码
  page: number = 1;
  // 每页显示的实体数量
  pageSize: number = 2;
  // 侧边栏宽度限制
  minRailWidth: number = 180;
  maxRailWidth: number = 320;
  // 是否为固定单元尺寸，默认为true
  fixedSize: boolean = true;
  // 容器宽高比，用于在 fixedSize 模式下推导单元尺寸，默认为16:9
  private aspectRatio: { h: number; w: number } = { w: 16, h: 9 };

  // --- 构造方法 ---------------------------------------------------------------------------------
  constructor(entities: Entity[], height: number, width: number) {
    this.entities = entities;
    this.height = height;
    this.width = width;
    // 自动计算容器宽高比，后续在 fixedSize 模式下会用到这个值来推导单元尺寸，保证在不同容器尺寸下单元的大小都在一个合理的范围内。
    this.fixAspectRatio();
  }

  // --- 计算方法 ---------------------------------------------------------------------------------
  /**
   * 根据当前状态生成一份最新布局结果。
   *
   * 计算顺序如下：
   * 1. 先校验容器尺寸和实体集合是否有效。
   * 2. 再校验 focusEntity 是否仍存在于当前 entities 中，不存在就自动回退为 grid。
   * 3. 如果处于 fullScreen，则只输出一个覆盖整个容器的 main 节点。
   * 4. 否则根据 layoutType 进入 grid 或 focus 计算。
   *
   * 返回值会同时写入内部缓存，渲染层可通过 getLayoutNodes() 重复读取。
   */
  computeLayout() {
    const activeFocusEntity = this.resolveFocusEntity();
    // 如果尺寸无效或者没有实体，则直接返回空布局。
    if (this.width <= 0 || this.height <= 0 || this.entities.length === 0) {
      this.layoutNodes = [];
      return this.layoutNodes;
    }
    // 如果是 全屏 模式，那么默认只会有一个布局节点，即 focusEntity（如果有的话，否则使用第一个实体），并且这个节点会占满整个容器。
    if (this.fullScreen) {
      const fullScreenEntity =
        activeFocusEntity ??
        this.getEntitiesForCurrentPage(this.entities, 1)[0] ??
        this.entities[0];
      this.layoutNodes = fullScreenEntity
        ? [
            {
              entity: fullScreenEntity,
              x: 0,
              y: 0,
              width: this.width,
              height: this.height,
              area: Area.Main,
              page: 1,
              isFocus: true,
              zIndex: Z_INDEX.Main,
            },
          ]
        : [];
      return this.layoutNodes;
    }

    const computedNodes =
      this.isFocus() && activeFocusEntity
        ? this.computeFocusLayout(activeFocusEntity)
        : this.computeGridLayout();

    this.layoutNodes = computedNodes;
    return this.layoutNodes;
  }

  /**
   * 计算标准网格布局。
   *
   * 仅对当前页的实体进行排布，每个节点都会被映射到统一大小的网格单元中。
   * 网格的行列数会根据设备类型和容器比例做一个尽量接近方阵的估算。
   */
  private computeGridLayout(): LayoutNode<Entity>[] {
    const pageEntities = this.getEntitiesForCurrentPage(
      this.entities,
      this.pageSize,
    );
    const { columns, rows } = this.resolveGridDimensions(pageEntities.length);
    const cellWidth = this.resolveCellSize(this.width, columns);
    const cellHeight = this.resolveCellSize(this.height, rows);

    return pageEntities.map((entity, index) => {
      const columnIndex = index % columns;
      const rowIndex = Math.floor(index / columns);

      return {
        entity,
        x: columnIndex * (cellWidth + LAYOUT_GAP),
        y: rowIndex * (cellHeight + LAYOUT_GAP),
        width: cellWidth,
        height: cellHeight,
        area: Area.Grid,
        page: this.page,
        isFocus: false,
        zIndex: 1,
      };
    });
  }

  /**
   * 推导 grid 布局的行列数。
   *
   * mobile 端优先给出更稳定的固定排列，减少频繁横竖切换时的视觉跳变；
   * desktop 端则按容器宽高比估算一个尽量均衡的列数。
   */
  private resolveGridDimensions(entityCount: number) {
    if (entityCount <= 1) {
      return { columns: 1, rows: 1 };
    }

    if (this.isMobile()) {
      const isPortrait = this.height >= this.width;
      if (entityCount === 2) {
        return isPortrait ? { columns: 1, rows: 2 } : { columns: 2, rows: 1 };
      }

      if (entityCount <= 4) {
        return { columns: 2, rows: 2 };
      }
    }

    const containerAspect = this.width / Math.max(this.height, 1);
    const columns = Math.max(
      1,
      Math.ceil(Math.sqrt(entityCount * containerAspect)),
    );
    const rows = Math.max(1, Math.ceil(entityCount / columns));

    return { columns, rows };
  }

  /**
   * 计算 focus 布局。
   *
   * 规则是：
   * 1. focusEntity 永远作为 main 区输出。
   * 2. 其余实体进入 rail 区，并参与单独分页。
   * 3. desktop 采用左 rail 右 main。
   * 4. mobile 采用上 main 下 rail。
   */
  private computeFocusLayout(focusEntity: Entity): LayoutNode<Entity>[] {
    const restEntities = this.entities.filter(
      (entity) => !this.isSameEntity(entity, focusEntity),
    );
    const visibleRailEntities = this.getEntitiesForCurrentPage(
      restEntities,
      this.pageSize,
    );

    if (visibleRailEntities.length === 0) {
      return [
        {
          entity: focusEntity,
          x: 0,
          y: 0,
          width: this.width,
          height: this.height,
          area: Area.Main,
          page: 1,
          isFocus: true,
          zIndex: Z_INDEX.Main,
        },
      ];
    }

    return this.deviceType === "mobile"
      ? this.computeMobileFocusLayout(focusEntity, visibleRailEntities)
      : this.computeDesktopFocusLayout(focusEntity, visibleRailEntities);
  }

  /**
   * ## 计算单个网格单元在指定轴上的尺寸。
   * 会自动扣除 gap 的占用，保证最终节点总尺寸不会超出容器边界。
   * ### 注意事项
   * 但这会出现自适应高度，可能导致divisions过少或过少（在pageSize不合理）时，导致单个单元过大或过小的情况，
   * 因此在实际使用中，我们默认开启 this.fixedSize 模式，我们依据构造时计算的宽高比得到一个合理的大小
   */
  private resolveCellSize(totalSize: number, divisions: number) {
    if (divisions <= 1) {
      return totalSize;
    }

    if (this.fixedSize) {
      return Math.min(
        (totalSize - LAYOUT_GAP * (divisions - 1)) / divisions,
        (this.height * this.aspectRatio.w) / this.aspectRatio.h,
      );
    } else {
      return Math.max(
        (totalSize - LAYOUT_GAP * (divisions - 1)) / divisions,
        0,
      );
    }
  }

  /**
   * 桌面端 focus 布局。
   *
   * 主区在右侧，占据绝大多数宽度；其余节点在左侧垂直排列。后续也更容易接 transform 过渡。
   */
  private computeDesktopFocusLayout(
    focusEntity: Entity,
    railEntities: Entity[],
  ): LayoutNode<Entity>[] {
    // 侧边栏宽度根据总宽度和预设占比计算，同时设置最小值和最大值限制，避免过窄或过宽。这里设置
    const railWidth = Math.min(
      Math.max(this.width * RATIOS.DESKTOP_FOCUS_RAIL, this.minRailWidth),
      this.maxRailWidth,
    );
    const mainWidth = Math.max(this.width - railWidth - LAYOUT_GAP, 0);
    const railItemHeight = this.resolveCellSize(
      this.height,
      railEntities.length,
    );
    const railNodes = railEntities.map((entity, index) => ({
      entity,
      x: 0,
      y: index * (railItemHeight + LAYOUT_GAP),
      width: railWidth,
      height: railItemHeight,
      area: Area.Rail,
      page: this.page,
      isFocus: false,
      zIndex: 1,
    }));

    return [
      {
        entity: focusEntity,
        x: railWidth + LAYOUT_GAP,
        y: 0,
        width: mainWidth,
        height: this.height,
        area: Area.Main,
        page: this.page,
        isFocus: true,
        zIndex: 2,
      },
      ...railNodes,
    ];
  }

  /**
   * 移动端 focus 布局。
   *
   * 移动端优先保证主区的可视面积，因此让 main 节点占据上方大部分高度，
   * rail 节点缩成底部横向条带，便于后续做滑动切换或分页指示。
   */
  private computeMobileFocusLayout(
    focusEntity: Entity,
    railEntities: Entity[],
  ): LayoutNode<Entity>[] {
    const mainHeight = Math.max(this.height * RATIOS.MOBILE_FOCUS_MAIN, 0);
    const railHeight = Math.max(this.height - mainHeight - LAYOUT_GAP, 0);
    const railItemWidth = this.resolveCellSize(this.width, railEntities.length);
    const railNodes = railEntities.map((entity, index) => ({
      entity,
      x: index * (railItemWidth + LAYOUT_GAP),
      y: mainHeight + LAYOUT_GAP,
      width: railItemWidth,
      height: railHeight,
      area: "rail" as const,
      page: this.page,
      isFocus: false,
      zIndex: 1,
    }));

    return [
      {
        entity: focusEntity,
        x: 0,
        y: 0,
        width: this.width,
        height: mainHeight,
        area: Area.Main,
        page: this.page,
        isFocus: true,
        zIndex: 2,
      },
      ...railNodes,
    ];
  }

  /**
   * 只设置 focusEntity，不切换布局。
   */
  setFocusEntity(entity: Nullable<Entity>): void {
    this.focusEntity = entity;
  }

  // --- 分页相关 ---------------------------------------------------------------------------------

  /**
   * 根据当前 page 对传入的实体集合做分页切片。
   */
  private getEntitiesForCurrentPage(
    entities: Entity[],
    pageSize: number,
  ): Entity[] {
    if (entities.length === 0) {
      this.page = 1;
      return [];
    }

    // Math.max(1, Math.ceil(entities.length / pageSize))
    const totalPages = this.totalPages();
    this.page = Math.min(Math.max(this.page, 1), totalPages);

    const startIndex = (this.page - 1) * pageSize;
    return entities.slice(startIndex, startIndex + pageSize);
  }

  /** 设置当前页码 */
  setPage(page: number) {
    const totalPages = this.totalPages();
    if (page >= 1 && page <= totalPages) {
      this.page = page;
    }
  }

  setPageSize(pageSize: number) {
    if (pageSize > 0) {
      this.pageSize = pageSize;
    }
  }

  /**
   * 计算总页数。
   *
   * 这里至少返回 1，目的是让分页状态始终有一个稳定值，
   * 即使当前没有实体，外部也不需要处理 0 页这种特殊分支。
   */
  totalPages(): number {
    // 全屏模式下始终只有一页，必须退出全屏才能看到其他实体
    if (this.fullScreen) {
      return 1;
    }

    const activeFocusEntity = this.isFocus() ? this.resolveFocusEntity() : null;
    const pagedEntityCount = activeFocusEntity
      ? this.entities.filter(
          (entity) => !this.isSameEntity(entity, activeFocusEntity),
        ).length
      : this.entities.length;

    return Math.max(1, Math.ceil(pagedEntityCount / this.pageSize));
  }

  /** 跳转到下一页 */
  nextPage(): void {
    const totalPages = this.totalPages();
    if (this.page < totalPages) {
      this.page += 1;
    }
  }

  /** 跳转到上一页 */
  prevPage(): void {
    if (this.page > 1) {
      this.page -= 1;
    }
  }

  // --- 基础方法 ---------------------------------------------------------------------------------
  /** 设置最小侧边栏宽度 */
  setMinRailWidth(width: number) {
    this.minRailWidth = width;
  }

  /** 设置最大侧边栏宽度 */
  setMaxRailWidth(width: number) {
    this.maxRailWidth = width;
  }

  getLayoutNodes(): LayoutNode<Entity>[] {
    return this.layoutNodes;
  }

  getHeight(): number {
    return this.height;
  }
  
  getWidth(): number {
    return this.width;
  }

  setHeight(height: number) {
    this.height = height;
    this.fixAspectRatio();
  }

  setWidth(width: number) {
    this.width = width;
    this.fixAspectRatio();
  }

  setDeviceType(deviceType: "mobile" | "desktop") {
    this.deviceType = deviceType;
  }

  getDeviceType() {
    return this.deviceType;
  }

  setLayoutType(layoutType: LayoutType) {
    this.layoutType = layoutType;
  }

  getLayoutType() {
    return this.layoutType;
  }

  setAspectRatio(w: number, h: number) {
    if (w > 0 && h > 0) {
      this.aspectRatio = { w, h };
    }
  }

  getAspectRatio() {
    return this.aspectRatio;
  }

  setFullScreen(fullScreen: boolean) {
    this.fullScreen = fullScreen;
  }

  isFullScreen() {
    return this.fullScreen;
  }

  getFocusEntity(): Nullable<Entity> {
    return this.focusEntity;
  }
  // --- 辅助方法 ---------------------------------------------------------------------------------

  /**
   * 校验并返回当前可用的 focusEntity。
   */
  private resolveFocusEntity(): Nullable<Entity> {
    if (!this.focusEntity) {
      return null;
    }

    const currentFocusEntity = this.focusEntity;
    // 在 entities 中找到与当前 focusEntity 匹配的实体，如果找不到则说明 focusEntity 已经不可用，需要重置为 null。
    const matchedEntity = this.entities.find((entity) =>
      this.isSameEntity(entity, currentFocusEntity),
    );

    if (!matchedEntity) {
      this.focusEntity = null;
    } else {
      this.focusEntity = matchedEntity;
    }

    return this.focusEntity;
  }

  /** 是否处于聚焦布局模式 */
  private isFocus(): boolean {
    return this.layoutType === "focus";
  }

  /** 判断两个实体是否可以视为同一个布局节点。 */
  private isSameEntity(leftEntity: Entity, rightEntity: Entity): boolean {
    const sameId = leftEntity.id === rightEntity.id;
    const sameSource = leftEntity?.source === rightEntity?.source;
    const sameCategory = leftEntity?.category === rightEntity?.category;
    // 强制Id必须相同, 如果有 source 和 category 信息则一并匹配，否则只要 id 相同即可
    return (sameId && sameSource && sameCategory) || sameId;
  }

  private isDesktop() {
    return this.deviceType === "desktop";
  }

  private isMobile() {
    return this.deviceType === "mobile";
  }

  /**
   * ## 修正宽高比
   * 如果直接使用 height 和 width 做长宽比可能出现: 1020.23 : 710.1 这种值，但实际上我们更关心的是一个相对稳定的宽高比，比如 16:9 或 4:3，
   * 这样在 fixedSize 模式下推导单元尺寸时才不会出现过大或过小的情况。这个方法会根据当前的设备类型和容器尺寸，修正 aspectRatio 的值，使其更接近一个合理的宽高比。
   * @param currentW 当前原始宽度（可带小数）
   * @param currentH 当前原始高度（可带小数）
   * @returns 修正后的标准宽高比 { w: number, h: number }
   */
  private fixAspectRatio(
    currentW: number = this.width,
    currentH: number = this.height,
  ): void {
    // 1. 安全判断：避免 0 或负数
    if (currentW <= 0 || currentH <= 0) {
      this.aspectRatio = { w: 16, h: 9 }; // 默认 fallback
      return;
    }

    // 2. 计算当前真实比例（宽/高）
    const currentRatio = currentW / currentH;

    // 3. 定义常用标准宽高比
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

    this.aspectRatio = { w: closest.w, h: closest.h };
  }
}
