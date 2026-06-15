//! 布局计算 Web Worker
//! 接收计算配置，执行纯布局计算，返回可序列化的布局节点数据

import { LayoutCompute } from "../compute";
import type { ComputeConfig } from "../compute";
import type { LayoutEntity, SerializableComputeConfig,
  SerializableLayoutNode,
  ComputeRequestMessage,
  ComputeResponseMessage,
  ComputeErrorMessage,
  LayoutNodes,
  DeviceType,
  LayoutType, } from "../../types";

/**
 * 将可序列化的计算配置还原为 ComputeConfig
 */
function deserializeConfig(
  config: SerializableComputeConfig,
): ComputeConfig<LayoutEntity> {
  const entities = config.entities as unknown as LayoutEntity[];

  let focusEntity: LayoutEntity | null = null;
  if (config.focusEntityId) {
    focusEntity = entities.find((e) => e.id === config.focusEntityId) ?? null;
  }

  return {
    entities,
    height: config.height,
    width: config.width,
    focusEntity,
    fullScreen: config.fullScreen,
    deviceType: config.deviceType as DeviceType,
    layoutType: config.layoutType as LayoutType,
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
 * 将 LayoutNodes 序列化为 SerializableLayoutNode[]
 * 移除 entity 引用和 styleSheet，只保留可序列化的字段
 */
function serializeNodes(
  nodes: LayoutNodes<LayoutEntity>,
): SerializableLayoutNode[] {
  const result: SerializableLayoutNode[] = [];
  for (const node of nodes.values()) {
    result.push({
      entityId: node.entity.id,
      x: node.x,
      y: node.y,
      width: node.width,
      height: node.height,
      area: node.area,
      page: node.page,
      isFocus: node.isFocus,
      zIndex: node.zIndex,
      hidden: node.hidden,
    });
  }
  return result;
}

// ==================== Worker 消息处理 ====================

self.addEventListener("message", (event: MessageEvent) => {
  const message = event.data as ComputeRequestMessage;

  if (message.type !== "compute") {
    return;
  }

  try {
    const config = deserializeConfig(message.config);
    const nodes = LayoutCompute.compute(config);
    const serializedNodes = serializeNodes(nodes);

    const response: ComputeResponseMessage = {
      type: "compute_response",
      id: message.id,
      nodes: serializedNodes,
    };

    self.postMessage(response);
  } catch (error) {
    const errorResponse: ComputeErrorMessage = {
      type: "compute_error",
      id: message.id,
      error: error instanceof Error ? error.message : String(error),
    };

    self.postMessage(errorResponse);
  }
});

// 导出类型供 TypeScript 检查
export type { SerializableComputeConfig, SerializableLayoutNode };
