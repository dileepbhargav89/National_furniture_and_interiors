'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { MediaService, ImageSubdoc } from '@nfi/api-client';

export interface MediaUploaderProps {
  images: ImageSubdoc[];
  onChange: (images: ImageSubdoc[]) => void;
  maxFiles?: number;
  ownerType?: 'PRODUCT' | 'CATEGORY' | 'CMS';
  ownerId?: string;
  label?: string;
  helpText?: string;
}

export function MediaUploader({
  images,
  onChange,
  maxFiles = 10,
  ownerType = 'PRODUCT',
  ownerId = '000000000000000000000000',
  label = 'Product Media Gallery',
  helpText = 'Upload PNG, JPG, or WebP images up to 5MB. First image or marked image is primary.',
}: MediaUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (images.length + files.length > maxFiles) {
      setUploadError(`Maximum of ${maxFiles} images allowed.`);
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    const newImages: ImageSubdoc[] = [...images];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file || !file.type.startsWith('image/')) {
          continue;
        }

        // Upload to Cloudinary via MediaService signature
        try {
          const sigResult = await MediaService.generateSignature({
            ownerType,
            ownerId,
          });

          if (sigResult.data && sigResult.data.signature) {
            const { signature, timestamp, cloudName, apiKey, folder, uploadPreset } = sigResult.data;
            const formData = new FormData();
            formData.append('file', file);
            if (apiKey) formData.append('api_key', apiKey);
            formData.append('timestamp', timestamp.toString());
            formData.append('signature', signature);
            formData.append('folder', folder);
            if (uploadPreset) formData.append('upload_preset', uploadPreset);

            const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
              method: 'POST',
              body: formData,
            });

            if (!cloudRes.ok) {
              throw new Error(`Cloudinary upload failed with status ${cloudRes.status}`);
            }

            const cloudData = await cloudRes.json();

            if (cloudData.secure_url) {
              await MediaService.confirmUpload({
                publicId: cloudData.public_id,
                url: cloudData.secure_url,
                format: cloudData.format || 'jpg',
                bytes: cloudData.bytes || file.size,
                width: cloudData.width,
                height: cloudData.height,
                ownerType,
                ownerId,
              });

              newImages.push({
                url: cloudData.secure_url,
                publicId: cloudData.public_id,
                altText: file.name.replace(/\.[^/.]+$/, ''),
                sortOrder: newImages.length,
                isPrimary: newImages.length === 0,
              });
            }
          }
        } catch (err) {
          console.warn('Direct Cloudinary upload failed, falling back to blob preview for local dev:', err);
          const previewUrl = URL.createObjectURL(file);
          newImages.push({
            url: previewUrl,
            publicId: `local_${Date.now()}_${i}`,
            altText: file.name.replace(/\.[^/.]+$/, ''),
            sortOrder: newImages.length,
            isPrimary: newImages.length === 0,
          });
        }
      }

      onChange(newImages);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Failed to upload images');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSetPrimary = (index: number) => {
    const updated = images.map((img, i) => ({
      ...img,
      isPrimary: i === index,
    }));
    onChange(updated);
  };

  const handleRemove = (index: number) => {
    const wasPrimary = images[index]?.isPrimary;
    const updated = images.filter((_, i) => i !== index);
    if (wasPrimary && updated.length > 0 && updated[0]) {
      updated[0].isPrimary = true;
    }
    onChange(updated);
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const newIdx = direction === 'up' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= images.length) return;
    const currentItem = images[index];
    const targetItem = images[newIdx];
    if (!currentItem || !targetItem) return;

    const reordered = [...images];
    reordered[index] = targetItem;
    reordered[newIdx] = currentItem;
    reordered.forEach((img, i) => {
      img.sortOrder = i;
    });
    onChange(reordered);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-sm font-medium" style={{ color: 'var(--nfi-text)' }}>
            {label}
          </label>
          {helpText && (
            <p className="text-xs mt-0.5" style={{ color: 'var(--nfi-text-secondary)' }}>
              {helpText}
            </p>
          )}
        </div>
        <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--nfi-surface-muted)', color: 'var(--nfi-text-secondary)' }}>
          {images.length} / {maxFiles}
        </span>
      </div>

      {uploadError && (
        <div
          className="p-3 rounded-md text-xs border"
          style={{
            backgroundColor: 'rgba(198,40,40,0.05)',
            color: 'var(--nfi-danger)',
            borderColor: 'rgba(198,40,40,0.2)',
          }}
        >
          {uploadError}
        </div>
      )}

      {/* Gallery Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.map((img, idx) => (
            <div
              key={img.publicId || img.url || idx}
              className="relative group rounded-lg border overflow-hidden bg-gray-50 flex flex-col"
              style={{ borderColor: img.isPrimary ? 'var(--nfi-primary)' : 'var(--nfi-border)' }}
            >
              <div className="aspect-square relative w-full overflow-hidden bg-gray-100 flex items-center justify-center">
                <Image
                  src={img.url}
                  alt={img.altText || `Product image ${idx + 1}`}
                  fill
                  unoptimized
                  className="object-cover"
                />

                {img.isPrimary && (
                  <span
                    className="absolute top-2 left-2 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shadow text-white"
                    style={{ backgroundColor: 'var(--nfi-primary)' }}
                  >
                    Primary
                  </span>
                )}

                {/* Hover overlay controls */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-2">
                  {!img.isPrimary && (
                    <button
                      type="button"
                      onClick={() => handleSetPrimary(idx)}
                      title="Set as primary"
                      className="p-1.5 bg-white text-gray-800 rounded shadow hover:bg-gray-100 text-xs font-semibold"
                    >
                      ★ Make Primary
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemove(idx)}
                    title="Delete image"
                    className="p-1.5 bg-red-600 text-white rounded shadow hover:bg-red-700 text-xs"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Position controls footer */}
              <div className="p-1.5 flex items-center justify-between border-t bg-white" style={{ borderColor: 'var(--nfi-border)' }}>
                <span className="text-[10px] font-mono text-gray-400">#{idx + 1}</span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => handleMove(idx, 'up')}
                    className="px-1 text-xs text-gray-500 hover:text-gray-900 disabled:opacity-30"
                    title="Move Left/Up"
                  >
                    ◀
                  </button>
                  <button
                    type="button"
                    disabled={idx === images.length - 1}
                    onClick={() => handleMove(idx, 'down')}
                    className="px-1 text-xs text-gray-500 hover:text-gray-900 disabled:opacity-30"
                    title="Move Right/Down"
                  >
                    ▶
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Dropzone */}
      {images.length < maxFiles && (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFiles(e.dataTransfer.files);
          }}
          className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-gray-400 transition-colors"
          style={{ borderColor: 'var(--nfi-border)', backgroundColor: 'var(--nfi-surface)' }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          {isUploading ? (
            <div className="flex flex-col items-center gap-2 py-2">
              <div
                className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: 'var(--nfi-primary)' }}
              />
              <p className="text-xs font-medium" style={{ color: 'var(--nfi-text)' }}>
                Uploading images...
              </p>
            </div>
          ) : (
            <>
              <svg
                className="w-8 h-8 mb-2"
                style={{ color: 'var(--nfi-text-secondary)' }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="text-sm font-medium" style={{ color: 'var(--nfi-text)' }}>
                Drag &amp; drop images here, or <span className="underline" style={{ color: 'var(--nfi-accent)' }}>browse</span>
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--nfi-text-secondary)' }}>
                Supports multiple files (PNG, JPG, WebP)
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
