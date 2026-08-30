import { useRef, type HTMLAttributes, type ReactNode } from "react";
import { RoomHeader } from "./header";
import { RoomCtxProvider } from "../std/ctx";
import type { RoomCtx } from "../std/ctx/types";
import { Layout } from "../layout";
import { useEngine } from "../layout/hooks/useEngine";
import { Controller, type ControllerProps } from "../controller";
import { ParticipantNum } from "../participant/num";
import { useCls } from "../std/hooks/cls";
import "./index.scss";
import type { LayoutEntity, LayoutNode } from "../layout/types";

export { RoomHeader } from "./header";

export interface MeetingRoomProps extends HTMLAttributes<HTMLDivElement> {
  /** 房间名（传给默认 RoomHeader） */
  roomName?: string;
  /** 布局实体列表（参与者等），变化时自动同步到布局引擎 */
  entities?: LayoutEntity[];
  /** 需要放入房间上下文的额外数据（子组件可通过 useRoomCtx 读取） */
  extra?: RoomCtx["extra"];
  /** 覆盖默认 RoomHeader */
  header?: ReactNode;
  /** 自定义每个实体的渲染（默认渲染名字标签） */
  renderEntity?: (node: LayoutNode) => ReactNode;
  /** 透传 Controller 定制 */
  controller?: ControllerProps;
}

/**
 * # MeetingRoom - 会议房间组件
 * 组合好了默认的会议房间布局：
 * 1. 房间 Header：RoomHeader（Logo / 房间名 / 计时 / 布局缩略图）
 * 2. 房间布局：Layout（视频网格，entities 驱动，动态增删）
 * 3. 房间控制：Controller（麦克风 / 摄像头 / 屏幕共享 / 参会人数 / 退出）
 *
 * 组件级设计：不感知具体音视频厂商（LiveKit/Agora 等），
 * 参与者数据由外部通过 entities 传入，视频等内容通过 renderEntity 自定义渲染；
 * 房间上下文（RoomCtxProvider）只维护布局引擎与使用者放入的额外数据，
 * 子组件可通过 useRoomCtx 获取引擎（focus/翻页/全屏等操作）与 extra。
 */
export const MeetingRoom = ({
  entities,
  extra,
  ...props
}: MeetingRoomProps) => {
  return (
    <RoomCtxProvider extra={extra}>
      <MeetingRoomInner entities={entities} {...props} />
    </RoomCtxProvider>
  );
};

type InnerProps = Omit<MeetingRoomProps, "extra">;

const MeetingRoomInner = ({
  roomName,
  entities = [],
  header,
  renderEntity,
  controller,
  className,
  ...props
}: InnerProps) => {
  const { cls, vcls } = useCls("meeting-room", className);
  const containerRef = useRef<HTMLDivElement>(null);

  const { nodes } = useEngine({ container: containerRef, entities });

  const mergedController: ControllerProps = {
    ...controller,
    participant: {
      ...controller?.participant,
      num: {
        show: true,
        ...controller?.participant?.num,
        children:
          controller?.participant?.num?.children ?? (
            <ParticipantNum count={entities.length} />
          ),
      },
    },
  };

  return (
    <div {...props} className={cls}>
      {header ?? <RoomHeader roomName={roomName} />}
      <div className={vcls("stage")}>
        <Layout
          ref={containerRef}
          nodes={nodes}
          tileStyle={() => ({
            borderRadius: 12,
            overflow: "hidden",
            background: "#1a1a2e",
          })}
          renderEntity={renderEntity}
        />
      </div>
      <Controller {...mergedController} />
    </div>
  );
};
