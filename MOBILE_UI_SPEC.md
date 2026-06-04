# Warehouse Admin — Mobile UI Specification (Swift)

> Tài liệu này mô tả đầy đủ giao diện và tính năng của web admin để implement trên Swift (iOS/macOS).

---

## Mục lục

1. [Kiến trúc tổng quan](#1-kiến-trúc-tổng-quan)
2. [Data models](#2-data-models)
3. [API endpoints](#3-api-endpoints)
4. [Màn hình: Đăng nhập / Đăng ký](#4-màn-hình-đăng-nhập--đăng-ký)
5. [Màn hình: Dashboard](#5-màn-hình-dashboard)
6. [Màn hình: Đơn hàng](#6-màn-hình-đơn-hàng)
7. [Màn hình: Sản phẩm](#7-màn-hình-sản-phẩm)
8. [Màn hình: Khách hàng](#8-màn-hình-khách-hàng)
9. [Màn hình: Ghi chú đơn hàng](#9-màn-hình-ghi-chú-đơn-hàng)
10. [UI patterns chung](#10-ui-patterns-chung)
11. [Navigation flow](#11-navigation-flow)

---

## 1. Kiến trúc tổng quan

```
App
├── Auth flow (unauthenticated)
│   ├── Đăng nhập
│   └── Đăng ký
└── Main tab bar (authenticated)
    ├── Tab 1: Dashboard
    ├── Tab 2: Đơn hàng
    ├── Tab 3: Sản phẩm
    ├── Tab 4: Khách hàng
    └── Tab 5: Ghi chú
```

**Session:** JWT token lưu trong secure storage (Keychain). Mọi request gửi kèm cookie hoặc Bearer token.

---

## 2. Data models

### User
```swift
struct User {
    let id: String
    let name: String
    let username: String
    let role: String       // "admin" | "user"
    let createdAt: Date
}
```

### Product
```swift
struct Product {
    let id: String
    let name: String
    let brand: String?
    let type: String       // "Skincare" | "Nước hoa" | "Son" | "Make up"
    let originalPrice: Double    // giá nhập (giá gốc)
    let sellingPrice: Double     // giá bán
    let stockHN: Int       // tồn kho Hà Nội
    let stockQB: Int       // tồn kho Quảng Bình
    let stockSG: Int       // tồn kho Sài Gòn
    let image: String?     // URL ảnh
    let createdAt: Date
    // computed
    var totalStock: Int { stockHN + stockQB + stockSG }
}
```

### Order
```swift
struct Order {
    let id: String
    let items: [OrderItem]
    let totalAmount: Double
    let profit: Double
    let status: OrderStatus   // .unpaid | .paid
    let warehouse: Warehouse  // .HN | .QB | .SG
    let name: String?         // tên khách
    let phone: String?        // SĐT khách
    let address: String?      // địa chỉ khách
    let createdAt: Date
}

struct OrderItem {
    let productId: String
    let name: String
    let quantity: Int
    let price: Double          // giá bán
    let originalPrice: Double  // giá nhập
    let warehouse: Warehouse
}

enum OrderStatus: String {
    case unpaid = "Unpaid"
    case paid = "Paid"
}

enum Warehouse: String {
    case HN, QB, SG
    var displayName: String {
        switch self {
        case .HN: return "Hà Nội"
        case .QB: return "Quảng Bình"
        case .SG: return "Sài Gòn"
        }
    }
}
```

### Customer
```swift
struct Customer {
    let id: String
    let name: String
    let phone: String     // unique
    let address: String?
    let orderCount: Int   // số đơn hàng đã tạo
    let createdAt: Date
}
```

### OrderNote
```swift
struct OrderNote {
    let id: String
    let orderCode: String                  // mã đơn tham chiếu
    let products: [OrderNoteProduct]       // danh sách sp
    let note: String                       // ghi chú / theo dõi
    let createdAt: Date
}

struct OrderNoteProduct {
    let name: String
    let quantity: Int
}
```

### Stats (Dashboard)
```swift
struct DashboardStats {
    let totalRevenue: Double        // tổng doanh thu (đơn paid)
    let totalOrders: Int
    let unpaidOrders: Int
    let totalProducts: Int
    let lowStockCount: Int          // sản phẩm < 20 đơn vị
    let outOfStockCount: Int        // sản phẩm = 0
    let inventoryValue: Double      // giá nhập × số lượng
    let orderStatusDistribution: [StatusCount]
}

struct StatusCount {
    let status: OrderStatus
    let count: Int
}
```

---

## 3. API endpoints

**Base URL:** `https://your-backend.com` (cấu hình trong app)

### Authentication
| Method | Path | Body | Mô tả |
|--------|------|------|-------|
| POST | `/api/auth/signin` | `{username, password}` | Đăng nhập → trả về session cookie |
| POST | `/api/auth/signup` | `{name, username, password}` | Đăng ký |
| POST | `/api/auth/signout` | — | Đăng xuất |
| GET | `/api/auth/me` | — | Lấy thông tin user hiện tại |

### Orders
| Method | Path | Query / Body | Mô tả |
|--------|------|------|-------|
| GET | `/api/orders` | — | Danh sách tất cả đơn hàng |
| POST | `/api/orders` | Order object | Tạo đơn hàng mới |
| PATCH | `/api/orders/{id}` | `{status}` | Cập nhật trạng thái |
| DELETE | `/api/orders/{id}` | — | Xóa đơn hàng |

**Body tạo đơn hàng:**
```json
{
  "items": [
    {
      "productId": "...",
      "name": "...",
      "quantity": 2,
      "price": 250000,
      "originalPrice": 180000,
      "warehouse": "HN"
    }
  ],
  "totalAmount": 500000,
  "profit": 140000,
  "status": "Unpaid",
  "warehouse": "HN",
  "name": "Nguyễn Văn A",
  "phone": "0901234567",
  "address": "Hà Nội"
}
```

### Products
| Method | Path | Query / Body | Mô tả |
|--------|------|------|-------|
| GET | `/api/products` | `?page=1&limit=10&search=X&brand=Y` | Danh sách sản phẩm (phân trang) |
| POST | `/api/products` | Product object | Tạo sản phẩm mới |
| GET | `/api/products/{id}` | — | Chi tiết sản phẩm |
| PUT | `/api/products/{id}` | Product object | Cập nhật sản phẩm |
| DELETE | `/api/products/{id}` | — | Xóa sản phẩm |

**Response `GET /api/products`:**
```json
{
  "products": [...],
  "total": 50,
  "totalPages": 5,
  "stats": {
    "total": 50,
    "lowStock": 8,
    "outOfStock": 2,
    "inventoryValue": 45000000
  },
  "brands": ["Brand A", "Brand B"]
}
```

### Customers
| Method | Path | Query / Body | Mô tả |
|--------|------|------|-------|
| GET | `/api/customers` | `?page=1&limit=20&name=X&phone=Y` | Danh sách khách hàng |
| PATCH | `/api/customers/{id}` | `{name, phone, address}` | Cập nhật khách hàng |

### Order Notes
| Method | Path | Body | Mô tả |
|--------|------|------|-------|
| GET | `/api/order-notes` | — | Tất cả ghi chú (sort mới nhất) |
| POST | `/api/order-notes` | Note object | Tạo ghi chú mới |
| PATCH | `/api/order-notes/{id}` | Note object | Cập nhật ghi chú |
| DELETE | `/api/order-notes/{id}` | — | Xóa ghi chú |

### Stats / Dashboard
| Method | Path | Query | Mô tả |
|--------|------|------|-------|
| GET | `/api/stats` | `?range=7d` | Thống kê (range: `today`, `7d`, `30d`, `365d`) |

---

## 4. Màn hình: Đăng nhập / Đăng ký

### Đăng nhập
```
┌─────────────────────────────┐
│                             │
│     [Logo / App Name]       │
│                             │
│  Tên đăng nhập              │
│  ┌─────────────────────┐    │
│  │ username            │    │
│  └─────────────────────┘    │
│                             │
│  Mật khẩu                   │
│  ┌───────────────────[👁]┐   │
│  │ ••••••••            │    │
│  └─────────────────────┘    │
│                             │
│  [       Đăng nhập       ]  │
│                             │
│  Chưa có tài khoản?         │
│  → Đăng ký                  │
└─────────────────────────────┘
```

**Validation:**
- Username: bắt buộc, tối thiểu 3 ký tự
- Password: bắt buộc, tối thiểu 6 ký tự
- Hiện toast error nếu sai thông tin

### Đăng ký
```
┌─────────────────────────────┐
│     Tạo tài khoản           │
│                             │
│  Họ và tên                  │
│  ┌─────────────────────┐    │
│  │ Nguyen Van A        │    │
│  └─────────────────────┘    │
│                             │
│  Tên đăng nhập              │
│  ┌─────────────────────┐    │
│  │ username            │    │
│  └─────────────────────┘    │
│                             │
│  Mật khẩu                   │
│  ┌───────────────────[👁]┐   │
│  │ ••••••••            │    │
│  └─────────────────────┘    │
│                             │
│  [       Đăng ký         ]  │
│                             │
│  Đã có tài khoản? → Đăng nhập│
└─────────────────────────────┘
```

**Sau khi đăng ký thành công:** tự động đăng nhập và vào Dashboard.

---

## 5. Màn hình: Dashboard

### Layout
```
┌─────────────────────────────┐
│  Dashboard        [avatar]  │
│  Xin chào, [tên user]       │
├─────────────────────────────┤
│  [Hôm nay] [7 ngày] [30 ngày] [Năm]  │  ← bộ lọc thời gian
├─────────────────────────────┤
│  KPI Cards (2 cột)          │
│  ┌──────────┐ ┌──────────┐  │
│  │ Doanh thu│ │ Đơn hàng │  │
│  │ 5.2M ₫  │ │ 42 đơn   │  │
│  │          │ │ 8 chưa TT│  │
│  └──────────┘ └──────────┘  │
│  ┌──────────┐ ┌──────────┐  │
│  │ Sản phẩm │ │ Tồn kho  │  │
│  │ 50 sp    │ │ 12 ít tồn│  │
│  │ 3 hết kho│ │ 45M ₫    │  │
│  └──────────┘ └──────────┘  │
├─────────────────────────────┤
│  Đơn hàng gần đây           │
│  [mini table / list 6 đơn]  │
├─────────────────────────────┤
│  Cảnh báo tồn kho thấp      │
│  [list sản phẩm < 20 đơn]   │
└─────────────────────────────┘
```

### KPI Cards (5 thẻ)
| Thẻ | Giá trị chính | Sub-metric |
|-----|--------------|-----------|
| Doanh thu | Tổng tiền đơn Paid | — |
| Đơn hàng | Tổng số đơn | Số đơn chưa TT |
| Sản phẩm | Tổng số sp | Số sp ít tồn (<20) |
| Cảnh báo tồn | Số sp ít tồn (<20) | Số sp hết kho (=0) |
| Giá trị kho | Tổng (giá nhập × số lượng) | — |

### Bảng đơn hàng gần đây (6 đơn mới nhất)
Cột: Mã đơn | Khách hàng | Sản phẩm | Trạng thái | Tổng tiền

### Danh sách tồn kho thấp
Hiển thị sản phẩm có `totalStock < 20`, mỗi item gồm:
- Tên sản phẩm
- Tổng tồn kho (màu đỏ nếu < 10, vàng nếu < 20)
- Badge: HN/QB/SG với số lượng từng kho

---

## 6. Màn hình: Đơn hàng

### Danh sách đơn hàng
```
┌─────────────────────────────┐
│  Đơn hàng      [+ Tạo đơn] │
├─────────────────────────────┤
│  [🔍 Tìm kiếm...]           │
│  [Tất cả ▾] [Từ ngày] [Đến] │
├─────────────────────────────┤
│  Tổng: 42  Chưa TT: 8  Đã TT: 34 │
├─────────────────────────────┤
│  ┌──────────────────────┐   │
│  │ #ABC123              │   │
│  │ Nguyễn Văn A         │   │
│  │ 0901234567           │   │
│  │ [Chưa thanh toán]    │   │
│  │ 2 sp • 500,000 ₫     │   │
│  │ Lợi nhuận: 140,000 ₫ │   │
│  └──────────────────────┘   │
│  ... (tiếp theo)            │
├─────────────────────────────┤
│  [< Trước]  1/5  [Sau >]    │
└─────────────────────────────┘
```

**Bộ lọc:**
- Tìm kiếm: tên khách / SĐT / mã đơn / tên sản phẩm
- Trạng thái: Tất cả / Chưa thanh toán / Đã thanh toán
- Khoảng ngày: từ ngày → đến ngày

**Thao tác trên mỗi đơn (swipe hoặc context menu):**
- Xem chi tiết
- Sửa đơn
- Đánh dấu đã thanh toán / chưa thanh toán
- Xóa đơn

**Multi-select (long press):** chọn nhiều đơn → xóa hàng loạt

### Form tạo / sửa đơn hàng
```
┌─────────────────────────────┐
│  Tạo đơn hàng mới      [✕] │
├─────────────────────────────┤
│  Thông tin khách hàng       │
│  Tên khách: [____________]  │
│             ↓ autocomplete  │
│             Nguyễn Văn A    │
│             Trần Thị B      │
│  SĐT:      [____________]   │
│  Địa chỉ:  [____________]   │
├─────────────────────────────┤
│  Sản phẩm                   │
│  [+ Thêm sản phẩm]          │
│                             │
│  ┌──────────────────────┐   │
│  │ Kem dưỡng ABC        │   │
│  │ SL: [-] 2 [+]        │   │
│  │ Giá: 250,000 ₫       │   │
│  │ Kho: [HN ▾]          │   │
│  │                 [🗑] │   │
│  └──────────────────────┘   │
├─────────────────────────────┤
│  Kho chính: [HN ▾]          │
│  Trạng thái: [Chưa TT ▾]    │
├─────────────────────────────┤
│  Tổng tiền:  500,000 ₫      │
│  Lợi nhuận:  140,000 ₫      │
├─────────────────────────────┤
│  [Hủy]          [Tạo đơn]   │
└─────────────────────────────┘
```

**Logic quan trọng:**
- Khi nhập tên khách: autocomplete từ danh sách khách hàng hiện có
- Khi chọn khách từ autocomplete: tự điền SĐT và địa chỉ
- Mỗi item phải chọn kho (HN/QB/SG)
- Tổng tiền và lợi nhuận tự tính theo: `Σ(giá bán × SL)` và `Σ((giá bán - giá nhập) × SL)`

### Modal chi tiết đơn hàng (read-only)
```
┌─────────────────────────────┐
│  Chi tiết đơn #ABC123   [✕]│
├─────────────────────────────┤
│  Khách: Nguyễn Văn A        │
│  SĐT:   0901234567          │
│  Địa chỉ: Hà Nội            │
│  Ngày tạo: 01/06/2026 10:30 │
│  Kho: Hà Nội                │
│  Trạng thái: [Chưa thanh toán] │
├─────────────────────────────┤
│  Sản phẩm                   │
│  • Kem dưỡng ABC × 2        │
│    250,000 ₫ × 2 = 500,000 ₫ │
│    Kho: Hà Nội              │
├─────────────────────────────┤
│  Tổng tiền:  500,000 ₫      │
│  Lợi nhuận:  140,000 ₫      │
└─────────────────────────────┘
```

---

## 7. Màn hình: Sản phẩm

### Danh sách sản phẩm
```
┌─────────────────────────────┐
│  Sản phẩm      [+ Thêm SP] │
├─────────────────────────────┤
│  [🔍 Tìm theo tên...]       │
│  [🔍 Tìm theo brand...]     │
├─────────────────────────────┤
│  Tổng: 50  Ít tồn: 8  Hết: 2  Kho: 45M₫ │
├─────────────────────────────┤
│  ┌──────────────────────┐   │
│  │ [ảnh] Kem dưỡng ABC  │   │
│  │        Brand XYZ     │   │
│  │        Skincare      │   │
│  │  Nhập: 180,000 ₫     │   │
│  │  Bán:  250,000 ₫     │   │
│  │  HN:5  QB:3  SG:10   │   │
│  │  Tổng: 18 [Ít tồn🟡] │   │
│  └──────────────────────┘   │
│  ... (tiếp theo)            │
├─────────────────────────────┤
│  [< Trước]  1/5  [Sau >]    │
└─────────────────────────────┘
```

**Badge tồn kho:**
- `Còn hàng` (xanh): tổng ≥ 20
- `Ít hàng` (vàng): tổng 1–19
- `Hết hàng` (đỏ): tổng = 0

**Thao tác trên mỗi sản phẩm (swipe hoặc context menu):**
- Sửa
- Xóa (confirmation dialog)

**Multi-select → Tạo đơn hàng nhanh:**
- Long press để chọn sản phẩm
- Thanh action nổi ở dưới: "Tạo đơn với X sản phẩm"
- Mở form tạo đơn với các sản phẩm đã chọn được điền sẵn (SL = 1)

### Form thêm / sửa sản phẩm
```
┌─────────────────────────────┐
│  Thêm sản phẩm          [✕]│
├─────────────────────────────┤
│  Tên sản phẩm *             │
│  [________________________] │
│                             │
│  Thương hiệu                │
│  [________________________] │
│  ↓ datalist suggestions     │
│                             │
│  Loại sản phẩm              │
│  [Skincare          ▾]      │
│  (Skincare / Nước hoa / Son / Make up) │
│                             │
│  Giá nhập *                 │
│  [____________] ₫           │
│                             │
│  Giá bán *                  │
│  [____________] ₫           │
│                             │
│  Tồn kho                    │
│  HN: [___]  QB: [___]  SG: [___] │
│                             │
│  Ảnh sản phẩm               │
│  [📷 Chọn ảnh / Upload]     │
│  [preview ảnh]              │
├─────────────────────────────┤
│  [Hủy]       [Lưu sản phẩm]│
└─────────────────────────────┘
```

---

## 8. Màn hình: Khách hàng

### Danh sách khách hàng
```
┌─────────────────────────────┐
│  Khách hàng    Tổng: 120    │
├─────────────────────────────┤
│  [🔍 Tìm theo tên hoặc SĐT] │
├─────────────────────────────┤
│  ┌──────────────────────┐   │
│  │ Nguyễn Văn A         │   │
│  │ 0901234567           │   │
│  │ Hà Nội               │   │
│  │ 15 đơn hàng          │   │
│  │ Từ: 15/01/2026  [✏️] │   │
│  └──────────────────────┘   │
│  ... (tiếp theo)            │
├─────────────────────────────┤
│  [< Trước]  1/6  [Sau >]    │
└─────────────────────────────┘
```

- Tìm kiếm debounce 300ms
- Sắp xếp: theo số đơn hàng (nhiều nhất trước)
- 20 khách/trang

### Form sửa khách hàng (modal)
```
┌─────────────────────────────┐
│  Sửa thông tin khách    [✕]│
├─────────────────────────────┤
│  Tên khách hàng             │
│  [________________________] │
│                             │
│  Số điện thoại              │
│  [________________________] │
│                             │
│  Địa chỉ                    │
│  [________________________] │
├─────────────────────────────┤
│  [Hủy]           [Lưu]      │
└─────────────────────────────┘
```

---

## 9. Màn hình: Ghi chú đơn hàng

### Danh sách ghi chú (nhóm theo ngày)
```
┌─────────────────────────────┐
│  Ghi chú       [+ Tạo mới] │
├─────────────────────────────┤
│  Tổng: 45  Hôm nay: 3      │
├─────────────────────────────┤
│  [🔍 Tìm mã đơn / sp / ghi chú] │
├─────────────────────────────┤
│  ▼ Hôm nay (3)              │
│  ┌──────────────────────┐   │
│  │ 10:30  Mã: #ABC123   │   │
│  │ Kem ABC ×2, Son XYZ ×1│  │
│  │ Tổng: 3 sp           │   │
│  │ "Khách nhắn giao sớm"│   │
│  └──────────────────────┘   │
│                             │
│  ► Hôm qua (8)              │
│  ► 25/05/2026 (12)          │
└─────────────────────────────┘
```

**Nhóm ngày:**
- "Hôm nay" — ghi chú trong ngày
- "Hôm qua" — ghi chú ngày hôm qua
- Các ngày khác hiển thị theo `dd/MM/yyyy`
- Mỗi nhóm có thể expand/collapse

**Thao tác trên mỗi ghi chú:**
- Tap để xem chi tiết
- Context menu / swipe: sửa, xóa

### Form tạo / sửa ghi chú
```
┌─────────────────────────────┐
│  Tạo ghi chú mới        [✕]│
├─────────────────────────────┤
│  Mã đơn hàng                │
│  [________________________] │
│                             │
│  Sản phẩm                   │
│  [+ Thêm sản phẩm]          │
│                             │
│  ┌──────────────────────┐   │
│  │ Tên SP: [__________] │   │
│  │ SL:     [___]   [🗑] │   │
│  └──────────────────────┘   │
│                             │
│  Ghi chú / Theo dõi         │
│  ┌──────────────────────┐   │
│  │                      │   │
│  │ (multiline text)     │   │
│  │                      │   │
│  └──────────────────────┘   │
├─────────────────────────────┤
│  [Hủy]           [Lưu]      │
└─────────────────────────────┘
```

### Modal chi tiết ghi chú (read-only)
```
┌─────────────────────────────┐
│  Chi tiết ghi chú       [✕]│
├─────────────────────────────┤
│  Mã đơn: #ABC123            │
│  Thời gian: 01/06/2026 10:30│
├─────────────────────────────┤
│  Sản phẩm                   │
│  • Kem dưỡng ABC × 2        │
│  • Son XYZ × 1              │
│  Tổng: 3 sản phẩm           │
├─────────────────────────────┤
│  Ghi chú                    │
│  "Khách nhắn giao sớm"      │
└─────────────────────────────┘
```

---

## 10. UI patterns chung

### Status badges (màu sắc)
| Trạng thái | Màu | Label |
|-----------|-----|-------|
| Paid | Xanh lá | Đã thanh toán |
| Unpaid | Đỏ / Cam | Chưa thanh toán |
| Tồn kho bình thường | Xanh lá | Còn hàng |
| Tồn kho thấp (1–19) | Vàng | Ít hàng |
| Hết hàng (0) | Đỏ | Hết hàng |

### Warehouse labels
| Code | Hiển thị |
|------|----------|
| HN | Hà Nội |
| QB | Quảng Bình |
| SG | Sài Gòn |

### Định dạng số tiền
- Dùng format: `250.000 ₫` hoặc `250,000 đ`
- Phân cách hàng nghìn bằng dấu `.`
- Đơn vị: `₫` hoặc `đ`

### Thông báo (Toast / Alert)
- Tạo thành công → toast xanh
- Lỗi → toast đỏ
- Xóa → confirmation dialog trước khi xóa

### Pagination
- Hiển thị: `Trang X / Y`
- Nút: `< Trước` và `Sau >`
- Disable nút nếu đang ở trang đầu/cuối

### Tìm kiếm với debounce
- Delay 300ms trước khi gọi API
- Hiện loading indicator khi đang search

### Empty states
- Khi không có dữ liệu: hiển thị icon + text "Chưa có [tên mục]"
- Khi search không có kết quả: "Không tìm thấy kết quả"

### Pull-to-refresh
- Tất cả danh sách đều hỗ trợ pull-to-refresh

---

## 11. Navigation flow

```
                   ┌──────────────────┐
                   │   App Launch     │
                   └────────┬─────────┘
                            │
              ┌─────────────▼──────────────┐
              │   Có session token?        │
              └────────┬──────────┬────────┘
                    Có │          │ Không
                       │          │
              ┌────────▼──┐   ┌───▼──────────┐
              │ Tab Bar   │   │  Đăng nhập   │
              └─────┬─────┘   └──────┬───────┘
                    │                │ Đăng nhập OK
        ┌───────────┼─────────┐      │
        │           │         │      │
    ┌───▼───┐  ┌────▼───┐ ┌───▼──┐   │
    │ Tab 1 │  │ Tab 2  │ │ ... │   │
    │Dash   │  │Đơn hàng│ │     │◄──┘
    └───────┘  └────────┘ └─────┘
```

**Tab bar (5 tabs):**
1. Dashboard (icon: chart.bar)
2. Đơn hàng (icon: doc.text, badge: số đơn chưa TT)
3. Sản phẩm (icon: cube.box, badge: số sp ít tồn)
4. Khách hàng (icon: person.2)
5. Ghi chú (icon: note.text)

**Session handling:**
- Token hết hạn → redirect về màn đăng nhập
- Không có mạng → hiển thị cached data (nếu có) + banner "Không có kết nối"

---

*File này được tạo từ web admin hiện có. Cập nhật lần cuối: 01/06/2026.*
