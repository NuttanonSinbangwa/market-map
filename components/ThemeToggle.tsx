'use client';

import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  // อ่านค่าที่สคริปต์ใน layout ตั้งไว้แล้ว (กันจอกะพริบ)
  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');
  }, []);

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem('theme', next);
    } catch {
      /* ignore */
    }
    setTheme(next);
  };

  const dark = theme === 'dark';
  return (
    <button
      type="button"
      className="theme-btn"
      onClick={toggle}
      aria-label={dark ? 'สลับเป็นโหมดสว่าง' : 'สลับเป็นโหมดมืด'}
      title={dark ? 'โหมดสว่าง' : 'โหมดมืด'}
    >
      <span aria-hidden="true">{theme === null ? '🌓' : dark ? '☀️' : '🌙'}</span>
    </button>
  );
}
