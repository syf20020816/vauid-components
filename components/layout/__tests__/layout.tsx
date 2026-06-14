import { useRef } from "react";
import { useEngine } from "../hooks/useEngine";
import type { LayoutEntity, LayoutNode } from "../types";
import { Layout } from "../index";

const BG_COLORS = [
  "#333",
  "#d9cb4aff",
  "#4a90d9",
  "#f97373ff",
  "#858be4ff",
  "#6ed94aff",
  "#005abaff",
  "#6600ffff",
  "#0000ff",
  "#000000",
  "#ee901cff",
  "#ff0000ff",
  "#006f00ff",
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

  const delTrack = (id?: string) => {
    if (id) {
      engine.current?.delEntity(id);
    } else {
      const last = Array.from(nodes.entries()).pop();
      if (last) {
        engine.current?.delEntity(last[0]);
      }
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
      <Layout
        ref={containerRef}
        nodes={nodes}
        style={{ height: "calc(100vh - 60px)" }}
        tileStyle={(node: LayoutNode, index: number) => ({
          background: node.isFocus ? "#d0266aff" : BG_COLORS[index],
          borderRadius: 0,
          color: "#fff",
        })}
        renderTile={(node: LayoutNode) => (
          <>
            {node.entity.label}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                margin: "0 8px",
              }}
            >
              <button onClick={() => setFocus(node.entity.id)}>
                设置为focus
              </button>
              <button onClick={() => delTrack(node.entity.id)}>
                设置删除Track
              </button>
            </div>
          </>
        )}
      />
      <div
        style={{
          background: "#1f1f1f",
          height: "60px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-evenly",
        }}
      >
        <button onClick={() => setFocus("")}>取消focus</button>
        <button onClick={() => addTrack()}>增加Track</button>
        <button onClick={() => delTrack()}>删除Track</button>
        <button onClick={() => engine.current?.prevPage()}>上一页</button>
        <button onClick={() => engine.current?.nextPage()}>下一页</button>
        <button onClick={() => engine.current?.setFullScreen(true)}>全屏</button>
        <button onClick={() => engine.current?.setFullScreen(false)}>
          退出全屏
        </button>
      </div>
    </div>
  );
};
