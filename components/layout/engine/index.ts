import type { FnReturn, Nullable } from "../../_std";
import {
  type LayoutEntity,
  type LayoutNodes,
  type DeviceType,
  type LayoutType,
  LayoutTypes,
  DeviceTypes,
  type LifeTime,
  type LifeTimeEvent,
  LifeTimes,
  NodeUpdates,
  type NodeUpdate,
} from "../types";
import type { ComputeConfig } from "./compute";
import { LayoutCompute } from "./compute";
import { LayoutSizeWatcher } from "./watcher/size";
import { LayoutNodeWatcher } from "./watcher/node";
import { Errors } from "./error";
import { LayoutCache } from "./cache";
import { EntityStyleSheet } from "./stylesheet";
import type { AnimationOptions, AnimationType, StyleOptions } from "../types";

/**
 * # FromServer - 来自服务器的初始化数据
 */
interface FromServer {
  /** 房间标识 */
  room: string;
  /** 服务器地址，默认为本地127.0.0.1 */
  serverUrl?: string;
}

interface EngineState<Entity extends LayoutEntity = LayoutEntity> {
  /** 布局实体列表 */
  entities: Entity[];
  /** 布局高度 */
  height: number;
  /** 布局宽度 */
  width: number;
  /** 当前聚焦实体 */
  focusEntity?: Nullable<Entity>;
  /** 是否全屏 */
  fullScreen?: boolean;
  /** 设备类型 */
  deviceType?: DeviceType;
  /** 布局类型 */
  layoutType?: LayoutType;
  /** 每页实体数量 */
  pageSize?: number;
  /** 当前页码 */
  page?: number;
  /** 轨道宽度 */
  railWidth?: number;
  /** 是否固定尺寸 */
  fixedSize?: boolean;
  /** grid 布局是否固定宽高比，默认 false（均分容器） */
  gridFixedSize?: boolean;
  /** 纵横比 */
  aspectRatio?: { w: number; h: number };
  /** 是否开启智能末尾填补算法，默认 true */
  smart?: boolean;
}

/**
 * # Engine - 布局计算引擎
 * 计算引擎 (Engine): 负责布局计算的核心逻辑，提供接口供外部调用，并管理整个流程
 * ## Usage
 * ```typescript
 * const engine = new Engine();
 * const container = document.getElementById('layout-container')!;
 * const entities = tracks.map(//...); // 将媒体轨道转换为布局实体
 *
 * engine.init(entities, container, { /* ... *\/ });
 * engine.run();
 *
 * // 清理
 * engine.destroy();
 * ```
 * ## 流程
 * 1. 接收布局计算请求
 * 2. 调用 Compute 进行计算
 * 3. 将计算结果存储 Cache 同时 返回计算结果
 * 4. 根据计算结果作为入参，调用 LayoutTransform 对布局进行移动调整
 * 5. 外层进行渲染
 * **Engine只负责对整个流程进行管理和调度，具体的计算逻辑由 Compute 来实现，
 * 这样可以保持 Engine 的简洁和专注，同时也方便 Compute 的独立测试和优化**
 */
export class Engine<Entity extends LayoutEntity = LayoutEntity> {
  /** 布局状态 - 所有数据由 Engine 统一管理 */
  private state: EngineState<Entity> = {
    entities: [],
    height: 0,
    width: 0,
    focusEntity: null,
    fullScreen: false,
    deviceType: DeviceTypes.Desktop,
    layoutType: LayoutTypes.Grid,
    pageSize: 6,
    page: 1,
    railWidth: 180,
    fixedSize: true,
    gridFixedSize: false,
    aspectRatio: { w: 16, h: 9 },
    smart: true,
  };

