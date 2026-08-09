import { useState, useEffect, useCallback } from "react";
import { useCls } from "../std/hooks/cls";
import "./index.scss";

export interface DuringProps {
  /** 房间开启的时间戳（毫秒），用于恢复计时 */
  roomStartTime: number;
  /** 是否在录制中 */
  recording?: boolean;
  /** 录制开始的时间戳（毫秒） */
  recordingStartTime?: number;
  /** 录制已持续的毫秒数（用于 resume 场景） */
  recordingElapsed?: number;
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export const During = ({
  roomStartTime,
  recording = false,
  recordingStartTime,
  recordingElapsed = 0,
}: DuringProps) => {
  const { cls, vcls } = useCls("during");
  const getDisplay = useCallback(() => {
    const now = Date.now();
    if (recording && recordingStartTime) {
      const elapsed = recordingElapsed + (now - recordingStartTime);
      return formatTime(Math.floor(elapsed / 1000));
    }
    const elapsed = now - roomStartTime;
    return formatTime(Math.floor(elapsed / 1000));
  }, [recording, recordingStartTime, recordingElapsed, roomStartTime]);

  const [display, setDisplay] = useState(getDisplay);

  useEffect(() => {
    const id = setInterval(() => {
      setDisplay(getDisplay());
    }, 1000);
    return () => clearInterval(id);
  }, [getDisplay]);

  return (
    <div className={cls}>
      <span
        className={`${vcls("dot", true)} ${vcls(recording ? "dot--recording" : "dot--live", true)}`}
      />
      <span className={vcls("time", true)}>{display}</span>
    </div>
  );
};
