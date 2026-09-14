import { useState, useRef } from 'react';
import { Camera, X, Star, AlertCircle, Image as ImageIcon, Loader2 } from 'lucide-react';
import { compressImage } from '../utils/imageCompressor';
import { storageBucketService } from '../services/storageBucketService';

interface ImageUploaderProps {
  primaryPhoto: string;
  additionalPhotos: string[];
  onChange: (primary: string, additional: string[]) => void;
  dogName?: string;
  userId?: string;
  petId?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  primaryPhoto,
  additionalPhotos,
  onChange,
  dogName = 'your pup',
  userId,
  petId,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadProgressText, setUploadProgressText] = useState<string>('');

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setErrorMsg('');
    setUploading(true);
    setUploadProgressText('Validating and compressing photos...');

    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) {
        setErrorMsg('Please upload valid image files (JPG, PNG, WebP).');
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        setErrorMsg('Images must be under 10MB each.');
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) {
      setUploading(false);
      return;
    }

    try {
      // 1. Compress images down to max 800x800 for crisp, ultra-lightweight persistence
      const readPromises = validFiles.map((file) => compressImage(file, 800, 800, 0.82));
      const compressedImages = await Promise.all(readPromises);
      const nonNullImages = compressedImages.filter(Boolean);

      if (nonNullImages.length === 0) {
        setUploading(false);
        return;
      }

      // 2. Upload to Supabase Storage if user & pet context is provided
      let finalUrls: string[] = [];

      if (userId && petId) {
        setUploadProgressText('Uploading to secure cloud storage...');
        const startingIndex = (primaryPhoto ? 1 : 0) + additionalPhotos.length;

        const uploadPromises = nonNullImages.map(async (compressed, idx) => {
          try {
            const publicUrl = await storageBucketService.uploadPetPhoto(
              userId,
              petId,
              compressed,
              startingIndex + idx
            );
            return publicUrl || compressed; // Fallback to compressed Base64 if offline/error
          } catch (uploadErr) {
            console.warn('[ImageUploader] Upload fallback to local media:', uploadErr);
            return compressed;
          }
        });

        finalUrls = await Promise.all(uploadPromises);
      } else {
        finalUrls = nonNullImages;
      }

      setUploading(false);
      setUploadProgressText('');

      if (!primaryPhoto && finalUrls.length > 0) {
        const first = finalUrls[0];
        const rest = finalUrls.slice(1);
        onChange(first, [...additionalPhotos, ...rest]);
      } else {
        onChange(primaryPhoto, [...additionalPhotos, ...finalUrls]);
      }
    } catch (err) {
      setUploading(false);
      setUploadProgressText('');
      setErrorMsg('Error processing image. Please try another file.');
      console.error(err);
    }
  };

  const handleMakePrimary = (photoUrl: string) => {
    if (photoUrl === primaryPhoto) return;
    const newAdditional = additionalPhotos.filter((p) => p !== photoUrl);
    if (primaryPhoto) {
      newAdditional.push(primaryPhoto);
    }
    onChange(photoUrl, newAdditional);
  };

  const handleRemovePhoto = (photoUrl: string, isPrimary: boolean) => {
    if (isPrimary) {
      if (additionalPhotos.length > 0) {
        const nextPrimary = additionalPhotos[0];
        const nextAdditional = additionalPhotos.slice(1);
        onChange(nextPrimary, nextAdditional);
      } else {
        onChange('', []);
      }
    } else {
      onChange(
        primaryPhoto,
        additionalPhotos.filter((p) => p !== photoUrl)
      );
    }
  };

  return (
    <div className="image-uploader-component">
      <div className="uploader-header">
        <label className="form-label">
          <span>📸 Photos of {dogName} <span className="required-tag">*</span></span>
          <span className="optional-tag">At least 1 clear photo required</span>
        </label>
        <p className="form-hint">
          Upload clear, recent pictures. If your dog has unique patches, collar tags, or markings, add them!
        </p>
      </div>

      {errorMsg && (
        <div className="uploader-error-alert" role="alert">
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Drop / Click Trigger Area */}
      <div
        className={`upload-dropzone ${uploading ? 'uploading-active' : ''}`}
        onClick={() => !uploading && fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (!uploading) {
            handleFiles(e.dataTransfer.files);
          }
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png, image/jpeg, image/webp"
          multiple
          className="sr-only"
          disabled={uploading}
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div className="dropzone-content">
          <div className="dropzone-icon-circle">
            {uploading ? (
              <Loader2 size={26} className="animate-spin text-terracotta" />
            ) : (
              <Camera size={26} />
            )}
          </div>
          <p className="dropzone-title">
            {uploading
              ? uploadProgressText || 'Uploading to cloud...'
              : 'Click to browse or drag photos here'}
          </p>
          <span className="dropzone-sub">
            PNG, JPG, or WEBP (Max 5MB each)
          </span>
        </div>
      </div>

      {/* Image Gallery & Previews */}
      {(primaryPhoto || additionalPhotos.length > 0) && (
        <div className="uploaded-gallery">
          <h4 className="gallery-title">
            <ImageIcon size={16} />
            <span>Uploaded Photos ({1 + additionalPhotos.length})</span>
          </h4>

          <div className="gallery-grid">
            {/* Primary Photo */}
            {primaryPhoto && (
              <div className="gallery-card primary-card">
                <img src={primaryPhoto} alt="Primary dog photo" className="gallery-img" />
                <div className="primary-pill">
                  <Star size={12} fill="#FFF" />
                  <span>Main Photo</span>
                </div>
                <button
                  type="button"
                  className="gallery-delete-btn"
                  onClick={() => handleRemovePhoto(primaryPhoto, true)}
                  title="Remove photo"
                  aria-label="Remove primary photo"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Additional Photos */}
            {additionalPhotos.map((photo, index) => (
              <div key={index} className="gallery-card">
                <img src={photo} alt={`Additional photo ${index + 1}`} className="gallery-img" />
                <button
                  type="button"
                  className="make-primary-btn"
                  onClick={() => handleMakePrimary(photo)}
                  title="Make this the primary photo"
                >
                  <Star size={12} />
                  <span>Set as Main</span>
                </button>
                <button
                  type="button"
                  className="gallery-delete-btn"
                  onClick={() => handleRemovePhoto(photo, false)}
                  title="Remove photo"
                  aria-label={`Remove photo ${index + 1}`}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
