---
title: 布局引擎概述
order: 0
---

# 布局引擎

Vauid Components 的核心布局引擎，支持多种布局模式。

## 布局模式

| 模式 | 描述 | 适用场景 |
|------|------|----------|
| **Grid** | 标准网格布局，自动计算最优行列数 | 多人会议、画廊视图 |
| **Focus** | 主视口 + rail 布局，桌面端 rail 在左，移动端 rail 在下 | 演讲者模式、焦点跟踪 |
| **Fullscreen** | 单个实体占满容器 | 全屏查看、沉浸式体验 |

## 快速开始

```tsx
import { Page } from '../../components/layout/__tests__/layout';

export default () => (
  <div style={{ height: '500px', width: '100%' }}>
    <Page />
  </div>
);
```

## API 说明

### useEngine Hook

用于管理布局引擎状态的 React Hook。

```typescript
const { engine, size, nodes } = useEngine({
  container: containerRef,
  entities: defaultEntities,
});
```

### Engine 实例方法

| 方法 | 说明 | 参数 |
|------|------|------|
| `focus(id)` | 设置焦点实体 | id: string |
| `unFocus()` | 取消焦点 | 无 |
| `addEntity(entity)` | 添加实体 | entity: LayoutEntity |
| `delEntity(id)` | 删除实体 | id: string |
| `nextPage()` | 下一页 | 无 |
| `prevPage()` | 上一页 | 无 |
| `setFullScreen(id?)` | 设置全屏实体，传入 id 全屏对应实体，不传/传空退出全屏并恢复原布局 | id?: string |
| `setDeviceType(type, auto)` | 设置设备类型 | type: 'mobile' \| 'desktop', auto?: boolean |
| `setAnimationOptions(type)` | 设置动画选项 | type: 'enableFlip' \| 'normal' \| 'define' |

### Layout 组件

用于渲染布局的 React 组件。通过 `renderEntity` 渲染每个节点的内容，推荐使用 `TileWrap` 包裹业务 Tile，并将 `node` 传入，悬浮层的默认组件会基于 `node` 自动展示（用户名称取自 `node.entity.label`，聚焦按钮状态取自 `node.isFocus`）。

```tsx
import { Layout } from 'vauid-components/layout';
import { TileWrap } from 'vauid-components/tile/wrap';

<Layout
  ref={containerRef}
  nodes={nodes}
  tileStyle={(node, index) => ({
    background: node.isFocus ? '#d0266aff' : BG_COLORS[index],
    borderRadius: 0,
    color: '#fff',
  })}
  renderEntity={(node) => (
    <TileWrap
      node={node}
      float={{
        leftTop: { show: false },
        rightTop: { focus: { show: false }, fullScreen: { show: false } },
        rightBottom: { show: false },
      }}
    >
      {node.entity.label}
    </TileWrap>
  )}
/>
```

#### TileWrap 与 LayoutNode

`TileWrap` 需要接收布局引擎输出的 `LayoutNode` 作为 `node` prop，用于驱动悬浮层默认组件的展示：

| 悬浮位置 | 默认组件 | 使用的 node 字段 |
|----------|----------|------------------|
| 左上角 `leftTop` | 举手图标 | - |
| 左下角 `leftBottom` | 用户名称 | `node.entity.label` |
| 右上角 `rightTop` | 聚焦 / 全屏按钮 | `node.isFocus` |
| 右下角 `rightBottom` | 网络信号 | - |
