import {
  forwardRef,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type HTMLAttributes,
} from "react";
import { useCls } from "../std/hooks/cls";
import "./index.scss";

export interface SliderProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> {
  /** 当前值（受控） */
  value?: number;
  /** 默认值（非受控） */
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  /** 方向：horizontal 横向 / vertical 纵向 */
  direction?: "horizontal" | "vertical";
  /** 拖拽过程中值变化时触发 */
  onChange?: (value: number) => void;
  /** 拖拽结束（pointer up / 键盘操作）时触发 */
  onChangeComplete?: (value: number) => void;
}

export const Slider = forwardRef<HTMLDivElement, SliderProps>(
  (
    {
      value: controlledValue,
      defaultValue = 0,
      min = 0,
      max = 100,
      step = 1,
      disabled = false,
      direction = "horizontal",
      onChange,
      onChangeComplete,
      ...rest
    }: SliderProps,
    ref,
  ) => {
    const [internalValue, setInternalValue] = useState(defaultValue);
    const value = controlledValue ?? internalValue;
    const trackRef = useRef<HTMLDivElement>(null);
    const draggingRef = useRef(false);

    const { cls, vcls } = useCls(
      ["slider", `slider--${direction}`, disabled && "disabled"],
      rest.className,
    );

    const clamp = (v: number) => Math.min(max, Math.max(min, v));

    const getStepValue = (raw: number) => {
      const steps = Math.round((raw - min) / step);
      return clamp(Number((min + steps * step).toFixed(10)));
    };

    const valueFromPointer = (clientX: number, clientY: number) => {
      const el = trackRef.current;
      if (!el) return value;
      const rect = el.getBoundingClientRect();
      let pct: number;
      if (direction === "vertical") {
        // 纵向：底部 = min，顶部 = max
        pct = 1 - (clientY - rect.top) / rect.height;
      } else {
        pct = (clientX - rect.left) / rect.width;
      }
      pct = Math.min(1, Math.max(0, pct));
      return getStepValue(min + pct * (max - min));
    };

    const update = (next: number) => {
      if (controlledValue === undefined) {
        setInternalValue(next);
      }
      onChange?.(next);
    };

    const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
      if (disabled) return;
      e.preventDefault();
      draggingRef.current = true;
      e.currentTarget.setPointerCapture(e.pointerId);
      update(valueFromPointer(e.clientX, e.clientY));
    };

    const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!draggingRef.current || disabled) return;
      update(valueFromPointer(e.clientX, e.clientY));
    };

    const handlePointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // noop
      }
      onChangeComplete?.(value);
    };

    const handleKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
      if (disabled) return;
      let next: number;
      switch (e.key) {
        case "ArrowLeft":
        case "ArrowDown":
          next = value - step;
          break;
        case "ArrowRight":
        case "ArrowUp":
          next = value + step;
          break;
        case "Home":
          next = min;
          break;
        case "End":
          next = max;
          break;
        default:
          return;
      }
      e.preventDefault();
      next = clamp(next);
      if (next !== value) {
        update(next);
        onChangeComplete?.(next);
      }
    };

    const pct = max === min ? 0 : ((value - min) / (max - min)) * 100;
    const isVertical = direction === "vertical";

    return (
      <div
        {...rest}
        ref={ref}
        className={cls}
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-disabled={disabled}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onKeyDown={handleKeyDown}
      >
        <div className={vcls("track")} ref={trackRef}>
          <div
            className={vcls("filled")}
            style={
              isVertical ? { height: `${pct}%` } : { width: `${pct}%` }
            }
          />
          <div
            className={vcls("thumb")}
            style={
              isVertical ? { bottom: `${pct}%` } : { left: `${pct}%` }
            }
          />
        </div>
      </div>
    );
  },
);
