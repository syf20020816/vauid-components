import type { HTMLAttributes, ReactNode } from "react";
import { useCls } from "../std/hooks/cls";

export interface SettingsRowProps extends HTMLAttributes<HTMLDivElement> {
  /** 左侧行标签 */
  label: ReactNode;
  /** 右侧控件区 */
  children: ReactNode;
}

/** 设置行：左标签 + 右控件，settings 各分区共用 */
export const SettingsRow = ({ label, children, ...props }: SettingsRowProps) => {
  const { cls, vcls } = useCls("settings-row", undefined);
  return (
    <div {...props} className={cls}>
      <span className={vcls("label")}>{label}</span>
      <div className={vcls("control")}>{children}</div>
    </div>
  );
};
