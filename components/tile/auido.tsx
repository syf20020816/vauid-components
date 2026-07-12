import { type HTMLAttributes, type ReactNode } from "react";
import { Avatar } from "../participant/avatar";
import { mergeClassNames } from "../std/util";
import "../participant/index.scss";
import "./index.scss";

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
  const classNames = mergeClassNames("audio-tile")(className);

  return (
    <div className={classNames} onClick={onClick} {...props}>
      <div className={mergeClassNames("audio-tile__avatar")()}>
        {avatar ? (
          avatar
        ) : (
          <Avatar name={name} size={64} src={avatarSrc} />
        )}
      </div>

      <div className={mergeClassNames("audio-tile__waveform")()}>
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
