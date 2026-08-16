import { useState, type HTMLAttributes, type ReactNode } from "react";
import "./index.scss";
import { During } from "../status/during";
import { useCls } from "../std/hooks/cls";
import { Thumbnail } from "../layout/thumbnail";

/** Vauid logo：内联 SVG，避免从 public 目录导入资源在外部打包器下失效 */
const LogoIcon = () => (
  <svg
    className="logo-icon"
    viewBox="0 0 100 100"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient
        id="vauid-header-logo-g"
        x1="0%"
        y1="0%"
        x2="100%"
        y2="100%"
      >
        <stop offset="0%" stopColor="#863bff" />
        <stop offset="100%" stopColor="#47bfff" />
      </linearGradient>
      <mask id="vauid-header-logo-mask">
        <g
          fill="#fff"
          fontFamily="system-ui, sans-serif"
          fontSize="100"
          fontWeight="900"
        >
          <text x="34" y="86" textAnchor="middle">
            V
          </text>
          <text x="64" y="86" textAnchor="middle">
            A
          </text>
        </g>
      </mask>
    </defs>
    <rect
      width="100"
      height="100"
      fill="url(#vauid-header-logo-g)"
      mask="url(#vauid-header-logo-mask)"
    />
  </svg>
);

export interface RoomHeaderProps extends HTMLAttributes<HTMLDivElement> {
  logo?: ReactNode;
  roomName?: string;
  status?: ReactNode;
  description?: ReactNode;
  extra?: ReactNode;
}

export const RoomHeader = ({
  logo,
  roomName,
  status,
  description,
  extra,
  className,
  ...props
}: RoomHeaderProps) => {
  const { cls, vcls } = useCls("room-header", className);
  const roomDesc = `vauid - meeting`;
  const [roomStartTime] = useState(() => Date.now());
  

  return (
    <div {...props} className={cls}>
      <div className={vcls("content")}>
        {logo ? logo : <LogoIcon />}
        <div className={vcls("room-info")}>
          <div className={vcls("room-info-name")}>
            <span className={vcls("room-name")}>{roomName} </span>
            <span>{status}</span>
          </div>
          {description ? (
            description
          ) : (
            <p className={vcls("room-desc")}>{roomDesc}</p>
          )}
        </div>
      </div>

      {extra ? (
        extra
      ) : (
        <div className={vcls("extra")}>
          <During roomStartTime={roomStartTime} />
          <Thumbnail />
        </div>
      )}
    </div>
  );
};
