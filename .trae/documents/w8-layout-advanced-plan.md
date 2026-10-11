# W8 实现计划：自定义布局注册器 / 拖拽排序 / 键盘导航

## Context

W8 三项功能（spec/tasks-mid.md），用户已重新定义形态：

1. **自定义布局模式** → 注册器模式：使用方实现统一 interface 注册到引擎，引擎调用其 compute；注册后在 Thumbnail popup 中出现对应 Item（icon/label）供切换
2. **拖拽排序** → 设置开关（checkbox，默认关，勾选才允许长按拖拽调整实体位置），引擎支持重排并持久化
3. **键盘导航** → 独立"快捷键"设置分区（游戏键位绑定式 UI，可改键）；默认键位：方向键翻页、Ctrl+←/→ 聚焦 Tile、Ctrl+/ 切布局

**用户已确认的决策**：聚焦移动采用线性循环（Ctrl+←/→ 沿实体顺序，空间导航留后续）；键位冲突采用**拒绝式**（检测到冲突禁止保存并提示）；拖拽仅作用于 **Grid 布局**的可见 Tile。

**实施顺序**：注册器 → 拖拽排序 → 键盘导航（键盘"切布局"依赖布局注册列表）。

## 一、自定义布局注册器

### 类型开放（`components/layout/types.ts`）
- 保留内建 `LayoutTypes`（Grid/Focus/FullScreen）不动，新增 `export type LayoutTypeId = LayoutType | (string & {})`（保自动补全）
- 宽化替换签名：`ComputeConfig.layoutType`（compute.ts L35）、`EngineState.layoutType`、`setLayoutType/getLayoutType`、`LayoutState.layoutType`（L203）

### 新文件 `components/layout/engine/layoutMode.ts`

```ts
export interface LayoutModeDefinition<Entity extends LayoutEntity = LayoutEntity> {
  type: string;                  // 全局唯一，不可与内建冲突
  label: string;                 // Thumbnail tooltip / 设置页展示
  icon?: ReactNode;              // Thumbnail 图标，缺省用占位块 + label
  compute: (config: ComputeConfig<Entity>) => LayoutNodes<Entity>;
  getTotalPages?: (config: ComputeConfig<Entity>) => number;  // 缺省用内建 ceil(n/pageSize)
  activate?: (engine: Engine<Entity>) => void;                // 激活副作用钩子
}
```

约定：compute 只管几何（x/y/w/h/area/page/isFocus/zIndex/hidden），`styleSheet` 由引擎统一后处理补齐（使用者显式写了则尊重）；所有实体（含不可见）都输出节点（hidden:true）；自行消费 config.page/pageSize 做分页切片；**始终主线程执行**。

### Engine 注册 API（`engine/index.ts`）
- `private layoutModes = new Map<string, LayoutModeDefinition>()`（注册序即展示序）
- `registerLayoutMode(def)`（重复 type 覆盖并 console.warn；内建三值拒绝）、`unregisterLayoutMode(type)`、`getLayoutModes(): readonly LayoutModeDefinition[]`、`private getLayoutModeDef(type)`
- `LifeTimes` 新增 `onLayoutModesChange`（EventMap 同现有模式），register/unregister 后 emit

### compute 分发（Engine 层收敛，`compute.ts` 与 `worker/` 零改动）
- `computeAndCache()`：`getLayoutModeDef(config.layoutType)` 命中 → `custom.compute(config)` + 遍历补 `node.styleSheet ??= styleBuildFn(node)`；否则走原 `LayoutCompute.compute(config, styleBuildFn)`
- `computeAndCacheAsync()` 开头：自定义模式命中 → 直接 `return this.computeAndCache()`（函数不可序列化进 Worker；内建三值继续 Worker + 超时回退）
- `totalPages` 收敛：removeEntity(L763)/nextPage(L889)/applySmartFillBeforeCompute(L558) 三处直接调 `LayoutCompute.totalPages` → 抽 `private resolveTotalPages()`（自定义且有 getTotalPages 用之，否则内建公式）
- 行为边界（写进文档）：setPage/nextPage/prevPage 照常推进 page 由自定义 compute 消费；focus()/grid() 强切回内建模式；fullScreen 与 layoutType 正交

### 布局激活统一入口（Thumbnail 与键盘共用）
- `activateLayout(type)`：Grid→grid()；Focus→已有焦点保页否则 focusFirst()；FullScreen→fullScreenFirst()；自定义→activate?.() + setLayoutType(type)
- `cycleLayoutMode()`：按 [Grid, Focus, FullScreen, ...registered] 循环（全屏态视为 FullScreen 参与）
- **顺手修 bug**：`focusFirst()`（L810-812）空实体时 `entities[0].id` 抛 TypeError，加守卫（grid()/fullScreenFirst() 同理）

