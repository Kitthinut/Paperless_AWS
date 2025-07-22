"use client";

import { useEffect, useState } from "react";
import ChipList from "../components/chiplist"; // Assuming ChipList.tsx is in the components folder

type ChipLogData = { // Define a type for log entries
  chip_id: string;
  timestamp: number;
  name?: string; // Optional name from the chip_names table
};

export default function Home() {
  const [data, setData] = useState<ChipLogData[]>([]); // Use the new type

  // Function to fetch both log data and chip names, then merge them
  const fetchDataAndNames = async () => {
    try {
      // 1. Fetch chip log data (from /data endpoint)
      const logRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/data`);
      if (!logRes.ok) {
        throw new Error(`HTTP error! Status: ${logRes.status} on logs fetch.`);
      }
      const logData: ChipLogData[] = await logRes.json();

      // 2. Fetch chip names (from the new /names endpoint)
      const namesRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/names`);
      if (!namesRes.ok) {
        throw new Error(`HTTP error! Status: ${namesRes.status} on names fetch.`);
      }
      const fetchedNames: { chip_id: string; name: string }[] = await namesRes.json();

      // 3. Create a map for quick name lookup
      const nameMap = new Map<string, string>();
      if (Array.isArray(fetchedNames)) {
          fetchedNames.forEach(item => {
              nameMap.set(item.chip_id, item.name);
          });
      }

      // 4. Merge names into log data
      if (Array.isArray(logData)) {
          const mergedData = logData.map(logEntry => ({
              ...logEntry,
              // Prioritize the name from the nameMap, fallback to an empty string if no name found
              name: nameMap.get(logEntry.chip_id) || logEntry.chip_id // Use chip_id as fallback display name
          }));
          setData(mergedData);
      } else {
          console.error("Log data fetched is not an array:", logData);
          setData([]);
      }

    } catch (err) {
      console.error("Error fetching data and names:", err);
      setData([]); // Reset data on error
    }
  };

  // Fetch data and names when the component mounts
  useEffect(() => {
    fetchDataAndNames();
  }, []);

  return (
    <main className="p-6 bg-green-50 min-h-screen text-black">
      <h1 className="text-3xl font-bold mb-6">🏥 IoT Device Dashboard</h1>

      {/* Pass the merged data to ChipList */}
      <ChipList data={data} />

      {/* The raw logs section is commented out as requested */}
      {/* <h2 className="text-2xl font-bold mt-8 mb-4">📋 Raw Logs</h2>
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
      </ul> */}
    </main>
  );
}