  /** 计算出的布局节点 */
  private layoutNodes: LayoutNodes<Entity> = new Map();
  /** 智能填补：记录被删除实体的索引，用于在计算前调整实体顺序 */
  private deletedEntityIndex: number | null = null;
  private animationOptions: AnimationOptions = {
    type: "enableFlip",
    animationOpen: true,
    transitionDuration: 200,
    transitionEasing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
  };
  /** 尺寸监视器 */
  private sizeWatcher: Nullable<LayoutSizeWatcher> = null;
  /** 节点监视器 */
  private nodeWatcher: Nullable<LayoutNodeWatcher<Entity>> = null;
  /** 当前容器引用 */
  private container: Nullable<HTMLElement> = null;
  /** 布局缓存 */
  private cache: Nullable<LayoutCache<Entity>> = null;
  /** 生命周期回调映射 */
  private lifeTime: Map<LifeTime, LifeTimeEvent> = new Map();
  /** 样式表实例 */
  private styleSheet: Nullable<EntityStyleSheet> = new EntityStyleSheet();

  constructor() {}

  /**
   * ## 初始化计算引擎
   */
  async init(
    entities: Entity[],
    container: HTMLElement,
    others?: Partial<ComputeConfig<Entity>>,
    _fromServer?: FromServer,
  ) {
    console.warn("服务器分发暂未实现: ", _fromServer);

    this.state.entities = entities;
    this.container = container;
    if (others) {
      this.applyConfig(others);
    }

    this.initSizeWatcher(container);
    this.initNodeWatcher();
    const { height, width } = this.getSize();
    this.state.height = height;
    this.state.width = width;

    this.computeAndCache();
    const onInit = this.lifeTime.get(LifeTimes.onInit) as
      | (() => FnReturn<void>)
      | undefined;
    await onInit?.();
  }

  async initFromNodes(
    nodes: LayoutNodes<Entity>,
    container: HTMLElement,
    others?: Partial<ComputeConfig<Entity>>,
    _fromServer?: FromServer,
  ) {
    console.warn("服务器分发暂未实现: ", _fromServer);

    this.layoutNodes = nodes;
    this.state.entities = Array.from(nodes.values()).map((node) => node.entity);
    this.container = container;
    if (others) {
      this.applyConfig(others);
    }

    this.initSizeWatcher(container);
    this.initNodeWatcher();
    const { height, width } = this.getSize();
    this.state.height = height;
    this.state.width = width;

    const onInit = this.lifeTime.get(LifeTimes.onInit) as
      | (() => FnReturn<void>)
      | undefined;
    await onInit?.();
  }

  private initSizeWatcher(container: HTMLElement) {
    this.sizeWatcher = new LayoutSizeWatcher();
    this.sizeWatcher.onResize = (width: number, height: number) => {
      this.state.width = width;
      this.state.height = height;
      this.computeAndCache();
      const callback = this.lifeTime.get(LifeTimes.onResize) as
        | ((width: number, height: number) => FnReturn<void>)
        | undefined;
      callback?.(width, height);
    };
    // 初始化尺寸
    const { height, width } = container.getBoundingClientRect();
    this.state.width = width;
    this.state.height = height;
  }

  private initNodeWatcher() {
    this.nodeWatcher = new LayoutNodeWatcher<Entity>();
    this.nodeWatcher.onNodeChange = (type: NodeUpdate) => {
      this.onEntityUpdate(type);
    };
  }

  /**
   * ## 执行布局计算并缓存结果
   */
  private computeAndCache(): LayoutNodes<Entity> {
    const config = this.buildComputeConfig();
    const styleOption = this.buildStyleOptions();
    const nodes = LayoutCompute.compute(config, (node) => {
      return this.styleSheet.build(node, styleOption);
    });

    this.layoutNodes = nodes;
    this.nodeWatcher?.detectChanges(nodes);
    return nodes;
  }

  /**
   * ## 构建计算配置
   * 从 Engine 状态中提取计算所需的配置
   */
  private buildComputeConfig(): ComputeConfig<Entity> {
    const {
      entities,
      height,
      width,
      focusEntity,
      fullScreen,
      deviceType,
      layoutType,
      pageSize,
      page,
      railWidth,
      fixedSize,
      gridFixedSize,
      aspectRatio,
      smart,
    } = this.state;

    return {
      entities,
      height,
      width,
      focusEntity: focusEntity ?? null,
      fullScreen: fullScreen ?? false,
      deviceType: deviceType ?? DeviceTypes.Desktop,
      layoutType: layoutType ?? LayoutTypes.Grid,
      pageSize: pageSize ?? 6,
      page: page ?? 1,
      railWidth: railWidth ?? 180,
      fixedSize: fixedSize ?? true,
      gridFixedSize: gridFixedSize ?? false,
      aspectRatio: aspectRatio ?? { w: 16, h: 9 },
      smart: smart ?? true,
    };
  }

