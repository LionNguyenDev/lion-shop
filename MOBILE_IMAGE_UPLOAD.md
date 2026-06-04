# Image Upload — Swift Implementation Guide

> Hướng dẫn implement upload ảnh lên Cloudinary cho app Swift, tương đương `useCloudinaryUpload` hook của web admin.

---

## Cách hoạt động

Hook web upload **trực tiếp từ client lên Cloudinary** bằng **unsigned upload preset** — không cần server trung gian.

```
App iOS
  │
  ├─ Chọn ảnh (PhotosPicker)
  ├─ Build multipart/form-data
  └─ POST https://api.cloudinary.com/v1_1/{cloudName}/image/upload
           │
           └─ Response: { secure_url, public_id, width, height, ... }
```

**Request fields:**
| Field | Bắt buộc | Mô tả |
|-------|----------|-------|
| `file` | ✅ | Binary image data |
| `upload_preset` | ✅ | Tên preset (unsigned) |
| `folder` | ❌ | Thư mục trên Cloudinary (vd: `products`) |

---

## Cấu trúc files

```
Services/
  CloudinaryUploadService.swift   ← logic upload + progress
  CloudinaryUploadResult.swift    ← model response
ViewModels/
  ImageUploadViewModel.swift      ← state management
Views/
  ImageUploadButton.swift         ← SwiftUI component tái sử dụng
```

---

## 1. Model — `CloudinaryUploadResult.swift`

```swift
struct CloudinaryUploadResult: Decodable {
    let publicId: String
    let secureUrl: String
    let url: String
    let width: Int
    let height: Int
    let format: String
    let bytes: Int
    let originalFilename: String
    let createdAt: String

    enum CodingKeys: String, CodingKey {
        case publicId         = "public_id"
        case secureUrl        = "secure_url"
        case url
        case width, height, format, bytes
        case originalFilename = "original_filename"
        case createdAt        = "created_at"
    }
}
```

---

## 2. Service — `CloudinaryUploadService.swift`

```swift
import Foundation
import UIKit

enum CloudinaryUploadError: LocalizedError {
    case missingConfig
    case invalidFileType
    case fileTooLarge(maxMB: Int)
    case networkError(String)
    case serverError(Int)

    var errorDescription: String? {
        switch self {
        case .missingConfig:        return "Thiếu cloudName hoặc uploadPreset"
        case .invalidFileType:      return "Định dạng không hỗ trợ (chỉ JPEG, PNG, WebP)"
        case .fileTooLarge(let m):  return "File quá lớn. Tối đa \(m) MB"
        case .networkError(let m):  return "Lỗi mạng: \(m)"
        case .serverError(let c):   return "Server lỗi HTTP \(c)"
        }
    }
}

final class CloudinaryUploadService: NSObject, URLSessionTaskDelegate {

    // MARK: - Config
    private let cloudName: String
    private let uploadPreset: String
    private let folder: String?
    private let maxSizeBytes: Int

    // MARK: - Progress callback (0.0 – 1.0)
    var onProgress: ((Double) -> Void)?

    init(
        cloudName: String,
        uploadPreset: String,
        folder: String? = nil,
        maxSizeMB: Int = 10
    ) {
        self.cloudName    = cloudName
        self.uploadPreset = uploadPreset
        self.folder       = folder
        self.maxSizeBytes = maxSizeMB * 1024 * 1024
    }

    // MARK: - Upload UIImage
    func upload(image: UIImage, filename: String = "image") async throws -> CloudinaryUploadResult {
        guard let imageData = image.jpegData(compressionQuality: 0.85) else {
            throw CloudinaryUploadError.invalidFileType
        }
        return try await upload(data: imageData, mimeType: "image/jpeg", filename: filename)
    }

    // MARK: - Upload raw Data
    func upload(data: Data, mimeType: String = "image/jpeg", filename: String = "image") async throws -> CloudinaryUploadResult {
        // Validate file size
        if data.count > maxSizeBytes {
            throw CloudinaryUploadError.fileTooLarge(maxMB: maxSizeBytes / 1024 / 1024)
        }

        // Build endpoint URL
        let url = URL(string: "https://api.cloudinary.com/v1_1/\(cloudName)/image/upload")!

        // Build multipart/form-data body
        let boundary = "Boundary-\(UUID().uuidString)"
        var body = Data()

        func append(_ string: String) {
            body.append(Data(string.utf8))
        }

        // Field: upload_preset
        append("--\(boundary)\r\n")
        append("Content-Disposition: form-data; name=\"upload_preset\"\r\n\r\n")
        append("\(uploadPreset)\r\n")

        // Field: folder (optional)
        if let folder {
            append("--\(boundary)\r\n")
            append("Content-Disposition: form-data; name=\"folder\"\r\n\r\n")
            append("\(folder)\r\n")
        }

        // Field: file (binary)
        append("--\(boundary)\r\n")
        append("Content-Disposition: form-data; name=\"file\"; filename=\"\(filename).jpg\"\r\n")
        append("Content-Type: \(mimeType)\r\n\r\n")
        body.append(data)
        append("\r\n")
        append("--\(boundary)--\r\n")

        // Build URLRequest
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")

        // Upload với progress tracking qua delegate
        let session = URLSession(configuration: .default, delegate: self, delegateQueue: nil)
        let (responseData, response) = try await session.upload(for: request, from: body)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw CloudinaryUploadError.networkError("Không có phản hồi từ server")
        }
        guard (200..<300).contains(httpResponse.statusCode) else {
            throw CloudinaryUploadError.serverError(httpResponse.statusCode)
        }

        return try JSONDecoder().decode(CloudinaryUploadResult.self, from: responseData)
    }

    // MARK: - URLSessionTaskDelegate (progress)
    func urlSession(
        _ session: URLSession,
        task: URLSessionTask,
        didSendBodyData bytesSent: Int64,
        totalBytesSent: Int64,
        totalBytesExpectedToSend: Int64
    ) {
        guard totalBytesExpectedToSend > 0 else { return }
        let progress = Double(totalBytesSent) / Double(totalBytesExpectedToSend)
        DispatchQueue.main.async { self.onProgress?(progress) }
    }
}
```

