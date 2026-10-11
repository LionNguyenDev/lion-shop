# Nút chat nổi Zalo + Messenger

Hãy thêm vào trang một cụm 2 nút chat nổi (Zalo + Messenger) ở góc phải dưới màn hình, giống hệt mô tả sau.

Stack: React + Tailwind CSS. Nếu dự án không dùng Tailwind, dùng phần CSS thuần ở mục 5.

## 1. Bố cục

- **Container:** `position: fixed`, cách đáy 24px, cách phải 24px, `z-index: 50`. Xếp dọc, căn phải, khoảng cách 12px. Zalo ở trên, Messenger ở dưới.
- **Mỗi hàng** gồm 2 phần nằm ngang, cách nhau 12px: **nhãn chữ** bên trái và **nút tròn** bên phải.
- **Nút tròn:** 56×56px, nền trắng, viền 1px `slate-200`, bóng đổ lớn (`shadow-xl`, màu `slate-900` 15%). Icon bên trong 32×32px. Chế độ tối: nền `slate-800`, viền `slate-700`.
- **Nhãn:** dạng viên thuốc, padding 6px × 12px, chữ 12px đậm, nền `slate-900`, chữ trắng, có bóng đổ. Chế độ tối thì đảo lại: nền trắng, chữ `slate-900`. Nội dung: "Nhắn Zalo", "Nhắn Messenger".
- **Liên kết:** mỗi nút là thẻ `<a>` mở tab mới (`target="_blank" rel="noopener noreferrer"`), có `aria-label` giống nội dung nhãn.

## 2. Bốn lớp chuyển động

### a) Xuất hiện khi tải trang (pop-in)

Mỗi hàng nảy lên từ dưới.

- Keyframe:
  - `0%`: `opacity: 0; transform: scale(0.85) translateY(12px)`
  - `60%`: `transform: scale(1.03) translateY(0)` (vượt nhẹ quá cỡ)
  - `100%`: `opacity: 1; transform: scale(1)`
- Thời lượng 0.7s, easing `cubic-bezier(0.2, 0.8, 0.3, 1.2)` (hệ số 1.2 tạo độ nảy), `animation-fill-mode: backwards`.
- Độ trễ: Zalo **0.8s**, Messenger **0.95s**. Nút hiện sau khi nội dung chính đã tải xong, và hai nút hiện so le nhau 0.15s.

### b) Vòng sóng lan toả (ping), chạy liên tục

- Một vòng tròn cùng kích thước nằm ngay sau nút (`absolute inset-0`, bo tròn), phóng to dần và mờ đi.
- Keyframe: `75%, 100%` → `transform: scale(2); opacity: 0`. Thời lượng 1s, easing `cubic-bezier(0, 0, 0.2, 1)`, lặp vô hạn (đúng như `animate-ping` của Tailwind).
- Màu vòng: Zalo `sky-400` 40% độ đậm, Messenger `fuchsia-400` 40% độ đậm.
- **Vòng của Messenger trễ 0.7s** so với Zalo, nên hai vòng sóng nhấp nháy lệch nhịp thay vì đập cùng lúc. Đây là chi tiết tạo cảm giác "sống".

### c) Hover vào nút

- Nút xoay **-12°** và phóng to **1.1** lần, transition 200ms.
- Khi nhấn (`:active`) thì thu nhỏ còn **0.95** lần, tạo cảm giác bấm thật.

### d) Nhãn trượt ra khi hover

- Nhãn mặc định ẩn: `opacity: 0`, lệch phải 8px.
- Khi rê chuột vào **cả hàng** (không chỉ nút), nhãn hiện ra (`opacity: 1`) và trượt về vị trí, 200ms.
- Nhãn có `pointer-events: none` để không chặn chuột, và `user-select: none`.

## 3. Icon

Dùng logo SVG chính thức, không dùng emoji hay icon chung chung:

- **Messenger:** khung chat tròn, gradient từ `#00B1FF` (trên) đến `#006BFF` (dưới), tia sét trắng ở giữa. viewBox `0 0 32 32`.
- **Zalo:** khung chat, phần chính nền `#eee`, viền và chữ "Zalo" màu `#2962ff`. viewBox `0 0 48 48`.

