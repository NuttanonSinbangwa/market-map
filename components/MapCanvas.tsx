'use client';

import type { KeyboardEvent, PointerEvent } from 'react';
import { CATEGORY_MAP, MAP, POIS, STALLS, ZONES } from '@/data/market';
import type { ZoomApi } from '@/hooks/useZoomPan';

interface Props {
  zoom: ZoomApi;
  matchedIds: Set<string>;
  selectedId: string | null;
  openMap: Record<string, boolean> | null;
  onSelect: (id: string) => void;
  onHover: (id: string | null, e?: PointerEvent) => void;
}

const MAX_NAME = 13;
const short = (s: string) => (s.length > MAX_NAME ? s.slice(0, MAX_NAME - 1) + '…' : s);

export default function MapCanvas({ zoom, matchedIds, selectedId, openMap, onSelect, onHover }: Props) {
  const { view, animate, dragging, svgRef, handlers, wasDrag } = zoom;
  const showNames = view.k >= 1.4;

  const activate = (id: string) => {
    if (wasDrag()) return;
    onSelect(id);
  };

  const onKey = (e: KeyboardEvent, id: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(id);
    }
  };

  return (
    <svg
      ref={svgRef}
      className={`map-svg${dragging ? ' is-dragging' : ''}`}
      viewBox={`0 0 ${MAP.width} ${MAP.height}`}
      preserveAspectRatio="xMidYMid meet"
      aria-label="แผนที่ตลาด"
      {...handlers}
    >
      <g
        style={{
          transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})`,
          transformOrigin: '0 0',
          transition: animate ? 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none',
        }}
      >
        {/* พื้นตลาด */}
        <rect x={0} y={0} width={MAP.width} height={MAP.height} fill="var(--floor)" />

        {/* ทางเดินกลาง */}
        <g className="walkways" aria-hidden="true">
          <line x1={0} y1={350} x2={MAP.width} y2={350} />
          <line x1={600} y1={30} x2={600} y2={740} />
        </g>

        {/* โซน */}
        {ZONES.map((z) => (
          <g key={z.id} aria-hidden="true">
            <rect x={z.x} y={z.y} width={z.w} height={z.h} rx={14} className="zone-rect" />
            <text x={z.x + 18} y={z.y + 28} className="zone-label">
              {`โซน ${z.id} · ${z.name.replace('โซน', '')}`}
            </text>
          </g>
        ))}

        {/* จุดบริการ */}
        {POIS.map((p) => (
          <g key={p.id} transform={`translate(${p.x} ${p.y})`} className="poi">
            <circle r={17} />
            <text className="poi-icon" textAnchor="middle" dominantBaseline="central">
              {p.icon}
            </text>
            <text className="poi-label" y={32} textAnchor="middle">
              {p.label}
            </text>
          </g>
        ))}

        {/* แผงค้า */}
        {STALLS.map((s) => {
          const cat = CATEGORY_MAP[s.category];
          const dim = !matchedIds.has(s.id);
          const selected = selectedId === s.id;
          const open = openMap ? openMap[s.id] : null;
          return (
            <g
              key={s.id}
              className={`stall${dim ? ' is-dim' : ''}${selected ? ' is-selected' : ''}`}
              transform={`translate(${s.x} ${s.y})`}
              tabIndex={dim ? -1 : 0}
              role="button"
              aria-label={`แผง ${s.id} ${s.name} หมวด ${cat.label}`}
              aria-pressed={selected}
              onClick={() => activate(s.id)}
              onKeyDown={(e) => onKey(e, s.id)}
              onPointerEnter={(e) => e.pointerType === 'mouse' && onHover(s.id, e)}
              onPointerMove={(e) => e.pointerType === 'mouse' && onHover(s.id, e)}
              onPointerLeave={() => onHover(null)}
              onFocus={() => undefined}
              style={{ ['--cat' as string]: cat.color }}
            >
              {selected && (
                <rect className="stall-ring" x={-5} y={-5} width={s.w + 10} height={s.h + 10} rx={11} />
              )}
              <rect className="stall-body" width={s.w} height={s.h} rx={7} />
              <text className="stall-icon" x={s.w / 2} y={29} textAnchor="middle">
                {cat.icon}
              </text>
              {showNames && (
                <text className="stall-name" x={s.w / 2} y={50} textAnchor="middle">
                  {short(s.name)}
                </text>
              )}
              <text className="stall-id" x={s.w / 2} y={s.h - 8} textAnchor="middle">
                {s.id}
              </text>
              {open !== null && (
                <circle className={`stall-dot ${open ? 'open' : 'closed'}`} cx={s.w - 10} cy={10} r={4.5} />
              )}
            </g>
          );
        })}
      </g>
    </svg>
  );
}
