"use client";

import { useState } from "react";

type ChipData = {
  chip_id: string;
  timestamp: number;
  name?: string;
  [key: string]: any;
};

export default function ChipList({ data }: { data: ChipData[] }) {
  if (!Array.isArray(data)) {
    console.error("ChipList received non-array data:", data);
    return (
      <div className="text-red-600 p-4">
        Error: Could not display chip data due to invalid format.
      </div>
    );
  }

  // Group logs by chip_id
  const grouped = data.reduce((acc, item) => {
    if (!acc[item.chip_id]) acc[item.chip_id] = [];
    acc[item.chip_id].push(item);
    return acc;
  }, {} as Record<string, ChipData[]>);

  // Delete handler placeholder
  const handleDeleteItem = (chipId: string, timestamp: number) => {
    if (
      window.confirm(
        `Are you sure you want to delete this log entry for ${chipId} at ${new Date(
          timestamp
        ).toLocaleString()}?`
      )
    ) {
      console.log(`Deleting item: ChipID=${chipId}, Timestamp=${timestamp}`);
      alert("Delete functionality not yet implemented.");
    }
  };

  // Export PDF handler placeholder
  const handleExportToPDF = (chipId: string, timestamp: number) => {
    console.log(`Exporting to PDF: ChipID=${chipId}, Timestamp=${timestamp}`);
    alert("Export to PDF functionality not yet implemented.");
  };

  return (
    <div className="space-y-10">
      {Object.entries(grouped).length === 0 ? (
        <p className="text-gray-600 text-center p-8 border rounded-lg bg-white">
          No chip data available to display.
        </p>
      ) : (
        Object.entries(grouped).map(([chip_id, entries]) => {
          // Use the 'name' from the first entry, fallback to chip_id
          const chipName =
            entries[0]?.name && !entries[0].name.startsWith("Unknown Chip (")
              ? entries[0].name
              : chip_id;

          // Format possessive form of chip name correctly
          const formattedTitle =
            chipName + (chipName.endsWith("s") ? "'" : "'s") + " Table";

          return (
            <div
              key={chip_id}
              className="p-6 bg-white border border-gray-200 rounded-2xl shadow text-black"
            >
              <h2 className="text-xl font-semibold mb-4">{formattedTitle}</h2>

              <div className="overflow-x-auto">
                <table className="min-w-full border border-collapse border-gray-300 text-sm text-left">
                  <thead className="bg-green-100 text-black">
                    <tr>
                      <th className="border p-2">Date Log</th>
                      <th className="border p-2">Time Log</th>
                      <th className="border p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry, i) => {
                      const date = new Date(entry.timestamp);
                      const BECYear = date.getFullYear() + 543;
                      const formattedDate = `${date
                        .getDate()
                        .toString()
                        .padStart(2, "0")}/${(date.getMonth() + 1)
                        .toString()
                        .padStart(2, "0")}/${BECYear}`;
                      const formattedTime = `${date
                        .getHours()
                        .toString()
                        .padStart(2, "0")}:${date
                        .getMinutes()
                        .toString()
                        .padStart(2, "0")}`;

                      return (
                        <tr key={i} className="bg-white hover:bg-green-50">
                          <td className="border p-2">{formattedDate}</td>
                          <td className="border p-2">{formattedTime}</td>
                          <td className="border p-2">
                            <div className="flex space-x-2">
                              <button
                                onClick={() =>
                                  handleDeleteItem(entry.chip_id, entry.timestamp)
                                }
                                className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs"
                              >
                                Delete
                              </button>
                              <button
                                onClick={() =>
                                  handleExportToPDF(entry.chip_id, entry.timestamp)
                                }
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
            </div>
          );
        })
      )}
    </div>
  );
}
