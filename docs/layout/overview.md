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
| `setFullScreen(boolean)` | 设置全屏 | boolean |
| `setDeviceType(type, auto)` | 设置设备类型 | type: 'mobile' \| 'desktop', auto?: boolean |
| `setAnimationOptions(type)` | 设置动画选项 | type: 'enableFlip' \| 'normal' \| 'define' |

### Layout 组件

用于渲染布局的 React 组件。

```md
<Layout
  ref={containerRef}
  nodes={nodes}
  tileStyle={(node, index) => ({
    background: node.isFocus ? '#d0266aff' : BG_COLORS[index],
    borderRadius: 0,
    color: '#fff',
  })}
  renderEntity={(node) => node.entity.label}
/>
```
