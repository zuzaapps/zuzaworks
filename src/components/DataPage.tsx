'use client';

import { useState, useEffect } from 'react';

interface Column {
  key: string;
  label: string;
  render?: (value: any, row: any) => React.ReactNode;
}

interface DataPageProps {
  title: string;
  icon: string;
  apiUrl: string;
  columns: Column[];
  emptyMessage?: string;
}

export default function DataPage({ title, icon, apiUrl, columns, emptyMessage }: DataPageProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, [apiUrl]);

  async function fetchData() {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(apiUrl, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const json = await res.json();
      if (json.success) {
        setData(json.data || []);
      } else {
        setError(json.error || 'Failed to load data');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="glass-card p-8 flex items-center justify-center">
        <i className="fas fa-spinner fa-spin text-3xl text-pastel-blue-400 mr-3" />
        <span className="text-gray-600">Loading {title}...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-8">
        <div className="text-center">
          <i className="fas fa-exclamation-triangle text-4xl text-yellow-400 mb-3" />
          <h3 className="text-lg font-bold text-gray-800 mb-2">Unable to load data</h3>
          <p className="text-gray-600 text-sm mb-4">{error}</p>
          <button onClick={fetchData} className="px-4 py-2 bg-pastel-blue-400 text-white rounded-lg hover:bg-pastel-blue-500 transition">
            <i className="fas fa-redo mr-2" /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <i className={`fas ${icon} text-pastel-blue-400`} />
          {title}
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">{data.length} records</span>
          <button onClick={fetchData} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <i className="fas fa-sync-alt text-gray-500" />
          </button>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="text-center py-12">
          <i className={`fas ${icon} text-5xl text-gray-300 mb-4`} />
          <p className="text-gray-500">{emptyMessage || 'No data available'}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-200">
                {columns.map((col) => (
                  <th key={col.key} className="text-left py-3 px-4 font-semibold text-gray-600 whitespace-nowrap">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={row.id || i} className="border-b border-gray-100 hover:bg-pastel-blue-50/50 transition">
                  {columns.map((col) => (
                    <td key={col.key} className="py-3 px-4 text-gray-700">
                      {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '-')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
