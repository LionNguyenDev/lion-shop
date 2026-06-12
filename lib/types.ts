export const WAREHOUSES = {
  QB: 'Quảng Bình',
  HN: 'Hà Nội',
  SG: 'Sài Gòn',
} as const

export type Warehouse = keyof typeof WAREHOUSES

export interface Product {
  _id: string
  name: string
  brand: string
  type: string
  originalPrice: number
  sellingPrice: number
  image: string
  stockHN: number
  stockQB: number
  stockSG: number
  stock: number  // tổng = stockHN + stockQB + stockSG (tính bởi service)
  createdAt: string
  updatedAt: string
}

export interface OrderItem {
  product: string
  name: string
  quantity: number
  price: number
  originalPrice: number
  warehouse?: Warehouse
}

export const statusOrders = {
  UNPAID: 'Unpaid',
  PAID: 'Paid',
} as const

export const statusOrdersVN: Record<string, string> = {
  [statusOrders.UNPAID]: 'Chưa thanh toán',
  [statusOrders.PAID]: 'Đã thanh toán',
}

export type statusOrders = (typeof statusOrders)[keyof typeof statusOrders]
export interface Order {
  _id: string
  items: OrderItem[]
  totalAmount: number
  profit: number
  status: statusOrders
  warehouse: Warehouse
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
  address?: string
  orderCount: number
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
