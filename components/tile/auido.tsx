import {
  forwardRef,
  useImperativeHandle,
  useRef,
  type HTMLAttributes,
  type ReactNode,
  useEffect,
} from "react";
import { Avatar } from "../participant/avatar";
import "../participant/index.scss";
import "./index.scss";
import { useCls } from "../std/hooks/cls";
import { useAudioWave } from "./hooks/useAudio";
import { DEFAULT_COLORS } from "../style/global";
import type { FnReturn } from "vauid-components/std";

export interface AudioTileProps extends HTMLAttributes<HTMLDivElement> {
  name?: string;
  avatar?: ReactNode;
  avatarSrc?: string;
  /** 未绑定音频流时的静态活跃度；绑定流后波形由真实音量驱动，此属性失效 */
  speaking?: boolean;
  /** 元素挂载后触发，用于将媒体源挂载到该元素（如厂商 track.attach(el)） */
  bind?: (el: HTMLAudioElement) => FnReturn<void>;
  /** 元素卸载前触发，入参为 bind 时传入的同一元素（如 track.detach(el)） */
  unbind?: (el: HTMLAudioElement) => FnReturn<void>;
}

export const AudioTile = forwardRef<HTMLAudioElement, AudioTileProps>(
  (
    {
      name = "",
      avatar,
      avatarSrc,
      speaking = false,
      bind,
      unbind,
      className,
      onClick,
      ...props
    },
    ref,
  ) => {
    const { cls, vcls } = useCls("audio-tile", className);
    const audioRef = useRef<HTMLAudioElement>(null);

    useImperativeHandle(ref, () => audioRef.current!);

    useEffect(() => {
      // setup 时捕获元素；unmount 时 ref.current 已被 React 置 null，
      // cleanup 必须复用此闭包变量才能拿到元素
      const el = audioRef.current;
      if (!el) return;
      bind?.(el);
      return () => {
        if (unbind) void unbind(el);
      };
    }, [bind, unbind]);

    const canvasRef = useAudioWave({
      audioElRef: audioRef,
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

        <audio ref={audioRef} autoPlay />
      </div>
    );
  },
);

AudioTile.displayName = "AudioTile";
