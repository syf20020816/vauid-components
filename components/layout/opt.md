### 3. 智能末尾填补算法

假设 rail 容量为 5，当前实体为 `[A, B, C, D, E, F, G, H]`：

- **常规做法**：聚焦 `C` 到主视口，rail 变为 `[A, B, D, E, F]`，`D/E/F` 都要前移（3 个元素移动）
- **智能填补**：聚焦 `C` 到主视口，将 `F`（当前页最后一个）直接移到 `C` 原来的位置，rail 视觉呈现 `[A, B, F, D, E]`，只有 `C` 和 `F` 发生 Transform 变化（2 个元素移动）

### 4. 完整的 0 帧策略

```tsx
function Tile({ node, entity }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (node.hidden) {
      videoRef.current?.pause(); // 停止解码，节省 CPU/GPU
    } else {
      videoRef.current?.play();
    }
  }, [node.hidden]);

  return (
    <div
      className={`tile ${node.hidden ? 'tile-hidden' : ''}`}
      style={{
        transform: `translate(${node.x}px, ${node.y}px)`,
        opacity: node.hidden ? 0 : 1,
        pointerEvents: node.hidden ? 'none' : 'auto',
      }}
    >
      <video ref={videoRef} src={entity.streamUrl} />
    </div>
  );
}
```

## 总结

| 维度 | 当前 | 完全实现 |
|:---|:---|:---|
| DOM 节点 | 每个实体一个 DOM | 固定数量节点池，复用 DOM |
| 布局切换 | 直接更新 style | Transform + CSS transition 平滑过渡 |
| 填补算法 | 无 | 末尾填补，O(1) Transform 变化 |
| 视频解码 | 无控制 | hidden 时 pause()，真·0 帧 |
| iframe 重载 | 可能重载 | DOM 恒定，iframe 状态 100% 保留 |

要实现完全版，需要：
1. 重写渲染层，使用固定 DOM 节点池
2. 在 Engine 中实现智能填补算法
3. 添加 CSS transition 动画
4. 在 Tile 组件中实现视频暂停/恢复逻辑