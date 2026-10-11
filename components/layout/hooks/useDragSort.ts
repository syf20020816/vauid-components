import { useEffect, useRef } from "react";
import type { Engine } from "../engine";
import type { LayoutEntity } from "../types";

/**
 * # 拖拽排序持久化
 * 房间/会话级数据（实体显示顺序），独立存储 key，不进 SettingsState
 */
const STORAGE_KEY = "vauid-layout-order";

/** 读取持久化的实体顺序；未存储或数据损坏时返回 null */
export function loadEntityOrder(): string[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed.filter((v): v is string => typeof v === "string");
  } catch {
    return null;
  }
}

/** 持久化实体顺序（完整覆盖） */
export function saveEntityOrder(ids: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // 存储不可用（隐私模式等）时静默降级
  }
}

/**
 * # useEntityOrderRestore - 恢复持久化的实体顺序
 * entities 首次就绪时按存储顺序 reorderEntities（每次挂载最多执行一次，
 * ref 标记防止后续实体增删重复触发回滚用户本次会话内的手动排序）
 */
export function useEntityOrderRestore(
  engine: Engine | null,
  entities: LayoutEntity[],
) {
  const restoredRef = useRef(false);

  useEffect(() => {
    if (restoredRef.current || !engine || entities.length === 0) return;
    restoredRef.current = true;
    const order = loadEntityOrder();
    if (order && order.length > 0) {
      engine.reorderEntities(order);
    }
  }, [engine, entities]);
}