---

## 3. ViewModel — `ImageUploadViewModel.swift`

> Tương đương state (`isUploading`, `progress`, `result`, `error`, `preview`) trong hook web.

```swift
import SwiftUI
import PhotosUI

@MainActor
final class ImageUploadViewModel: ObservableObject {

    // MARK: - State (mirror hook web)
    @Published var isUploading = false
    @Published var progress: Double = 0       // 0.0 – 1.0
    @Published var result: CloudinaryUploadResult?
    @Published var error: String?
    @Published var previewImage: UIImage?
    @Published var selectedItem: PhotosPickerItem?

    private let service: CloudinaryUploadService

    init(cloudName: String, uploadPreset: String, folder: String? = nil) {
        self.service = CloudinaryUploadService(
            cloudName: cloudName,
            uploadPreset: uploadPreset,
            folder: folder
        )
        service.onProgress = { [weak self] p in
            self?.progress = p
        }
    }

    // MARK: - Upload UIImage
    func upload(image: UIImage) async {
        previewImage = image
        isUploading  = true
        progress     = 0
        error        = nil

        do {
            result = try await service.upload(image: image)
            progress = 1.0
        } catch {
            self.error = error.localizedDescription
            progress   = 0
        }

        isUploading = false
    }

    // MARK: - Xử lý PhotosPicker selection
    func handlePickerSelection(_ item: PhotosPickerItem?) async {
        guard let item else { return }
        guard let data = try? await item.loadTransferable(type: Data.self),
              let image = UIImage(data: data) else {
            error = "Không thể đọc ảnh đã chọn"
            return
        }
        await upload(image: image)
    }

    // MARK: - Reset (mirror hook reset())
    func reset() {
        isUploading  = false
        progress     = 0
        result       = nil
        error        = nil
        previewImage = nil
        selectedItem = nil
    }
}
```

---

## 4. SwiftUI View — `ImageUploadButton.swift`

```swift
import SwiftUI
import PhotosUI

struct ImageUploadButton: View {
    @StateObject private var vm: ImageUploadViewModel

    /// Callback trả về `secure_url` sau khi upload thành công
    var onUploaded: (String) -> Void

    init(
        cloudName: String,
        uploadPreset: String,
        folder: String? = nil,
        onUploaded: @escaping (String) -> Void
    ) {
        _vm = StateObject(wrappedValue: ImageUploadViewModel(
            cloudName: cloudName,
            uploadPreset: uploadPreset,
            folder: folder
        ))
        self.onUploaded = onUploaded
    }

    var body: some View {
        VStack(spacing: 12) {

            // MARK: Preview ảnh
            ZStack {
                RoundedRectangle(cornerRadius: 12)
                    .fill(Color(.secondarySystemBackground))
                    .frame(height: 180)

                if let img = vm.previewImage {
                    Image(uiImage: img)
                        .resizable()
                        .scaledToFill()
                        .frame(height: 180)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                } else {
                    Label("Chưa có ảnh", systemImage: "photo.badge.plus")
                        .foregroundStyle(.secondary)
                }

                // Overlay progress khi đang upload
                if vm.isUploading {
                    ZStack {
                        Color.black.opacity(0.45)
                        VStack(spacing: 8) {
                            ProgressView(value: vm.progress)
                                .tint(.white)
                                .padding(.horizontal, 24)
                            Text("\(Int(vm.progress * 100))%")
                                .foregroundStyle(.white)
                                .font(.caption.monospacedDigit())
                        }
                    }
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                }

                // Tick khi upload xong
                if vm.result != nil && !vm.isUploading {
                    VStack {
                        HStack {
                            Spacer()
                            Image(systemName: "checkmark.circle.fill")
                                .foregroundStyle(.green)
                                .background(Circle().fill(.white))
                                .padding(8)
                        }
                        Spacer()
                    }
                }
            }

            // MARK: Nút chọn ảnh
            PhotosPicker(
                selection: $vm.selectedItem,
                matching: .images
            ) {
                Label(
                    vm.result != nil ? "Đổi ảnh" : "Chọn ảnh",
                    systemImage: "photo.on.rectangle"
                )
                .frame(maxWidth: .infinity)
            }
            .buttonStyle(.bordered)
            .disabled(vm.isUploading)
            .onChange(of: vm.selectedItem) { _, newItem in
                Task { await vm.handlePickerSelection(newItem) }
            }

            // MARK: Thông báo lỗi
            if let error = vm.error {
                Label(error, systemImage: "exclamationmark.triangle.fill")
                    .foregroundStyle(.red)
                    .font(.caption)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
        .onChange(of: vm.result) { _, result in
            if let url = result?.secureUrl {
                onUploaded(url)
            }
        }
    }
}
```

