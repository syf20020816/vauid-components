import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { useCls } from "../std/hooks/cls";
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
    const { cls } = useCls(["tag", round && "tag--round"], rest.className);

    return (
      <span {...rest} ref={ref} className={cls}>
        {iconPosition === "left" && icon}
        {children}
        {iconPosition === "right" && icon}
      </span>
    );
  },
);

Tag.displayName = "Tag";
