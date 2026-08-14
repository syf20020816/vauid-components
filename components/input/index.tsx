import { forwardRef } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import type { ValueType } from "./types";
import "./index.scss";
import { useCls } from "../std/hooks/cls";

export interface InputProps extends HTMLAttributes<HTMLInputElement> {
  disabled?: boolean;
  value?: ValueType;
  bordered?: boolean;
  block?: boolean;
  type?: string;
  min?: number;
  max?: number;
  step?: number;
  suffix?: ReactNode;
  placeholder?: string;
}

/**
 * 输入框组件
 * 使用@rc-component/input组件，理由是它足够强大支持
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      disabled,
      value,
      bordered = true,
      block = false,
      suffix,
      placeholder,
      ...props
    },
    ref,
  ) => {
    const { cls, vcls } = useCls(
      [
        "input",
        !bordered && "unbordered",
        disabled && "disabled",
        block && "block",
      ],
      props.className,
    );

    return (
      <div className={vcls("wrap")}>
        <input
          {...props}
          placeholder={placeholder}
          value={value}
          disabled={disabled}
          className={cls}
          ref={ref}
        />
        {suffix && <span className={vcls("suffix")}>{suffix}</span>}
      </div>
    );
  },
);

export { TextArea } from "./textArea";
export { Password } from "./password";
export { NumberInput } from "./number";
