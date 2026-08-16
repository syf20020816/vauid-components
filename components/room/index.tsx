import {
  useEffect,
  useMemo,
  useRef,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { RoomHeader } from "./header";
import { RoomProvider, useRoomCtx } from "./ctx";
import { useRoom } from "./hooks/useRoom";
import { Layout } from "../layout";
import { useEngine } from "../layout/hooks/useEngine";
import { Controller, type ControllerProps } from "../controller";
import { ParticipantNum } from "../participant/num";
import { useCls } from "../std/hooks/cls";
import "./index.scss";
import {
  RoomEvents,
  type ConnectOptions,
  type RoomAdapter,
  type RoomParticipant,
} from "./types";
import type { LayoutEntity, LayoutNode } from "../layout/types";

export { RoomHeader } from "./header";
export { RoomProvider, useRoomCtx } from "./ctx";

export interface MeetingRoomProps<A extends RoomAdapter = RoomAdapter>
  extends HTMLAttributes<HTMLDivElement> {
  /** 房间适配器实例（如 new LiveKitAdapter(room)） */
  adapter: A;
  /** 房间名（传给默认 RoomHeader） */
  roomName?: string;
  /** 适配器未连接时自动 connect 所需参数 */
  connectOptions?: ConnectOptions;
  /** 覆盖默认 RoomHeader */
  header?: ReactNode;
  /** 自定义每个参与者的渲染（默认渲染 video + 名字标签） */
  renderEntity?: (participant: RoomParticipant, node: LayoutNode) => ReactNode;
  /** 透传 Controller 定制 */
  controller?: ControllerProps;
}

/**
 * # MeetingRoom - 会议房间组件
 * 组合好了默认的会议房间布局：
 * 1. 房间 Header：RoomHeader（Logo / 房间名 / 计时 / 布局缩略图）
 * 2. 房间布局：Layout（本地 + 远端视频网格，实体动态增删）
 * 3. 房间控制：Controller（麦克风 / 摄像头 / 屏幕共享 / 参会人数 / 退出）
 *
 * 所有房间子组件都通过 RoomCtx 上下文获取 RoomAdapter 实例，
 * 可通过 useRoomCtx 在自定义子组件中获取房间实例（混合开发）。
 * 上下文在挂载时连接房间、卸载时断开并清理资源。
 */
export const MeetingRoom = <A extends RoomAdapter = RoomAdapter>({
  adapter,
  connectOptions,
  ...props
}: MeetingRoomProps<A>) => {
  return (
    <RoomProvider adapter={adapter} connectOptions={connectOptions}>
      <MeetingRoomInner {...props} />
    </RoomProvider>
  );
};

type InnerProps = Omit<MeetingRoomProps, "adapter" | "connectOptions">;

const MeetingRoomInner = ({
  roomName,
  header,
  renderEntity,
  controller,
  className,
  ...props
}: InnerProps) => {
  // 一定在 RoomProvider 内渲染，adapter 非空
  const adapter = useRoomCtx() as RoomAdapter;
  const { cls, vcls } = useCls("meeting-room", className);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    remotes,
    localIdentity,
    setVideoRef,
  } = useRoom(adapter);

  // 初始只有本地参与者，远端通过 engine.addEntity/delEntity 动态增删
  const entities = useMemo<LayoutEntity[]>(
    () => [{ id: localIdentity, label: "Me" }],
    [localIdentity],
  );
  const { nodes, engine } = useEngine({ container: containerRef, entities });

  // 远端参与者加入/离开 → 布局实体动态增删
  useEffect(() => {
    const onConnected = (participant: RoomParticipant) => {
      engine.current?.addEntity({
        id: participant.identity,
        label: participant.name ?? participant.identity,
      });
    };
    const onDisconnected = (participant: RoomParticipant) => {
      engine.current?.delEntity(participant.identity);
    };

    adapter.on(RoomEvents.ParticipantConnected, onConnected);
    adapter.on(RoomEvents.ParticipantDisconnected, onDisconnected);

    // 补发已在房间的远端参与者
    adapter.getRemoteParticipants().forEach(onConnected);

    return () => {
      adapter.off(RoomEvents.ParticipantConnected, onConnected);
      adapter.off(RoomEvents.ParticipantDisconnected, onDisconnected);
    };
  }, [adapter, engine]);

  const findParticipant = (id: string): RoomParticipant => {
    if (id === localIdentity) {
      return adapter.getLocalParticipant();
    }
    return (
      remotes.find((p) => p.identity === id) ?? {
        identity: id,
        isLocal: false,
      }
    );
  };

  const defaultRenderEntity = (node: LayoutNode) => (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <video
        ref={setVideoRef(node.entity.id)}
        autoPlay
        playsInline
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
        }}
      />
      <span style={labelStyle}>{node.entity.label}</span>
    </div>
  );

  const mergedController: ControllerProps = {
    ...controller,
    participant: {
      ...controller?.participant,
      num: {
        show: true,
        ...controller?.participant?.num,
        children:
          controller?.participant?.num?.children ?? (
            <ParticipantNum count={remotes.length + 1} />
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
          renderEntity={(node) =>
            renderEntity
              ? renderEntity(findParticipant(node.entity.id), node)
              : defaultRenderEntity(node)
          }
        />
      </div>
      <Controller {...mergedController} />
    </div>
  );
};

const labelStyle: React.CSSProperties = {
  position: "absolute",
  bottom: 8,
  left: 8,
  fontSize: 12,
  color: "#fff",
  background: "rgba(0,0,0,.5)",
  padding: "2px 8px",
  borderRadius: 8,
};
