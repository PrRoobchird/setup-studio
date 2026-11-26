import React, { useState } from 'react';
import { Check, Coins, HeartHandshake, Star, Users } from 'lucide-react';
import { CLASSMATE_STUDIOS } from '../data/classmates';
import { CLASSMATE_STICKER_REWARD } from '../data/catalog';
import { StickerType } from '../types/studio';
import { StudioRoom3D } from './StudioRoom3D';

interface ClassmatesTabProps {
  votedClassmates: Record<string, StickerType>;
  onSendSticker: (classmateId: string, sticker: StickerType) => void;
}

const STICKERS: { label: StickerType; sub: string }[] = [
  { label: 'จัดวางเฉียบ!', sub: 'องค์ประกอบห้องลงตัว' },
  { label: 'โทนสีละมุน!', sub: 'คุมโทนอาร์ตมาก' },
  { label: 'สายปั่นพอร์ต!', sub: 'ผลงานล่าสุดปังสุด' },
];

export const ClassmatesTab: React.FC<ClassmatesTabProps> = ({
  votedClassmates,
  onSendSticker,
}) => {
  const [selectedId, setSelectedId] = useState<string>(CLASSMATE_STUDIOS[0].id);

  const selectedStudio =
    CLASSMATE_STUDIOS.find((c) => c.id === selectedId) ?? CLASSMATE_STUDIOS[0];
  const votedSticker = votedClassmates[selectedStudio.id];
  const displayFame = selectedStudio.baseFame + (votedSticker ? 10 : 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Classmate Roster */}
      <aside className="lg:col-span-4 bg-white border border-[#E7E1D6] rounded-2xl p-4 sm:p-5 space-y-4">
        <div>
          <h1 className="text-lg font-semibold text-[#1F1D1A] flex items-center gap-2">
            <Users className="w-5 h-5 text-[#2563EB]" />
            ส่องสตูดิโอเพื่อน & รุ่นพี่
          </h1>
          <p className="text-xs text-[#6E675F] mt-1">
            แวะชมไอเดียแต่งห้อง 3D ดูแฟชั่นอวตาร ผลงานพอร์ตโฟลิโอ และส่งสติกเกอร์เพื่อรับโบนัส +{CLASSMATE_STICKER_REWARD} 💡 ต่อคน
          </p>
        </div>

        <div className="space-y-2">
          {CLASSMATE_STUDIOS.map((mate) => {
            const isSelected = mate.id === selectedStudio.id;
            const hasVoted = Boolean(votedClassmates[mate.id]);
            const mateFame = mate.baseFame + (hasVoted ? 10 : 0);

            return (
              <button
                key={mate.id}
                type="button"
                onClick={() => setSelectedId(mate.id)}
                className={`w-full flex items-center justify-between gap-3 p-3 min-h-[60px] rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#FAF6EE] border-[#1F1D1A]'
                    : 'bg-white border-[#EFEAE0] hover:bg-[#FAF8F4]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-semibold text-sm shrink-0"
                    style={{ backgroundColor: mate.avatarColor }}
                  >
                    {mate.avatarInitials}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-[#1F1D1A] truncate">
                      {mate.name}
                    </div>
                    <div className="text-xs text-[#6E675F] truncate">
                      {mate.track} · <span className="font-mono-num">{mateFame} ⭐</span>
                    </div>
                  </div>
                </div>
                <span className="text-xs shrink-0 whitespace-nowrap">
                  {hasVoted ? (
                    <span className="inline-flex items-center gap-1 text-[#2D6A4F] font-medium">
                      <Check className="w-3.5 h-3.5" /> โหวตแล้ว
                    </span>
                  ) : (
                    <span className="text-[#2563EB] font-medium">+{CLASSMATE_STICKER_REWARD} 💡</span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Selected Classmate Showcase */}
      <section className="lg:col-span-8 space-y-6">
        {/* Studio Room View */}
        <div className="bg-white border border-[#E7E1D6] rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-[#F1ECE2]">
            <div className="flex items-center gap-3.5">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-base shrink-0"
                style={{ backgroundColor: selectedStudio.avatarColor }}
              >
                {selectedStudio.avatarInitials}
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-[#1F1D1A]">
                  สตูดิโอของ{selectedStudio.name}
                </h2>
                <p className="text-xs sm:text-sm text-[#6E675F]">
                  {selectedStudio.roleLabel} · {selectedStudio.track}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 font-mono-num text-sm font-semibold text-[#D97706]">
              <Star className="w-4 h-4 fill-[#D97706]" />
              {displayFame} Fame
            </div>
          </div>

          <p className="text-sm text-[#475569] leading-relaxed">
            "{selectedStudio.bio}"
          </p>

          <div className="rounded-2xl overflow-hidden bg-gradient-to-b from-[#734129] via-[#A9623F] to-[#DF956B] h-[340px] sm:h-[420px]">
            <StudioRoom3D
              wallThemeId={selectedStudio.wallThemeId}
              floorThemeId={selectedStudio.floorThemeId}
              activeDoorId={selectedStudio.doorThemeId}
              placedItems={selectedStudio.placedItems}
              avatar={selectedStudio.avatar}
              readOnly
            />
          </div>

          {/* Sticker Reaction Bar */}
          <div className="pt-4 border-t border-[#F1ECE2] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs sm:text-sm font-medium text-[#1F1D1A] flex items-center gap-1.5">
                <HeartHandshake className="w-4 h-4 text-[#E11D48]" />
                ส่งสติกเกอร์ชื่นชมสตูดิโอเพื่อน
              </div>
              {votedSticker ? (
                <span className="text-xs font-medium text-[#2D6A4F]">
                  ส่งแล้ว: "{votedSticker}" · เพื่อน +10 Fame, คุณ +{CLASSMATE_STICKER_REWARD} 💡
                </span>
              ) : (
                <span className="text-xs text-[#2563EB] font-medium inline-flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5" />
                  รับโบนัส +{CLASSMATE_STICKER_REWARD} Idea Coins (1 ครั้ง/คน)
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {STICKERS.map((sticker) => {
                const isChosen = votedSticker === sticker.label;
                const isDisabled = Boolean(votedSticker);

                return (
                  <button
                    key={sticker.label}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => onSendSticker(selectedStudio.id, sticker.label)}
                    className={`p-3 min-h-[54px] rounded-xl border text-left transition-all ${
                      isChosen
                        ? 'bg-[#FFF1F2] border-[#FB7185] text-[#9F1239]'
                        : isDisabled
                        ? 'bg-[#FAF8F4] border-[#EFEAE0] text-[#9C948A] opacity-60 cursor-not-allowed'
                        : 'bg-[#FAF8F4] border-[#E7E1D6] text-[#1F1D1A] hover:border-[#2563EB] hover:bg-[#EFF6FF] active:scale-[0.98] cursor-pointer'
                    }`}
                  >
                    <div className="text-sm font-semibold">{sticker.label}</div>
                    <div className="text-[11px] opacity-80 mt-0.5">{sticker.sub}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Latest Portfolio Artwork Showcase */}
        <div className="bg-white border border-[#E7E1D6] rounded-2xl p-5 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
            <div className="md:col-span-6 rounded-xl overflow-hidden border border-[#E7E1D6] bg-[#FAF8F4] aspect-[4/3]">
              <img
                src={selectedStudio.latestArtwork.imageUrl}
                alt={selectedStudio.latestArtwork.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="md:col-span-6 space-y-2.5">
              <div className="text-xs text-[#6E675F]">
                ผลงานล่าสุดในพอร์ต · {selectedStudio.latestArtwork.category}
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-[#1F1D1A]">
                {selectedStudio.latestArtwork.title}
              </h3>
              <p className="text-sm text-[#475569] leading-relaxed">
                "{selectedStudio.latestArtwork.caption}"
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
