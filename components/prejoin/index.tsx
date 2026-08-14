import { Input } from "../input";
import { Button } from "../button";
import { useCls } from "vauid-components/std/hooks/cls";
import "./index.scss";
import {
  DeviceSlider,
  DeviceTrigger,
} from "vauid-components/controller/device";
import { useEffect, useRef, useState } from "react";

export const Prejoin = () => {
  const { cls, vcls } = useCls("prejoin");
  const videoRef = useRef<HTMLVideoElement>(null);
  const [footerWidth, setFooterWidth] = useState<number | undefined>();

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    const update = () => setFooterWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div className={cls}>
      <header className={vcls("header")}>
        <Input
          className={vcls("input")}
          bordered={false}
          placeholder="Enter your Room Name"
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
        <Button className={vcls("join-btn")}>Join</Button>
      </footer>
    </div>
  );
};
