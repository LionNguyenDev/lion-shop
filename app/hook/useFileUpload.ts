"use client";

import { useState, useCallback, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  url: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  bytes: number;
  original_filename: string;
  created_at: string;
}

export interface UseCloudinaryUploadOptions {
  /** Cloudinary cloud name – defaults to NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME */
  cloudName?: string;
  /** Unsigned upload preset (required for client-side uploads) */
  uploadPreset: string;
  /** Optional folder path inside your Media Library */
  folder?: string;
  /** Max file size in bytes (default: 10 MB) */
  maxSizeBytes?: number;
  /** Allowed MIME types (default: all image/*) */
  allowedTypes?: string[];
  /** Called when an upload succeeds */
  onSuccess?: (result: CloudinaryUploadResult) => void;
  /** Called when an upload fails */
  onError?: (error: string) => void;
}

export interface UseCloudinaryUploadReturn {
  /** Trigger file-picker dialog */
  openFilePicker: () => void;
  /** Upload a File object directly (e.g. from drag-and-drop) */
  uploadFile: (file: File) => Promise<CloudinaryUploadResult | null>;
  /** Hidden <input> ref – render it once in your JSX */
  inputRef: React.RefObject<HTMLInputElement | null>;
  /** Attach to your <input onChange={...} /> */
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Upload progress 0-100 */
  progress: number;
  /** Whether an upload is in flight */
  isUploading: boolean;
  /** Last successful result */
  result: CloudinaryUploadResult | null;
  /** Last error message */
  error: string | null;
  /** Preview URL (object URL) of the selected file */
  preview: string | null;
  /** Reset all state */
  reset: () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCloudinaryUpload(
  options: UseCloudinaryUploadOptions
): UseCloudinaryUploadReturn {
  const {
    cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!,
    folder,
    maxSizeBytes = 10 * 1024 * 1024, // 10 MB
    allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"],
    onSuccess,
    onError,
  } = options;
console.log("cloudName:", cloudName);
console.log("uploadPreset:", uploadPreset);
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<CloudinaryUploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  // ── Validation ──────────────────────────────────────────────────────────────

  const validate = useCallback(
    (file: File): string | null => {
      if (!allowedTypes.includes(file.type)) {
        return `Định dạng không hỗ trợ. Chỉ chấp nhận: ${allowedTypes.join(", ")}`;
      }
      if (file.size > maxSizeBytes) {
        return `File quá lớn. Tối đa ${(maxSizeBytes / 1024 / 1024).toFixed(0)} MB`;
      }
      return null;
    },
    [allowedTypes, maxSizeBytes]
  );

  // ── Core upload logic (XHR for progress tracking) ──────────────────────────

  const uploadFile = useCallback(
    async (file: File): Promise<CloudinaryUploadResult | null> => {
      if (!cloudName) {
        const msg =
          "Thiếu cloudName. Hãy set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME hoặc truyền cloudName vào hook.";
        setError(msg);
        onError?.(msg);
        return null;
      }

      // Validate
      const validationError = validate(file);
      if (validationError) {
        setError(validationError);
        onError?.(validationError);
        return null;
      }

      // Build preview
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
      setError(null);
      setProgress(0);
      setIsUploading(true);

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", uploadPreset);
        if (folder) formData.append("folder", folder);

        const uploadResult = await new Promise<CloudinaryUploadResult>(
          (resolve, reject) => {
            const xhr = new XMLHttpRequest();

            xhr.upload.addEventListener("progress", (e) => {
              if (e.lengthComputable) {
                setProgress(Math.round((e.loaded / e.total) * 100));
              }
            });

            xhr.addEventListener("load", () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                resolve(JSON.parse(xhr.responseText) as CloudinaryUploadResult);
              } else {
                try {
                  const body = JSON.parse(xhr.responseText);
                  reject(new Error(body?.error?.message ?? `HTTP ${xhr.status}`));
                } catch {
                  reject(new Error(`HTTP ${xhr.status}`));
                }
              }
            });

            xhr.addEventListener("error", () =>
              reject(new Error("Lỗi mạng khi upload"))
            );
            xhr.addEventListener("abort", () =>
              reject(new Error("Upload bị huỷ"))
            );

            xhr.open(
              "POST",
              `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`
            );
            xhr.send(formData);
          }
        );

        setResult(uploadResult);
        setProgress(100);
        onSuccess?.(uploadResult);
        return uploadResult;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Upload thất bại";
        setError(msg);
        onError?.(msg);
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [cloudName, uploadPreset, folder, validate, onSuccess, onError]
  );

  // ── File-picker helpers ────────────────────────────────────────────────────

  const openFilePicker = useCallback(() => {
    inputRef.current?.click();
  }, []);

  // Attach onChange handler to the hidden input via a callback ref helper.
  // We expose inputRef so you can render: <input ref={inputRef} ... />
  // The consumer must wire onChange themselves, OR use the helper below.

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) uploadFile(file);
      // Reset input so the same file can be re-selected
      e.target.value = "";
    },
    [uploadFile]
  );

  // ── Reset ──────────────────────────────────────────────────────────────────

  const reset = useCallback(() => {
    setProgress(0);
    setIsUploading(false);
    setResult(null);
    setError(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
  }, [preview]);

  return {
    openFilePicker,
    uploadFile,
    inputRef,
    handleInputChange,
    progress,
    isUploading,
    result,
    error,
    preview,
    reset,
  };
}