import RcTrigger from "@rc-component/trigger";
import "@rc-component/trigger/assets/index.css";
import { mergeClassNames } from "../std/util";
import { useCls } from "../std/hooks/cls";
import "./index.scss";
import {
  useState,
  forwardRef,
  useImperativeHandle,
  type ReactNode,
  type MouseEvent,
} from "react";
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

/**
 * Dropdown 通过 ref 暴露已处理好的 className，
 * 方便用户在自定义 popup / trigger 时复用统一样式，无需二次重写。
 */
export interface DropdownRef {
  /** 触发器 className（含 --open / --disabled 修饰） */
  triggerClassName: string;
  /** 弹出菜单 className（含 --vertical / --horizontal 修饰） */
  popupClassName: string;
  /** 菜单项基础 className（未含 disabled / danger 修饰） */
  itemClassName: string;
}

const placementMap: Record<DropdownPlacement, string> = {
  top: "topLeft",
  bottom: "bottomLeft",
  left: "leftTop",
  right: "rightTop",
};

export const Dropdown = forwardRef<DropdownRef, DropdownProps>(
  (
    {
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
    },
    ref,
  ) => {
    const [open, setOpen] = useState(false);

    const { cls: menuCls } = useCls(
      ["dropdown-menu", `dropdown-menu--${direction}`],
      classNames?.dropdown,
    );
    const { cls: triggerCls } = useCls(
      [
        "dropdown-trigger",
        open && "dropdown-trigger--open",
        disabled && "dropdown-trigger--disabled",
      ],
      classNames?.trigger,
    );
    const itemClassName = mergeClassNames("dropdown-item")(classNames?.item);

    // 暴露已处理好的 className，供外部自定义 popup / trigger 复用
    useImperativeHandle(
      ref,
      () => ({
        triggerClassName: triggerCls,
        popupClassName: menuCls,
        itemClassName,
      }),
      [triggerCls, menuCls, itemClassName],
    );

    const handleOpenChange = (next: boolean) => {
      if (disabled) return;
      setOpen(next);
      onOpenChange?.(next);
    };

    const popupPlacement = placementMap[placement];

    const dropdownContent = popup ?? (
      <div className={menuCls} style={styles?.dropdown}>
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
        <div className={triggerCls} style={styles?.trigger}>
          {children}
        </div>
      </RcTrigger>
    );
  },
);

Dropdown.displayName = "Dropdown";
