import { forwardRef } from "react";
import { Button, type ButtonProps } from "../button";
import { useCls } from "../std/hooks/cls";
import { Icon } from "../svg";
import "./index.scss";
import type { FnReturn } from "../std";

export interface LeaveButtonProps extends ButtonProps {
  onBeforeLeave?: () => void;
  onAfterLeave?: () => void;
}

export type LeaveButtonAttr = Pick<
  LeaveButtonProps,
  "onBeforeLeave" | "onAfterLeave"
> & {
  onLeave?: (e: React.MouseEvent<HTMLButtonElement>) => FnReturn<void>;
};

export const LeaveButton = forwardRef<HTMLButtonElement, LeaveButtonProps>(
  ({ onBeforeLeave, onAfterLeave, ...props }: LeaveButtonProps, ref) => {
    const { cls } = useCls("leave-button", props.className);

    return (
      <Button
        className={cls}
        {...props}
        ref={ref}
        onClick={(e) => {
          e.stopPropagation();
          onBeforeLeave?.();
          props?.onClick?.(e);
          onAfterLeave?.();
        }}
        icon={<Icon.Leave height={16} width={16} strokeWidth={2.4} />}
      >
        {props.children}
      </Button>
    );
  },
);
