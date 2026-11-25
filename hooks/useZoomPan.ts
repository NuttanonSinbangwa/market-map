'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';

export interface View {
  k: number;
  x: number;
  y: number;
}

interface Options {
  width: number;
  height: number;
  minK?: number;
  maxK?: number;
}

/**
 * ซูม/แพนแผนที่ SVG: ล้อเมาส์, ลากเมาส์/นิ้ว, pinch สองนิ้ว, ปุ่ม +/-,
 * และ focusRect() สำหรับบินไปหาแผงที่เลือก
 */
export function useZoomPan({ width, height, minK = 0.8, maxK = 6 }: Options) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const viewRef = useRef<View>({ k: 1, x: 0, y: 0 });
  const [view, setViewState] = useState<View>(viewRef.current);
  const [animate, setAnimate] = useState(false);
  const [dragging, setDragging] = useState(false);

  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const moved = useRef(false);
  const startPt = useRef({ x: 0, y: 0 });
  const pinchDist = useRef<number | null>(null);

  const clamp = useCallback(
    (v: View): View => {
      const k = Math.min(maxK, Math.max(minK, v.k));
      const x = Math.min(width * 0.85, Math.max(width * 0.15 - width * k, v.x));
      const y = Math.min(height * 0.85, Math.max(height * 0.15 - height * k, v.y));
      return { k, x, y };
    },
    [width, height, minK, maxK],
  );

  const commit = useCallback(
    (v: View, anim: boolean) => {
      const c = clamp(v);
      viewRef.current = c;
      setAnimate(anim);
      setViewState(c);
    },
    [clamp],
  );

  const metrics = useCallback(() => {
    const svg = svgRef.current;
    if (!svg) return null;
    const r = svg.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return null;
    const s = Math.min(r.width / width, r.height / height);
    return { r, s, ox: (r.width - width * s) / 2, oy: (r.height - height * s) / 2 };
  }, [width, height]);

  /** แปลงพิกัดหน้าจอ -> พิกัด viewBox (ก่อน transform ของ <g>) */
  const toSvg = useCallback(
    (clientX: number, clientY: number) => {
      const m = metrics();
      if (!m) return { x: width / 2, y: height / 2 };
      return { x: (clientX - m.r.left - m.ox) / m.s, y: (clientY - m.r.top - m.oy) / m.s };
    },
    [metrics, width, height],
  );

  const zoomAt = useCallback(
    (factor: number, px: number, py: number, anim: boolean) => {
      const v = viewRef.current;
      const k = Math.min(maxK, Math.max(minK, v.k * factor));
      const ratio = k / v.k;
      commit({ k, x: px - (px - v.x) * ratio, y: py - (py - v.y) * ratio }, anim);
    },
    [commit, maxK, minK],
  );

  // wheel ต้องเป็น non-passive เพื่อ preventDefault ไม่ให้หน้าเลื่อน
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const p = toSvg(e.clientX, e.clientY);
      zoomAt(Math.exp(-e.deltaY * 0.0015), p.x, p.y, false);
    };
    svg.addEventListener('wheel', onWheel, { passive: false });
    return () => svg.removeEventListener('wheel', onWheel);
  }, [toSvg, zoomAt]);

  const onPointerDown = useCallback((e: ReactPointerEvent<SVGSVGElement>) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 1) {
      moved.current = false;
      startPt.current = { x: e.clientX, y: e.clientY };
    } else if (pointers.current.size === 2) {
      const [a, b] = Array.from(pointers.current.values());
      pinchDist.current = Math.hypot(a.x - b.x, a.y - b.y);
      moved.current = true;
    }
  }, []);

  const onPointerMove = useCallback(
    (e: ReactPointerEvent<SVGSVGElement>) => {
      const prev = pointers.current.get(e.pointerId);
      if (!prev) return;
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (pointers.current.size === 2) {
        const [a, b] = Array.from(pointers.current.values());
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinchDist.current && dist > 0) {
          const mid = toSvg((a.x + b.x) / 2, (a.y + b.y) / 2);
          zoomAt(dist / pinchDist.current, mid.x, mid.y, false);
        }
        pinchDist.current = dist;
        return;
      }

      if (pointers.current.size === 1) {
        if (!moved.current) {
          const dist = Math.hypot(e.clientX - startPt.current.x, e.clientY - startPt.current.y);
          if (dist < 5) return;
          moved.current = true;
          setDragging(true);
          try {
            e.currentTarget.setPointerCapture(e.pointerId);
          } catch {
            /* ignore */
          }
        }
        const m = metrics();
        if (!m) return;
        const v = viewRef.current;
        commit(
          { k: v.k, x: v.x + (e.clientX - prev.x) / m.s, y: v.y + (e.clientY - prev.y) / m.s },
          false,
        );
      }
    },
    [commit, metrics, toSvg, zoomAt],
  );

  const endPointer = useCallback((e: ReactPointerEvent<SVGSVGElement>) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchDist.current = null;
    if (pointers.current.size === 0) setDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  }, []);

  const zoomIn = useCallback(() => zoomAt(1.5, width / 2, height / 2, true), [zoomAt, width, height]);
  const zoomOut = useCallback(() => zoomAt(1 / 1.5, width / 2, height / 2, true), [zoomAt, width, height]);
  const reset = useCallback(() => commit({ k: 1, x: 0, y: 0 }, true), [commit]);

  const focusRect = useCallback(
    (r: { x: number; y: number; w: number; h: number }, scale = 2.6) => {
      const cx = r.x + r.w / 2;
      const cy = r.y + r.h / 2;
      commit({ k: scale, x: width / 2 - cx * scale, y: height / 2 - cy * scale }, true);
    },
    [commit, width, height],
  );

  /** true ถ้าการ pointer ล่าสุดเป็นการลาก (ใช้กันไม่ให้ลากแล้วนับเป็นคลิก) */
  const wasDrag = useCallback(() => moved.current, []);

  return {
    svgRef,
    view,
    animate,
    dragging,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endPointer,
      onPointerCancel: endPointer,
    },
    zoomIn,
    zoomOut,
    reset,
    focusRect,
    wasDrag,
  };
}

export type ZoomApi = ReturnType<typeof useZoomPan>;
