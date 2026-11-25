'use client';

import type { FormEvent } from 'react';
import { CATEGORIES, CATEGORY_MAP, STALLS, ZONES, type CategoryId, type Stall } from '@/data/market';
import StallDetail from './StallDetail';
import ThemeToggle from './ThemeToggle';

interface Props {
  query: string;
  onQuery: (q: string) => void;
  onSubmitSearch: () => void;
  activeCats: Set<CategoryId>;
  onToggleCat: (id: CategoryId) => void;
  onClearCats: () => void;
  onlyOpen: boolean;
  onToggleOpen: (v: boolean) => void;
  hasClock: boolean;
  results: Stall[];
  selected: Stall | null;
  openMap: Record<string, boolean> | null;
  onSelect: (id: string) => void;
  onCloseDetail: () => void;
}

export default function Sidebar(p: Props) {
  const counts = STALLS.reduce(
    (acc, s) => {
      acc[s.category] = (acc[s.category] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const submit = (e: FormEvent) => {
    e.preventDefault();
    p.onSubmitSearch();
  };

  return (
    <aside className="sidebar">
      <header className="side-top">
        <div className="side-head">
          <h1>
            <span aria-hidden="true">🏮</span> ตลาดอุ๊ยเก๊อะ
          </h1>
          <p>แผนที่แผงค้า {STALLS.length} ร้าน · {ZONES.length} โซน</p>
        </div>
        <ThemeToggle />
      </header>

      <form className="search" onSubmit={submit} role="search">
        <input
          type="search"
          value={p.query}
          onChange={(e) => p.onQuery(e.target.value)}
          placeholder="ค้นหาร้านหรือสินค้า เช่น หมู, ส้มตำ, A03"
          aria-label="ค้นหาร้านหรือสินค้า"
        />
      </form>

      <div className="chips" role="group" aria-label="กรองตามหมวดสินค้า">
        <button className={`chip${p.activeCats.size === 0 ? ' on' : ''}`} onClick={p.onClearCats}>
          ทั้งหมด
        </button>
        {CATEGORIES.map((c) => {
          const on = p.activeCats.has(c.id);
          return (
            <button
              key={c.id}
              className={`chip${on ? ' on' : ''}`}
              style={{ ['--cat' as string]: c.color }}
              aria-pressed={on}
              onClick={() => p.onToggleCat(c.id)}
            >
              <span aria-hidden="true">{c.icon}</span> {c.label}
              <small>{counts[c.id] ?? 0}</small>
            </button>
          );
        })}
      </div>

      {p.hasClock && (
        <label className="toggle">
          <input type="checkbox" checked={p.onlyOpen} onChange={(e) => p.onToggleOpen(e.target.checked)} />
          <span>แสดงเฉพาะร้านที่เปิดอยู่ตอนนี้</span>
        </label>
      )}

      {p.selected && (
        <StallDetail
          stall={p.selected}
          open={p.openMap ? p.openMap[p.selected.id] : null}
          onClose={p.onCloseDetail}
        />
      )}

      <div className="list-head">พบ {p.results.length} ร้าน</div>
      <ul className="list">
        {p.results.map((s) => {
          const cat = CATEGORY_MAP[s.category];
          const open = p.openMap ? p.openMap[s.id] : null;
          return (
            <li key={s.id}>
              <button
                className={`row${p.selected?.id === s.id ? ' on' : ''}`}
                onClick={() => p.onSelect(s.id)}
              >
                <span className="row-icon" style={{ background: cat.color }} aria-hidden="true">
                  {cat.icon}
                </span>
                <span className="row-main">
                  <strong>{s.name}</strong>
                  <small>
                    {s.id} · {s.products.slice(0, 3).join(', ')}
                  </small>
                </span>
                {open !== null && (
                  <span className={`dot ${open ? 'open' : 'closed'}`} title={open ? 'เปิดอยู่' : 'ปิดอยู่'} />
                )}
              </button>
            </li>
          );
        })}
        {p.results.length === 0 && <li className="empty">ไม่พบร้านที่ตรงกับเงื่อนไข ลองเปลี่ยนคำค้นหรือตัวกรองดูนะ</li>}
      </ul>
    </aside>
  );
}
