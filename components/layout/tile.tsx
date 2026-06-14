import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import type { LayoutEntity, LayoutNode } from "./types";

export interface TileProps<
  Entity extends LayoutEntity = LayoutEntity,
> extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  node: LayoutNode<Entity>;
}

export const Tile: React.FC<TileProps> = ({ children, node, ...props }) => {
  return (
    <div
      {...props}
      key={node.entity.id}
      data-layout-entity-id={node.entity.id}
      data-layout-area={node.area}
      data-layout-visible={!node.hidden}
      style={
        {
          ...node.styleSheet,
          ...props.style,
        } as CSSProperties
      }
    >
      {children}
    </div>
  );
};
