// app/page.tsx
"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const ChipList = dynamic(() => import("../components/chiplist"), { ssr: false });

// Define the type for the log data coming from your /data endpoint
type ChipLogData = {
  chip_id: string;
  timestamp: number;
  // Add other fields that come with your sensor log data (e.g., value, humidity, temperature, etc.)
  [key: string]: any; // Allows for additional, unknown properties
};

// Define the type for the name data coming from your /names endpoint
type ChipNameData = {
  chip_id: string;
  name: string;
};

// Define the merged type that ChipList expects (ChipLogData with optional name)
type MergedChipData = ChipLogData & { name?: string };

export default function DashboardPage() {
  const [data, setData] = useState<MergedChipData[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch both log data and chip names, then merge them
  const fetchDataAndNames = async () => {
    setError(null); // Clear previous errors
    try {
      // Fetch sensor log data from your existing /data endpoint
      const logsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/data`, {
        cache: "no-store", // Crucial for fresh data
      });
      if (!logsRes.ok) {
        throw new Error(`HTTP error! status: ${logsRes.status} from /data`);
      }
      const logs: ChipLogData[] = await logsRes.json();
      console.log("Fetched Logs:", logs);

      // Fetch chip names from your /names endpoint
      const namesRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/names`, {
        cache: "no-store", // Crucial for fresh names
      });
      if (!namesRes.ok) {
        throw new Error(`HTTP error! status: ${namesRes.status} from /names`);
      }
      const chipNames: ChipNameData[] = await namesRes.json();
      console.log("Fetched Chip Names:", chipNames);

      // Create a map for quick lookup of names by chip_id
      const nameMap = new Map<string, string>();
      if (Array.isArray(chipNames)) {
        chipNames.forEach((chip) => {
          nameMap.set(chip.chip_id.toLowerCase(), chip.name);
        });
      }

      // Merge data: Add the 'name' to each log entry
      if (Array.isArray(logs)) {
        const mergedData = logs.map((log) => ({
          ...log,
          name: nameMap.get(log.chip_id.toLowerCase()) || `Unknown Chip (${log.chip_id})`,
        }));
        setData(mergedData);
        console.log("Merged Data for ChipList:", mergedData);
      } else {
        console.error("Log data fetched is not an array:", logs);
        setData([]);
        setError("Invalid log data format received from /data.");
      }
    } catch (err: any) {
      console.error("🚨 Failed to fetch dashboard data:", err);
      setError(`Failed to load data: ${err.message}`);
      setData([]); // Reset data on error
    }
  };

  // Fetch data and names when the component mounts or when router.refresh() triggers re-render
  // This useEffect will re-run when the component re-mounts or when its dependencies change,
  // which router.refresh() does for client components by triggering a re-render cycle.
  useEffect(() => {
    fetchDataAndNames();
  }, []); // Empty dependency array means it runs once on mount. `router.refresh()` will cause re-mount/re-render.

  return (
    <main className="p-6 bg-green-50 min-h-screen text-black">
      <h1 className="text-3xl font-bold mb-6">🏥 IoT Device Dashboard</h1>

      {error && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
          role="alert"
        >
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      {data.length === 0 && !error ? (
        <div className="text-gray-600 text-center p-8 border rounded-lg bg-white">
          Loading chip data...
        </div>
      ) : (
        <ChipList data={data} />
      )}
    </main>
  );
}
