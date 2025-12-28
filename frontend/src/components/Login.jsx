import { useState, useEffect } from 'react'
import { login } from '../api'

export default function Login({ onLoginSuccess }) {
    const [credentials, setCredentials] = useState({ username: '', password: '' })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [bgIndex, setBgIndex] = useState(0)

    const backgrounds = ['/login-bg.jpg', '/login-bg-2.jpg', '/login-bg-3.jpg', '/login-bg-4.jpg']

    useEffect(() => {
        const timer = setInterval(() => {
            setBgIndex(prev => (prev + 1) % backgrounds.length)
        }, 5000)
        return () => clearInterval(timer)
    }, [])

    const handleChange = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value })
        setError('')
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        try {
            const res = await login(credentials)
            localStorage.setItem('token', res.data.token)
            localStorage.setItem('username', credentials.username)
            onLoginSuccess()
        } catch (err) {
            setError('Invalid username or password. Please try again.')
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-black relative overflow-hidden font-sans">
            {/* Luxury Brand Boutique Background Slideshow */}
            {backgrounds.map((bg, idx) => (
                <div
                    key={bg}
                    className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${bgIndex === idx ? 'opacity-80' : 'opacity-0'} animate-slow-zoom`}
                    style={{ backgroundImage: `url('${bg}')` }}
                ></div>
            ))}

            {/* Professional Spotlight Overlay (Radial Gradient) */}
            <div className="absolute inset-0 bg-radial-vignette opacity-60"></div>

            {/* Subtlest Brand Monogram */}
            <div className="absolute inset-0 opacity-[0.05]" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='140' height='140' viewBox='0 0 140 140' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='70' y='80' text-anchor='middle' font-size='22' font-family='Georgia, serif' fill='%23d4af37' opacity='0.3'%3EAC%3C/text%3E%3C/svg%3E")`,
                backgroundRepeat: 'repeat'
            }}></div>

            <div className="absolute inset-0 backdrop-blur-[1px]"></div>

            <div className="relative w-full max-w-md animate-fade-in-up">
                <div className="bg-black/60 backdrop-blur-xl rounded-3xl p-8 border border-amber-500/30 shadow-[0_0_50px_rgba(245,158,11,0.15)] overflow-hidden relative">
                    {/* Animated Glow Decor */}
                    <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-orange-600/20 rounded-full blur-3xl animate-pulse delay-700"></div>

                    <div className="text-center mb-8 relative">
                        <img src="/logo.png" alt="ABHA" className="h-44 w-44 mx-auto drop-shadow-[0_0_20px_rgba(245,158,11,0.4)] mb-6 transition-transform hover:scale-105 duration-700" />
                        <h2 className="text-2xl font-bold text-amber-500 tracking-[0.2em] font-serif leading-relaxed whitespace-nowrap">ABHA CREATIONS</h2>
                        <p className="text-gray-400 text-xs uppercase tracking-[0.4em] font-bold mt-4 opacity-80">Executive Access Only</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6 relative">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-xl text-sm text-center animate-shake">
                                ⚠️ {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-amber-500/70 text-[10px] uppercase tracking-widest font-bold ml-1">Username</label>
                            <input
                                type="text"
                                name="username"
                                required
                                value={credentials.username}
                                onChange={handleChange}
                                placeholder="Enter your username"
                                className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-amber-500/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all font-medium"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-amber-500/70 text-[10px] uppercase tracking-widest font-bold ml-1">Password</label>
                            <input
                                type="password"
                                name="password"
                                required
                                value={credentials.password}
                                onChange={handleChange}
                                placeholder="••••••••"
                                className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-amber-500/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all font-medium"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-4 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-500 text-black font-black uppercase tracking-widest text-sm shadow-lg shadow-amber-500/30 hover:shadow-amber-500/60 transition-all transform hover:scale-[1.02] active:scale-[0.98] ${loading ? 'opacity-70 cursor-wait' : ''}`}
                        >
                            {loading ? (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                                    <span>Authorizing...</span>
                                </div>
                            ) : (
                                "Sign In"
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center relative">
                        <p className="text-gray-500 text-[10px] uppercase tracking-[0.2em]">Secure POS Management Interface</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
