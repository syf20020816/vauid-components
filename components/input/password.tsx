// Password

import { forwardRef, useState } from "react";
import { Input } from ".";
import type { InputProps } from ".";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "../button";
import { useCls } from "../std/hooks/cls";

export interface PasswordProps extends InputProps {
  /** 是否显示切换可见性按钮 */
  visibilityToggle?: boolean;
}

export const Password = forwardRef<HTMLInputElement, PasswordProps>(
  ({ visibilityToggle = true, ...props }, ref) => {
    const [visible, setVisible] = useState(false);
    const { cls } = useCls("password", props.className);

    return (
      <Input
        className={cls}
        {...props}
        type={visible ? "text" : "password"}
        ref={ref}
        suffix={
          visibilityToggle && (
            <Button
              tabIndex={-1}
              aria-label={visible ? "隐藏密码" : "显示密码"}
              onClick={() => setVisible((v) => !v)}
              style={{
                backgroundColor: "transparent",
              }}
            >
              {visible ? <EyeOff size={16} /> : <Eye size={16} />}
            </Button>
          )
        }
      />
    );
  },
);
