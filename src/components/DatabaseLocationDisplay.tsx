'use client';

import { useEffect, useState } from 'react';
import { getDatabaseLocation } from '@/lib/tauri-db';

export function DatabaseLocationDisplay() {
  const [location, setLocation] = useState<string>('');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const loc = await getDatabaseLocation();
        setLocation(loc);
      } catch (err) {
        setLocation('Unable to determine location');
      }
    };
    
    fetchLocation();
  }, []);

  if (!location) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-xs font-medium"
      >
        {isVisible ? '✕ Hide DB Location' : '📁 DB Location'}
      </button>
      
      {isVisible && (
        <div className="mt-2 bg-gray-900 text-white p-3 rounded shadow-lg text-xs max-w-sm">
          <p className="font-bold mb-2">SQLite Database Location:</p>
          <code className="block bg-black p-2 rounded overflow-auto break-all">
            {location}
          </code>
          <p className="mt-2 text-gray-400 text-xs">
            This is where SEMS stores offline data locally.
          </p>
        </div>
      )}
    </div>
  );
}
