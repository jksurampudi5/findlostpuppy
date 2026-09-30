import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, RefreshCw, X, Video } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { PermissionFallback } from './fallbacks/PermissionFallback';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (photoDataUrl: string) => void;
  title?: string;
  captureButtonText?: string;
}

/** Provides camera capture with permission recovery and returns the captured photo through onCapture. */
export const CameraModal: React.FC<CameraModalProps> = ({ 
  isOpen, 
  onClose, 
  onCapture,
  title = "Capture Photo",
  captureButtonText = "Capture Photo"
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [hasCameraError, setHasCameraError] = useState(false);
  const [cameraConsentAccepted, setCameraConsentAccepted] = useState(false);
  const { showToast } = useToast();

  const startCamera = useCallback(async () => {
    try {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      });
      setStream(newStream);
      setHasCameraError(false);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(console.error);
        };
      }
    } catch (err: any) {
      if (import.meta.env.DEV) console.error('Camera access denied or failed', err);
      setHasCameraError(true);
      showToast('Could not access camera. Please check permissions.', 'error');
    }
  }, [facingMode, showToast]);

  const stopStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  useEffect(() => {
    if (isOpen && cameraConsentAccepted) {
      startCamera();
    } else if (!isOpen) {
      stopStream();
      setCameraConsentAccepted(false);
    }
    return () => {
      stopStream();
    };
  }, [isOpen, cameraConsentAccepted, facingMode]);

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current || !stream) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    const width = video.videoWidth || 900;
    const height = video.videoHeight || 900;
    
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    if (facingMode === 'user') {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }
    
    ctx.drawImage(video, 0, 0, width, height);
    
    const photoDataUrl = canvas.toDataURL('image/jpeg', 0.85);
    onCapture(photoDataUrl);
    stopStream();
    onClose();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      onCapture(event.target?.result as string);
      stopStream();
      onClose();
    };
    reader.readAsDataURL(file);
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const handleClose = () => {
    stopStream();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="camera-modal-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
    }}>
      <div className="camera-modal-container" style={{
        width: '100%', maxWidth: '480px', maxHeight: '90vh', backgroundColor: '#1a1a1a', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column',
        boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
      }}>
        <div className="camera-modal-header" style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', color: '#fff',
          backgroundColor: 'rgba(0,0,0,0.2)', borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          <h3 style={{ margin: 0, color: '#fff', fontSize: '18px', fontWeight: 'bold' }}>{title}</h3>
          <button onClick={handleClose} style={{ background: 'none', border: 'none', color: '#a1a1aa', padding: '4px', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        <div className="camera-modal-body" style={{ width: '100%', aspectRatio: '3/4', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', backgroundColor: '#000' }}>
        {!cameraConsentAccepted ? (
          <div style={{ color: '#fff', textAlign: 'center', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <div style={{ backgroundColor: '#2a2a2a', padding: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Camera size={34} color="#f97316" />
            </div>
            <strong style={{ fontSize: '20px' }}>Camera permission required</strong>
            <span style={{ fontSize: '14px', color: '#a1a1aa', maxWidth: '300px', lineHeight: 1.5 }}>
              We use your camera only to capture this photo. Avoid capturing people, faces, homes, or private details in the background.
            </span>
            <button 
              type="button" 
              onClick={() => setCameraConsentAccepted(true)}
              style={{
                marginTop: '8px',
                backgroundColor: '#f97316',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '14px 24px',
                fontSize: '16px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer'
              }}
            >
              <Video size={18} />
              <span>Turn On Camera</span>
            </button>
          </div>
        ) : hasCameraError ? (
          <PermissionFallback
            compact
            type="camera"
            onRetry={startCamera}
            onAlternative={() => uploadInputRef.current?.click()}
          />
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: facingMode === 'user' ? 'scaleX(-1)' : 'none'
            }}
          />
        )}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>

      <div className="camera-modal-footer" style={{
        padding: '24px 16px', 
        display: 'flex', 
        flexDirection: 'column',
        gap: '12px',
        backgroundColor: '#1a1a1a',
        paddingBottom: 'max(24px, env(safe-area-inset-bottom))'
      }}>
        <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
          <button 
            onClick={handleCapture}
            style={{ 
              flex: 1, 
              backgroundColor: '#f97316', 
              color: 'white', 
              border: 'none', 
              borderRadius: '12px', 
              padding: '16px', 
              fontSize: '16px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <Camera size={20} />
            {captureButtonText}
          </button>
          
          <button 
            onClick={toggleCamera}
            style={{ 
              flex: 1, 
              backgroundColor: '#2a2a2a', 
              color: 'white', 
              border: '1px solid #444', 
              borderRadius: '12px', 
              padding: '16px', 
              fontSize: '16px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <RefreshCw size={20} />
            {facingMode === 'user' ? 'Use Back Camera' : 'Use Front Camera'}
          </button>
        </div>

        <div style={{ position: 'relative', width: '100%' }}>
          <button 
            style={{ 
              width: '100%', 
              backgroundColor: 'transparent', 
              color: 'white', 
              border: '1px solid #444', 
              borderRadius: '12px', 
              padding: '16px', 
              fontSize: '16px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <Camera size={20} />
            Screenshot / Gallery
          </button>
          <input
            ref={uploadInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
            title="Upload Screenshot"
          />
        </div>
      </div>
      </div>
    </div>
  );
};
