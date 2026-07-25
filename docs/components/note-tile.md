---
title: NoteTile 备注 Tile
order: 14
---

# NoteTile 备注 Tile

文本/备注 Tile，支持 Markdown 渲染。

## 基础用法

```tsx
import { NoteTile } from 'vauid-components';

const noteValue = `
# 房间公告！
房间公告内容：这是一个房间公告。

## 注意事项
- 注意事项一
- 注意事项二
`;

export default () => (
  <div style={{ height: 400, width: 300, backgroundColor: '#2e2e2eff' }}>
    <NoteTile value={noteValue} />
  </div>
);
```

## API

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `value` | `string` | - | Markdown 内容 |
