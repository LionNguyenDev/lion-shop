'use client'

import Image from 'next/image'
import { useState } from 'react'
import {
  CloudinaryUploadResult,
  useCloudinaryUpload,
} from '@/app/hook/useFileUpload'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ImageUploadButtonProps {
  /** URL ảnh hiện tại (dùng khi edit) – hiển thị như trạng thái success */
  initialImageUrl?: string
  /** Called when upload completes successfully */
  onUploadSuccess?: (result: CloudinaryUploadResult) => void
  /** Called when upload fails */
  onUploadError?: (error: string) => void
  /** Called when user clicks "Đổi ảnh" – để parent reset formData.image */
  onReset?: () => void
  /** Show preview thumbnail after upload */
  showPreview?: boolean
  /** Tailwind class overrides */
  className?: string
  /** Drop zone label */
  label?: string
  uploadPreset?: string
  folder?: string
  maxSizeBytes?: number
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function ImageUploadButton({
  initialImageUrl,
  onUploadSuccess,
  onUploadError,
  onReset,
  showPreview = true,
  className = '',
  label = 'Upload Image',
  uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!,
  folder,
  maxSizeBytes = 10 * 1024 * 1024,
}: ImageUploadButtonProps) {
  const {
    openFilePicker,
    inputRef,
    handleInputChange,
    isUploading,
    progress,
    result,
    error,
    preview,
    reset,
  } = useCloudinaryUpload({
    uploadPreset,
    folder,
    maxSizeBytes,
    onSuccess: onUploadSuccess,
    onError: onUploadError,
  })

  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }
  const handleDragLeave = () => setIsDragging(false)
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files[0]) {
      handleInputChange({
        target: { files: e.dataTransfer.files, value: '' },
      } as React.ChangeEvent<HTMLInputElement>)
    }
  }

  const handleReset = () => {
    reset()
    onReset?.()
  }

  // ── Trạng thái 1: Đang upload ─────────────────────────────────────────────

  if (isUploading) {
    return (
      <div className={`flex flex-col gap-3 ${className}`}>
        {preview && showPreview && (
          <div className="relative h-32 w-32 overflow-hidden rounded-xl border border-border">
            <Image
              src={preview}
              alt="preview"
              fill
              unoptimized
              className="object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
              <svg
                className="h-6 w-6 animate-spin text-white"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            </div>
          </div>
        )}
        <div className="w-full max-w-xs">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Đang tải lên…</span>
            <span className="font-medium tabular-nums text-blue-600 dark:text-blue-400">
              {progress}%
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-150 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    )
  }

  // ── Trạng thái 2: Đã có ảnh (upload mới HOẶC ảnh cũ từ initialImageUrl) ──

  const displayUrl = result?.secure_url || initialImageUrl

  if (displayUrl && showPreview) {
    return (
      <div className={`flex flex-col gap-3 ${className}`}>
        <div className="group relative h-32 w-32 overflow-hidden rounded-xl border-2 border-green-400 shadow-md">
          <Image
            src={displayUrl}
            alt="product image"
            fill
            sizes="128px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {/* Badge: check nếu upload mới, clock nếu ảnh cũ */}
          <div className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-green-500 shadow">
            <svg
              className="h-3.5 w-3.5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 12.75l6 6 9-13.5"
              />
            </svg>
          </div>
        </div>

        {/* Meta – chỉ hiện khi vừa upload mới */}
        {result && (
          <div className="text-xs text-muted-foreground">
            <p className="truncate max-w-32">{result.original_filename}</p>
            <p>
              {(result.bytes / 1024).toFixed(0)} KB · {result.width}×
              {result.height}
            </p>
          </div>
        )}

        {/* Nút đổi ảnh */}
        <button
          type="button"
          onClick={handleReset}
          className="flex w-fit items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground shadow-sm transition-all hover:bg-muted"
        >
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
            />
          </svg>
          Đổi ảnh
        </button>
      </div>
    )
  }

  // ── Trạng thái 3: Chưa có ảnh (idle / drop zone) ─────────────────────────

  return (
    <div className={`flex flex-col items-start gap-3 ${className}`}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleInputChange}
      />

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFilePicker}
        className={`
          group relative flex w-full cursor-pointer flex-col items-center justify-center gap-2
          rounded-2xl border-2 border-dashed px-8 py-6 transition-all duration-200
          ${
            isDragging
              ? 'border-blue-500 bg-blue-500/10'
              : 'border-border bg-muted/20 hover:border-blue-500 hover:bg-blue-500/5'
          }
        `}
      >
        <div
          className={`
          flex h-12 w-12 items-center justify-center rounded-full transition-colors duration-200
          ${isDragging ? 'bg-blue-500/20' : 'bg-muted group-hover:bg-blue-500/10'}
        `}
        >
          <svg
            className={`h-6 w-6 transition-colors duration-200 ${isDragging ? 'text-blue-500' : 'text-muted-foreground group-hover:text-blue-500'}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
            />
          </svg>
        </div>

        <div className="text-center">
          <p
            className={`text-sm font-medium transition-colors duration-200 ${isDragging ? 'text-blue-600' : 'text-foreground group-hover:text-blue-500 dark:group-hover:text-blue-400'}`}
          >
            {isDragging ? 'Thả ảnh vào đây' : label}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground/60">
            PNG, JPG, WebP, GIF · Tối đa{' '}
            {(maxSizeBytes / 1024 / 1024).toFixed(0)} MB
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-sm text-red-600 dark:text-red-400">
          <svg
            className="h-4 w-4 shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </div>
      )}
    </div>
  )
}
