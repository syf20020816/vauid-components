import RcTrigger from "@rc-component/trigger";
import "@rc-component/trigger/assets/index.css";
import {
  forwardRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { useCls } from "../std/hooks/cls";
import { mergeClassNames } from "../std/util";
import { getPopupContainer, builtinPlacements } from "../trigger/config";
import "./index.scss";

export interface SelectOption {
  label: ReactNode;
  value: string | number;
  disabled?: boolean;
}

export interface SelectProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** 受控选中值 */
  value?: string | number;
  /** 非受控默认值 */
  defaultValue?: string | number;
  options: SelectOption[];
  /** 选中变化回调 */
  onChange?: (value: string | number, option: SelectOption) => void;
  placeholder?: string;
  disabled?: boolean;
  classNames?: {
    trigger?: string;
    dropdown?: string;
    option?: string;
  };
}

/**
 * # Select - 下拉选择器
 * 受控/非受控的下拉单选，基于 RcTrigger，选项复用 dropdown-item 样式体系。
 */
export const Select = forwardRef<HTMLDivElement, SelectProps>(
  (
    {
      value,
      defaultValue,
      options,
      onChange,
      placeholder = "请选择",
      disabled,
      classNames,
      ...props
    },
    ref,
  ) => {
    const [open, setOpen] = useState(false);
    const [inner, setInner] = useState<string | number | undefined>(
      defaultValue,
    );
    const current = value !== undefined ? value : inner;
    const selected = options.find((o) => o.value === current);
    const label = selected?.label ?? placeholder;

    const { cls: triggerCls } = useCls(
      ["select", open && "select--open", disabled && "select--disabled"],
      classNames?.trigger,
    );
    // 基类携带 pointer-events:auto（popup root 为 none，点击全靠它），方向由 --vertical 修饰符控制
    const { cls: menuCls } = useCls(
      ["dropdown-menu", "dropdown-menu--vertical"],
      classNames?.dropdown,
    );

    return (
      <div {...props} className={triggerCls} ref={ref}>
        <RcTrigger
          action={disabled ? [] : ["click"]}
          popup={
            <div className={menuCls}>
              {options.map((option) => (
                <div
                  key={option.value}
                  className={mergeClassNames([
                    "dropdown-item",
                    option.value === current ? "dropdown-item--active" : "",
                    option.disabled ? "dropdown-item--disabled" : "",
                  ])(classNames?.option)}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (option.disabled) return;
                    setInner(option.value);
                    onChange?.(option.value, option);
                    setOpen(false);
                  }}
                >
                  {option.label}
                </div>
              ))}
            </div>
          }
          popupPlacement="bottomLeft"
          builtinPlacements={builtinPlacements}
          getPopupContainer={getPopupContainer}
          popupVisible={open}
          onOpenChange={setOpen}
        >
          <div className="vauid-select-value">{label}</div>
        </RcTrigger>
      </div>
    );
  },
);

Select.displayName = "Select";
