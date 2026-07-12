import { type ReactNode, type HTMLAttributes } from "react";
import RcTrigger from "@rc-component/trigger";
import "@rc-component/trigger/assets/index.css";
import { mergeClassNames } from "../std/util";
import { getPopupContainer, builtinPlacements } from "../trigger/config";
import "./index.scss";

export interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  placement?: "top" | "bottom" | "left" | "right";
}

const placementMap: Record<string, string> = {
  top: "topLeft",
  bottom: "bottomLeft",
  left: "leftTop",
  right: "rightTop",
};

export const Tooltip = ({
  content,
  children,
  placement = "top",
}: TooltipProps) => {
  return (
    <RcTrigger
      action={["hover"]}
      popup={
        <div className={mergeClassNames("tooltip-content")()}>
          {content}
        </div>
      }
      popupPlacement={placementMap[placement]}
      builtinPlacements={builtinPlacements}
      getPopupContainer={getPopupContainer}
      mouseEnterDelay={0.2}
      mouseLeaveDelay={0.1}
    >
      <div className={mergeClassNames("tooltip-trigger")()}>
        {children}
      </div>
    </RcTrigger>
  );
};

export interface StatusButtonProps extends HTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;
  icon?: ReactNode;
}

export const StatusButton = ({
  children,
  icon,
  className,
  ...props
}: StatusButtonProps) => {
  const cls = mergeClassNames("status-button")(className);
  return (
    <button className={cls} {...props}>
      {icon}
      {children}
    </button>
  );
};
