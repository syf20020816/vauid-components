import { useRef } from "react";
import { useEngine } from "../hooks/useEngine";
import type { LayoutEntity } from "../types";

const defaultEntities: LayoutEntity[] = [
  {
    id: "1",
    label: "1号Track",
  },
  {
    id: "2",
    label: "2号Track",
  },
  {
    id: "3",
    label: "3号Track",
  },
];

export const Page = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { nodes } = useEngine({
    container: containerRef,
    entities: defaultEntities,
  });

  return (
    <div
      ref={containerRef}
      style={{ width: "100vw", height: "100vh", margin: 0, padding: 0, display: "flex" , gap: 6, flexDirection: "column"}}
    >
      {Array.from(nodes.entries()).map(([id, node]) => (
        <div
          key={id}
          style={{
            width: node.width,
            height: node.height,
            backgroundColor: "#d26c6cff",
          }}
        />
      ))}
    </div>
  );
};
