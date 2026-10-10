import { forwardRef, useState, type HTMLAttributes, type ReactNode } from "react";
import { useCls } from "../std/hooks/cls";
import "./checkbox.scss";

export interface CheckboxProps
  extends Omit<HTMLAttributes<HTMLLabelElement>, "onChange"> {
  /** 受控选中态 */
  checked?: boolean;
  /** 非受控默认选中 */
  defaultChecked?: boolean;
  /** 选中变化回调 */
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  /** 标签文本 */
  label?: ReactNode;
}

/**
 * # Checkbox - 复选框
 * 受控/非受控复选框，label 整体作为点击热区。
 */
export const Checkbox = forwardRef<HTMLLabelElement, CheckboxProps>(
  (
    {
      checked,
      defaultChecked = false,
      onChange,
      disabled,
      label,
      className,
      onClick,
      ...props
    },
    ref,
  ) => {
    const [inner, setInner] = useState(defaultChecked);
    const current = checked !== undefined ? checked : inner;
    const { cls } = useCls(
      [
        "checkbox",
        current && "checkbox--checked",
        disabled && "checkbox--disabled",
      ],
      className,
    );

    return (
      <label
        {...props}
        className={cls}
        ref={ref}
        onClick={(e) => {
          if (disabled) return;
          const next = !current;
          setInner(next);
          onChange?.(next);
          onClick?.(e);
        }}
      >
        <input
          type="checkbox"
          className="vauid-checkbox-input"
          checked={current}
          disabled={disabled}
          readOnly
        />
        <span className="vauid-checkbox-box" aria-hidden>
          <svg viewBox="0 0 12 12" fill="none">
            <path
              d="M2.5 6.5L5 9L9.5 3.5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        {label != null && <span className="vauid-checkbox-label">{label}</span>}
      </label>
    );
  },
);

Checkbox.displayName = "Checkbox";
