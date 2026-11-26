import React, { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  Brain,
  CalendarCheck2,
  CheckCircle2,
  HelpCircle,
  Loader2,
  Sparkles,
  Star,
  XCircle,
} from 'lucide-react';
import { QUIZ_CORRECT_REWARD } from '../data/catalog';
import {
  ALL_TPAT_QUESTIONS,
  DAILY_QUIZ_LIMIT,
  QuizEraFilter,
  QuizTrackFilter,
  getLocalDateKey,
  pickNonRepeatingQuizQuestion,
} from '../data/tpatQuizBank';
import { QuizExamCode, QuizQuestion, StudioGameState } from '../types/studio';

interface QuizTabProps {
  state: StudioGameState;
  initialTrack?: QuizTrackFilter;
  onQuizAnswered: (questionId: string, isCorrect: boolean) => void;
  onGoToCritique: () => void;
  onGoToShop: () => void;
  onGoToLibrary?: (examCode?: QuizExamCode) => void;
}

export const QuizTab: React.FC<QuizTabProps> = ({
  state,
  initialTrack,
  onQuizAnswered,
  onGoToCritique,
  onGoToShop,
  onGoToLibrary,
}) => {
  const [quiz, setQuiz] = useState<QuizQuestion | null>(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizError, setQuizError] = useState<string | null>(null);
  const [poolNotice, setPoolNotice] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [askedQuestions, setAskedQuestions] = useState<string[]>([]);
  const [trackFilter, setTrackFilter] = useState<QuizTrackFilter>(initialTrack ?? 'mixed');
  const [eraFilter, setEraFilter] = useState<QuizEraFilter>('all');

  useEffect(() => {
    if (initialTrack) {
      setTrackFilter(initialTrack);
    }
  }, [initialTrack]);

  const todayKey = getLocalDateKey();
  const usedToday = state.dailyQuizDate === todayKey ? state.dailyQuizCount : 0;
  const remainingToday = Math.max(0, DAILY_QUIZ_LIMIT - usedToday);
  const quotaReached = remainingToday <= 0;

  const accuracyPct =
    state.quizAttemptCount > 0
      ? Math.round((state.quizCorrectCount / state.quizAttemptCount) * 100)
      : 0;

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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Main Quiz Arena */}
      <section className="lg:col-span-8 bg-white border border-[#E7E1D6] rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-[#F1ECE2]">
          <div>
            <div className="text-xs font-medium text-[#D97706] flex items-center gap-1.5">
              <Brain className="w-4 h-4" />
              สนามฝึกซ้อม TPAT4 &amp; TPAT21 (TCAS)
            </div>
            <h1 className="text-lg sm:text-xl font-semibold text-[#1F1D1A] mt-0.5">
              Mini-Quiz เตรียมสอบศิลปะ &amp; สถาปัตย์ประจำวัน
            </h1>
            <p className="text-xs sm:text-sm text-[#6E675F] mt-1">
              รวมแนวข้อสอบจริงย้อนหลัง 5 ปี (2565–2569) และข้อสอบคาดการณ์ล่วงหน้า 5 ปี (2570–2574) ตอบถูกรับ{' '}
              <span className="font-semibold text-[#D97706]">+{QUIZ_CORRECT_REWARD} Idea Coins</span>
            </p>
          </div>
          <div className="text-right font-mono-num">
            <div className="text-[11px] text-[#6E675F]">ความแม่นยำสะสม</div>
            <div className="text-base font-bold text-[#2D6A4F]">
              {state.quizCorrectCount} / {state.quizAttemptCount} ข้อ ({accuracyPct}%)
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                className={`py-2 px-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
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
                className={`py-2 px-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
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

        {/* Daily Limit Reached */}
        {quotaReached && selectedOption === null && !quizLoading && (
          <div className="py-8 px-5 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-white border border-[#FDE68A] flex items-center justify-center mx-auto text-[#D97706]">
              <CalendarCheck2 className="w-7 h-7" />
            </div>
            <div className="text-base font-semibold text-[#92400E]">
              ทำควิซครบ {DAILY_QUIZ_LIMIT} ข้อสำหรับวันนี้แล้ว!
            </div>
            <p className="text-xs sm:text-sm text-[#78350F] max-w-md mx-auto leading-relaxed">
              ระบบกำหนดทำควิซวันละไม่เกิน {DAILY_QUIZ_LIMIT} ข้อ เพื่อฝึกอย่างสม่ำเสมอระยะยาวและเก็บคลังโจทย์ไม่ซ้ำได้นานกว่า 1 เดือน พรุ่งนี้กลับมาเก็บอีก 5 ข้อนะ
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={onGoToCritique}
                className="px-4 py-2.5 rounded-xl bg-[#2563EB] text-white text-xs sm:text-sm font-medium hover:bg-[#1D4ED8] cursor-pointer"
              >
                ไปส่งงานให้พี่ติวตรวจ
              </button>
              <button
                type="button"
                onClick={onGoToShop}
                className="px-4 py-2.5 rounded-xl bg-white border border-[#DED5C5] text-[#1F1D1A] text-xs sm:text-sm font-medium hover:bg-[#FAF8F4] cursor-pointer"
              >
                แวะช้อปอุปกรณ์เข้าห้อง
              </button>
            </div>
          </div>
        )}

        {/* Initial Start Card */}
        {!quiz && !quizLoading && !quotaReached && (
          <div className="py-6 px-4 text-center space-y-4 rounded-2xl bg-[#FAF8F4] border border-[#EAE3D5]">
            <div className="w-14 h-14 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] flex items-center justify-center mx-auto text-[#D97706]">
              <HelpCircle className="w-7 h-7" />
            </div>
            <div className="space-y-1.5 max-w-md mx-auto">
              <p className="text-base font-semibold text-[#1F1D1A]">
                พร้อมลุยโจทย์วันนี้หรือยัง? (เหลือ {remainingToday} ข้อวันนี้)
              </p>
              <p className="text-xs sm:text-sm text-[#6E675F] leading-relaxed">
                คลังโจทย์ไม่ซ้ำในหมวดที่เลือกมีอยู่{' '}
                <strong className="text-[#1F1D1A]">{bankStats.filterUnseen} ข้อ</strong> จากทั้งหมด{' '}
                {bankStats.filterTotal} ข้อ
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 max-w-md mx-auto">
              <button
                type="button"
                onClick={handleStartBankQuiz}
                className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 min-h-[46px] rounded-xl bg-[#D97706] text-white text-sm font-medium hover:bg-[#B45309] active:scale-[0.98] transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                เริ่มทำควิซ TPAT (+{QUIZ_CORRECT_REWARD} 💡)
              </button>
              <button
                type="button"
                onClick={handleLoadAiQuiz}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-3 min-h-[46px] rounded-xl bg-white border border-[#DED5C5] text-xs sm:text-sm font-medium text-[#1F1D1A] hover:bg-[#F1ECE2] transition-colors cursor-pointer"
              >
                <Brain className="w-4 h-4 text-[#2563EB]" />
                สุ่มโจทย์ AI สด
              </button>
            </div>
          </div>
        )}

        {quizLoading && (
          <div className="py-12 text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#D97706] mx-auto" />
            <p className="text-sm text-[#6E675F]">
              พี่ติวเตอร์ AI กำลังออกโจทย์แนวข้อสอบใหม่ให้...
            </p>
          </div>
        )}

        {quizError && (
          <div className="space-y-2.5">
            <div className="p-3.5 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] text-xs sm:text-sm text-[#BE123C]">
              {quizError}
            </div>
            {!quotaReached && (
              <button
                type="button"
                onClick={handleStartBankQuiz}
                className="px-4 py-2.5 min-h-[42px] rounded-xl bg-[#D97706] text-white text-xs sm:text-sm font-medium hover:bg-[#B45309] cursor-pointer"
              >
                สุ่มโจทย์จากคลัง TPAT4/TPAT21 ทันที
              </button>
            )}
          </div>
        )}

        {poolNotice && !quizError && (
          <div className="p-3 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] text-xs text-[#1E40AF]">
            {poolNotice}
          </div>
        )}

        {quiz && !quizLoading && (!quotaReached || selectedOption !== null) && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#6E675F]">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono-num font-semibold text-[#1F1D1A]">
                  {quiz.examCode}
                </span>
                <span aria-hidden="true">·</span>
                <span>{quiz.yearLabel}</span>
                <span aria-hidden="true">·</span>
                <span className="text-[#1F1D1A] font-medium">{quiz.category}</span>
              </div>
              <span className="font-mono-num font-semibold text-[#D97706]">
                +{QUIZ_CORRECT_REWARD} 💡
              </span>
            </div>

            <p className="text-base sm:text-lg font-medium text-[#1F1D1A] leading-relaxed">
              {quiz.question}
            </p>

            <div className="space-y-2.5">
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
                    className={`w-full flex items-center justify-between gap-3 p-4 min-h-[50px] rounded-xl border text-left text-sm transition-all ${
                      isAnswered || quotaReached ? 'cursor-default' : 'cursor-pointer'
                    } ${btnClass}`}
                  >
                    <span className="leading-snug">
                      <span className="font-mono-num font-semibold mr-2.5">
                        {['ก.', 'ข.', 'ค.', 'ง.'][idx]}
                      </span>
                      {option}
                    </span>
                    {isAnswered && isCorrectChoice && (
                      <CheckCircle2 className="w-5 h-5 text-[#059669] shrink-0" />
                    )}
                    {isAnswered && isUserPick && !isCorrectChoice && (
                      <XCircle className="w-5 h-5 text-[#E11D48] shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {selectedOption !== null && (
              <div className="space-y-3 pt-2">
                <div
                  className={`p-4 rounded-xl border text-sm leading-relaxed ${
                    selectedOption === quiz.correctIndex
                      ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]'
                      : 'bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]'
                  }`}
                >
                  <div className="font-semibold mb-1">
                    {selectedOption === quiz.correctIndex
                      ? `ถูกต้องเป๊ะ! รับไปเลย +${QUIZ_CORRECT_REWARD} Idea Coins`
                      : 'เกือบถูกแล้ว! มาดูเฉลยกันนะ'}
                  </div>
                  <p>{quiz.explanation}</p>
                </div>

                {quotaReached ? (
                  <div className="p-4 rounded-xl bg-[#FAF8F4] border border-[#E7E1D6] text-xs sm:text-sm text-[#6E675F] text-center">
                    <strong className="text-[#1F1D1A] block mb-0.5">
                      เก่งมาก! ทำควิซครบ {DAILY_QUIZ_LIMIT} / {DAILY_QUIZ_LIMIT} ข้อของวันนี้แล้ว
                    </strong>
                    พรุ่งนี้กลับมาสุ่มโจทย์ชุดใหม่แบบไม่ซ้ำกันได้อีก 5 ข้อนะ
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <button
                      type="button"
                      onClick={handleStartBankQuiz}
                      className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 min-h-[46px] rounded-xl bg-[#1F1D1A] text-white text-sm font-medium hover:bg-[#33302B] transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-[#FBBF24]" />
                      ลุยโจทย์ข้อถัดไป (เหลือ {remainingToday} ข้อวันนี้)
                    </button>
                    <button
                      type="button"
                      onClick={handleLoadAiQuiz}
                      className="inline-flex items-center justify-center gap-1.5 py-3 px-4 min-h-[46px] rounded-xl bg-[#FAF8F4] border border-[#DED5C5] text-xs sm:text-sm font-medium text-[#1F1D1A] hover:bg-[#F1ECE2] transition-colors cursor-pointer"
                    >
                      <Brain className="w-4 h-4 text-[#2563EB]" />
                      สุ่มโจทย์ AI สด
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Right Summary Sidebar */}
      <aside className="lg:col-span-4 space-y-5">
        {/* Daily Quota Progress */}
        <div className="bg-white border border-[#E7E1D6] rounded-2xl p-5 space-y-3.5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-[#1F1D1A] flex items-center gap-2">
              <CalendarCheck2 className="w-4 h-4 text-[#2563EB]" />
              โควตาประจำวัน
            </h2>
            <span
              className={`font-mono-num text-sm font-semibold ${
                quotaReached ? 'text-[#BE123C]' : 'text-[#2563EB]'
              }`}
            >
              {usedToday} / {DAILY_QUIZ_LIMIT} ข้อ
            </span>
          </div>

          <div className="grid grid-cols-5 gap-1.5" aria-label="ความคืบหน้าควิซวันนี้">
            {Array.from({ length: DAILY_QUIZ_LIMIT }).map((_, idx) => (
              <div
                key={idx}
                className={`h-2.5 rounded-sm transition-colors ${
                  idx < usedToday ? 'bg-[#2563EB]' : 'bg-[#EAE3D5]'
                }`}
              />
            ))}
          </div>

          <div className="text-xs text-[#6E675F] space-y-1 pt-1 border-t border-[#F1ECE2]">
            <div className="flex justify-between">
              <span>ทำโจทย์ไม่ซ้ำไปแล้ว</span>
              <span className="font-mono-num font-semibold text-[#1F1D1A]">
                {bankStats.totalDone} / {bankStats.totalBank} ข้อ
              </span>
            </div>
            <div className="flex justify-between">
              <span>คงเหลือในหมวดที่เลือก</span>
              <span className="font-mono-num font-semibold text-[#2D6A4F]">
                {bankStats.filterUnseen} ข้อ
              </span>
            </div>
          </div>
        </div>

        {/* Study Tip & Library Link */}
        <div className="bg-[#FAF6EE] border border-[#E5DCCB] rounded-2xl p-5 text-xs text-[#6E675F] space-y-3">
          <div className="font-semibold text-sm text-[#1F1D1A] flex items-center gap-1.5">
            <Star className="w-4 h-4 text-[#D97706]" />
            เคล็ดลับเก็บเหรียญ &amp; ความรู้
          </div>
          <p className="leading-relaxed">
            ทำควิซวันละ 5 ข้อควบคู่กับการส่งงานสเก็ตช์ตรวจจริงในแท็บ{' '}
            <strong className="text-[#1F1D1A]">ส่งงานตรวจ</strong> จะช่วยให้ทั้งคะแนน TCAS และสตูดิโอ 3D เติบโตไปพร้อมกันอย่างสมดุลครับ
          </p>
          {onGoToLibrary && (
            <button
              type="button"
              onClick={() =>
                onGoToLibrary(trackFilter === 'mixed' ? undefined : trackFilter)
              }
              className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-white border border-[#DED5C5] text-xs font-semibold text-[#1F1D1A] hover:bg-[#F1ECE2] transition-colors cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-[#9A4E24]" />
              <span>อ่านสรุปเนื้อหาในคลังความรู้ →</span>
            </button>
          )}
        </div>
      </aside>
    </div>
  );
};
