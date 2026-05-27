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
  originalPrice: number
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

export const statusOrdersVN: Record<string, string> = {
  [statusOrders.UNPAID]: 'Chưa thanh toán',
  [statusOrders.PAID]: 'Đã thanh toán',
  [statusOrders.PROCESSING]: 'Đang xử lý',
  [statusOrders.PENDING]: 'Chờ xử lý',
  [statusOrders.COMPLETED]: 'Hoàn thành',
  [statusOrders.CANCELLED]: 'Đã hủy',
  [statusOrders.SHIPPED]: 'Đã gửi',
  [statusOrders.DELIVERED]: 'Đã giao',
  [statusOrders.RETURNED]: 'Trả lại',
  [statusOrders.FAILED]: 'Thất bại',
}

export type statusOrders = (typeof statusOrders)[keyof typeof statusOrders]
export interface Order {
  _id: string
  items: OrderItem[]
  totalAmount: number
  profit: number
  status: statusOrders
  name: string
  phone: string
  address: string
  createdAt: string
  updatedAt: string
}

export interface Customer {
  _id: string
  name: string
  phone: string
  address: string
  createdAt: string
  updatedAt: string
}

export interface OrderNoteProduct {
  name: string
  quantity: number
}

export interface OrderNote {
  _id: string
  orderCode: string
  products: OrderNoteProduct[]
  note: string
  createdAt: string
  updatedAt: string
}
