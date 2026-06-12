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
  const { nodes, engine } = useEngine({
    container: containerRef,
    entities: defaultEntities,
  });

  // useEffect(() => {
  //   nodes.forEach((node) => {
  //     console.error("node", node);
  //   });
  // }, [nodes]);

  const setFocus = (id: string) => {
    engine.current?.focus(id);
  };

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        margin: 0,
        padding: 0,
      }}
    >
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: "calc(100vh - 60px)",
          display: "flex",
          gap: 6,
          flexDirection: "column",
        }}
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
      <div
        style={{
          background: "#1f1f1f",
          height: "60px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <button onClick={() => setFocus("1")}>设置focus为1号Track</button>
      </div>
    </div>
  );
};
