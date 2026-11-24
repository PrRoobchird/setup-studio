import React, { useState } from 'react';
import {
  Armchair,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Flower2,
  Layers,
  Moon,
  Package,
  Paintbrush,
  Palette,
  RotateCw,
  Shirt,
  ShoppingBag,
  Sparkles,
  Sun,
  Trash2,
  X,
} from 'lucide-react';
import {
  FLOOR_THEMES,
  ITEM_MAP,
  STUDIO_ITEMS,
  WALL_THEMES,
  getStudioRank,
} from '../data/catalog';
import { AvatarConfig, ItemCategory, StudioGameState } from '../types/studio';
import { AvatarWardrobeModal } from './AvatarWardrobeModal';
import { ItemThumbnail } from './ItemThumbnail';
import { StudioRoom3D } from './StudioRoom3D';

interface MyStudioTabProps {
  state: StudioGameState;
  onPlaceItem: (itemId: string, x: number, y: number) => void;
  onMoveOrSwapItem: (instanceId: string, x: number, y: number) => void;
  onRotateItem: (instanceId: string) => void;
  onRemoveItem: (instanceId: string) => void;
  onSelectWall: (wallId: string) => void;
  onSelectFloor: (floorId: string) => void;
  onUpdateAvatar: (patch: Partial<AvatarConfig>) => void;
  onGoToShop: (initialFilter?: 'all' | 'avatar') => void;
  onGoToCritique: () => void;
}

type DrawerCategory = 'all' | ItemCategory | 'walls' | 'floors';

const RAIL_CATEGORIES: {
  id: DrawerCategory;
  label: string;
  icon: React.ReactNode;
}[] = [
  { id: 'all', label: 'ของทั้งหมด', icon: <Package className="w-4 h-4" /> },
  { id: 'furniture', label: 'เฟอร์นิเจอร์', icon: <Armchair className="w-4 h-4" /> },
  { id: 'equipment', label: 'อุปกรณ์ศิลปะ', icon: <Palette className="w-4 h-4" /> },
  { id: 'decor', label: 'ของตกแต่ง', icon: <Flower2 className="w-4 h-4" /> },
  { id: 'walls', label: 'สีผนัง', icon: <Paintbrush className="w-4 h-4" /> },
  { id: 'floors', label: 'พื้นห้อง', icon: <Layers className="w-4 h-4" /> },
];

