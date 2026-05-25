'use client';

interface Order {
  _id: string;
  items: { name: string; quantity: number; price: number }[];
  totalAmount: number;
  status: string;
  createdAt: string;
}

interface OrderListProps {
  orders: Order[];
  loading: boolean;
}

export default function OrderList({ orders, loading }: OrderListProps) {
  if (loading) return <div className="text-center py-10 text-slate-500">Loading orders...</div>;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
      <table className="w-full text-left">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="px-6 py-3 text-sm font-semibold text-slate-700">Order ID</th>
            <th className="px-6 py-3 text-sm font-semibold text-slate-700">Items</th>
            <th className="px-6 py-3 text-sm font-semibold text-slate-700 text-right">Total Amount</th>
            <th className="px-6 py-3 text-sm font-semibold text-slate-700 text-right">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {orders.map((order) => (
            <tr key={order._id} className="hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4">
                <div className="font-mono text-sm text-slate-600">#{order._id.slice(-8).toUpperCase()}</div>
                <div className="mt-1">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-green-100 text-green-700">
                    {order.status}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="space-y-1">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="text-sm text-slate-600">
                      <span className="font-medium text-slate-800">{item.quantity}x</span> {item.name}
                    </div>
                  ))}
                </div>
              </td>
              <td className="px-6 py-4 text-right font-bold text-slate-900">${order.totalAmount.toFixed(2)}</td>
              <td className="px-6 py-4 text-right text-sm text-slate-500">
                {new Date(order.createdAt).toLocaleDateString()}
                <br />
                {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </td>
            </tr>
          ))}
          {orders.length === 0 && (
            <tr>
              <td colSpan={4} className="px-6 py-10 text-center text-slate-400">
                No orders found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
