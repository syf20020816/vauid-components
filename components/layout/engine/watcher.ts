import { FnReturn } from "../../_std";

type EngineCallback = () => FnReturn<void>;

/**
 * ## 计算请求类型
 * **计算为增量方式，只有在必要时才会触发重新计算**
 */
export const ComputeRequest = {
  /** 初始化计算请求 */
  Init: "init",
  /** 当外层尺寸变化时触发的计算请求 */
  Resize: "resize",
  /**
   * 当实体更新时，但这不一定会让布局引擎触发重新计算
   * ### 实体更新
   * 1. 对实体的增加
   * 2. 对实体的删除
   * ### 何时不会触发重新计算
   * - 当前页中实体已满，有新实体加入/删除但依然不在当前页中
   * - 实体的更新不影响当前布局策略，例如一个非主区实体的标签更新，但它依然在非主区展示
   * - 实体的更新只是一些元信息的变化，例如 label 更新，但它并不影响布局引擎对实体的判断和分布
   * ### 何时会触发重新计算
   * - 当前页中实体未满，有新实体加入/删除导致需要调整当前页中的实体分布
   * - 实体的更新影响了当前布局策略，例如一个非主区实体被更新为主区，或者一个主区实体被更新为非主区
   */
  EntityUpdate: "entity-update",
};

export type ComputeRequest =
  (typeof ComputeRequest)[keyof typeof ComputeRequest];

/**
 * # LayoutWatcher - 布局监视器
 */
export class LayoutWatcher {
  /** 监视器，存储各类计算请求的回调函数 */
  private watchers: Map<ComputeRequest, EngineCallback> = new Map();
  /** 外部容器引用，用于获取容器尺寸，对容器进行监听，等 */
  container?: HTMLDivElement = undefined;

  onInit() {}

  onResize() {}

  onEntityUpdate() {}
}
