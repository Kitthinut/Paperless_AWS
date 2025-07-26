"use client";

import { useState, useEffect } from "react";

type ChipData = {
  chip_id: string;
  timestamp: number;
  name?: string;
  [key: string]: any;
};

export default function ChipList({ data }: { data: ChipData[] }) {
  const [chipData, setData] = useState<ChipData[]>(data);
  const [deleting, setDeleting] = useState<string | null>(null); // Track currently deleting item
  const [exporting, setExporting] = useState<string | null>(null); // Track currently exporting item

  useEffect(() => {
    setData(data);
  }, [data]);

  if (!Array.isArray(chipData)) {
    console.error("ChipList received non-array data:", chipData);
    return (
      <div className="text-red-600 p-4">
        Error: Could not display chip data due to invalid format.
      </div>
    );
  }

  const grouped = chipData.reduce((acc, item) => {
    if (!acc[item.chip_id]) acc[item.chip_id] = [];
    acc[item.chip_id].push(item);
    return acc;
  }, {} as Record<string, ChipData[]>);

  const handleDeleteItem = async (chipId: string, timestamp: number) => {
    if (
      !window.confirm(
        `Are you sure you want to delete this log entry for ${chipId} at ${new Date(
          timestamp
        ).toLocaleString()}?`
      )
    ) {
      return;
    }

    const idKey = `${chipId}-${timestamp}`;
    try {
      setDeleting(idKey);

      const deleteUrl = `${process.env.NEXT_PUBLIC_API_URL}/data?chip_id=${encodeURIComponent(chipId)}&timestamp=${timestamp}`;
      const res = await fetch(deleteUrl, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Unknown error" }));
        throw new Error(errorData.message || `Failed to delete log entry. Status: ${res.status}`);
      }

      alert("Log entry deleted successfully.");
      setData((prevData) =>
        prevData.filter(
          (entry) => !(entry.chip_id === chipId && entry.timestamp === timestamp)
        )
      );
    } catch (error: any) {
      console.error("Failed to delete log entry:", error);
      alert(`Error deleting log entry: ${error.message}`);
    } finally {
      setDeleting(null);
    }
  };

  // Function to handle PDF export
  const handleExportToPDF = async (chipId: string, timestamp: number) => {
    const idKey = `${chipId}-${timestamp}`;
    try {
      setExporting(idKey); // Set loading state for this specific button

      // Construct the URL to your new PDF export Lambda endpoint
      const exportUrl = `${process.env.NEXT_PUBLIC_API_URL}/export-pdf?chip_id=${encodeURIComponent(chipId)}&timestamp=${timestamp}`;

      const res = await fetch(exportUrl);

      if (!res.ok) {
        const errorText = await res.text(); // Get raw text to inspect
        console.error("PDF export error response:", errorText);
        let errorMessage = "Failed to generate PDF.";
        try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.message || errorMessage;
        } catch (e) {
            // Not a JSON error, use the raw text
        }
        throw new Error(errorMessage);
      }

      // Get the Blob (binary data) of the PDF
      const pdfBlob = await res.blob();

      // Create a URL for the blob
      const url = window.URL.createObjectURL(pdfBlob);

      // Create a temporary link element
      const a = document.createElement('a');
      a.href = url;

      // Get filename from Content-Disposition header if available, otherwise default
      const contentDisposition = res.headers.get('Content-Disposition');
      let filename = `log_report_${chipId}_${timestamp}.pdf`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }
      a.download = filename; // Set the download filename

      // Programmatically click the link to trigger the download
      document.body.appendChild(a);
      a.click();

      // Clean up by revoking the object URL and removing the link
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      alert("PDF exported successfully!");

    } catch (error: any) {
      console.error("Failed to export PDF:", error);
      alert(`Error exporting PDF: ${error.message}`);
    } finally {
      setExporting(null); // Clear loading state
    }
  };

  return (
    <div className="space-y-10">
      {Object.entries(grouped).length === 0 ? (
        <p className="text-gray-600 text-center p-8 border rounded-lg bg-white">
          No chip data available to display.
        </p>
      ) : (
        Object.entries(grouped).map(([chip_id, entries]) => {
          const rawName = entries[0]?.name?.trim() || "";
          const chipName =
            rawName && !rawName.startsWith("Unknown Chip (")
              ? rawName
              : `Unknown Chip (${chip_id})`;

          const formattedTitle = `${chipName}${
            chipName.endsWith("s") ? "'" : "'s"
          } Table (${chip_id})`;

          console.log(`Rendering chip table for ${chip_id} → name: ${chipName}`);
          console.log(entries);

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

                      const idKey = `${entry.chip_id}-${entry.timestamp}`;
                      const isDeleting = deleting === idKey;

                      return (
                        <tr key={i} className="bg-white hover:bg-green-50">
                          <td className="border p-2">{formattedDate}</td>
                          <td className="border p-2">{formattedTime}</td>
                          <td className="border p-2">
                            <div className="flex space-x-2">
                              <button
                                onClick={() =>
                                  handleDeleteItem(
                                    entry.chip_id,
                                    entry.timestamp
                                  )
                                }
                                disabled={isDeleting}
                                className={`${
                                  isDeleting
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : "bg-red-500 hover:bg-red-600"
                                } text-white px-2 py-1 rounded text-xs`}
                              >
                                {isDeleting ? "Deleting..." : "Delete"}
                              </button>
                              <button
                                onClick={() =>
                                  handleExportToPDF(
                                    entry.chip_id,
                                    entry.timestamp
                                  )
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
