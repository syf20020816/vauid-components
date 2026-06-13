import { useRef } from "react";
import { useEngine } from "../hooks/useEngine";
import type { LayoutEntity } from "../types";

const BG_COLORS = ["#333", "#4a90d9", "#f97373ff"];

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
  // const styleSheet = new EntityStyleSheet();

  const setFocus = (id: string) => {
    if (id === "") {
      engine.current?.unFocus();
    } else {
      engine.current?.focus(id);
    }
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
          position: "relative",
        }}
      >
        {Array.from(nodes.entries()).map(([id, node], index) => (
          <div
            key={id}
            data-layout-entity-id={node.entity.id}
            data-layout-area={node.area}
            data-layout-visible={!node.hidden}
            style={
              {
                ...node.styleSheet,
                // ...styleSheet.build(node, {}),
                background: node.isFocus ? "#d94a83" : BG_COLORS[index],
                borderRadius: 0,
                color: "#fff",
              } as React.CSSProperties
            }
          >
            {node.entity.label}
          </div>
        ))}
      </div>
      <div
        style={{
          background: "#1f1f1f",
          height: "60px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-evenly",
        }}
      >
        <button onClick={() => setFocus("1")}>设置focus为1号Track</button>
        <button onClick={() => setFocus("2")}>设置focus为2号Track</button>
        <button onClick={() => setFocus("")}>取消focus</button>
      </div>
    </div>
  );
};
