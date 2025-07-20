"use client";

import Link from "next/link";

export default function Sidebar() {
  return (
    <div className="fixed left-0 top-0 h-full w-14 hover:w-48 bg-green-100 text-gray-800 transition-all duration-300 overflow-hidden shadow-lg rounded-r-xl z-50">
      <div className="flex flex-col items-start p-4 space-y-4">
        <Link href="/" className="hover:text-green-600">🏠 Dashboard</Link>
        <Link href="/settings" className="hover:text-green-600">⚙️ Settings</Link>
      </div>
    </div>
  );
}
