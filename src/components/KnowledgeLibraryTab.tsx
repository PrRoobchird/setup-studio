import React, { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  Search,
  Clock,
  Sparkles,
  ArrowRight,
  ChevronRight,
  BookmarkCheck,
  GraduationCap,
} from 'lucide-react';
import {
  KNOWLEDGE_ARTICLES,
  KNOWLEDGE_SUBJECTS,
  KnowledgeArticle,
  KnowledgeSubject,
} from '../data/knowledgeLibrary';
import { QuizExamCode } from '../types/studio';

interface KnowledgeLibraryTabProps {
  initialExamFilter?: 'ALL' | QuizExamCode;
  onOpenQuiz: (examCode?: QuizExamCode) => void;
}

export const KnowledgeLibraryTab: React.FC<KnowledgeLibraryTabProps> = ({
  initialExamFilter = 'ALL',
  onOpenQuiz,
}) => {
  const [selectedSubject, setSelectedSubject] = useState<KnowledgeSubject>('all');
  const [examFilter, setExamFilter] = useState<'ALL' | QuizExamCode>(initialExamFilter);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeArticleId, setActiveArticleId] = useState<string>(KNOWLEDGE_ARTICLES[0].id);

  useEffect(() => {
    setExamFilter(initialExamFilter);
    setSelectedSubject('all');
  }, [initialExamFilter]);

  const filteredArticles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return KNOWLEDGE_ARTICLES.filter((article) => {
      if (examFilter !== 'ALL' && article.examCode !== examFilter) return false;
      if (selectedSubject !== 'all' && article.subject !== selectedSubject) return false;
      if (!q) return true;
      const haystack = [
        article.title,
        article.subtitle,
        article.subjectLabel,
        article.summary,
        ...article.sections.map((s) => `${s.heading} ${s.body}`),
        ...article.keyTakeaways.map((k) => `${k.term} ${k.meaning}`),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [examFilter, selectedSubject, searchQuery]);

  const activeArticle: KnowledgeArticle | null = useMemo(() => {
    return (
      filteredArticles.find((a) => a.id === activeArticleId) ??
      filteredArticles[0] ??
      KNOWLEDGE_ARTICLES[0] ??
      null
    );
  }, [filteredArticles, activeArticleId]);

  const tpat4Count = KNOWLEDGE_ARTICLES.filter((a) => a.examCode === 'TPAT4').length;
  const tpat21Count = KNOWLEDGE_ARTICLES.filter((a) => a.examCode === 'TPAT21').length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <section className="rounded-3xl border border-[#E5DEC9] bg-gradient-to-br from-[#FFFDF8] via-[#FAF4E8] to-[#F3E9D4] p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-[#9A4E24] uppercase">
              <BookOpen className="w-4 h-4" />
              <span>ห้องสมุดสตูดิโอ · หนังสือเตรียมสอบ TPAT4 &amp; TPAT21</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1E1E1E] tracking-tight">
              คลังความรู้สถาปัตย์ &amp; ศิลปกรรมศาสตร์
            </h2>
            <p className="text-sm text-[#57524A] leading-relaxed">
              สรุปเนื้อหาแก่นวิชาการ สูตรคำนวณ ทฤษฎีสี สัดส่วนมนุษย์ ประวัติศาสตร์ศิลป์ และแนวโน้มยุคใหม่
              เชื่อมโยงตรงกับคลังข้อสอบในโหมดควิซ เพื่อให้อ่านทบทวนก่อนลงสนามสอบได้อย่างมั่นใจ
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl border border-[#E5DEC9] bg-white px-4 py-3 text-left">
              <p className="text-[11px] font-medium text-[#736D64]">คลังบทเรียนทั้งหมด</p>
              <p className="text-lg font-bold text-[#1E1E1E] tabular-nums">
                {KNOWLEDGE_ARTICLES.length} บท · TPAT4 ({tpat4Count}) / TPAT21 ({tpat21Count})
              </p>
            </div>
            <button
              type="button"
              onClick={() => onOpenQuiz(activeArticle?.examCode)}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#1E1E1E] hover:bg-[#34302C] text-white px-5 py-3 text-sm font-semibold shadow-sm transition cursor-pointer"
            >
              <GraduationCap className="w-4 h-4" />
              <span>ไปทำควิซทบทวน {activeArticle?.examCode ?? 'TPAT'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="mt-6 pt-5 border-t border-[#E5DEC9] flex flex-col md:flex-row md:items-center gap-3 justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {(['ALL', 'TPAT4', 'TPAT21'] as const).map((code) => {
              const active = examFilter === code;
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => {
                    setExamFilter(code);
                    setSelectedSubject('all');
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                    active
                      ? 'bg-[#D95D39] text-white border-[#D95D39] shadow-sm'
                      : 'bg-white text-[#4A463F] border-[#E0D8C3] hover:bg-[#F8F3E8]'
                  }`}
                >
                  {code === 'ALL' ? 'ทุกวิชา' : code === 'TPAT4' ? 'TPAT4 สถาปัตยกรรม' : 'TPAT21 ทัศนศิลป์'}
                </button>
              );
            })}
          </div>

          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-[#8C8478] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาคำศัพท์ สูตร หรือหัวข้อ..."
              className="w-full rounded-xl border border-[#DFD7C2] bg-white pl-10 pr-4 py-2 text-sm text-[#1E1E1E] placeholder-[#9B9387] focus:outline-none focus:ring-2 focus:ring-[#D95D39]/30 focus:border-[#D95D39]"
            />
          </div>
        </div>

        {/* Subject Tabs */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {KNOWLEDGE_SUBJECTS.filter(
            (subj) => examFilter === 'ALL' || !subj.examTag || subj.examTag === examFilter
          ).map((subj) => {
            const active = selectedSubject === subj.id;
            return (
              <button
                key={subj.id}
                type="button"
                onClick={() => setSelectedSubject(subj.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                  active
                    ? 'bg-[#1E1E1E] text-white'
                    : 'bg-white/80 text-[#5D574F] hover:bg-white border border-[#E5DEC9]'
                }`}
              >
                {subj.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Main Split Reader Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Book Index Sidebar */}
        <aside className="lg:col-span-4 space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#7A7267]">
              สารบัญบทเรียน ({filteredArticles.length})
            </h3>
          </div>

          {filteredArticles.length === 0 ? (
            <div className="rounded-2xl border border-[#E5DEC9] bg-white p-6 text-center text-sm text-[#7A7267]">
              ไม่พบบทความที่ตรงกับคำค้นหา ลองเปลี่ยนคำค้นหรือหมวดวิชา
            </div>
          ) : (
            <div className="space-y-2">
              {filteredArticles.map((article) => {
                const isSelected = activeArticle?.id === article.id;
                return (
                  <button
                    key={article.id}
                    type="button"
                    onClick={() => setActiveArticleId(article.id)}
                    className={`w-full text-left rounded-2xl border p-4 transition cursor-pointer ${
                      isSelected
                        ? 'bg-[#FFFDF7] border-[#D95D39] ring-2 ring-[#D95D39]/15 shadow-sm'
                        : 'bg-white border-[#E7E1D2] hover:border-[#D1C6AE] hover:bg-[#FDFBF5]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 text-[11px] font-semibold">
                      <span
                        className={
                          article.examCode === 'TPAT4' ? 'text-[#245C8A]' : 'text-[#A24026]'
                        }
                      >
                        {article.chapterNo}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[#827A6E]">
                        <Clock className="w-3 h-3" />
                        {article.readMinutes} นาที
                      </span>
                    </div>
                    <h4 className="mt-1.5 text-sm font-bold text-[#1E1E1E] leading-snug">
                      {article.title}
                    </h4>
                    <p className="mt-1 text-xs text-[#6B645A] line-clamp-2">{article.subtitle}</p>
                    <div className="mt-2.5 flex items-center justify-between text-[11px] text-[#8B8275]">
                      <span>{article.subjectLabel}</span>
                      <ChevronRight
                        className={`w-4 h-4 transition-transform ${
                          isSelected ? 'text-[#D95D39] translate-x-0.5' : ''
                        }`}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </aside>

        {/* Article Reader Pane */}
        <article className="lg:col-span-8 rounded-3xl border border-[#E5DEC9] bg-white p-6 sm:p-8 shadow-sm">
          {activeArticle ? (
            <div className="space-y-7">
              {/* Article Header */}
              <header className="space-y-3 pb-6 border-b border-[#EFEAD9]">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold">
                  <span
                    className={
                      activeArticle.examCode === 'TPAT4' ? 'text-[#245C8A]' : 'text-[#A24026]'
                    }
                  >
                    {activeArticle.chapterNo} · {activeArticle.subjectLabel}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[#787065]">
                    <Clock className="w-3.5 h-3.5" />
                    ใช้เวลาอ่าน ~{activeArticle.readMinutes} นาที
                  </span>
                </div>
                <h1 className="text-2xl sm:text-[26px] font-bold text-[#1E1E1E] leading-snug">
                  {activeArticle.title}
                </h1>
                <p className="text-sm text-[#60594E]">{activeArticle.subtitle}</p>
                <div className="rounded-2xl bg-[#FAF6EB] border border-[#EAE0C8] px-4 py-3.5 text-sm text-[#3E3A34] leading-relaxed">
                  <span className="font-bold text-[#9A4E24] mr-1.5">สรุปภาพรวม:</span>
                  {activeArticle.summary}
                </div>
              </header>

              {/* Editorial Body Sections */}
              <div className="space-y-6">
                {activeArticle.sections.map((section, idx) => (
                  <section key={idx} className="space-y-2">
                    <h3 className="text-base sm:text-lg font-bold text-[#1E1E1E]">
                      {section.heading}
                    </h3>
                    <p className="text-[15px] text-[#3F3B35] leading-7">{section.body}</p>
                  </section>
                ))}
              </div>

              {/* Key Terms / Formulas Reference Table */}
              <section className="rounded-2xl border border-[#E5DEC9] bg-[#FCFAF4] p-5 space-y-3.5">
                <div className="flex items-center gap-2 text-sm font-bold text-[#1E1E1E]">
                  <BookmarkCheck className="w-4 h-4 text-[#D95D39]" />
                  <span>สรุปคำศัพท์ &amp; สูตรสำคัญประจำบท (Cheat Sheet)</span>
                </div>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activeArticle.keyTakeaways.map((item, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-[#EAE2CE] bg-white px-3.5 py-2.5"
                    >
                      <dt className="text-xs font-bold text-[#9A4E24]">{item.term}</dt>
                      <dd className="mt-1 text-xs text-[#3F3B35] leading-relaxed">
                        {item.meaning}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>

              {/* Exam Tip & CTA to Quiz */}
              <footer className="rounded-2xl border border-[#D95D39]/25 bg-[#FFF6F1] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#B84321]">
                    <Sparkles className="w-4 h-4" />
                    <span>เทคนิคพิชิตข้อสอบ</span>
                  </div>
                  <p className="text-sm text-[#423A33] leading-relaxed">{activeArticle.examTip}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenQuiz(activeArticle.examCode)}
                  className="shrink-0 inline-flex items-center justify-center gap-2 rounded-xl bg-[#D95D39] hover:bg-[#C14C29] text-white px-4 py-2.5 text-xs font-bold shadow-sm transition cursor-pointer"
                >
                  <span>ลองทำควิซ {activeArticle.examCode}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </footer>
            </div>
          ) : null}
        </article>
      </div>
    </div>
  );
};
