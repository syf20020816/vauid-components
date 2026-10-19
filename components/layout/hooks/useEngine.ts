import { useContext, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { LifeTimes } from "../types";
import { Engine } from "../engine";
import type { LayoutEntity, LayoutNodes } from "../types";
import type { Nullable } from "../../std";
import { ROOM_CTX } from "../../std/ctx/context";

export interface UseEngineProps {
  container: RefObject<Nullable<HTMLDivElement>>;
  entities: LayoutEntity[];
}

/**
 * # useEngine - 布局引擎钩子
 * 用于在 React 组件中使用布局引擎，监听容器尺寸变化和实体更新
 *
 * 引擎来源：
 * - 优先使用 <RoomCtxProvider> 提供的房间级共享引擎（生命周期由 Provider 管理）
 * - 未在 Provider 内使用时兜底自建引擎，卸载时销毁（hook 独立可用）
 *
 * entities 变化时通过 engine.setEntities 自动同步（含首份，幂等）。
 *
 * 该 hook 是 React 适配层，引擎本身保持框架无关
 */
export const useEngine = ({ container, entities }: UseEngineProps) => {
  const roomCtx = useContext(ROOM_CTX);
  const [size, setSize] = useState<{ height: number; width: number }>({
    height: 0,
    width: 0,
  });
  const [nodes, setNodes] = useState<LayoutNodes<LayoutEntity>>(new Map());
  // 引擎实例引用，保证即使多次调用 hook，引擎实例也不会被销毁
  const engineRef = useRef<Engine | null>(null);
  // 是否为 hook 自建的兜底引擎（卸载时需销毁；ctx 引擎由 Provider 销毁）
  const ownedRef = useRef(false);

  // 初始化引擎 / 绑定生命周期回调
  useEffect(() => {
    if (!container.current) return;

    let engine = roomCtx?.layout ?? null;
    if (engine) {
      ownedRef.current = false;
    } else {
      engine = new Engine();
      ownedRef.current = true;
    }
    engineRef.current = engine;

    // 注册尺寸变化回调
    const handleResize = () => {
      setSize(engine.getSize());
      setNodes(engine.getNodes());
    };

    // 注册状态更新回调
    const handleUpdate = () => {
      setNodes(engine.getNodes());
    };

    engine.on(LifeTimes.onResize, handleResize);
    engine.on(LifeTimes.onUpdate, handleUpdate);

    if (engine.isInitialized) {
      // Provider 已完成兜底初始化（视口模式）：
      // 将尺寸监听换绑到真实布局容器，bindContainer 会以一次 onResize
      // 事件通知订阅方（handleResize 内更新 size/nodes），entities 由下方 effect 同步
      engine.bindContainer(container.current);
    } else {
      // 初始化引擎（init 内部已包含首份 entities）
      engine.init(entities, container.current).then(() => {
        setSize(engine.getSize());
        setNodes(engine.getNodes());
      });

      // 启动引擎
      engine.watch();
    }

    // 清理函数：精确解绑自身回调，避免污染 ctx 中的共享引擎
    return () => {
      engine.off(LifeTimes.onResize, handleResize);
      engine.off(LifeTimes.onUpdate, handleUpdate);
      if (ownedRef.current) {
        engine.destroy();
      }
      engineRef.current = null;
    };
    // entities 不进依赖：变化由下方 effect 同步，避免引擎重复初始化
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [container, roomCtx]);

  // entities 变化时同步到引擎（setEntities 幂等，重复同步无副作用）
  useEffect(() => {
    engineRef.current?.setEntities(entities);
  }, [entities]);

  return {
    engine: engineRef,
    size,
    nodes,
  };
};
