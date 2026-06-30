// Password

import { forwardRef, useState } from "react";
import { Input } from ".";
import type { InputProps } from ".";

export interface PasswordProps extends InputProps {
  /** 是否显示切换可见性按钮 */
  visibilityToggle?: boolean;
}

export const Password = forwardRef<HTMLInputElement, PasswordProps>(
  ({ visibilityToggle = true, ...props }, ref) => {
    const [visible, setVisible] = useState(false);

    return (
      <div style={{ position: "relative" }}>
        <Input {...props} type={visible ? "text" : "password"} ref={ref} />
        {visibilityToggle && (
          <button
            type="button"
            tabIndex={-1}
            aria-label={visible ? "隐藏密码" : "显示密码"}
            onClick={() => setVisible((v) => !v)}
            style={{
              position: "absolute",
              right: 8,
              top: "50%",
              transform: "translateY(-50%)",
              border: "none",
              background: "none",
              cursor: "pointer",
              padding: 4,
              lineHeight: 1,
              fontSize: 14,
              color: "inherit",
            }}
          >
            {visible ? "🙈" : "👁"}
          </button>
        )}
      </div>
    );
  },
);
