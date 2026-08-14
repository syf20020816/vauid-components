import { Page } from "../components/layout/__tests__/layout";
import { Button } from "../components/button";
import { LeaveButton } from "../components/controller/leave";
import { Controller } from "../components/controller";
import { Trigger } from "../components/trigger/index";
import { NoteTile } from "../components/tile/note";
import { AudioTile } from "../components/tile/auido";
import { VideoTile } from "../components/tile/video";
import { Avatar } from "../components/participant/avatar";
import { ParticipantName } from "../components/participant/name";
import { ParticipantItem } from "../components/participant/item";
import { ParticipantNum } from "../components/participant/num";
import { Role } from "../components/participant/role";
import { During } from "../components/status/during";
import { Focus } from "../components/status/focus";
import { RaiseHand } from "../components/status/raise";
import { FullScreen } from "../components/status/fullScreen";
import {
  NetworkStatus,
  NetworkUpload,
  NetworkDownload,
} from "../components/status/network";
import { RoomHeader } from "../components/header";
import { TileWrap } from "../components/tile/wrap";
import { Areas } from "../components/layout/types";
import type { LayoutNode } from "../components/layout/types";
import { Prejoin } from "../components/prejoin";

const mockNode = (id: string, label: string, isFocus = false): LayoutNode => ({
  entity: { id, label },
  x: 0,
  y: 0,
  width: 300,
  height: 300,
  area: Areas.Grid,
  page: 0,
  isFocus,
  zIndex: 0,
  hidden: false,
});

const flexCenter: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  height: "100vh",
  gap: 12,
};

const flexCol: React.CSSProperties = {
  ...flexCenter,
  flexDirection: "column",
};

const flexRowWrap: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexWrap: "wrap",
  gap: 12,
};

