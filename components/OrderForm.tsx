'use client';

import { useState, useEffect, useCallback } from 'react';
import { ShoppingCart, Plus, Trash2 } from 'lucide-react';
import { Product } from '@/lib/types';

interface OrderFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function OrderForm({ onSuccess, onCancel }: OrderFormProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedItems, setSelectedItems] = useState<{ product: string; quantity: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;

    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/products');
        const data = await res.json();
        if (!ignore) setProducts(data);
      } catch (err) {
        if (!ignore) setError('Failed to load products');
      }
    };

    fetchProducts();

    return () => {
      ignore = true;
    };
  }, []);
  const addItem = () => {
    setSelectedItems(prev => [...prev, { product: '', quantity: 1 }]);
  };

  const removeItem = (index: number) => {
    setSelectedItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: 'product' | 'quantity', value: string | number) => {
    setSelectedItems(prev => {
      const newItems = [...prev];
      newItems[index] = { ...newItems[index], [field]: value };
      return newItems;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItems.length === 0) {
      setError('Add at least one item');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: selectedItems }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create order');
      }

      onSuccess?.();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow-sm border border-slate-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <ShoppingCart className="w-5 h-5" />
          Create New Order
        </h2>
        <button
          type="button"
          onClick={addItem}
          className="text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded-md hover:bg-blue-100 transition-colors flex items-center gap-1"
        >
          <Plus className="w-4 h-4" /> Add Item
        </button>
      </div>

      {error && <div className="p-3 bg-red-100 text-red-600 rounded-md text-sm">{error}</div>}

      <div className="space-y-3">
        {selectedItems.map((item, index) => (
          <div key={index} className="flex gap-3 items-end p-3 bg-slate-50 rounded-md border border-slate-200">
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-500 mb-1">Product</label>
              <select
                required
                className="w-full p-2 border border-slate-300 rounded-md bg-white outline-none"
                value={item.product}
                onChange={(e) => updateItem(index, 'product', e.target.value)}
              >
                <option value="">Select Product</option>
                {products.map((p) => (
                  <option key={p._id} value={p._id} disabled={p.stock <= 0}>
                    {p.name} (${p.price}) - {p.stock} in stock
                  </option>
                ))}
              </select>
            </div>
            <div className="w-24">
              <label className="block text-xs font-medium text-slate-500 mb-1">Qty</label>
              <input
                type="number"
                required
                min="1"
                className="w-full p-2 border border-slate-300 rounded-md outline-none"
                value={item.quantity}
                onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value))}
              />
            </div>
            <button
              type="button"
              onClick={() => removeItem(index)}
              className="p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        ))}
        {selectedItems.length === 0 && (
          <div className="text-center py-8 text-slate-400 border-2 border-dashed border-slate-200 rounded-lg">
            No items added yet. Click Add Item to start.
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-4 border-t border-slate-100">
        <button
          type="submit"
          disabled={loading || selectedItems.length === 0}
          className="flex-1 bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Place Order'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
