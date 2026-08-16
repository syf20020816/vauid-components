---
title: Button 按钮
order: 1
---

# Button 按钮

基础按钮组件，支持图标、尺寸、圆角等配置。

## 基础用法

```tsx
import { Button } from 'vauid-components';

export default () => (
  <div style={{ display: 'flex', gap: 12 }}>
    <Button>普通按钮</Button>
    <Button round>圆角按钮</Button>
    <Button size="small">小按钮</Button>
    <Button size="large">大按钮</Button>
  </div>
);
```

## 图标按钮

```tsx
import { Button, Icon } from 'vauid-components';

export default () => (
  <div style={{ display: 'flex', gap: 12 }}>
    <Button icon={<Icon.Arrow width={16} height={16} />}>带图标</Button>
    <Button icon={<Icon.Arrow width={16} height={16} />} iconPosition="right">
      图标在右
    </Button>
    <Button icon={<Icon.Arrow width={16} height={16} />} size="small" />
  </div>
);
```

## API

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `children` | `ReactNode` | - | 按钮内容 |
| `icon` | `ReactNode` | - | 图标 |
| `iconPosition` | `"left" \| "right"` | `"left"` | 图标位置 |
| `round` | `boolean` | `false` | 是否圆角 |
| `size` | `"small" \| "medium" \| "large"` | `"medium"` | 按钮尺寸 |
