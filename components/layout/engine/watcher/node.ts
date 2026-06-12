import type { Nullable } from "../../../_std";
import type { LayoutEntity, LayoutNode, LayoutNodes, NodeUpdate } from "../../types";
import { NodeUpdates } from "../../types";

interface WatcherState<Entity extends LayoutEntity> {
  previousNodes: LayoutNodes<Entity>;
}

/**
 * # LayoutNodeWatcher - 节点监听器
 * 监听布局节点的变化，报告给 Engine 处理
 * 不存储任何回调，仅负责检测变化并报告
 */
export class LayoutNodeWatcher<Entity extends LayoutEntity = LayoutEntity> {
  /** 变化报告回调，由 Engine 设置 */
  onNodeChange: Nullable<(type: NodeUpdate, affectedIds: string[]) => void> = null;

  private state: WatcherState<Entity> = {
    previousNodes: new Map(),
  };

  /** 检测节点变化并报告 */
  detectChanges(newNodes: LayoutNodes<Entity>) {
    const { previousNodes } = this.state;
    const addedIds: string[] = [];
    const removedIds: string[] = [];
    const updatedIds: string[] = [];

    // 检测新增和更新的节点
    for (const [id, node] of newNodes.entries()) {
      if (!previousNodes.has(id)) {
        addedIds.push(id);
      } else {
        const prevNode = previousNodes.get(id)!;
        if (this.isNodeChanged(prevNode, node)) {
          updatedIds.push(id);
        }
      }
    }

    // 检测删除的节点
    for (const id of previousNodes.keys()) {
      if (!newNodes.has(id)) {
        removedIds.push(id);
      }
    }

    // 报告变化
    if (addedIds.length > 0) {
      this.onNodeChange?.(NodeUpdates.Add, addedIds);
    }
    if (removedIds.length > 0) {
      this.onNodeChange?.(NodeUpdates.Remove, removedIds);
    }
    if (updatedIds.length > 0) {
      const physicalIds = updatedIds.filter((id) => {
        const prev = previousNodes.get(id)!;
        const curr = newNodes.get(id)!;
        return this.isPhysicalChanged(prev, curr);
      });
      const nonPhysicalIds = updatedIds.filter(
        (id) => !physicalIds.includes(id),
      );

      if (physicalIds.length > 0) {
        this.onNodeChange?.(NodeUpdates.PhysicalUpdate, physicalIds);
      }
      if (nonPhysicalIds.length > 0) {
        this.onNodeChange?.(NodeUpdates.NonPhysicalUpdate, nonPhysicalIds);
      }
    }

    // 更新 previousNodes
    this.state.previousNodes = new Map(newNodes);
  }

  /** 判断节点是否发生变化 */
  private isNodeChanged(
    prev: LayoutNode<Entity>,
    curr: LayoutNode<Entity>,
  ): boolean {
    return (
      prev.x !== curr.x ||
      prev.y !== curr.y ||
      prev.width !== curr.width ||
      prev.height !== curr.height ||
      prev.zIndex !== curr.zIndex
    );
  }

  /** 判断是否为物理属性变化（位置、尺寸） */
  private isPhysicalChanged(
    prev: LayoutNode<Entity>,
    curr: LayoutNode<Entity>,
  ): boolean {
    return (
      prev.x !== curr.x ||
      prev.y !== curr.y ||
      prev.width !== curr.width ||
      prev.height !== curr.height
    );
  }

  /** 重置状态 */
  reset() {
    this.state.previousNodes = new Map();
  }
}
