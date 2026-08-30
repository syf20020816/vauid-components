import type { HTMLAttributes } from "react";
import { useCls } from "vauid-components/std/hooks/cls";
import { DEFAULT_COLORS } from "vauid-components/style/global";

export interface PlaceholderProps extends HTMLAttributes<SVGSVGElement> {
  size?: number;
  fill?: string;
}

export const ParticipantPlaceholder = ({
  size = 128,
  fill = DEFAULT_COLORS.textTertiary,
  className,
  ...props
}: PlaceholderProps) => {

    const {cls} = useCls("p-placeholder", className);

  return (
    <svg
      {...props}
      className={cls}
      viewBox="0 0 1024 1024"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      p-id="7288"
      width={size}
      height={size}
    >
      <path
        d="M514.56 265.856m-214.4 0a214.4 214.4 0 1 0 428.8 0 214.4 214.4 0 1 0-428.8 0Z"
        fill={fill}
        p-id="7289"
      ></path>
      <path
        d="M514.56 501.696c213.12 0 385.92 172.8 385.92 385.92 0 47.36-38.4 85.76-85.76 85.76H214.4C167.04 973.376 128.64 934.976 128.64 887.616l0.256-14.464A385.92 385.92 0 0 1 514.56 501.696z"
        fill={fill}
        p-id="7290"
      ></path>
    </svg>
  );
};
