import RcTrigger from "@rc-component/trigger";
import "@rc-component/trigger/assets/index.css";
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
import type { Option } from "../trigger/types";

export type DropdownPlacement = "top" | "bottom" | "left" | "right";
export type DropdownDirection = "vertical" | "horizontal";
export type DropdownTrigger = "click" | "hover" | "contextMenu";

export interface DropdownProps {
  /** 触发方式，默认 click；contextMenu 为右键弹出在鼠标位置（placement 仅决定防溢出方向） */
  trigger?: DropdownTrigger;
  /** 弹出方向 */
  placement?: DropdownPlacement;
  /** 选项排列方向（horizontal 时自动转为横向排列的菜单） */
  direction?: DropdownDirection;
  /**
   * 选项列表（与 Trigger 的 Option 同构）。
   * onSelect 为 Trigger 的选中语义，Dropdown 不消费，故从类型上排除
   */
  items?: Omit<Option, "onSelect">[];
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

/** 菜单项内部 props：Dropdown 注入点击处理（useCls 需在组件顶层调用，故抽为独立组件） */
type DropdownItemProps = {
  item: Omit<Option, "onSelect">;
  className?: string;
  style?: React.CSSProperties;
  onClick: (e: MouseEvent<HTMLElement>) => void;
};

/** 菜单项：选中/禁用/危险态共用 dropdown-item 修饰符体系，suffix 推到尾部 */
const DropdownItem = ({ item, className, style, onClick }: DropdownItemProps) => {
  const { icon, label, suffix, active, disabled, danger } = item;
  const { cls, vcls } = useCls(
    [
      "dropdown-item",
      active && "dropdown-item--active",
      disabled && "dropdown-item--disabled",
      danger && "dropdown-item--danger",
    ],
    className,
  );
  return (
    <div className={cls} style={style} onClick={onClick}>
      {icon}
      {label}
      {suffix && <span className={vcls("suffix")}>{suffix}</span>}
    </div>
  );
};

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
    const { cls: itemClassName } = useCls("dropdown-item", classNames?.item);

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
    const isContextMenu = triggerType === "contextMenu";

    const dropdownContent = popup ?? (
      <div className={menuCls} style={styles?.dropdown}>
        {items?.map((item) => (
          <DropdownItem
            key={item.value}
            item={item}
            className={classNames?.item}
            style={styles?.item}
            onClick={(e: MouseEvent<HTMLElement>) => {
              e.stopPropagation();
              if (item.disabled) return;
              item.onClick?.(item.value, e);
              setOpen(false);
            }}
          />
        ))}
      </div>
    );

    return (
      <RcTrigger
        action={[triggerType]}
        alignPoint={isContextMenu}
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
