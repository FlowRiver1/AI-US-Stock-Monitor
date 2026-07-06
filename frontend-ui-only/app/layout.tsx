import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI US Stock Monitor UI Only",
  description: "Pure frontend UI shell for AI US Stock Monitor"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
