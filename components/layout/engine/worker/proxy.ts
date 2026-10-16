//! Web Worker 代理
//! 管理 Worker 生命周期，提供异步计算接口，支持同步回退

import { LayoutCompute } from "../compute";
import type { ComputeConfig } from "../compute";
import type {
  LayoutNode,
  LayoutNodes,
  LayoutEntity,
  LayoutStyleProperties,
  SerializableComputeConfig,
  SerializableLayoutNode,
  ComputeRequestMessage,
  ComputeResponseMessage,
  ComputeErrorMessage,
} from "../../types";

/**
 * Worker 代理配置
 */
export interface WorkerProxyOptions {
  /** 是否启用 Worker，默认 true */
  enabled?: boolean;
  /** Worker 脚本 URL，不提供时使用 `new URL('./index.ts', import.meta.url)` 内联构建的 worker chunk（零配置），运行环境不支持时自动回退主线程 */
  workerUrl?: string;
  /** Worker 计算超时时间（ms），超时后回退到同步计算，默认 5000 */
  timeout?: number;
}

/**
 * # LayoutWorkerProxy
 * 管理 Web Worker 的生命周期和消息通信
 * 提供异步计算接口，支持超时回退到同步计算
 */
export class LayoutWorkerProxy {
  private worker: Worker | null = null;
  private enabled: boolean;
  private timeout: number;
  private messageId = 0;
  /** 最近一次 worker 端计算耗时（ms），性能观测用 */
  private lastDuration: number | null = null;
  private pendingRequests = new Map<
    number,
    {
      resolve: (nodes: LayoutNodes<LayoutEntity>) => void;
      reject: (error: Error) => void;
      timer: ReturnType<typeof setTimeout>;
      config: ComputeConfig<LayoutEntity>;
      styleBuildFn?: (node: LayoutNode<LayoutEntity>) => LayoutStyleProperties;
    }
  >();

  constructor(options?: WorkerProxyOptions) {
    this.enabled = options?.enabled ?? true;
    this.timeout = options?.timeout ?? 5000;
  }

  /**
   * 初始化 Worker
   * 如果启用但没有可用的 Worker URL，会尝试使用内联 Blob Worker
   */
  init(workerUrl?: string) {
    if (!this.enabled) {
      return;
    }

    try {
      const url = workerUrl || this.getInlineWorkerUrl();
      if (url) {
        this.worker = new Worker(url, { type: "module" });
        this.worker.onmessage = this.handleMessage;
        this.worker.onerror = this.handleError;
      } else {
        this.enabled = false;
      }
    } catch {
      this.enabled = false;
    }
  }

