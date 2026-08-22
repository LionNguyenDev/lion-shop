import mongoose, { type Document, type Model, Schema } from 'mongoose'
import { statusOrders, TRASH_RETENTION_DAYS, WAREHOUSES } from '@/lib/types'
export interface IOrderItem {
  product: mongoose.Types.ObjectId
  name: string
  quantity: number
  price: number
  originalPrice: number
  warehouse?: keyof typeof WAREHOUSES
}

export interface IOrder extends Document {
  items: IOrderItem[]
  totalAmount: number
  profit: number
  status: statusOrders
  warehouse: keyof typeof WAREHOUSES
  name: string
  phone: string
  address: string
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
  restoredAt: Date | null
}

const OrderItemSchema: Schema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 },
  originalPrice: { type: Number, required: true, min: 0 },
  warehouse: { type: String, enum: Object.keys(WAREHOUSES) },
})

const OrderSchema: Schema = new Schema(
  {
    items: [OrderItemSchema],
    totalAmount: { type: Number, required: true, min: 0 },
    profit: { type: Number, required: true, default: 0 },
    name: { type: String, default: '' }, // tên khách (tuỳ chọn)
    address: { type: String, default: '' }, // địa chỉ khách (tuỳ chọn)
    phone: { type: String, default: '' }, // SĐT khách (tuỳ chọn)
    warehouse: {
      type: String,
      enum: Object.keys(WAREHOUSES),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(statusOrders),
      default: statusOrders.UNPAID,
    },
    // Thùng rác: null = đơn đang hoạt động, Date = thời điểm bị xóa mềm
    deletedAt: { type: Date, default: null },
    // Lần gần nhất đơn được khôi phục từ thùng rác (để đánh dấu trong danh sách)
    restoredAt: { type: Date, default: null },
  },
  { timestamps: true },
)

// Mọi truy vấn đơn hàng đều lọc theo deletedAt trước → đặt nó lên đầu index
OrderSchema.index({ deletedAt: 1, createdAt: -1 })
OrderSchema.index({ deletedAt: 1, status: 1, createdAt: -1 })

// TTL: MongoDB tự xóa vĩnh viễn đơn trong thùng rác sau TRASH_RETENTION_DAYS ngày.
// partialFilterExpression giữ index chỉ gồm các đơn đã xóa (deletedAt là Date),
// nên đơn đang hoạt động (deletedAt: null) không bao giờ bị TTL đụng tới.
OrderSchema.index(
  { deletedAt: 1 },
  {
    expireAfterSeconds: TRASH_RETENTION_DAYS * 24 * 60 * 60,
    partialFilterExpression: { deletedAt: { $type: 'date' } },
    name: 'deletedAt_ttl',
  },
)

// Xóa model đã cache để thay đổi schema (deletedAt) có hiệu lực mà không phải
// restart dev server — nếu không, mongoose strict mode sẽ âm thầm bỏ qua deletedAt.
if (mongoose.models.Order) {
  mongoose.deleteModel('Order')
}
const Order: Model<IOrder> = mongoose.model<IOrder>('Order', OrderSchema)

export default Order
