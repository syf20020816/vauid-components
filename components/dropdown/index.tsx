import RcTrigger from "@rc-component/trigger";
import "@rc-component/trigger/assets/index.css";
import { mergeClassNames } from "../std/util";
import "./index.scss";
import { useState, type ReactNode, type MouseEvent } from "react";
import { getPopupContainer, builtinPlacements } from "../trigger/config";

export type DropdownPlacement = "top" | "bottom" | "left" | "right";
export type DropdownDirection = "vertical" | "horizontal";

export interface DropdownProps {
  /** 触发方式，默认 click */
  trigger?: "click" | "hover";
  /** 弹出方向 */
  placement?: DropdownPlacement;
  /** 选项排列方向（horizontal 时自动转为横向排列的菜单） */
  direction?: DropdownDirection;
  /** 选项列表 */
  items?: {
    key: string;
    label: ReactNode;
    disabled?: boolean;
    danger?: boolean;
    onClick?: () => void;
  }[];
  /** 自定义下拉内容（优先级高于 items） */
  popup?: ReactNode;
  /** 禁用 */
  disabled?: boolean;
  children?: ReactNode;
  classNames?: {
    trigger?: string;
    dropdown?: string;
    item?: string;
  };
  styles?: {
    trigger?: React.CSSProperties;
    dropdown?: React.CSSProperties;
    item?: React.CSSProperties;
  };
  onOpenChange?: (open: boolean) => void;
}

const placementMap: Record<DropdownPlacement, string> = {
  top: "topLeft",
  bottom: "bottomLeft",
  left: "leftTop",
  right: "rightTop",
};

export const Dropdown = ({
  trigger: triggerType = "click",
  placement = "bottom",
  direction = "vertical",
  items,
  popup,
  disabled,
  children,
  classNames,
  styles,
  onOpenChange,
}: DropdownProps) => {
  const [open, setOpen] = useState(false);

  const handleOpenChange = (next: boolean) => {
    if (disabled) return;
    setOpen(next);
    onOpenChange?.(next);
  };

  const popupPlacement = placementMap[placement];

  const dropdownContent = popup ?? (
    <div
      className={mergeClassNames([
        "dropdown-menu",
        `dropdown-menu--${direction}`,
      ])(classNames?.dropdown)}
      style={styles?.dropdown}
    >
      {items?.map((item) => (
        <div
          key={item.key}
          className={mergeClassNames([
            "dropdown-item",
            item.disabled ? "dropdown-item--disabled" : "",
            item.danger ? "dropdown-item--danger" : "",
          ])(classNames?.item)}
          style={styles?.item}
          onClick={(e: MouseEvent) => {
            e.stopPropagation();
            if (item.disabled) return;
            item.onClick?.();
            setOpen(false);
          }}
        >
          {item.label}
        </div>
      ))}
    </div>
  );

  return (
    <RcTrigger
      action={triggerType === "click" ? ["click"] : ["hover"]}
      popup={disabled ? null : dropdownContent}
      popupPlacement={popupPlacement}
      builtinPlacements={builtinPlacements}
      getPopupContainer={getPopupContainer}
      popupVisible={open}
      onOpenChange={handleOpenChange}
      mouseEnterDelay={0.1}
      mouseLeaveDelay={0.1}
    >
      <div
        className={mergeClassNames([
          "dropdown-trigger",
          open ? "dropdown-trigger--open" : "",
          disabled ? "dropdown-trigger--disabled" : "",
        ])(classNames?.trigger)}
        style={styles?.trigger}
      >
        {children}
      </div>
    </RcTrigger>
  );
};
