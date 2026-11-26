import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Armchair,
  CheckCircle2,
  Coins,
  Eye,
  Flower2,
  Frame,
  Heart,
  Lock,
  Maximize2,
  Moon,
  Mountain,
  Paintbrush,
  Palette,
  PawPrint,
  RotateCcw,
  Shirt,
  ShoppingBag,
  Sparkles,
  Sun,
  Undo2,
  Utensils,
} from 'lucide-react';
import {
  AVATAR_ITEM_MAP,
  AVATAR_SHOP_ITEMS,
  FLOOR_THEMES,
  MAX_FAME,
  MAX_PETS,
  PET_BREEDS,
  PET_BREED_MAP,
  PET_FEED_INTERVAL_MS,
  PET_FOODS,
  RANK_TIERS,
  STUDIO_EXPANSION_FAME,
  STUDIO_EXPANSION_PRICE,
  STUDIO_ITEMS,
  WALL_FRAME_ITEMS,
  WALL_THEMES,
  WINDOW_VIEW_THEMES,
  getHolidayEventStatus,
  getRankInfo,
} from '../data/catalog';
import {
  AvatarConfig,
  AvatarSlot,
  ItemCategory,
  PetSpecies,
  StudioGameState,
  StudioItemDef,
  WallFrameType,
} from '../types/studio';
import { AvatarPreview3D } from './AvatarPreview3D';
import { FashionIllustration } from './FashionIllustration';
import { ItemThumbnail } from './ItemThumbnail';
import { PetIllustration } from './PetIllustration';
import { WindowViewThumbnail } from './WindowViewThumbnail';

export type ShopFilter =
  | 'all'
  | 'furniture'
  | 'equipment'
  | 'decor'
  | 'frames'
  | 'surfaces'
  | 'views'
  | 'avatar'
  | 'pets';

type AvatarSubFilter = 'all' | AvatarSlot;
type PetSubFilter = 'all' | 'breeds' | 'food' | 'gear';

interface ShopTabProps {
  state: StudioGameState;
  initialFilter?: ShopFilter;
  onBuyItem: (itemId: string) => void;
  onBuyWall: (wallId: string) => void;
  onSelectWall: (wallId: string) => void;
  onBuyFloor: (floorId: string) => void;
  onSelectFloor: (floorId: string) => void;
  onBuyWindowView: (viewId: string) => void;
  onSelectWindowView: (viewId: string) => void;
  onBuyAvatarItem: (itemId: string) => void;
  onEquipAvatarItem?: (slot: AvatarSlot, itemId: string) => void;
  onBuyWallFrame: (frameType: WallFrameType) => void;
  onAdoptPet: (breedId: string) => void;
  onBuyPetFood: (species: PetSpecies) => void;
  onFeedPet: (petInstanceId: string) => void;
  onReturnPet: (petInstanceId: string) => void;
  onExpandStudio: () => void;
  onGoToStudio: () => void;
}

const SPECIES_TABS: { id: 'all' | PetSpecies; label: string; sizeHint: string }[] = [
  { id: 'all', label: 'ทุกสายพันธุ์', sizeHint: '5 ชนิด · 15 สายพันธุ์' },
  { id: 'dog', label: 'สุนัข', sizeHint: 'คอก 2×1 ช่อง' },
  { id: 'cat', label: 'แมว', sizeHint: 'คอนโด 1×1 ช่อง' },
  { id: 'goldfish', label: 'ปลาทอง', sizeHint: 'ตู้ปลา 1×1 ช่อง' },
  { id: 'hedgehog', label: 'เม่นแคระ', sizeHint: 'กรง 1×1 ช่อง' },
  { id: 'snake', label: 'งูเลี้ยง', sizeHint: 'ตู้กระจก 1×1 ช่อง' },
];

const AVATAR_SUB_TABS: { id: AvatarSubFilter; label: string }[] = [
  { id: 'all', label: 'ทั้งหมด' },
  { id: 'outfit', label: 'ชุดแต่งตัว' },
  { id: 'headwear', label: 'หมวก & เครื่องหัว' },
  { id: 'glasses', label: 'แว่นตา' },
  { id: 'handItem', label: 'ของถือคู่ใจ' },
];

const PET_SUB_TABS: { id: PetSubFilter; label: string }[] = [
  { id: 'all', label: 'ทั้งหมด' },
  { id: 'breeds', label: 'รับเลี้ยงสัตว์ (15 สายพันธุ์)' },
  { id: 'food', label: 'อาหารสัตว์เลี้ยง' },
  { id: 'gear', label: 'ของใช้ & ของเล่นสัตว์เลี้ยง' },
];

