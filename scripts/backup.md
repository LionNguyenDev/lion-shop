# Database Backup & Restore

Database: MongoDB Atlas (`lion-shop`)

---

## Yêu cầu (chỉ cần làm 1 lần)

**1. Cài MongoDB Database Tools:**
```bash
brew tap mongodb/brew
brew install mongodb-database-tools
```

**2. Thêm `MONGODB_URI` vào GitHub Secrets:**
1. Vào repo GitHub → **Settings → Secrets and variables → Actions**
2. Click **New repository secret**
3. Name: `MONGODB_URI`
4. Value: copy từ `.env.local` dòng `MONGODB_URI=...` (chỉ lấy phần sau dấu `=`)
5. Click **Add secret**

---

## Backup tự động (GitHub Actions)

Workflow chạy tự động lúc **2:00 AM** mỗi ngày.

**Chạy thủ công khi cần:**
1. Vào GitHub repo → tab **Actions**
2. Chọn workflow **Daily Database Backup**
3. Click **Run workflow → Run workflow**
4. Chờ workflow chạy xong (khoảng 1-2 phút)

---

## Tải file backup

1. Vào GitHub repo → tab **Actions**
2. Click vào run gần nhất
3. Cuộn xuống phần **Artifacts**
4. Click tải file `db-backup-xxxxxxx.zip`
5. Chuyển file zip vào thư mục `backups/` trong project

---

## Kiểm tra backup (restore vào database test)

**Bước 1 — Giải nén**
```bash
cd /path/to/warehouse-admin/backups
unzip db-backup-xxxxxxx.zip
tar -xzf backup-<timestamp>.tar.gz
```

**Bước 2 — Set URI (dùng single quotes để tránh lỗi ký tự đặc biệt)**
```bash
URI='mongodb+srv://luupink220_db_user:e4!56Dqa_htQ!2w@cluster0.xxoqwkx.mongodb.net'
```

**Bước 3 — Restore vào database test** (không đụng database gốc)
```bash
cd /path/to/warehouse-admin
mongorestore --uri="$URI" --db="lion-shop-test" --drop backups/<timestamp>/lion-shop/
```

**Bước 4 — Kiểm tra trên Atlas**
1. Vào **MongoDB Atlas → Browse Collections**
2. Chọn database `lion-shop-test`
3. Kiểm tra 5 collections: `customers`, `orders`, `ordernotes`, `products`, `users`
4. Số documents phải khớp với database gốc `lion-shop`

**Bước 5 — Dọn dẹp sau khi kiểm tra xong**
```bash
# Xóa database test trên Atlas
mongosh "$URI/lion-shop-test" --eval "db.dropDatabase()"

# Xóa file đã giải nén
rm -rf backups/<timestamp> backups/db-backup-xxxxxxx.zip
```

---

## Restore khẩn cấp (khi mất data gốc)

**Bước 1 — Giải nén** (như trên)

**Bước 2 — Set URI**
```bash
URI='mongodb+srv://luupink220_db_user:e4!56Dqa_htQ!2w@cluster0.xxoqwkx.mongodb.net'
```

**Bước 3 — Restore vào database gốc**
```bash
mongorestore --uri="$URI" --db="lion-shop" --drop backups/<timestamp>/lion-shop/
```

> ⚠️ `--drop` sẽ xóa toàn bộ data hiện tại trước khi restore. Chỉ dùng khi thực sự cần.

---

## Lưu ý

- Dùng **single quotes** `'...'` khi set URI để tránh zsh expand ký tự `!` trong password
- File backup được giữ trên GitHub Actions trong **30 ngày**
- Backup tự động chỉ chạy khi **GitHub Actions đang hoạt động** (không phụ thuộc máy tính)
