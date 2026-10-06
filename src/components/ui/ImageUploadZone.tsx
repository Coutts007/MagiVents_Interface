import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Check,
  X,
  AlertCircle,
  Trash2,
  Camera,
  Sparkles,
  Link as LinkIcon,
  RotateCw
} from 'lucide-react';
import { processImageFile } from '../../utils/imageUpload';

export interface ImagePreset {
  label: string;
  url: string;
}

export interface ImageUploadZoneProps {
  label?: string;
  helperText?: string;
  value: string;
  onChange: (dataUrlOrUrl: string) => void;
  aspectRatio?: '1:1' | '16:9' | '4:3' | '3:2' | 'portrait';
  shape?: 'circle' | 'rounded';
  presets?: ImagePreset[];
  maxDimension?: { width: number; height: number };
  allowUrlInput?: boolean;
  uploadButtonText?: string;
}

export const ImageUploadZone: React.FC<ImageUploadZoneProps> = ({
  label,
  helperText,
  value,
  onChange,
  aspectRatio = '4:3',
  shape = 'rounded',
  presets = [],
  maxDimension = { width: 1600, height: 1200 },
  allowUrlInput = true,
  uploadButtonText = 'Upload Image File'
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [uploadedInfo, setUploadedInfo] = useState<{ fileName?: string; dimensions?: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if current value matches one of the presets
  const activePreset = presets.find((p) => p.url === value);
  const isCustomUpload = Boolean(value && !activePreset);

  const handleFile = async (file: File) => {
    setErrorMessage(null);
    setIsProcessing(true);

    try {
      const processed = await processImageFile(file, {
        maxWidth: maxDimension.width,
        maxHeight: maxDimension.height,
        quality: 0.88
      });

      onChange(processed.dataUrl);
      setUploadedInfo({
        fileName: processed.fileName,
        dimensions: processed.width > 0 ? `${processed.width}×${processed.height}px` : undefined
      });
      setUrlInput('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to upload image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFile(file);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      handleFile(file);
    }
    // reset input so same file can be selected again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleApplyUrl = () => {
    if (!urlInput.trim()) return;
    onChange(urlInput.trim());
    setUploadedInfo({ fileName: 'External Web Link' });
    setErrorMessage(null);
  };

  const handleClear = () => {
    if (presets.length > 0) {
      onChange(presets[0].url);
    } else {
      onChange('');
    }
    setUploadedInfo(null);
    setErrorMessage(null);
  };

  const getAspectClass = () => {
    if (shape === 'circle') return 'aspect-square rounded-full';
    switch (aspectRatio) {
      case '1:1':
        return 'aspect-square rounded-2xl';
      case '16:9':
        return 'aspect-[16/9] rounded-2xl';
      case '3:2':
        return 'aspect-[3/2] rounded-2xl';
      case 'portrait':
        return 'aspect-[3/4] rounded-2xl';
      case '4:3':
      default:
        return 'aspect-[4/3] rounded-2xl';
    }
  };

  return (
    <div className="space-y-3">
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-[#1E1814] uppercase tracking-wider block">
            {label}
          </label>
          {helperText && (
            <span className="text-[11px] text-[#675A50]">
              {helperText}
            </span>
          )}
        </div>
      )}

      {/* Upload Zone / Drop Target */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => {
          if (!isProcessing) fileInputRef.current?.click();
        }}
        className={`relative border-2 border-dashed rounded-2xl transition-all p-4 text-center cursor-pointer select-none group ${
          isDragging
            ? 'border-[#8A4F33] bg-[#8A4F33]/10 scale-[1.01]'
            : 'border-[#D8CDBC] bg-[#EFE8DD] hover:border-[#8A4F33] hover:bg-[#E9E2D6]/80'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
          onChange={handleFileInputChange}
          className="hidden"
        />

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 py-2">
          {/* Circular or thumbnail preview */}
          {value ? (
            <div
              className={`relative overflow-hidden border border-[#D8CDBC] shadow-xs shrink-0 ${
                shape === 'circle' ? 'w-16 h-16 rounded-full' : 'w-24 h-16 rounded-xl'
              }`}
            >
              <img
                src={value}
                alt="Upload preview"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                <Camera className="w-4 h-4" />
              </div>
            </div>
          ) : (
            <div className="w-12 h-12 rounded-2xl bg-[#DFD6C8] text-[#8A4F33] flex items-center justify-center shrink-0">
              <Upload className="w-5 h-5" />
            </div>
          )}

          <div className="text-left space-y-0.5 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#1E1814] group-hover:text-[#8A4F33] transition-colors">
                {uploadButtonText}
              </span>
              {isCustomUpload && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#8A4F33] text-white">
                  Uploaded
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#675A50]">
              Drag & drop or click to browse · PNG, JPG, WebP, GIF (up to 10MB)
            </p>
            {uploadedInfo?.fileName && (
              <p className="text-[10px] font-mono text-[#00A34D] flex items-center gap-1 mt-0.5">
                <Check className="w-3 h-3" />
                {uploadedInfo.fileName} {uploadedInfo.dimensions ? `(${uploadedInfo.dimensions})` : ''}
              </p>
            )}
          </div>
        </div>

        {/* Processing Spinner Overlay */}
        {isProcessing && (
          <div className="absolute inset-0 bg-ivory/80 rounded-2xl backdrop-blur-xs flex items-center justify-center gap-2 text-xs font-semibold text-[#8A4F33] z-10">
            <RotateCw className="w-4 h-4 animate-spin" />
            <span>Processing image…</span>
          </div>
        )}
      </div>

      {/* Remove the current image (only when there are no presets to fall back to) */}
      {value && presets.length === 0 && (
        <button
          type="button"
          onClick={handleClear}
          className="text-[11px] text-[#675A50] hover:text-red-700 flex items-center gap-1 cursor-pointer transition-colors"
        >
          <Trash2 className="w-3 h-3" />
          <span>Remove image</span>
        </button>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Presets Grid (if provided) */}
      {presets.length > 0 && (
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-[11px] text-[#675A50]">
            <span>Or choose one of these images:</span>
            {isCustomUpload && (
              <button
                type="button"
                onClick={handleClear}
                className="text-[#8A4F33] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                Use a suggested image
              </button>
            )}
          </div>

          <div
            className={`grid gap-2.5 ${
              presets.length <= 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5'
            }`}
          >
            {presets.map((preset) => {
              const isSelected = value === preset.url;
              return (
                <div
                  key={preset.label}
                  onClick={() => {
                    onChange(preset.url);
                    setUploadedInfo(null);
                    setErrorMessage(null);
                  }}
                  className={`relative ${getAspectClass()} overflow-hidden border-2 cursor-pointer transition-all group/preset ${
                    isSelected
                      ? 'border-[#8A4F33] ring-2 ring-[#8A4F33]/30 scale-[1.02] shadow-sand-sm'
                      : 'border-[#D8CDBC] hover:border-[#675A50]'
                  }`}
                >
                  <img
                    src={preset.url}
                    alt={preset.label}
                    className="w-full h-full object-cover group-hover/preset:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent flex items-end p-2">
                    <span className="text-[10px] font-medium text-white leading-tight truncate">
                      {preset.label}
                    </span>
                  </div>
                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#8A4F33] text-white flex items-center justify-center shadow-xs">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* External URL Fallback Accordion */}
      {allowUrlInput && (
        <div className="pt-0.5">
          {!showUrlInput ? (
            <button
              type="button"
              onClick={() => setShowUrlInput(true)}
              className="text-[11px] text-[#675A50] hover:text-[#8A4F33] flex items-center gap-1 cursor-pointer transition-colors"
            >
              <LinkIcon className="w-3 h-3" />
              <span>Paste image web link instead</span>
            </button>
          ) : (
            <div className="flex gap-2 animate-in fade-in">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/poster.jpg"
                className="flex-1 px-3 py-1.5 bg-ivory border border-[#D8CDBC] rounded-xl text-xs text-[#1E1814] focus:outline-none focus:border-[#8A4F33]"
              />
              <button
                type="button"
                onClick={handleApplyUrl}
                className="px-3 py-1.5 bg-[#1E1814] hover:bg-[#8A4F33] text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors"
              >
                Apply
              </button>
              <button
                type="button"
                onClick={() => setShowUrlInput(false)}
                className="p-1.5 text-[#675A50] hover:text-[#1E1814] cursor-pointer"
                title="Cancel"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
