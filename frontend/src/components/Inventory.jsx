import { useState, useEffect, useRef } from 'react'
import { fetchProducts, fetchVariants, createVariant, updateVariant, deleteVariant, createProduct, fetchCategories, createCategory } from '../api'

export default function Inventory() {
    const [variants, setVariants] = useState([])
    const [products, setProducts] = useState([])
    const [categories, setCategories] = useState([])
    const [showAddForm, setShowAddForm] = useState(false)
    const [showProductForm, setShowProductForm] = useState(false)

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [variantToDelete, setVariantToDelete] = useState(null)
    const [editingVariant, setEditingVariant] = useState(null)
    const colorInputRef = useRef(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [showSuggestions, setShowSuggestions] = useState(false)

    const STANDARD_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size']

    // Variant Form Data
    const [formData, setFormData] = useState({
        product: '',
        color: '',
        price_retail: '',
        gst_rate: '5.00',
        // sizeMap will hold { 'M': { stock: 10, barcode: '...' }, ... }
        sizeMap: STANDARD_SIZES.reduce((acc, size) => ({ ...acc, [size]: { stock: '0', barcode: '', enabled: false } }), {})
    })

    // Product Form Data
    const [productFormData, setProductFormData] = useState({
        name: '',
        brand: '',
        category: ''
    })

    useEffect(() => {
        loadData()
        loadCategories()
    }, [])

    const loadCategories = async () => {
        try {
            const res = await fetchCategories()
            setCategories(res.data.results || res.data)
        } catch (error) {
            console.error('Error loading categories:', error)
        }
    }

    const loadData = async () => {
        try {
            const [variantsRes, productsRes] = await Promise.all([
                fetchVariants(),
                fetchProducts()
            ])
            setVariants(variantsRes.data.results || variantsRes.data)
            setProducts(productsRes.data.results || productsRes.data)
        } catch (error) {
            console.error('Error loading data:', error)
        }
    }

    const resetForm = (fullReset = false) => {
        setFormData(prev => ({
            product: fullReset ? '' : prev.product,
            color: '',
            price_retail: fullReset ? '' : prev.price_retail,
            gst_rate: '5.00',
            sizeMap: STANDARD_SIZES.reduce((acc, size) => ({ ...acc, [size]: { stock: '0', barcode: '', enabled: false } }), {})
        }))
        if (fullReset) {
            setEditingVariant(null)
            setShowAddForm(false)
        }
    }

    const handleProductSubmit = async (e) => {
        e.preventDefault()
        try {
            const res = await createProduct(productFormData)
            alert('✅ Product created successfully!')
            await loadData() // Refresh products list

            // Auto-select new product and OPEN the variant form
            setFormData(prev => ({ ...prev, product: res.data.id }))
            setShowProductForm(false)
            setShowAddForm(true) // Immediately prompt to add variants

            setProductFormData({ name: '', brand: '', category: '' })

            // Scroll to the variant form for the user
            setTimeout(() => {
                window.scrollTo({ top: 0, behavior: 'smooth' })
                colorInputRef.current?.focus()
            }, 100)
        } catch (error) {
            console.error(error)
            const errorData = error.response?.data
            const errorMsg = errorData?.error || (errorData?.name ? errorData.name[0] : null) || error.message

            // If product already exists, let's be helpful instead of just erroring
            if (errorMsg.toLowerCase().includes('already exists')) {
                const existingProd = products.find(p =>
                    p.name.toLowerCase() === productFormData.name.toLowerCase().trim()
                )

                if (existingProd) {
                    alert(`ℹ️ "${productFormData.name}" already exists. Selecting it for you so you can add stock/sizes.`)
                    setFormData(prev => ({ ...prev, product: existingProd.id }))
                    setShowProductForm(false)
                    setShowAddForm(true)
                    setProductFormData({ name: '', brand: '', category: '' })
                    return
                }
            }

            alert('Error creating product: ' + errorMsg)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            if (editingVariant) {
                // When editing, we only update a single variant
                // Find the single enabled size or just use the first one if we're in edit mode
                const sizeItem = Object.entries(formData.sizeMap).find(([_, details]) => details.enabled)
                if (!sizeItem) return alert('Please enable at least one size')

                const [size, details] = sizeItem
                await updateVariant(editingVariant.id, {
                    product: formData.product,
                    color: formData.color,
                    size: size,
                    stock_quantity: parseInt(details.stock),
                    barcode: details.barcode,
                    price_retail: formData.price_retail,
                    gst_rate: formData.gst_rate
                })
                alert('✅ Variant updated successfully!')
                resetForm(true)
            } else {
                // Create multiple variants
                const activeSizes = Object.entries(formData.sizeMap).filter(([_, details]) => details.enabled)
                if (activeSizes.length === 0) return alert('Please enable and enter stock for at least one size!')

                const creationPromises = activeSizes.map(([size, details]) => {
                    return createVariant({
                        product: formData.product,
                        color: formData.color,
                        size: size,
                        stock_quantity: parseInt(details.stock),
                        barcode: details.barcode,
                        price_retail: formData.price_retail,
                        gst_rate: formData.gst_rate
                    })
                })

                await Promise.all(creationPromises)

                const successMsg = document.getElementById('success-msg')
                if (successMsg) {
                    successMsg.style.opacity = '1'
                    setTimeout(() => successMsg.style.opacity = '0', 2000)
                }
                resetForm(false)
            }
            loadData()
        } catch (error) {
            alert('Error: ' + (error.response?.data?.error || error.message))
        }
    }

    const handleEdit = (variant) => {
        setEditingVariant(variant)
        setFormData({
            product: variant.product,
            color: variant.color,
            price_retail: variant.price_retail,
            gst_rate: variant.gst_rate || '5.00',
            sizeMap: STANDARD_SIZES.reduce((acc, size) => ({
                ...acc,
                [size]: {
                    stock: size === variant.size ? variant.stock_quantity.toString() : '0',
                    barcode: size === variant.size ? variant.barcode : '',
                    enabled: size === variant.size
                }
            }), {})
        })
        setShowAddForm(true)
    }

    const handleQuickAdd = (variant) => {
        setEditingVariant(null) // Ensure we are in create mode, not edit mode
        setFormData({
            product: variant.product,
            color: variant.color,
            price_retail: variant.price_retail,
            gst_rate: variant.gst_rate || '5.00',
            sizeMap: STANDARD_SIZES.reduce((acc, size) => ({
                ...acc,
                [size]: {
                    stock: '0',
                    barcode: '',
                    enabled: false
                }
            }), {})
        })
        setShowAddForm(true)
        // Scroll to form
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleDelete = (variant) => {
        setVariantToDelete(variant)
        setShowDeleteConfirm(true)
    }

    const confirmDelete = async () => {
        if (!variantToDelete) return

        try {
            await deleteVariant(variantToDelete.id)
            // alert('✅ Variant deleted!')
            loadData()
            setShowDeleteConfirm(false)
            setVariantToDelete(null)
        } catch (error) {
            alert('Error deleting: ' + (error.response?.data?.error || error.message))
        }
    }

    const generateBarcode = (sizeKey) => {
        const randomCode = 'ABHA' + Math.floor(100000 + Math.random() * 900000)
        setFormData(prev => ({
            ...prev,
            sizeMap: {
                ...prev.sizeMap,
                [sizeKey]: { ...prev.sizeMap[sizeKey], barcode: randomCode }
            }
        }))
    }

    const updateSizeDetail = (sizeKey, field, value) => {
        setFormData(prev => ({
            ...prev,
            sizeMap: {
                ...prev.sizeMap,
                [sizeKey]: { ...prev.sizeMap[sizeKey], [field]: value }
            }
        }))
    }

    // Filter variants based on search
    const filteredVariants = variants.filter(v =>
        v.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.size.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.color.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.barcode.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // Get unique product names for suggestions, checking if name includes query (partial match)
    // Using 'products' source ensures we suggest even products that don't have variants yet (Global search)
    const suggestions = products
        .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
        .map(p => p.name)
        .slice(0, 10) // Increased limit to 10 for better visibility

    const handleSearchSelect = (name) => {
        setSearchQuery(name)
        setShowSuggestions(false)
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h1 className="text-3xl font-bold text-white">📦 Inventory Management</h1>

                {/* Search Bar */}
                <div className="relative w-full md:w-96">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder=" Search products, barcode..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value)
                                setShowSuggestions(true)
                            }}
                            onFocus={() => setShowSuggestions(true)}
                            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                            className="w-full px-4 py-3 pl-10 rounded-lg bg-gray-800 text-white border border-gray-600 focus:outline-none focus:border-amber-500 shadow-lg"
                        />
                        <span className="absolute left-3 top-3.5 text-gray-400">🔍</span>
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-3.5 text-gray-400 hover:text-white"
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    {/* Autocomplete Suggestions */}
                    {showSuggestions && searchQuery && suggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden">
                            {suggestions.map((name, index) => (
                                <div
                                    key={index}
                                    onClick={() => handleSearchSelect(name)}
                                    className="px-4 py-2 text-white hover:bg-amber-500/20 cursor-pointer transition-colors border-b border-gray-700 last:border-0"
                                >
                                    {name}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={() => setShowProductForm(true)}
                        className="px-4 py-3 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 active:bg-gray-500 active:scale-95 transition-all border border-gray-600 shadow-lg"
                    >
                        ✨ New Product
                    </button>
                    <button
                        onClick={() => {
                            if (showAddForm) {
                                resetForm(true)
                            } else {
                                setShowAddForm(true)
                            }
                        }}
                        className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-400 text-black font-semibold rounded-lg hover:from-amber-600 hover:to-amber-500 active:from-amber-400 active:to-amber-300 active:scale-95 transition-all shadow-xl"
                    >
                        {showAddForm ? '❌ Close Form' : '➕ Bulk Add Sizes'}
                    </button>
                </div>
            </div>

            {/* Create Product Modal */}
            {showProductForm && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-gray-900 rounded-2xl p-8 border border-amber-400/30 shadow-2xl w-full max-w-md">
                        <h2 className="text-2xl font-bold text-white mb-6">✨ Create New Product</h2>
                        <form onSubmit={handleProductSubmit} className="space-y-4">
                            <div>
                                <label className="block text-white mb-2">Product Name</label>
                                <input
                                    required
                                    type="text"
                                    value={productFormData.name}
                                    onChange={e => setProductFormData({ ...productFormData, name: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg bg-black/50 text-white border border-amber-400/30"
                                    placeholder="e.g. Fancy Silk Saree"
                                />
                            </div>
                            <div>
                                <label className="block text-white mb-2">Category</label>
                                <div className="flex gap-2">
                                    <select
                                        value={productFormData.category}
                                        required
                                        onChange={e => setProductFormData({ ...productFormData, category: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg bg-black/50 text-white border border-amber-400/30"
                                    >
                                        <option value="">Select Category</option>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            const newCat = prompt('Enter new category name (e.g. Sarees, Kurtis):')
                                            if (newCat) {
                                                try {
                                                    await createCategory({ name: newCat })
                                                    alert('✅ Category Created!')
                                                    loadCategories()
                                                } catch (err) {
                                                    alert('Error creating category')
                                                }
                                            }
                                        }}
                                        className="px-3 py-2 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30 hover:bg-amber-500 hover:text-black transition-all"
                                        title="Create New Category"
                                    >
                                        ➕
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-white mb-2">Brand (Optional)</label>
                                <input
                                    type="text"
                                    value={productFormData.brand}
                                    onChange={e => setProductFormData({ ...productFormData, brand: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg bg-black/50 text-white border border-amber-400/30"
                                    placeholder="e.g. ABHA"
                                />
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button
                                    type="submit"
                                    className="flex-1 py-2 bg-amber-500 text-black font-bold rounded-lg hover:bg-amber-600 active:bg-amber-400 active:scale-95 transition-all"
                                >
                                    Create Product
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowProductForm(false)}
                                    className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 active:bg-gray-500 active:scale-95 transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && variantToDelete && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-gray-900 rounded-2xl p-8 border border-red-500/30 shadow-2xl w-full max-w-md text-center">
                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">🗑️</span>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Delete Item?</h2>
                        <p className="text-gray-400 mb-6">
                            Are you sure you want to delete <br />
                            <span className="text-amber-400 font-bold">{variantToDelete.product_name}</span>
                            <span className="block text-sm mt-1">
                                Size: <strong className="text-white">{variantToDelete.size}</strong> |
                                Color: <strong className="text-white">{variantToDelete.color}</strong>
                            </span>
                        </p>
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={confirmDelete}
                                className="px-6 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 active:bg-red-500 active:scale-95 transition-all shadow-lg"
                            >
                                Yes, Delete
                            </button>
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="px-6 py-2 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 active:bg-gray-500 active:scale-95 transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk Add/Edit Variant Form */}
            {showAddForm && (
                <div className="bg-black/50 backdrop-blur-md rounded-2xl p-6 border border-amber-400/30 shadow-2xl relative">
                    <div id="success-msg" className="absolute top-4 right-4 bg-green-500 text-black px-4 py-2 rounded-lg font-bold opacity-0 transition-opacity pointer-events-none z-10">
                        ✅ Success! Saved all variants.
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-4">
                        {editingVariant ? '✏️ Edit Variant' : '➕ Bulk Add Size Matrix'}
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-white mb-2">Product</label>
                                <select
                                    required
                                    value={formData.product}
                                    onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg bg-black/50 text-white border border-amber-400/30 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                >
                                    <option value="">Select Product</option>
                                    {Object.values(
                                        products.reduce((acc, p) => {
                                            if (!acc[p.name.toLowerCase()]) {
                                                acc[p.name.toLowerCase()] = p; // Keep the first occurrence
                                            }
                                            return acc;
                                        }, {})
                                    ).map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-white mb-2">Color</label>
                                <select
                                    ref={colorInputRef}
                                    required
                                    value={formData.color}
                                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg bg-black/50 text-white border border-amber-400/30 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                >
                                    <option value="">Select Color</option>
                                    {['Red', 'Blue', 'Green', 'Black', 'White', 'Yellow', 'Maroon', 'Navy', 'Grey', 'Pink', 'Gold', 'Silver', 'Beige', 'Orange'].map(color => (
                                        <option key={color} value={color}>{color}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-white mb-2">Price (₹)</label>
                                <input
                                    required
                                    type="number"
                                    step="0.01"
                                    value={formData.price_retail}
                                    onChange={(e) => setFormData({ ...formData, price_retail: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg bg-black/50 text-white border border-amber-400/30 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                />
                            </div>

                            <div>
                                <label className="block text-white mb-2">GST Rate (%)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.gst_rate}
                                    onChange={(e) => setFormData({ ...formData, gst_rate: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg bg-black/50 text-white border border-amber-400/30 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                />
                            </div>
                        </div>

                        {/* Size Matrix */}
                        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                            <h3 className="text-lg font-semibold text-amber-400 mb-4 flex items-center gap-2">
                                📏 Size Matrix
                                <span className="text-xs font-normal text-gray-400">(Enable sizes and enter stock)</span>
                            </h3>
                            <div className="space-y-2">
                                {STANDARD_SIZES.map(size => (
                                    <div key={size} className={`grid grid-cols-12 gap-3 items-center p-2 rounded-lg transition-colors ${formData.sizeMap[size].enabled ? 'bg-amber-500/10' : 'hover:bg-white/5'}`}>
                                        <div className="col-span-2 flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={formData.sizeMap[size].enabled}
                                                onChange={(e) => updateSizeDetail(size, 'enabled', e.target.checked)}
                                                className="w-5 h-5 accent-amber-500 cursor-pointer"
                                            />
                                            <span className="text-white font-bold">{size}</span>
                                        </div>

                                        <div className="col-span-3">
                                            <input
                                                disabled={!formData.sizeMap[size].enabled}
                                                type="number"
                                                placeholder="Qty"
                                                value={formData.sizeMap[size].stock}
                                                onChange={(e) => updateSizeDetail(size, 'stock', e.target.value)}
                                                className="w-full px-3 py-1 rounded-md bg-black/50 text-white border border-white/20 disabled:opacity-30 disabled:cursor-not-allowed text-sm focus:border-amber-500"
                                            />
                                        </div>

                                        <div className="col-span-5 flex gap-2">
                                            <input
                                                disabled={!formData.sizeMap[size].enabled}
                                                type="text"
                                                placeholder="Barcode (Optional)"
                                                value={formData.sizeMap[size].barcode}
                                                onChange={(e) => updateSizeDetail(size, 'barcode', e.target.value)}
                                                className="flex-1 px-3 py-1 rounded-md bg-black/50 text-white border border-white/20 disabled:opacity-30 disabled:cursor-not-allowed text-sm font-mono placeholder-gray-600 focus:border-amber-500"
                                            />
                                            <button
                                                type="button"
                                                disabled={!formData.sizeMap[size].enabled}
                                                onClick={() => generateBarcode(size)}
                                                className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs rounded border border-amber-500/40 hover:bg-amber-500/30 disabled:opacity-0 transition-all"
                                            >
                                                🎲
                                            </button>
                                        </div>

                                        {formData.sizeMap[size].enabled && formData.sizeMap[size].stock > 0 && (
                                            <div className="col-span-2 text-right">
                                                <span className="text-green-400 text-xs font-bold px-2 py-1 bg-green-500/10 rounded">READY</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => resetForm(true)}
                                className="px-6 py-2 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 active:bg-gray-500 active:scale-95 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-10 py-2 bg-gradient-to-r from-amber-500 to-amber-400 text-black font-bold rounded-lg hover:from-amber-600 hover:to-amber-500 active:from-amber-400 active:to-amber-300 active:scale-95 transition-all shadow-xl"
                            >
                                {editingVariant ? '💾 Update Variant' : '🚀 Save All Variants'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Inventory Table */}
            <div className="bg-black/50 backdrop-blur-md rounded-2xl p-6 border border-amber-400/30 shadow-2xl overflow-x-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white">📦 Current Stock Inventory</h2>
                    <div className="text-gray-400 text-sm">
                        Showing <span className="text-amber-400 font-bold">{filteredVariants.length}</span> items
                    </div>
                </div>
                <table className="w-full text-white">
                    <thead>
                        <tr className="border-b border-white/20 text-amber-400/80">
                            <th className="text-left py-3 px-2">Product Name</th>
                            <th className="text-left py-3 px-2">Size</th>
                            <th className="text-left py-3 px-2">Color</th>
                            <th className="text-left py-3 px-2">Barcode</th>
                            <th className="text-left py-3 px-2">Date Added</th>
                            <th className="text-right py-3 px-2">Price</th>
                            <th className="text-right py-3 px-2">Current Stock</th>
                            <th className="text-center py-3 px-2">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filteredVariants.length === 0 ? (
                            <tr>
                                <td colSpan="8" className="text-center py-20">
                                    <div className="flex flex-col items-center gap-3">
                                        <span className="text-4xl">🔍</span>
                                        <p className="text-gray-400">No items found matching "{searchQuery}"</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredVariants.map((variant) => (
                                <tr
                                    key={variant.id}
                                    onClick={() => handleQuickAdd(variant)}
                                    className={`transition-all duration-300 group cursor-pointer ${formData.product === variant.product && formData.color === variant.color
                                        ? 'bg-amber-500/20 border-l-4 border-amber-500'
                                        : 'hover:bg-white/5 border-l-4 border-transparent'
                                        }`}
                                    title="Click to add more sizes for this item"
                                >
                                    <td className="py-4 px-2 font-medium">{variant.product_name}</td>
                                    <td className="py-4 px-2">
                                        <span className="bg-white/10 px-2 py-1 rounded text-xs font-bold">{variant.size}</span>
                                    </td>
                                    <td className="py-4 px-2">{variant.color}</td>
                                    <td className="py-4 px-2">
                                        <code className="bg-black/40 px-2 py-1 rounded text-amber-200 text-xs">{variant.barcode}</code>
                                    </td>
                                    <td className="py-4 px-2 text-gray-400 text-sm">
                                        {variant.created_at ? new Date(variant.created_at).toLocaleString('en-IN', {
                                            day: '2-digit', month: 'short', year: 'numeric',
                                            hour: '2-digit', minute: '2-digit', hour12: true
                                        }) : '-'}
                                    </td>
                                    <td className="py-4 px-2 text-right font-mono">₹{parseFloat(variant.price_retail).toFixed(2)}</td>
                                    <td className="py-4 px-2 text-right">
                                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${variant.stock_quantity <= 0 ? 'bg-red-500/20 text-red-500 border border-red-500/30' :
                                            variant.stock_quantity < 5 ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                                                'bg-green-500/20 text-green-400 border border-green-500/30'
                                            }`}>
                                            {variant.stock_quantity}
                                        </span>
                                    </td>
                                    <td className="py-4 px-2 text-center" onClick={e => e.stopPropagation()}>
                                        <div className="flex justify-center gap-2">
                                            <button
                                                onClick={() => handleQuickAdd(variant)}
                                                className="p-2 bg-amber-600/20 text-amber-400 hover:bg-amber-600 hover:text-white active:bg-amber-400 active:text-black active:scale-95 rounded-lg transition-all shadow-sm"
                                                title="Add More Sizes"
                                            >
                                                ➕
                                            </button>
                                            <button
                                                onClick={() => handleEdit(variant)}
                                                className="p-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white active:bg-blue-400 active:text-white active:scale-95 rounded-lg transition-all shadow-sm"
                                                title="Edit"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                onClick={() => handleDelete(variant)}
                                                className="p-2 bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white active:bg-red-500 active:text-white active:scale-95 rounded-lg transition-all shadow-sm"
                                                title="Delete"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
