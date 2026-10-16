import { describe, expect, it } from "vitest";
import { LangSelect, type LangType } from "../langSelect";
import type { Option } from "../../trigger/types";

/** 语言列表示例（库内不内置，文档 demo 与测试共用此形态） */
const LANG_OPTIONS: Option[] = [
  { value: "zh-CN", label: "简体中文" },
  { value: "zh-TW", label: "繁體中文" },
  { value: "en-US", label: "English" },
  { value: "ja-JP", label: "日本語" },
  { value: "ko-KR", label: "한국어" },
  { value: "fr-FR", label: "Français" },
  { value: "de-DE", label: "Deutsch" },
  { value: "es-ES", label: "Español" },
];

describe("LangSelect", () => {
  it("导出可渲染组件", () => {
    expect(typeof LangSelect).toBe("function");
  });

  it("语言列表项 value 均可作为 LangType，label 非空", () => {
    for (const option of LANG_OPTIONS) {
      const lang: LangType = String(option.value);
      expect(lang.length).toBeGreaterThan(0);
      expect(String(option.label).length).toBeGreaterThan(0);
    }
  });
});