  /**
   * 异步计算布局
   * 如果 Worker 不可用，会回退到同步计算
   */
  async compute(
    config: ComputeConfig<LayoutEntity>,
    styleBuildFn?: (node: LayoutNode<LayoutEntity>) => LayoutStyleProperties,
  ): Promise<LayoutNodes<LayoutEntity>> {
    if (!this.worker || !this.enabled) {
      // 回退到同步计算
      return this.computeSync(config, styleBuildFn);
    }

    const id = ++this.messageId;
    const serializedConfig = this.serializeConfig(config);

    return new Promise<LayoutNodes<LayoutEntity>>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingRequests.delete(id);
        // 超时后回退到同步计算
        this.computeSync(config, styleBuildFn).then(resolve);
      }, this.timeout);

      this.pendingRequests.set(id, {
        resolve,
        reject,
        timer,
        config,
        styleBuildFn,
      });

      const message: ComputeRequestMessage = {
        type: "compute",
        id,
        config: serializedConfig,
      };

      this.worker!.postMessage(message);
    });
  }

  /**
   * 同步计算（回退方案）
   */
  private computeSync(
    config: ComputeConfig<LayoutEntity>,
    styleBuildFn?: (node: LayoutNode<LayoutEntity>) => LayoutStyleProperties,
  ): Promise<LayoutNodes<LayoutEntity>> {
    const nodes = LayoutCompute.compute(config, styleBuildFn);
    return Promise.resolve(nodes);
  }

  /**
   * 序列化计算配置
   */
  private serializeConfig(
    config: ComputeConfig<LayoutEntity>,
  ): SerializableComputeConfig {
    return {
      entities:
        config.entities as unknown as SerializableComputeConfig["entities"],
      height: config.height,
      width: config.width,
      focusEntityId: config.focusEntity?.id ?? null,
      fullScreen: config.fullScreen,
      deviceType: config.deviceType,
      layoutType: config.layoutType,
      pageSize: config.pageSize,
      page: config.page,
      railWidth: config.railWidth,
      railHeight: config.railHeight,
      fixedSize: config.fixedSize,
      gridFixedSize: config.gridFixedSize,
      aspectRatio: config.aspectRatio,
      smart: config.smart,
    };
  }

  /**
   * 反序列化布局节点并应用样式
   */
  private deserializeNodes(
    serializedNodes: SerializableLayoutNode[],
    config: ComputeConfig<LayoutEntity>,
    styleBuildFn?: (node: LayoutNode<LayoutEntity>) => LayoutStyleProperties,
  ): LayoutNodes<LayoutEntity> {
    const entityMap = new Map<string, LayoutEntity>();
    for (const entity of config.entities) {
      entityMap.set(entity.id, entity);
    }

    const nodes = new Map<string, LayoutNode<LayoutEntity>>();

    for (const serialized of serializedNodes) {
      const entity = entityMap.get(serialized.entityId);
      if (!entity) continue;

      const node: LayoutNode<LayoutEntity> = {
        entity,
        x: serialized.x,
        y: serialized.y,
        width: serialized.width,
        height: serialized.height,
        area: serialized.area,
        page: serialized.page,
        isFocus: serialized.isFocus,
        zIndex: serialized.zIndex,
        hidden: serialized.hidden,
      };

      if (styleBuildFn) {
        node.styleSheet = styleBuildFn(node);
      }

      nodes.set(entity.id, node);
    }

    return nodes;
  }

  /**
   * 处理 Worker 消息
   */
  private handleMessage = (event: MessageEvent) => {
    const message = event.data as ComputeResponseMessage | ComputeErrorMessage;

    if (message.type === "compute_response") {
      const pending = this.pendingRequests.get(message.id);
      if (pending) {
        clearTimeout(pending.timer);
        this.pendingRequests.delete(message.id);

        // 记录 worker 端计算耗时（响应未携带时置空，如旧版本 worker）
        this.lastDuration = message.duration ?? null;

        const nodes = this.deserializeNodes(
          message.nodes,
          pending.config,
          pending.styleBuildFn,
        );
        pending.resolve(nodes);
      }
    } else if (message.type === "compute_error") {
      const pending = this.pendingRequests.get(message.id);
      if (pending) {
        clearTimeout(pending.timer);
        this.pendingRequests.delete(message.id);
        pending.reject(new Error(message.error));
      }
    }
  };

  /**
   * 处理 Worker 错误
   */
  private handleError = () => {
    this.enabled = false;
    // 清除所有 pending 请求并回退到同步计算
    // Array.from 规避 IDE 内置 TS 的 downlevelIteration 诊断（tsc CLI es2023 无此问题）
    for (const pending of Array.from(this.pendingRequests.values())) {
      clearTimeout(pending.timer);
      this.computeSync(pending.config, pending.styleBuildFn).then(
        pending.resolve,
      );
    }
    this.pendingRequests.clear();
  };

  /**
   * 获取内联 Worker URL
   *
   * 使用 `new Worker(new URL('./index.ts', import.meta.url), { type: 'module' })`
   * 标准模式：vite / webpack 等打包器会在构建时识别该表达式，
   * 自动把 worker/index.ts 打成独立 chunk 并把 URL 替换为产物地址，
   * 因此无需用户传入 workerUrl 即可零配置启用 Worker。
   *
   * 兜底：纯 tsc 直跑等不支持的运行环境会 new Worker 失败或 onerror 404，
   * 统一走 handleError → enabled=false → 主线程同步计算，不影响功能。
   */
  private getInlineWorkerUrl(): string | null {
    try {
      return new URL("./index.ts", import.meta.url).href;
    } catch {
      return null;
    }
  }

  /**
   * 销毁 Worker
   */
  destroy() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    for (const pending of Array.from(this.pendingRequests.values())) {
      clearTimeout(pending.timer);
    }
    this.pendingRequests.clear();
  }

  /**
   * 检查 Worker 是否可用
   */
  get isAvailable(): boolean {
    return this.worker !== null && this.enabled;
  }

  /**
   * 最近一次 worker 端布局计算耗时（ms）；尚未收到响应时为 null
   */
  getLastComputeDuration(): number | null {
    return this.lastDuration;
  }
}
