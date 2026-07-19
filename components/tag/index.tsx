import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { mergeClassNames } from "../std/util";
import "./index.scss";

export interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  children?: ReactNode;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
  round?: boolean;
}

export const Tag = forwardRef<HTMLSpanElement, TagProps>(
  (
    {
      children,
      icon,
      iconPosition = "left",
      round = true,
      ...rest
    }: TagProps,
    ref,
  ) => {
    const className = mergeClassNames(["tag", round && "tag--round"])(
      rest.className,
    );

    return (
      <span {...rest} ref={ref} className={className}>
        {iconPosition === "left" && icon}
        {children}
        {iconPosition === "right" && icon}
      </span>
    );
  },
);

Tag.displayName = "Tag";
