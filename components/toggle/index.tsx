import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@radix-ui/react-dropdown-menu";
import { Button } from "../button";
import { Icon } from "../svg";
import { mergeClassNames } from "../_std/util";
import "./index.scss";
import type { Option } from "./types";
import { useMemo, useState } from "react";
import type { FnReturn } from "../_std";

export interface ToggleProps {
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

export const Toggle = ({
  options,
  activeKey: controlledActiveKey,
  showLabel = true,
  placeholder = "Select",
  styles,
  classNames,
  maxLength = 6,
  ellipsis = true,
  onChange,
}: ToggleProps) => {
  // 内部状态（非受控模式）
  const [internalActiveKey, setInternalActiveKey] = useState<
    string | undefined
  >(options?.[0]?.value);

  // 受控优先，否则用内部状态
  const activeKey = controlledActiveKey ?? internalActiveKey;

  const label = useMemo(() => {
    const str =
      options?.find(({ value }) => value === activeKey)?.label ||
      options?.[0]?.label ||
      placeholder;
    return ellipsis
      ? maxLength < str.length
        ? `${str.slice(0, maxLength)}...`
        : str.slice(0, maxLength)
      : str;
  }, [options, activeKey, ellipsis, maxLength, placeholder]);

  const handleSelect = (value: string) => {
    // 非受控模式下更新内部状态
    if (controlledActiveKey === undefined) {
      setInternalActiveKey(value);
    }
    onChange?.(value);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div
          className={mergeClassNames("toggle-trigger")(classNames?.trigger)}
          style={styles?.trigger}
        >
          <Button
            iconPosition="right"
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
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className={mergeClassNames("dropdown-content")(classNames?.dropdown)}
        sideOffset={4}
        style={styles?.dropdown}
      >
        {options?.map(({ label, value }) => (
          <DropdownMenuItem
            key={value}
            className={mergeClassNames("dropdown-item")()}
            onClick={() => handleSelect(value)}
          >
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
