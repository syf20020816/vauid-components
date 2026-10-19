import { useEffect, useMemo, useState } from "react";
import { Button } from "../button";
import { SettingsRow } from "./row";
import type { SettingsSectionProps } from "./types";
import type { ShortcutAction } from "../layout/shortcut";
import {
  DEFAULT_SHORTCUTS,
  findConflicts,
  serializeEvent,
} from "../layout/shortcut";

/** 动作展示名 */
const ACTION_LABELS: Record<ShortcutAction, string> = {
  pagePrev: "上一页",
  pageNext: "下一页",
  focusNext: "聚焦下一个",
  focusPrev: "聚焦上一个",
  toggleLayout: "切换布局",
};

const ACTIONS = Object.keys(ACTION_LABELS) as ShortcutAction[];

/** 捕获态：正在改键的 action 与槽位（index = -1 表示追加新键位） */
type Capturing = [action: ShortcutAction, index: number];

/** 键位展示格式化：ctrl+ArrowRight → ctrl + ArrowRight */
function formatBinding(binding: string): string {
  return binding.split("+").join(" + ");
}

/**
 * # ShortcutSettings - 快捷键设置分区
 * 游戏键位绑定式 UI：点击键位 chip 进入捕获态（Esc 取消），捕获到新键位时
 * 做拒绝式冲突检测——与其它 action 冲突则不保存并以红框提示，需先删除冲突键位或换键。
 * 单个键位可删除（该动作全部键位删除即禁用），分区底部可恢复默认键位。
 */
export const ShortcutSettings = ({ settings, update }: SettingsSectionProps) => {
  const [capturing, setCapturing] = useState<Capturing | null>(null);
  // 拒绝式冲突提示：捕获被拒绝时记录（不保存），直至该 action 重新改键/删键
  const [rejected, setRejected] = useState<{
    action: ShortcutAction;
    conflicts: ShortcutAction[];
  } | null>(null);

  // 实时冲突扫描（覆盖默认键位被改出冲突的场景），驱动 chip 红框与提示
  const conflictMap = useMemo(() => {
    const map: Partial<Record<ShortcutAction, ShortcutAction[]>> = {};
    for (const action of ACTIONS) {
      const hits: ShortcutAction[] = [];
      for (const binding of settings.shortcuts[action]) {
        for (const other of findConflicts(binding, settings.shortcuts, action)) {
          if (!hits.includes(other)) hits.push(other);
        }
      }
      if (hits.length > 0) map[action] = hits;
    }
    return map;
  }, [settings.shortcuts]);

  // 捕获态：一次性 window keydown（capture 阶段拦截，避免页面其它监听先响应）
  useEffect(() => {
    if (!capturing) return;
    const [action, index] = capturing;
    const onKeyDown = (ev: KeyboardEvent) => {
      ev.preventDefault();
      ev.stopPropagation();
      // Esc 取消捕获（Escape 不允许绑定为快捷键）
      if (ev.key === "Escape") {
        setCapturing(null);
        return;
      }
      const binding = serializeEvent(ev);
      // 纯修饰键按下：继续等待
      if (!binding) return;
      // 拒绝式冲突：与其它 action 冲突时不保存，仅提示
      const conflicts = findConflicts(binding, settings.shortcuts, action);
      if (conflicts.length > 0) {
        setRejected({ action, conflicts });
        setCapturing(null);
        return;
      }
      const next = [...settings.shortcuts[action]];
      if (index >= 0) next[index] = binding;
      else next.push(binding);
      update("shortcuts", { ...settings.shortcuts, [action]: next });
      setRejected(null);
      setCapturing(null);
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [capturing, settings.shortcuts, update]);

  const removeKey = (action: ShortcutAction, index: number) => {
    update("shortcuts", {
      ...settings.shortcuts,
      [action]: settings.shortcuts[action].filter((_, i) => i !== index),
    });
    if (rejected?.action === action) setRejected(null);
  };

  const resetShortcuts = () => {
    update("shortcuts", { ...DEFAULT_SHORTCUTS });
    setRejected(null);
    setCapturing(null);
  };

  return (
    <div className="vauid-settings-section">
      {ACTIONS.map((action) => {
        const bindings = settings.shortcuts[action];
        const conflictActions =
          conflictMap[action] ??
          (rejected?.action === action ? rejected.conflicts : undefined);
        const conflictLabel = conflictActions
          ? conflictActions.map((a) => ACTION_LABELS[a]).join("、")
          : undefined;
        return (
          <SettingsRow key={action} label={ACTION_LABELS[action]}>
            <div className="vauid-shortcut-keys">
              {bindings.map((binding, index) => {
                const isCapturing =
                  capturing !== null &&
                  capturing[0] === action &&
                  capturing[1] === index;
                return (
                  <span
                    key={`${binding}-${index}`}
                    className={
                      "vauid-shortcut-key" +
                      (isCapturing ? " vauid-capturing" : "") +
                      (conflictActions ? " vauid-conflict" : "")
                    }
                    title={
                      conflictLabel ? `与『${conflictLabel}』冲突` : undefined
                    }
                    onClick={() => setCapturing([action, index])}
                  >
                    {isCapturing ? "按下任意键…" : formatBinding(binding)}
                    {!isCapturing && (
                      <span
                        className="vauid-shortcut-key-del"
                        onClick={(ev) => {
                          ev.stopPropagation();
                          removeKey(action, index);
                        }}
                      >
                        ×
                      </span>
                    )}
                  </span>
                );
              })}
              {bindings.length === 0 && (
                <span
                  className={
                    "vauid-shortcut-key vauid-shortcut-key--add" +
                    (capturing !== null && capturing[0] === action
                      ? " vauid-capturing"
                      : "")
                  }
                  onClick={() => setCapturing([action, -1])}
                >
                  {capturing !== null && capturing[0] === action
                    ? "按下任意键…"
                    : "+ 添加键位"}
                </span>
              )}
              {conflictActions && (
                <span className="vauid-settings-row-tip">
                  与『{conflictLabel}』冲突，请先删除对方键位或更换按键
                </span>
              )}
            </div>
          </SettingsRow>
        );
      })}
      <SettingsRow label="">
        <Button onClick={resetShortcuts}>恢复默认键位</Button>
      </SettingsRow>
    </div>
  );
};
