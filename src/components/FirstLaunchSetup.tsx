'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, Loader } from 'lucide-react';

export function FirstLaunchSetup({ onComplete }: { onComplete: () => void }) {
  const [apiUrl, setApiUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [hasConfigured, setHasConfigured] = useState(false);

  useEffect(() => {
    // Check if already configured
    const savedUrl = localStorage.getItem('sems_api_url');
    if (savedUrl) {
      setHasConfigured(true);
      onComplete();
    } else {
      // Set default URL
      const defaultUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      setApiUrl(defaultUrl);
    }
  }, [onComplete]);

  const testConnection = async () => {
    if (!apiUrl.trim()) {
      setError('API URL is required');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      // Test the connection
      const testUrl = apiUrl.endsWith('/') ? apiUrl : apiUrl + '/';
      const response = await fetch(`${testUrl}api/health/database`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        // Save to localStorage
        localStorage.setItem('sems_api_url', apiUrl);
        setSuccess(true);
        
        // Complete setup after short delay
        setTimeout(() => {
          onComplete();
        }, 1500);
      } else {
        setError(`Server responded with status ${response.status}. Please verify the URL is correct.`);
      }
    } catch (err) {
      setError(
        `Cannot connect to server. Please check:\n1. The API URL is correct\n2. The server is running and accessible\n3. Your internet connection`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    // Save current URL even if not tested
    if (apiUrl.trim()) {
      localStorage.setItem('sems_api_url', apiUrl);
    }
    onComplete();
  };

  if (hasConfigured) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to SEMS</h1>
          <p className="text-gray-600">Smart Dispensing System</p>
        </div>

        <div className="space-y-6">
          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              First, let's configure your API server. This is where your pharmacy data is stored and synced.
            </p>
          </div>

          {/* API URL Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Server URL
            </label>
            <input
              type="url"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="https://yourserver.com"
              disabled={loading || success}
              className="w-full px-4 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 bg-white "
            />
            <p className="mt-2 text-xs text-gray-500">
              Example: https://api.mypharmacy.com or http://192.168.1.100:3000
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 whitespace-pre-wrap">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="flex gap-3 bg-green-50 border border-green-200 rounded-lg p-4">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-700">Connection successful! Launching app...</p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={testConnection}
              disabled={loading || success || !apiUrl.trim()}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-medium py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Testing...
                </>
              ) : (
                'Test & Continue'
              )}
            </button>

            <button
              onClick={handleSkip}
              disabled={loading || success}
              className="flex-1 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-800 font-medium py-2 px-4 rounded-lg transition"
            >
              Skip for Now
            </button>
          </div>

          {/* Help Text */}
          <p className="text-xs text-gray-500 text-center">
            You can change this later in Settings → Sync Configuration
          </p>
        </div>
      </div>
    </div>
  );
}

