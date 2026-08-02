import { type HTMLAttributes, type ReactNode } from "react";
import { Avatar } from "../participant/avatar";
import "../participant/index.scss";
import "./index.scss";
import { useCls } from "../std/hooks/cls";

export interface AudioTileProps extends HTMLAttributes<HTMLDivElement> {
  name?: string;
  avatar?: ReactNode;
  avatarSrc?: string;
}

export const AudioTile = ({
  name = "",
  avatar,
  avatarSrc,
  className,
  onClick,
  ...props
}: AudioTileProps) => {
  // const classNames = mergeClassNames("audio-tile")(className);
  const {cls, vcls} = useCls("audio-tile", className);

  return (
    <div className={cls} onClick={onClick} {...props}>
      <div className={vcls("avatar")}>
        {avatar ? (
          avatar
        ) : (
          <Avatar name={name} size={64} src={avatarSrc} />
        )}
      </div>

      <div className={vcls("waveform")}>
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>

      <audio />
    </div>
  );
};
