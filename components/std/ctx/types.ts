import type { Engine } from "vauid-components/layout/engine";

export interface RoomCtx {
    /** 
     * 布局引擎
     * 全局维护一个布局引擎的实例，用于计算布局节点的位置和样式
     * 单例，原子性，确保在多线程环境下的一致性
     */
    layout: Engine;
    /** 额外信息 */
    extra?: Record<string | symbol, any>;
}