  /**
   * ## 构建样式选项
   * 根据动画配置生成 StyleOptions
   */
  private buildStyleOptions(): StyleOptions {
    const { type, animationOpen, transitionDuration, transitionEasing, animation } = this.animationOptions;

    if (type === "normal") {
      return {
        enableFlip: false,
        animationOpen,
        transitionDuration,
        transitionEasing,
      };
    }

    if (type === "define") {
      return {
        enableFlip: false,
        animationOpen,
        animation,
      };
    }

    // default: enableFlip
    return {
      enableFlip: true,
      animationOpen,
      transitionDuration,
      transitionEasing,
    };
  }

  /**
   * ## 设置动画选项
   */
  setAnimationOptions(type: AnimationType, define?: AnimationOptions) {
    if (type === "define" && define) {
      this.animationOptions = {
        type: "define",
        animationOpen: define.animationOpen ?? true,
        animation: define.animation,
      };
    } else {
      this.animationOptions = {
        type,
        animationOpen: true,
        transitionDuration: 200,
        transitionEasing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
      };
    }
    this.computeAndCache();
    this.onUpdate();
  }

  /**
   * ## 获取动画选项
   */
  getAnimationOptions(): Readonly<AnimationOptions> {
    return { ...this.animationOptions };
  }

  /**
   * ## 应用配置到状态
   */
  private applyConfig(others: Partial<ComputeConfig<Entity>>) {
    if (others.focusEntity !== undefined)
      this.state.focusEntity = others.focusEntity;
    if (others.fullScreen !== undefined)
      this.state.fullScreen = others.fullScreen;
    if (others.deviceType !== undefined)
      this.state.deviceType = others.deviceType;
    if (others.layoutType !== undefined)
      this.state.layoutType = others.layoutType;
    if (others.pageSize !== undefined) this.state.pageSize = others.pageSize;
    if (others.page !== undefined) this.state.page = others.page;
    if (others.railWidth !== undefined)
      this.state.railWidth = others.railWidth;
    if (others.fixedSize !== undefined) this.state.fixedSize = others.fixedSize;
    if (others.gridFixedSize !== undefined) this.state.gridFixedSize = others.gridFixedSize;
    if (others.aspectRatio !== undefined)
      this.state.aspectRatio = others.aspectRatio;
    if (others.smart !== undefined) this.state.smart = others.smart;
  }

  // --- 生命周期回调 ---------------------------------------------------------------------------------

  /**
   * ## 生命周期回调
   */
  on<T extends LifeTime>(lifeTime: T, callback: LifeTimeEvent<T>) {
    this.lifeTime.set(lifeTime, callback as LifeTimeEvent);
  }

  /** ## 取消监听请求 */
  off(time: LifeTime) {
    this.lifeTime?.delete(time);
  }

  // --- 引擎控制 ---------------------------------------------------------------------------------

