import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { authenticateUser, createSession } from '../lib/auth.js'

function Login({ onLogin, onSwitchToSignup, onNavigate }) {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!email || !password) {
        setError('Please fill in all fields')
        setLoading(false)
        return
      }

      // Authenticate user with database
      const user = await authenticateUser(email, password)
      
      // Create session
      const session = await createSession(user.id)
      
      // Store session token in localStorage
      localStorage.setItem('kiteManager_session', session.session_token)
      
      // Call onLogin with user data and session
      onLogin({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        sessionToken: session.session_token
      })
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div>
          <h2 className="text-center text-3xl font-bold text-gray-900">
            Sign in to KSMANAGER
          </h2>
          {onNavigate && (
            <p className="mt-2 text-center text-sm text-gray-600">
              <button
                onClick={() => onNavigate('landing')}
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                {t('login.backToHome')}
              </button>
            </p>
          )}
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
        
        <div className="mt-6 rounded-lg border border-indigo-200 bg-indigo-50 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-indigo-800">Demo Account</h3>
              <div className="mt-2 text-sm text-indigo-700">
                <p className="font-medium">Email:</p>
                <p className="font-mono text-xs bg-white px-2 py-1 rounded mt-1 inline-block">viewonly@ksmanager.com</p>
                <p className="font-medium mt-2">Password:</p>
                <p className="font-mono text-xs bg-white px-2 py-1 rounded mt-1 inline-block">password</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login