Mã SVG đầy đủ ở mục 6.

## 4. Accessibility (bắt buộc)

- Khi người dùng bật `prefers-reduced-motion: reduce`: tắt hiệu ứng pop-in và vòng ping, nút vẫn hiển thị bình thường.
- Nhãn cũng phải hiện khi focus bằng bàn phím (`group-focus-within`), không chỉ khi hover.
- Nút cần viền focus nhìn thấy được (`focus-visible:ring-2`).
- Nếu trang có nút "lên đầu trang" hoặc cookie banner ở góc phải dưới thì đẩy cụm này lên để không đè lên nhau.

## 5. Code tham chiếu

### Component (React + Tailwind)

Thay `[SỐ_ZALO]` và `[PAGE_MESSENGER]` bằng link thật.

```tsx
import { MessengerIcon, ZaloIcon } from './icons'

const buttons = [
  { href: 'https://zalo.me/[SỐ_ZALO]',     label: 'Nhắn Zalo',      Icon: ZaloIcon,      ping: 'bg-sky-400/40',     delay: '0s' },
  { href: 'https://m.me/[PAGE_MESSENGER]', label: 'Nhắn Messenger', Icon: MessengerIcon, ping: 'bg-fuchsia-400/40', delay: '0.7s' },
]

export function FloatingContactButtons() {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {buttons.map(({ href, label, Icon, ping, delay }, i) => (
        <div
          key={href}
          className="group flex items-center gap-3 animate-pop-in"
          style={{ animationDelay: `${0.8 + i * 0.15}s` }}
        >
          <span className="pointer-events-none select-none whitespace-nowrap rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white opacity-0 shadow-lg translate-x-2 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100 group-focus-within:translate-x-0 group-focus-within:opacity-100 dark:bg-white dark:text-slate-900">
            {label}
          </span>
          <div className="relative">
            <span
              aria-hidden
              className={`absolute inset-0 rounded-full animate-ping motion-reduce:animate-none ${ping}`}
              style={{ animationDelay: delay }}
            />
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="relative flex h-14 w-14 items-center justify-center rounded-full border border-slate-200 bg-white shadow-xl shadow-slate-900/15 transition-all duration-200 hover:-rotate-12 hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:border-slate-700 dark:bg-slate-800"
            >
              <Icon className="h-8 w-8" />
            </a>
          </div>
        </div>
      ))}
    </div>
  )
}
```

### CSS toàn cục

```css
@keyframes pop-in {
  0%   { opacity: 0; transform: scale(0.85) translateY(12px); }
  60%  { transform: scale(1.03) translateY(0); }
  100% { opacity: 1; transform: scale(1); }
}
.animate-pop-in { animation: pop-in 0.7s cubic-bezier(0.2, 0.8, 0.3, 1.2) backwards; }

@media (prefers-reduced-motion: reduce) {
  .animate-pop-in { animation: none !important; }
}
```

Nếu dự án **không dùng Tailwind**, thêm keyframe ping:

```css
@keyframes ping {
  75%, 100% { transform: scale(2); opacity: 0; }
}
.animate-ping { animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite; }

@media (prefers-reduced-motion: reduce) {
  .animate-ping { animation: none !important; }
}
```

## 6. SVG icon

