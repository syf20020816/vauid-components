import type { ReactNode } from "react";
import type { ComputeConfig } from "./compute";
import type { LayoutEntity, LayoutNodes } from "../types";
import type { Engine } from "./index";

/**
 * # LayoutModeDefinition - 自定义布局模式定义
 *
 * 使用方实现该接口并通过 `engine.registerLayoutMode()` 注册到引擎，
 * 引擎据此分发布局计算，Thumbnail 据此渲染切换入口。
 *
 * ## compute 约定
 * - 只需输出几何信息（x/y/width/height/area/page/isFocus/zIndex/hidden），
 *   `styleSheet` 由引擎统一后处理补齐（显式写了则尊重），动画体系不被绕过
 * - 每个实体（含不可见）都应输出节点，不可见实体输出 `hidden: true` 节点，
 *   保证 nodeWatcher diff 一致
 * - 自行消费 `config.page` / `config.pageSize` 实现分页切片
 * - 始终在主线程执行（函数无法序列化进 Worker），内建模式不受影响仍走 Worker
 */
export interface LayoutModeDefinition<Entity extends LayoutEntity = LayoutEntity> {
  /** 布局标识，全局唯一；不可与内建 "grid" / "focus" / "full_screen" 冲突 */
  type: string;
  /** 展示名称（Thumbnail tooltip / 设置页展示） */
  label: string;
  /** Thumbnail 上的图标/缩略示意，不传时渲染默认占位图标 */
  icon?: ReactNode;
  /** 布局计算：输入完整计算配置，输出节点表 */
  compute: (config: ComputeConfig<Entity>) => LayoutNodes<Entity>;
  /** 可选：覆盖总页数计算（默认沿用内建公式 ceil(n / pageSize)） */
  getTotalPages?: (config: ComputeConfig<Entity>) => number;
  /** 可选：激活该布局时的副作用钩子（如初始化内部状态）；不传则仅切换 layoutType */
  activate?: (engine: Engine<Entity>) => void;
}
