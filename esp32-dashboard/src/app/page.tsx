"use client";

import { useEffect, useState } from "react";
import ChipList from "@/components/chiplist";

export default function Home() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/data`)
      .then((res) => res.json())
      .then(setData)
      .catch((err) => console.error("Fetch error:", err));
  }, []);

  return (
    <main className="p-6 bg-green-50 min-h-screen text-black">
      <h1 className="text-3xl font-bold mb-6">🏥 IoT Device Dashboard</h1>

      <ChipList data={data} />

      <h2 className="text-2xl font-bold mt-8 mb-4">📋 Raw Logs</h2>
      <ul className="list-disc list-inside text-gray-800">
        {data.map((item, i) => {
          const date = new Date(item.timestamp);
          const BECYear = date.getFullYear() + 543;
          const formatted = `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}, ${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1)
            .toString()
            .padStart(2, "0")}/${BECYear}`;

          return (
            <li key={i}>
              <strong>{item.name || item.chip_id}</strong> is pressed at {formatted}
            </li>
          );
        })}
      </ul>
    </main>
  );
}
