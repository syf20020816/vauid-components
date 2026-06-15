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