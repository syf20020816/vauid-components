import { type ReactNode, type HTMLAttributes } from "react";
import RcTrigger from "@rc-component/trigger";
import "@rc-component/trigger/assets/index.css";
import { useCls } from "../std/hooks/cls";
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
  const { vcls } = useCls("tooltip");
  return (
    <RcTrigger
      action={["hover"]}
      popup={
        <div className={vcls("content")}>{content}</div>
      }
      popupPlacement={placementMap[placement]}
      builtinPlacements={builtinPlacements}
      getPopupContainer={getPopupContainer}
      mouseEnterDelay={0.2}
      mouseLeaveDelay={0.1}
    >
      <div className={vcls("trigger")}>{children}</div>
    </RcTrigger>
  );
};

export interface StatusTagProps extends HTMLAttributes<HTMLDivElement> {
  icon?: ReactNode;
}

export const StatusTag = ({
  children,
  icon,
  className,
  ...props
}: StatusTagProps) => {
  const { cls } = useCls("status-tag", className);
  return (
    <div className={cls} {...props}>
      {icon}
      {children}
    </div>
  );
};
