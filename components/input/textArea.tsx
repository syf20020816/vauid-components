// TextArea

import { forwardRef, useEffect, useRef, useCallback } from "react";
import type { HTMLAttributes } from "react";
import { mergeClassNames } from "../std/util";
import type { ValueType } from "./types";

export interface TextAreaProps extends Omit<
  HTMLAttributes<HTMLTextAreaElement>,
  "value" | "children"
> {
  disabled?: boolean;
  value?: ValueType;
  bordered?: boolean;
  block?: boolean;
  rows?: number;
  /** 是否自动调整高度 */
  autoSize?: boolean;
  maxRows?: number;
  minRows?: number;
  /** 是否显示右下角 resize 角标，默认 true */
  resize?: boolean;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (
    {
      disabled,
      value,
      bordered = true,
      block = false,
      rows = 1,
      autoSize = false,
      maxRows,
      minRows = 1,
      resize = true,
      className: externalClassName,
      onChange,
      ...props
    },
    ref,
  ) => {
    const internalRef = useRef<HTMLTextAreaElement>(null);
    const resolvedRef = ref || internalRef;

    const className = mergeClassNames([
      "input",
      "textarea",
      !bordered && "unbordered",
      disabled && "disabled",
      block && "block",
      autoSize && "autosize",
      !resize && "no-resize",
    ])(externalClassName);

    const adjustHeight = useCallback(
      (el: HTMLTextAreaElement) => {
        if (!autoSize) return;
        el.style.height = "auto";
        const scrollHeight = el.scrollHeight;
        const lineHeight = parseInt(getComputedStyle(el).lineHeight) || 20;
        const minHeight = minRows * lineHeight;
        const height = Math.max(scrollHeight, minHeight);

        if (maxRows) {
          const maxHeight = maxRows * lineHeight;
          el.style.height = `${Math.min(height, maxHeight)}px`;
          el.style.overflowY = height > maxHeight ? "auto" : "hidden";
        } else {
          el.style.height = `${height}px`;
          el.style.overflowY = "hidden";
        }
      },
      [autoSize, maxRows, minRows],
    );

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        adjustHeight(e.currentTarget);
        onChange?.(e);
      },
      [adjustHeight, onChange],
    );

    useEffect(() => {
      if (
        autoSize &&
        resolvedRef &&
        "current" in resolvedRef &&
        resolvedRef.current
      ) {
        adjustHeight(resolvedRef.current);
      }
    }, [value, autoSize, resolvedRef, adjustHeight]);

    return (
      <textarea
        {...props}
        value={value}
        disabled={disabled}
        rows={rows}
        className={className}
        onChange={handleChange}
        ref={resolvedRef}
      />
    );
  },
);