  /**
   * ## 智能末尾填补
   * 在计算前调整实体顺序：把末尾实体移到被删除实体的位置
   */
  private applySmartFillBeforeCompute() {
    if (this.deletedEntityIndex === null) return;

    const entities = this.state.entities;
    const pageSize = this.state.pageSize ?? 6;
    const currentPage = this.state.page ?? 1;
    const isFocus = this.state.focusEntity !== null;
    const railPageSize = isFocus ? Math.max(1, pageSize - 1) : pageSize;

    // 在 focus 布局下，需要排除 focus 实体来计算 rail 分页
    const effectiveEntities = isFocus
      ? entities.filter((e) => e.id !== this.state.focusEntity!.id)
      : entities;

    // 判断是否有下一页
    const totalPages = LayoutCompute.totalPages(
      effectiveEntities,
      railPageSize,
      currentPage,
      this.state.fullScreen ?? false,
      isFocus ? this.state.focusEntity : null,
    );
    const hasNextPage = currentPage < totalPages;

    // 获取当前页实体
    const currentPageEntities = LayoutCompute.getEntitiesForCurrentPage(
      effectiveEntities,
      railPageSize,
      currentPage,
    );

    // 判断当前页是否满
    const isCurrentPageFull = currentPageEntities.length >= railPageSize;

    // 确定填补实体：当前页满且有下页时用末页最后一个，否则用当前页最后一个
    let fillerEntity: Entity | undefined;

    if (isCurrentPageFull && hasNextPage) {
      // 用末页最后一个实体填补
      const lastPageEntities = LayoutCompute.getEntitiesForCurrentPage(
        effectiveEntities,
        railPageSize,
        totalPages,
      );
      fillerEntity = lastPageEntities[lastPageEntities.length - 1];
    } else if (currentPageEntities.length > 0) {
      // 用当前页最后一个实体填补
      fillerEntity = currentPageEntities[currentPageEntities.length - 1];
    }

    if (fillerEntity) {
      // 找到填补实体在全局 entities 中的索引
      const fillerEntityGlobalIndex = entities.findIndex((e) => e.id === fillerEntity.id);

      if (fillerEntityGlobalIndex >= 0) {
        // 从原位置移除
        const [filler] = entities.splice(fillerEntityGlobalIndex, 1);
        // 插入到被删除实体的位置
        const insertIndex = Math.min(this.deletedEntityIndex, entities.length);
        entities.splice(insertIndex, 0, filler);
      }
    }

    // 清除记录
    this.deletedEntityIndex = null;
  }

  /**
   * ## 启动引擎监视
   */
  watch() {
    if (!this.sizeWatcher) {
      throw new Error(Errors.SizeWatcherNotInitialized);
    }
    if (!this.container) {
      throw new Error(Errors.ContainerNotInitialized);
    }
    this.sizeWatcher.watch(this.container);
  }

  /**
   * ## 运行布局引擎
   */
  run() {
    this.workflow();
  }

  /**
   * ## 完整的工作流
   */
  private workflow() {
    this.computeAndCache();
    this.onRun()?.();
  }

  private onRun() {
    return this.lifeTime.get(LifeTimes.onRun) as
      | (() => FnReturn<void>)
      | undefined;
  }

  /**
   * ## 获取当前容器尺寸
   */
  getSize() {
    return { height: this.state.height, width: this.state.width };
  }

  /**
   * ## 销毁引擎
   */
  destroy() {
    this.sizeWatcher?.unwatch();
    this.sizeWatcher = null;
    this.layoutNodes.clear();
    this.cache?.clear();
    this.lifeTime.clear();
  }

  // --- 数据访问 ---------------------------------------------------------------------------------

  getNodes(): LayoutNodes<Entity> {
    return this.layoutNodes;
  }

  getState(): Readonly<EngineState<Entity>> {
    return { ...this.state };
  }

  // --- 状态更新 ---------------------------------------------------------------------------------

  setEntities(entities: Entity[]) {
    this.state.entities = entities;
    this.computeAndCache();
    this.onUpdate();
    this.onEntityUpdate(NodeUpdates.Add);
  }

  removeEntity(id: string) {
    const wasFocus = this.state.focusEntity?.id === id;

    // 智能填补：记录被删除实体的索引
    if (this.state.smart) {
      this.deletedEntityIndex = this.state.entities.findIndex((e) => e.id === id);
    }

    this.state.entities = this.state.entities.filter((e) => e.id !== id);

    // 如果删除的是当前 focus 实体，清除 focus 状态
    if (wasFocus) {
      this.state.focusEntity = null;
      this.state.layoutType = LayoutTypes.Grid;
    }

    // 检查并调整页码，防止页码越界
    const totalPages = LayoutCompute.totalPages(
      this.state.entities,
      this.state.pageSize ?? 6,
      this.state.page ?? 1,
      this.state.fullScreen ?? false,
      wasFocus ? null : (this.state.focusEntity ?? null),
    );
    if ((this.state.page ?? 1) > totalPages) {
      this.state.page = Math.max(1, totalPages);
    }

    // 智能填补：在计算前调整实体顺序
    if (this.state.smart && this.deletedEntityIndex !== null) {
      this.applySmartFillBeforeCompute();
    }

    this.computeAndCache();
    this.onUpdate();
    this.onEntityUpdate(NodeUpdates.Remove);
  }