### Thumbnail 动态渲染（`thumbnail.tsx`）
- 订阅 `onLayoutModesChange`（现有 onLayoutChange 保留）；`clickTb` 统一走 `activateLayout(type)` 删掉 if/else 特化
- popup 在三个内建项后追加 `getLayoutModes().map(def => <LayoutCustomTb def={def} />)`；LayoutCustomTb 渲染 def.icon（缺省占位块）、title=def.label、selected 态同内建
- SCSS：`@include cmp("layout-custom-tb")` + `&-selected`/`&-icon`，样式对齐现有 tb

## 二、拖拽排序

### Settings（`settings/types.ts`）
- `SettingsState` 增加 `enableDragSort: boolean`（默认 false）；开关 UI 放 `video.tsx`（SettingsRow + Checkbox，label"拖拽排序"）

### Engine reorder API（`engine/index.ts`）
```ts
moveEntity(id, toIndex)      // 视觉语义：移除后插入 clamp(toIndex)，UI 无需换算
reorderEntities(orderedIds)  // 缺席 id 忽略、新实体追加末尾；重排后 computeAndCache + onUpdate + onEntityUpdate(NonPhysicalUpdate)
```
不触发 onLayoutChange（布局模式未变）、不走 deletedEntityIndex（smart 填补只服务删除）。

### 持久化（新 `layout/hooks/useDragSort.ts`）
- 独立 key `vauid-layout-order`（房间/会话级数据，不进 SettingsState）；导出 `loadEntityOrder(): string[]` / `saveEntityOrder(ids)` 纯函数（可测）
- 恢复：entities 首次就绪时 reorderEntities（ref 标记 per-mount 一次防 effect 循环）；保存：onDrop 后 saveEntityOrder

### 长按拖拽（新 `layout/hooks/useTileDragSort.ts` + `layout/index.tsx` 接线）
- `Layout` 新增 props：`dragSort?: { enabled: boolean; onDrop?: (id, toIndex) => void }`
- 仅 `dragSort.enabled && node.area === Areas.Grid && !node.hidden` 的 Entity 绑定 pointer 事件
- 状态机：pointerdown 记起点 + 250ms 长按定时器（位移 >6px 取消）→ 触发后 setPointerCapture 进入拖拽态（源 tile 半透明 modifier、contextmenu preventDefault）→ pointermove 用 `document.elementFromPoint + closest('[data-layout-entity-id]')` 定位目标（Entity 已输出该属性）→ pointerup 提交 `onDrop(dragId, targetIndex)` 并清理
- 指示器：绝对定位 3px 竖线（目标 tile 左缘），`pointer-events:none`；SCSS `cmp("layout-drag-indicator")`；源 tile `&.vauid-dragging { opacity:.5; touch-action:none }`
- React Compiler：所有拖拽状态在事件处理器/effect 内更新，禁渲染期写 ref

### MeetingRoom 接线（`room/index.tsx`）
- `MeetingRoomInner`：`useSettings()` 读 enableDragSort → `<Layout dragSort={{ enabled, onDrop: (id,i)=>{ layout.moveEntity(id,i); saveEntityOrder(...) } }} />`

## 三、键盘导航 + 快捷键设置分区

### 键位纯函数（新 `layout/shortcut.ts`，无 React/DOM 依赖可单测）
- 序列化格式 `[ctrl+][alt+][meta+][shift+]key`，修饰键固定小写顺序
- `normalizeKey`（" "→Space、单字符小写）、`serializeEvent(ev): string|null`（纯修饰键返回 null；shift 仅对非字符变形键记录，避免 "shift+?"）、`parseBinding`、`matchEvent(ev, binding)`（修饰键顺序无关）、`findConflicts(a, b): ShortcutAction[]`
- 放 layout/ 而非 settings/：layout 的 useKeyboardNav 与 settings 设置页共用，避免反向依赖

### 存储（`settings/types.ts`）
```ts
export type ShortcutAction = "pagePrev"|"pageNext"|"focusNext"|"focusPrev"|"toggleLayout";
export type ShortcutBindings = Record<ShortcutAction, string[]>;  // 数组支持一键多绑
export const DEFAULT_SHORTCUTS: ShortcutBindings = {
  pagePrev: ["ArrowLeft", "ArrowUp"],
  pageNext: ["ArrowRight", "ArrowDown"],
  focusNext: ["ctrl+ArrowRight"],
  focusPrev: ["ctrl+ArrowLeft"],
  toggleLayout: ["ctrl+/"],
};
// SettingsState.shortcuts: ShortcutBindings
```
- `hooks/useSettings.ts` 补深合并：`next.shortcuts = { ...DEFAULT_SHORTCUTS, ...(next.shortcuts ?? {}) }`（防老存储短路嵌套对象）
- 单 action 更新：`update("shortcuts", { ...settings.shortcuts, [action]: keys })`

