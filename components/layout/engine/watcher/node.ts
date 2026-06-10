import { Nullable } from "../../../_std";
import { EngineCallback } from "../../types";

/**
 * ## LayoutNodeWatcher - 节点监听器
 * 监听布局节点的变化，触发布局重新计算
 * ### 何时不会触发重新计算 (节点增删更新)
 * 1. 当节点虽然出现增删，但都不是在当前页时
 * 2. 节点虽然更新但没有出现尺寸变化时（尺寸变化会由LayoutSizeWatcher监听）
 */
export class LayoutNodeWatcher{

     private callback: Nullable<EngineCallback> = null;
}