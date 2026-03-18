import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "pi-mono-dty - 天气查询 Agent",
  description: "基于 pi-mono 的极简 Agent 应用，自动调用天气 API 返回结果",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="antialiased">{children}</body>
    </html>
  );
}
