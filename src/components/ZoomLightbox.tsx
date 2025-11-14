import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";

interface ZoomLightboxProps {
  isOpen: boolean;
  imageUrl: string;
  imageName: string;
  onClose: () => void;
}

export default function ZoomLightbox({ isOpen, imageUrl, imageName, onClose }: ZoomLightboxProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    const handleWheel = (e: WheelEvent) => {
      if (!isOpen) return;
      e.preventDefault();

      const delta = e.deltaY * -0.001;
      const newScale = Math.min(Math.max(1, scale + delta), 5);
      setScale(newScale);

      if (newScale === 1) {
        setPosition({ x: 0, y: 0 });
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('wheel', handleWheel);
    };
  }, [isOpen, onClose, scale]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      e.preventDefault();
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleDoubleClick = () => {
    if (scale > 1) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    } else {
      setScale(2);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 animate-in fade-in duration-200"
      onClick={handleBackdropClick}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-[10000] p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors text-white"
        aria-label="Close"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center">
        <img
          ref={imageRef}
          src={imageUrl}
          alt={imageName}
          className={`max-w-full max-h-[90vh] object-contain transition-transform ${
            isDragging ? 'cursor-grabbing' : scale > 1 ? 'cursor-grab' : 'cursor-default'
          }`}
          style={{
            transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
            transformOrigin: 'center center'
          }}
          onMouseDown={handleMouseDown}
          onDoubleClick={handleDoubleClick}
          draggable={false}
        />
      </div>

      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-lg text-sm">
        <p className="mb-1">{imageName}</p>
        <p className="text-xs text-gray-300">
          Scroll to zoom • Double-click to reset • Drag to pan
        </p>
      </div>
    </div>
  );
}
