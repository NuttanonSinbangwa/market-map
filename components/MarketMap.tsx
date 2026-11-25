'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent } from 'react';
import { CATEGORY_MAP, MAP, STALLS, ZONES, type CategoryId } from '@/data/market';
import { isOpenNow } from '@/lib/status';
import { useZoomPan } from '@/hooks/useZoomPan';
import MapCanvas from './MapCanvas';
import Sidebar from './Sidebar';

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, '');

export default function MarketMap() {
  const zoom = useZoomPan({ width: MAP.width, height: MAP.height });
  const stageRef = useRef<HTMLDivElement | null>(null);

  const [query, setQuery] = useState('');
  const [activeCats, setActiveCats] = useState<Set<CategoryId>>(new Set());
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [now, setNow] = useState<Date | null>(null);
  const [tip, setTip] = useState<{ id: string; x: number; y: number } | null>(null);

  // เวลาปัจจุบัน (คำนวณฝั่ง client เท่านั้น กัน hydration mismatch)
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const openMap = useMemo(() => {
    if (!now) return null;
    const m: Record<string, boolean> = {};
    for (const s of STALLS) m[s.id] = isOpenNow(s, now);
    return m;
  }, [now]);

  const results = useMemo(() => {
    const q = norm(query);
    return STALLS.filter((s) => {
      if (activeCats.size > 0 && !activeCats.has(s.category)) return false;
      if (onlyOpen && openMap && !openMap[s.id]) return false;
      if (!q) return true;
      const zoneName = ZONES.find((z) => z.id === s.zone)?.name ?? '';
      const hay = norm([s.id, s.name, CATEGORY_MAP[s.category].label, zoneName, ...s.products].join(' '));
      return hay.includes(q);
    });
  }, [query, activeCats, onlyOpen, openMap]);

  const matchedIds = useMemo(() => new Set(results.map((s) => s.id)), [results]);
  const selected = useMemo(() => STALLS.find((s) => s.id === selectedId) ?? null, [selectedId]);

  const select = useCallback(
    (id: string | null) => {
      setSelectedId(id);
      setTip(null);
      const url = new URL(window.location.href);
      if (id) url.searchParams.set('stall', id);
      else url.searchParams.delete('stall');
      window.history.replaceState(null, '', url);
      const stall = id ? STALLS.find((s) => s.id === id) : null;
      if (stall) zoom.focusRect(stall);
    },
    [zoom],
  );

  // เปิดลิงก์ที่แชร์มา เช่น ?stall=C03
  const bootRef = useRef(false);
  useEffect(() => {
    if (bootRef.current) return;
    bootRef.current = true;
    const id = new URLSearchParams(window.location.search).get('stall');
    if (id && STALLS.some((s) => s.id === id)) {
      // รอให้ SVG วัดขนาดเสร็จก่อนค่อยโฟกัส
      requestAnimationFrame(() => select(id));
    }
  }, [select]);

  // Esc = ปิดรายละเอียด / รีเซ็ตมุมมอง
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedId) select(null);
        zoom.reset();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedId, select, zoom]);

  const toggleCat = (id: CategoryId) =>
    setActiveCats((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const onHover = useCallback((id: string | null, e?: PointerEvent) => {
    if (!id || !e || !stageRef.current) {
      setTip(null);
      return;
    }
    const r = stageRef.current.getBoundingClientRect();
    setTip({ id, x: e.clientX - r.left, y: e.clientY - r.top });
  }, []);

  const tipStall = tip ? STALLS.find((s) => s.id === tip.id) : null;

  return (
    <div className="app">
      <Sidebar
        query={query}
        onQuery={setQuery}
        onSubmitSearch={() => {
          if (results.length === 1) select(results[0].id);
        }}
        activeCats={activeCats}
        onToggleCat={toggleCat}
        onClearCats={() => setActiveCats(new Set())}
        onlyOpen={onlyOpen}
        onToggleOpen={setOnlyOpen}
        hasClock={now !== null}
        results={results}
        selected={selected}
        openMap={openMap}
        onSelect={select}
        onCloseDetail={() => select(null)}
      />

      <main className="stage" ref={stageRef}>
        <MapCanvas
          zoom={zoom}
          matchedIds={matchedIds}
          selectedId={selectedId}
          openMap={openMap}
          onSelect={select}
          onHover={onHover}
        />

        <div className="controls" role="group" aria-label="ควบคุมแผนที่">
          <button onClick={zoom.zoomIn} aria-label="ซูมเข้า">
            +
          </button>
          <button onClick={zoom.zoomOut} aria-label="ซูมออก">
            −
          </button>
          <button onClick={zoom.reset} aria-label="รีเซ็ตมุมมอง" className="reset">
            ⟲
          </button>
        </div>

        <p className="hint">ลากเพื่อเลื่อน · เลื่อนล้อเมาส์/บีบนิ้วเพื่อซูม · กด Esc เพื่อรีเซ็ต</p>

        {tip && tipStall && (
          <div className="tooltip" style={{ left: tip.x + 14, top: tip.y + 14 }} role="tooltip">
            <strong>{tipStall.name}</strong>
            <span>
              {CATEGORY_MAP[tipStall.category].icon} {CATEGORY_MAP[tipStall.category].label} · {tipStall.id}
              {openMap ? (openMap[tipStall.id] ? ' · เปิดอยู่' : ' · ปิดอยู่') : ''}
            </span>
          </div>
        )}
      </main>
    </div>
  );
}
