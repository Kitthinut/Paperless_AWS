'use client';

import { useState } from 'react';

type ChipData = {
  chip_id: string;
  timestamp: number;
  name?: string;
};

export default function ChipList({ data }: { data: ChipData[] }) {
  const [names, setNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const updateName = async (chipId: string) => {
  const newName = names[chipId];
  if (!newName) return;

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SET_NAME_URL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ chip_id: chipId, name: newName }),
    });

    const data = await res.json();
    if (res.ok) {
      alert(`✅ Name updated: ${newName}`);
    } else {
      alert(`❌ Error: ${data.message}`);
    }
  } catch (err) {
    console.error(err);
    alert('🚨 Failed to update name');
  }
};


  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold">📟 Devices</h2>

      {data.map(({ chip_id, timestamp }, i) => (
        <div key={i} className="mb-4 p-4 border rounded shadow">
          <p>🔢 <strong>ID:</strong> {chip_id}</p>
          <p>🕒 <strong>Last Press:</strong> {new Date(timestamp).toLocaleString()}</p>

          <input
            type="text"
            placeholder="Enter custom name..."
            className="border px-2 py-1 mt-2 w-full"
            value={names[chip_id] || ''}
            onChange={(e) => setNames({ ...names, [chip_id]: e.target.value })}
          />

          <button
            onClick={() => updateName(chip_id)}
            disabled={loading === chip_id}
            className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded disabled:opacity-50"
          >
            {loading === chip_id ? 'Saving...' : 'Save Name'}
          </button>

          {success && loading === null && (
            <p className="text-green-600 mt-2">{success}</p>
          )}
        </div>
      ))}
    </div>
  );
}
