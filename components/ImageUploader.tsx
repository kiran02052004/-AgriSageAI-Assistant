
import React, { useState, useRef, useCallback } from 'react';
import { Button } from './Button';
import { useLanguage } from '../contexts/LanguageContext';

interface ImageUploaderProps {
  onImageUpload: (base64Data: string, mimeType: string) => void;
  labelKey?: string; // Use translation key
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, labelKey = "imageUploader.label" }) => {
  const { t } = useLanguage();
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError(t('imageUploader.errorTooLarge'));
        setPreview(null);
        setFileName(null);
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setError(t('imageUploader.errorInvalidType'));
        setPreview(null);
        setFileName(null);
        return;
      }

      setError(null);
      setFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        setPreview(reader.result as string);
        onImageUpload(base64String, file.type);
      };
      reader.readAsDataURL(file);
    }
  }, [onImageUpload, t]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveImage = () => {
    setPreview(null);
    setFileName(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Reset file input
    }
    onImageUpload("", ""); // Notify parent that image is removed
  };

  return (
    <div className="w-full p-4 border-2 border-dashed border-green-300 rounded-lg text-center bg-green-50/50">
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        aria-label={t(labelKey)}
      />
      {!preview ? (
        <>
          <div 
            className="flex flex-col items-center justify-center p-6 cursor-pointer"
            onClick={handleUploadClick}
            onDrop={(e) => { e.preventDefault(); if(e.dataTransfer.files.length > 0 && fileInputRef.current) { fileInputRef.current.files = e.dataTransfer.files; handleFileChange({target: fileInputRef.current} as React.ChangeEvent<HTMLInputElement>);}}}
            onDragOver={(e) => e.preventDefault()}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => e.key === 'Enter' && handleUploadClick()}
          >
            <i className="fas fa-cloud-upload-alt text-5xl text-green-500 mb-3"></i>
            <p className="text-green-700 font-semibold">{t(labelKey)}</p>
            <p className="text-xs text-gray-500 mt-1">{t('imageUploader.dragDrop')}</p>
          </div>
        </>
      ) : (
        <div className="mt-4">
          <img src={preview} alt={t('imageUploader.selected', { fileName: fileName || 'Uploaded image'})} className="max-h-60 w-auto mx-auto rounded-md shadow-md mb-3 object-contain" />
          {fileName && <p className="text-sm text-gray-600 mb-1">{t('imageUploader.selected', { fileName })}</p>}
          <div className="flex justify-center space-x-2">
            <Button onClick={handleUploadClick} variant="outline" size="sm" icon={<i className="fas fa-sync-alt"></i>}>{t('buttons.change')}</Button>
            <Button onClick={handleRemoveImage} variant="danger" size="sm" icon={<i className="fas fa-trash-alt"></i>}>{t('buttons.remove')}</Button>
          </div>
        </div>
      )}
      {error && <p className="text-red-500 text-sm mt-2" role="alert">{error}</p>}
    </div>
  );
};
