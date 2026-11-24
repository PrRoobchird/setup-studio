import React, { useRef, useState } from 'react';
import {
  BookOpen,
  Camera,
  CheckCircle2,
  Coins,
  ImagePlus,
  Lightbulb,
  Loader2,
  MessageSquareHeart,
  Sparkles,
  Star,
  Upload,
  X,
} from 'lucide-react';
import { ArtCategory, ArtSubmission, CritiqueResult, MajorTrack } from '../types/studio';
import { CompressedImage, compressImageFile, imageUrlToCompressed } from '../utils/imageUtils';

interface ArtCritiqueTabProps {
  studentTrack: MajorTrack;
  gallery: ArtSubmission[];
  onClaimCritique: (submission: ArtSubmission) => void;
}

const ART_CATEGORIES: ArtCategory[] = [
  'วาดเส้น Drawing',
  'ออกแบบสื่อสาร',
  'สถาปัตยกรรม',
  'ทฤษฎีสี/องค์ประกอบศิลป์',
];

const SAMPLE_ARTWORKS: { label: string; category: ArtCategory; url: string }[] = [
  {
    label: 'สเก็ตช์ศาลาไม้ (สถาปัตย์)',
    category: 'สถาปัตยกรรม',
    url: '/src/assets/images/art_sketch_arch_1795454543369.jpg',
  },
  {
    label: 'หุ่นนิ่งแสงเงา (Drawing)',
    category: 'วาดเส้น Drawing',
    url: '/src/assets/images/art_charcoal_stilllife_1795454545851.jpg',
  },
];

