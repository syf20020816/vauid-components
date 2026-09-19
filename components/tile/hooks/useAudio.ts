import { useEffect, useRef, type RefObject } from "react";

interface UseAudioWaveOptions {
  barCount?: number;
  barWidth?: number;
  gap?: number;
  minHeight?: number;
  maxHeight?: number;
  color?: string;
  speed?: number;
  height?: number;
  /** 绑定的 audio 元素：其 srcObject 上存在音频流时，波形由真实频谱驱动 */
  audioElRef?: RefObject<HTMLAudioElement | null>;
}

/**
 * 动态音频波形 Hook - 使用 canvas 绘制动画波形
 *
 * 无音频流时模拟音频活跃度；传入 audioElRef 且元素挂载了
 * MediaStream 后，通过 WebAudio AnalyserNode 读取真实频谱驱动波形
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
  audioElRef,
}: UseAudioWaveOptions = {}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const heightsRef = useRef<number[]>([]);
  const targetsRef = useRef<number[]>([]);
  const rafRef = useRef<number>(0);
  // 真实频谱数据（无音频流时为 null，波形退化为模拟动画）
  const spectrumRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const meterRafRef = useRef<number>(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // 监听 audio 元素的 srcObject，动态构建/销毁频谱分析器
  // （流的挂载时机由使用方 bind 决定，可能晚于组件挂载，因此轮询观察）
  useEffect(() => {
    const el = audioElRef?.current;
    if (!audioElRef || !el) return;

    const teardown = () => {
      analyserRef.current?.disconnect();
      analyserRef.current = null;
      void audioCtxRef.current?.close().catch(() => {});
      audioCtxRef.current = null;
      spectrumRef.current = null;
    };

    const setup = (stream: MediaStream) => {
      const ctx = new AudioContext();
      // 自动播放策略下可能被挂起，尝试恢复（失败则波形停在最小高度）
      void ctx.resume().catch(() => {});
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
      spectrumRef.current = new Uint8Array(analyser.frequencyBinCount);
    };

    const watch = () => {
      // srcObject 可能是 MediaSource，频谱分析仅支持 MediaStream
      const stream = el.srcObject instanceof MediaStream ? el.srcObject : null;
      if (stream && !analyserRef.current) {
        setup(stream);
      } else if (!stream && analyserRef.current) {
        teardown();
      }
      const analyser = analyserRef.current;
      const spectrum = spectrumRef.current;
      if (analyser && spectrum) {
        analyser.getByteFrequencyData(spectrum);
      }
      meterRafRef.current = requestAnimationFrame(watch);
    };

    meterRafRef.current = requestAnimationFrame(watch);

    return () => {
      cancelAnimationFrame(meterRafRef.current);
      teardown();
    };
  }, [audioElRef]);

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

    // 频谱分桶：只取中低频段（语音能量集中区，比例 0.7），均分为 barCount 个桶
    const spectrumRatio = 0.7;

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
      const spectrum = spectrumRef.current;

      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < barCount; i++) {
        // 平滑过渡到目标值
        heightsRef.current[i] +=
          (targetsRef.current[i] - heightsRef.current[i]) * speed;

        if (spectrum) {
          // 真实频谱：桶内均值归一化后映射到 [minHeight, maxHeight]
          const usable = Math.floor(spectrum.length * spectrumRatio);
          const start = Math.floor((i * usable) / barCount);
          const end = Math.max(start + 1, Math.floor(((i + 1) * usable) / barCount));
          let sum = 0;
          for (let j = start; j < end; j++) sum += spectrum[j];
          const value = sum / (end - start) / 255;
          targetsRef.current[i] = minHeight + value * (maxHeight - minHeight);
        } else if (Math.random() < 0.08) {
          // 无音频流时随机更新目标值（模拟）
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
