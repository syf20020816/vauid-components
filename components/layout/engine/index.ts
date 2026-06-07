import { FnReturn, Nullable } from "../../_std";
import { LayoutEntity, LayoutNodes } from "../types";
import { LayoutCompute, ComputeInitConfig } from "./compute";


/**
 * # FromServer - 来自服务器的初始化数据
 */
interface FromServer {
  /** 房间标识 */
  room: string;
  /** 服务器地址，默认为本地127.0.0.1 */
  serverUrl?: string;
}


/**
 * # Engine - 布局计算引擎
 * 计算引擎 (Engine): 负责布局计算的核心逻辑，提供接口供外部调用，并管理整个流程
 * ## Usage
 * ```typescript
 * const engineRef = new Engine();
 * const {tracks} = useTracks(); // 假设这是一个获取当前房间中所有媒体轨道的 hook
 * const entities = tracks.map(//...); // 将媒体轨道转换为布局实体
 * const containerRef = useRef<HTMLDivElement>(null);
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
  /** 监视器，存储各类计算请求的回调函数 */
  // Map<ComputeRequest, EngineCallback>
  private watcher: Nullable<LayoutWatcher> = null;
  /** 布局计算实例 */
  private compute: Nullable<LayoutCompute> = null;
  /** 布局缓存 */
  //   private cache: Nullable<LayoutCache> = null;
  /** 外部容器引用，用于获取容器尺寸，对容器进行监听，等 */
  container?: HTMLDivElement = undefined;

  constructor() {}
  /**
   * ## 初始化计算引擎
   * 接收来自服务器的初始化数据 (可选)，如果提供了服务器数据，可以用来预设一些状态或者配置
   * 并且在当前用户如果不在第一页时，如果通过这种方式初始化是不会触发计算的，不需要额外的调整尺寸请求来触发计算
   */
  init<Entity extends LayoutEntity>(
    entities: Entity[],
    container: HTMLDivElement,
    others: ComputeInitConfig<Entity>,
    _fromServer?: FromServer,
  ) {
    console.warn("服务器分发暂未实现: ", _fromServer);
    const { height, width } = container.getBoundingClientRect();
    this.compute = new LayoutCompute(entities, { ...others, height, width });
    this.container = container;
  }

  initFromNodes<Entity extends LayoutEntity>(
    nodes: LayoutNodes<Entity>,
    container: HTMLDivElement,
    others: ComputeInitConfig<Entity>,
    _fromServer?: FromServer,
  ) {
    console.warn("服务器分发暂未实现: ", _fromServer);
    const { height, width } = container.getBoundingClientRect();
    this.compute = LayoutCompute.fromNodes(nodes, { ...others, height, width });
    this.container = container;
  }

  /**
   * ## 监听请求
   * @param request 请求类型，见 ComputeRequest
   * @param callback 回调函数，当收到对应请求时会调用这个函数，函数的返回值可以是 void 或者 Promise<void>，允许异步处理
   */
  on(request: ComputeRequest, callback: EngineCallback) {
    if (!this.watchers) {
      this.watchers = new Map();
    }
    this.watchers.set(request, callback);
  }

  /** ## 取消监听请求 */
  off(request: ComputeRequest) {
    this.watchers?.delete(request);
  }

  /**
   * ## 运行布局引擎
   * 这个方法用于触发布局引擎整个工作流
   */
  run() {
    this.workflow();
  }

  /**
   * ## 完整的工作流
   * 这个方法代表了整个布局引擎的工作流程，从接收请求到计算再到调整布局，最后到渲染的完整过程。
   */
  private workflow() {}
}
