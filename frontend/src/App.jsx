import { useState, useEffect } from 'react'
import './index.css'
import Dashboard from './components/Dashboard'
import PointOfSale from './components/PointOfSale'
import Inventory from './components/Inventory'
import SalesAnalytics from './components/SalesAnalytics'
import Login from './components/Login'

function App() {
  const [currentView, setCurrentView] = useState('dashboard')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [username, setUsername] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      setIsAuthenticated(true)
      setUsername(localStorage.getItem('username') || 'Admin')
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    setIsAuthenticated(false)
  }

  if (!isAuthenticated) {
    return <Login onLoginSuccess={() => setIsAuthenticated(true)} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      {/* Navigation */}
      <nav className="bg-black border-b border-amber-400/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-48">
            <div className="flex items-center">
              <div
                onClick={() => setCurrentView('dashboard')}
                className="flex items-center gap-6 cursor-pointer hover:opacity-80 transition-opacity"
              >
                {/* Massive Logo */}
                <img src="/logo.png" alt="ABHA" className="h-40 w-40 object-contain" />
                <div className="flex flex-col justify-center">
                  <h1 className="text-4xl  text-amber-500 tracking-wider font-serif">ABHA CREATIONS</h1>
                  <span className="text-sm text-orange-400 font-medium tracking-wide mt-1 font-sans">Sarees | Kurtis | Blouses | Leggings | Pants</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-4">
              <div className="flex items-center gap-4 text-amber-500/80 text-sm font-bold uppercase tracking-widest">
                <span>👤 {username}</span>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1 bg-red-500/10 border border-red-500/30 text-red-500 rounded hover:bg-red-500 text-[10px] transition-all"
                >
                  Logout
                </button>
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${currentView === 'dashboard'
                    ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/50'
                    : 'text-amber-400 hover:bg-amber-500/20'
                    }`}
                >
                  📊 Dashboard
                </button>
                <button
                  onClick={() => setCurrentView('pos')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${currentView === 'pos'
                    ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/50'
                    : 'text-amber-400 hover:bg-amber-500/20'
                    }`}
                >
                  💳 Point of Sale
                </button>
                <button
                  onClick={() => setCurrentView('inventory')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${currentView === 'inventory'
                    ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/50'
                    : 'text-amber-400 hover:bg-amber-500/20'
                    }`}
                >
                  📦 Inventory
                </button>
                <button
                  onClick={() => setCurrentView('analytics')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${currentView === 'analytics'
                    ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/50'
                    : 'text-amber-400 hover:bg-amber-500/20'
                    }`}
                >
                  📈 Analytics
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'dashboard' && <Dashboard onNavigate={setCurrentView} />}
        {currentView === 'pos' && <PointOfSale />}
        {currentView === 'inventory' && <Inventory />}
        {currentView === 'analytics' && <SalesAnalytics />}
      </main>
    </div>
  )
}

export default App
