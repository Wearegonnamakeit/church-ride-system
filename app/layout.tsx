import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

// 🌟 이 부분을 아래 코드로 통째로 바꿔주세요!
export const metadata: Metadata = {
  title: '리빙스톤 교회 라이드',
  description: '리빙스톤 교회 차량 배정 및 라이드 자동 신청 시스템입니다.',
  manifest: '/manifest.json',
  themeColor: '#ffffff',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '교회라이드',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}