'use client';

import { useState } from 'react';
import { CATEGORY_MAP, ZONES, type Stall } from '@/data/market';
import { closedDaysLabel, getHours } from '@/lib/status';

interface Props {
  stall: Stall;
  open: boolean | null;
  onClose: () => void;
}

export default function StallDetail({ stall, open, onClose }: Props) {
  const [copied, setCopied] = useState(false);
  const cat = CATEGORY_MAP[stall.category];
  const zone = ZONES.find((z) => z.id === stall.zone);
  const [o, c] = getHours(stall);
  const closedDays = closedDaysLabel(stall);

  const share = async () => {
    const url = `${window.location.origin}${window.location.pathname}?stall=${stall.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt('คัดลอกลิงก์นี้', url);
    }
  };

  return (
    <section className="detail" aria-live="polite">
      <div className="detail-head">
        <span className="detail-icon" style={{ background: cat.color }}>
          {cat.icon}
        </span>
        <div className="detail-title">
          <h2>{stall.name}</h2>
          <p>
            แผง {stall.id} · {zone?.name}
          </p>
        </div>
        <button className="icon-btn" onClick={onClose} aria-label="ปิดรายละเอียด">
          ✕
        </button>
      </div>

      <div className="badges">
        <span className="badge" style={{ borderColor: cat.color, color: cat.color }}>
          {cat.label}
        </span>
        {open !== null && (
          <span className={`badge status ${open ? 'open' : 'closed'}`}>{open ? 'เปิดอยู่ตอนนี้' : 'ปิดอยู่'}</span>
        )}
      </div>

      <dl className="facts">
        <dt>เวลาเปิด</dt>
        <dd>
          {o}–{c} น.{closedDays ? ` (${closedDays})` : ''}
        </dd>
        <dt>สินค้าแนะนำ</dt>
        <dd>
          <ul className="tags">
            {stall.products.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </dd>
        {stall.note && (
          <>
            <dt>หมายเหตุ</dt>
            <dd>{stall.note}</dd>
          </>
        )}
      </dl>

      <button className="btn" onClick={share}>
        {copied ? 'คัดลอกลิงก์แล้ว ✓' : 'แชร์ลิงก์แผงนี้'}
      </button>
    </section>
  );
}
