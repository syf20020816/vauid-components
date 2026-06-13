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
  /** 最小轨道宽度 */
  minRailWidth?: number;
  /** 最大轨道宽度 */
  maxRailWidth?: number;
  /** 是否固定尺寸 */
  fixedSize?: boolean;
  /** 纵横比 */
  aspectRatio?: { w: number; h: number };
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
    minRailWidth: 120,
    maxRailWidth: 240,
    fixedSize: true,
    aspectRatio: { w: 16, h: 9 },
  };

  /** 计算出的布局节点 */
  private layoutNodes: LayoutNodes<Entity> = new Map();

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
    const nodes = LayoutCompute.compute(config, (node) => {
      return this.styleSheet.build(node);
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
      minRailWidth,
      maxRailWidth,
      fixedSize,
      aspectRatio,
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
      minRailWidth: minRailWidth ?? 120,
      maxRailWidth: maxRailWidth ?? 240,
      fixedSize: fixedSize ?? true,
      aspectRatio: aspectRatio ?? { w: 16, h: 9 },
    };
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
    if (others.minRailWidth !== undefined)
      this.state.minRailWidth = others.minRailWidth;
    if (others.maxRailWidth !== undefined)
      this.state.maxRailWidth = others.maxRailWidth;
    if (others.fixedSize !== undefined) this.state.fixedSize = others.fixedSize;
    if (others.aspectRatio !== undefined)
      this.state.aspectRatio = others.aspectRatio;
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
    this.state.entities = this.state.entities.filter((e) => e.id !== id);
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