export const ShopTab: React.FC<ShopTabProps> = ({
  state,
  initialFilter = 'all',
  onBuyItem,
  onBuyWall,
  onSelectWall,
  onBuyFloor,
  onSelectFloor,
  onBuyWindowView,
  onSelectWindowView,
  onBuyAvatarItem,
  onEquipAvatarItem,
  onBuyWallFrame,
  onAdoptPet,
  onBuyPetFood,
  onFeedPet,
  onReturnPet,
  onExpandStudio,
  onGoToStudio,
}) => {
  const [filter, setFilter] = useState<ShopFilter>(initialFilter);
  const [avatarSubFilter, setAvatarSubFilter] = useState<AvatarSubFilter>('all');
  const [petSubFilter, setPetSubFilter] = useState<PetSubFilter>('all');
  const [petSpeciesFilter, setPetSpeciesFilter] = useState<'all' | PetSpecies>('all');
  const [viewPreviewNight, setViewPreviewNight] = useState(false);
  const [tryOnPatch, setTryOnPatch] = useState<Partial<AvatarConfig>>({});

  useEffect(() => {
    setFilter(initialFilter);
  }, [initialFilter]);

  const holidayStatus = getHolidayEventStatus();
  const rankInfo = getRankInfo(state.fame, state.heartlessPenaltyUntil);

  const slotToConfigKey = (
    slot: AvatarSlot
  ): 'outfitId' | 'headwearId' | 'glassesId' | 'handItemId' => {
    if (slot === 'outfit') return 'outfitId';
    if (slot === 'headwear') return 'headwearId';
    if (slot === 'glasses') return 'glassesId';
    return 'handItemId';
  };

  const toggleTryOn = (slot: AvatarSlot, itemId: string) => {
    const key = slotToConfigKey(slot);
    setTryOnPatch((prev) => {
      if (prev[key] === itemId) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: itemId };
    });
  };

  const clearTryOnSlot = (slot: AvatarSlot) => {
    const key = slotToConfigKey(slot);
    setTryOnPatch((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const previewAvatar: AvatarConfig = {
    ...state.avatar,
    ...tryOnPatch,
  };

  const tryOnEntries = (
    ['outfitId', 'headwearId', 'glassesId', 'handItemId'] as const
  )
    .filter((k) => Boolean(tryOnPatch[k]))
    .map((k) => ({ key: k, itemId: tryOnPatch[k] as string }));

  const furnitureItems = STUDIO_ITEMS.filter(
    (i) => i.category === 'furniture' && (!i.isSeasonal || holidayStatus.isActive)
  );
  const equipmentItems = STUDIO_ITEMS.filter(
    (i) => i.category === 'equipment' && (!i.isSeasonal || holidayStatus.isActive)
  );
  const decorItems = STUDIO_ITEMS.filter(
    (i) => i.category === 'decor' && (!i.isSeasonal || holidayStatus.isActive)
  );
  const petGearItems = STUDIO_ITEMS.filter((i) => i.category === 'petgear');

  const allAvatarShopItems = AVATAR_SHOP_ITEMS.filter(
    (i) => i.price > 0 && (!i.isSeasonal || holidayStatus.isActive)
  );
  const filteredAvatarItems =
    avatarSubFilter === 'all'
      ? allAvatarShopItems
      : allAvatarShopItems.filter((i) => i.slot === avatarSubFilter);

  const buyableWalls = WALL_THEMES.filter((w) => w.price > 0);
  const buyableFloors = FLOOR_THEMES.filter((f) => f.price > 0);
  const buyableViews = WINDOW_VIEW_THEMES.filter(
    (v) => !v.isSeasonal || holidayStatus.isActive
  );

  const categoryTabs: { id: ShopFilter; label: string; count?: number }[] = [
    { id: 'all', label: 'รวมทุกหมวด' },
    { id: 'furniture', label: 'เฟอร์นิเจอร์', count: furnitureItems.length },
    { id: 'equipment', label: 'อุปกรณ์ศิลปะ', count: equipmentItems.length },
    { id: 'decor', label: 'ของตกแต่ง', count: decorItems.length },
    { id: 'frames', label: 'เฟรมติดผนัง', count: WALL_FRAME_ITEMS.length },
    {
      id: 'surfaces',
      label: 'สีผนัง & พื้น',
      count: buyableWalls.length + buyableFloors.length,
    },
    { id: 'views', label: 'วิวหน้าต่าง', count: buyableViews.length },
    { id: 'avatar', label: 'แฟชั่นอวตาร', count: allAvatarShopItems.length },
    {
      id: 'pets',
      label: 'สัตว์เลี้ยง & ของใช้',
      count: PET_BREEDS.length + PET_FOODS.length + petGearItems.length,
    },
  ];

  const showFurniture = filter === 'all' || filter === 'furniture';
  const showEquipment = filter === 'all' || filter === 'equipment';
  const showDecor = filter === 'all' || filter === 'decor';
  const showFrames = filter === 'all' || filter === 'frames';
  const showSurfaces = filter === 'all' || filter === 'surfaces';
  const showViews = filter === 'all' || filter === 'views';
  const showAvatar = filter === 'all' || filter === 'avatar';
  const showPets = filter === 'all' || filter === 'pets';

  const canExpand = state.fame >= STUDIO_EXPANSION_FAME && !state.studioExpanded;
  const canAffordExpand = state.coins >= STUDIO_EXPANSION_PRICE;

  const filteredPetBreeds =
    petSpeciesFilter === 'all'
      ? PET_BREEDS
      : PET_BREEDS.filter((b) => b.species === petSpeciesFilter);

  const petSlotsFull = state.pets.length >= rankInfo.maxPetSlots;
  const nowMs = Date.now();

  const renderStudioItemSection = (
    title: string,
    subtitle: string,
    icon: React.ReactNode,
    items: StudioItemDef[],
    categoryKey: ItemCategory
  ) => (
    <div key={categoryKey} className="space-y-3 pt-4 border-t border-[#F1ECE2] first:pt-0 first:border-t-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {icon}
          <div>
            <h2 className="text-base font-semibold text-[#1F1D1A]">{title}</h2>
            <p className="text-xs text-[#6E675F]">{subtitle}</p>
          </div>
        </div>
        <span className="text-xs font-mono-num text-[#6E675F]">{items.length} รายการ</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => {
          const ownedCount = state.ownedItems[item.id] || 0;
          const canAfford = state.coins >= item.price;

          return (
            <div
              key={item.id}
              className={`flex flex-col justify-between p-4 rounded-xl border transition-colors ${
                item.isSeasonal
                  ? 'border-[#FECDD3] bg-[#FFF9FA] hover:border-[#FDA4AF]'
                  : 'border-[#E7E1D6] bg-[#FAF8F4] hover:border-[#C2B7A5]'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className="w-20 h-20 rounded-xl bg-gradient-to-b from-[#6FA6E8] to-[#98C2F4] flex items-center justify-center shrink-0 shadow-xs">
                  <ItemThumbnail itemId={item.id} className="w-16 h-16" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-[#6E675F] flex flex-wrap items-center gap-1.5">
                    <span>{item.categoryLabel}</span>
                    <span>·</span>
                    <span className="font-mono-num text-[#2D6A4F] font-medium">
                      {ownedCount > 0 ? 'ได้ Fame แล้ว' : `+${item.fameBonus} Fame`}
                    </span>
                    {item.isSeasonal && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-[#FFF1F2] text-[#BE123C] text-[10px] font-semibold">
                        อีเว้นท์ · ถึง 31 ธ.ค.
                      </span>
                    )}
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
                  {ownedCount > 0
                    ? `มีแล้ว ${ownedCount} ชิ้น`
                    : item.isSeasonal
                    ? 'ลิมิเต็ดถึง 31 ธ.ค.'
                    : 'ยังไม่เคยซื้อ'}
                </div>
                <button
                  type="button"
                  disabled={!canAfford}
                  onClick={() => onBuyItem(item.id)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap shrink-0 ${
                    canAfford
                      ? item.isSeasonal
                        ? 'bg-[#DC2626] text-white hover:bg-[#B91C1C] active:scale-[0.98] cursor-pointer'
                        : 'bg-[#2563EB] text-white hover:bg-[#1D4ED8] active:scale-[0.98] cursor-pointer'
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
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Studio Expansion Upgrade Banner (Unlocked at Fame 100) */}
      <section className="bg-white border border-[#E7E1D6] rounded-2xl p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] flex items-center justify-center shrink-0">
            <Maximize2 className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="text-xs text-[#6E675F] flex flex-wrap items-center gap-2">
              <span className="font-semibold text-[#1F1D1A]">อัปเกรดพื้นที่สตูดิโอ 3 มิติ</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono-num">
                เงื่อนไข: Fame {Math.min(state.fame, STUDIO_EXPANSION_FAME)} / {STUDIO_EXPANSION_FAME} ⭐ (สูงสุด {MAX_FAME})
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-semibold text-[#1F1D1A]">
              {state.studioExpanded
                ? 'ขยายพื้นที่สตูดิโอเป็น 2 เท่าเรียบร้อยแล้ว (7×7 · 49 ช่อง)'
                : 'ขยายขนาดห้องสตูดิโอเพิ่มอีก 1 เท่า (5×5 → 7×7 ช่อง)'}
            </h2>
            <p className="text-xs sm:text-sm text-[#6E675F]">
              {state.studioExpanded
                ? 'ห้องสตูดิโอของคุณกว้างขึ้นเกือบ 2 เท่า วางเฟอร์นิเจอร์และคอกสัตว์เลี้ยงได้จุใจถึง 49 ช่อง!'
                : `สะสม Studio Fame ให้ครบ ${STUDIO_EXPANSION_FAME} เพื่อปลดล็อกสิทธิ์ซื้อพื้นที่สตูดิโอเพิ่ม 1 ครั้ง รองรับเฟอร์นิเจอร์และสัตว์เลี้ยงสูงสุด 5 ตัว`}
            </p>
          </div>
        </div>

        <div className="shrink-0 w-full md:w-auto">
          {state.studioExpanded ? (
            <button
              type="button"
              onClick={onGoToStudio}
              className="w-full md:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] text-xs sm:text-sm font-medium cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              เปิดใช้งานแล้ว · ไปจัดห้อง
            </button>
          ) : state.fame < STUDIO_EXPANSION_FAME ? (
            <div className="inline-flex items-center justify-center gap-2 w-full md:w-auto px-4 py-2.5 min-h-[44px] rounded-xl bg-[#FAF8F4] border border-[#E7E1D6] text-xs sm:text-sm font-medium text-[#6E675F]">
              <Lock className="w-4 h-4 text-[#D97706]" />
              ปลดล็อกเมื่อ Fame ถึง {STUDIO_EXPANSION_FAME}
            </div>
          ) : (
            <button
              type="button"
              disabled={!canExpand || !canAffordExpand}
              onClick={onExpandStudio}
              className={`w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-[44px] rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                canAffordExpand
                  ? 'bg-[#2563EB] text-white hover:bg-[#1D4ED8] active:scale-[0.98] cursor-pointer'
                  : 'bg-[#E7E1D6] text-[#8C8377] cursor-not-allowed'
              }`}
            >
              <Coins className="w-4 h-4" />
              <span className="font-mono-num">{STUDIO_EXPANSION_PRICE.toLocaleString()}</span>
              <span>{canAffordExpand ? 'ซื้อขยายสตูดิโอ +100%' : 'เหรียญไม่พอ'}</span>
            </button>
          )}
        </div>
      </section>

      {/* Main Categorized Shop Container */}
      <section className="bg-white border border-[#E7E1D6] rounded-2xl p-5 sm:p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg sm:text-xl font-semibold text-[#1F1D1A] flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#2563EB]" />
              ร้านค้าสตูดิโอ แฟชั่น วิวหน้าต่าง &amp; สัตว์เลี้ยง
            </h1>
            <p className="text-xs sm:text-sm text-[#6E675F] mt-0.5">
              แยกหมวดหมู่สินค้าชัดเจน กดเลือกหมวดหมู่ด้านล่างเพื่อค้นหาสินค้าที่ต้องการได้ทันที
            </p>
          </div>
          <div className="font-mono-num text-sm sm:text-base font-bold text-[#D97706]">
            คงเหลือ {state.coins.toLocaleString()} 💡
          </div>
        </div>

        {/* Clean Single-Row/Wrap Category Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-[#FAF8F4] border border-[#EAE3D5] rounded-xl">
          {categoryTabs.map((tab) => {
            const active = filter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 min-h-[38px] rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-[#1F1D1A] text-white'
                    : 'text-[#6E675F] hover:text-[#1F1D1A] hover:bg-white/70'
                }`}
              >
                <span>{tab.label}</span>
                {typeof tab.count === 'number' && (
                  <span
                    className={`text-[11px] font-mono-num ${
                      active ? 'text-white/75' : 'text-[#8C8377]'
                    }`}
                  >
                    ({tab.count})
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* 1. Furniture Category */}
        {showFurniture &&
          renderStudioItemSection(
            'หมวดเฟอร์นิเจอร์',
            'โต๊ะดราฟต์ โต๊ะคอม โต๊ะปั้นโมเดล โซฟา และตู้หนังสือสำหรับวางจัดห้อง 3D',
            <Armchair className="w-5 h-5 text-[#B45309]" />,
            furnitureItems,
            'furniture'
          )}

        {/* 2. Art Equipment Category */}
        {showEquipment &&
          renderStudioItemSection(
            'หมวดอุปกรณ์ศิลปะ',
            'ขาตั้งวาดภาพ หุ่นปั้นสัดส่วน สีโคปิก และเครื่องมือฝึกวาดเส้นระดับมืออาชีพ',
            <Palette className="w-5 h-5 text-[#2563EB]" />,
            equipmentItems,
            'equipment'
          )}

        {/* 3. Room Decor Category */}
        {showDecor &&
          renderStudioItemSection(
            'หมวดของตกแต่งห้อง',
            holidayStatus.isActive
              ? 'ต้นไม้ บีนแบ็ก พรมวงกลม โคมไฟ Akari และของตกแต่งเทศกาลคริสต์มาส-ปีใหม่'
              : 'ต้นไม้ บีนแบ็ก พรมวงกลม โคมไฟ Akari และของตกแต่งเพิ่มบรรยากาศสตูดิโอ',
            <Flower2 className="w-5 h-5 text-[#15803D]" />,
            decorItems,
            'decor'
          )}

        {/* 4. Wall Frames Category */}
        {showFrames && (
          <div className="space-y-3 pt-4 border-t border-[#F1ECE2] first:pt-0 first:border-t-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Frame className="w-5 h-5 text-[#B45309]" />
                <div>
                  <h2 className="text-base font-semibold text-[#1F1D1A]">
                    หมวดเฟรมภาพแขวนผนัง 3 มิติ
                  </h2>
                  <p className="text-xs text-[#6E675F]">
                    ใส่รูปผลงานของตัวเองแสดงบนผนังห้อง 3D และปรับเปลี่ยนภาพได้ไม่จำกัดครั้ง
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono-num text-[#6E675F]">
                {WALL_FRAME_ITEMS.length} รายการ
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {WALL_FRAME_ITEMS.map((frameItem) => {
                const frameType = frameItem.frameOrientation ?? 'landscape';
                const isOwned = state.ownedWallFrames.includes(frameType);
                const canAfford = state.coins >= frameItem.price;

                return (
                  <div
                    key={frameItem.id}
                    className="flex flex-col justify-between p-4 rounded-xl border border-[#E7E1D6] bg-[#FAF8F4]"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-20 h-20 rounded-xl bg-gradient-to-b from-[#6FA6E8] to-[#98C2F4] flex items-center justify-center shrink-0 shadow-xs">
                        <ItemThumbnail itemId={frameItem.id} className="w-16 h-16" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs text-[#6E675F]">
                          {frameItem.categoryLabel} ·{' '}
                          <span className="font-mono-num text-[#2D6A4F] font-medium">
                            {isOwned ? 'ได้ Fame แล้ว' : `+${frameItem.fameBonus} Fame`}
                          </span>
                        </div>
                        <h3 className="text-sm sm:text-base font-semibold text-[#1F1D1A] mt-0.5">
                          {frameItem.name}
                        </h3>
                        <p className="text-xs text-[#6E675F] mt-1 leading-relaxed">
                          {frameItem.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-3 mt-3 border-t border-[#EAE3D5]">
                      <span className="text-xs text-[#6E675F]">
                        {isOwned ? 'ติดตั้งบนผนังห้อง 3D แล้ว' : 'ไม่กินพื้นที่ช่องพื้นห้อง'}
                      </span>
                      {isOwned ? (
                        <button
                          type="button"
                          onClick={onGoToStudio}
                          className="px-3.5 py-2 min-h-[38px] rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] text-xs font-medium cursor-pointer"
                        >
                          ไปเลือกภาพใส่เฟรม →
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={!canAfford}
                          onClick={() => onBuyWallFrame(frameType)}
                          className={`inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[38px] rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap shrink-0 ${
                            canAfford
                              ? 'bg-[#B45309] text-white hover:bg-[#92400E] cursor-pointer'
                              : 'bg-[#E7E1D6] text-[#8C8377] cursor-not-allowed'
                          }`}
                        >
                          <Coins className="w-3.5 h-3.5" />
                          <span className="font-mono-num">{frameItem.price}</span>
                          <span>{canAfford ? 'ซื้อติดผนัง' : 'เหรียญไม่พอ'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 5. Wall & Floor Surfaces Category (Strictly walls & floors) */}
        {showSurfaces && (
          <div className="space-y-4 pt-4 border-t border-[#F1ECE2] first:pt-0 first:border-t-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Paintbrush className="w-5 h-5 text-[#D97706]" />
                <div>
                  <h2 className="text-base font-semibold text-[#1F1D1A]">
                    หมวดสีผนังและวัสดุพื้นห้อง
                  </h2>
                  <p className="text-xs text-[#6E675F]">
                    เปลี่ยนโทนผนังและพื้นไม้/กระเบื้องของสตูดิโอ (ซื้อแล้วสลับใช้งานได้ตลอด)
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono-num text-[#6E675F]">
                {buyableWalls.length + buyableFloors.length} รายการ
              </span>
            </div>

            <div className="space-y-3">
              <div className="text-xs font-semibold text-[#6E675F]">โทนสีผนังสตูดิโอ</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {buyableWalls.map((wall) => {
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
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-xs font-semibold text-[#6E675F]">วัสดุและลวดลายพื้นห้อง</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {buyableFloors.map((floor) => {
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
          </div>
        )}

        {/* 6. Window Views Category (Visual Previews + Day/Night Toggle + Christmas View) */}
        {showViews && (
          <div className="space-y-4 pt-4 border-t border-[#F1ECE2] first:pt-0 first:border-t-0">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Mountain className="w-5 h-5 text-[#0284C7]" />
                <div>
                  <h2 className="text-base font-semibold text-[#1F1D1A]">
                    หมวดวิวนอกหน้าต่างสตูดิโอ 3 มิติ ({buyableViews.length} วิว)
                  </h2>
                  <p className="text-xs text-[#6E675F]">
                    ดูภาพตัวอย่างวิวจริงนอกหน้าต่างทั้งกลางวันและกลางคืนก่อนตัดสินใจซื้อ
                  </p>
                </div>
              </div>

              <div className="inline-flex items-center p-1 rounded-xl bg-[#FAF8F4] border border-[#E7E1D6]">
                <button
                  type="button"
                  onClick={() => setViewPreviewNight(false)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    !viewPreviewNight
                      ? 'bg-white text-[#B45309] border border-[#EAE3D5] shadow-xs'
                      : 'text-[#6E675F] hover:text-[#1F1D1A]'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" />
                  ตัวอย่างกลางวัน
                </button>
                <button
                  type="button"
                  onClick={() => setViewPreviewNight(true)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    viewPreviewNight
                      ? 'bg-[#1E293B] text-white shadow-xs'
                      : 'text-[#6E675F] hover:text-[#1F1D1A]'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" />
                  ตัวอย่างกลางคืน
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {buyableViews.map((view) => {
                const isOwned = state.ownedWindowViews.includes(view.id);
                const isActive = state.activeWindowViewId === view.id;
                const canAfford = state.coins >= view.price;

                return (
                  <div
                    key={view.id}
                    className={`flex flex-col justify-between p-4 rounded-xl border transition-colors ${
                      view.isSeasonal
                        ? 'border-[#FECDD3] bg-[#FFF9FA]'
                        : 'border-[#E7E1D6] bg-[#FAF8F4]'
                    }`}
                  >
                    <div className="space-y-3">
                      <WindowViewThumbnail
                        viewId={view.id}
                        nightMode={viewPreviewNight}
                        isSnowSeason={holidayStatus.isSnowActive || Boolean(view.isSeasonal)}
                        className="w-full h-36"
                      />
                      <div>
                        <div className="flex flex-wrap items-center gap-1.5 text-xs mb-1">
                          <span className="font-mono-num font-medium text-[#2D6A4F]">
                            {view.price === 0
                              ? 'วิวพื้นฐาน'
                              : isOwned
                              ? 'ได้ Fame แล้ว'
                              : `+${view.fameBonus} Fame`}
                          </span>
                          {view.isSeasonal && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-[#FFF1F2] text-[#BE123C] text-[10px] font-semibold">
                              อีเว้นท์ · ถึง 31 ธ.ค.
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm font-semibold text-[#1F1D1A]">{view.name}</h3>
                        <p className="text-xs text-[#6E675F] mt-1 leading-relaxed">
                          {view.description}
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 mt-3 border-t border-[#EAE3D5] flex items-center justify-between gap-2">
                      <span className="text-xs text-[#6E675F]">
                        {isActive
                          ? 'กำลังแสดงนอกหน้าต่าง'
                          : isOwned
                          ? 'ปลดล็อกแล้ว'
                          : view.isSeasonal
                          ? 'ลิมิเต็ดถึง 31 ธ.ค.'
                          : 'เปลี่ยนวิวหน้าต่าง 3D'}
                      </span>
                      {isOwned ? (
                        <button
                          type="button"
                          onClick={() => onSelectWindowView(view.id)}
                          className={`px-3 py-1.5 min-h-[36px] rounded-xl text-xs font-medium cursor-pointer ${
                            isActive
                              ? 'bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]'
                              : 'bg-white text-[#1F1D1A] border border-[#DED5C5] hover:bg-[#F1ECE2]'
                          }`}
                        >
                          {isActive ? 'ใช้อยู่' : 'เปลี่ยนวิวนี้'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={!canAfford}
                          onClick={() => onBuyWindowView(view.id)}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 min-h-[36px] rounded-xl text-xs font-medium font-mono-num ${
                            canAfford
                              ? view.isSeasonal
                                ? 'bg-[#DC2626] text-white hover:bg-[#B91C1C] cursor-pointer'
                                : 'bg-[#0284C7] text-white hover:bg-[#0369A1] cursor-pointer'
                              : 'bg-[#E7E1D6] text-[#8C8377] cursor-not-allowed'
                          }`}
                        >
                          {view.price} 💡 ซื้อวิว
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 7. Avatar Fashion & Accessories Category (Live 3D Try-On Preview + Purchase Gate) */}
        {showAvatar && (
          <div className="space-y-4 pt-4 border-t border-[#F1ECE2] first:pt-0 first:border-t-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Shirt className="w-5 h-5 text-[#A9623F]" />
                <div>
                  <h2 className="text-base font-semibold text-[#1F1D1A]">
                    หมวดแฟชั่นอวตาร &amp; โหมดลองสวมใส่ 3D
                  </h2>
                  <p className="text-xs text-[#6E675F]">
                    กดที่สินค้าเพื่อลองสวมใส่บนหุ่น 3 มิติได้ทันที (สินค้าที่ยังไม่ซื้อจะใช้ได้เฉพาะในโหมดตัวอย่างจนกว่าจะกดซื้อจริง)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onGoToStudio}
                className="text-xs font-medium text-[#2563EB] hover:underline cursor-pointer"
              >
                กลับไปดูสตูดิโอ 3D →
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Left Sticky 3D Try-On Stage */}
              <div className="lg:col-span-4 lg:sticky lg:top-20 rounded-2xl border border-[#E7E1D6] bg-[#FAF4EA] p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-[#1F1D1A]">
                    <Eye className="w-4 h-4 text-[#A9623F]" />
                    <span>ตัวอย่างหุ่นอวตาร 3D</span>
                  </div>
                  {tryOnEntries.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setTryOnPatch({})}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-[#DED5C5] text-[11px] font-medium text-[#1F1D1A] hover:bg-[#F1ECE2] cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      คืนค่าชุดเดิม
                    </button>
                  )}
                </div>

                <div className="h-[290px] sm:h-[330px] rounded-xl overflow-hidden border border-[#EAE0CF] bg-[#FAF4EA]">
                  <AvatarPreview3D avatar={previewAvatar} />
                </div>

                <p className="text-[11px] text-[#6E675F] text-center">
                  ลากหมุนตัวละครได้ 360° · คลิกการ์ดแฟชั่นด้านขวาเพื่อลองสวมใส่
                </p>

                {tryOnEntries.length > 0 && (
                  <div className="p-3 rounded-xl bg-white border border-[#EAE0CF] space-y-2">
                    <div className="text-xs font-semibold text-[#A9623F]">
                      กำลังลองสวมใส่ ({tryOnEntries.length} ชิ้น):
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {tryOnEntries.map(({ key, itemId }) => {
                        const def = AVATAR_ITEM_MAP[itemId];
                        if (!def) return null;
                        const owned = state.ownedAvatarItems.includes(itemId);
                        return (
                          <span
                            key={key}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#FAF4EA] border border-[#E7E1D6] text-[11px] text-[#1F1D1A]"
                          >
                            <span>{def.name}</span>
                            {!owned && (
                              <span className="text-[10px] font-semibold text-[#BE123C]">
                                (ยังไม่ซื้อ)
                              </span>
                            )}
                          </span>
                        );
                      })}
                    </div>
                    <div className="text-[11px] text-[#6E675F] leading-relaxed">
                      โหมดลองสวมใส่เพื่อดูตัวอย่างก่อนตัดสินใจ — กดปุ่ม{' '}
                      <strong className="text-[#1F1D1A]">ซื้อ &amp; ใส่เลย</strong>{' '}
                      เพื่อปลดล็อกและใช้จริงในห้องสตูดิโอ
                    </div>
                  </div>
                )}
              </div>

              {/* Right Selectable Fashion Grid */}
              <div className="lg:col-span-8 space-y-3.5">
                {/* Sub-tabs for Avatar Slots */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {AVATAR_SUB_TABS.map((sub) => (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => setAvatarSubFilter(sub.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        avatarSubFilter === sub.id
                          ? 'bg-[#A9623F] text-white border-[#A9623F]'
                          : 'bg-[#FAF8F4] text-[#1F1D1A] border-[#E7E1D6] hover:bg-[#F1ECE2]'
                      }`}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {filteredAvatarItems.map((avItem) => {
                    const isOwned = state.ownedAvatarItems.includes(avItem.id);
                    const canAfford = state.coins >= avItem.price;
                    const slotKey = slotToConfigKey(avItem.slot);
                    const isTryingOn = tryOnPatch[slotKey] === avItem.id;
                    const isEquipped = state.avatar[slotKey] === avItem.id;

                    return (
                      <div
                        key={avItem.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => toggleTryOn(avItem.slot, avItem.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            toggleTryOn(avItem.slot, avItem.id);
                          }
                        }}
                        className={`flex flex-col justify-between p-4 rounded-xl border transition-all cursor-pointer select-none ${
                          isTryingOn
                            ? 'border-[#A9623F] ring-2 ring-[#A9623F]/25 bg-white'
                            : avItem.isSeasonal
                            ? 'border-[#FECDD3] bg-[#FFF9FA] hover:border-[#FDA4AF]'
                            : 'border-[#E7E1D6] bg-[#FAF8F4] hover:border-[#C2B7A5]'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-16 h-16 rounded-xl bg-gradient-to-b from-[#6FA6E8] to-[#98C2F4] flex items-center justify-center shrink-0 shadow-xs p-1">
                            <FashionIllustration itemId={avItem.id} className="w-14 h-14" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs text-[#6E675F] flex flex-wrap items-center gap-1.5">
                              <span>{avItem.slotLabel}</span>
                              <span>·</span>
                              <span className="font-mono-num text-[#2D6A4F] font-medium">
                                {isOwned ? 'ได้ Fame แล้ว' : `+${avItem.fameBonus} Fame`}
                              </span>
                              {avItem.isSeasonal && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-[#FFF1F2] text-[#BE123C] text-[10px] font-semibold">
                                  อีเว้นท์ · ถึง 31 ธ.ค.
                                </span>
                              )}
                            </div>
                            <h3 className="text-sm font-semibold text-[#1F1D1A] mt-0.5">
                              {avItem.name}
                            </h3>
                            <p className="text-xs text-[#6E675F] mt-1 leading-relaxed">
                              {avItem.description}
                            </p>
                          </div>
                        </div>

                        <div
                          className="flex flex-wrap items-center justify-between gap-2 pt-3 mt-3 border-t border-[#EAE3D5]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => toggleTryOn(avItem.slot, avItem.id)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1.5 min-h-[34px] rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                              isTryingOn
                                ? 'bg-[#A9623F] text-white border-[#A9623F]'
                                : 'bg-white text-[#1F1D1A] border-[#DED5C5] hover:bg-[#F1ECE2]'
                            }`}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{isTryingOn ? 'กำลังลอง' : 'ลองใส่'}</span>
                          </button>

                          {isOwned ? (
                            isEquipped ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1.5 min-h-[34px] rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] text-xs font-medium">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                สวมใส่อยู่ในห้อง
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  clearTryOnSlot(avItem.slot);
                                  onEquipAvatarItem?.(avItem.slot, avItem.id);
                                }}
                                className="px-3 py-1.5 min-h-[34px] rounded-xl bg-[#16A34A] text-white hover:bg-[#15803D] text-xs font-medium cursor-pointer"
                              >
                                สวมใส่ในห้อง
                              </button>
                            )
                          ) : (
                            <button
                              type="button"
                              disabled={!canAfford}
                              onClick={() => {
                                clearTryOnSlot(avItem.slot);
                                onBuyAvatarItem(avItem.id);
                              }}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[34px] rounded-xl text-xs font-medium transition-all whitespace-nowrap shrink-0 ${
                                canAfford
                                  ? avItem.isSeasonal
                                    ? 'bg-[#DC2626] text-white hover:bg-[#B91C1C] active:scale-[0.98] cursor-pointer'
                                    : 'bg-[#A9623F] text-white hover:bg-[#8E4F30] active:scale-[0.98] cursor-pointer'
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
            </div>
          </div>
        )}

        {/* 8. Pets, Pet Food & Pet Gear Category */}
        {showPets && (
          <div className="rounded-2xl border border-[#CBE7D5] bg-[#F5FBF7] p-4 sm:p-5 space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-[#D8EFE0]">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#16A34A] text-white flex items-center justify-center shrink-0">
                  <PawPrint className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-semibold text-[#14532D]">
                    หมวดร้านค้าสัตว์เลี้ยง อาหาร &amp; ของใช้สัตว์เลี้ยง 3D
                  </h2>
                  <p className="text-xs text-[#166534] mt-0.5">
                    สัตว์เลี้ยงจะเคลื่อนไหวตลอดเวลาในห้อง 3D ·{' '}
                    <strong>ต้องให้อาหารอย่างน้อยสัปดาห์ละ 1 ครั้ง</strong> มิฉะนั้นจะเริ่มป่วยและตาย
                  </p>
                </div>
              </div>

              <div className="px-3.5 py-2 rounded-xl bg-white border border-[#CBE7D5] text-xs space-y-0.5">
                <div className="text-[#6E675F]">
                  ตำแหน่งปัจจุบัน:{' '}
                  <span className={`font-semibold ${rankInfo.isHeartless ? 'text-[#BE123C]' : 'text-[#1F1D1A]'}`}>
                    {rankInfo.title} (ขั้น {rankInfo.level})
                  </span>
                </div>
                <div className="font-mono-num font-semibold text-[#15803D]">
                  สิทธิ์เลี้ยงสัตว์: {state.pets.length} / {rankInfo.maxPetSlots} ตัว (สูงสุด {MAX_PETS} ตัว)
                </div>
              </div>
            </div>

            {/* Pet Sub-Category Tabs */}
            <div className="flex flex-wrap items-center gap-1.5">
              {PET_SUB_TABS.map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setPetSubFilter(sub.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    petSubFilter === sub.id
                      ? 'bg-[#14532D] text-white border-[#14532D]'
                      : 'bg-white text-[#1F1D1A] border-[#CBE7D5] hover:bg-[#ECFDF5]'
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>

            {/* Rank Slot Unlock Guide */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-[11px]">
              {RANK_TIERS.map((tier) => {
                const unlocked = rankInfo.level >= tier.level;
                return (
                  <div
                    key={tier.level}
                    className={`p-2.5 rounded-xl border ${
                      unlocked
                        ? 'bg-white border-[#86EFAC] text-[#14532D]'
                        : 'bg-white/60 border-[#E2E8F0] text-[#64748B]'
                    }`}
                  >
                    <div className="font-semibold truncate">
                      ขั้น {tier.level}: {tier.minFame}–{tier.maxFame} ⭐
                    </div>
                    <div className="truncate mt-0.5">{tier.title}</div>
                    <div className="font-mono-num font-semibold mt-1">
                      เลี้ยงได้ {tier.maxPetSlots} ตัว
                    </div>
                  </div>
                );
              })}
            </div>

            {rankInfo.isHeartless && (
              <div className="p-3.5 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] text-xs text-[#9F1239] flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#E11D48]" />
                <div>
                  <strong>ติดโทษ "คนใจร้าย" (เหลืออีก {rankInfo.penaltyDaysLeft} วัน):</strong>{' '}
                  ไม่สามารถรับเลี้ยงสัตว์เลี้ยงเพิ่มได้ชั่วคราวจนกว่าสตูดิโอจะพ้นโทษสีขาว-ดำ
                </div>
              </div>
            )}

            {/* Currently Owned Pets Management */}
            {state.pets.length > 0 && (
              <div className="space-y-2.5">
                <h3 className="text-sm font-semibold text-[#14532D]">
                  สัตว์เลี้ยงของคุณในสตูดิโอ ({state.pets.length}) · ดูแลหรือนำมาคืนร้านค้า
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {state.pets.map((pet) => {
                    const breed = PET_BREED_MAP[pet.breedId];
                    const elapsed = Math.max(0, nowMs - pet.lastFedAt);
                    const isSick = pet.status === 'sick' || elapsed > PET_FEED_INTERVAL_MS;
                    const foodCount = state.petFood[pet.species] || 0;
                    const returnFee = breed?.returnFee ?? 120;
                    const canPayReturn = state.coins >= returnFee;

                    return (
                      <div
                        key={pet.instanceId}
                        className="p-3.5 rounded-xl bg-white border border-[#CBE7D5] flex flex-col justify-between gap-3"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-14 h-14 rounded-xl bg-gradient-to-b from-[#6FA6E8] to-[#98C2F4] flex items-center justify-center shrink-0">
                            <PetIllustration breedId={pet.breedId} className="w-12 h-12" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-semibold text-[#1F1D1A] truncate">
                                {pet.nickname}
                              </span>
                              <span
                                className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                                  isSick
                                    ? 'bg-[#FFF1F2] text-[#BE123C]'
                                    : 'bg-[#ECFDF5] text-[#065F46]'
                                }`}
                              >
                                {isSick ? 'ป่วย! รีบให้อาหาร' : 'แข็งแรง'}
                              </span>
                            </div>
                            <div className="text-xs text-[#6E675F] mt-0.5">
                              {breed?.breedName} · {breed?.enclosureName}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#F0F7F2]">
                          <button
                            type="button"
                            disabled={foodCount <= 0}
                            onClick={() => onFeedPet(pet.instanceId)}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 min-h-[34px] rounded-lg text-xs font-semibold ${
                              foodCount > 0
                                ? 'bg-[#16A34A] text-white hover:bg-[#15803D] cursor-pointer'
                                : 'bg-[#E7E1D6] text-[#8C8377] cursor-not-allowed'
                            }`}
                          >
                            <Utensils className="w-3.5 h-3.5" />
                            ให้อาหาร (เหลือ {foodCount})
                          </button>

                          <button
                            type="button"
                            disabled={!canPayReturn}
                            onClick={() => onReturnPet(pet.instanceId)}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 min-h-[34px] rounded-lg text-xs font-medium ${
                              canPayReturn
                                ? 'bg-[#FFF1F2] border border-[#FECDD3] text-[#BE123C] hover:bg-[#FFE4E6] cursor-pointer'
                                : 'bg-[#E7E1D6] text-[#8C8377] cursor-not-allowed'
                            }`}
                          >
                            <Undo2 className="w-3.5 h-3.5" />
                            คืนร้านค้า ({returnFee} 💡)
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Adoptable Pet Breeds */}
            {(petSubFilter === 'all' || petSubFilter === 'breeds') && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  {SPECIES_TABS.map((sp) => (
                    <button
                      key={sp.id}
                      type="button"
                      onClick={() => setPetSpeciesFilter(sp.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                        petSpeciesFilter === sp.id
                          ? 'bg-[#16A34A] text-white border-[#16A34A]'
                          : 'bg-white text-[#1F1D1A] border-[#CBE7D5] hover:bg-[#ECFDF5]'
                      }`}
                    >
                      {sp.label} <span className="opacity-75">({sp.sizeHint})</span>
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {filteredPetBreeds.map((breed) => {
                    const canAfford = state.coins >= breed.price;
                    const lockedByRank = rankInfo.maxPetSlots === 0;
                    const disabled =
                      lockedByRank || petSlotsFull || rankInfo.isHeartless || !canAfford;

                    let btnText = 'รับเลี้ยงเลย';
                    if (rankInfo.isHeartless) btnText = 'ติดโทษคนใจร้าย';
                    else if (lockedByRank) btnText = 'ต้องถึงขั้น 2 (51⭐)';
                    else if (petSlotsFull) btnText = `เต็มสิทธิ์ ${rankInfo.maxPetSlots} ตัว`;
                    else if (!canAfford) btnText = 'เหรียญไม่พอ';

                    return (
                      <div
                        key={breed.id}
                        className="flex flex-col justify-between p-4 rounded-xl border border-[#CBE7D5] bg-white"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-16 h-16 rounded-xl bg-gradient-to-b from-[#6FA6E8] to-[#98C2F4] flex items-center justify-center shrink-0">
                            <PetIllustration breedId={breed.id} className="w-14 h-14" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-[11px] text-[#15803D] font-medium">
                              {breed.speciesLabel} ·{' '}
                              <span className="font-mono-num">+{breed.fameBonus} Fame</span>
                            </div>
                            <h3 className="text-sm font-semibold text-[#1F1D1A] mt-0.5">
                              {breed.breedName}
                            </h3>
                            <p className="text-xs text-[#6E675F] mt-1 leading-relaxed">
                              {breed.description}
                            </p>
                          </div>
                        </div>

                        <div className="pt-3 mt-3 border-t border-[#E6F4EB] space-y-2">
                          <div className="flex items-center justify-between text-[11px] text-[#6E675F]">
                            <span>{breed.enclosureName}</span>
                            <span className="font-mono-num">ค่าคืนร้าน {breed.returnFee} 💡</span>
                          </div>
                          <button
                            type="button"
                            disabled={disabled}
                            onClick={() => onAdoptPet(breed.id)}
                            className={`w-full inline-flex items-center justify-center gap-1.5 px-3.5 py-2 min-h-[38px] rounded-xl text-xs font-semibold transition-all ${
                              !disabled
                                ? 'bg-[#16A34A] text-white hover:bg-[#15803D] cursor-pointer'
                                : 'bg-[#E7E1D6] text-[#8C8377] cursor-not-allowed'
                            }`}
                          >
                            <Heart className="w-3.5 h-3.5" />
                            <span className="font-mono-num">{breed.price} 💡</span>
                            <span>· {btnText}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Pet Food & Pet Gear Sub-sections */}
            {(petSubFilter === 'all' || petSubFilter === 'food' || petSubFilter === 'gear') && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-3 border-t border-[#D8EFE0]">
                {(petSubFilter === 'all' || petSubFilter === 'food') && (
                  <div className="space-y-2.5">
                    <h3 className="text-sm font-semibold text-[#14532D] flex items-center gap-1.5">
                      <Utensils className="w-4 h-4" />
                      หมวดอาหารสัตว์เลี้ยง (ให้อาหารสัปดาห์ละ 1 ครั้ง)
                    </h3>
                    <div className="space-y-2">
                      {PET_FOODS.map((food) => {
                        const stock = state.petFood[food.species] || 0;
                        const canAfford = state.coins >= food.price;
                        return (
                          <div
                            key={food.id}
                            className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white border border-[#CBE7D5]"
                          >
                            <div className="min-w-0">
                              <div className="text-xs sm:text-sm font-semibold text-[#1F1D1A] truncate">
                                {food.name}
                              </div>
                              <div className="text-[11px] text-[#6E675F]">
                                {food.description} · คลัง:{' '}
                                <strong className="font-mono-num">{stock} มื้อ</strong>
                              </div>
                            </div>
                            <button
                              type="button"
                              disabled={!canAfford}
                              onClick={() => onBuyPetFood(food.species)}
                              className={`px-3 py-2 min-h-[36px] rounded-xl text-xs font-semibold font-mono-num whitespace-nowrap shrink-0 ${
                                canAfford
                                  ? 'bg-[#2563EB] text-white hover:bg-[#1D4ED8] cursor-pointer'
                                  : 'bg-[#E7E1D6] text-[#8C8377] cursor-not-allowed'
                              }`}
                            >
                              {food.price} 💡 ซื้อ +{food.servings}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {(petSubFilter === 'all' || petSubFilter === 'gear') && (
                  <div className="space-y-2.5">
                    <h3 className="text-sm font-semibold text-[#14532D] flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" />
                      หมวดของใช้ &amp; ของเล่นสัตว์เลี้ยง 3D
                    </h3>
                    <div className="space-y-2">
                      {petGearItems.map((gear) => {
                        const ownedCount = state.ownedItems[gear.id] || 0;
                        const canAfford = state.coins >= gear.price;
                        return (
                          <div
                            key={gear.id}
                            className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white border border-[#CBE7D5]"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-b from-[#6FA6E8] to-[#98C2F4] flex items-center justify-center shrink-0">
                                <ItemThumbnail itemId={gear.id} className="w-10 h-10" />
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs sm:text-sm font-semibold text-[#1F1D1A] truncate">
                                  {gear.name}
                                </div>
                                <div className="text-[11px] text-[#6E675F] line-clamp-1">
                                  {ownedCount > 0 ? `มีแล้ว ${ownedCount} ชิ้น` : `+${gear.fameBonus} Fame`} ·{' '}
                                  {gear.description}
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              disabled={!canAfford}
                              onClick={() => onBuyItem(gear.id)}
                              className={`px-3 py-2 min-h-[36px] rounded-xl text-xs font-semibold font-mono-num whitespace-nowrap shrink-0 ${
                                canAfford
                                  ? 'bg-[#16A34A] text-white hover:bg-[#15803D] cursor-pointer'
                                  : 'bg-[#E7E1D6] text-[#8C8377] cursor-not-allowed'
                              }`}
                            >
                              {gear.price} 💡 ซื้อ
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </section>
    </div>
  );
};
