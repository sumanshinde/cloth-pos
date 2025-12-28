import { useState, useEffect, useRef } from 'react'
import { fetchVariants, createSale, fetchSalesAnalytics, fetchProducts } from '../api'

export default function PointOfSale() {
    const [cart, setCart] = useState([])
    const [barcode, setBarcode] = useState('')
    const [paymentMode, setPaymentMode] = useState('CASH')
    const [customerName, setCustomerName] = useState('')
    const barcodeInputRef = useRef(null)

    // Suggestions State
    const [suggestions, setSuggestions] = useState([])
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [selectedColor, setSelectedColor] = useState('')
    const [selectedSize, setSelectedSize] = useState('')

    const [currentTime, setCurrentTime] = useState(new Date())

    // Data State
    const [allVariants, setAllVariants] = useState([])
    const [allProducts, setAllProducts] = useState([])
    const [dailyStats, setDailyStats] = useState(null)
    const [recentSales, setRecentSales] = useState([])

    useEffect(() => {
        // Auto-focus barcode input
        barcodeInputRef.current?.focus()

        // Load data
        loadVariants()
        loadProducts()
        loadDailyStats()

        // Clock timer
        const timer = setInterval(() => setCurrentTime(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])

    const loadVariants = async () => {
        try {
            const response = await fetchVariants() // Fetch all without search query
            setAllVariants(response.data.results || response.data)
        } catch (error) {
            console.error('Error loading variants:', error)
        }
    }

    const loadProducts = async () => {
        try {
            const response = await fetchProducts()
            setAllProducts(response.data.results || response.data)
        } catch (error) {
            console.error('Error loading products:', error)
        }
    }

    const loadDailyStats = async () => {
        try {
            // Fetch analytics for period=1 (Last 24 hours / Today)
            const response = await fetchSalesAnalytics({ days: 1 })
            setDailyStats(response.data.summary)
            setRecentSales(response.data.recent_sales)
        } catch (error) {
            console.error('Error loading daily stats:', error)
        }
    }

    const handleBarcodeChange = (e) => {
        const query = e.target.value
        setBarcode(query)
        updateSuggestions(query, selectedColor, selectedSize)
    }

    const handleColorChange = (e) => {
        const color = e.target.value
        setSelectedColor(color)
        updateSuggestions(barcode, color, selectedSize)
    }

    const handleSizeChange = (e) => {
        const size = e.target.value
        setSelectedSize(size)
        updateSuggestions(barcode, selectedColor, size)
    }

    const updateSuggestions = (query, color, size) => {
        if (query.length > 0 || color || size) {
            const lowerQuery = query.toLowerCase()

            // 1. Filter variants by Query, Color, and Size
            const filteredVariants = allVariants.filter(v => {
                const matchesQuery = !query ||
                    v.product_name.toLowerCase().includes(lowerQuery) ||
                    lowerQuery.includes(v.product_name.toLowerCase()) ||
                    v.barcode.toLowerCase().includes(lowerQuery)

                const matchesColor = !color || (v.color && v.color.toLowerCase() === color.toLowerCase())
                const matchesSize = !size || (v.size && v.size.toLowerCase() === size.toLowerCase())

                return matchesQuery && matchesColor && matchesSize
            })

            // 2. Filter Products (only if no Color/Size filter is active, or if we want to show generic matches)
            let productMatches = []
            if (query.length > 0 && !color && !size) {
                const matchedProductIds = new Set(allVariants.map(v => v.product))
                productMatches = allProducts
                    .filter(p => p.name.toLowerCase().includes(lowerQuery) || lowerQuery.includes(p.name.toLowerCase()))
                    .filter(p => !matchedProductIds.has(p.id))
                    .map(p => ({
                        id: `prod-${p.id}`,
                        product_name: p.name,
                        is_empty_product: true
                    }))
            }

            setSuggestions([...filteredVariants, ...productMatches].slice(0, 50))
            setShowSuggestions(true)
        } else {
            setSuggestions([])
            setShowSuggestions(false)
        }
    }

    const selectSuggestion = (item) => {
        if (item.is_empty_product) {
            alert(`⚠️ "${item.product_name}" exists in inventory but has no stock or variants (size/color).\n\nPlease add variants for this product in the Inventory page first.`)
            return
        }
        addToCart(item)
        setBarcode('')
        setSelectedColor('')
        setSelectedSize('')
        setSuggestions([])
        setShowSuggestions(false)
        barcodeInputRef.current?.focus()
    }

    const handleBarcodeSubmit = async (e) => {
        e.preventDefault()
        if (!barcode.trim()) return

        // If exact match in suggestions, prioritize that
        const exactMatch = suggestions.find(s => s.barcode === barcode || s.product_name.toLowerCase() === barcode.toLowerCase())
        if (exactMatch) {
            selectSuggestion(exactMatch)
            return
        }

        try {
            const response = await fetchVariants(barcode)
            const variant = response.data.results?.[0] || response.data[0]

            if (variant) {
                addToCart(variant)
                setBarcode('')
                setSuggestions([])
                setShowSuggestions(false)
            } else {
                alert('Product not found!')
            }
        } catch (error) {
            alert('Error finding product: ' + error.message)
        }
    }

    const addToCart = (variant) => {
        const existingItem = cart.find(item => item.variant.id === variant.id)

        if (existingItem) {
            setCart(cart.map(item =>
                item.variant.id === variant.id
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            ))
        } else {
            setCart([...cart, { variant, quantity: 1 }])
        }
    }

    const updateQuantity = (variantId, newQuantity) => {
        if (newQuantity === 0) {
            setCart(cart.filter(item => item.variant.id !== variantId))
        } else {
            setCart(cart.map(item =>
                item.variant.id === variantId
                    ? { ...item, quantity: newQuantity }
                    : item
            ))
        }
    }

    const calculateTotal = () => {
        return cart.reduce((sum, item) => {
            const itemTotal = parseFloat(item.variant.price_retail) * item.quantity
            const gst = (itemTotal * parseFloat(item.variant.gst_rate)) / 100
            return sum + itemTotal + gst
        }, 0)
    }

    const handleCheckout = async () => {
        if (cart.length === 0) {
            alert('Cart is empty!')
            return
        }

        const saleData = {
            customer_name: customerName || 'Walk-in Customer',
            payment_mode: paymentMode,
            items: cart.map(item => ({
                variant: item.variant.id,
                quantity: item.quantity,
                unit_price: item.variant.price_retail
            }))
        }

        try {
            const response = await createSale(saleData)
            alert(`✅ Sale Complete! Invoice: ${response.data.invoice_number}`)
            setCart([])
            setCustomerName('')
            barcodeInputRef.current?.focus()

            // Immediately update stats and recent sales
            loadDailyStats()
        } catch (error) {
            alert('Checkout failed: ' + (error.response?.data?.error || error.message))
        }
    }

    const uniqueColors = [...new Set(allVariants.map(v => v.color).filter(Boolean))].sort()
    const uniqueSizes = [...new Set(allVariants.map(v => v.size).filter(Boolean))].sort()

    return (
        <div className="space-y-4 md:space-y-6 pb-20 md:pb-0">
            {/* Top Bar: Daily Stats */}
            {dailyStats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                    <div className="bg-black/50 backdrop-blur-md rounded-xl p-3 md:p-4 border border-amber-400/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
                        <div>
                            <div className="text-amber-200/70 text-[10px] md:text-xs uppercase tracking-wider font-semibold">Today's Revenue</div>
                            <div className="text-xl md:text-2xl font-bold text-amber-500">₹{(dailyStats.total_revenue || 0).toFixed(0)}</div>
                        </div>
                        <div className="text-2xl md:text-3xl self-end md:self-auto">💰</div>
                    </div>
                    <div className="bg-black/50 backdrop-blur-md rounded-xl p-3 md:p-4 border border-blue-400/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
                        <div>
                            <div className="text-blue-200/70 text-[10px] md:text-xs uppercase tracking-wider font-semibold">Items Sold</div>
                            <div className="text-xl md:text-2xl font-bold text-blue-400">{dailyStats.total_sales || 0}</div>
                        </div>
                        <div className="text-2xl md:text-3xl self-end md:self-auto">📦</div>
                    </div>
                    <div className="bg-black/50 backdrop-blur-md rounded-xl p-3 md:p-4 border border-green-400/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
                        <div>
                            <div className="text-green-200/70 text-[10px] md:text-xs uppercase tracking-wider font-semibold">Transactions</div>
                            <div className="text-xl md:text-2xl font-bold text-green-400">{dailyStats.total_orders || recentSales.length}</div>
                        </div>
                        <div className="text-2xl md:text-3xl self-end md:self-auto">🧾</div>
                    </div>
                    <div className="bg-gradient-to-r from-gray-900 to-black rounded-xl p-3 md:p-4 border border-white/10 flex flex-col justify-center items-end">
                        <div className="text-white font-bold font-mono text-lg md:text-xl">
                            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="text-gray-400 text-[10px] md:text-xs font-semibold uppercase tracking-widest">
                            {currentTime.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                {/* Left: Barcode Scanner & Cart */}
                <div className="lg:col-span-2 space-y-4 md:space-y-6">
                    <div className="bg-black/50 backdrop-blur-md rounded-xl md:rounded-2xl p-4 md:p-6 border border-amber-400/30 shadow-2xl relative z-50">
                        <div className="flex justify-between items-center mb-3 md:mb-4">
                            <h2 className="text-xl md:text-2xl font-bold text-white">🔍 Scan Product</h2>
                            <button
                                onClick={() => {
                                    setBarcode('')
                                    setSelectedColor('')
                                    setSelectedSize('')
                                    setSuggestions([])
                                    setShowSuggestions(false)
                                }}
                                className="text-xs text-gray-400 hover:text-white underline"
                            >
                                Clear Filters
                            </button>
                        </div>

                        <div className="flex flex-col md:flex-row gap-3">
                            <form onSubmit={handleBarcodeSubmit} className="flex-1 relative" autoComplete="off">
                                <div className="relative">
                                    <input
                                        ref={barcodeInputRef}
                                        type="text"
                                        name="barcode_input"
                                        value={barcode}
                                        onChange={handleBarcodeChange}
                                        placeholder="Scan / Search..."
                                        className="w-full px-4 py-3 rounded-lg bg-black/50 text-white placeholder-gray-500 border border-amber-400/30 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm md:text-base input-no-zoom"
                                        onFocus={() => (barcode.length > 1 || selectedColor || selectedSize) && setShowSuggestions(true)}
                                    />
                                    {barcode && (
                                        <button
                                            type="button"
                                            onClick={() => { setBarcode(''); updateSuggestions('', selectedColor, selectedSize) }}
                                            className="absolute right-3 top-3.5 text-gray-500 hover:text-white"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                            </form>

                            <div className="flex gap-2">
                                <select
                                    value={selectedColor}
                                    onChange={handleColorChange}
                                    className="flex-1 md:flex-none px-3 py-3 rounded-lg bg-black/50 text-white border border-amber-400/30 focus:outline-none focus:ring-2 focus:ring-amber-500 min-w-[100px] text-sm md:text-base"
                                >
                                    <option value="">Color</option>
                                    {uniqueColors.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>

                                <select
                                    value={selectedSize}
                                    onChange={handleSizeChange}
                                    className="flex-1 md:flex-none px-3 py-3 rounded-lg bg-black/50 text-white border border-amber-400/30 focus:outline-none focus:ring-2 focus:ring-amber-500 min-w-[80px] text-sm md:text-base"
                                >
                                    <option value="">Size</option>
                                    {uniqueSizes.map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="relative mt-2">
                            {showSuggestions && suggestions.length > 0 && (
                                <div className="absolute top-0 left-0 right-0 bg-gray-900 border border-amber-500/50 rounded-xl shadow-2xl z-[100] max-h-60 md:max-h-80 overflow-y-auto ring-1 ring-amber-500/20">
                                    <div className="p-2 border-b border-white/5 bg-black/20 flex justify-between items-center sticky top-0 bg-gray-900 z-10">
                                        <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Suggestions ({suggestions.length})</span>
                                        <button onClick={() => setShowSuggestions(false)} className="text-gray-500 hover:text-white text-xs">Close</button>
                                    </div>
                                    {suggestions.map((s) => (
                                        <div
                                            key={s.id}
                                            onClick={() => selectSuggestion(s)}
                                            className={`p-3 hover:bg-amber-500/20 cursor-pointer border-b border-white/10 last:border-0 flex justify-between items-center ${s.is_empty_product ? 'opacity-70' : ''}`}
                                        >
                                            <div>
                                                <div className="text-white font-bold text-sm md:text-base">
                                                    {s.product_name}
                                                    {s.is_empty_product && <span className="ml-2 text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded italic">NO VARIANTS</span>}
                                                </div>
                                                <div className="text-xs text-gray-400">
                                                    {s.is_empty_product ? (
                                                        <span className="text-red-400 font-semibold italic">Needs Variants/Sizes</span>
                                                    ) : (
                                                        <>{s.size} / <span className="text-amber-300 font-semibold">{s.color}</span> • {s.barcode}</>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                {!s.is_empty_product && (
                                                    <>
                                                        <div className="text-amber-400 font-bold text-sm md:text-base">₹{parseFloat(s.price_retail).toFixed(0)}</div>
                                                        <div className={`text-[10px] font-bold ${s.stock_quantity > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                            {s.stock_quantity > 0 ? `${s.stock_quantity} left` : 'Out of Stock'}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Cart Section */}
                    <div className="bg-black/50 backdrop-blur-md rounded-xl md:rounded-2xl p-4 md:p-6 border border-amber-400/30 shadow-2xl relative z-10">
                        <h2 className="text-xl md:text-2xl font-bold text-white mb-4">🛒 Shopping Cart</h2>
                        {cart.length === 0 ? (
                            <p className="text-gray-400 text-center py-8 text-sm md:text-base">Cart is empty. Scan a product to start.</p>
                        ) : (
                            <div className="space-y-3">
                                {cart.map((item) => (
                                    <div key={item.variant.id} className="bg-white/5 rounded-lg p-3 md:p-4 flex items-center justify-between border border-amber-400/10">
                                        <div className="flex-1 pr-2">
                                            <h3 className="text-white font-semibold text-sm md:text-base line-clamp-1">{item.variant.product_name}</h3>
                                            <p className="text-gray-300 text-xs md:text-sm">
                                                {item.variant.size} / {item.variant.color} • ₹{parseFloat(item.variant.price_retail).toFixed(0)}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 md:gap-3">
                                            <button
                                                onClick={() => updateQuantity(item.variant.id, item.quantity - 1)}
                                                className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-gray-700 hover:bg-gray-600 active:bg-gray-500 text-white font-bold text-sm md:text-base"
                                            >
                                                -
                                            </button>
                                            <span className="text-white font-bold w-6 text-center text-sm md:text-base">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.variant.id, item.quantity + 1)}
                                                className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-amber-600 hover:bg-amber-500 active:bg-amber-400 text-white font-bold text-sm md:text-base"
                                            >
                                                +
                                            </button>
                                            <span className="text-amber-400 font-bold ml-1 min-w-[60px] text-right text-sm md:text-base">
                                                ₹{(item.variant.price_retail * item.quantity).toFixed(0)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Checkout Column */}
                <div className="space-y-4 md:space-y-6">
                    <div className="bg-gradient-to-br from-amber-500 via-amber-400 to-amber-300 rounded-xl md:rounded-2xl p-4 md:p-6 shadow-2xl sticky top-6">
                        <div className="flex flex-col items-center mb-4 md:mb-6 pb-4 md:pb-6 border-b border-black/10">
                            <h2 className="text-lg md:text-xl font-bold text-black font-serif tracking-wider uppercase">ABHA CREATIONS</h2>
                            <p className="text-[10px] text-black/70 font-sans tracking-widest uppercase font-bold text-center">POS Terminal</p>
                        </div>

                        <div className="flex justify-between items-center mb-4 md:mb-6">
                            <h2 className="text-xl md:text-2xl font-bold text-black">💰 Checkout</h2>
                        </div>

                        <div className="space-y-3 md:space-y-4">
                            <div>
                                <label className="block text-black font-semibold mb-1 md:mb-2 text-sm md:text-base">Customer Name</label>
                                <input
                                    type="text"
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    placeholder="Optional"
                                    className="w-full px-4 py-2 rounded-lg bg-black/10 text-black placeholder-black/50 border border-black/20 focus:outline-none focus:ring-2 focus:ring-black/30 text-sm md:text-base input-no-zoom"
                                />
                            </div>

                            <div>
                                <label className="block text-black font-semibold mb-1 md:mb-2 text-sm md:text-base">Payment Mode</label>
                                <select
                                    value={paymentMode}
                                    onChange={(e) => setPaymentMode(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg bg-black/10 text-black border border-black/20 focus:outline-none focus:ring-2 focus:ring-black/30 text-sm md:text-base"
                                >
                                    <option value="CASH">💵 Cash</option>
                                    <option value="CARD">💳 Card</option>
                                    <option value="UPI">📱 UPI</option>
                                </select>
                            </div>

                            <div className="border-t border-black/20 pt-4 mt-4">
                                <div className="flex justify-between text-black text-lg md:text-xl font-bold">
                                    <span>Total Amount:</span>
                                    <span>₹{calculateTotal().toFixed(2)}</span>
                                </div>
                            </div>

                            <button
                                onClick={handleCheckout}
                                disabled={cart.length === 0}
                                className="w-full py-3 md:py-4 bg-black text-amber-500 font-bold rounded-lg hover:bg-gray-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg text-base md:text-lg uppercase tracking-wider active:scale-95"
                            >
                                🧾 Complete Sale
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom: Recent Sales List */}
            <div className="bg-black/50 backdrop-blur-md rounded-xl md:rounded-2xl p-4 md:p-6 border border-amber-400/30 shadow-2xl">
                <h2 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6">🕒 Today's Sales</h2>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-3">
                    {!recentSales || recentSales.length === 0 ? (
                        <div className="text-center py-6 text-gray-400 text-sm">No sales yet today.</div>
                    ) : (
                        recentSales.map(sale => (
                            <div key={sale.id} className="bg-white/5 rounded-lg p-3 border border-white/10 flex justify-between items-center">
                                <div>
                                    <div className="text-amber-500 font-mono font-bold text-sm">{sale.invoice_number}</div>
                                    <div className="text-gray-300 text-xs mt-1">{sale.customer_name || 'Walk-in'} • {sale.items?.length} items</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-green-400 font-bold text-sm">₹{parseFloat(sale.total_amount).toFixed(0)}</div>
                                    <div className="text-gray-500 text-[10px] mt-1">{new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Desktop Table View */}
                <div className="overflow-x-auto hidden md:block">
                    <table className="w-full text-white">
                        <thead>
                            <tr className="border-b border-white/20 text-gray-400 text-sm uppercase">
                                <th className="text-left py-3 px-2">Invoice</th>
                                <th className="text-left py-3 px-2">Customer</th>
                                <th className="text-left py-3 px-2">Items</th>
                                <th className="text-left py-3 px-2">Payment</th>
                                <th className="text-right py-3 px-2">Amount</th>
                                <th className="text-right py-3 px-2 text-nowrap">Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {!recentSales || recentSales.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-8 text-gray-400">
                                        No sales yet today.
                                    </td>
                                </tr>
                            ) : (
                                recentSales.map((sale) => (
                                    <tr key={sale.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                                        <td className="py-3 px-2 font-mono text-amber-500">{sale.invoice_number}</td>
                                        <td className="py-3 px-2">{sale.customer_name || 'Walk-in'}</td>
                                        <td className="py-3 px-2 text-sm text-gray-300">
                                            {sale.items?.length} items
                                        </td>
                                        <td className="py-3 px-2">
                                            <span className="px-2 py-1 rounded-full bg-white/10 text-[10px] font-semibold uppercase tracking-wider">
                                                {sale.payment_mode}
                                            </span>
                                        </td>
                                        <td className="py-3 px-2 text-right font-bold text-green-400">
                                            ₹{parseFloat(sale.total_amount).toFixed(2)}
                                        </td>
                                        <td className="py-3 px-2 text-right text-gray-400 text-xs">
                                            {new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

