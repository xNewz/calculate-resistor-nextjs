import type { Metadata } from "next";
import { Inter, Kanit, Geist_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const kanit = Kanit({
  variable: "--font-kanit",
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["thai", "latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "เครื่องคำนวณรหัสสีตัวต้านทาน | Resistor Color Code Calculator",
  description: "คำนวณค่าความต้านทานและค่าความคลาดเคลื่อนจากรหัสสีตัวต้านทานแบบ 4 แถบสี และ 5 แถบสี ด้วยระบบที่สวยงามและใช้งานง่าย",
};

import Navbar from "@/components/Navbar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" style={{ colorScheme: "dark" }}>
      <body
        className={`${inter.variable} ${kanit.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <Navbar />
        {children}
      </body>
    </html>
  );
}
