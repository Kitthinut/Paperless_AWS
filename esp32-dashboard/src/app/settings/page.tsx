"use client";

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation'; // Import useRouter

type ChipData = {
  chip_id: string;
  name?: string; // Optional name from the chip_names table
};

export default function SettingsPage() {
  const [data, setData] = useState<ChipData[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter(); // Initialize router here

  useEffect(() => {
    // Fetch unique chip_ids and their current names for display in settings
    const fetchExistingChips = async () => {
      setError(null); // Clear previous errors
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/data`, { cache: "no-store" });
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status} from /data`);
        }
        const fetchedData: ChipData[] = await res.json();

        // Also fetch custom names from the /names endpoint to pre-populate inputs
        const namesRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/names`, { cache: "no-store" });
        if (!namesRes.ok) {
          throw new Error(`HTTP error! status: ${namesRes.status} from /names`);
        }
        const fetchedNames: { chip_id: string; name: string }[] = await namesRes.json();
        const nameMap = new Map<string, string>();
        if (Array.isArray(fetchedNames)) {
          fetchedNames.forEach(item => nameMap.set(item.chip_id, item.name));
        }

        if (Array.isArray(fetchedData)) {
          // Use a Map to keep only unique chip_ids, and merge names
          const uniqueMap = new Map<string, ChipData>();
          fetchedData.forEach((item) => {
            uniqueMap.set(item.chip_id, {
              chip_id: item.chip_id,
              name: nameMap.get(item.chip_id) || item.name || "" // Prefer custom name, then existing, then empty
            });
          });

          const uniqueData = Array.from(uniqueMap.values());
          setData(uniqueData);

          const initialNames: Record<string, string> = {};
          uniqueData.forEach((item) => {
            initialNames[item.chip_id] = item.name || "";
          });
          setNames(initialNames);
        } else {
            console.error("API returned non-array data for /data:", fetchedData);
            setData([]);
            setNames({});
            setError("Invalid chip data format received from /data.");
        }
      } catch (err: any) {
        console.error("Failed to fetch chip data for settings:", err);
        setError(`Failed to load settings data: ${err.message}`);
        setData([]);
        setNames({});
      }
    };

    fetchExistingChips();
  }, []); // Empty dependency array means it runs once on mount.

  const updateName = async (chipId: string) => {
    const newName = names[chipId];
    if (typeof newName !== 'string') return; // Ensure newName is a string

    try {
      setLoading(chipId);
      const res = await fetch(`${process.env.NEXT_PUBLIC_SET_NAME_URL}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chip_id: chipId, name: newName }),
      });

      const result = await res.json();
      if (res.ok) { // Check if the API call was successful
        alert(`✅ Name updated: ${newName}`);
        router.refresh(); // <--- Call router.refresh() here after a successful update
        // Optional: Also update local state for the current settings page to reflect the new name
        setNames(prevNames => ({ ...prevNames, [chipId]: newName }));
      } else {
        setError(`Error updating ${chipId}: ${result.message}`);
        alert(`❌ Error updating name: ${result.message}`);
      }
    } catch (err: any) {
      console.error("🚨 Failed to update name:", err);
      setError(`Failed to update name: ${err.message}`);
      alert("🚨 Failed to update name");
    } finally {
      setLoading(null);
    }
  };

  return (
    <main className="p-6 bg-green-50 min-h-screen text-black">
      <h1 className="text-3xl font-bold mb-6">Chip Name Configuration</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

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
            {data.length === 0 ? (
              <tr>
                <td colSpan={3} className="border p-3 text-center text-gray-600">
                  No chips found to configure.
                </td>
              </tr>
            ) : (
              data.map(({ chip_id }) => (
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
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}