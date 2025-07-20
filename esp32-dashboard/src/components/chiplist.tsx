"use client";

import { useState } from "react";

type ChipData = {
  chip_id: string;
  timestamp: number;
  name?: string;
};

export default function ChipList({ data }: { data: ChipData[] }) {
  const [names, setNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<string | null>(null);

  // Group logs by chip_id
  const grouped = data.reduce((acc, item) => {
    if (!acc[item.chip_id]) acc[item.chip_id] = [];
    acc[item.chip_id].push(item);
    return acc;
  }, {} as Record<string, ChipData[]>);

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
    <div className="space-y-10">
      {Object.entries(grouped).map(([chip_id, entries]) => {
        const chipName = entries[0]?.name || chip_id;

        return (
          <div
            key={chip_id}
            className="p-6 bg-white border border-gray-200 rounded-2xl shadow text-black"
          >
            <h2 className="text-xl font-semibold mb-4">{chipName}'s Table</h2>

            <div className="overflow-x-auto">
              <table className="min-w-full border border-collapse border-gray-300 text-sm text-left">
                <thead className="bg-green-100 text-black">
                  <tr>
                    <th className="border p-2">Date Log</th>
                    <th className="border p-2">Time Log</th>
                    <th className="border p-2">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry, i) => {
                    const date = new Date(entry.timestamp);
                    const BECYear = date.getFullYear() + 543;
                    const formattedDate = `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${BECYear}`;
                    const formattedTime = `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;

                    return (
                      <tr key={i} className="bg-white hover:bg-green-50">
                        <td className="border p-2">{formattedDate}</td>
                        <td className="border p-2">{formattedTime}</td>
                        <td className="border p-2 italic text-gray-600">*add by phone*</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-4">
              <input
                type="text"
                placeholder="Enter custom name..."
                className="border px-3 py-1 rounded w-full text-black"
                value={names[chip_id] || ""}
                onChange={(e) =>
                  setNames({ ...names, [chip_id]: e.target.value })
                }
              />
              <button
                onClick={() => updateName(chip_id)}
                disabled={loading === chip_id}
                className="mt-2 bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded disabled:opacity-50"
              >
                {loading === chip_id ? "Saving..." : "Save Name"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
