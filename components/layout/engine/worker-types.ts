//! Web Worker 消息类型定义

import type { Area } from "../types";

// ==================== Worker 输入 ====================

/**
 * 可序列化的实体数据
 * Worker 不需要实体的方法，只需要纯数据
 */
export interface SerializableEntity {
  id: string;
  [key: string]: unknown;
}

/**
 * 可序列化的计算配置
 * 将 entities 转为 SerializableEntity[]，移除 styleBuildFn
 */
export interface SerializableComputeConfig {
  entities: SerializableEntity[];
  height: number;
  width: number;
  focusEntityId: string | null;
  fullScreen: boolean;
  deviceType: string;
  layoutType: string;
  pageSize: number;
  page: number;
  railWidth: number;
  fixedSize: boolean;
  gridFixedSize: boolean;
  aspectRatio: { w: number; h: number };
  smart: boolean;
}

// ==================== Worker 输出 ====================

/**
 * 可序列化的布局节点数据
 * 不包含 entity 引用和 styleSheet（这些在主线程构建）
 */
export interface SerializableLayoutNode {
  entityId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  area: Area;
  page: number;
  isFocus: boolean;
  zIndex: number;
  hidden: boolean;
}

// ==================== 消息类型 ====================

/** 主线程 → Worker 的消息 */
export interface ComputeRequestMessage {
  type: "compute";
  id: number;
  config: SerializableComputeConfig;
}

/** Worker → 主线程的成功响应 */
export interface ComputeResponseMessage {
  type: "compute_response";
  id: number;
  nodes: SerializableLayoutNode[];
}

/** Worker → 主线程的错误响应 */
export interface ComputeErrorMessage {
  type: "compute_error";
  id: number;
  error: string;
}

/** 所有消息类型的联合 */
export type WorkerMessage =
  | ComputeRequestMessage
  | ComputeResponseMessage
  | ComputeErrorMessage;
