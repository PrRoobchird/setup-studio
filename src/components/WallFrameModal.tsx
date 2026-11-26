import React, { useRef, useState } from 'react';
import {
  Check,
  Frame,
  ImagePlus,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { ArtSubmission, WallFrameArtwork, WallFrameType } from '../types/studio';
import { compressImageFile } from '../utils/imageUtils';

interface WallFrameModalProps {
  ownedWallFrames: WallFrameType[];
  wallFrameArtworks: {
    landscape: WallFrameArtwork | null;
    portrait: WallFrameArtwork | null;
  };
  gallery: ArtSubmission[];
  initialFrameType?: WallFrameType;
  onSetArtwork: (frameType: WallFrameType, artwork: WallFrameArtwork | null) => void;
  onGoToCritique: () => void;
  onClose: () => void;
}

export const WallFrameModal: React.FC<WallFrameModalProps> = ({
  ownedWallFrames,
  wallFrameArtworks,
  gallery,
  initialFrameType,
  onSetArtwork,
  onGoToCritique,
  onClose,
}) => {
  const defaultType: WallFrameType =
    initialFrameType && ownedWallFrames.includes(initialFrameType)
      ? initialFrameType
      : ownedWallFrames[0] ?? 'landscape';

  const [activeType, setActiveType] = useState<WallFrameType>(defaultType);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentArtwork = wallFrameArtworks[activeType];

  const handleUploadCustomImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);

    try {
      const compressed = await compressImageFile(file, 960);
      const cleanName = file.name.replace(/\.[^.]+$/, '').slice(0, 32) || 'ผลงานของฉัน';
      onSetArtwork(activeType, {
        id: `custom-${Date.now()}`,
        title: cleanName,
        imageDataUrl: compressed.dataUrl,
        updatedAt: new Date().toISOString(),
      });
    } catch {
      setUploadError('ไม่สามารถอ่านไฟล์ภาพนี้ได้ กรุณาลองเลือกไฟล์ JPG หรือ PNG นะ');
    } finally {
      e.target.value = '';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/55 flex items-center justify-center p-3 sm:p-5"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#FAF8F4] border border-[#E5DCCB] rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div className="px-5 py-4 bg-white border-b border-[#ECE6DA] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#B45309] text-white flex items-center justify-center">
              <Frame className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-[#1F1D1A]">
                จัดแสดงผลงานในเฟรมติดผนัง
              </h2>
              <p className="text-xs text-[#6E675F]">
                เลือกหรืออัปโหลดผลงานใส่กรอบผนัง 3 มิติ เปลี่ยนภาพใหม่ได้ฟรีไม่จำกัดจำนวนครั้ง
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[#6E675F] hover:bg-[#F1ECE2] cursor-pointer"
            aria-label="ปิดหน้าต่างเฟรมภาพ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Frame Orientation Switcher */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-white border border-[#EAE3D5] rounded-xl">
            {(
              [
                { id: 'landscape', label: 'เฟรมแนวนอน (ผนังหน้าต่าง)' },
                { id: 'portrait', label: 'เฟรมแนวตั้ง (ผนังซ้าย)' },
              ] as { id: WallFrameType; label: string }[]
            ).map((f) => {
              const owned = ownedWallFrames.includes(f.id);
              const active = activeType === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  disabled={!owned}
                  onClick={() => setActiveType(f.id)}
                  className={`py-2 px-3 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                    !owned
                      ? 'text-[#B5ABA0] cursor-not-allowed'
                      : active
                      ? 'bg-[#1F1D1A] text-white cursor-pointer'
                      : 'text-[#6E675F] hover:text-[#1F1D1A] cursor-pointer'
                  }`}
                >
                  {f.label} {!owned && '(ยังไม่ซื้อ)'}
                </button>
              );
            })}
          </div>

          {/* Current Frame Preview */}
          <div className="bg-white border border-[#E7E1D6] rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4">
            <div
              className={`rounded-xl bg-[#EFE8DB] border-4 border-[#A6784B] overflow-hidden flex items-center justify-center shrink-0 ${
                activeType === 'landscape' ? 'w-44 h-30' : 'w-32 h-40'
              }`}
            >
              {currentArtwork ? (
                <img
                  src={currentArtwork.imageDataUrl}
                  alt={currentArtwork.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-[11px] text-[#8C7E6E] px-3 text-center">
                  ยังไม่ได้ใส่ภาพผลงาน
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0 space-y-2 text-center sm:text-left">
              <div className="text-xs text-[#6E675F]">
                ภาพที่แสดงอยู่บนผนังตอนนี้
              </div>
              <div className="text-sm sm:text-base font-semibold text-[#1F1D1A] truncate">
                {currentArtwork ? currentArtwork.title : 'กรอบว่าง (พร้อมใส่ผลงาน)'}
              </div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleUploadCustomImage}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[38px] rounded-xl bg-[#2563EB] text-white text-xs font-medium hover:bg-[#1D4ED8] cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  อัปโหลดรูปภาพใหม่ใส่เฟรม
                </button>
                {currentArtwork && (
                  <button
                    type="button"
                    onClick={() => onSetArtwork(activeType, null)}
                    className="inline-flex items-center gap-1 px-3 py-2 min-h-[38px] rounded-xl border border-[#DED5C5] bg-[#FAF8F4] text-xs font-medium text-[#6E675F] hover:text-[#BE123C] cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    นำภาพออก
                  </button>
                )}
              </div>
              {uploadError && <p className="text-xs text-[#BE123C]">{uploadError}</p>}
            </div>
          </div>

          {/* Choose from Submitted Portfolio Gallery */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-[#1F1D1A] flex items-center gap-1.5">
                <ImagePlus className="w-4 h-4 text-[#D97706]" />
                เลือกจากผลงานที่เคยส่งตรวจ ({gallery.length} ชิ้น)
              </h3>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onGoToCritique();
                }}
                className="text-xs font-medium text-[#2563EB] hover:underline cursor-pointer"
              >
                + ส่งงานเพิ่ม
              </button>
            </div>

            {gallery.length === 0 ? (
              <div className="p-5 rounded-2xl bg-white border border-[#E7E1D6] text-center space-y-2">
                <Sparkles className="w-6 h-6 text-[#D97706] mx-auto" />
                <p className="text-xs sm:text-sm text-[#6E675F]">
                  ยังไม่มีผลงานในแกลเลอรี คุณสามารถกดปุ่ม <strong>อัปโหลดรูปภาพใหม่ใส่เฟรม</strong> ด้านบน หรือไปส่งงานตรวจเพื่อให้พี่ติวเก็บเข้าแกลเลอรีได้เลย
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {gallery.map((sub) => {
                  const isActive = currentArtwork?.id === sub.id;
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() =>
                        onSetArtwork(activeType, {
                          id: sub.id,
                          title: sub.assignmentBrief?.slice(0, 32) || sub.category,
                          imageDataUrl: sub.imageDataUrl,
                          updatedAt: new Date().toISOString(),
                        })
                      }
                      className={`group text-left rounded-xl overflow-hidden border transition-all cursor-pointer ${
                        isActive
                          ? 'border-[#2563EB] ring-2 ring-[#BFDBFE] bg-[#EFF6FF]'
                          : 'border-[#E7E1D6] bg-white hover:border-[#C2B7A5]'
                      }`}
                    >
                      <div className="relative aspect-[4/3] bg-[#F1ECE2] overflow-hidden">
                        <img
                          src={sub.imageDataUrl}
                          alt={sub.category}
                          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform"
                        />
                        {isActive && (
                          <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#2563EB] text-white flex items-center justify-center shadow">
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                      <div className="p-2.5">
                        <div className="text-xs font-semibold text-[#1F1D1A] truncate">
                          {sub.category}
                        </div>
                        <div className="text-[11px] text-[#6E675F] font-mono-num">
                          {sub.critique.starRating} / 10 ดาว
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-white border-t border-[#ECE6DA] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#1F1D1A] text-white text-xs sm:text-sm font-medium hover:bg-[#33302B] cursor-pointer"
          >
            เรียบร้อย
          </button>
        </div>
      </div>
    </div>
  );
};
