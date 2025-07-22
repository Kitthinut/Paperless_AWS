"use client";

import { useState } from "react";

type ChipData = {
  chip_id: string;
  timestamp: number;
  name?: string; // This will now come from the merged data
};

export default function ChipList({ data }: { data: ChipData[] }) {

  const [names, setNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<string | null>(null);

  // Group logs by chip_id. This now inherently includes the 'name' from page.tsx data.
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


  // Placeholder for delete and export functions (will be implemented in next steps)
  const handleDeleteItem = (chipId: string, timestamp: number) => {
      if (window.confirm(`Are you sure you want to delete this log entry for ${chipId} at ${new Date(timestamp).toLocaleString()}?`)) {
          console.log(`Deleting item: ChipID=${chipId}, Timestamp=${timestamp}`);
          // TO BE IMPLEMENTED: Call backend API to delete this specific log entry
          alert("Delete functionality not yet implemented.");
      }
  };

  const handleExportToPDF = (chipId: string, timestamp: number) => {
      console.log(`Exporting to PDF: ChipID=${chipId}, Timestamp=${timestamp}`);
      // TO BE IMPLEMENTED: Generate PDF or call backend for PDF
      alert("Export to PDF functionality not yet implemented.");
  };


  return (
    <div className="space-y-10">
      {Object.entries(grouped).map(([chip_id, entries]) => {
        // Use the 'name' from the first entry, which should now be populated by page.tsx
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
                    <th className="border p-2">Actions</th> {/* New column for actions */}
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
                        {/* Remove the static text. If you have 'notes' in your data, use that here. */}
                        <td className="border p-2">{/* entry.notes || */ ""}</td> {/* This is now empty or dynamic */}
                        <td className="border p-2">
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => handleDeleteItem(entry.chip_id, entry.timestamp)}
                                    className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs"
                                >
                                    Delete
                                </button>
                                <button
                                    onClick={() => handleExportToPDF(entry.chip_id, entry.timestamp)}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs"
                                >
                                    Export PDF
                                </button>
                            </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* The input for updating names is commented out in your original chiplist.tsx */}
            {/* If you want to enable it here, uncomment and ensure updateName works with re-fetching */}
            {/* <div className="mt-4">
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
            </div> */}
          </div>
        );
      })}
    </div>
  );
}