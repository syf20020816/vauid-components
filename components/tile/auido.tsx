import { type HTMLAttributes, type ReactNode } from "react";
import { Avatar } from "../participant/avatar";
import "../participant/index.scss";
import "./index.scss";
import { useCls } from "../std/hooks/cls";
import { useAudioWave } from "./hooks/useAudio";
import { DEFAULT_COLORS } from "../style/global";

export interface AudioTileProps extends HTMLAttributes<HTMLDivElement> {
  name?: string;
  avatar?: ReactNode;
  avatarSrc?: string;
  /** 是否正在说话，true 时波形更活跃 */
  speaking?: boolean;
}

export const AudioTile = ({
  name = "",
  avatar,
  avatarSrc,
  speaking = false,
  className,
  onClick,
  ...props
}: AudioTileProps) => {
  const { cls, vcls } = useCls("audio-tile", className);
  const canvasRef = useAudioWave({
    minHeight: speaking ? 0.15 : 0.1,
    maxHeight: speaking ? 1 : 0.45,
    height: 64,
    speed: speaking ? 0.08 : 0.05,
    color: speaking
      ? DEFAULT_COLORS.success.main
      : DEFAULT_COLORS.textSecondary,
  });

  return (
    <div className={cls} onClick={onClick} {...props}>
      <div className={vcls("avatar")}>
        {avatar ? avatar : <Avatar name={name} size={64} src={avatarSrc} />}
      </div>

      <div className={vcls("waveform")}>
        <canvas ref={canvasRef} />
      </div>

      <audio />
    </div>
  );
};
