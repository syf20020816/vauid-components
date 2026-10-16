---
title: 自定义布局与交互
order: 2
---

# 自定义布局与交互

布局引擎除了内建的 Grid / Focus / FullScreen 三种模式，还支持通过**注册器模式**接入自定义布局；配合**拖拽排序**与**键盘导航**，可以搭建接近成熟会议产品的交互体验。

## 自定义布局注册器

实现 `LayoutModeDefinition` 接口并通过 `engine.registerLayoutMode()` 注册，引擎会据此分发计算，Thumbnail 会自动渲染对应的切换项。

```ts
import type { LayoutModeDefinition } from "vauid-components";

const definition: LayoutModeDefinition = {
  // 全局唯一，不可与内建 "grid" / "focus" / "full_screen" 冲突
  type: "spotlight",
  // Thumbnail 提示 / 展示名
  label: "聚光",
  // 可选：Thumbnail 图标（ReactNode），缺省渲染占位图标
  // icon: <Users size={16} />,
  // 布局计算：输入完整计算配置，输出节点表
  compute: (config) => {
    /* ... */
    return new Map();
  },
  // 可选：覆盖总页数计算（默认 ceil(n / pageSize)）
  // getTotalPages: (config) => 1,
  // 可选：激活副作用钩子（如初始化内部状态）
  // activate: (engine) => {},
};
```

### compute 约定

- 只需输出几何信息（`x / y / width / height / area / page / isFocus / zIndex / hidden`），`styleSheet` 由引擎统一后处理补齐，动画体系不被绕过
- **每个实体（含不可见）都应输出节点**，不可见实体输出 `hidden: true`，保证 nodeWatcher diff 一致
- 自行消费 `config.page / config.pageSize` 实现分页切片
- **始终在主线程执行**（函数无法序列化进 Worker）；内建模式不受影响仍走 Worker

### 注册 API

| 方法                                            | 说明                                                       |
| ----------------------------------------------- | ---------------------------------------------------------- |
| `registerLayoutMode(def)`                       | 注册；内建三值拒绝，重复 `type` 覆盖并告警，触发重渲染通知   |
| `unregisterLayoutMode(type)`                    | 注销；若注销的是当前激活布局，自动回退 Grid                 |
| `getLayoutModes()`                              | 获取全部已注册定义（注册序即 Thumbnail 展示序）             |
| `activateLayout(type)`                          | 统一激活入口，内建与自定义都走这里                          |
| `cycleLayoutMode()`                             | 按 Grid → Focus → FullScreen → 已注册列表 循环切换          |

## 示例：聚光布局

前两名参会者占据上方大画面，其余成员在下方横排展示：

```tsx
import { useEffect, useRef } from "react";
import {
  RoomCtxProvider,
  RoomHeader,
  Controller,
  Layout,
  useEngine,
  useRoomCtx,
} from "vauid-components";
import type { LayoutModeDefinition } from "vauid-components";

const ENTITIES = Array.from({ length: 5 }, (_, i) => ({
  id: `p-${i + 1}`,
  label: `参与者 ${i + 1}`,
}));

const GAP = 4;

/** 聚光布局：前 2 个实体大画面并排，其余进入下方横排 */
const SPOTLIGHT: LayoutModeDefinition = {
  type: "spotlight",
  label: "聚光",
  compute: (config) => {
    const nodes = new Map();
    const { width, height, entities, page, pageSize } = config;
    const start = (page - 1) * pageSize;
    const visible = entities.slice(start, start + pageSize);
    const bigCount = Math.min(2, visible.length);
    const railTop = height * 0.62;

    visible.forEach((entity, i) => {
      if (i < bigCount) {
        const w = bigCount === 1 ? width : width / 2 - GAP;
        nodes.set(entity.id, {
          entity,
          x: i === 0 ? 0 : width / 2 + GAP / 2,
          y: 0,
          width: w,
          height: railTop - GAP,
          area: "main",
          page,
          isFocus: i === 0,
          zIndex: 2,
          hidden: false,
        });
      } else {
        const railCount = visible.length - bigCount;
        nodes.set(entity.id, {
          entity,
          x: ((width / railCount) * (i - bigCount)) + GAP / 2,
          y: railTop,
          width: width / railCount - GAP,
          height: height - railTop - GAP,
          area: "rail",
          page,
          isFocus: false,
          zIndex: 1,
          hidden: false,
        });
      }
    });

    // 约定：全部实体（含当前页之外）都输出节点，不可见实体 hidden
    entities.forEach((entity) => {
      if (!nodes.has(entity.id)) {
        nodes.set(entity.id, {
          entity,
          x: 0,
          y: 0,
          width: 0,
          height: 0,
          area: "grid",
          page,
          isFocus: false,
          zIndex: 0,
          hidden: true,
        });
      }
    });
    return nodes;
  },
};

function SpotlightDemo() {
  const containerRef = useRef(null);
  const { layout } = useRoomCtx() ?? {};
  const { nodes } = useEngine({ container: containerRef, entities: ENTITIES });

  // 挂载时注册、卸载时注销（避免污染共享引擎）
  useEffect(() => {
    if (!layout) return;
    layout.registerLayoutMode(SPOTLIGHT);
    return () => layout.unregisterLayoutMode("spotlight");
  }, [layout]);

  return (
    <div style={{ height: 480, display: "flex", flexDirection: "column" }}>
      <RoomHeader roomName="自定义布局示例" />
      <div style={{ flex: 1, minHeight: 0 }}>
        <Layout ref={containerRef} nodes={nodes} />
      </div>
      <Controller position="center" />
    </div>
  );
}

export default () => (
  <RoomCtxProvider>
    <SpotlightDemo />
  </RoomCtxProvider>
);
```

