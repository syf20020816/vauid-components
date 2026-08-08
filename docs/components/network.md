---
title: Network 网络状态
order: 10
---

# Network 网络状态

网络信号强度和速率显示组件。

## 基础用法

```tsx
import { NetworkStatus, NetworkUpload, NetworkDownload } from 'vauid-components';

export default () => (
  <div style={{ display: 'flex', gap: 12 }}>
    <NetworkStatus />
    <NetworkStatus rtt={200} />
    <NetworkStatus rtt={300} />
    <NetworkUpload />
    <NetworkDownload />
  </div>
);
```

## API

### NetworkStatus

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `rtt` | `number` | - | 网络延迟(ms)，不传则使用浏览器 API 获取 |

### NetworkUpload / NetworkDownload

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `speed` | `number` | - | 速率(byte/s)，不传则使用浏览器 API 获取 |
