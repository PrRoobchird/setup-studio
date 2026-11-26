import React, { useEffect, useRef } from 'react';
import { drawWindowViewScene } from '../three/textures';

interface WindowViewThumbnailProps {
  viewId: string;
  nightMode?: boolean;
  isSnowSeason?: boolean;
  className?: string;
}

export const WindowViewThumbnail: React.FC<WindowViewThumbnailProps> = ({
  viewId,
  nightMode = false,
  isSnowSeason = false,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawWindowViewScene(canvas, viewId, nightMode, isSnowSeason);
  }, [viewId, nightMode, isSnowSeason]);

  return (
    <div
      className={`relative rounded-xl overflow-hidden border-4 border-[#E8DAC6] bg-[#FAF4EA] shadow-inner ${className}`}
    >
      <canvas
        ref={canvasRef}
        width={320}
        height={225}
        className="w-full h-full block object-cover"
        aria-label={`ตัวอย่างวิวหน้าต่าง ${viewId}`}
      />
      {/* Studio window frame mullions matching StudioRoom3D */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[3px] bg-[#E8DAC6]/90 shadow-xs" />
        <div className="absolute inset-x-0 top-[54%] -translate-y-1/2 h-[3px] bg-[#E8DAC6]/90 shadow-xs" />
        <div className="absolute inset-x-0 bottom-0 h-1.5 bg-[#D7C4AA]" />
      </div>
    </div>
  );
};
