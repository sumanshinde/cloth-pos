import { useState, useEffect } from 'react'
import { fetchVariants, fetchProducts } from '../api'

export default function Dashboard({ onNavigate }) {
    const [stats, setStats] = useState({
        totalSKUs: 0,
        totalStock: 0,
        lowStock: 0,
        outOfStock: 0,
        topProducts: [],
        recentActivity: []
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadDashboardData()
    }, [])

    const loadDashboardData = async () => {
        try {
            const [variantsRes, productsRes] = await Promise.all([
                fetchVariants(),
                fetchProducts()
            ])

            const variants = variantsRes.data.results || variantsRes.data
            const products = productsRes.data.results || productsRes.data

            // Calculate statistics
            const totalSKUs = products.length
            const totalStock = variants.reduce((sum, v) => sum + (v.stock_quantity || 0), 0)
            const lowStock = variants.filter(v => v.stock_quantity > 0 && v.stock_quantity < 5).length
            const outOfStock = variants.filter(v => v.stock_quantity === 0).length

            // Get top products (most stock)
            const topProducts = [...variants]
                .sort((a, b) => b.stock_quantity - a.stock_quantity)
                .slice(0, 5)

            setStats({
                totalSKUs,
                totalStock,
                lowStock,
                outOfStock,
                topProducts,
                recentActivity: []
            })
            setLoading(false)
        } catch (error) {
            console.error('Error loading dashboard:', error)
            setLoading(false)
        }
    }

    const StatCard = ({ icon, title, value, trend, trendValue, color }) => (
        <div className="bg-black/50 backdrop-blur-md rounded-xl p-3 md:p-6 border border-amber-400/30 shadow-xl hover:shadow-2xl hover:border-amber-400/50 transition-all">
            <div className="flex flex-col md:flex-row items-start justify-between">
                <div className="flex-1 w-full">
                    <div className="flex items-center gap-2 text-gray-300 mb-1 md:mb-2">
                        <span className="text-xl md:text-2xl">{icon}</span>
                        <p className="text-xs md:text-sm font-medium truncate">{title}</p>
                    </div>
                    <h3 className={`text-2xl md:text-4xl font-bold ${color}`}>{value.toLocaleString()}</h3>
                    {trend && (
                        <p className={`text-[10px] md:text-sm mt-1 md:mt-2 ${trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                            {trend === 'up' ? '↑' : '↓'} {trendValue}
                        </p>
                    )}
                </div>
            </div>
        </div>
    )

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-white text-xl">Loading dashboard...</div>
            </div>
        )
    }

    return (
        <div className="space-y-4 md:space-y-6 pb-20 md:pb-0">
            {/* Welcome Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-4xl font-bold text-white mb-1">Dashboard</h1>
                    <p className="text-xs md:text-base text-gray-300">Welcome back! Here's your inventory overview.</p>
                </div>
                <button
                    onClick={loadDashboardData}
                    className="self-start md:self-auto px-4 py-2 md:px-6 md:py-3 bg-amber-500 hover:bg-amber-600 text-black text-sm md:text-base font-semibold rounded-lg transition-all shadow-lg"
                >
                    🔄 Refresh
                </button>
            </div>

            {/* Stats Cards - 2 Column Grid on Mobile */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                <StatCard
                    icon="📊"
                    title="SKUs"
                    value={stats.totalSKUs}
                    trend="up"
                    trendValue="+5%"
                    color="text-amber-400"
                />
                <StatCard
                    icon="📦"
                    title="Total Stock"
                    value={stats.totalStock}
                    trend="up"
                    trendValue="+3%"
                    color="text-amber-300"
                />
                <StatCard
                    icon="⚠️"
                    title="Low Stock"
                    value={stats.lowStock}
                    trend="down"
                    trendValue="-8%"
                    color="text-amber-400"
                />
                <StatCard
                    icon="❌"
                    title="Out of Stock"
                    value={stats.outOfStock}
                    trend="down"
                    trendValue="-16%"
                    color="text-red-400"
                />
            </div>

            {/* Stock Distribution & Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                {/* Stock Distribution */}
                <div className="bg-black/50 backdrop-blur-md rounded-2xl p-4 md:p-6 border border-amber-400/30 shadow-2xl">
                    <h2 className="text-lg md:text-2xl font-bold text-white mb-4 md:mb-6">📈 Stock Distribution</h2>
                    <div className="space-y-3 md:space-y-4">
                        <div>
                            <div className="flex justify-between text-white mb-1 text-xs md:text-base">
                                <span>Full Stock</span>
                                <span className="font-bold">{stats.totalStock - stats.lowStock - stats.outOfStock}</span>
                            </div>
                            <div className="w-full bg-white/20 rounded-full h-2 md:h-3">
                                <div
                                    className="bg-gradient-to-r from-amber-500 to-amber-400 h-2 md:h-3 rounded-full"
                                    style={{ width: `${((stats.totalStock - stats.lowStock - stats.outOfStock) / Math.max(stats.totalStock, 1)) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-white mb-1 text-xs md:text-base">
                                <span>Low Stock</span>
                                <span className="font-bold">{stats.lowStock}</span>
                            </div>
                            <div className="w-full bg-white/20 rounded-full h-2 md:h-3">
                                <div
                                    className="bg-gradient-to-r from-amber-500 to-orange-500 h-2 md:h-3 rounded-full"
                                    style={{ width: `${(stats.lowStock / Math.max(stats.totalStock, 1)) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-white mb-1 text-xs md:text-base">
                                <span>Out of Stock</span>
                                <span className="font-bold">{stats.outOfStock}</span>
                            </div>
                            <div className="w-full bg-white/20 rounded-full h-2 md:h-3">
                                <div
                                    className="bg-gradient-to-r from-red-500 to-pink-500 h-2 md:h-3 rounded-full"
                                    style={{ width: `${(stats.outOfStock / Math.max(stats.totalStock, 1)) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Inventory Status Alert */}
                <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 backdrop-blur-md rounded-2xl p-4 md:p-6 border border-amber-500/30 shadow-2xl">
                    <div className="flex items-start gap-3 md:gap-4">
                        <div className="text-2xl md:text-4xl">⚠️</div>
                        <div className="flex-1">
                            <h3 className="text-lg md:text-2xl font-bold text-amber-300 mb-1 md:mb-2">Stock Alert</h3>
                            <p className="text-xs md:text-base text-white mb-3 md:mb-4">
                                You have <strong>{stats.lowStock}</strong> items running low and{' '}
                                <strong>{stats.outOfStock}</strong> items out of stock. Review and reorder to avoid stockouts.
                            </p>
                            <button
                                onClick={() => onNavigate?.('inventory')}
                                className="px-3 py-2 md:px-4 md:py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs md:text-base font-semibold rounded-lg transition-all"
                            >
                                View Low Stock Items
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Top Selling Items */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 md:p-6 border border-white/20 shadow-2xl">
                <h2 className="text-lg md:text-2xl font-bold text-white mb-4 md:mb-6">🏆 Top Stock Items</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-white min-w-[600px] md:min-w-0">
                        <thead>
                            <tr className="border-b border-white/20 text-xs md:text-base">
                                <th className="text-left py-2 md:py-3 px-2">Rank</th>
                                <th className="text-left py-2 md:py-3 px-2">Product Name</th>
                                <th className="text-left py-2 md:py-3 px-2">Variant</th>
                                <th className="text-left py-2 md:py-3 px-2">Barcode</th>
                                <th className="text-right py-2 md:py-3 px-2">Price</th>
                                <th className="text-right py-2 md:py-3 px-2">Stock</th>
                            </tr>
                        </thead>
                        <tbody className="text-xs md:text-base">
                            {stats.topProducts.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-8 text-gray-300">
                                        No products available
                                    </td>
                                </tr>
                            ) : (
                                stats.topProducts.map((product, index) => (
                                    <tr key={product.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                                        <td className="py-2 md:py-3 px-2">
                                            <span className={`font-bold ${index === 0 ? 'text-yellow-400' : index === 1 ? 'text-gray-400' : index === 2 ? 'text-amber-600' : 'text-white'}`}>
                                                #{index + 1}
                                            </span>
                                        </td>
                                        <td className="py-2 md:py-3 px-2 font-semibold">{product.product_name}</td>
                                        <td className="py-2 md:py-3 px-2 text-gray-300">{product.size} / {product.color}</td>
                                        <td className="py-2 md:py-3 px-2 font-mono text-xs md:text-sm text-gray-400">{product.barcode}</td>
                                        <td className="py-2 md:py-3 px-2 text-right font-semibold">₹{product.price_retail}</td>
                                        <td className="py-2 md:py-3 px-2 text-right">
                                            <span className={`px-2 py-1 md:px-3 rounded-full text-xs md:text-sm font-bold ${product.stock_quantity > 10 ? 'bg-green-500/20 text-green-400' :
                                                product.stock_quantity > 0 ? 'bg-amber-500/20 text-amber-400' :
                                                    'bg-red-500/20 text-red-400'
                                                }`}>
                                                {product.stock_quantity}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Quick Actions (Hidden on Mobile because Bottom is there) */}
            <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-6">
                <div
                    onClick={() => onNavigate?.('inventory')}
                    className="bg-gradient-to-br from-amber-600 to-amber-500 rounded-2xl p-6 shadow-2xl cursor-pointer hover:scale-105 transition-transform"
                >
                    <div className="text-4xl mb-3">📦</div>
                    <h3 className="text-xl font-bold text-black mb-2">Manage Inventory</h3>
                    <p className="text-amber-900">Add, edit, or remove products from your inventory</p>
                </div>
                <div
                    onClick={() => onNavigate?.('pos')}
                    className="bg-gradient-to-br from-amber-500 to-yellow-500 rounded-2xl p-6 shadow-2xl cursor-pointer hover:scale-105 transition-transform"
                >
                    <div className="text-4xl mb-3">💳</div>
                    <h3 className="text-xl font-bold text-black mb-2">Point of Sale</h3>
                    <p className="text-amber-900">Process customer transactions and sales</p>
                </div>
                <div
                    onClick={() => onNavigate?.('analytics')}
                    className="bg-gradient-to-br from-yellow-500 to-amber-400 rounded-2xl p-6 shadow-2xl cursor-pointer hover:scale-105 transition-transform"
                >
                    <div className="text-4xl mb-3">📊</div>
                    <h3 className="text-xl font-bold text-black mb-2">Sales Analytics</h3>
                    <p className="text-amber-900">View detailed reports and analytics</p>
                </div>
            </div>
        </div>
    )
}
