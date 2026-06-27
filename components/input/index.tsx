import type { InputRef } from "@rc-component/input";
import RcInput from "@rc-component/input";
import { forwardRef, useRef } from "react";
import type {HTMLAttributes} from "react";
import { mergeClassNames } from "../std/util";
import { composeRef } from "@rc-component/util";
import type { ValueType } from "@rc-component/input/lib/interface";

export interface InputProps extends HTMLAttributes<HTMLInputElement> {
  disabled?: boolean;
  value?: ValueType;
}

export const Input = forwardRef<InputRef, InputProps>(
  ({ disabled, value, ...props }, ref) => {
    const inputRef = useRef<InputRef>(null);
    const className = mergeClassNames("input")(props.className);

    return (
      <RcInput
        value={value}
        disabled={disabled}
        className={className}
        ref={composeRef(ref, inputRef)}
        {...props}
      />
    );
  },
);
