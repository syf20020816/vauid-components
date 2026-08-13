import RcTrigger from "@rc-component/trigger";
import "@rc-component/trigger/assets/index.css";
import { Button } from "../button";
import { Icon } from "../svg";
import { useCls } from "../std/hooks/cls";
import "./index.scss";
import type { Option } from "./types";
import { useState, useMemo, type ReactNode, type MouseEvent } from "react";
import type { FnReturn } from "../std";
import { getPopupContainer, builtinPlacements } from "./config";

export interface TriggerProps {
  prefix?: ReactNode;
  options?: Option[];
  /** 当前选中的值（受控模式），不传则使用内部状态（非受控模式） */
  value?: string | number;
  showLabel?: boolean;
  ellipsis?: boolean;
  placeholder?: string;
  maxLength?: number;
  styles?: {
    icon?: React.CSSProperties;
    trigger?: React.CSSProperties;
    button?: React.CSSProperties;
    dropdown?: React.CSSProperties;
  };
  classNames?: {
    trigger?: string;
    icon?: string;
    button?: string;
    dropdown?: string;
  };
  onChange?: (value: string | number) => FnReturn<void>;
  onClick?: (e: MouseEvent<HTMLElement>) => FnReturn<void>;
}

/** 下拉项内部 props：Trigger 注入内部点击处理（必填），其余沿用 Option */
type DropdownItemProps = Option & {
  /** Trigger 内部处理：关闭下拉 + 状态更新 + onChange；仅在切换时更新状态 */
  onInternalClick: (
    value: string | number,
    e: MouseEvent<HTMLElement>,
    isSwitch: boolean,
  ) => void;
};

/** 下拉项：选中态加 `active` 类以区分背景色 */
const DropdownItem = ({
  icon,
  label,
  value,
  active,
  onClick,
  onSelect,
  onInternalClick,
}: DropdownItemProps) => {
  const { cls } = useCls(["dropdown-item", active && "active"]);
  return (
    <div
      className={cls}
      onClick={(e) => {
        // 内部处理：关闭下拉、状态更新、onChange
        onInternalClick(value, e, !active);
        // 用户回调：每次点击都触发
        onClick?.(value, e);
        // 用户回调：仅切换时触发（已选中不触发）
        if (!active) {
          onSelect?.(value, e);
        }
      }}
    >
      {icon}
      {label}
    </div>
  );
};

export const Trigger = ({
  prefix,
  options,
  value: controlledValue,
  showLabel = true,
  placeholder = "Select",
  styles,
  classNames,
  maxLength = 6,
  ellipsis = true,
  onChange,
  onClick,
}: TriggerProps) => {
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState<string | number | undefined>();

  // 非受控模式下，options 异步加载后自动选中第一个（渲染时派生，避免 effect 级联渲染）
  const currentValue = controlledValue ?? internalValue ?? options?.[0]?.value;

  const { cls, vcls } = useCls("toggle-trigger", classNames?.trigger);

  const label = useMemo(() => {
    const matched =
      options?.find(({ value }) => value === currentValue)?.label ||
      options?.[0]?.label ||
      placeholder;
    // ellipsis 仅对纯字符串生效，其他 ReactNode 原样返回
    if (typeof matched !== "string") return matched;
    if (!ellipsis || matched.length <= maxLength) return matched;
    return `${matched.slice(0, maxLength)}...`;
  }, [options, currentValue, ellipsis, maxLength, placeholder]);

  const handleItemClick = (
    selectedValue: string | number,
    e: MouseEvent,
    isSwitch: boolean,
  ) => {
    e.stopPropagation();
    setOpen(false);
    // 仅切换时更新状态与触发 onChange
    if (isSwitch) {
      if (controlledValue === undefined) {
        setInternalValue(selectedValue);
      }
      onChange?.(selectedValue);
    }
  };

  const popup = (
    <div className={vcls("dropdown")} style={styles?.dropdown}>
      {options?.map(({ icon, label, value, onClick, onSelect }) => (
        <DropdownItem
          key={value}
          icon={icon}
          label={label}
          value={value}
          active={value === currentValue}
          onClick={onClick}
          onSelect={onSelect}
          onInternalClick={handleItemClick}
        />
      ))}
    </div>
  );

  return (
    <RcTrigger
      popup={options && options.length > 0 ? popup : null}
      action={["click"]}
      popupPlacement="bottomLeft"
      builtinPlacements={builtinPlacements}
      getPopupContainer={getPopupContainer}
      popupVisible={open}
      onOpenChange={setOpen}
    >
      <div className={cls} style={styles?.trigger}>
        <Button icon={prefix} className={vcls("button")} style={styles?.button} onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onClick?.(e);
        }}>
          {(showLabel && label) ?? placeholder}
        </Button>
        <div className={vcls("icon")} style={styles?.icon}>
          <Icon.Arrow
            height={16}
            width={16}
            strokeWidth={2}
            style={{
              transform: "rotate(90deg)",
            }}
          />
        </div>
      </div>
    </RcTrigger>
  );
};
