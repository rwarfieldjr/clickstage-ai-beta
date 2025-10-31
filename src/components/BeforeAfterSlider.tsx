import { useState, useRef, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeAlt?: string;
  afterAlt?: string;
}

const BeforeAfterSlider = ({ 
  beforeImage, 
  afterImage, 
  beforeAlt = "Before", 
  afterAlt = "After" 
}: BeforeAfterSliderProps) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  // Hide hint after first interaction
  useEffect(() => {
    if (isDragging) {
      setShowHint(false);
    }
  }, [isDragging]);

  const handleMove = useCallback((e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging && e.type !== "click") return;
    if (!containerRef.current) return;

    // Cancel any pending animation frame
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    // Batch DOM read and state update in requestAnimationFrame
    rafRef.current = requestAnimationFrame(() => {
      if (!containerRef.current) return;
      
      const container = containerRef.current.getBoundingClientRect();
      const x = "touches" in e ? e.touches[0].clientX : e.clientX;
      const position = ((x - container.left) / container.width) * 100;
      setSliderPosition(Math.min(Math.max(position, 0), 100));
    });
  }, [isDragging]);

  return (
    <div 
      ref={containerRef}
      className="relative w-full aspect-video overflow-hidden rounded-xl cursor-col-resize select-none group"
      onMouseMove={handleMove}
      onTouchMove={handleMove}
      onMouseDown={() => setIsDragging(true)}
      onMouseUp={() => setIsDragging(false)}
      onMouseLeave={() => setIsDragging(false)}
      onTouchStart={() => setIsDragging(true)}
      onTouchEnd={() => setIsDragging(false)}
      onClick={handleMove}
    >
      {/* After Image (Full) */}
      <div className="absolute inset-0">
        <img 
          src={afterImage} 
          alt={afterAlt}
          className="w-full h-full object-cover"
          width="1920"
          height="1080"
          loading="lazy"
          decoding="async"
        />
        <div className="absolute bottom-4 right-4 bg-accent text-white px-3 py-1 rounded-md text-sm font-medium">
          After
        </div>
      </div>

      {/* Before Image (Clipped) */}
      <div 
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <img 
          src={beforeImage} 
          alt={beforeAlt}
          className="w-full h-full object-cover"
          width="1920"
          height="1080"
          loading="lazy"
          decoding="async"
        />
        <div className="absolute bottom-4 left-4 bg-muted text-foreground px-3 py-1 rounded-md text-sm font-medium">
          Before
        </div>
      </div>

      {/* Slider Line */}
      <div 
        className="absolute top-0 bottom-0 w-1 bg-white shadow-lg"
        style={{ left: `${sliderPosition}%` }}
      >
        {/* Draggable Handle with Arrows */}
        <div className={cn(
          "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-xl flex items-center justify-center transition-all hover:scale-110",
          showHint && "animate-pulse"
        )}>
          <ChevronLeft className="w-4 h-4 text-gray-600 -mr-1" />
          <ChevronRight className="w-4 h-4 text-gray-600 -ml-1" />
        </div>
      </div>

      {/* Drag Hint - Shows on hover, hides when dragging */}
      <div className={cn(
        "absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity",
        isDragging && "!opacity-0"
      )}>
        <div className="bg-gray-500/90 text-white px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap">
          {"<--Drag to Compare-->"}
        </div>
      </div>
    </div>
  );
};

export default BeforeAfterSlider;
