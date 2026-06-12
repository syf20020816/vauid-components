import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { LifeTimes } from "../types";
import { Engine } from "../engine";
import type { LayoutEntity, LayoutNodes } from "../types";
import type { Nullable } from "../../_std";

export interface UseEngineProps {
  container: RefObject<Nullable<HTMLDivElement>>;
  entities: LayoutEntity[];
}

/**
 * # useEngine - 布局引擎钩子
 * 用于在 React 组件中使用布局引擎，监听容器尺寸变化和实体更新
 *
 * 该 hook 是 React 适配层，引擎本身保持框架无关
 */
export const useEngine = ({ container, entities }: UseEngineProps) => {
  const [size, setSize] = useState<{ height: number; width: number }>({
    height: 0,
    width: 0,
  });
  const [nodes, setNodes] = useState<LayoutNodes<LayoutEntity>>(new Map());
  // 引擎实例引用，保证即使多次调用 hook，引擎实例也不会被销毁
  const engineRef = useRef<Engine | null>(null);

  // 初始化引擎
  useEffect(() => {
    if (!container.current) return;

    const engine = new Engine();
    engineRef.current = engine;

    // 注册尺寸变化回调
    engine.on(LifeTimes.onResize, () => {
      setSize(engine.getSize());
      setNodes(engine.getNodes());
    });

    // 注册状态更新回调
    engine.on(LifeTimes.onUpdate, () => {
      setNodes(engine.getNodes());
    });

    // 初始化引擎
    engine.init(entities, container.current).then(() => {
      setSize(engine.getSize());
      setNodes(engine.getNodes());
    });

    // 启动引擎
    engine.watch();

    // 清理函数
    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [container, entities]);

  return {
    engine: engineRef,
    size,
    nodes,
  };
};
