import React, { useEffect, useMemo, useState } from 'react';
import {
  Brain,
  CalendarCheck2,
  CheckCircle2,
  Coins,
  HelpCircle,
  Loader2,
  Paintbrush,
  Shirt,
  ShoppingBag,
  Sparkles,
  Star,
  XCircle,
} from 'lucide-react';
import {
  AVATAR_SHOP_ITEMS,
  FLOOR_THEMES,
  STUDIO_ITEMS,
  WALL_THEMES,
} from '../data/catalog';
import {
  ALL_TPAT_QUESTIONS,
  DAILY_QUIZ_LIMIT,
  QuizEraFilter,
  QuizTrackFilter,
  getLocalDateKey,
  pickNonRepeatingQuizQuestion,
} from '../data/tpatQuizBank';
import { ItemCategory, QuizQuestion, StudioGameState } from '../types/studio';
import { ItemThumbnail } from './ItemThumbnail';

export type ShopFilter = 'all' | ItemCategory | 'surfaces' | 'avatar';

interface ShopAndQuizTabProps {
  state: StudioGameState;
  initialFilter?: ShopFilter;
  onBuyItem: (itemId: string) => void;
  onBuyWall: (wallId: string) => void;
  onSelectWall: (wallId: string) => void;
  onBuyFloor: (floorId: string) => void;
  onSelectFloor: (floorId: string) => void;
  onBuyAvatarItem: (itemId: string) => void;
  onGoToStudio: () => void;
  onQuizAnswered: (questionId: string, isCorrect: boolean) => void;
}

const FILTER_TABS: { id: ShopFilter; label: string }[] = [
  { id: 'all', label: 'ทั้งหมด' },
  { id: 'furniture', label: 'เฟอร์นิเจอร์' },
  { id: 'equipment', label: 'อุปกรณ์ศิลปะ' },
  { id: 'decor', label: 'ของตกแต่ง' },
  { id: 'surfaces', label: 'ผนัง & พื้น' },
  { id: 'avatar', label: 'แต่งตัวอวตาร' },
];

