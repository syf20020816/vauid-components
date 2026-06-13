import { useRef } from "react";
import { useEngine } from "../hooks/useEngine";
import type { LayoutEntity } from "../types";

const BG_COLORS = [
  "#333",
  "#d9cb4aff",
  "#4a90d9",
  "#f97373ff",
  "#858be4ff",
  "#6ed94aff",
  "#005abaff",
  "#6600ffff",
];

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

  const addTrack = () => {
    engine.current?.addEntity({
      id: `${nodes.size + 1}`,
      label: `${nodes.size + 1}号Track`,
    });
  };

  const delTrack = () => {
    const last = Array.from(nodes.entries()).pop();
    if (last) {
      engine.current?.delEntity(last[0]);
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
                background: node.isFocus ? "#d0266aff" : BG_COLORS[index],
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
        <button onClick={() => addTrack()}>增加Track</button>
        <button onClick={() => delTrack()}>删除Track</button>
        <button onClick={() => engine.current?.prevPage()}>上一页</button>
        <button onClick={() => engine.current?.nextPage()}>下一页</button>
      </div>
    </div>
  );
};
