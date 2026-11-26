import React, { useState } from 'react';
import {
  Check,
  Lock,
  Palette,
  RotateCw,
  Shirt,
  ShoppingBag,
  Smile,
  Sparkles,
  X,
} from 'lucide-react';
import {
  AVATAR_SHOP_ITEMS,
  BLUSH_STYLES,
  EYEBROW_STYLES,
  EYE_STYLES,
  HAIR_COLORS,
  HAIR_STYLES,
  MOUTH_STYLES,
  SKIN_TONES,
} from '../data/catalog';
import { AvatarConfig, AvatarSlot } from '../types/studio';
import { AvatarPreview3D } from './AvatarPreview3D';
import { FashionIllustration } from './FashionIllustration';

interface AvatarWardrobeModalProps {
  avatar: AvatarConfig;
  ownedAvatarItems: string[];
  onUpdateAvatar: (patch: Partial<AvatarConfig>) => void;
  onGoToAvatarShop: () => void;
  onClose: () => void;
}

type WardrobeTab = 'face' | 'hair' | AvatarSlot;

const TABS: { id: WardrobeTab; label: string }[] = [
  { id: 'face', label: 'หน้าตา & ผิว' },
  { id: 'hair', label: 'ทรงผม & สีผม' },
  { id: 'outfit', label: 'ชุดแต่งตัว' },
  { id: 'headwear', label: 'หมวก & เครื่องหัว' },
  { id: 'glasses', label: 'แว่นตา' },
  { id: 'handItem', label: 'ของถือคู่ใจ' },
];

