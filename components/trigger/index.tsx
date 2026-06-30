import RcTrigger from "@rc-component/trigger";
import "@rc-component/trigger/assets/index.css";
import { Button } from "../button";
import { Icon } from "../svg";
import { mergeClassNames } from "../std/util";
import "./index.scss";
import type { Option } from "./types";
import { useState, useMemo, type ReactNode, type MouseEvent } from "react";
import type { FnReturn } from "../std";
import { getPopupContainer, builtinPlacements } from "./config";

export interface TriggerProps {
  prefix?: ReactNode;
  options?: Option[];
  activeKey?: string;
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

export const Trigger = ({
  prefix,
  options,
  activeKey: controlledActiveKey,
  showLabel = true,
  placeholder = "Select",
  styles,
  classNames,
  maxLength = 6,
  ellipsis = true,
  onChange,
}: TriggerProps) => {
  const [open, setOpen] = useState(false);
  const [internalActiveKey, setInternalActiveKey] = useState<
    string | undefined
  >(options?.[0]?.value);

  const activeKey = controlledActiveKey ?? internalActiveKey;

  const label = useMemo(() => {
    const str =
      options?.find(({ value }) => value === activeKey)?.label ||
      options?.[0]?.label ||
      placeholder;
    if (!ellipsis || str.length <= maxLength) return str;
    return `${str.slice(0, maxLength)}...`;
  }, [options, activeKey, ellipsis, maxLength, placeholder]);

  const handleSelect = (value: string, e: MouseEvent) => {
    e.stopPropagation();
    setOpen(false);
    if (controlledActiveKey === undefined) {
      setInternalActiveKey(value);
    }
    onChange?.(value);
  };

  const popup = (
    <div
      className={mergeClassNames("dropdown-content")(classNames?.dropdown)}
      style={styles?.dropdown}
    >
      {options?.map(({ label, value }) => (
        <div
          key={value}
          className={mergeClassNames("dropdown-item")()}
          onClick={(e) => handleSelect(value, e)}
        >
          {label}
        </div>
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
      <div
        className={mergeClassNames("toggle-trigger")(classNames?.trigger)}
        style={styles?.trigger}
      >
        <Button
          icon={prefix}
          className={mergeClassNames("toggle-button")(classNames?.button)}
          style={styles?.button}
        >
          {showLabel ? label : placeholder}
        </Button>
        <div
          className={mergeClassNames("toggle-icon")(classNames?.icon)}
          style={styles?.icon}
        >
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