export const ArtCritiqueTab: React.FC<ArtCritiqueTabProps> = ({
  studentTrack,
  gallery,
  onClaimCritique,
}) => {
  const [category, setCategory] = useState<ArtCategory>('วาดเส้น Drawing');
  const [note, setNote] = useState('');
  const [previewImage, setPreviewImage] = useState<CompressedImage | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [critiqueResult, setCritiqueResult] = useState<CritiqueResult | null>(null);
  const [claimed, setClaimed] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState<ArtSubmission | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg(null);
    setCritiqueResult(null);
    setClaimed(false);
    try {
      const compressed = await compressImageFile(file, 1024);
      setPreviewImage(compressed);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'ไม่สามารถโหลดรูปภาพได้');
    } finally {
      e.target.value = '';
    }
  };

  const handleUseSample = async (sample: (typeof SAMPLE_ARTWORKS)[number]) => {
    setErrorMsg(null);
    setCritiqueResult(null);
    setClaimed(false);
    setCategory(sample.category);
    try {
      const compressed = await imageUrlToCompressed(sample.url, 1024);
      setPreviewImage(compressed);
    } catch {
      setErrorMsg('ไม่สามารถโหลดภาพตัวอย่างได้ ลองอัปโหลดภาพจากเครื่องแทนนะ');
    }
  };

  const handleSubmitForCritique = async () => {
    if (!previewImage) {
      setErrorMsg('เลือกรูปหรือถ่ายภาพผลงานของน้องก่อนส่งตรวจนะ');
      return;
    }
    setIsAnalyzing(true);
    setErrorMsg(null);
    setCritiqueResult(null);
    setClaimed(false);

    try {
      const response = await fetch('/api/critique', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: previewImage.base64,
          mimeType: previewImage.mimeType,
          category,
          note: note.trim(),
          studentTrack,
        }),
      });

      const rawBody = await response.text();
      let data: Record<string, unknown> = {};
      try {
        data = rawBody ? (JSON.parse(rawBody) as Record<string, unknown>) : {};
      } catch {
        data = {};
      }
      if (!response.ok) {
        throw new Error(
          typeof data.error === 'string'
            ? data.error
            : 'เกิดข้อผิดพลาดระหว่างส่งตรวจผลงาน ลองส่งใหม่อีกครั้งนะ'
        );
      }

      setCritiqueResult(data as unknown as CritiqueResult);
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'ไม่สามารถเชื่อมต่อพี่ติวเตอร์ได้ในขณะนี้ ลองใหม่อีกครั้งนะ'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleClaim = () => {
    if (!critiqueResult || !previewImage || claimed) return;
    const submission: ArtSubmission = {
      id: `art-${Date.now()}`,
      imageDataUrl: previewImage.dataUrl,
      category,
      note: note.trim() || undefined,
      createdAt: new Date().toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      critique: critiqueResult,
    };
    onClaimCritique(submission);
    setClaimed(true);
  };

  const handleResetUpload = () => {
    setPreviewImage(null);
    setCritiqueResult(null);
    setClaimed(false);
    setNote('');
    setErrorMsg(null);
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Upload & Form Column */}
        <section className="lg:col-span-6 bg-white border border-[#E7E1D6] rounded-2xl p-5 sm:p-6 space-y-5">
          <div>
            <h1 className="text-lg sm:text-xl font-semibold text-[#1F1D1A]">
              ส่งผลงานจริงให้พี่ติวเตอร์ตรวจ
            </h1>
            <p className="text-xs sm:text-sm text-[#6E675F] mt-1">
              ถ่ายภาพงานวาดเส้น สเก็ตช์ หรือโปสเตอร์ที่ทำในคลาส พี่ติวเตอร์ AI จะช่วยคอมเมนต์และแจก Idea Coins ให้ไปแต่งห้อง!
            </p>
          </div>

          {/* Category Segmented Buttons */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-[#6E675F]">
              หมวดหมู่ผลงาน
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ART_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-2.5 min-h-[44px] rounded-xl text-xs sm:text-sm font-medium border text-left transition-colors cursor-pointer ${
                    category === cat
                      ? 'bg-[#1F1D1A] text-white border-[#1F1D1A]'
                      : 'bg-[#FAF8F4] text-[#1F1D1A] border-[#E7E1D6] hover:bg-[#F1ECE2]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Image Upload / Camera Capture Area */}
          <div className="space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />

            {previewImage ? (
              <div className="relative rounded-2xl overflow-hidden border border-[#E7E1D6] bg-[#FAF8F4]">
                <img
                  src={previewImage.dataUrl}
                  alt="ผลงานที่เตรียมส่งตรวจ"
                  referrerPolicy="no-referrer"
                  className="w-full max-h-[340px] object-contain mx-auto"
                />
                <button
                  type="button"
                  onClick={handleResetUpload}
                  className="absolute top-3 right-3 inline-flex items-center justify-center w-9 h-9 rounded-xl bg-white/90 border border-[#E7E1D6] text-[#1F1D1A] hover:bg-white shadow-sm cursor-pointer"
                  aria-label="เปลี่ยนรูปภาพ"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="rounded-2xl border-2 border-dashed border-[#D6CCB9] bg-[#FAF8F4] p-6 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-white border border-[#E7E1D6] flex items-center justify-center mx-auto text-[#2563EB]">
                  <ImagePlus className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#1F1D1A]">
                    อัปโหลดหรือถ่ายภาพผลงานจากสมุดสเก็ตช์
                  </p>
                  <p className="text-xs text-[#6E675F] mt-1">
                    รองรับไฟล์ JPG, PNG, WebP (ย่อขนาดอัตโนมัติสำหรับมือถือ)
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl bg-[#2563EB] text-white text-xs sm:text-sm font-medium hover:bg-[#1D4ED8] transition-colors whitespace-nowrap cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    ถ่ายรูปผลงาน
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl bg-white border border-[#DED5C5] text-[#1F1D1A] text-xs sm:text-sm font-medium hover:bg-[#F3EDE2] transition-colors whitespace-nowrap cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    เลือกจากเครื่อง
                  </button>
                </div>

                {/* Quick sample artworks for easy desktop testing */}
                <div className="pt-3 border-t border-[#EAE3D5]">
                  <p className="text-xs text-[#6E675F] mb-2">
                    ยังไม่มีรูปในเครื่อง? ลองส่งภาพสเก็ตช์ตัวอย่างให้ AI ตรวจจริงได้เลย:
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {SAMPLE_ARTWORKS.map((sample) => (
                      <button
                        key={sample.label}
                        type="button"
                        onClick={() => handleUseSample(sample)}
                        className="px-3 py-1.5 rounded-lg bg-white border border-[#E7E1D6] text-xs text-[#475569] hover:text-[#1F1D1A] hover:border-[#C2B7A5] transition-colors cursor-pointer"
                      >
                        {sample.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Optional Student Note */}
          <div className="space-y-1.5">
            <label htmlFor="art-note" className="block text-xs font-medium text-[#6E675F]">
              ข้อความถึงพี่ติวเตอร์ (ไม่บังคับ)
            </label>
            <input
              id="art-note"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="เช่น ฝึกแรเงาแสงเงาชิ้นแรก อยากให้ช่วยดูสัดส่วนครับ"
              className="w-full px-3.5 py-2.5 min-h-[44px] rounded-xl bg-[#FAF8F4] border border-[#E7E1D6] text-sm text-[#1F1D1A] placeholder:text-[#9C948A] focus:outline-none focus:border-[#2563EB]"
            />
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] text-xs sm:text-sm text-[#BE123C]">
              {errorMsg}
            </div>
          )}

          <button
            type="button"
            disabled={!previewImage || isAnalyzing}
            onClick={handleSubmitForCritique}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 min-h-[48px] rounded-xl bg-[#1F1D1A] text-white text-sm font-medium hover:bg-[#33302B] disabled:opacity-45 disabled:cursor-not-allowed transition-all active:scale-[0.99] cursor-pointer"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                พี่ติวเตอร์กำลังส่องผลงานน้องอยู่น้า...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-[#FBBF24]" />
                ส่งงานให้พี่ติวเตอร์ตรวจเลย
              </>
            )}
          </button>
        </section>

        {/* Right Column: Tutor Critique Result Card */}
        <section className="lg:col-span-6">
          {critiqueResult ? (
            <div className="bg-white border border-[#E7E1D6] rounded-2xl p-5 sm:p-6 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#F1ECE2]">
                <div>
                  <p className="text-xs font-medium text-[#2563EB]">
                    ผลการตรวจจากพี่ติวเตอร์ Born to be Art
                  </p>
                  <h2 className="text-lg font-semibold text-[#1F1D1A] mt-0.5">
                    ตรวจผลงานเสร็จแล้วจ้า!
                  </h2>
                </div>
                <div className="flex items-center gap-4 font-mono-num">
                  <div className="text-right">
                    <div className="text-[11px] text-[#6E675F]">Idea Coins</div>
                    <div className="text-lg font-bold text-[#D97706] flex items-center gap-1">
                      <Coins className="w-4 h-4" />+{critiqueResult.coinsEarned}
                    </div>
                  </div>
                  <div className="h-8 w-px bg-[#ECE6DA]" />
                  <div className="text-right">
                    <div className="text-[11px] text-[#6E675F]">Studio Fame</div>
                    <div className="text-lg font-bold text-[#2D6A4F] flex items-center gap-1">
                      <Star className="w-4 h-4" />+{critiqueResult.fameEarned}
                    </div>
                  </div>
                </div>
              </div>

              {/* 3 Structured Critique Insights */}
              <div className="space-y-3.5">
                <div className="p-4 rounded-xl bg-[#FAF8F4] border border-[#EAE3D5]">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#2D6A4F] mb-1.5">
                    <MessageSquareHeart className="w-4 h-4" />
                    จุดเด่นที่พี่ติวเตอร์ประทับใจ
                  </div>
                  <p className="text-sm text-[#1F1D1A] leading-relaxed">
                    {critiqueResult.compliment}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#FAF8F4] border border-[#EAE3D5]">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#2563EB] mb-1.5">
                    <Lightbulb className="w-4 h-4" />
                    ทริคแนะนำสำหรับชิ้นถัดไป
                  </div>
                  <p className="text-sm text-[#1F1D1A] leading-relaxed">
                    {critiqueResult.advice}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#FAF8F4] border border-[#EAE3D5]">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#D97706] mb-1.5">
                    <BookOpen className="w-4 h-4" />
                    เกร็ดศิลปะและแรงบันดาลใจ
                  </div>
                  <p className="text-sm text-[#1F1D1A] leading-relaxed">
                    {critiqueResult.designTip}
                  </p>
                </div>
              </div>

              {claimed ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] text-sm font-medium text-[#065F46]">
                    <CheckCircle2 className="w-4 h-4" />
                    รับเหรียญเข้ากระเป๋าและบันทึกลงแกลเลอรีเรียบร้อย!
                  </div>
                  <button
                    type="button"
                    onClick={handleResetUpload}
                    className="w-full py-2.5 min-h-[44px] rounded-xl border border-[#DED5C5] text-sm font-medium text-[#1F1D1A] hover:bg-[#FAF8F4] transition-colors cursor-pointer"
                  >
                    ส่งผลงานชิ้นใหม่เพิ่ม
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleClaim}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 min-h-[48px] rounded-xl bg-[#2563EB] text-white text-sm font-medium hover:bg-[#1D4ED8] active:scale-[0.98] transition-all cursor-pointer"
                >
                  <Coins className="w-4 h-4" />
                  รับ {critiqueResult.coinsEarned} Idea Coins & บันทึกลงแกลเลอรี
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white border border-[#E7E1D6] rounded-2xl p-6 sm:p-8 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-[#FAF8F4] border border-[#EAE3D5] flex items-center justify-center mx-auto text-[#D97706]">
                <MessageSquareHeart className="w-7 h-7" />
              </div>
              <div className="max-w-sm mx-auto space-y-1.5">
                <h2 className="text-base font-semibold text-[#1F1D1A]">
                  การ์ดคอมเมนต์จากพี่ติวเตอร์
                </h2>
                <p className="text-xs sm:text-sm text-[#6E675F] leading-relaxed">
                  เมื่อส่งรูปผลงานเข้ามา พี่ติวเตอร์ AI จะช่วยดูลายเส้น แสงเงา องค์ประกอบ พร้อมให้รางวัล 100 – 300 Idea Coins และ +10 ถึง +50 Studio Fame
                </p>
              </div>
              <div className="pt-2 text-xs text-[#8C8377]">
                คำแนะนำ: ถ่ายรูปในที่สว่างให้เห็นกระดาษเต็มแผ่น จะช่วยให้พี่ติวเตอร์วิเคราะห์รายละเอียดได้แม่นยำขึ้นนะ
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Personal Portfolio Gallery */}
      <section className="bg-white border border-[#E7E1D6] rounded-2xl p-5 sm:p-6">
        <div className="flex items-baseline justify-between gap-2 mb-4">
          <h2 className="text-base sm:text-lg font-semibold text-[#1F1D1A]">
            แกลเลอรีผลงานของฉัน ({gallery.length})
          </h2>
          <span className="text-xs text-[#6E675F]">คลิกที่ภาพเพื่ออ่านคอมเมนต์ย้อนหลัง</span>
        </div>

        {gallery.length === 0 ? (
          <div className="py-10 text-center text-sm text-[#6E675F] bg-[#FAF8F4] rounded-xl border border-[#EFEAE0]">
            ยังไม่มีผลงานในแกลเลอรี ลองอัปโหลดผลงานชิ้นแรกด้านบนเพื่อเก็บพอร์ตและรับเหรียญเลย!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {gallery.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedHistory(item)}
                className="group text-left rounded-xl border border-[#E7E1D6] bg-[#FAF8F4] overflow-hidden hover:border-[#C2B7A5] transition-all cursor-pointer"
              >
                <div className="aspect-[4/3] bg-white overflow-hidden">
                  <img
                    src={item.imageDataUrl}
                    alt={item.category}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                  />
                </div>
                <div className="p-3.5 space-y-1">
                  <div className="text-xs text-[#6E675F] font-mono-num">
                    {item.category} · {item.createdAt}
                  </div>
                  <p className="text-sm font-medium text-[#1F1D1A] line-clamp-2">
                    {item.critique.compliment}
                  </p>
                  <div className="text-xs font-mono-num text-[#D97706] pt-1">
                    +{item.critique.coinsEarned} 💡 · +{item.critique.fameEarned} ⭐
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Gallery Detail Modal */}
      {selectedHistory && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setSelectedHistory(null)}
        >
          <div
            className="bg-white border border-[#E7E1D6] rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs text-[#6E675F]">
                  {selectedHistory.category} · {selectedHistory.createdAt}
                </div>
                <h3 className="text-base font-semibold text-[#1F1D1A] mt-0.5">
                  บันทึกคอมเมนต์พี่ติวเตอร์
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedHistory(null)}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-[#6E675F] hover:bg-[#FAF8F4] cursor-pointer"
                aria-label="ปิดหน้าต่าง"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <img
              src={selectedHistory.imageDataUrl}
              alt={selectedHistory.category}
              referrerPolicy="no-referrer"
              className="w-full max-h-[280px] object-contain rounded-xl bg-[#FAF8F4] border border-[#EAE3D5]"
            />
            {selectedHistory.note && (
              <p className="text-xs text-[#6E675F]">โน้ตของฉัน: "{selectedHistory.note}"</p>
            )}
            <div className="space-y-2.5 text-sm">
              <p className="p-3 rounded-xl bg-[#FAF8F4] border border-[#EAE3D5]">
                <span className="font-semibold text-[#2D6A4F]">จุดเด่น: </span>
                {selectedHistory.critique.compliment}
              </p>
              <p className="p-3 rounded-xl bg-[#FAF8F4] border border-[#EAE3D5]">
                <span className="font-semibold text-[#2563EB]">คำแนะนำ: </span>
                {selectedHistory.critique.advice}
              </p>
              <p className="p-3 rounded-xl bg-[#FAF8F4] border border-[#EAE3D5]">
                <span className="font-semibold text-[#D97706]">เกร็ดศิลปะ: </span>
                {selectedHistory.critique.designTip}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