### Engine 聚焦移动（`engine/index.ts`）
```ts
focusStep(delta: 1 | -1)  // 沿实体列表循环；无焦点时 delta=1 → focus(首个)（进 Focus 布局）
focusNext() / focusPrev()
```

### useKeyboardNav（新 `layout/hooks/useKeyboardNav.ts`）
- window keydown 监听；输入控件保护（INPUT/TEXTAREA/SELECT/isContentEditable 直通）；matchEvent 命中 → preventDefault + 分发：pagePrev/Next→prevPage()/nextPage()，focusNext/Prev→focusNext()/focusPrev()，toggleLayout→cycleLayoutMode()
- deps：[ctx?.layout, settings.shortcuts, enabled]；导出供独立使用 + `MeetingRoomInner` 默认挂载（读 settings.shortcuts，无"启用开关"，绑定为空数组即禁用该 action）

### 快捷键设置分区（新 `settings/shortcuts.tsx`）
- `SettingsTab` 加 `"shortcuts"`，TABS 追加 `{ key: "shortcuts", label: "快捷键" }`
- 行 UI：SettingsRow + 右侧键位 chips（`ctrl + ArrowRight` 样式）：
  - 点击 chip → 捕获态（"按下任意键…"，呼吸高亮），useEffect 挂一次性 window keydown（capture:true + preventDefault）
  - **Esc 取消捕获**（Escape 不允许绑定为快捷键）
  - **拒绝式冲突检测**：捕获到键位后 `findConflicts` 扫其它 action，命中 → 不保存、chip 显示冲突提示（如红框 + tip"与『上一页』冲突"），用户先删除对方键位或换键
  - chip hover × 删除（数组清空 = 该 action 禁用）；分区底部"恢复默认"按钮
- ActionLabel：上一页/下一页/聚焦下一个/聚焦上一个/切换布局
- SCSS：`cmp("shortcut-key")` + `&.vauid-capturing` + `&.vauid-conflict`

## 文件清单

**新建（8）**：`layout/engine/layoutMode.ts`、`layout/shortcut.ts`、`layout/hooks/useTileDragSort.ts`、`layout/hooks/useDragSort.ts`、`layout/hooks/useKeyboardNav.ts`、`settings/shortcuts.tsx`、`settings/__tests__/shortcut.test.ts`、`layout/__tests__/layoutMode.test.ts`

**修改（12）**：`layout/types.ts`（LayoutTypeId/LifeTimes.onLayoutModesChange）、`layout/engine/index.ts`（registry/分发/worker 回退/resolveTotalPages/activateLayout/cycleLayoutMode/moveEntity/reorderEntities/focusStep/空实体守卫）、`layout/index.tsx`（dragSort props + pointer 接线 + 指示器）、`layout/thumbnail.tsx`（动态项/activateLayout 统一）、`layout/index.scss`（custom-tb/indicator/dragging）、`room/index.tsx`（接线）、`settings/types.ts`（enableDragSort/shortcuts 类型）、`settings/hooks/useSettings.ts`（深合并）、`settings/index.tsx`（TABS+渲染）、`settings/video.tsx`（拖拽开关 Checkbox）、`settings/index.scss`（shortcut-key）、`components/index.ts`（导出 LayoutModeDefinition/LayoutTypeId/ShortcutAction/ShortcutBindings/DEFAULT_SHORTCUTS/useKeyboardNav）

**文档**：新 `docs/layout/custom-layout.md`（注册器 + 拖拽 + 键盘综合 demo，含 default export 完整函数组件）+ sidebar 注册；`spec/tasks-mid.md` 8.1-8.3 状态更新

**不改**：`engine/compute.ts`、`engine/worker/*`（分发与回退收敛在 Engine 层）

## 验证

1. `npx tsc --noEmit -p tsconfig.json`
2. `npx vitest run`：shortcut.test.ts（序列化 Ctrl+Right/纯修饰键/Space、matchEvent 顺序无关、findConflicts）+ layoutMode.test.ts（注册/覆盖/内建拒绝、cycleLayoutMode 顺序、`[A,B,C] moveEntity(A,2)=[B,C,A]`、reorderEntities 缺席忽略/新实体追加；`new Engine()` width=0 时 compute 提前返回，无 DOM 依赖）
3. dumi demo 操作：Thumbnail 出现第 4 个自定义项 → 点击切换 → 分页/实体增删正常；设置勾选"拖拽排序" → Grid 长按 250ms 拖拽见指示器 → 松手换位 → 刷新恢复顺序；快捷键分区确认默认键位 → ←/→ 翻页 → Ctrl+→ 聚焦下一个 → Ctrl+/ 循环切布局 → 点 chip 改键、Esc 取消、绑冲突键验证拒绝式提示；Input 内按键不触发
