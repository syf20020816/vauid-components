import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { useCls } from "../std/hooks/cls";
import "./index.scss";

export interface ButtonProps extends HTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
  round?: boolean;
  size?: "small" | "medium" | "large";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      size = "medium",
      children,
      icon,
      iconPosition = "left",
      round = false,
      ...rest
    }: ButtonProps,
    ref,
  ) => {
    const { cls } = useCls(
      [
        icon && children ? "button" : icon ? "button--icon" : "button",
        round && "button--round",
        `button${icon && !children ? "--icon" : ""}--${size}`,
      ],
      rest.className,
    );

    return (
      <button {...rest} ref={ref} className={cls}>
        {iconPosition === "left" && icon}
        {children}
        {iconPosition === "right" && icon}
      </button>
    );
  },
);
