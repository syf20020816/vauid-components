import { forwardRef } from "react";
import type { HTMLAttributes } from "react";
import { mergeClassNames } from "../std/util";
import type { ValueType } from "./types";
import "./index.scss";

export interface InputProps extends HTMLAttributes<HTMLInputElement> {
  disabled?: boolean;
  value?: ValueType;
  bordered?: boolean;
  block?: boolean;
  type?: string;
  min?: number;
  max?: number;
  step?: number;
}

/**
 * 输入框组件
 * 使用@rc-component/input组件，理由是它足够强大支持
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ disabled, value, bordered = true, block = false, ...props }, ref) => {
    const className = mergeClassNames([
      "input",
      !bordered && "unbordered",
      disabled && "disabled",
      block && "block",
    ])(props.className);

    return (
      <input
        {...props}
        value={value}
        disabled={disabled}
        className={className}
        ref={ref}
      />
    );
  },
);

export { TextArea } from "./textArea";
export { Password } from "./password";
export { NumberInput } from "./number";
