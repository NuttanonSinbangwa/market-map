import { CATEGORY_MAP, type Stall } from '@/data/market';

export const DAY_NAMES = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];

export function getHours(stall: Stall): [string, string] {
  return stall.hours ?? CATEGORY_MAP[stall.category].hours;
}

const toMinutes = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

export function isOpenNow(stall: Stall, now: Date): boolean {
  if (stall.closedDays?.includes(now.getDay())) return false;
  const [open, close] = getHours(stall);
  const cur = now.getHours() * 60 + now.getMinutes();
  return cur >= toMinutes(open) && cur < toMinutes(close);
}

export function closedDaysLabel(stall: Stall): string | null {
  if (!stall.closedDays || stall.closedDays.length === 0) return null;
  return 'หยุดวัน' + stall.closedDays.map((d) => DAY_NAMES[d]).join(', ');
}
