import { Input } from "../input";
import { Button } from "../button";
import { useCls } from "../std/hooks/cls";
import "./index.scss";
import {
  DeviceSlider,
  DeviceTrigger,
} from "../controller/device";
import { useEffect, useRef, useState } from "react";

export interface PrejoinProps {
  /** 房间名（受控），不传则组件内部维护 */
  roomName?: string;
  /** 默认房间名（非受控模式初始值） */
  defaultRoomName?: string;
  /** 房间名变化回调 */
  onRoomNameChange?: (roomName: string) => void;
  /** 点击 Join 按钮回调（携带当前输入的房间名） */
  onJoin?: (roomName: string) => void;
  /** 是否正在加入中（禁用 Join 按钮并显示 loading） */
  joining?: boolean;
  /** 自定义类名 */
  className?: string;
}

export const Prejoin = ({
  roomName: roomNameProp,
  defaultRoomName = "",
  onRoomNameChange,
  onJoin,
  joining = false,
  className,
}: PrejoinProps) => {
  const { cls, vcls } = useCls("prejoin", className);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [footerWidth, setFooterWidth] = useState<number | undefined>();
  const [internalRoomName, setInternalRoomName] = useState(defaultRoomName);

  // 受控/非受控：roomName prop 存在时优先使用外部值
  const currentRoomName = roomNameProp ?? internalRoomName;

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    const update = () => setFooterWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const handleJoin = () => {
    onJoin?.(currentRoomName.trim());
  };

  return (
    <div className={cls}>
      <header className={vcls("header")}>
        <Input
          className={vcls("input")}
          bordered={false}
          placeholder="Enter your Room Name"
          value={currentRoomName}
          onChange={(e) => {
            setInternalRoomName(e.target.value);
            onRoomNameChange?.(e.target.value);
          }}
        ></Input>
      </header>
      <main className={vcls("main")}>
        <video className={vcls("video")} ref={videoRef}></video>
      </main>
      <footer
        className={vcls("footer")}
        style={{
          width: footerWidth ?? "100%",
        }}
      >
        <div className={vcls("footer-device")}>
          <DeviceTrigger.Audio />
          <DeviceTrigger.Video />
          <DeviceSlider.Microphone />
        </div>
        <Button
          className={vcls("join-btn")}
          disabled={joining || !currentRoomName.trim()}
          onClick={handleJoin}
        >
          {joining ? "Joining..." : "Join"}
        </Button>
      </footer>
    </div>
  );
};