  updateEntity(id: string, data: Partial<Entity>) {
    const index = this.state.entities.findIndex((e) => e.id === id);
    if (index !== -1) {
      this.state.entities[index] = {
        ...this.state.entities[index],
        ...data,
      } as Entity;
      this.computeAndCache();
      this.onUpdate();
      this.onEntityUpdate(NodeUpdates.NonPhysicalUpdate);
    }
  }

  focus(id: string) {
    const entity = this.state.entities.find((e) => e.id === id);
    this.state.focusEntity = entity ?? null;
    this.state.layoutType = LayoutTypes.Focus;
    this.computeAndCache();
    this.onUpdate();
  }

  unFocus() {
    this.state.focusEntity = null;
    this.state.layoutType = LayoutTypes.Grid;
    this.computeAndCache();
    this.onUpdate();
  }

  setFullScreen(fullScreen: boolean) {
    this.state.fullScreen = fullScreen;
    this.computeAndCache();
    this.onUpdate();
  }

  setPage(page: number) {
    this.state.page = page;
    this.computeAndCache();
    this.onUpdate();
  }

  setPageSize(pageSize: number) {
    this.state.pageSize = pageSize;
    this.computeAndCache();
    this.onUpdate();
  }

  addEntity(entity: Entity) {
    // 检查重复 ID，如果已存在则跳过
    if (this.state.entities.some((e) => e.id === entity.id)) {
      console.warn(`[LayoutEngine] Entity with id "${entity.id}" already exists, skipping.`);
      return;
    }
    this.state.entities.push(entity);
    this.computeAndCache();
    this.onUpdate();
    this.onEntityUpdate(NodeUpdates.Add);
  }

  delEntity(id: string) {
    this.removeEntity(id);
    this.onEntityUpdate(NodeUpdates.Remove);
  }

  nextPage() {
    const totalPages = LayoutCompute.totalPages(
      this.state.entities,
      this.state.pageSize ?? 6,
      this.state.page ?? 1,
      this.state.fullScreen ?? false,
      this.state.focusEntity ?? null,
    );
    if ((this.state.page ?? 1) < totalPages) {
      this.state.page = (this.state.page ?? 1) + 1;
      this.computeAndCache();
      this.onUpdate();
    }
  }

  prevPage() {
    if ((this.state.page ?? 1) > 1) {
      this.state.page = (this.state.page ?? 1) - 1;
      this.computeAndCache();
      this.onUpdate();
    }
  }

  setDeviceType(deviceType: DeviceType) {
    this.state.deviceType = deviceType;
    this.computeAndCache();
    this.onUpdate();
  }

  setLayoutType(layoutType: LayoutType) {
    this.state.layoutType = layoutType;
    this.computeAndCache();
    this.onUpdate();
  }

  setAspectRatio(w: number, h: number) {
    if (w > 0 && h > 0) {
      this.state.aspectRatio = { w, h };
      this.computeAndCache();
      this.onUpdate();
    }
  }

  setFixed(fixed: boolean) {
    this.state.fixedSize = fixed;
    this.computeAndCache();
    this.onUpdate();
  }

  // --- 生命周期回调 ---------------------------------------------------------------------------------

  private onUpdate() {
    const callback = this.lifeTime.get(LifeTimes.onUpdate) as
      | (() => FnReturn<void>)
      | undefined;
    callback?.();
  }

  private onEntityUpdate(type: NodeUpdate) {
    const callback = this.lifeTime.get(LifeTimes.onEntityUpdate) as
      | ((entities: LayoutNodes<Entity>, type: NodeUpdate) => FnReturn<void>)
      | undefined;
    callback?.(this.layoutNodes, type);
  }
}
