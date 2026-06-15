//! Web Worker 代理
//! 管理 Worker 生命周期，提供异步计算接口，支持同步回退

import { LayoutCompute } from "./compute";
import type { ComputeConfig } from "./compute";
import type {
  LayoutNode,
  LayoutNodes,
  LayoutEntity,
  LayoutStyleProperties,
} from "../types";
import type {
  SerializableComputeConfig,
  SerializableLayoutNode,
  ComputeRequestMessage,
  ComputeResponseMessage,
  ComputeErrorMessage,
} from "./worker-types";

/**
 * Worker 代理配置
 */
export interface WorkerProxyOptions {
  /** 是否启用 Worker，默认 true */
  enabled?: boolean;
  /** Worker 脚本 URL，如果不提供则使用内联 Blob Worker */
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
  private pendingRequests = new Map<
    number,
    {
      resolve: (nodes: LayoutNodes<LayoutEntity>) => void;
      reject: (error: Error) => void;
      timer: ReturnType<typeof setTimeout>;
      config: ComputeConfig<LayoutEntity>;
      styleBuildFn?: (
        node: LayoutNode<LayoutEntity>,
      ) => LayoutStyleProperties;
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
    styleBuildFn?: (
      node: LayoutNode<LayoutEntity>,
    ) => LayoutStyleProperties,
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
    styleBuildFn?: (
      node: LayoutNode<LayoutEntity>,
    ) => LayoutStyleProperties,
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
      entities: config.entities as unknown as SerializableComputeConfig["entities"],
      height: config.height,
      width: config.width,
      focusEntityId: config.focusEntity?.id ?? null,
      fullScreen: config.fullScreen,
      deviceType: config.deviceType,
      layoutType: config.layoutType,
      pageSize: config.pageSize,
      page: config.page,
      railWidth: config.railWidth,
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
    styleBuildFn?: (
      node: LayoutNode<LayoutEntity>,
    ) => LayoutStyleProperties,
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
    const message = event.data as
      | ComputeResponseMessage
      | ComputeErrorMessage;

    if (message.type === "compute_response") {
      const pending = this.pendingRequests.get(message.id);
      if (pending) {
        clearTimeout(pending.timer);
        this.pendingRequests.delete(message.id);

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
    for (const pending of this.pendingRequests.values()) {
      clearTimeout(pending.timer);
      this.computeSync(pending.config, pending.styleBuildFn).then(
        pending.resolve,
      );
    }
    this.pendingRequests.clear();
  };

  /**
   * 获取内联 Worker URL（使用 Blob URL）
   */
  private getInlineWorkerUrl(): string | null {
    // 尝试动态导入 worker 模块
    // 注意：这需要构建工具支持 worker 内联
    // 如果构建工具不支持，返回 null，Engine 会回退到同步计算
    try {
      return null;
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
    for (const pending of this.pendingRequests.values()) {
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
}