export const TabPage = ({
  searchParams,
}: {
  searchParams?: URLSearchParams;
}) => {
  const params = searchParams ?? new URLSearchParams(window.location.search);
  const tab = params.get("tab");

  if (!tab) {
    return (
      <>
        <RoomHeader roomName="Will's room" />
        <div style={{ width: "100vw", height: "calc(100vh - 116px)" }}>
          <Page />
        </div>
        <Controller position="center" audio={{ props: { showLabel: false } }} />
      </>
    );
  } else if (tab === "prejoin") {
    return <div style={{height: "100vh", width: "100vw", backgroundColor: "var(--vauid-color-bg-primary)"}}>
      <Prejoin />
    </div>;
  } else if (tab == "header") {
    return (
      <>
        <RoomHeader roomName="Will's room" />
      </>
    );
  } else if (tab == "page") {
    return (
      <>
        <div style={{ width: "100vw", height: "calc(100vh - 54px)" }}>
          <Page />
        </div>
        <Controller position="center" />
      </>
    );
  } else if (tab === "ctr") {
    return (
      <div style={flexCenter}>
        <Controller />
      </div>
    );
  } else if (tab === "btn") {
    return (
      <div style={flexCenter}>
        <LeaveButton />
        <Button>Vauid Btn</Button>
        <Trigger
          options={[
            { label: "Option 1", value: "1" },
            { label: "Option 2", value: "2" },
            { label: "Option 3", value: "3" },
          ]}
        />
      </div>
    );
  } else if (tab === "tile") {
    return (
      <div style={flexRowWrap}>
        <TileWrap
          node={mockNode("note", "公告")}
          style={{ height: 300, width: 300 }}
          float={{
            leftTop: { show: false },
            leftBottom: { show: false },
            rightBottom: { show: false },
          }}
        >
          <NoteTile value={noteValue} />
        </TileWrap>
        <TileWrap
          node={mockNode("audio", "Join")}
          style={{ height: 300, width: 300 }}
        >
          <AudioTile name="Join"></AudioTile>
        </TileWrap>
        <TileWrap
          node={mockNode("video", "视频", true)}
          style={{ height: 300, width: 300 }}
        >
          <VideoTile></VideoTile>
        </TileWrap>
      </div>
    );
  } else if (tab === "audio") {
    return (
      <div style={{ ...flexCenter, gap: 24 }}>
        <AudioTile
          name="张三"
          style={{ height: 280, width: 200 }}
          onClick={() => console.log("click")}
        />
        <AudioTile
          name="John"
          style={{ height: 280, width: 200 }}
          onClick={() => console.log("click")}
        />
      </div>
    );
  } else if (tab === "video") {
    return (
      <div style={{ ...flexCenter, gap: 24 }}>
        <div style={{ width: 320, height: 240 }}>
          <VideoTile style={{ width: "100%", height: "100%" }} />
        </div>
        <div style={{ width: 320, height: 240 }}>
          <VideoTile screenShare style={{ width: "100%", height: "100%" }} />
        </div>
      </div>
    );
  } else if (tab === "avatar") {
    return (
      <div style={{ ...flexCenter, gap: 16 }}>
        <Avatar name="张三" />
        <Avatar name="John" size={40} />
        <Avatar name="Alice" size={60} />
        <Avatar name="测试" size={40} />
        <Avatar
          src="//iconfont.alicdn.com/p/illus/preview_image/ciljjYR1xjY3/441f1b88-03ef-48bd-9ad1-64f655cbdc0f.png"
          name="123"
          size={40}
        />
      </div>
    );
  } else if (tab === "name") {
    return (
      <div
        style={{ ...flexCol, gap: 16, alignItems: "flex-start", padding: 12 }}
      >
        <ParticipantName name="a-v-on" audioEnabled videoEnabled />
        <ParticipantName name="a-on v-off" audioEnabled videoEnabled={false} />
        <ParticipantName
          name="a-v-off"
          audioEnabled={false}
          videoEnabled={false}
        />
        <ParticipantName
          name="a-on v-off s-on"
          audioEnabled
          videoEnabled={false}
          screenShare
        />
        <ParticipantName
          name="a-on v-on s-on"
          audioEnabled
          videoEnabled
          screenShare
        />
        <ParticipantName
          name="a-on v-off s-off"
          audioEnabled
          videoEnabled={false}
          screenShare={false}
        />
      </div>
    );
  } else if (tab === "item") {
    return (
      <div style={{ width: 300, ...flexCol, padding: 12 }}>
        <ParticipantItem
          name="张三"
          role="participant"
          audioEnabled
          videoEnabled
        />
        <ParticipantItem
          name="John"
          extra="主持人"
          audioEnabled
          videoEnabled={false}
          role="host"
        />
        <ParticipantItem
          name="Alice"
          extra="静音中"
          audioEnabled={false}
          videoEnabled
          role="manager"
        />
        <ParticipantItem
          name="Bob"
          role="guest"
          audioEnabled={false}
          videoEnabled={false}
        />
      </div>
    );
  } else if (tab === "num") {
    return (
      <div style={flexCenter}>
        <ParticipantNum count={42} />
      </div>
    );
  } else if (tab === "role") {
    return (
      <div style={flexCenter}>
        <Role role="host" />
        <Role role="participant" />
        <Role role="manager" />
        <Role role="guest" />
        <Role text="自定义" color="#fff" backgroundColor="#8b5cf6" />
      </div>
    );
  } else if (tab === "during") {
    return (
      <div style={{ ...flexCol, gap: 24 }}>
        <During roomStartTime={Date.now() - 3723000} />
        <During
          roomStartTime={Date.now() - 3723000}
          recording
          recordingStartTime={Date.now() - 120000}
          recordingElapsed={60000}
        />
      </div>
    );
  } else if (tab === "focus") {
    return (
      <div style={flexCenter}>
        <Focus />
        <Focus focused />
        <FullScreen />
        <FullScreen fullScreen />
        <RaiseHand />
        <RaiseHand raised />
      </div>
    );
  } else if (tab === "network") {
    return (
      <div style={flexRowWrap}>
        <NetworkStatus />
        <NetworkStatus rtt={200} />
        <NetworkStatus rtt={300} />
        <NetworkStatus rtt={4} />
        <NetworkUpload />
        <NetworkDownload />
      </div>
    );
  } else if (tab === "status") {
    return (
      <div style={flexRowWrap}>
        <During roomStartTime={Date.now() - 3723000} />
        <ParticipantNum count={42} />
        <NetworkStatus />
        <NetworkUpload />
        <NetworkDownload />
        <Focus />
        <FullScreen />
      </div>
    );
  }
};

const noteValue = `
# 房间公告！
房间公告内容：这是一个房间公告，用于通知房间中的玩家。

## 注意事项
- 房间公告内容不能超过100个字符
- 房间公告内容不能包含特殊字符
`;
