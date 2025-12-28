import { useState, useEffect } from 'react'
import { fetchSalesAnalytics, createReturn } from '../api'

export default function SalesAnalytics() {
    const [analytics, setAnalytics] = useState(null)
    const [loading, setLoading] = useState(true)
    const [period, setPeriod] = useState(30)
    const [showDate, setShowDate] = useState(false)

    // Return Modal State
    const [showReturnModal, setShowReturnModal] = useState(false)
    const [selectedSale, setSelectedSale] = useState(null)
    const [returnQuantities, setReturnQuantities] = useState({})
    const [returnReason, setReturnReason] = useState('Defective')
    const [returnNote, setReturnNote] = useState('')
    const [isSubmittingReturn, setIsSubmittingReturn] = useState(false)

    useEffect(() => {
        loadAnalytics()
    }, [period])

    const openReturnModal = (sale) => {
        setSelectedSale(sale)
        // Initialize quantities to 0
        const initialQuantities = {}
        if (sale && sale.items) {
            sale.items.forEach(item => {
                initialQuantities[item.id] = 0
            })
        }
        setReturnQuantities(initialQuantities)
        setReturnReason('DEFECT')
        setReturnNote('')
        setShowReturnModal(true)
    }

    const handleReturnSubmit = async (e) => {
        e.preventDefault()

        // Filter items with quantity > 0
        const itemsToReturn = Object.entries(returnQuantities)
            .filter(([_, qty]) => qty > 0)
            .map(([itemId, qty]) => ({
                sale_item: parseInt(itemId),
                quantity: parseInt(qty)
            }))

        if (itemsToReturn.length === 0) {
            alert('Please select at least one item to return.')
            return
        }

        try {
            setIsSubmittingReturn(true)
            await createReturn({
                original_sale: selectedSale.id,
                reason: returnReason,
                notes: returnNote,
                items: itemsToReturn
            })
            alert('✅ Return processed successfully!')
            setShowReturnModal(false)
            loadAnalytics() // Refresh data
        } catch (error) {
            alert('Error processing return: ' + (error.response?.data?.error || error.message))
        } finally {
            setIsSubmittingReturn(false)
        }
    }


    const loadAnalytics = async () => {
        try {
            setLoading(true)
            let params = { days: period }

            if (period === 'this_month') {
                const now = new Date()
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
                const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString()
                params = { start_date: startOfMonth, end_date: endOfMonth }
            }

            const response = await fetchSalesAnalytics(params)
            setAnalytics(response.data)
            setLoading(false)
        } catch (error) {
            console.error('Error loading analytics:', error)
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-white text-xl">Loading analytics...</div>
            </div>
        )
    }

    if (!analytics) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-white text-xl">No data available</div>
            </div>
        )
    }

    const { summary, payment_breakdown, top_products, recent_sales, recent_returns, monthly_data } = analytics

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold text-white mb-2">📊 Sales Analytics</h1>
                    <p className="text-gray-300">
                        {period === 'this_month' ? `Reporting for ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}` : `Analysis for the last ${period} days`}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                        <button
                            onClick={() => setShowDate(!showDate)}
                            className="p-2 bg-black/50 hover:bg-black/70 text-amber-500 rounded-lg border border-amber-400/30 transition-all shadow-lg text-xl"
                            title="Show Date"
                        >
                            📅
                        </button>
                        {showDate && (
                            <div className="absolute top-12 right-0 bg-black/90 border border-amber-500 rounded-xl p-4 shadow-2xl z-50 w-48 text-center backdrop-blur-xl">
                                <div className="text-amber-400 font-bold text-xl font-serif">
                                    {new Date().toLocaleString('default', { month: 'long' })}
                                </div>
                                <div className="text-white text-lg font-mono">
                                    {new Date().getFullYear()}
                                </div>
                            </div>
                        )}
                    </div>
                    <select
                        value={period}
                        onChange={(e) => setPeriod(e.target.value === 'this_month' ? 'this_month' : Number(e.target.value))}
                        className="px-4 py-2 rounded-lg bg-black/50 text-white border border-amber-400/30 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                        <option value="this_month">📅 This Month</option>
                        <option value={7}>Last 7 Days</option>
                        <option value={30}>Last 30 Days</option>
                        <option value={90}>Last 90 Days</option>
                        <option value={365}>Last Year</option>
                    </select>
                    <button
                        onClick={loadAnalytics}
                        className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-lg transition-all shadow-lg"
                    >
                        🔄 Refresh
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-black/50 backdrop-blur-md rounded-2xl p-5 border border-amber-400/30 shadow-2xl hover:border-amber-400/50 transition-all">
                    <div className="text-2xl mb-1 text-amber-500">💰</div>
                    <h3 className="text-amber-200/80 text-xs font-medium mb-1">Total Revenue</h3>
                    <p className="text-2xl font-bold text-amber-500">₹{(summary.total_revenue || 0).toFixed(2)}</p>
                </div>
                <div className="bg-black/50 backdrop-blur-md rounded-2xl p-5 border border-red-500/30 shadow-2xl hover:border-red-500/50 transition-all">
                    <div className="text-2xl mb-1">↩️</div>
                    <h3 className="text-red-300/80 text-xs font-medium mb-1">Total Returns</h3>
                    <p className="text-2xl font-bold text-red-500">₹{(summary.total_refunds || 0).toFixed(2)}</p>
                    <p className="text-[10px] text-red-300/60 font-bold uppercase tracking-wider">{summary.total_returns || 0} returns processed</p>
                </div>
                <div className="bg-gradient-to-br from-amber-600/20 to-yellow-600/20 rounded-2xl p-5 border border-amber-400/50 shadow-2xl">
                    <div className="text-2xl mb-1 text-amber-400">💵</div>
                    <h3 className="text-amber-100/90 text-xs font-medium mb-1">Net Revenue</h3>
                    <p className="text-2xl font-bold text-amber-400">₹{(summary.net_revenue || 0).toFixed(2)}</p>
                </div>
                <div className="bg-black/50 backdrop-blur-md rounded-2xl p-5 border border-amber-400/30 shadow-2xl hover:border-amber-400/50 transition-all">
                    <div className="text-2xl mb-1 text-amber-500">📦</div>
                    <h3 className="text-amber-200/80 text-xs font-medium mb-1">Items Sold</h3>
                    <p className="text-2xl font-bold text-amber-500">{summary.total_items || 0}</p>
                    <p className="text-[10px] text-amber-200/60 font-bold uppercase tracking-wider">Across {summary.total_sales} orders</p>
                </div>
                <div className="bg-black/50 backdrop-blur-md rounded-2xl p-5 border border-amber-400/30 shadow-2xl hover:border-amber-400/50 transition-all">
                    <div className="text-2xl mb-1 text-amber-500">🧾</div>
                    <h3 className="text-amber-200/80 text-xs font-medium mb-1">Net GST</h3>
                    <p className="text-2xl font-bold text-amber-500">₹{(summary.total_gst || 0).toFixed(2)}</p>
                </div>
            </div>

            {/* Payment Breakdown & Monthly Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Payment Mode Breakdown */}
                <div className="bg-black/50 backdrop-blur-md rounded-2xl p-6 border border-amber-400/30 shadow-2xl">
                    <h2 className="text-2xl font-bold text-white mb-6">💳 Payment Mode Breakdown</h2>
                    <div className="space-y-4">
                        {payment_breakdown && payment_breakdown.length > 0 ? payment_breakdown.map((payment) => {
                            const grossRevenue = summary.gross_revenue || summary.total_revenue || 1
                            const percentage = (payment.total / grossRevenue) * 100
                            const colorClass = 'from-amber-500 to-yellow-400'

                            return (
                                <div key={payment.payment_mode}>
                                    <div className="flex justify-between text-white mb-2">
                                        <span className="font-medium">
                                            {payment.payment_mode === 'CASH' ? '💵 Cash' :
                                                payment.payment_mode === 'CARD' ? '💳 Card' :
                                                    payment.payment_mode === 'UPI' ? '📱 UPI' : '🔀 Mixed'}
                                        </span>
                                        <span className="font-bold text-amber-400">
                                            {payment.count} sales • ₹{payment.total.toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="w-full bg-white/10 rounded-full h-3">
                                        <div
                                            className={`bg-gradient-to-r ${colorClass} h-3 rounded-full transition-all`}
                                            style={{ width: `${percentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )
                        }) : (
                            <p className="text-gray-300 text-center py-4">No payment data available</p>
                        )}
                    </div>
                </div>

                {/* Monthly Trend with Returns */}
                <div className="bg-black/50 backdrop-blur-md rounded-2xl p-6 border border-amber-400/30 shadow-2xl">
                    <h2 className="text-2xl font-bold text-white mb-6">📅 Monthly Trend</h2>
                    <div className="space-y-3">
                        {monthly_data && monthly_data.map((month, index) => (
                            <div key={index} className="bg-white/5 rounded-lg p-3 border border-white/5">
                                <div className="flex justify-between items-center text-white">
                                    <span className="font-semibold">{month.month}</span>
                                    <div className="text-right">
                                        <div className="font-bold text-emerald-400">₹{(month.net || month.revenue || 0).toFixed(2)}</div>
                                        {month.refunds > 0 && (
                                            <div className="text-xs text-red-400">-₹{month.refunds.toFixed(2)} returns</div>
                                        )}
                                        <div className="text-sm text-gray-300">{month.count} sales</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Recent Returns */}
            {
                recent_returns && recent_returns.length > 0 && (
                    <div className="bg-black/50 backdrop-blur-md rounded-xl md:rounded-2xl p-4 md:p-6 border border-red-500/30 shadow-2xl">
                        <h2 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6">↩️ Recent Returns</h2>

                        {/* Mobile Card View */}
                        <div className="md:hidden space-y-3">
                            {recent_returns.map((ret, index) => (
                                <div key={index} className="bg-white/5 rounded-lg p-3 border border-red-500/20">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <div className="text-red-400 font-bold text-sm">#{ret.return_number}</div>
                                            <div className="text-xs text-gray-400">Orig: {ret.original_sale__invoice_number}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-red-400 font-bold text-sm">-₹{parseFloat(ret.refund_amount).toFixed(0)}</div>
                                            <div className="text-[10px] text-gray-500">{new Date(ret.created_at).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                    <span className="px-2 py-1 bg-red-500/10 text-red-400 rounded-full text-[10px] uppercase font-bold tracking-wider">
                                        {ret.reason.replace('_', ' ')}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Desktop Table View */}
                        <div className="overflow-x-auto hidden md:block">
                            <table className="w-full text-white">
                                <thead>
                                    <tr className="border-b border-white/20">
                                        <th className="text-left py-3 px-2">Return #</th>
                                        <th className="text-left py-3 px-2">Original Invoice</th>
                                        <th className="text-left py-3 px-2">Reason</th>
                                        <th className="text-right py-3 px-2">Refund Amount</th>
                                        <th className="text-right py-3 px-2">Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recent_returns.map((ret, index) => (
                                        <tr key={index} className="border-b border-white/10 hover:bg-white/5">
                                            <td className="py-3 px-2 font-mono text-sm">{ret.return_number}</td>
                                            <td className="py-3 px-2 font-mono text-sm">{ret.original_sale__invoice_number}</td>
                                            <td className="py-3 px-2">
                                                <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs">
                                                    {ret.reason}
                                                </span>
                                            </td>
                                            <td className="py-3 px-2 text-right font-bold text-red-400">
                                                -₹{parseFloat(ret.refund_amount).toFixed(2)}
                                            </td>
                                            <td className="py-3 px-2 text-right text-sm text-gray-300">
                                                {new Date(ret.created_at).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )
            }

            {/* Top Selling Products */}
            <div className="bg-black/50 backdrop-blur-md rounded-xl md:rounded-2xl p-4 md:p-6 border border-amber-400/30 shadow-2xl">
                <h2 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6">🏆 Top Selling Products</h2>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-3">
                    {!top_products || top_products.length === 0 ? (
                        <div className="text-center py-6 text-gray-400 text-sm">No sales data available</div>
                    ) : (
                        top_products.map((product, index) => (
                            <div key={index} className="bg-white/5 rounded-lg p-3 border border-amber-400/10 flex items-center gap-3">
                                <div className={`font-bold text-xl w-8 text-center ${index === 0 ? 'text-yellow-400' : index === 1 ? 'text-gray-400' : index === 2 ? 'text-amber-600' : 'text-gray-600'}`}>
                                    #{index + 1}
                                </div>
                                <div className="flex-1">
                                    <div className="text-white font-semibold text-sm line-clamp-1">{product.product_name}</div>
                                    <div className="text-xs text-gray-400">{product.variant_size} / {product.variant_color}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-amber-400 font-bold text-sm">₹{product.total_revenue.toFixed(0)}</div>
                                    <div className="text-[10px] text-gray-500">{product.total_quantity} sold</div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Desktop Table View */}
                <div className="overflow-x-auto hidden md:block">
                    <table className="w-full text-white">
                        <thead>
                            <tr className="border-b border-white/20">
                                <th className="text-left py-3 px-2">Rank</th>
                                <th className="text-left py-3 px-2">Product</th>
                                <th className="text-left py-3 px-2">Variant</th>
                                <th className="text-right py-3 px-2">Quantity Sold</th>
                                <th className="text-right py-3 px-2">Revenue</th>
                            </tr>
                        </thead>
                        <tbody>
                            {!top_products || top_products.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="text-center py-8 text-gray-300">
                                        No sales data available
                                    </td>
                                </tr>
                            ) : (
                                top_products.map((product, index) => (
                                    <tr key={index} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                                        <td className="py-3 px-2">
                                            <span className={`font-bold ${index === 0 ? 'text-yellow-400' :
                                                index === 1 ? 'text-gray-400' :
                                                    index === 2 ? 'text-amber-600' : 'text-white'
                                                }`}>
                                                #{index + 1}
                                            </span>
                                        </td>
                                        <td className="py-3 px-2 font-semibold">{product.product_name}</td>
                                        <td className="py-3 px-2 text-gray-300">
                                            {product.variant_size} / {product.variant_color}
                                        </td>
                                        <td className="py-3 px-2 text-right font-semibold">
                                            {product.total_quantity} units
                                        </td>
                                        <td className="py-3 px-2 text-right font-bold text-amber-400">
                                            ₹{product.total_revenue.toFixed(2)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Recent Sales */}
            <div className="bg-black/50 backdrop-blur-md rounded-xl md:rounded-2xl p-4 md:p-6 border border-amber-400/30 shadow-2xl">
                <h2 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6">🕒 Recent Sales</h2>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-3">
                    {!recent_sales || recent_sales.length === 0 ? (
                        <div className="text-center py-6 text-gray-400 text-sm">No recent sales</div>
                    ) : (
                        recent_sales.map((sale) => (
                            <div key={sale.id} className="bg-white/5 rounded-lg p-3 border border-amber-400/10">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <div className="text-amber-500 font-mono font-bold text-sm">{sale.invoice_number}</div>
                                        <div className="text-xs text-gray-300 mt-0.5">{sale.customer_name || 'Walk-in'}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-green-400 font-bold text-sm">₹{parseFloat(sale.total_amount).toFixed(0)}</div>
                                        <div className="text-[10px] text-gray-500">{new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                    </div>
                                </div>
                                <div className="text-xs text-gray-400 mb-2 line-clamp-2">
                                    {sale.items?.map(i => `${i.variant_name} (${i.quantity})`).join(', ')}
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t border-white/5">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider ${sale.payment_mode === 'CASH' ? 'bg-green-500/10 text-green-400' : 'bg-blue-500/10 text-blue-400'
                                        }`}>
                                        {sale.payment_mode}
                                    </span>
                                    <button
                                        onClick={() => openReturnModal(sale)}
                                        className="px-2 py-1 bg-red-500/10 text-red-400 rounded hover:bg-red-500/20 text-[10px] font-bold uppercase tracking-wider transition-colors"
                                    >
                                        ↩️ Return
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Desktop Table View */}
                <div className="overflow-x-auto hidden md:block">
                    <table className="w-full text-white">
                        <thead>
                            <tr className="border-b border-white/20">
                                <th className="text-left py-3 px-2">Invoice</th>
                                <th className="text-left py-3 px-2">Customer</th>
                                <th className="text-left py-3 px-2">Products</th>
                                <th className="text-left py-3 px-2">Payment Mode</th>
                                <th className="text-right py-3 px-2">Amount</th>
                                <th className="text-right py-3 px-2">Date & Time</th>
                                <th className="text-center py-3 px-2">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {!recent_sales || recent_sales.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-8 text-gray-300">
                                        No recent sales
                                    </td>
                                </tr>
                            ) : (
                                recent_sales.map((sale) => (
                                    <tr key={sale.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                                        <td className="py-3 px-2 font-mono text-sm align-top">{sale.invoice_number}</td>
                                        <td className="py-3 px-2 align-top">{sale.customer_name || 'Walk-in'}</td>
                                        <td className="py-3 px-2 align-top">
                                            <div className="space-y-1">
                                                {sale.items && sale.items.map((item, idx) => (
                                                    <div key={idx} className="text-sm">
                                                        <span className="font-semibold text-amber-200">{item.variant_name}</span>
                                                        <span className="text-gray-400 ml-1">
                                                            ({item.variant_size} / {item.variant_color})
                                                        </span>
                                                        <span className="text-gray-500 ml-1">x{item.quantity}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="py-3 px-2 align-top">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${sale.payment_mode === 'CASH' ? 'bg-amber-500/20 text-amber-400' :
                                                sale.payment_mode === 'CARD' ? 'bg-amber-500/20 text-amber-400' :
                                                    sale.payment_mode === 'UPI' ? 'bg-amber-500/20 text-amber-400' :
                                                        'bg-amber-500/20 text-amber-400'
                                                }`}>
                                                {sale.payment_mode}
                                            </span>
                                        </td>
                                        <td className="py-3 px-2 text-right font-bold align-top">₹{parseFloat(sale.total_amount).toFixed(2)}</td>
                                        <td className="py-3 px-2 text-right text-sm text-gray-300 align-top">
                                            <div>{new Date(sale.created_at).toLocaleDateString()}</div>
                                            <div className="text-xs text-gray-500">{new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                        </td>
                                        <td className="py-3 px-2 text-center align-top">
                                            <button
                                                onClick={() => openReturnModal(sale)}
                                                className="px-3 py-1 bg-red-500/10 text-red-500 border border-red-500/30 rounded hover:bg-red-500/20 transition-all text-xs font-bold"
                                            >
                                                ↩️ Return
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Return Modal */}
            {showReturnModal && selectedSale && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-gray-900 rounded-2xl p-6 border border-red-500/30 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-white">↩️ Process Return</h2>
                            <button onClick={() => setShowReturnModal(false)} className="text-gray-400 hover:text-white">✕</button>
                        </div>

                        <div className="mb-6 p-4 bg-white/5 rounded-lg border border-white/10">
                            <div className="flex justify-between text-sm text-gray-300">
                                <span>Invoice: <span className="text-white font-mono">{selectedSale.invoice_number}</span></span>
                                <span>Date: <span className="text-white">{new Date(selectedSale.created_at).toLocaleDateString()}</span></span>
                            </div>
                        </div>

                        <form onSubmit={handleReturnSubmit} className="space-y-6">
                            <div className="space-y-4">
                                <h3 className="text-white font-semibold border-b border-white/10 pb-2">Select Items to Return</h3>
                                {selectedSale.items.map((item) => (
                                    <div key={item.id} className="flex items-center justify-between p-3 bg-black/40 rounded-lg border border-white/5">
                                        <div className="flex-1">
                                            <div className="text-amber-400 font-bold">{item.variant_name}</div>
                                            <div className="text-sm text-gray-400">{item.variant_size} | {item.variant_color}</div>
                                            <div className="text-xs text-gray-500">Sold Price: ₹{item.unit_price}</div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="text-right mr-2">
                                                <div className="text-xs text-gray-400">Sold: {item.quantity}</div>
                                            </div>
                                            <select
                                                value={returnQuantities[item.id] || 0}
                                                onChange={(e) => setReturnQuantities({
                                                    ...returnQuantities,
                                                    [item.id]: Math.min(parseInt(e.target.value), item.quantity)
                                                })}
                                                className="bg-gray-800 text-white border border-gray-600 rounded px-2 py-1 w-20 focus:border-red-500 outline-none"
                                            >
                                                {[...Array(item.quantity + 1).keys()].map(num => (
                                                    <option key={num} value={num}>{num}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-400 text-sm mb-1">Reason</label>
                                    <select
                                        value={returnReason}
                                        onChange={e => setReturnReason(e.target.value)}
                                        className="w-full bg-gray-800 text-white border border-gray-600 rounded-lg px-3 py-2 focus:border-red-500 outline-none"
                                    >
                                        <option value="DEFECT">Defective Product</option>
                                        <option value="WRONG_SIZE">Wrong Size</option>
                                        <option value="WRONG_COLOR">Wrong Color</option>
                                        <option value="NOT_AS_EXPECTED">Not as Expected</option>
                                        <option value="CUSTOMER_CHANGE">Customer Changed Mind</option>
                                        <option value="OTHER">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-sm mb-1">Notes (Optional)</label>
                                    <input
                                        type="text"
                                        value={returnNote}
                                        onChange={e => setReturnNote(e.target.value)}
                                        className="w-full bg-gray-800 text-white border border-gray-600 rounded-lg px-3 py-2 focus:border-red-500 outline-none"
                                        placeholder="Additional details..."
                                    />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowReturnModal(false)}
                                    className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmittingReturn}
                                    className="px-6 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 disabled:opacity-50"
                                >
                                    {isSubmittingReturn ? 'Processing...' : 'Process Refund'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div >
    )
}
