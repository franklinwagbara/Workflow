import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ReduxProvider from "@/components/layout/ReduxProvider";
import Header from "@/components/layout/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FlowForge — Visual Workflow Builder",
  description:
    "Drag-and-drop visual workflow automation builder with conditional logic, execution simulation, and real-time collaboration.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="h-full flex flex-col bg-gray-950 text-white">
        <ReduxProvider>
          <Header />
          <main className="flex-1 flex flex-col overflow-hidden">
            {children}
          </main>
        </ReduxProvider>
      </body>
    </html>
  );
}