export const AvatarWardrobeModal: React.FC<AvatarWardrobeModalProps> = ({
  avatar,
  ownedAvatarItems,
  onUpdateAvatar,
  onGoToAvatarShop,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<WardrobeTab>('face');

  const currentEye = avatar.eyeStyleId ?? 'classic';
  const currentBrow = avatar.eyebrowStyleId ?? 'soft';
  const currentMouth = avatar.mouthStyleId ?? 'smile';
  const currentBlush = avatar.blushStyleId ?? 'rosy';

  const slotItems =
    activeTab === 'face' || activeTab === 'hair'
      ? []
      : AVATAR_SHOP_ITEMS.filter((item) => item.slot === activeTab);

  const getActiveIdForSlot = (slot: AvatarSlot): string => {
    switch (slot) {
      case 'outfit':
        return avatar.outfitId;
      case 'headwear':
        return avatar.headwearId;
      case 'glasses':
        return avatar.glassesId;
      case 'handItem':
        return avatar.handItemId;
    }
  };

  const handleEquip = (slot: AvatarSlot, itemId: string) => {
    if (slot === 'outfit') onUpdateAvatar({ outfitId: itemId });
    if (slot === 'headwear') onUpdateAvatar({ headwearId: itemId });
    if (slot === 'glasses') onUpdateAvatar({ glassesId: itemId });
    if (slot === 'handItem') onUpdateAvatar({ handItemId: itemId });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/55 flex items-center justify-center p-3 sm:p-5"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#FAF8F4] border border-[#E5DCCB] rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div className="px-5 py-4 bg-white border-b border-[#ECE6DA] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#A9623F] text-white flex items-center justify-center">
              <Shirt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-[#1F1D1A]">
                ห้องแต่งตัวอวตาร 3 มิติ
              </h2>
              <p className="text-xs text-[#6E675F]">
                ปรับหน้าตา ดวงตา คิ้ว ปาก ทรงผม และชุดแต่งตัวได้ตามสไตล์ของคุณ
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[#6E675F] hover:bg-[#F1ECE2] cursor-pointer"
            aria-label="ปิดหน้าต่างแต่งตัว"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-12">
          {/* Left: Interactive 3D Front-View Studio Stage (Solid Cream Background) */}
          <div className="md:col-span-5 bg-[#FAF4EA] border-b md:border-b-0 md:border-r border-[#ECE6DA] p-4 flex flex-col justify-between min-h-[300px] sm:min-h-[380px]">
            <div className="flex items-center justify-between text-[#4A433B] text-xs">
              <span className="inline-flex items-center gap-1.5 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-[#D97706]" />
                ตัวอย่างหุ่นดินเผา 3D
              </span>
              <span className="inline-flex items-center gap-1 text-[#786E62]">
                <RotateCw className="w-3.5 h-3.5" />
                ลากเพื่อหมุนตัว
              </span>
            </div>

            <div className="flex-1 h-[260px] sm:h-[340px]">
              <AvatarPreview3D avatar={avatar} />
            </div>

            <div className="text-center text-[11px] text-[#786E62]">
              บันทึกอัตโนมัติ ตัวละครในสตูดิโอจะเปลี่ยนตามทันที!
            </div>
          </div>

          {/* Right: Customization Controls */}
          <div className="md:col-span-7 p-4 sm:p-5 flex flex-col gap-4 bg-white">
            {/* Category Tabs */}
            <div className="flex flex-wrap gap-1 p-1 bg-[#FAF8F4] border border-[#EAE3D5] rounded-xl">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id)}
                  className={`px-2.5 py-1.5 min-h-[34px] rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    activeTab === t.id
                      ? 'bg-[#1F1D1A] text-white'
                      : 'text-[#6E675F] hover:text-[#1F1D1A]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Face & Skin Customization */}
            {activeTab === 'face' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-[#1F1D1A]">เพศของตัวละคร</div>
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        { id: 'female', label: 'ผู้หญิง' },
                        { id: 'male', label: 'ผู้ชาย' },
                      ] as const
                    ).map((g) => {
                      const active = (avatar.gender ?? 'female') === g.id;
                      return (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => onUpdateAvatar({ gender: g.id })}
                          className={`px-3 py-2 rounded-xl border text-xs font-medium text-center transition-all cursor-pointer ${
                            active
                              ? 'border-[#2563EB] bg-[#EFF6FF] text-[#1E3A8A]'
                              : 'border-[#E7E1D6] bg-[#FAF8F4] text-[#1F1D1A] hover:border-[#C2B7A5]'
                          }`}
                        >
                          {g.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-semibold text-[#1F1D1A]">สีผิว</div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {SKIN_TONES.map((tone) => {
                      const active = avatar.skinToneHex === tone.hex;
                      return (
                        <button
                          key={tone.id}
                          type="button"
                          onClick={() => onUpdateAvatar({ skinToneHex: tone.hex })}
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                            active
                              ? 'border-[#2563EB] bg-[#EFF6FF] text-[#1E3A8A]'
                              : 'border-[#E7E1D6] bg-[#FAF8F4] text-[#1F1D1A] hover:border-[#C2B7A5]'
                          }`}
                        >
                          <span
                            className="w-5 h-5 rounded-full border border-black/15 shrink-0"
                            style={{ backgroundColor: tone.hex }}
                          />
                          <span className="truncate">{tone.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-semibold text-[#1F1D1A] flex items-center gap-1.5">
                    <Smile className="w-3.5 h-3.5 text-[#D97706]" />
                    ทรงดวงตา
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {EYE_STYLES.map((eye) => {
                      const active = currentEye === eye.id;
                      return (
                        <button
                          key={eye.id}
                          type="button"
                          onClick={() => onUpdateAvatar({ eyeStyleId: eye.id })}
                          className={`px-3 py-2 rounded-xl border text-xs font-medium text-left transition-all cursor-pointer ${
                            active
                              ? 'border-[#2563EB] bg-[#EFF6FF] text-[#1E3A8A]'
                              : 'border-[#E7E1D6] bg-[#FAF8F4] text-[#1F1D1A] hover:border-[#C2B7A5]'
                          }`}
                        >
                          {eye.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-semibold text-[#1F1D1A]">ทรงคิ้ว</div>
                  <div className="grid grid-cols-3 gap-2">
                    {EYEBROW_STYLES.map((brow) => {
                      const active = currentBrow === brow.id;
                      return (
                        <button
                          key={brow.id}
                          type="button"
                          onClick={() => onUpdateAvatar({ eyebrowStyleId: brow.id })}
                          className={`px-3 py-2 rounded-xl border text-xs font-medium text-center transition-all cursor-pointer ${
                            active
                              ? 'border-[#2563EB] bg-[#EFF6FF] text-[#1E3A8A]'
                              : 'border-[#E7E1D6] bg-[#FAF8F4] text-[#1F1D1A] hover:border-[#C2B7A5]'
                          }`}
                        >
                          {brow.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-semibold text-[#1F1D1A]">ปาก &amp; สีหน้า</div>
                  <div className="grid grid-cols-2 gap-2">
                    {MOUTH_STYLES.map((m) => {
                      const active = currentMouth === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => onUpdateAvatar({ mouthStyleId: m.id })}
                          className={`px-3 py-2 rounded-xl border text-xs font-medium text-left transition-all cursor-pointer ${
                            active
                              ? 'border-[#2563EB] bg-[#EFF6FF] text-[#1E3A8A]'
                              : 'border-[#E7E1D6] bg-[#FAF8F4] text-[#1F1D1A] hover:border-[#C2B7A5]'
                          }`}
                        >
                          {m.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-semibold text-[#1F1D1A]">ปัดแก้ม</div>
                  <div className="grid grid-cols-3 gap-2">
                    {BLUSH_STYLES.map((b) => {
                      const active = currentBlush === b.id;
                      return (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => onUpdateAvatar({ blushStyleId: b.id })}
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                            active
                              ? 'border-[#2563EB] bg-[#EFF6FF] text-[#1E3A8A]'
                              : 'border-[#E7E1D6] bg-[#FAF8F4] text-[#1F1D1A] hover:border-[#C2B7A5]'
                          }`}
                        >
                          <span
                            className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                            style={{ backgroundColor: b.hex }}
                          />
                          <span className="truncate">{b.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Hair Styles & Colors */}
            {activeTab === 'hair' && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-[#1F1D1A]">
                    ทรงผม ({HAIR_STYLES.length} สไตล์)
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {HAIR_STYLES.map((style) => {
                      const active = avatar.hairStyleId === style.id;
                      return (
                        <button
                          key={style.id}
                          type="button"
                          onClick={() => onUpdateAvatar({ hairStyleId: style.id })}
                          className={`px-3 py-2.5 rounded-xl border text-xs font-medium text-left transition-all cursor-pointer ${
                            active
                              ? 'border-[#2563EB] bg-[#EFF6FF] text-[#1E3A8A]'
                              : 'border-[#E7E1D6] bg-[#FAF8F4] text-[#1F1D1A] hover:border-[#C2B7A5]'
                          }`}
                        >
                          {style.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-semibold text-[#1F1D1A] flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-[#D97706]" />
                    สีผม (9 เฉดสี)
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {HAIR_COLORS.map((hc) => {
                      const active = avatar.hairColorHex === hc.hex;
                      return (
                        <button
                          key={hc.id}
                          type="button"
                          onClick={() => onUpdateAvatar({ hairColorHex: hc.hex })}
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                            active
                              ? 'border-[#2563EB] bg-[#EFF6FF] text-[#1E3A8A]'
                              : 'border-[#E7E1D6] bg-[#FAF8F4] text-[#1F1D1A] hover:border-[#C2B7A5]'
                          }`}
                        >
                          <span
                            className="w-5 h-5 rounded-full border border-black/15 shrink-0"
                            style={{ backgroundColor: hc.hex }}
                          />
                          <span className="truncate">{hc.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Slot Items (Owned vs Locked) */}
            {activeTab !== 'face' && activeTab !== 'hair' && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {slotItems.map((item) => {
                    const isOwned = item.price === 0 || ownedAvatarItems.includes(item.id);
                    const isEquipped = getActiveIdForSlot(item.slot) === item.id;

                    return (
                      <div
                        key={item.id}
                        className={`flex flex-col justify-between p-3 rounded-xl border transition-all ${
                          isEquipped
                            ? 'bg-[#EFF6FF] border-[#2563EB]'
                            : isOwned
                            ? 'bg-[#FAF8F4] border-[#E7E1D6]'
                            : 'bg-[#F8F6F2] border-[#ECE6DA] opacity-85'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-b from-[#6FA6E8] to-[#98C2F4] flex items-center justify-center shrink-0 p-1">
                            <FashionIllustration itemId={item.id} className="w-10 h-10" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-semibold text-[#1F1D1A] truncate">
                              {item.name}
                            </div>
                            <p className="text-[11px] text-[#6E675F] mt-0.5 line-clamp-2">
                              {item.description}
                            </p>
                          </div>
                        </div>

                        <div className="mt-2.5 pt-2 border-t border-black/5 flex items-center justify-between gap-2">
                          <span className="text-[11px] font-mono-num text-[#6E675F]">
                            {item.fameBonus > 0 ? `+${item.fameBonus} Fame` : 'ไอเทมพื้นฐาน'}
                          </span>
                          {isOwned ? (
                            <button
                              type="button"
                              onClick={() => handleEquip(item.slot, item.id)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                                isEquipped
                                  ? 'bg-[#2563EB] text-white'
                                  : 'bg-white border border-[#DED5C5] text-[#1F1D1A] hover:bg-[#F1ECE2]'
                              }`}
                            >
                              {isEquipped && <Check className="w-3.5 h-3.5" />}
                              {isEquipped ? 'ใส่อยู่' : 'สวมใส่'}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                onGoToAvatarShop();
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#FFFBEB] border border-[#FDE68A] text-[#B45309] text-xs font-medium hover:bg-[#FEF3C7] cursor-pointer"
                            >
                              <Lock className="w-3 h-3" />
                              ซื้อ {item.price} 💡
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-auto pt-3 border-t border-[#ECE6DA] flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onGoToAvatarShop();
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#DED5C5] bg-[#FAF8F4] text-xs font-medium text-[#1F1D1A] hover:bg-[#F1ECE2] cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4 text-[#2563EB]" />
                ไปช้อปเสื้อผ้า &amp; แอคเซสซอรี่เพิ่ม
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-[#1F1D1A] text-white text-xs sm:text-sm font-medium hover:bg-[#33302B] cursor-pointer"
              >
                เสร็จสิ้น
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
