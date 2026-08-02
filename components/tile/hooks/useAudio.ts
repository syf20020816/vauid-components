import { useEffect, useRef } from "react";

interface UseAudioWaveOptions {
  barCount?: number;
  barWidth?: number;
  gap?: number;
  minHeight?: number;
  maxHeight?: number;
  color?: string;
  speed?: number;
  height?: number;
}

/**
 * 动态音频波形 Hook - 使用 canvas 绘制动画波形
 * 模拟音频活跃度，实现类似真实音频波形的跳动效果
 */
export const useAudioWave = ({
  barCount = 24,
  barWidth = 3,
  gap = 2,
  minHeight = 0.1,
  maxHeight = 1,
  color = "currentColor",
  speed = 0.08,
  height = 40,
}: UseAudioWaveOptions = {}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const heightsRef = useRef<number[]>([]);
  const targetsRef = useRef<number[]>([]);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 初始化高度
    heightsRef.current = Array.from({ length: barCount }, () => minHeight);
    targetsRef.current = Array.from(
      { length: barCount },
      () => Math.random() * maxHeight,
    );

    const dpr = window.devicePixelRatio || 1;
    const totalWidth = barCount * (barWidth + gap) - gap;
    canvas.width = totalWidth * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${totalWidth}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    const animate = () => {
      const w = totalWidth;
      const h = height;

      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < barCount; i++) {
        // 平滑过渡到目标值
        heightsRef.current[i] +=
          (targetsRef.current[i] - heightsRef.current[i]) * speed;

        // 随机更新目标值
        if (Math.random() < 0.08) {
          targetsRef.current[i] =
            minHeight + Math.random() * (maxHeight - minHeight);
        }

        const barHeight = heightsRef.current[i] * h;
        const x = i * (barWidth + gap);
        const y = (h - barHeight) / 2;

        ctx.fillStyle = color;
        ctx.beginPath();
        const radius = barWidth / 2;

        // 绘制圆角矩形
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + barWidth - radius, y);
        ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
        ctx.lineTo(x + barWidth, y + barHeight - radius);
        ctx.quadraticCurveTo(
          x + barWidth,
          y + barHeight,
          x + barWidth - radius,
          y + barHeight,
        );
        ctx.lineTo(x + radius, y + barHeight);
        ctx.quadraticCurveTo(x, y + barHeight, x, y + barHeight - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [barCount, barWidth, gap, minHeight, maxHeight, color, speed, height]);

  return canvasRef;
};
