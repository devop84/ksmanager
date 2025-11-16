import { useState } from 'react'
import sql from './lib/neon.js'

function App() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const testConnection = async () => {
    setLoading(true)
    setError(null)
    try {
      // Example query - adjust based on your database schema
      const result = await sql`SELECT NOW() as current_time`
      setData(result)
    } catch (err) {
      setError(err.message)
      console.error('Database error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-xl p-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              Kite Manager
            </h1>
            <p className="text-gray-600 mb-8">
              Vite + React + Tailwind CSS + Neon Database
            </p>

            <div className="space-y-4">
              <button
                onClick={testConnection}
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
              >
                {loading ? 'Testing Connection...' : 'Test Neon Database Connection'}
              </button>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  <p className="font-semibold">Error:</p>
                  <p>{error}</p>
                </div>
              )}

              {data && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                  <p className="font-semibold">Connection Successful!</p>
                  <pre className="mt-2 text-sm overflow-auto">
                    {JSON.stringify(data, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="mt-8 pt-8 border-t border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Setup Instructions
              </h2>
              <ol className="list-decimal list-inside space-y-2 text-gray-600">
                <li>Create a <code className="bg-gray-100 px-2 py-1 rounded">.env</code> file in the root directory</li>
                <li>Add your Neon connection string: <code className="bg-gray-100 px-2 py-1 rounded">VITE_NEON_DATABASE_URL=your_connection_string</code></li>
                <li>Restart the dev server after adding the .env file</li>
                <li>Click the button above to test your connection</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App

