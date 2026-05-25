export interface Product {
  _id: string
  name: string
  originalPrice: number
  sellingPrice: number
  image: string
  stock: number
  createdAt: string
  updatedAt: string
}

export interface OrderItem {
  product: string
  name: string
  quantity: number
  price: number
}

export const statusOrders = {
  UNPAID: 'Unpaid',
  PAID: 'Paid',
  PROCESSING: 'Processing',
  PENDING: 'Pending',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  RETURNED: 'Returned',
  FAILED: 'Failed',
} as const

export type statusOrders = (typeof statusOrders)[keyof typeof statusOrders]
export interface Order {
  _id: string
  items: OrderItem[]
  totalAmount: number
  status: statusOrders
  name: string
  phone: string
  address: string
  createdAt: string
  updatedAt: string
}
