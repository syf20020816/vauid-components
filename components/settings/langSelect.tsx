import { Select, type SelectProps } from "../select";
import type { SelectOption } from "../select";

/** 内置语言列表 */
export const LANG_OPTIONS: SelectOption[] = [
  { value: "zh-CN", label: "简体中文" },
  { value: "zh-TW", label: "繁體中文" },
  { value: "en-US", label: "English" },
  { value: "ja-JP", label: "日本語" },
  { value: "ko-KR", label: "한국어" },
  { value: "fr-FR", label: "Français" },
  { value: "de-DE", label: "Deutsch" },
  { value: "es-ES", label: "Español" },
];

export interface LangSelectProps
  extends Omit<SelectProps, "options" | "value" | "onChange"> {
  /** 语言代码（BCP 47），受控 */
  value?: string;
  defaultValue?: string;
  onChange?: (lang: string) => void;
}

/**
 * # LangSelect - 语言选择
 * 基于 Select 的语言预设（内置常用语言列表），可经 options 扩展由外部覆盖。
 */
export const LangSelect = ({
  value,
  defaultValue = "zh-CN",
  onChange,
  ...props
}: LangSelectProps) => {
  return (
    <Select
      options={LANG_OPTIONS}
      value={value}
      defaultValue={defaultValue}
      onChange={(v) => onChange?.(String(v))}
      {...props}
    />
  );
};
