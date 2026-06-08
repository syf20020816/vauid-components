import type { FnReturn, Nullable } from "../../_std";
import type { ComputeRequest, LayoutEntity, LayoutNodes } from "../types";
import type {  ComputeInitConfig } from "./compute";
import {LayoutCompute} from "./compute";
import { LayoutSizeWatcher } from "./watcher/size";
import { Errors } from "./error";

/**
 * # FromServer - 来自服务器的初始化数据
 */
interface FromServer {
  /** 房间标识 */
  room: string;
  /** 服务器地址，默认为本地127.0.0.1 */
  serverUrl?: string;
}

export const LifeTime = {
  /** 引擎初始化时触发 */
  onInit: "onInit",
  /** 引擎运行时触发 */
  onRun: "onRun",
  /** 引擎中监听容器尺寸变化触发 */
  onResize: "onResize",
  /** 引擎中监听实体更新触发, 包括实体的增加/删除/更新 */
  onUpdate: "onUpdate",
  /** 引擎销毁时触发 */
  onDestroy: "onDestroy",
};

export type LifeTime = (typeof LifeTime)[keyof typeof LifeTime];

/** 事件类型映射 - 每个生命周期事件对应不同的参数签名 */
export interface LifeTimeEventMap {
  [LifeTime.onInit]: () => FnReturn<void>;
  [LifeTime.onRun]: () => FnReturn<void>;
  [LifeTime.onResize]: (width: number, height: number) => FnReturn<void>;
  [LifeTime.onUpdate]: (
    entities: LayoutNodes<LayoutEntity>,
    type: ComputeRequest,
  ) => FnReturn<void>;
  [LifeTime.onDestroy]: () => FnReturn<void>;
}

export type LifeTimeEvent<T extends LifeTime = LifeTime> = LifeTimeEventMap[T];

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
 * engine.on(ComputeRequest.Resize, () => { /* ... *\/ });
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
 * ## 计算请求类型
 * 见 ComputeRequest
 * 1. 初始化
 * 2. 调整尺寸
 * 3. 实体更新
 * ## 设计原则
 * **Engine只负责对整个流程进行管理和调度，具体的计算逻辑由 Compute 来实现，
 * 这样可以保持 Engine 的简洁和专注，同时也方便 Compute 的独立测试和优化**
 */
export class Engine {
  /** 尺寸监视器 */
  private sizeWatcher: Nullable<LayoutSizeWatcher> = null;
  /** 布局计算实例 */
  private compute: Nullable<LayoutCompute> = null;
  /** 布局缓存 */
  //   private cache: Nullable<LayoutCache> = null;
  /** 生命周期回调映射 */
  private lifeTime: Map<LifeTime, LifeTimeEvent> = new Map();

  constructor() {}

  /**
   * ## 初始化计算引擎
   * 接收来自服务器的初始化数据 (可选)，如果提供了服务器数据，可以用来预设一些状态或者配置
   * 并且在当前用户如果不在第一页时，如果通过这种方式初始化是不会触发计算的，不需要额外的调整尺寸请求来触发计算
   */
  async init<Entity extends LayoutEntity>(
    entities: Entity[],
    container: HTMLElement,
    others?: ComputeInitConfig<Entity>,
    _fromServer?: FromServer,
  ) {
    console.warn("服务器分发暂未实现: ", _fromServer);

    this.initSizeWatcher(container);
    const { height, width } = this.getSize();
    this.compute = new LayoutCompute(entities, { ...others, height, width });
    this.compute.computeLayout();
    await this.onInit()?.();
  }

  async initFromNodes<Entity extends LayoutEntity>(
    nodes: LayoutNodes<Entity>,
    container: HTMLElement,
    others?: ComputeInitConfig<Entity>,
    _fromServer?: FromServer,
  ) {
    console.warn("服务器分发暂未实现: ", _fromServer);

    this.initSizeWatcher(container);
    const { height, width } = this.getSize();
    this.compute = LayoutCompute.fromNodes(nodes, { ...others, height, width });
    this.compute.computeLayout();
    await this.onInit()?.();
  }

  private initSizeWatcher(container: HTMLElement) {
    this.sizeWatcher = new LayoutSizeWatcher(container);
    // 设置变更回调
    this.sizeWatcher.set(() => {
      // 触发compute计算
      console.warn("触发计算引擎计算");
      this.compute?.computeLayout();
    });
  }

  private onInit() {
    return this.lifeTime.get(LifeTime.onInit) as
      | (() => FnReturn<void>)
      | undefined;
  }

  /**
   * ## 启动引擎监视
   * 开始监听容器尺寸变化等事件
   */
  watch() {
    if (!this.sizeWatcher) {
      throw new Error(Errors.SizeWatcherNotInitialized);
    }
    this.sizeWatcher.watch();
  }

  /**
   * ## 生命周期回调
   * @param time 请求类型，见 LifeTime
   * @param callback 回调函数，当收到对应请求时会调用这个函数，函数的返回值可以是 void 或者 Promise<void>，允许异步处理
   */
  on<T extends LifeTime>(lifeTime: T, callback: LifeTimeEvent<T>) {
    this.lifeTime.set(lifeTime, callback as LifeTimeEvent);
  }

  /** ## 取消监听请求 */
  off(time: LifeTime) {
    this.lifeTime?.delete(time);
  }

  /**
   * ## 运行布局引擎
   * 这个方法用于触发布局引擎整个工作流
   */
  run() {
    this.workflow();
  }

  /**
   * ## 获取当前容器尺寸
   */
  getSize() {
    return this.sizeWatcher?.getSize() ?? { height: 0, width: 0 };
  }

  /**
   * ## 销毁引擎
   * 清理所有资源，停止监视器
   */
  destroy() {
    this.sizeWatcher?.unwatch();
    this.sizeWatcher = null;
    this.compute = null;
    this.lifeTime.clear();
  }

  getNodes() {
    return this.compute?.getLayoutNodes() || new Map();
  }

  /**
   * ## 完整的工作流
   * 这个方法代表了整个布局引擎的工作流程，从接收请求到计算再到调整布局，最后到渲染的完整过程。
   */
  private workflow() {}
}
