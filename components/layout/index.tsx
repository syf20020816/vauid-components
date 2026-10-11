import { forwardRef, type CSSProperties, type HTMLAttributes, type ReactNode } from "react";
import { useState } from "react";
import type { LayoutEntity, LayoutNode, LayoutNodes } from "./types";
import { Entity } from "./entity";
import { useTileDragSort } from "./hooks/useTileDragSort";

/** 拖拽排序配置（仅 Grid 布局的可见 Tile 生效） */
export interface LayoutDragSort {
  /** 是否启用长按拖拽排序 */
  enabled: boolean;
  /** 松手提交：dragId 移动到目标 tile 的视觉索引 */
  onDrop?: (dragId: string, toIndex: number) => void;
}

export interface LayoutProps<
  Entity extends LayoutEntity = LayoutEntity,
> extends HTMLAttributes<HTMLDivElement> {
  /** useEngine 返回的 nodes */
  nodes: LayoutNodes<Entity>;
  /** 自定义渲染每个 Entity 的内容 */
  renderEntity?: (node: LayoutNode<Entity>, index: number) => ReactNode;
  /** 自定义每个 Entity 的样式 */
  tileStyle?: (node: LayoutNode<Entity>, index: number) => CSSProperties;
  /** 长按拖拽排序配置（默认关闭） */
  dragSort?: LayoutDragSort;
}

export const Layout = forwardRef(
  <Entity extends LayoutEntity = LayoutEntity>(
    {
      nodes,
      renderEntity,
      tileStyle,
      dragSort,
      ...props
    }: LayoutProps<Entity>,
    ref: React.ForwardedRef<HTMLDivElement>,
  ) => {
    const [bgIndex] = useState<Map<string, number>>(() => new Map());

    const { draggingId, targetId, tileProps } = useTileDragSort({
      enabled: dragSort?.enabled ?? false,
      onDrop: dragSort?.onDrop,
      nodes,
    });

    return (
      <div
        ref={ref}
        {...props}
        className={`vauid-layout ${props.className}`}
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          ...props.style,
        }}
      >
        {Array.from(nodes.entries()).map(([id, node]) => {
          const index = bgIndex.get(id) ?? bgIndex.size;
          if (!bgIndex.has(id)) {
            bgIndex.set(id, index);
          }
          const layoutNode = node as LayoutNode<Entity>;
          const drag = tileProps(layoutNode);
          const isDragging = draggingId === id;
          return (
            <Entity
              key={id}
              node={layoutNode}
              className={isDragging ? "vauid-dragging" : undefined}
              {...drag}
              style={{ ...drag.style, ...tileStyle?.(layoutNode, index) }}
            >
              {/* 拖拽指示器：目标 tile 左缘竖线 */}
              {targetId !== null && targetId === id && !isDragging && (
                <div className="vauid-layout-drag-indicator" />
              )}
              {renderEntity?.(layoutNode, index) ?? layoutNode.entity.label}
            </Entity>
          );
        })}
      </div>
    );
  },
) as <Entity extends LayoutEntity = LayoutEntity>(
  props: LayoutProps<Entity> & { ref?: React.ForwardedRef<HTMLDivElement> },
) => React.ReactElement | null;
