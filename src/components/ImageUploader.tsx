import { useState, useRef } from 'react';
import { Camera, X, Star, AlertCircle, Image as ImageIcon } from 'lucide-react';

interface ImageUploaderProps {
  primaryPhoto: string;
  additionalPhotos: string[];
  onChange: (primary: string, additional: string[]) => void;
  dogName?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  primaryPhoto,
  additionalPhotos,
  onChange,
  dogName = 'your pup',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [uploading, setUploading] = useState<boolean>(false);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setErrorMsg('');
    setUploading(true);

    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) {
        setErrorMsg('Please upload valid image files (JPG, PNG, WebP).');
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg('Images must be under 5MB each.');
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) {
      setUploading(false);
      return;
    }

    // Read files as Data URLs
    const readPromises = validFiles.map((file) => {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read image.'));
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readPromises)
      .then((newImages) => {
        setUploading(false);
        if (!primaryPhoto && newImages.length > 0) {
          const first = newImages[0];
          const rest = newImages.slice(1);
          onChange(first, [...additionalPhotos, ...rest]);
        } else {
          onChange(primaryPhoto, [...additionalPhotos, ...newImages]);
        }
      })
      .catch((err) => {
        setUploading(false);
        setErrorMsg('Error processing image. Please try another file.');
        console.error(err);
      });
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
        className="upload-dropzone"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFiles(e.dataTransfer.files);
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png, image/jpeg, image/webp"
          multiple
          className="sr-only"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div className="dropzone-content">
          <div className="dropzone-icon-circle">
            <Camera size={26} />
          </div>
          <p className="dropzone-title">
            {uploading ? 'Processing photos...' : 'Click to browse or drag photos here'}
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
