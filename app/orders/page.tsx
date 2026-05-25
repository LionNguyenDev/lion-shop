'use client';

import { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import OrderList from '@/components/OrderList';
import OrderForm from '@/components/OrderForm';
import { Plus } from 'lucide-react';
import { Order } from '@/lib/types';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/orders');
        const data = await res.json();
        if (!cancelled) setOrders(data);
      } catch (err) {
        console.error('Failed to fetch orders:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Order Management</h1>
            <p className="text-slate-500">View history and create new customer orders</p>
          </div>
          <button
            onClick={() => setIsFormOpen(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" /> New Order
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <OrderList orders={orders} loading={loading} />
          </div>
          <div className="lg:col-span-1">
            {isFormOpen && (
              <OrderForm
                onSuccess={() => {
                  setIsFormOpen(false);
                  fetchOrders();
                }}
                onCancel={() => setIsFormOpen(false)}
              />
            )}
            {!isFormOpen && (
              <div className="bg-green-50 border border-green-200 p-6 rounded-lg text-center">
                <p className="text-green-800 text-sm mb-2">Ready to process a new sale?</p>
                <button
                  onClick={() => setIsFormOpen(true)}
                  className="text-green-600 font-semibold hover:underline text-sm"
                >
                  Create a new order now
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
