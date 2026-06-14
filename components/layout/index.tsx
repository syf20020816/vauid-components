import { forwardRef, type CSSProperties, type HTMLAttributes, type ReactNode } from "react";
import { useState } from "react";
import type { LayoutEntity, LayoutNode, LayoutNodes } from "./types";
import { Tile } from "./tile";

export interface LayoutProps<
  Entity extends LayoutEntity = LayoutEntity,
> extends HTMLAttributes<HTMLDivElement> {
  /** useEngine 返回的 nodes */
  nodes: LayoutNodes<Entity>;
  /** 自定义渲染每个 Tile 的内容 */
  renderTile?: (node: LayoutNode<Entity>) => ReactNode;
  /** 自定义每个 Tile 的样式 */
  tileStyle?: (node: LayoutNode<Entity>, index: number) => CSSProperties;
}

export const Layout = forwardRef(
  <Entity extends LayoutEntity = LayoutEntity>(
    {
      nodes,
      renderTile,
      tileStyle,
      ...props
    }: LayoutProps<Entity>,
    ref: React.ForwardedRef<HTMLDivElement>,
  ) => {
    const [bgIndex] = useState<Map<string, number>>(() => new Map());
    

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
          return (
            <Tile
              key={id}
              node={layoutNode}
              style={tileStyle?.(layoutNode, index)}
            >
              {renderTile?.(layoutNode) ?? layoutNode.entity.label}
            </Tile>
          );
        })}
      </div>
    );
  },
) as <Entity extends LayoutEntity = LayoutEntity>(
  props: LayoutProps<Entity> & { ref?: React.ForwardedRef<HTMLDivElement> },
) => React.ReactElement | null;
