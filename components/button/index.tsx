import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { mergeClassNames } from "../std/util";
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
    const className = mergeClassNames([
      icon ? "button--icon" : "button",
      round && "button--round",
      `button${icon ? "--icon" : ""}--${size}`,
    ])(rest.className);

    return (
      <button {...rest} ref={ref} className={className}>
        {iconPosition === "left" && icon}
        {children}
        {iconPosition === "right" && icon}
      </button>
    );
  },
);
