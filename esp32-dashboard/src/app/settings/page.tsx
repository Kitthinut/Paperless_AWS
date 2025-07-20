"use client";

import { useState, useEffect } from "react";

type ChipData = {
  chip_id: string;
  name?: string;
};

export default function SettingsPage() {
  const [data, setData] = useState<ChipData[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/data`)
      .then((res) => res.json())
      .then((fetchedData: ChipData[]) => {
        // Use a Map to keep only unique chip_ids, last occurrence wins
        const uniqueMap = new Map<string, ChipData>();
        fetchedData.forEach((item) => uniqueMap.set(item.chip_id, item));

        const uniqueData = Array.from(uniqueMap.values());
        setData(uniqueData);

        const initialNames: Record<string, string> = {};
        uniqueData.forEach((item) => {
          initialNames[item.chip_id] = item.name || "";
        });
        setNames(initialNames);
      })
      .catch((err) => {
        console.error("Failed to fetch chip data:", err);
      });
  }, []);

  const updateName = async (chipId: string) => {
    const newName = names[chipId];
    if (!newName) return;

    try {
      setLoading(chipId);
      const res = await fetch(`${process.env.NEXT_PUBLIC_SET_NAME_URL}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chip_id: chipId, name: newName }),
      });

      const result = await res.json();
      alert(res.ok ? `✅ Name updated: ${newName}` : `❌ Error: ${result.message}`);
    } catch (err) {
      console.error(err);
      alert("🚨 Failed to update name");
    } finally {
      setLoading(null);
    }
  };

  return (
    <main className="p-6 bg-green-50 min-h-screen text-black">
      <h1 className="text-3xl font-bold mb-6">⚙️ Settings</h1>

      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300 rounded-lg bg-white text-black text-left">
          <thead className="bg-green-100">
            <tr>
              <th className="border p-3">Chip_ID</th>
              <th className="border p-3">Enter Name</th>
              <th className="border p-3">Commit Log</th>
            </tr>
          </thead>
          <tbody>
            {data.map(({ chip_id }) => (
              <tr key={chip_id} className="hover:bg-green-50">
                <td className="border p-3">{chip_id}</td>
                <td className="border p-3">
                  <input
                    type="text"
                    value={names[chip_id] || ""}
                    onChange={(e) =>
                      setNames({ ...names, [chip_id]: e.target.value })
                    }
                    className="border rounded px-2 py-1 w-full text-black"
                    placeholder="Enter name..."
                  />
                </td>
                <td className="border p-3">
                  <button
                    disabled={loading === chip_id}
                    onClick={() => updateName(chip_id)}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded disabled:opacity-50"
                  >
                    {loading === chip_id ? "Saving..." : "Commit"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
