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
  value?: string;
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
  onChange?: (value: string) => FnReturn<void>;
}

/** 下拉项：选中态加 `active` 类以区分背景色 */
const DropdownItem = ({
  label,
  value,
  active,
  onSelect,
}: {
  label: ReactNode;
  value: string;
  active: boolean;
  onSelect: (value: string, e: MouseEvent) => void;
}) => {
  const { cls } = useCls(["dropdown-item", active && "active"]);
  return (
    <div className={cls} onClick={(e) => onSelect(value, e)}>
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
}: TriggerProps) => {
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState<string | undefined>();

  // 非受控模式下，options 异步加载后自动选中第一个（渲染时派生，避免 effect 级联渲染）
  const currentValue = controlledValue ?? internalValue ?? options?.[0]?.value;

  const { cls, vcls } = useCls("toggle-trigger", classNames?.trigger);

  const label = useMemo(() => {
    const str =
      options?.find(({ value }) => value === currentValue)?.label ||
      options?.[0]?.label ||
      placeholder;
    if (!ellipsis || str.length <= maxLength) return str;
    return `${str.slice(0, maxLength)}...`;
  }, [options, currentValue, ellipsis, maxLength, placeholder]);

  const handleSelect = (selectedValue: string, e: MouseEvent) => {
    e.stopPropagation();
    setOpen(false);
    if (controlledValue === undefined) {
      setInternalValue(selectedValue);
    }
    onChange?.(selectedValue);
  };

  const popup = (
    <div className={vcls("dropdown")} style={styles?.dropdown}>
      {options?.map(({ label, value }) => (
        <DropdownItem
          key={value}
          label={label}
          value={value}
          active={value === currentValue}
          onSelect={handleSelect}
        />
      ))}
    </div>
  );

  return (
    <RcTrigger
      popup={options?.length > 0 ? popup : null}
      action={["click"]}
      popupPlacement="bottomLeft"
      builtinPlacements={builtinPlacements}
      getPopupContainer={getPopupContainer}
      popupVisible={open}
      onOpenChange={setOpen}
    >
      <div className={cls} style={styles?.trigger}>
        <Button icon={prefix} className={vcls("button")} style={styles?.button}>
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
