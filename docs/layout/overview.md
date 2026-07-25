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
import { Layout, useEngine, LayoutTypes, DeviceTypes } from 'vauid-components';
import { useRef } from 'react';

function MyLayout() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const entities = [
    { id: '1', label: 'Track 1' },
    { id: '2', label: 'Track 2' },
    { id: '3', label: 'Track 3' },
  ];

  const { nodes } = useEngine({ 
    container: containerRef, 
    entities 
  });

  return (
    <div ref={containerRef} style={{ height: '400px', border: '1px solid #e9ecef' }}>
      <Layout
        nodes={nodes}
        renderEntity={(node) => (
          <div key={node.entityId} style={{ 
            width: '100%', 
            height: '100%', 
            display: 'flex', 
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f8f9fa'
          }}>
            {node.entity.label}
          </div>
        )}
      />
    </div>
  );
}
```
