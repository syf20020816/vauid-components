// NumberInput

import { forwardRef } from "react";
import { Input } from ".";
import type { InputProps } from ".";

export interface NumberInputProps extends Omit<InputProps, "value" | "type"> {
  value?: number;
  min?: number;
  max?: number;
  step?: number;
  /** 是否显示增减按钮 */
  controls?: boolean;
}

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  ({ min, max, step = 1, value, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.currentTarget.value;
      if (raw === "") {
        onChange?.(e);
        return;
      }
      const num = Number(raw);
      if (isNaN(num)) return;
      let clamped = num;
      if (min !== undefined) clamped = Math.max(min, clamped);
      if (max !== undefined) clamped = Math.min(max, clamped);
      if (clamped !== num) {
        e.currentTarget.value = String(clamped);
      }
      onChange?.(e);
    };

    return (
      <div style={{ position: "relative" }}>
        <Input
          {...props}
          type="number"
          value={value ?? ""}
          min={min}
          max={max}
          step={step}
          onChange={handleChange}
          ref={ref}
        />
      </div>
    );
  },
);
