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
          <div className="flex flex-col md:flex-row items-center justify-between py-4 md:h-32 gap-4">
            {/* Logo Section */}
            <div className="flex items-center w-full md:w-auto justify-center md:justify-start">
              <div
                onClick={() => setCurrentView('dashboard')}
                className="flex items-center gap-3 md:gap-6 cursor-pointer hover:opacity-80 transition-opacity"
              >
                {/* Logo */}
                <img src="/logo.png" alt="ABHA" className="h-20 w-20 md:h-28 md:w-28 object-contain" />
                <div className="flex flex-col justify-center text-center md:text-left">
                  <h1 className="text-2xl md:text-4xl text-amber-500 tracking-wider font-serif">ABHA CREATIONS</h1>
                  <span className="text-[10px] md:text-sm text-orange-400 font-medium tracking-wide mt-1 font-sans">Sarees | Kurtis | Blouses | Leggings</span>
                </div>
              </div>
            </div>

            {/* Navigation and Profile */}
            <div className="flex flex-col items-center md:items-end gap-3 w-full md:w-auto">
              {/* Profile Block */}
              <div className="flex items-center gap-4 text-amber-500/80 text-sm font-bold uppercase tracking-widest justify-center md:justify-end w-full">
                <span>👤 {username}</span>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1 bg-red-500/10 border border-red-500/30 text-red-500 rounded hover:bg-red-500 text-[10px] transition-all"
                >
                  Logout
                </button>
              </div>

              {/* Desktop Nav Buttons (Hidden on Mobile) */}
              <div className="hidden md:flex space-x-4">
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
                  💳 POS
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

      {/* MOBILE BOTTOM NAVIGATION BAR (Fixed) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-black border-t border-amber-500/30 pb-safe z-50 flex justify-around items-center h-16 shadow-[0_-4px_20px_rgba(255,165,0,0.1)]">
        <button onClick={() => setCurrentView('dashboard')} className={`flex flex-col items-center gap-1 p-2 ${currentView === 'dashboard' ? 'text-amber-500' : 'text-gray-500'}`}>
          <span className="text-xl">📊</span>
          <span className="text-[10px] font-bold">Home</span>
        </button>
        <button onClick={() => setCurrentView('pos')} className={`flex flex-col items-center gap-1 p-2 ${currentView === 'pos' ? 'text-amber-500' : 'text-gray-500'}`}>
          <span className="text-xl">💳</span>
          <span className="text-[10px] font-bold">Billing</span>
        </button>
        <button onClick={() => setCurrentView('inventory')} className={`flex flex-col items-center gap-1 p-2 ${currentView === 'inventory' ? 'text-amber-500' : 'text-gray-500'}`}>
          <span className="text-xl">📦</span>
          <span className="text-[10px] font-bold">Stock</span>
        </button>
        <button onClick={() => setCurrentView('analytics')} className={`flex flex-col items-center gap-1 p-2 ${currentView === 'analytics' ? 'text-amber-500' : 'text-gray-500'}`}>
          <span className="text-xl">📈</span>
          <span className="text-[10px] font-bold">Report</span>
        </button>
      </div>

      {/* Padding for Mobile Bottom Nav */}
      <div className="h-20 md:hidden"></div>
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
