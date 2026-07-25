---
title: 布局引擎 API
order: 1
---

# 布局引擎 API

## Engine 方法

### 状态操作

```typescript
engine.focus(entity);           // 设置焦点
engine.unFocus();               // 取消焦点
engine.setFullScreen(true);     // 全屏模式
engine.setPage(2);              // 切换页码
engine.nextPage();              // 下一页
engine.prevPage();              // 上一页
engine.setEntities(entities);   // 更新实体列表
engine.removeEntity(id);        // 删除实体
engine.setLayoutType(type);     // 切换布局类型
engine.setDeviceType(type, auto); // 切换设备类型
engine.setAspectRatio(w, h);    // 设置宽高比
```

### 动画配置

```typescript
engine.setAnimationOptions("enableFlip");
engine.setAnimationOptions("normal");
engine.setAnimationOptions("define", { transitionDuration: 300 });
```

### 生命周期监听

```typescript
engine.on('onUpdate', () => { /* 状态更新 */ });
engine.on('onResize', (w, h) => { /* 容器尺寸变化 */ });
```

## 配置参数

| 参数 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `pageSize` | `number` | 桌面 6 / 移动 3 | 每页显示实体数量 |
| `railWidth` | `number` | `220` | 桌面端 rail 区域宽度 |
| `railHeight` | `number` | `140` | 移动端 rail 区域高度 |
| `fixedSize` | `boolean` | `true` | 是否保持固定宽高比 |
| `gridFixedSize` | `boolean` | `false` | Grid 布局是否保持固定宽高比 |
| `aspectRatio` | `{ w, h }` | 桌面 16:9 / 移动 9:16 | 实体宽高比 |
| `smart` | `boolean` | `true` | 是否开启智能末尾填补 |
| `layoutType` | `LayoutType` | `Grid` | 布局模式 |
| `deviceType` | `DeviceType` | `Desktop` | 设备类型 |
