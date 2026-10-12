import RcTrigger from "@rc-component/trigger";
import "@rc-component/trigger/assets/index.css";
import {
  forwardRef,
  useState,
  type HTMLAttributes,
  type MouseEvent,
} from "react";
import { useCls } from "../std/hooks/cls";
import { getPopupContainer, builtinPlacements } from "../trigger/config";
import type { Option } from "../trigger/types";
import "./index.scss";

export interface SelectProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** 受控选中值 */
  value?: string | number;
  /** 非受控默认值 */
  defaultValue?: string | number;
  /** 选项列表，复用 Trigger 统一的 Option 类型 */
  options: Option[];
  /** 选中变化回调（仅切换选中时触发） */
  onChange?: (value: string | number, option: Option) => void;
  placeholder?: string;
  disabled?: boolean;
  classNames?: {
    trigger?: string;
    dropdown?: string;
    option?: string;
  };
}

/** 菜单项内部 props：Select 注入选中态与点击处理（useCls 需在组件顶层调用，故抽为独立组件） */
type SelectItemProps = {
  option: Option;
  active: boolean;
  className?: string;
  onClick: (e: MouseEvent<HTMLElement>) => void;
};

/** 菜单项：样式与 Dropdown 共用 dropdown-item 体系，suffix 推到尾部 */
const SelectItem = ({ option, active, className, onClick }: SelectItemProps) => {
  const { icon, label, suffix, disabled, danger } = option;
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
    <div className={cls} onClick={onClick}>
      {icon}
      {label}
      {suffix && <span className={vcls("suffix")}>{suffix}</span>}
    </div>
  );
};

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
      placeholder = "Please select",
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
      <RcTrigger
        action={disabled ? [] : ["click"]}
        popup={
          <div className={menuCls}>
            {options.map((option) => (
              <SelectItem
                key={option.value}
                option={option}
                active={option.value === current}
                className={classNames?.option}
                onClick={(e) => {
                  if (option.disabled) return;
                  e.stopPropagation();
                  const isSwitch = option.value !== current;
                  if (isSwitch) {
                    setInner(option.value);
                    onChange?.(option.value, option);
                  }
                  setOpen(false);
                  // 每次点击都触发（对齐 Trigger）
                  option.onClick?.(option.value, e);
                  // 仅切换选中时触发（已选中不触发，对齐 Trigger）
                  if (isSwitch) option.onSelect?.(option.value, e);
                }}
              />
            ))}
          </div>
        }
        popupPlacement="bottomLeft"
        builtinPlacements={builtinPlacements}
        getPopupContainer={getPopupContainer}
        popupVisible={open}
        onOpenChange={setOpen}
      >
        <div {...props} className={triggerCls} ref={ref}>
          <div className="vauid-select-value">{label}</div>
        </div>
      </RcTrigger>
    );
  },
);

Select.displayName = "Select";
