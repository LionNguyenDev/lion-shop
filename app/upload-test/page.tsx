'use client';

import { CldImage } from 'next-cloudinary';
import { useCloudinaryUpload } from '../hook/useFileUpload';

export default function UploadTestPage() {
  const { openFilePicker, inputRef, handleInputChange, isUploading, progress, result } =
    useCloudinaryUpload({
      uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!, // Replace with your actual unsigned preset
      folder: 'my-uploads', // optional
      maxSizeBytes: 5 * 1024 * 1024,
      onSuccess: (res) => console.log('Upload successful:', res.public_id),
      onError: (err) => console.error('Upload error:', err),
    });

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Cloudinary Upload Test</h1>
      
      <div className="mb-4">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleInputChange}
        />
        <button
          onClick={openFilePicker}
          disabled={isUploading}
          className={`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400`}
        >
          {isUploading ? 'Uploading...' : 'Select Image'}
        </button>
      </div>

      {progress > 0 && progress < 100 && (
        <div className="mb-4 w-full bg-gray-200 rounded-full h-2.5">
          <div
            className={`bg-blue-500 h-2.5 rounded-full transition-all duration-300`}
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      )}

      {result && (
        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-2">Preview:</h2>
          <CldImage
            alt='hello'
            src={result.public_id}
            width={500}
            height={500}
            crop={{ type: 'auto', source: true }}
            className="border rounded"
          />
          <p className="mt-2 text-sm text-gray-600">
            Public ID: {result.public_id}
          </p>
        </div>
      )}
    </div>
  );
}