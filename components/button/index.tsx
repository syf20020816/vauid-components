import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { useCls } from "../std/hooks/cls";
import "./index.scss";

export interface ButtonProps extends HTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
  round?: boolean;
  size?: "small" | "medium" | "large";
  /** 禁用状态 */
  disabled?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      size = "medium",
      children,
      icon,
      iconPosition = "left",
      round = false,
      disabled,
      ...rest
    }: ButtonProps,
    ref,
  ) => {
    const { cls } = useCls(
      [
        icon && children ? "button" : icon ? "button--icon" : "button",
        round && "button--round",
        `button${icon && !children ? "--icon" : ""}--${size}`,
        disabled && "button--disabled",
      ],
      rest.className,
    );

    return (
      <button {...rest} ref={ref} className={cls} disabled={disabled}>
        {iconPosition === "left" && icon}
        {children}
        {iconPosition === "right" && icon}
      </button>
    );
  },
);