export const MyStudioTab: React.FC<MyStudioTabProps> = ({
  state,
  onPlaceItem,
  onMoveOrSwapItem,
  onRotateItem,
  onRemoveItem,
  onSelectWall,
  onSelectFloor,
  onUpdateAvatar,
  onGoToShop,
  onGoToCritique,
}) => {
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);
  const [pendingItemId, setPendingItemId] = useState<string | null>(null);
  const [nightMode, setNightMode] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [drawerCategory, setDrawerCategory] = useState<DrawerCategory>('all');
  const [showWardrobe, setShowWardrobe] = useState(false);

  const selectedPlaced = state.placedItems.find((p) => p.instanceId === selectedInstanceId) ?? null;
  const selectedItemDef = selectedPlaced ? ITEM_MAP[selectedPlaced.itemId] : null;
  const pendingItemDef = pendingItemId ? ITEM_MAP[pendingItemId] : null;

  const placedCounts: Record<string, number> = {};
  for (const p of state.placedItems) {
    placedCounts[p.itemId] = (placedCounts[p.itemId] || 0) + 1;
  }

  const ownedItemList = STUDIO_ITEMS.filter((item) => (state.ownedItems[item.id] || 0) > 0);
  const filteredDrawerItems =
    drawerCategory === 'all'
      ? ownedItemList
      : drawerCategory === 'furniture' ||
        drawerCategory === 'equipment' ||
        drawerCategory === 'decor'
      ? ownedItemList.filter((item) => item.category === drawerCategory)
      : [];

  const studioRank = getStudioRank(state.fame);
  const nextMilestone = state.fame < 40 ? 40 : state.fame < 90 ? 90 : state.fame < 180 ? 180 : 300;
  const progressPct = Math.min(100, Math.round((state.fame / nextMilestone) * 100));

  const handleTileClick = (x: number, y: number) => {
    if (pendingItemId) {
      const occupant = state.placedItems.find((p) => p.x === x && p.y === y);
      if (occupant) {
        setPendingItemId(null);
        setSelectedInstanceId(occupant.instanceId);
        return;
      }
      onPlaceItem(pendingItemId, x, y);
      const owned = state.ownedItems[pendingItemId] || 0;
      const nowPlaced = (placedCounts[pendingItemId] || 0) + 1;
      if (nowPlaced >= owned) {
        setPendingItemId(null);
      }
      return;
    }

    if (selectedInstanceId) {
      const current = state.placedItems.find((p) => p.instanceId === selectedInstanceId);
      if (current && current.x === x && current.y === y) {
        setSelectedInstanceId(null);
        return;
      }
      onMoveOrSwapItem(selectedInstanceId, x, y);
      setSelectedInstanceId(null);
    }
  };

  const handleSelectPlaced = (instanceId: string) => {
    setPendingItemId(null);
    setSelectedInstanceId((prev) => (prev === instanceId ? null : instanceId));
  };

  const handleInventoryClick = (itemId: string) => {
    const owned = state.ownedItems[itemId] || 0;
    const placed = placedCounts[itemId] || 0;
    const available = owned - placed;

    if (available > 0) {
      setSelectedInstanceId(null);
      setPendingItemId((prev) => (prev === itemId ? null : itemId));
    } else {
      const firstPlaced = state.placedItems.find((p) => p.itemId === itemId);
      if (firstPlaced) {
        setPendingItemId(null);
        setSelectedInstanceId(firstPlaced.instanceId);
      }
    }
  };

  return (
    <div className="space-y-5">
      {/* Main Setup Dream Room-Style 3D Diorama Stage */}
      <section
        className={`relative rounded-3xl overflow-hidden border shadow-md transition-colors duration-300 ${
          nightMode
            ? 'border-[#332E54] bg-gradient-to-b from-[#1E1B33] via-[#2C2847] to-[#463B5E]'
            : 'border-[#8D5134] bg-gradient-to-b from-[#734129] via-[#A9623F] to-[#DF956B]'
        }`}
      >
        {/* 3D WebGL Diorama Canvas */}
        <div className="w-full h-[460px] sm:h-[540px] lg:h-[580px]">
          <StudioRoom3D
            wallThemeId={state.activeWallId}
            floorThemeId={state.activeFloorId}
            placedItems={state.placedItems}
            avatar={state.avatar}
            selectedInstanceId={selectedInstanceId}
            pendingItemId={pendingItemId}
            nightMode={nightMode}
            onTileClick={handleTileClick}
            onSelectPlaced={handleSelectPlaced}
            onAvatarClick={() => setShowWardrobe(true)}
          />
        </div>

        {/* Top-Left Studio Title & Drawer Toggle (No backdrop-blur over WebGL) */}
        <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setDrawerOpen((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[38px] rounded-xl bg-[#2C1C13]/90 hover:bg-[#2C1C13] text-white text-xs font-medium border border-white/15 cursor-pointer"
            title={drawerOpen ? 'ซ่อนลิ้นชักอุปกรณ์' : 'เปิดลิ้นชักอุปกรณ์'}
          >
            {drawerOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            <span>คลังแต่งห้อง</span>
          </button>

          <div className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#2C1C13]/85 text-white text-xs border border-white/10">
            <span className="font-semibold">สตูดิโอของ{state.studentName}</span>
            <span className="text-white/50">·</span>
            <span className="text-[#FDE68A]">{studioRank}</span>
          </div>
        </div>

        {/* Top-Right Setup Dream Room Circular Controls (Camera, Sun/Moon, Dress-Up Avatar) */}
        <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowWardrobe(true)}
            className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-full bg-white text-[#1F1D1A] hover:bg-[#FAF6EE] text-xs font-semibold shadow-sm cursor-pointer"
            title="แต่งตัวอวตาร 3D"
          >
            <Shirt className="w-4 h-4 text-[#A9623F]" />
            <span className="hidden sm:inline">แต่งตัวอวตาร</span>
          </button>
          <button
            type="button"
            onClick={onGoToCritique}
            className="w-9 h-9 rounded-full bg-[#2C1C13]/85 hover:bg-[#2C1C13] text-white flex items-center justify-center border border-white/15 cursor-pointer"
            title="ถ่ายรูปส่งงานตรวจ"
            aria-label="ถ่ายรูปส่งงานตรวจ"
          >
            <Camera className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setNightMode((prev) => !prev)}
            className={`w-9 h-9 rounded-full flex items-center justify-center shadow-sm transition-colors cursor-pointer ${
              nightMode
                ? 'bg-[#3B82F6] text-white hover:bg-[#2563EB]'
                : 'bg-[#F59E0B] text-white hover:bg-[#D97706]'
            }`}
            title={nightMode ? 'สลับเป็นแสงกลางวัน' : 'สลับเป็นโหมดกลางคืนอบอุ่น'}
            aria-label={nightMode ? 'สลับเป็นแสงกลางวัน' : 'สลับเป็นโหมดกลางคืนอบอุ่น'}
          >
            {nightMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
        </div>

        {/* Left Collapsible Cocoa Props Drawer (Setup Dream Room Style, No backdrop-blur) */}
        {drawerOpen && (
          <aside className="hidden md:flex flex-col absolute left-3 top-14 bottom-3 w-[236px] z-10 rounded-2xl bg-[#2C1C13]/88 border border-white/15 p-3 text-white shadow-lg">
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/15">
              <span className="px-2.5 py-0.5 rounded-full bg-[#1C110B] text-[11px] font-semibold text-[#FDE68A]">
                {RAIL_CATEGORIES.find((c) => c.id === drawerCategory)?.label ?? 'Props'}
              </span>
              <button
                type="button"
                onClick={() => onGoToShop('all')}
                className="text-[11px] text-[#93C5FD] hover:underline cursor-pointer"
              >
                + ซื้อของเพิ่ม
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 mt-2.5">
              {(drawerCategory === 'walls' || drawerCategory === 'floors') ? (
                <div className="space-y-1.5">
                  {(drawerCategory === 'walls' ? WALL_THEMES : FLOOR_THEMES).map((surf) => {
                    const isOwned =
                      drawerCategory === 'walls'
                        ? state.ownedWalls.includes(surf.id)
                        : state.ownedFloors.includes(surf.id);
                    const isActive =
                      drawerCategory === 'walls'
                        ? state.activeWallId === surf.id
                        : state.activeFloorId === surf.id;

                    return (
                      <button
                        key={surf.id}
                        type="button"
                        onClick={() =>
                          isOwned
                            ? drawerCategory === 'walls'
                              ? onSelectWall(surf.id)
                              : onSelectFloor(surf.id)
                            : onGoToShop('all')
                        }
                        className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl border text-left text-xs transition-colors cursor-pointer ${
                          isActive
                            ? 'bg-white/20 border-[#FDE68A] text-white'
                            : 'bg-black/25 border-white/10 text-white/90 hover:bg-black/40'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-4 h-4 rounded-md border border-white/30 shrink-0"
                            style={{ backgroundColor: surf.swatchColor }}
                          />
                          <span className="truncate">{surf.name}</span>
                        </div>
                        <span className="text-[10px] shrink-0">
                          {isActive ? (
                            <Check className="w-3.5 h-3.5 text-[#6EE7B7]" />
                          ) : isOwned ? (
                            'ใช้'
                          ) : (
                            `${surf.price}💡`
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {filteredDrawerItems.map((item) => {
                    const owned = state.ownedItems[item.id] || 0;
                    const placed = placedCounts[item.id] || 0;
                    const available = owned - placed;
                    const isPending = pendingItemId === item.id;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleInventoryClick(item.id)}
                        title={`${item.name} (${available > 0 ? `พร้อมวาง ${available}` : `วางแล้ว ${placed}/${owned}`})`}
                        className={`relative rounded-xl p-1 flex flex-col items-center transition-transform cursor-pointer ${
                          isPending
                            ? 'ring-2 ring-[#FDE68A] scale-105 bg-gradient-to-b from-[#4B8CE2] to-[#7FB3F2]'
                            : 'bg-gradient-to-b from-[#6FA6E8] to-[#98C2F4] hover:scale-[1.04]'
                        }`}
                      >
                        <ItemThumbnail itemId={item.id} className="w-12 h-12" />
                        <span className="absolute bottom-0.5 right-0.5 px-1 rounded bg-[#1C110B]/85 text-[9px] font-mono-num text-white">
                          {available > 0 ? `+${available}` : `${placed}/${owned}`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="pt-2 mt-2 border-t border-white/15 text-[10px] text-white/75 leading-snug">
              คลิกที่ตัวอวตารในห้อง 3D เพื่อเปลี่ยนชุด ทรงผม และพร็อพได้ทันที
            </div>
          </aside>
        )}

        {/* Right Circular White Icon Category Rail (Setup Dream Room Style) */}
        <div className="hidden md:flex flex-col gap-2 absolute right-3 top-16 z-10">
          {RAIL_CATEGORIES.map((cat) => {
            const active = drawerOpen && drawerCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setDrawerCategory(cat.id);
                  setDrawerOpen(true);
                }}
                title={cat.label}
                aria-label={cat.label}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-sm cursor-pointer ${
                  active
                    ? 'bg-white text-[#A9623F] scale-110 ring-2 ring-[#FDE68A]'
                    : 'bg-white/75 hover:bg-white text-[#4A3528]'
                }`}
              >
                {cat.icon}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setShowWardrobe(true)}
            title="ห้องแต่งตัวอวตาร"
            aria-label="ห้องแต่งตัวอวตาร"
            className="w-10 h-10 rounded-full bg-[#FDE68A] hover:bg-[#FCD34D] text-[#5C341E] flex items-center justify-center shadow-sm cursor-pointer"
          >
            <Shirt className="w-4 h-4" />
          </button>
        </div>

        {/* Bottom-Center Contextual Action Bar (Placement / Selection / Hint) */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 w-[92%] sm:w-auto max-w-xl">
          {pendingItemDef ? (
            <div className="flex items-center justify-between gap-3 px-4 py-2 rounded-2xl bg-[#1E3A8A]/95 text-white text-xs sm:text-sm shadow-lg border border-white/20">
              <span className="truncate">
                กำลังวาง <strong>{pendingItemDef.name}</strong> — แตะช่องพื้นในห้อง 3D
              </span>
              <button
                type="button"
                onClick={() => setPendingItemId(null)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white text-[#1E3A8A] text-xs font-semibold shrink-0 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                ยกเลิก
              </button>
            </div>
          ) : selectedPlaced && selectedItemDef ? (
            <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 rounded-2xl bg-[#2C1C13]/95 text-white text-xs shadow-lg border border-white/20">
              <span className="font-semibold truncate max-w-[160px] sm:max-w-[220px]">
                {selectedItemDef.name}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onRotateItem(selectedPlaced.instanceId)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white text-[#1F1D1A] font-medium hover:bg-[#FAF6EE] cursor-pointer"
                  title="หมุน 90 องศา"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  หมุน 90°
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onRemoveItem(selectedPlaced.instanceId);
                    setSelectedInstanceId(null);
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#E11D48] text-white font-medium hover:bg-[#BE123C] cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  เก็บเข้าคลัง
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedInstanceId(null)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/15 hover:bg-white/25 cursor-pointer"
                  aria-label="ปิดการเลือก"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="px-4 py-1.5 rounded-full bg-[#2C1C13]/80 text-white/90 text-[11px] sm:text-xs text-center border border-white/10">
              ลากหมุนมุมกล้อง 3D · แตะเฟอร์นิเจอร์เพื่อย้าย/หมุน · แตะอวตารเพื่อเปลี่ยนชุด
            </div>
          )}
        </div>
      </section>

      {/* Mobile / Quick Inventory Strip + Fame & Avatar Card Below Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Studio Fame & Avatar Quick Card */}
        <section className="lg:col-span-4 bg-white border border-[#E7E1D6] rounded-2xl p-5 flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="text-base font-semibold text-[#1F1D1A]">ระดับความปังสตูดิโอ</h2>
              <span className="font-mono-num text-sm font-semibold text-[#D97706]">
                {state.fame} / {nextMilestone} Fame
              </span>
            </div>
            <p className="text-xs text-[#6E675F] mt-1">
              ตำแหน่งปัจจุบัน: <span className="font-medium text-[#1F1D1A]">{studioRank}</span> · จัดวางแล้ว{' '}
              <span className="font-mono-num font-semibold text-[#1F1D1A]">
                {state.placedItems.length}
              </span>{' '}
              ชิ้น
            </p>
            <div className="mt-3 h-2.5 w-full rounded-full bg-[#F1ECE2] overflow-hidden">
              <div
                className="h-full bg-[#D97706] rounded-full transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2 border-t border-[#F1ECE2]">
            <button
              type="button"
              onClick={() => setShowWardrobe(true)}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 min-h-[42px] rounded-xl bg-[#A9623F] text-white text-xs sm:text-sm font-medium hover:bg-[#8E4F30] cursor-pointer"
            >
              <Shirt className="w-4 h-4" />
              แต่งตัวอวตาร 3D
            </button>
            <button
              type="button"
              onClick={() => onGoToShop('avatar')}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 min-h-[42px] rounded-xl border border-[#DED5C5] bg-[#FAF8F4] text-xs sm:text-sm font-medium text-[#1F1D1A] hover:bg-[#F1ECE2] cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-[#D97706]" />
              ช้อปแฟชั่น
            </button>
          </div>
        </section>

        {/* Full Inventory & Surface Quick Bar (Especially handy on Mobile) */}
        <section className="lg:col-span-8 bg-white border border-[#E7E1D6] rounded-2xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-[#D97706]" />
              <h2 className="text-base font-semibold text-[#1F1D1A]">
                คลังอุปกรณ์ในสตูดิโอของฉัน
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onGoToShop('all')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-xl border border-[#DED5C5] bg-[#FAF8F4] text-xs font-medium text-[#1F1D1A] hover:bg-[#F1ECE2] cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-[#2563EB]" />
              ไปช้อปอุปกรณ์เพิ่ม
            </button>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
            {ownedItemList.map((item) => {
              const owned = state.ownedItems[item.id] || 0;
              const placed = placedCounts[item.id] || 0;
              const available = owned - placed;
              const isPending = pendingItemId === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleInventoryClick(item.id)}
                  className={`group flex flex-col items-center text-center p-2.5 rounded-xl border transition-all cursor-pointer ${
                    isPending
                      ? 'bg-[#EFF6FF] border-[#2563EB] shadow-xs -translate-y-0.5'
                      : available > 0
                      ? 'bg-[#FAF8F4] border-[#E7E1D6] hover:border-[#C2B7A5]'
                      : 'bg-white border-[#EFEAE0] hover:border-[#D5CCB9]'
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-b from-[#6FA6E8] to-[#98C2F4] flex items-center justify-center mb-1.5 shadow-xs">
                    <ItemThumbnail itemId={item.id} className="w-10 h-10" />
                  </div>
                  <div className="text-[11px] font-medium text-[#1F1D1A] line-clamp-1 w-full">
                    {item.name}
                  </div>
                  <div className="text-[10px] text-[#6E675F] mt-0.5 font-mono-num">
                    {available > 0 ? (
                      <span className="text-[#2563EB] font-semibold">วางได้ {available}</span>
                    ) : (
                      <span>วางแล้ว {placed}/{owned}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      {/* Interactive 3D Avatar Wardrobe Modal */}
      {showWardrobe && (
        <AvatarWardrobeModal
          avatar={state.avatar}
          ownedAvatarItems={state.ownedAvatarItems}
          onUpdateAvatar={onUpdateAvatar}
          onGoToAvatarShop={() => onGoToShop('avatar')}
          onClose={() => setShowWardrobe(false)}
        />
      )}
    </div>
  );
};
