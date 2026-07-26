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
import { Button, Tag } from 'vauid-components';

export default () => (
  <div style={{ padding: '20px' }}>
    <h3 style={{ marginBottom: '16px' }}>布局引擎基础示例</h3>
    <p style={{ color: '#666', marginBottom: '16px' }}>
      布局引擎支持 Grid、Focus、Fullscreen 三种布局模式，
      通过 useEngine hook 管理布局状态。
    </p>
    <div style={{ display: 'flex', gap: '12px' }}>
      <Button>Grid 布局</Button>
      <Button>Focus 布局</Button>
      <Button>Fullscreen</Button>
    </div>
  </div>
);
```
