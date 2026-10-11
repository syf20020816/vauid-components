/**
 * # 快捷键序列化与匹配（纯函数，无运行时 DOM 依赖，可单测）
 *
 * 序列化格式：`[ctrl+][alt+][meta+][shift+]key`，修饰键固定该顺序（小写）。
 * 单字符键保持字符本身形态（如 `?`、`/`），命名键保持原样（如 `ArrowRight`）。
 */

/** 快捷键动作（设置分区与 useKeyboardNav 共用） */
export type ShortcutAction =
  | "pagePrev"
  | "pageNext"
  | "focusNext"
  | "focusPrev"
  | "toggleLayout";

/** 键位绑定：每个 action 对应序列化键位数组，支持一键多绑；空数组 = 禁用该动作 */
export type ShortcutBindings = Record<ShortcutAction, string[]>;

/** 默认键位：方向键翻页、Ctrl+←/→ 聚焦 Tile、Ctrl+/ 切换布局 */
export const DEFAULT_SHORTCUTS: ShortcutBindings = {
  pagePrev: ["ArrowLeft", "ArrowUp"],
  pageNext: ["ArrowRight", "ArrowDown"],
  focusNext: ["ctrl+ArrowRight"],
  focusPrev: ["ctrl+ArrowLeft"],
  toggleLayout: ["ctrl+/"],
};

const MODIFIER_ONLY_KEYS = new Set(["Control", "Alt", "Meta", "Shift"]);

/** 键名归一化：空格统一为 Space，单字符转小写 */
export function normalizeKey(key: string): string {
  if (key === " ") return "Space";
  return key.length === 1 ? key.toLowerCase() : key;
}

export interface ParsedBinding {
  ctrl: boolean;
  alt: boolean;
  meta: boolean;
  shift: boolean;
  key: string;
}

/**
 * ## 解析序列化键位
 * 从头部剥离修饰键前缀，剩余部分整体作为 key（兼容 key 本身为 `+` 的场景）
 */
export function parseBinding(binding: string): ParsedBinding {
  const parsed: ParsedBinding = {
    ctrl: false,
    alt: false,
    meta: false,
    shift: false,
    key: "",
  };
  let rest = binding;
  for (;;) {
    const m = /^(ctrl|alt|meta|shift)\+/i.exec(rest);
    if (!m) break;
    parsed[m[1].toLowerCase() as keyof Omit<ParsedBinding, "key">] = true;
    rest = rest.slice(m[0].length);
  }
  parsed.key = normalizeKey(rest);
  return parsed;
}

/**
 * ## 将键盘事件序列化为标准键位串
 * 纯修饰键按下返回 null；单字符键不记录 shift（位移形态已体现在字符本身，
 * 避免 `shift+?` 这类不可移植的键位）
 */
export function serializeEvent(ev: KeyboardEvent): string | null {
  if (MODIFIER_ONLY_KEYS.has(ev.key)) return null;
  const withShift = ev.shiftKey && ev.key.length !== 1;
  const parts = [
    ev.ctrlKey && "ctrl",
    ev.altKey && "alt",
    ev.metaKey && "meta",
    withShift && "shift",
    normalizeKey(ev.key),
  ].filter(Boolean);
  return parts.join("+");
}

/**
 * ## 匹配键盘事件与键位绑定
 * 修饰键顺序无关；单字符键位不比较 shift（避免键盘布局/输入法差异导致失配）
 */
export function matchEvent(ev: KeyboardEvent, binding: string): boolean {
  const p = parseBinding(binding);
  if (p.key !== normalizeKey(ev.key)) return false;
  return (
    p.ctrl === ev.ctrlKey &&
    p.alt === ev.altKey &&
    p.meta === ev.metaKey &&
    (p.key.length === 1 || p.shift === ev.shiftKey)
  );
}

/**
 * ## 查找与键位冲突的其它 action（拒绝式冲突检测）
 * 返回除 excludeAction 外、绑定了相同键位的 action 列表
 */
export function findConflicts(
  binding: string,
  bindings: ShortcutBindings,
  excludeAction?: ShortcutAction,
): ShortcutAction[] {
  const target = parseBinding(binding);
  const isSame = (b: string) => {
    const p = parseBinding(b);
    return (
      p.key === target.key &&
      p.ctrl === target.ctrl &&
      p.alt === target.alt &&
      p.meta === target.meta &&
      p.shift === target.shift
    );
  };
  return (Object.keys(bindings) as ShortcutAction[]).filter(
    (action) => action !== excludeAction && bindings[action].some(isSame),
  );
}