```tsx
export const MessengerIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      fill="url(#messenger-gradient)"
      d="M16 28.1791C23.1797 28.1791 29 22.5426 29 15.5896C29 8.63654 23.1797 3 16 3C8.8203 3 3 8.63654 3 15.5896C3 19.3712 4.72168 22.7634 7.44737 25.0711V27.6188C7.44737 28.6145 8.4616 29.2824 9.36588 28.8821L12.193 27.6307C13.397 27.9873 14.6754 28.1791 16 28.1791Z"
    />
    <path
      fill="white"
      d="M12.887 12.9133L9.11723 18.0689C8.71304 18.6217 9.43994 19.2858 9.99334 18.8693L13.2123 16.4469C13.5399 16.2003 13.9992 16.197 14.3307 16.4388L17.1935 18.5272C17.7425 18.9277 18.5272 18.8125 18.9269 18.2727L22.8805 12.9341C23.2905 12.3804 22.558 11.7109 22.0038 12.1328L18.6006 14.7236C18.2729 14.9731 17.8112 14.9777 17.4782 14.7347L14.6247 12.6531C14.0733 12.2509 13.285 12.369 12.887 12.9133Z"
    />
    <defs>
      <linearGradient id="messenger-gradient" x1={16} y1={3} x2={11.8286} y2={28.8583} gradientUnits="userSpaceOnUse">
        <stop stopColor="#00B1FF" />
        <stop offset={1} stopColor="#006BFF" />
      </linearGradient>
    </defs>
  </svg>
)

export const ZaloIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      fill="#2962ff"
      d="M15,36V6.827l-1.211-0.811C8.64,8.083,5,13.112,5,19v10c0,7.732,6.268,14,14,14h10 c4.722,0,8.883-2.348,11.417-5.931V36H15z"
    />
    <path
      fill="#eee"
      d="M29,5H19c-1.845,0-3.601,0.366-5.214,1.014C10.453,9.25,8,14.528,8,19 c0,6.771,0.936,10.735,3.712,14.607c0.216,0.301,0.357,0.653,0.376,1.022c0.043,0.835-0.129,2.365-1.634,3.742 c-0.162,0.148-0.059,0.419,0.16,0.428c0.942,0.041,2.843-0.014,4.797-0.877c0.557-0.246,1.191-0.203,1.729,0.083 C20.453,39.764,24.333,40,28,40c4.676,0,9.339-1.04,12.417-2.916C42.038,34.799,43,32.014,43,29V19C43,11.268,36.732,5,29,5z"
    />
    <path
      fill="#2962ff"
      d="M36.75,27C34.683,27,33,25.317,33,23.25s1.683-3.75,3.75-3.75s3.75,1.683,3.75,3.75 S38.817,27,36.75,27z M36.75,21c-1.24,0-2.25,1.01-2.25,2.25s1.01,2.25,2.25,2.25S39,24.49,39,23.25S37.99,21,36.75,21z"
    />
    <path fill="#2962ff" d="M31.5,27h-1c-0.276,0-0.5-0.224-0.5-0.5V18h1.5V27z" />
    <path
      fill="#2962ff"
      d="M27,19.75v0.519c-0.629-0.476-1.403-0.769-2.25-0.769c-2.067,0-3.75,1.683-3.75,3.75 S22.683,27,24.75,27c0.847,0,1.621-0.293,2.25-0.769V26.5c0,0.276,0.224,0.5,0.5,0.5h1v-7.25H27z M24.75,25.5 c-1.24,0-2.25-1.01-2.25-2.25S23.51,21,24.75,21S27,22.01,27,23.25S25.99,25.5,24.75,25.5z"
    />
    <path
      fill="#2962ff"
      d="M21.25,18h-8v1.5h5.321L13,26h0.026c-0.163,0.211-0.276,0.463-0.276,0.75V27h7.5 c0.276,0,0.5-0.224,0.5-0.5v-1h-5.321L21,19h-0.026c0.163-0.211,0.276-0.463,0.276-0.75V18z"
    />
  </svg>
)
```

## 7. Kiểm tra sau khi làm

- [ ] Tải trang: 2 nút nảy lên lần lượt (Zalo trước, Messenger sau khoảng 0.15s).
- [ ] Hai vòng sóng nhấp nháy **lệch nhịp**, không đập cùng lúc.
- [ ] Rê chuột vào hàng: nhãn trượt ra từ phải sang; nút xoay nghiêng và phóng to.
- [ ] Tab bàn phím tới nút: thấy viền focus và nhãn cũng hiện ra.
- [ ] Bật giảm chuyển động trong hệ điều hành: không còn nảy, không còn vòng sóng, nút vẫn hiển thị.
- [ ] Chế độ tối: nút nền `slate-800`, nhãn nền trắng chữ tối.
- [ ] Màn hình 375px: cụm nút không che nội dung quan trọng và không đè lên nút khác ở góc phải dưới.
