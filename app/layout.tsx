import type { Metadata, Viewport } from 'next';
import { Noto_Sans_Thai } from 'next/font/google';
import './globals.css';

const font = Noto_Sans_Thai({
  subsets: ['thai', 'latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
  variable: '--font-th',
});

export const metadata: Metadata = {
  title: 'แผนที่ตลาดอุ๊ยเก๊อะ',
  description: 'แผนที่แผงค้าแบบอินเทอร์แอคทีฟ ค้นหาร้าน กรองหมวดสินค้า และดูเวลาเปิด-ปิด',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf6ee" },
    { media: "(prefers-color-scheme: dark)", color: "#17130f" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={font.variable} suppressHydrationWarning>
      <head>
        {/* ตั้งธีมก่อนวาดหน้า: ใช้ค่าที่เคยเลือก ถ้าไม่มีใช้ตามระบบ */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('theme');if(t!=='light'&&t!=='dark'){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.dataset.theme=t}catch(e){}`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
