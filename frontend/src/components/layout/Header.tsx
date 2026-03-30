"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Workflow, Home, Settings, Activity, ChevronRight } from "lucide-react";

export default function Header() {
  const pathname = usePathname();
  const isEditor = pathname?.startsWith("/workflows/");

  return (
    <header className="h-12 bg-gray-900 border-b border-gray-700 flex items-center px-4 shrink-0">
      <Link
        href="/"
        className="flex items-center gap-2 text-white font-bold text-lg hover:text-indigo-400 transition-colors"
      >
        <Workflow className="w-6 h-6 text-indigo-500" />
        <span className="hidden sm:inline">FlowForge</span>
      </Link>

      <nav className="flex items-center gap-1 ml-6 text-sm">
        <Link
          href="/"
          className={`px-3 py-1.5 rounded-md transition-colors ${
            pathname === "/"
              ? "bg-gray-800 text-white"
              : "text-gray-400 hover:text-white hover:bg-gray-800"
          }`}
        >
          <Home className="w-4 h-4 inline mr-1.5" />
          Dashboard
        </Link>
      </nav>

      {isEditor && (
        <div className="flex items-center gap-1 ml-4 text-sm text-gray-500">
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-300">Workflow Editor</span>
        </div>
      )}

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        <a
          href="http://localhost:5000/swagger"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gray-500 hover:text-gray-300 px-2 py-1 rounded transition-colors"
        >
          API Docs
        </a>
        <div
          className="w-2 h-2 rounded-full bg-green-500"
          title="API Connected"
        />
      </div>
    </header>
  );
}