export const ShopAndQuizTab: React.FC<ShopAndQuizTabProps> = ({
  state,
  initialFilter = 'all',
  onBuyItem,
  onBuyWall,
  onSelectWall,
  onBuyFloor,
  onSelectFloor,
  onBuyAvatarItem,
  onGoToStudio,
  onQuizAnswered,
}) => {
  const [filter, setFilter] = useState<ShopFilter>(initialFilter);

  useEffect(() => {
    setFilter(initialFilter);
  }, [initialFilter]);

  // Quiz state
  const [quiz, setQuiz] = useState<QuizQuestion | null>(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizError, setQuizError] = useState<string | null>(null);
  const [poolNotice, setPoolNotice] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [askedQuestions, setAskedQuestions] = useState<string[]>([]);
  const [trackFilter, setTrackFilter] = useState<QuizTrackFilter>('mixed');
  const [eraFilter, setEraFilter] = useState<QuizEraFilter>('all');

  const todayKey = getLocalDateKey();
  const usedToday = state.dailyQuizDate === todayKey ? state.dailyQuizCount : 0;
  const remainingToday = Math.max(0, DAILY_QUIZ_LIMIT - usedToday);
  const quotaReached = remainingToday <= 0;

  const bankStats = useMemo(() => {
    const answeredSet = new Set(state.answeredQuizIds);
    const matching = ALL_TPAT_QUESTIONS.filter((q) => {
      if (trackFilter !== 'mixed' && q.examCode !== trackFilter) return false;
      if (eraFilter !== 'all' && q.era !== eraFilter) return false;
      return true;
    });
    const unseenInFilter = matching.filter((q) => !answeredSet.has(q.id)).length;
    const totalDone = ALL_TPAT_QUESTIONS.filter((q) => answeredSet.has(q.id)).length;
    return {
      filterTotal: matching.length,
      filterUnseen: unseenInFilter,
      totalBank: ALL_TPAT_QUESTIONS.length,
      totalDone,
    };
  }, [state.answeredQuizIds, trackFilter, eraFilter]);

  const handleStartBankQuiz = () => {
    if (quotaReached) {
      setQuizError(`วันนี้ทำควิซครบ ${DAILY_QUIZ_LIMIT} ข้อแล้ว พักสายตาแล้วพรุ่งนี้มาเก็บโจทย์ใหม่ต่อนะ!`);
      return;
    }

    const picked = pickNonRepeatingQuizQuestion(
      trackFilter,
      eraFilter,
      state.answeredQuizIds,
      quiz?.id
    );
    setQuizError(null);
    setSelectedOption(null);
    setQuiz(picked.question);
    setAskedQuestions((prev) => [...prev.slice(-12), picked.question.question]);
    if (picked.poolExhausted) {
      setPoolNotice(
        `ทำโจทย์ในหมวดนี้ครบทั้ง ${picked.totalCount} ข้อแล้ว ระบบกำลังสุ่มทบทวนแบบสลับตัวเลือกให้ใหม่`
      );
    } else {
      setPoolNotice(null);
    }
  };

  const handleLoadAiQuiz = async () => {
    if (quotaReached) {
      setQuizError(`วันนี้ทำควิซครบ ${DAILY_QUIZ_LIMIT} ข้อแล้ว พรุ่งนี้ค่อยสุ่มโจทย์ AI เพิ่มนะ!`);
      return;
    }

    setQuizLoading(true);
    setQuizError(null);
    setPoolNotice(null);
    setSelectedOption(null);

    try {
      const response = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examTrack: trackFilter === 'mixed' ? undefined : trackFilter,
          eraPreference: eraFilter === 'all' ? undefined : eraFilter,
          previousQuestions: askedQuestions,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'ไม่สามารถสร้างโจทย์ AI ได้ในขณะนี้');
      }
      const q = data as QuizQuestion;
      setQuiz(q);
      setAskedQuestions((prev) => [...prev.slice(-12), q.question]);
    } catch (err) {
      setQuizError(
        err instanceof Error
          ? err.message
          : 'ไม่สามารถเชื่อมต่อ AI สร้างโจทย์สดได้ ลองกดใช้โจทย์จากคลังข้อสอบ TPAT4/TPAT21 ได้เลยนะ'
      );
    } finally {
      setQuizLoading(false);
    }
  };

  const handleChooseOption = (idx: number) => {
    if (!quiz || selectedOption !== null || quotaReached) return;
    setSelectedOption(idx);
    onQuizAnswered(quiz.id, idx === quiz.correctIndex);
  };

  const filteredItems =
    filter === 'surfaces' || filter === 'avatar'
      ? []
      : filter === 'all'
      ? STUDIO_ITEMS
      : STUDIO_ITEMS.filter((item) => item.category === filter);

  const showSurfaces = filter === 'all' || filter === 'surfaces';
  const showAvatarFashion = filter === 'all' || filter === 'avatar';
  const purchasableAvatarItems = AVATAR_SHOP_ITEMS.filter((item) => item.price > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left/Main Column: Art Shop */}
      <section className="lg:col-span-7 xl:col-span-8 space-y-5">
        <div className="bg-white border border-[#E7E1D6] rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-lg sm:text-xl font-semibold text-[#1F1D1A] flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-[#2563EB]" />
                ร้านค้าอุปกรณ์สตูดิโอ & แฟชั่นอวตาร
              </h1>
              <p className="text-xs sm:text-sm text-[#6E675F] mt-0.5">
                นำ Idea Coins มาซื้อของแต่งห้อง 3D และชุดแต่งตัวอวตารเพื่ออัปเกรดค่า Studio Fame
              </p>
            </div>
            <div className="font-mono-num text-sm font-semibold text-[#D97706]">
              คงเหลือ {state.coins.toLocaleString()} 💡
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#FAF8F4] border border-[#EAE3D5] rounded-xl">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`px-3 py-2 min-h-[38px] rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  filter === tab.id
                    ? 'bg-[#1F1D1A] text-white'
                    : 'text-[#6E675F] hover:text-[#1F1D1A]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Avatar Fashion & Accessories Shop */}
          {showAvatarFashion && (
            <div className="space-y-3 pt-1">
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-2">
                  <Shirt className="w-4 h-4 text-[#A9623F]" />
                  <h2 className="text-base font-semibold text-[#1F1D1A]">
                    แฟชั่นอวตาร & พร็อพสายอาร์ต 3D
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={onGoToStudio}
                  className="text-xs font-medium text-[#2563EB] hover:underline cursor-pointer"
                >
                  กลับไปแต่งตัวในสตูดิโอ →
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {purchasableAvatarItems.map((avItem) => {
                  const isOwned = state.ownedAvatarItems.includes(avItem.id);
                  const canAfford = state.coins >= avItem.price;
                  const isEquipped =
                    state.avatar.outfitId === avItem.id ||
                    state.avatar.headwearId === avItem.id ||
                    state.avatar.glassesId === avItem.id ||
                    state.avatar.handItemId === avItem.id;

                  return (
                    <div
                      key={avItem.id}
                      className="flex flex-col justify-between p-4 rounded-xl border border-[#E7E1D6] bg-[#FAF8F4] hover:border-[#C2B7A5] transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-b from-[#6FA6E8] to-[#98C2F4] flex items-center justify-center shrink-0 shadow-xs">
                          <div className="flex items-center -space-x-1.5">
                            <span
                              className="w-6 h-6 rounded-full border-2 border-white shadow-xs"
                              style={{ backgroundColor: avItem.primaryHex }}
                            />
                            <span
                              className="w-5 h-5 rounded-full border-2 border-white shadow-xs"
                              style={{ backgroundColor: avItem.secondaryHex }}
                            />
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs text-[#6E675F]">
                            {avItem.slotLabel} ·{' '}
                            <span className="font-mono-num text-[#2D6A4F] font-medium">
                              +{avItem.fameBonus} Fame
                            </span>
                          </div>
                          <h3 className="text-sm font-semibold text-[#1F1D1A] mt-0.5">
                            {avItem.name}
                          </h3>
                          <p className="text-xs text-[#6E675F] mt-1 leading-relaxed">
                            {avItem.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-3 mt-3 border-t border-[#EAE3D5]">
                        <span className="text-xs text-[#6E675F]">
                          {isEquipped
                            ? 'สวมใส่อยู่ในห้อง'
                            : isOwned
                            ? 'มีในตู้เสื้อผ้าแล้ว'
                            : 'ปลดล็อก + สวมใส่ทันที'}
                        </span>
                        {isOwned ? (
                          <button
                            type="button"
                            onClick={onGoToStudio}
                            className="px-3 py-1.5 min-h-[36px] rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] text-xs font-medium cursor-pointer"
                          >
                            {isEquipped ? 'ใส่อยู่ · ไปห้อง' : 'ไปสวมใส่'}
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={!canAfford}
                            onClick={() => onBuyAvatarItem(avItem.id)}
                            className={`inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[38px] rounded-xl text-xs font-medium transition-all whitespace-nowrap shrink-0 ${
                              canAfford
                                ? 'bg-[#A9623F] text-white hover:bg-[#8E4F30] active:scale-[0.98] cursor-pointer'
                                : 'bg-[#E7E1D6] text-[#8C8377] cursor-not-allowed'
                            }`}
                          >
                            <Coins className="w-3.5 h-3.5" />
                            <span className="font-mono-num">{avItem.price}</span>
                            <span>{canAfford ? 'ซื้อ & ใส่เลย' : 'เหรียญไม่พอ'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Furniture / Equipment / Decor Grid */}
          {filteredItems.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#F1ECE2]">
              {filteredItems.map((item) => {
                const ownedCount = state.ownedItems[item.id] || 0;
                const canAfford = state.coins >= item.price;

                return (
                  <div
                    key={item.id}
                    className="flex flex-col justify-between p-4 rounded-xl border border-[#E7E1D6] bg-[#FAF8F4] hover:border-[#C2B7A5] transition-colors"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-20 h-20 rounded-xl bg-gradient-to-b from-[#6FA6E8] to-[#98C2F4] flex items-center justify-center shrink-0 shadow-xs">
                        <ItemThumbnail itemId={item.id} className="w-16 h-16" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs text-[#6E675F]">
                          {item.categoryLabel} ·{' '}
                          <span className="font-mono-num text-[#2D6A4F] font-medium">
                            +{item.fameBonus} Fame
                          </span>
                        </div>
                        <h3 className="text-sm sm:text-base font-semibold text-[#1F1D1A] mt-0.5">
                          {item.name}
                        </h3>
                        <p className="text-xs text-[#6E675F] mt-1 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-3 mt-3 border-t border-[#EAE3D5]">
                      <div className="text-xs text-[#6E675F] font-mono-num">
                        {ownedCount > 0 ? `มีแล้ว ${ownedCount} ชิ้น` : 'ยังไม่เคยซื้อ'}
                      </div>
                      <button
                        type="button"
                        disabled={!canAfford}
                        onClick={() => onBuyItem(item.id)}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap shrink-0 ${
                          canAfford
                            ? 'bg-[#2563EB] text-white hover:bg-[#1D4ED8] active:scale-[0.98] cursor-pointer'
                            : 'bg-[#E7E1D6] text-[#8C8377] cursor-not-allowed'
                        }`}
                      >
                        <Coins className="w-3.5 h-3.5" />
                        <span className="font-mono-num">{item.price}</span>
                        <span>{canAfford ? 'ซื้อเลย' : 'เหรียญไม่พอ'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Wall & Floor Surface Themes */}
          {showSurfaces && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2 pt-2 border-t border-[#F1ECE2]">
                <Paintbrush className="w-4 h-4 text-[#D97706]" />
                <h2 className="text-base font-semibold text-[#1F1D1A]">
                  ธีมสีผนังและวัสดุพื้นห้อง
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {WALL_THEMES.filter((w) => w.price > 0).map((wall) => {
                  const isOwned = state.ownedWalls.includes(wall.id);
                  const isActive = state.activeWallId === wall.id;
                  const canAfford = state.coins >= wall.price;

                  return (
                    <div
                      key={wall.id}
                      className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-[#E7E1D6] bg-[#FAF8F4]"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className="w-10 h-10 rounded-xl border border-black/10 shrink-0"
                          style={{ backgroundColor: wall.swatchColor }}
                        />
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-[#1F1D1A] truncate">
                            {wall.name}
                          </div>
                          <div className="text-xs text-[#6E675F] font-mono-num">
                            สีผนัง · +{wall.fameBonus} Fame
                          </div>
                        </div>
                      </div>
                      {isOwned ? (
                        <button
                          type="button"
                          onClick={() => onSelectWall(wall.id)}
                          className={`px-3 py-2 min-h-[38px] rounded-xl text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer ${
                            isActive
                              ? 'bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]'
                              : 'bg-white text-[#1F1D1A] border border-[#DED5C5] hover:bg-[#F1ECE2]'
                          }`}
                        >
                          {isActive ? 'ใช้อยู่' : 'เลือกใช้'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={!canAfford}
                          onClick={() => onBuyWall(wall.id)}
                          className={`px-3 py-2 min-h-[38px] rounded-xl text-xs font-medium font-mono-num whitespace-nowrap shrink-0 ${
                            canAfford
                              ? 'bg-[#2563EB] text-white hover:bg-[#1D4ED8] cursor-pointer'
                              : 'bg-[#E7E1D6] text-[#8C8377] cursor-not-allowed'
                          }`}
                        >
                          {wall.price} 💡 ซื้อ
                        </button>
                      )}
                    </div>
                  );
                })}

                {FLOOR_THEMES.filter((f) => f.price > 0).map((floor) => {
                  const isOwned = state.ownedFloors.includes(floor.id);
                  const isActive = state.activeFloorId === floor.id;
                  const canAfford = state.coins >= floor.price;

                  return (
                    <div
                      key={floor.id}
                      className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-[#E7E1D6] bg-[#FAF8F4]"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className="w-10 h-10 rounded-xl border border-black/10 shrink-0"
                          style={{ backgroundColor: floor.swatchColor }}
                        />
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-[#1F1D1A] truncate">
                            {floor.name}
                          </div>
                          <div className="text-xs text-[#6E675F] font-mono-num">
                            ลายพื้น · +{floor.fameBonus} Fame
                          </div>
                        </div>
                      </div>
                      {isOwned ? (
                        <button
                          type="button"
                          onClick={() => onSelectFloor(floor.id)}
                          className={`px-3 py-2 min-h-[38px] rounded-xl text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer ${
                            isActive
                              ? 'bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]'
                              : 'bg-white text-[#1F1D1A] border border-[#DED5C5] hover:bg-[#F1ECE2]'
                          }`}
                        >
                          {isActive ? 'ใช้อยู่' : 'เลือกใช้'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={!canAfford}
                          onClick={() => onBuyFloor(floor.id)}
                          className={`px-3 py-2 min-h-[38px] rounded-xl text-xs font-medium font-mono-num whitespace-nowrap shrink-0 ${
                            canAfford
                              ? 'bg-[#2563EB] text-white hover:bg-[#1D4ED8] cursor-pointer'
                              : 'bg-[#E7E1D6] text-[#8C8377] cursor-not-allowed'
                          }`}
                        >
                          {floor.price} 💡 ซื้อ
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Right Column: Mini-Quiz TPAT4 & TPAT21 */}
      <aside className="lg:col-span-5 xl:col-span-4 space-y-5">
        <div className="bg-white border border-[#E7E1D6] rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-start justify-between gap-3 pb-3.5 border-b border-[#F1ECE2]">
            <div>
              <div className="text-xs font-medium text-[#D97706] flex items-center gap-1.5">
                <Brain className="w-4 h-4" />
                คลังข้อสอบ TPAT4 &amp; TPAT21
              </div>
              <h2 className="text-lg font-semibold text-[#1F1D1A] mt-0.5">
                Mini-Quiz ประจำวัน
              </h2>
            </div>
            <div className="text-right font-mono-num">
              <div className="text-[11px] text-[#6E675F]">ตอบถูกสะสม</div>
              <div className="text-sm font-semibold text-[#2D6A4F]">
                {state.quizCorrectCount} / {state.quizAttemptCount} ข้อ
              </div>
            </div>
          </div>

          {/* Daily Quota & Non-Repeating Bank Tracker */}
          <div className="p-3.5 rounded-xl bg-[#FAF8F4] border border-[#EAE3D5] space-y-2.5">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-[#1F1D1A] flex items-center gap-1.5">
                <CalendarCheck2 className="w-4 h-4 text-[#2563EB]" />
                โควตาวันนี้
              </span>
              <span
                className={`font-mono-num font-semibold ${
                  quotaReached ? 'text-[#BE123C]' : 'text-[#2563EB]'
                }`}
              >
                {usedToday} / {DAILY_QUIZ_LIMIT} ข้อ{' '}
                <span className="font-sans font-normal text-[#6E675F]">
                  {quotaReached ? '(ครบแล้ววันนี้)' : `(เหลือ ${remainingToday} ข้อ)`}
                </span>
              </span>
            </div>

            <div className="grid grid-cols-5 gap-1.5" aria-label="ความคืบหน้าควิซวันนี้">
              {Array.from({ length: DAILY_QUIZ_LIMIT }).map((_, idx) => (
                <div
                  key={idx}
                  className={`h-2 rounded-sm transition-colors ${
                    idx < usedToday ? 'bg-[#2563EB]' : 'bg-[#E5DEC9]'
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center justify-between text-[11px] text-[#6E675F] pt-0.5">
              <span>ทำโจทย์ไม่ซ้ำแล้ว {bankStats.totalDone} / {bankStats.totalBank} ข้อ</span>
              <span className="font-mono-num text-[#2D6A4F] font-medium">
                เหลือในหมวด {bankStats.filterUnseen} ข้อ
              </span>
            </div>
          </div>

          {/* Track & Era Filters */}
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-1 p-1 bg-[#FAF8F4] border border-[#EAE3D5] rounded-xl">
              {(
                [
                  { id: 'mixed', label: 'รวม TPAT' },
                  { id: 'TPAT4', label: 'TPAT4 สถาปัตย์' },
                  { id: 'TPAT21', label: 'TPAT21 ศิลป์' },
                ] as { id: QuizTrackFilter; label: string }[]
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTrackFilter(t.id)}
                  className={`py-1.5 px-2 rounded-lg text-[11px] sm:text-xs font-medium transition-colors cursor-pointer ${
                    trackFilter === t.id
                      ? 'bg-[#1F1D1A] text-white'
                      : 'text-[#6E675F] hover:text-[#1F1D1A]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-1 p-1 bg-[#FAF8F4] border border-[#EAE3D5] rounded-xl">
              {(
                [
                  { id: 'all', label: 'ทุกช่วงปี' },
                  { id: 'past_5y', label: 'ย้อนหลัง 65–69' },
                  { id: 'forecast_5y', label: 'คาดการณ์ 70–74' },
                ] as { id: QuizEraFilter; label: string }[]
              ).map((era) => (
                <button
                  key={era.id}
                  type="button"
                  onClick={() => setEraFilter(era.id)}
                  className={`py-1.5 px-1.5 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                    eraFilter === era.id
                      ? 'bg-[#D97706] text-white'
                      : 'text-[#6E675F] hover:text-[#1F1D1A]'
                  }`}
                >
                  {era.label}
                </button>
              ))}
            </div>
          </div>

          {/* Daily Limit Reached Notice (when not viewing just-answered 5th explanation) */}
          {quotaReached && selectedOption === null && !quizLoading && (
            <div className="py-5 px-4 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] text-center space-y-2.5">
              <div className="w-12 h-12 rounded-2xl bg-white border border-[#FDE68A] flex items-center justify-center mx-auto text-[#D97706]">
                <CalendarCheck2 className="w-6 h-6" />
              </div>
              <div className="text-sm font-semibold text-[#92400E]">
                ทำควิซครบ {DAILY_QUIZ_LIMIT} ข้อสำหรับวันนี้แล้ว!
              </div>
              <p className="text-xs text-[#78350F] leading-relaxed">
                ระบบจำกัดการทำควิซไม่เกินวันละ {DAILY_QUIZ_LIMIT} ข้อ เพื่อให้น้องฝึกอย่างสม่ำเสมอทุกวันโดยไม่เจอโจทย์ซ้ำ พรุ่งนี้กลับมาเก็บอีก 5 ข้อนะ
              </p>
            </div>
          )}

          {/* Initial Empty State before starting */}
          {!quiz && !quizLoading && !quotaReached && (
            <div className="py-3 text-center space-y-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] flex items-center justify-center mx-auto text-[#D97706]">
                <HelpCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-[#1F1D1A]">
                  คลังโจทย์ TPAT4 &amp; TPAT21 รวม {bankStats.totalBank} ข้อไม่ซ้ำ
                </p>
                <p className="text-xs text-[#6E675F] leading-relaxed">
                  รวบรวมแนวข้อสอบจริงย้อนหลัง 5 ปี (2565–2569) และโจทย์คาดการณ์ 5 ปีข้างหน้า (2570–2574) ตอบถูกรับ{' '}
                  <span className="font-semibold text-[#D97706]">+50 💡</span> (วันละไม่เกิน {DAILY_QUIZ_LIMIT} ข้อ)
                </p>
              </div>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleStartBankQuiz}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 min-h-[46px] rounded-xl bg-[#D97706] text-white text-sm font-medium hover:bg-[#B45309] active:scale-[0.98] transition-all cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  เริ่มทำควิซ TPAT (+50 💡)
                </button>
                <button
                  type="button"
                  onClick={handleLoadAiQuiz}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 min-h-[38px] rounded-xl bg-[#FAF8F4] border border-[#DED5C5] text-xs font-medium text-[#1F1D1A] hover:bg-[#F1ECE2] transition-colors cursor-pointer"
                >
                  <Brain className="w-3.5 h-3.5 text-[#2563EB]" />
                  สุ่มโจทย์ AI คาดการณ์สด (Gemini)
                </button>
              </div>
            </div>
          )}

          {quizLoading && (
            <div className="py-10 text-center space-y-3">
              <Loader2 className="w-7 h-7 animate-spin text-[#D97706] mx-auto" />
              <p className="text-sm text-[#6E675F]">
                พี่ติวเตอร์ AI กำลังออกโจทย์แนวข้อสอบใหม่ให้...
              </p>
            </div>
          )}

          {quizError && (
            <div className="space-y-2.5">
              <div className="p-3.5 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] text-xs text-[#BE123C] leading-relaxed">
                {quizError}
              </div>
              {!quotaReached && (
                <button
                  type="button"
                  onClick={handleStartBankQuiz}
                  className="w-full py-2.5 min-h-[42px] rounded-xl bg-[#D97706] text-white text-xs sm:text-sm font-medium hover:bg-[#B45309] cursor-pointer"
                >
                  สุ่มโจทย์จากคลัง TPAT4/TPAT21 ทันที
                </button>
              )}
            </div>
          )}

          {poolNotice && !quizError && (
            <div className="p-2.5 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] text-[11px] text-[#1E40AF]">
              {poolNotice}
            </div>
          )}

          {quiz && !quizLoading && (!quotaReached || selectedOption !== null) && (
            <div className="space-y-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span
                    className={`px-2 py-0.5 rounded-md font-mono-num font-semibold text-[11px] ${
                      quiz.examCode === 'TPAT4'
                        ? 'bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]'
                        : 'bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]'
                    }`}
                  >
                    {quiz.examCode}
                  </span>
                  <span className="text-[#6E675F] font-medium">{quiz.yearLabel}</span>
                </div>
                <span className="font-mono-num font-semibold text-[#D97706]">+50 💡</span>
              </div>

              <div className="text-[11px] text-[#6E675F]">
                หมวด: <span className="font-medium text-[#1F1D1A]">{quiz.category}</span>
              </div>

              <p className="text-sm sm:text-base font-medium text-[#1F1D1A] leading-relaxed">
                {quiz.question}
              </p>

              <div className="space-y-2">
                {quiz.options.map((option, idx) => {
                  const isAnswered = selectedOption !== null;
                  const isCorrectChoice = idx === quiz.correctIndex;
                  const isUserPick = idx === selectedOption;

                  let btnClass =
                    'bg-[#FAF8F4] border-[#E7E1D6] text-[#1F1D1A] hover:border-[#2563EB] hover:bg-[#EFF6FF]';
                  if (isAnswered) {
                    if (isCorrectChoice) {
                      btnClass = 'bg-[#ECFDF5] border-[#10B981] text-[#065F46] font-medium';
                    } else if (isUserPick) {
                      btnClass = 'bg-[#FFF1F2] border-[#F43F5E] text-[#BE123C]';
                    } else {
                      btnClass = 'bg-[#FAF8F4] border-[#EFEAE0] text-[#8C8377] opacity-70';
                    }
                  }

                  return (
                    <button
                      key={`${quiz.id}-${idx}`}
                      type="button"
                      disabled={isAnswered || quotaReached}
                      onClick={() => handleChooseOption(idx)}
                      className={`w-full flex items-center justify-between gap-2.5 p-3.5 min-h-[46px] rounded-xl border text-left text-xs sm:text-sm transition-all ${
                        isAnswered || quotaReached ? 'cursor-default' : 'cursor-pointer'
                      } ${btnClass}`}
                    >
                      <span className="leading-snug">
                        <span className="font-mono-num font-semibold mr-2">
                          {['ก.', 'ข.', 'ค.', 'ง.'][idx]}
                        </span>
                        {option}
                      </span>
                      {isAnswered && isCorrectChoice && (
                        <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" />
                      )}
                      {isAnswered && isUserPick && !isCorrectChoice && (
                        <XCircle className="w-4 h-4 text-[#E11D48] shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {selectedOption !== null && (
                <div className="space-y-3 pt-2">
                  <div
                    className={`p-3.5 rounded-xl border text-xs sm:text-sm leading-relaxed ${
                      selectedOption === quiz.correctIndex
                        ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]'
                        : 'bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]'
                    }`}
                  >
                    <div className="font-semibold mb-1">
                      {selectedOption === quiz.correctIndex
                        ? 'ถูกต้องเป๊ะ! รับไปเลย +50 Idea Coins'
                        : 'เกือบถูกแล้ว! มาดูเฉลยกันนะ'}
                    </div>
                    <p>{quiz.explanation}</p>
                  </div>

                  {quotaReached ? (
                    <div className="p-3.5 rounded-xl bg-[#FAF8F4] border border-[#E7E1D6] text-xs text-[#6E675F] leading-relaxed text-center">
                      <strong className="text-[#1F1D1A] block mb-0.5">
                        เก่งมาก! ทำควิซครบ {DAILY_QUIZ_LIMIT} / {DAILY_QUIZ_LIMIT} ข้อของวันนี้แล้ว
                      </strong>
                      พรุ่งนี้กลับมาสุ่มโจทย์ชุดใหม่แบบไม่ซ้ำกันได้อีก 5 ข้อนะ
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2">
                      <button
                        type="button"
                        onClick={handleStartBankQuiz}
                        className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 min-h-[44px] rounded-xl bg-[#1F1D1A] text-white text-sm font-medium hover:bg-[#33302B] transition-colors cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4 text-[#FBBF24]" />
                        ลุยโจทย์ข้อถัดไป (เหลือ {remainingToday} ข้อวันนี้)
                      </button>
                      <button
                        type="button"
                        onClick={handleLoadAiQuiz}
                        className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 min-h-[38px] rounded-xl bg-[#FAF8F4] border border-[#DED5C5] text-xs font-medium text-[#1F1D1A] hover:bg-[#F1ECE2] transition-colors cursor-pointer"
                      >
                        <Brain className="w-3.5 h-3.5 text-[#2563EB]" />
                        สุ่มโจทย์ AI คาดการณ์สด
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tip Box */}
        <div className="bg-[#FAF6EE] border border-[#E5DCCB] rounded-2xl p-4 text-xs text-[#6E675F] space-y-1.5">
          <div className="font-semibold text-[#1F1D1A] flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-[#D97706]" />
            เคล็ดลับปั๊มเหรียญไว
          </div>
          <p className="leading-relaxed">
            ถ่ายรูปงานสเก็ตช์ส่งตรวจในแท็บ <strong className="text-[#1F1D1A]">ส่งงานตรวจ</strong>{' '}
            ได้ครั้งละ 100–300 💡 และแวะส่งสติกเกอร์ให้เพื่อนในแท็บ{' '}
            <strong className="text-[#1F1D1A]">ส่องห้องเพื่อน</strong> ได้อีกคนละ 20 💡 ด้วยนะ!
          </p>
        </div>
      </aside>
    </div>
  );
};
