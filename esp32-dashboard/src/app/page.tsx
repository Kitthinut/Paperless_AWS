"use client";

import { useEffect, useState } from "react";
import ChipList from "./chiplist";

export default function Home() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/data`)
      .then((res) => res.json())
      .then(setData)
      .catch((err) => console.error("Fetch error:", err));
  }, []);

  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold mb-6">🔧 IoT Device Dashboard</h1>

      <ChipList data={data} />

      <h2 className="text-xl font-bold mt-6 mb-2">🪵 Raw Logs</h2>
      <ul className="list-disc list-inside">
        {data.map((item, i) => (
          <li key={i}>
            <strong>{item.chip_id}</strong> —{" "}
            {new Date(item.timestamp).toLocaleString()}
          </li>
        ))}
      </ul>
    </main>
  );
}
