//! RemoteSupport 远程支持组合模板（12.1）
//! 相对容器内依次叠放：children（如 <video> 屏幕共享画面）→ AnnotationLayer（标注）
//! → MouseMapper（指针映射），层级随叠放递增；两子层均可选（对应 prop 不传则不渲染）
//! 标注走 Yjs（12.3，复用 collab 基座 yjs-update envelope），指针不经 Yjs（12.2，Pointer 帧直传）

import type { ReactNode } from "react";
import type { Doc } from "yjs";
import type { Awareness } from "y-protocols/awareness";
import type { CollabTransport } from "../collab";
import { useCls } from "../std/hooks/cls";
import { MouseMapper } from "./mouse";
import { AnnotationLayer } from "./annotation";
import type { PointerAction } from "./pointerFrame";
import "./index.scss";

export interface RemoteSupportProps {
  /** 标注层配置（不传则无标注层）；doc / awareness 引用需稳定（建议 useMemo） */
  annotations?: {
    doc?: Doc;
    awareness?: Awareness;
    name?: string;
  };
  /** 指针映射配置（不传则无指针层）；transport 由使用方注入 */
  pointer?: {
    transport: CollabTransport;
    role: "capture" | "display";
    onAction?: (action: PointerAction) => void;
    name?: string;
  };
  /** 被叠加的内容（如屏幕共享 <video> 画面） */
  children: ReactNode;
  className?: string;
}

/**
 * # RemoteSupport - 远程支持组合模板
 * 只负责布局叠放与配置下发，标注协作数据与指针传输均由使用方在组件外
 * 经 createYjsBridge / 自有 CollabTransport 实现接入（UI 与传输解耦）
 */
export const RemoteSupport = ({ annotations, pointer, children, className }: RemoteSupportProps) => {
  const { cls } = useCls("remote-support", className);
  return (
    <div className={cls}>
      {children}
      {annotations ? (
        <AnnotationLayer
          doc={annotations.doc}
          awareness={annotations.awareness}
          name={annotations.name}
        />
      ) : null}
      {pointer ? (
        <MouseMapper
          transport={pointer.transport}
          role={pointer.role}
          onAction={pointer.onAction}
          name={pointer.name}
        />
      ) : null}
    </div>
  );
};