打开右上角**布局缩略图**，可以看到第 4 个自定义项「聚光」，点击即可切换。

## 拖拽排序

拖拽排序作为设置项提供：设置面板 → 视频 → **拖拽排序**（勾选后才允许长按拖拽调整画面位置）。

- 仅 **Grid 布局**的可见 Tile 支持长按拖拽（按住 250ms 触发，移动超过 6px 视为普通滑动取消）
- 拖拽中源 Tile 半透明，目标 Tile 左缘显示指示线，松手完成换位
- 排序结果持久化在 `localStorage`（key: `vauid-layout-order`），刷新后恢复

`MeetingRoom` 已默认接线。自行组合时通过 `Layout` 的 `dragSort` prop 接入：

```ts
<Layout
  nodes={nodes}
  dragSort={{
    enabled: true, // 通常读 settings.enableDragSort
    onDrop: (dragId, toIndex) => {
      engine.moveEntity(dragId, toIndex); // 视觉语义：移除后插入并钳制边界
      saveEntityOrder(engine.getState().entities.map((e) => e.id));
    },
  }}
/>
```

引擎侧重排 API：

| 方法                          | 说明                                                             |
| ----------------------------- | ---------------------------------------------------------------- |
| `moveEntity(id, toIndex)`     | 视觉语义移动（移除后插入 `toIndex`，越界自动钳制）                |
| `reorderEntities(orderedIds)` | 按传入 id 顺序重排；缺席 id 忽略、新实体追加末尾                  |

## 键盘导航与快捷键设置

设置面板新增**快捷键**分区（游戏键位绑定式 UI）。默认键位：

| 动作       | 默认键位              | 说明                     |
| ---------- | --------------------- | ------------------------ |
| 上一页     | `←` / `↑`             | 翻到上一页               |
| 下一页     | `→` / `↓`             | 翻到下一页               |
| 聚焦下一个 | `Ctrl + →`            | 沿实体顺序循环聚焦       |
| 聚焦上一个 | `Ctrl + ←`            | 沿实体顺序循环聚焦       |
| 切换布局   | `Ctrl + /`            | 循环切换全部布局模式     |

设置分区支持：

- 点击键位 chip 重新绑定（捕获态按 **Esc** 取消，`Escape` 不允许绑定为快捷键）
- **拒绝式冲突检测**：新键位与其它动作冲突时不保存，chip 红框提示，需先删除冲突键位或换键
- 键位 chip 悬停 × 删除（动作的全部键位删除即禁用该动作），底部可一键恢复默认

`MeetingRoom` 已默认挂载键盘导航。独立使用时：

```ts
import { useKeyboardNav } from "vauid-components";

// 须在 RoomCtxProvider 内使用；绑定为空数组即禁用对应动作
useKeyboardNav({ bindings: settings.shortcuts });
```

键位序列化格式为 `[ctrl+][alt+][meta+][shift+]key`（如 `ctrl+ArrowRight`），输入框内按键不会触发导航。
