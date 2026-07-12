import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { mergeClassNames } from "../std/util";
import "./index.scss";

export interface ButtonProps extends HTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
  round?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      icon,
      iconPosition = "left",
      round = false,
      ...rest
    }: ButtonProps,
    ref,
  ) => {
    const className = mergeClassNames(["button", round && "button--round"])(
      rest.className,
    );

    return (
      <button {...rest} ref={ref} className={className}>
        {iconPosition === "left" && icon}
        {children}
        {iconPosition === "right" && icon}
      </button>
    );
  },
);
