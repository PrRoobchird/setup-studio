import React, { useRef, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  Camera,
  CheckCircle2,
  ClipboardList,
  Coins,
  ImagePlus,
  Lightbulb,
  Loader2,
  MessageSquareHeart,
  Sparkles,
  Star,
  ThumbsUp,
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

const SAMPLE_ARTWORKS: {
  label: string;
  category: ArtCategory;
  url: string;
  sampleBrief: string;
}[] = [
  {
    label: 'สเก็ตช์ศาลาไม้ (สถาปัตย์)',
    category: 'สถาปัตยกรรม',
    url: '/src/assets/images/art_sketch_arch_1795454543369.jpg',
    sampleBrief:
      'ออกแบบและสเก็ตช์ Perspective 2 จุด ของศาลาพักผ่อนไม้สไตล์โมเดิร์นในสวน ใช้ปากกาตัดเส้นร่วมกับการลงน้ำหนักมาร์คเกอร์โทนเทา พร้อมใส่สเกลคนและองค์ประกอบต้นไม้เพื่อบอกขนาดอาคาร',
  },
  {
    label: 'หุ่นนิ่งแสงเงา (Drawing)',
    category: 'วาดเส้น Drawing',
    url: '/src/assets/images/art_charcoal_stilllife_1795454545851.jpg',
    sampleBrief:
      'วาดเส้น Drawing หุ่นนิ่งบนกระดาษด้วยดินสอ EE/ชาร์โคล เน้นการขึ้นโครงสร้างสัดส่วนเรขาคณิตให้แม่นยำ แยกค่าน้ำหนักแสง-เงา 5 ระดับ และแสดงพื้นผิววัสดุให้ชัดเจน',
  },
];

function getStarTierLabel(stars: number): { label: string; toneClass: string } {
  if (stars >= 10) {
    return {
      label: 'ระดับ 10 ดาว · สมบูรณ์แบบไร้ที่ติ (หายากที่สุด)',
      toneClass: 'bg-[#FEF3C7] text-[#92400E] border-[#F59E0B]',
    };
  }
  if (stars >= 9) {
    return {
      label: 'ระดับหัวกะทิ · โดดเด่นพร้อมยื่นพอร์ตระดับท็อป',
      toneClass: 'bg-[#ECFDF5] text-[#065F46] border-[#10B981]',
    };
  }
  if (stars >= 8) {
    return {
      label: 'ดีมาก · ตรงโจทย์และคุมฝีมือได้ดี พร้อมใช้ลงพอร์ต',
      toneClass: 'bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]',
    };
  }
  if (stars >= 6) {
    return {
      label: 'มาตรฐาน ม.ปลาย · พอใช้ได้ ต้องเกลาจุดด้อยเพิ่ม',
      toneClass: 'bg-[#EFF6FF] text-[#1E3A8A] border-[#BFDBFE]',
    };
  }
  if (stars >= 4) {
    return {
      label: 'ระดับฝึกหัด · ยังไม่ผ่านเกณฑ์พอร์ต ควรแก้ตามคอมเมนต์',
      toneClass: 'bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]',
    };
  }
  if (stars >= 1) {
    return {
      label: 'ต้องปรับปรุงด่วน · หลุดโจทย์หรือมีจุดบกพร่องหลายจุด',
      toneClass: 'bg-[#FFF1F2] text-[#9F1239] border-[#FECDD3]',
    };
  }
  return {
    label: '0 ดาว · ไม่ตรงโจทย์หรืองานยังไม่สมบูรณ์',
    toneClass: 'bg-[#FFF1F2] text-[#9F1239] border-[#FDA4AF]',
  };
}

function renderStarRow(stars: number, sizeClass = 'w-4 h-4') {
  const clamped = Math.min(10, Math.max(0, Math.round(stars)));
  return (
    <div className="flex items-center gap-0.5 flex-wrap" aria-label={`คะแนน ${clamped} จาก 10 ดาว`}>
      {Array.from({ length: 10 }, (_, idx) => {
        const filled = idx < clamped;
        return (
          <Star
            key={idx}
            className={`${sizeClass} ${
              filled
                ? 'fill-[#F59E0B] text-[#D97706]'
                : 'fill-transparent text-[#D6CCB9]'
            }`}
          />
        );
      })}
    </div>
  );
}

export const ArtCritiqueTab: React.FC<ArtCritiqueTabProps> = ({
  studentTrack,
  gallery,
  onClaimCritique,
}) => {
  const [category, setCategory] = useState<ArtCategory>('วาดเส้น Drawing');
  const [assignmentBrief, setAssignmentBrief] = useState('');
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
    if (!assignmentBrief.trim()) {
      setAssignmentBrief(sample.sampleBrief);
    }
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
    if (!assignmentBrief.trim()) {
      setErrorMsg('กรุณากรอก "โจทย์งานอย่างละเอียด" ก่อนส่งตรวจ เพื่อให้พี่ติวประเมินคะแนน 0–10 ดาวตามโจทย์ได้แม่นยำ');
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
          assignmentBrief: assignmentBrief.trim(),
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
      assignmentBrief: assignmentBrief.trim(),
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
    setErrorMsg(null);
  };

  const resultStars = critiqueResult ? critiqueResult.starRating : 0;
  const tierInfo = getStarTierLabel(resultStars);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Upload & Form Column */}
        <section className="lg:col-span-6 bg-white border border-[#E7E1D6] rounded-2xl p-5 sm:p-6 space-y-5">
          <div>
            <h1 className="text-lg sm:text-xl font-semibold text-[#1F1D1A]">
              ส่งผลงานจริงให้พี่ติวเตอร์ประเมิน (0–10 ดาว)
            </h1>
            <p className="text-xs sm:text-sm text-[#6E675F] mt-1">
              พี่ติวจะตรวจเทียบกับโจทย์และมาตรฐานเด็ก ม.ปลาย เข้าคณะศิลปะ/ออกแบบยุคปัจจุบันแบบตรงไปตรงมา ไม่อวย พร้อมบอกทั้งข้อดีและข้อด้อยเพื่อพัฒนาต่อ
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

                {/* Quick sample artworks */}
                <div className="pt-3 border-t border-[#EAE3D5]">
                  <p className="text-xs text-[#6E675F] mb-2">
                    ยังไม่มีรูปในเครื่อง? ทดลองส่งภาพตัวอย่างพร้อมโจทย์ได้เลย:
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

          {/* Detailed Assignment Brief (Required for 0-10 Star Rating) */}
          <div className="space-y-1.5">
            <label
              htmlFor="assignment-brief"
              className="flex items-center justify-between gap-2 text-xs font-semibold text-[#1F1D1A]"
            >
              <span className="inline-flex items-center gap-1.5">
                <ClipboardList className="w-4 h-4 text-[#2563EB]" />
                โจทย์งานอย่างละเอียด (อ้างอิงเกณฑ์ให้คะแนน 0–10 ดาว)
              </span>
              <span className="text-[11px] font-normal text-[#BE123C]">*จำเป็นต้องระบุ</span>
            </label>
            <textarea
              id="assignment-brief"
              rows={4}
              value={assignmentBrief}
              onChange={(e) => setAssignmentBrief(e.target.value)}
              placeholder="ระบุรายละเอียดโจทย์ให้ครบ เช่น หัวข้อ/คอนเซปต์, องค์ประกอบที่โจทย์บังคับต้องมี, เทคนิค/วัสดุที่ใช้ (เช่น ดินสอ EE, สีน้ำ, โคปิก), และเป้าหมายระดับสอบเข้า..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F4] border border-[#E7E1D6] text-sm text-[#1F1D1A] placeholder:text-[#9C948A] focus:outline-none focus:border-[#2563EB] leading-relaxed"
            />
            <p className="text-[11px] text-[#6E675F]">
              ยิ่งใส่โจทย์ละเอียด พี่ติวจะยิ่งตรวจเช็กความตรงโจทย์ ข้อดี และข้อด้อยได้แม่นยำ (คะแนน 10 ดาวต้องสมบูรณ์แบบไร้ที่ติทั้งฝีมือและตรงโจทย์ 100%)
            </p>
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
                พี่ติวเตอร์กำลังตรวจเช็กเทียบโจทย์และให้คะแนน...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-[#FBBF24]" />
                ส่งงานให้พี่ติวเตอร์ตรวจตามโจทย์
              </>
            )}
          </button>
        </section>

        {/* Right Column: Strict Tutor Critique Result Card */}
        <section className="lg:col-span-6">
          {critiqueResult ? (
            <div className="bg-white border border-[#E7E1D6] rounded-2xl p-5 sm:p-6 space-y-5">
              {/* Top Scoreboard: 0-10 Stars + Rewards */}
              <div className="space-y-3 pb-4 border-b border-[#F1ECE2]">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium text-[#2563EB]">
                      ผลประเมินเทียบมาตรฐานพอร์ต ม.ปลาย เข้ามหาวิทยาลัย
                    </p>
                    <h2 className="text-lg font-semibold text-[#1F1D1A] mt-0.5">
                      ผลการตรวจจากพี่ติวเตอร์
                    </h2>
                  </div>
                  <div className="flex items-center gap-3 font-mono-num">
                    <div className="text-right">
                      <div className="text-[11px] text-[#6E675F]">Idea Coins</div>
                      <div className="text-base sm:text-lg font-bold text-[#D97706] flex items-center gap-1">
                        <Coins className="w-4 h-4" />+{critiqueResult.coinsEarned}
                      </div>
                    </div>
                    <div className="h-8 w-px bg-[#ECE6DA]" />
                    <div className="text-right">
                      <div className="text-[11px] text-[#6E675F]">Studio Fame</div>
                      <div className="text-base sm:text-lg font-bold text-[#2D6A4F] flex items-center gap-1">
                        <Star className="w-4 h-4" />+{critiqueResult.fameEarned}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 0-10 Star Bar */}
                <div className="p-4 rounded-2xl bg-[#FAF8F4] border border-[#E7E1D6] space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-[#6E675F]">
                      คะแนนประเมินผลงาน (0–10 ดาว)
                    </span>
                    <span className="font-mono-num text-xl font-bold text-[#1F1D1A]">
                      {resultStars} <span className="text-sm font-normal text-[#6E675F]">/ 10 ดาว</span>
                    </span>
                  </div>
                  {renderStarRow(resultStars, 'w-5 h-5')}
                  <div
                    className={`inline-block mt-1 px-2.5 py-1 rounded-lg border text-xs font-medium ${tierInfo.toneClass}`}
                  >
                    {tierInfo.label}
                  </div>
                </div>

                {assignmentBrief.trim() && (
                  <div className="p-3 rounded-xl bg-[#F8F6F2] border border-[#ECE6DA] text-xs text-[#6E675F]">
                    <span className="font-semibold text-[#1F1D1A]">โจทย์ที่ใช้ประเมิน: </span>
                    {assignmentBrief}
                  </div>
                )}
              </div>

              {/* 4 Honest Critique Insights: Strengths, Weaknesses, Action Plan, Admission Standard */}
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-[#ECFDF5]/60 border border-[#A7F3D0]">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#065F46] mb-1.5">
                    <ThumbsUp className="w-4 h-4" />
                    ข้อดีของชิ้นงาน (จุดที่ทำได้ตามเกณฑ์)
                  </div>
                  <p className="text-sm text-[#1F1D1A] leading-relaxed">
                    {critiqueResult.compliment}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#FFF1F2]/75 border border-[#FECDD3]">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#BE123C] mb-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    ข้อด้อย & จุดบกพร่องที่ต้องแก้ไข (ตรวจตามจริง)
                  </div>
                  <p className="text-sm text-[#1F1D1A] leading-relaxed">
                    {critiqueResult.weaknesses}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#EFF6FF]/70 border border-[#BFDBFE]">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#1E40AF] mb-1.5">
                    <Lightbulb className="w-4 h-4" />
                    แนวทางแก้ไขเพื่อพัฒนาชิ้นงานต่ออย่างถูกต้อง
                  </div>
                  <p className="text-sm text-[#1F1D1A] leading-relaxed">
                    {critiqueResult.advice}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#FAF8F4] border border-[#EAE3D5]">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#B45309] mb-1.5">
                    <BookOpen className="w-4 h-4" />
                    มุมมองมาตรฐานพอร์ตเข้ามหาวิทยาลัยปัจจุบัน
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
                    บันทึกคะแนน {resultStars}/10 ดาว และรับเหรียญเข้าคลังเรียบร้อย!
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
                  รับ {critiqueResult.coinsEarned} Idea Coins & บันทึกผลตรวจลงแกลเลอรี
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white border border-[#E7E1D6] rounded-2xl p-6 sm:p-8 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-[#FAF8F4] border border-[#EAE3D5] flex items-center justify-center mx-auto text-[#D97706]">
                <MessageSquareHeart className="w-7 h-7" />
              </div>
              <div className="max-w-md mx-auto space-y-2">
                <h2 className="text-base font-semibold text-[#1F1D1A]">
                  เกณฑ์การตรวจประเมินผลงาน 0–10 ดาว
                </h2>
                <p className="text-xs sm:text-sm text-[#6E675F] leading-relaxed">
                  พี่ติวเตอร์จะตรวจแบบไม่อวย ชี้ทั้ง <strong>ข้อดี</strong> และ <strong>ข้อด้อยที่ต้องแก้</strong> เทียบกับ <strong>โจทย์งานอย่างละเอียด</strong> และมาตรฐานการยื่นพอร์ตเข้าคณะศิลปะและการออกแบบในปัจจุบัน
                </p>
              </div>
              <div className="max-w-md mx-auto text-left p-4 rounded-xl bg-[#FAF8F4] border border-[#EAE3D5] text-xs text-[#6E675F] space-y-1.5">
                <div><strong className="text-[#1F1D1A]">0 ดาว:</strong> ไม่ตรงโจทย์เลย งานยังไม่เสร็จ หรือขาดพื้นฐานจนประเมินไม่ได้</div>
                <div><strong className="text-[#1F1D1A]">1–5 ดาว:</strong> ผิดโจทย์บางส่วน สัดส่วน/แสงเงา/องค์ประกอบยังมีข้อบกพร่องต้องแก้</div>
                <div><strong className="text-[#1F1D1A]">6–8 ดาว:</strong> คุณภาพดีระดับ ม.ปลาย ตอบโจทย์ชัด มีพัฒนาการพร้อมต่อยอดลงพอร์ต</div>
                <div><strong className="text-[#D97706]">9–10 ดาว:</strong> ได้ยากมาก! โดยเฉพาะ 10 ดาวต้องสมบูรณ์แบบไร้ที่ติทั้งแนวคิด เทคนิค และตรงโจทย์ 100%</div>
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
          <span className="text-xs text-[#6E675F]">คลิกที่ภาพเพื่ออ่านผลประเมินและข้อด้อยย้อนหลัง</span>
        </div>

        {gallery.length === 0 ? (
          <div className="py-10 text-center text-sm text-[#6E675F] bg-[#FAF8F4] rounded-xl border border-[#EFEAE0]">
            ยังไม่มีผลงานในแกลเลอรี ลองกรอกโจทย์และอัปโหลดผลงานชิ้นแรกด้านบนได้เลย!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {gallery.map((item) => {
              const stars = typeof item.critique.starRating === 'number' ? item.critique.starRating : 6;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedHistory(item)}
                  className="group text-left rounded-xl border border-[#E7E1D6] bg-[#FAF8F4] overflow-hidden hover:border-[#C2B7A5] transition-all cursor-pointer"
                >
                  <div className="aspect-[4/3] bg-white overflow-hidden relative">
                    <img
                      src={item.imageDataUrl}
                      alt={item.category}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                    />
                    <span className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-[#1F1D1A]/85 text-white font-mono-num text-xs font-bold flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-[#FBBF24] text-[#FBBF24]" />
                      {stars}/10
                    </span>
                  </div>
                  <div className="p-3.5 space-y-1.5">
                    <div className="text-xs text-[#6E675F] font-mono-num">
                      {item.category} · {item.createdAt}
                    </div>
                    {(item.assignmentBrief || item.note) && (
                      <p className="text-xs font-medium text-[#1F1D1A] line-clamp-1">
                        โจทย์: {item.assignmentBrief || item.note}
                      </p>
                    )}
                    <p className="text-xs text-[#6E675F] line-clamp-2">
                      {item.critique.weaknesses || item.critique.compliment}
                    </p>
                    <div className="text-xs font-mono-num text-[#D97706] pt-0.5">
                      +{item.critique.coinsEarned} 💡 · +{item.critique.fameEarned} ⭐
                    </div>
                  </div>
                </button>
              );
            })}
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
                  บันทึกผลประเมินจากพี่ติวเตอร์ ({selectedHistory.critique.starRating ?? 6}/10 ดาว)
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
              className="w-full max-h-[260px] object-contain rounded-xl bg-[#FAF8F4] border border-[#EAE3D5]"
            />
            {renderStarRow(selectedHistory.critique.starRating ?? 6, 'w-4 h-4')}
            {(selectedHistory.assignmentBrief || selectedHistory.note) && (
              <p className="p-3 rounded-xl bg-[#F8F6F2] border border-[#ECE6DA] text-xs text-[#475569]">
                <span className="font-semibold text-[#1F1D1A]">โจทย์งาน: </span>
                {selectedHistory.assignmentBrief || selectedHistory.note}
              </p>
            )}
            <div className="space-y-2.5 text-sm">
              <p className="p-3 rounded-xl bg-[#ECFDF5]/60 border border-[#A7F3D0]">
                <span className="font-semibold text-[#065F46]">ข้อดี: </span>
                {selectedHistory.critique.compliment}
              </p>
              {selectedHistory.critique.weaknesses && (
                <p className="p-3 rounded-xl bg-[#FFF1F2]/75 border border-[#FECDD3]">
                  <span className="font-semibold text-[#BE123C]">ข้อด้อย & จุดต้องแก้: </span>
                  {selectedHistory.critique.weaknesses}
                </p>
              )}
              <p className="p-3 rounded-xl bg-[#EFF6FF]/70 border border-[#BFDBFE]">
                <span className="font-semibold text-[#1E40AF]">แนวทางพัฒนาต่อ: </span>
                {selectedHistory.critique.advice}
              </p>
              <p className="p-3 rounded-xl bg-[#FAF8F4] border border-[#EAE3D5]">
                <span className="font-semibold text-[#B45309]">มาตรฐานสอบเข้า: </span>
                {selectedHistory.critique.designTip}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
