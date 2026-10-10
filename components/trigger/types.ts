import type { ReactNode, MouseEvent } from "react";
import type { FnReturn } from "../std";

export interface Option {
  label: ReactNode;
  value: string | number;
  icon?: ReactNode;
  /** 禁用该项（不可点击） */
  disabled?: boolean;
  /** 危险项（红色强调，用于删除/退出等操作） */
  danger?: boolean;
  /** 每次点击该项时触发（无论是否切换选中） */
  onClick?: (
    value: string | number,
    e: MouseEvent<HTMLElement>,
  ) => FnReturn<void>;
  /** 切换选中时触发（点击已选中项不会触发） */
  onSelect?: (
    value: string | number,
    e: MouseEvent<HTMLElement>,
  ) => FnReturn<void>;
  active?: boolean;
}
