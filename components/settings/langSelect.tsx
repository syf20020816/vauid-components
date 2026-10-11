import { Select, type SelectProps } from "../select";

/**
 * i18n 语言代码（BCP 47）。
 * 预置常用项提供编辑器自动补全，`(string & {})` 兜底允许任意自定义语言。
 */
export type LangType =
  | "zh-CN"
  | "zh-TW"
  | "en-US"
  | "ja-JP"
  | "ko-KR"
  | "fr-FR"
  | "de-DE"
  | "es-ES"
  | (string & {});

export interface LangSelectProps
  extends Omit<SelectProps, "value" | "defaultValue" | "onChange"> {
  /** 语言代码（BCP 47），受控 */
  value?: LangType;
  /** 非受控默认语言 */
  defaultValue?: LangType;
  /** 选中语言回调 */
  onChange?: (lang: LangType) => void;
}

/**
 * # LangSelect - 语言选择
 * 基于 Select 的语言选择器，value/onChange 收窄为 LangType；
 * 语言选项由使用方传入（示例列表见文档 / 测试）。
 */
export const LangSelect = ({
  value,
  defaultValue,
  onChange,
  ...props
}: LangSelectProps) => {
  return (
    <Select
      {...props}
      placeholder="选择语言"
      value={value}
      defaultValue={defaultValue}
      onChange={(v) => onChange?.(v as LangType)}
    />
  );
};