---

## 5. Cách dùng trong ProductForm

```swift
struct ProductFormView: View {
    @State private var productName = ""
    @State private var imageUrl    = ""

    var body: some View {
        Form {
            Section("Ảnh sản phẩm") {
                ImageUploadButton(
                    cloudName:     "YOUR_CLOUD_NAME",
                    uploadPreset:  "YOUR_UPLOAD_PRESET",
                    folder:        "products"
                ) { url in
                    imageUrl = url  // lưu secure_url vào model khi submit form
                }
            }

            Section("Thông tin") {
                TextField("Tên sản phẩm", text: $productName)
                // ... các field khác
            }

            Button("Lưu sản phẩm") {
                // gửi imageUrl cùng các field khác lên backend
            }
        }
    }
}
```

---

## 6. So sánh hook web ↔ Swift

| Hook web (TypeScript) | Swift tương đương |
|-----------------------|-------------------|
| `isUploading` | `vm.isUploading: Bool` |
| `progress` (0–100) | `vm.progress: Double` (0.0–1.0) |
| `result` | `vm.result: CloudinaryUploadResult?` |
| `error` | `vm.error: String?` |
| `preview` (object URL) | `vm.previewImage: UIImage?` |
| `reset()` | `vm.reset()` |
| `uploadFile(file)` | `service.upload(image:)` |
| `openFilePicker()` | `PhotosPicker` (SwiftUI built-in) |
| `handleInputChange` | `.onChange(of: vm.selectedItem)` |
| `XHR upload.progress` | `URLSessionTaskDelegate` |

---

## 7. Setup Cloudinary

### Bước 1 — Tạo Upload Preset
1. Đăng nhập [cloudinary.com](https://cloudinary.com) → **Settings** → **Upload**
2. Cuộn xuống **Upload presets** → **Add upload preset**
3. Đặt **Signing Mode = Unsigned**
4. (Tuỳ chọn) Set folder mặc định: `products`
5. Lưu → copy tên preset

### Bước 2 — Lấy Cloud Name
- Dashboard → góc trên trái → **Cloud name**

### Bước 3 — Điền vào app
```swift
// Nên đặt trong một file Config.swift hoặc xcconfig
enum CloudinaryConfig {
    static let cloudName    = "your_cloud_name"
    static let uploadPreset = "your_upload_preset"
    static let productFolder = "products"
}
```

### Bước 4 — Info.plist
Thêm key sau để xin quyền truy cập thư viện ảnh:
```xml
<key>NSPhotoLibraryUsageDescription</key>
<string>Cần quyền truy cập để chọn ảnh sản phẩm</string>
```

---

## 8. Xử lý lỗi thường gặp

| Lỗi | Nguyên nhân | Cách fix |
|-----|------------|---------|
| HTTP 400 | Sai `upload_preset` hoặc preset là Signed | Kiểm tra tên preset, đảm bảo Unsigned |
| HTTP 401 | Cloud name sai | Kiểm tra lại cloud name |
| `fileTooLarge` | Ảnh > 10 MB | Compress trước khi upload: `jpegData(compressionQuality: 0.7)` |
| Progress không cập nhật | Session delegate không được gọi | Đảm bảo `URLSession` được khởi tạo với `delegate: self` |
| Ảnh bị xoay | EXIF orientation | Dùng `UIGraphicsImageRenderer` để fix orientation trước khi upload |

### Fix ảnh bị xoay (EXIF)
```swift
extension UIImage {
    func fixedOrientation() -> UIImage {
        guard imageOrientation != .up else { return self }
        UIGraphicsBeginImageContextWithOptions(size, false, scale)
        draw(in: CGRect(origin: .zero, size: size))
        let normalized = UIGraphicsGetImageFromCurrentImageContext()!
        UIGraphicsEndImageContext()
        return normalized
    }
}

// Dùng khi upload:
let fixed = image.fixedOrientation()
result = try await service.upload(image: fixed)
```

---

*Tài liệu này dựa trên `app/hook/useFileUpload.ts`. Cập nhật lần cuối: 02/06/2026.*
