import { useState, useEffect } from 'react'
import './App.css'

interface HealthCheckResponse {
  status: string;
  timestamp: string;
  service: string;
  version: string;
  environment: string;
}

function App() {
  const [backendHealth, setBackendHealth] = useState<HealthCheckResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkBackendHealth = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const response = await fetch(`${apiUrl}/health`);

        if (!response.ok) {
          throw new Error(`Backend returned ${response.status}`);
        }

        const data = await response.json();
        setBackendHealth(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to connect to backend');
        setBackendHealth(null);
      } finally {
        setLoading(false);
      }
    };

    checkBackendHealth();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-12">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-indigo-900 mb-4">
            🏥 Healthcare AI Clinical Data Analyzer
          </h1>
          <p className="text-xl text-gray-700">
            AI-Powered Clinical Decision Support System
          </p>
        </header>

        <main className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              System Status
            </h2>

            {loading && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                <span className="ml-4 text-gray-600">Checking backend connection...</span>
              </div>
            )}

            {error && !loading && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">❌</span>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-red-800 font-semibold">Backend Connection Failed</h3>
                    <p className="text-red-700 mt-1">{error}</p>
                    <p className="text-red-600 text-sm mt-2">
                      Make sure the backend server is running on port 3000
                    </p>
                  </div>
                </div>
              </div>
            )}

            {backendHealth && !loading && !error && (
              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">✅</span>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-green-800 font-semibold">Backend Connected</h3>
                    <p className="text-green-700">All systems operational</p>
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between border-b border-green-200 pb-2">
                    <span className="text-gray-600 font-medium">Service:</span>
                    <span className="text-gray-800">{backendHealth.service}</span>
                  </div>
                  <div className="flex justify-between border-b border-green-200 pb-2">
                    <span className="text-gray-600 font-medium">Version:</span>
                    <span className="text-gray-800">{backendHealth.version}</span>
                  </div>
                  <div className="flex justify-between border-b border-green-200 pb-2">
                    <span className="text-gray-600 font-medium">Environment:</span>
                    <span className="text-gray-800">{backendHealth.environment}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">Status:</span>
                    <span className="text-green-600 font-semibold uppercase">{backendHealth.status}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Features (Coming Soon)
            </h2>
            <ul className="space-y-3 text-left">
              <li className="flex items-start">
                <span className="text-indigo-600 mr-3">📊</span>
                <span className="text-gray-700">Patient clinical data analysis</span>
              </li>
              <li className="flex items-start">
                <span className="text-indigo-600 mr-3">🤖</span>
                <span className="text-gray-700">AI-powered risk assessment</span>
              </li>
              <li className="flex items-start">
                <span className="text-indigo-600 mr-3">💊</span>
                <span className="text-gray-700">Treatment recommendations</span>
              </li>
              <li className="flex items-start">
                <span className="text-indigo-600 mr-3">📈</span>
                <span className="text-gray-700">Trend analysis and predictions</span>
              </li>
            </ul>
          </div>
        </main>

        <footer className="text-center mt-12 text-gray-600">
          <p className="text-sm">
            Built with React + Vite + TypeScript + Tailwind CSS
          </p>
        </footer>
      </div>
    </div>
  )
}

export default App
