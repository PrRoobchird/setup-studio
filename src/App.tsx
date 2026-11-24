import React, { useEffect, useRef, useState } from 'react';
import {
  Camera,
  Coins,
  Home,
  RotateCcw,
  ShoppingBag,
  Star,
  UserPen,
  Users,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { ArtCritiqueTab } from './components/ArtCritiqueTab';
import { ClassmatesTab } from './components/ClassmatesTab';
import { MyStudioTab } from './components/MyStudioTab';
import { ShopAndQuizTab, ShopFilter } from './components/ShopAndQuizTab';
import {
  AVATAR_ITEM_MAP,
  FLOOR_MAP,
  INITIAL_AVATAR_CONFIG,
  INITIAL_GAME_STATE,
  INITIAL_OWNED_AVATAR_ITEMS,
  ITEM_MAP,
  MAJOR_TRACKS,
  WALL_MAP,
  getStudioRank,
} from './data/catalog';
import {
  ArtSubmission,
  AvatarConfig,
  MajorTrack,
  StickerType,
  StudioGameState,
  TabId,
} from './types/studio';
import { playTone } from './utils/sound';

const STORAGE_KEY = 'born_to_be_art_dream_studio_v1';

function loadSavedState(): StudioGameState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_GAME_STATE;
    const parsed = JSON.parse(raw) as Partial<StudioGameState>;

    const rawPlaced = Array.isArray(parsed.placedItems)
      ? parsed.placedItems
      : INITIAL_GAME_STATE.placedItems;

    const normalizedPlaced = rawPlaced.map((p) => ({
      ...p,
      rotationStep:
        typeof p.rotationStep === 'number'
          ? p.rotationStep
          : p.flipped
          ? 1
          : 0,
    }));

    return {
      ...INITIAL_GAME_STATE,
      ...parsed,
      ownedItems: { ...INITIAL_GAME_STATE.ownedItems, ...(parsed.ownedItems || {}) },
      ownedWalls:
        Array.isArray(parsed.ownedWalls) && parsed.ownedWalls.length > 0
          ? parsed.ownedWalls
          : INITIAL_GAME_STATE.ownedWalls,
      ownedFloors:
        Array.isArray(parsed.ownedFloors) && parsed.ownedFloors.length > 0
          ? parsed.ownedFloors
          : INITIAL_GAME_STATE.ownedFloors,
      placedItems: normalizedPlaced,
      avatar: {
        ...INITIAL_AVATAR_CONFIG,
        ...(parsed.avatar || {}),
      },
      ownedAvatarItems: Array.isArray(parsed.ownedAvatarItems)
        ? Array.from(new Set([...INITIAL_OWNED_AVATAR_ITEMS, ...parsed.ownedAvatarItems]))
        : INITIAL_OWNED_AVATAR_ITEMS,
      gallery: Array.isArray(parsed.gallery) ? parsed.gallery : [],
      votedClassmates: parsed.votedClassmates || {},
    };
  } catch {
    return INITIAL_GAME_STATE;
  }
}

interface ToastNotice {
  id: number;
  text: string;
  tone: 'reward' | 'info';
}

export default function App() {
  const [state, setState] = useState<StudioGameState>(loadSavedState);
  const [activeTab, setActiveTab] = useState<TabId>('studio');
  const [shopFilter, setShopFilter] = useState<ShopFilter>('all');
  const [coinBounce, setCoinBounce] = useState(false);
  const [toasts, setToasts] = useState<ToastNotice[]>([]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  const [draftName, setDraftName] = useState(state.studentName);
  const [draftTrack, setDraftTrack] = useState<MajorTrack>(state.majorTrack);

  const toastIdRef = useRef(0);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota errors
    }
  }, [state]);

  const pushToast = (text: string, tone: 'reward' | 'info' = 'reward') => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev.slice(-2), { id, text, tone }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2400);
  };

  const triggerCoinBounce = () => {
    setCoinBounce(false);
    requestAnimationFrame(() => setCoinBounce(true));
    setTimeout(() => setCoinBounce(false), 450);
  };

  // Room placement handlers
  const handlePlaceItem = (itemId: string, x: number, y: number) => {
    const def = ITEM_MAP[itemId];
    if (!def) return;
    setState((prev) => {
      const occupied = prev.placedItems.some((p) => p.x === x && p.y === y);
      if (occupied) return prev;
      const newInstance = {
        instanceId: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        itemId,
        x,
        y,
        rotationStep: 0,
      };
      return {
        ...prev,
        placedItems: [...prev.placedItems, newInstance],
      };
    });
    playTone('place', state.soundEnabled);
    pushToast(`วาง ${def.name} ลงในห้อง 3D แล้ว`, 'info');
  };

  const handleMoveOrSwapItem = (instanceId: string, x: number, y: number) => {
    setState((prev) => {
      const moving = prev.placedItems.find((p) => p.instanceId === instanceId);
      if (!moving) return prev;
      const target = prev.placedItems.find((p) => p.x === x && p.y === y);

      const updated = prev.placedItems.map((p) => {
        if (p.instanceId === instanceId) {
          return { ...p, x, y };
        }
        if (target && p.instanceId === target.instanceId) {
          return { ...p, x: moving.x, y: moving.y };
        }
        return p;
      });
      return { ...prev, placedItems: updated };
    });
    playTone('place', state.soundEnabled);
  };

  const handleRotateItem = (instanceId: string) => {
    setState((prev) => ({
      ...prev,
      placedItems: prev.placedItems.map((p) =>
        p.instanceId === instanceId
          ? { ...p, rotationStep: ((p.rotationStep ?? 0) + 1) % 4 }
          : p
      ),
    }));
    playTone('click', state.soundEnabled);
  };

  const handleRemoveItem = (instanceId: string) => {
    setState((prev) => ({
      ...prev,
      placedItems: prev.placedItems.filter((p) => p.instanceId !== instanceId),
    }));
    playTone('click', state.soundEnabled);
    pushToast('เก็บไอเทมเข้าคลังแล้ว', 'info');
  };

  const handleSelectWall = (wallId: string) => {
    if (!state.ownedWalls.includes(wallId)) return;
    setState((prev) => ({ ...prev, activeWallId: wallId }));
    playTone('click', state.soundEnabled);
  };

  const handleSelectFloor = (floorId: string) => {
    if (!state.ownedFloors.includes(floorId)) return;
    setState((prev) => ({ ...prev, activeFloorId: floorId }));
    playTone('click', state.soundEnabled);
  };

  // Avatar customization & fashion purchase
  const handleUpdateAvatar = (patch: Partial<AvatarConfig>) => {
    setState((prev) => ({
      ...prev,
      avatar: { ...prev.avatar, ...patch },
    }));
    playTone('click', state.soundEnabled);
  };

  const handleBuyAvatarItem = (itemId: string) => {
    const item = AVATAR_ITEM_MAP[itemId];
    if (!item || state.ownedAvatarItems.includes(itemId) || state.coins < item.price) {
      playTone('error', state.soundEnabled);
      return;
    }
    setState((prev) => {
      if (prev.ownedAvatarItems.includes(itemId) || prev.coins < item.price) return prev;
      const nextAvatar: AvatarConfig = { ...prev.avatar };
      if (item.slot === 'outfit') nextAvatar.outfitId = item.id;
      if (item.slot === 'headwear') nextAvatar.headwearId = item.id;
      if (item.slot === 'glasses') nextAvatar.glassesId = item.id;
      if (item.slot === 'handItem') nextAvatar.handItemId = item.id;

      return {
        ...prev,
        coins: prev.coins - item.price,
        fame: prev.fame + item.fameBonus,
        ownedAvatarItems: [...prev.ownedAvatarItems, item.id],
        avatar: nextAvatar,
      };
    });
    playTone('coin', state.soundEnabled);
    pushToast(`ซื้อและสวม ${item.name} แล้ว (+${item.fameBonus} ⭐)`);
  };

  // Critique claim
  const handleClaimCritique = (submission: ArtSubmission) => {
    setState((prev) => ({
      ...prev,
      coins: prev.coins + submission.critique.coinsEarned,
      fame: prev.fame + submission.critique.fameEarned,
      gallery: [submission, ...prev.gallery].slice(0, 24),
    }));
    playTone('success', state.soundEnabled);
    triggerCoinBounce();
    pushToast(
      `+${submission.critique.coinsEarned} 💡 · +${submission.critique.fameEarned} ⭐ เข้าสตูดิโอ!`
    );
  };

  // Shop handlers
  const handleBuyItem = (itemId: string) => {
    const item = ITEM_MAP[itemId];
    if (!item || state.coins < item.price) {
      playTone('error', state.soundEnabled);
      return;
    }

    let autoPlaced = false;
    setState((prev) => {
      if (prev.coins < item.price) return prev;
      const occupiedSet = new Set(prev.placedItems.map((p) => `${p.x},${p.y}`));
      let emptySpot: { x: number; y: number } | null = null;
      for (let y = 0; y < 5 && !emptySpot; y++) {
        for (let x = 0; x < 5 && !emptySpot; x++) {
          if (!occupiedSet.has(`${x},${y}`)) {
            emptySpot = { x, y };
          }
        }
      }

      const nextPlaced = emptySpot
        ? [
            ...prev.placedItems,
            {
              instanceId: `buy-${Date.now()}`,
              itemId: item.id,
              x: emptySpot.x,
              y: emptySpot.y,
              rotationStep: 0,
            },
          ]
        : prev.placedItems;

      autoPlaced = Boolean(emptySpot);

      return {
        ...prev,
        coins: prev.coins - item.price,
        fame: prev.fame + item.fameBonus,
        ownedItems: {
          ...prev.ownedItems,
          [item.id]: (prev.ownedItems[item.id] || 0) + 1,
        },
        placedItems: nextPlaced,
      };
    });

    playTone('coin', state.soundEnabled);
    pushToast(
      autoPlaced
        ? `ซื้อ ${item.name} แล้ว (+${item.fameBonus} ⭐) วางในห้องให้เลย!`
        : `ซื้อ ${item.name} แล้ว (+${item.fameBonus} ⭐) เก็บในคลังแล้ว!`
    );
  };

  const handleBuyWall = (wallId: string) => {
    const wall = WALL_MAP[wallId];
    if (!wall || state.ownedWalls.includes(wallId) || state.coins < wall.price) return;
    setState((prev) => ({
      ...prev,
      coins: prev.coins - wall.price,
      fame: prev.fame + wall.fameBonus,
      ownedWalls: [...prev.ownedWalls, wallId],
      activeWallId: wallId,
    }));
    playTone('coin', state.soundEnabled);
    pushToast(`เปลี่ยนเป็น ${wall.name} (+${wall.fameBonus} ⭐)`);
  };

  const handleBuyFloor = (floorId: string) => {
    const floor = FLOOR_MAP[floorId];
    if (!floor || state.ownedFloors.includes(floorId) || state.coins < floor.price) return;
    setState((prev) => ({
      ...prev,
      coins: prev.coins - floor.price,
      fame: prev.fame + floor.fameBonus,
      ownedFloors: [...prev.ownedFloors, floorId],
      activeFloorId: floorId,
    }));
    playTone('coin', state.soundEnabled);
    pushToast(`เปลี่ยนเป็น ${floor.name} (+${floor.fameBonus} ⭐)`);
  };

  const handleQuizAnswered = (isCorrect: boolean) => {
    setState((prev) => ({
      ...prev,
      coins: prev.coins + (isCorrect ? 50 : 0),
      quizAttemptCount: prev.quizAttemptCount + 1,
      quizCorrectCount: prev.quizCorrectCount + (isCorrect ? 1 : 0),
    }));
    if (isCorrect) {
      playTone('coin', state.soundEnabled);
      triggerCoinBounce();
      pushToast('ตอบถูก! รับ +50 Idea Coins');
    } else {
      playTone('error', state.soundEnabled);
    }
  };

  const handleSendSticker = (classmateId: string, sticker: StickerType) => {
    if (state.votedClassmates[classmateId]) return;
    setState((prev) => {
      if (prev.votedClassmates[classmateId]) return prev;
      return {
        ...prev,
        coins: prev.coins + 20,
        votedClassmates: {
          ...prev.votedClassmates,
          [classmateId]: sticker,
        },
      };
    });
    playTone('coin', state.soundEnabled);
    triggerCoinBounce();
    pushToast(`ส่ง "${sticker}" แล้ว · รับโบนัส +20 💡`);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedName = draftName.trim() || 'น้องอาร์ต';
    setState((prev) => ({
      ...prev,
      studentName: cleanedName,
      majorTrack: draftTrack,
    }));
    setShowProfileModal(false);
    playTone('click', state.soundEnabled);
    pushToast('อัปเดตข้อมูลนักเรียนแล้ว', 'info');
  };

  const handleResetDemo = () => {
    localStorage.removeItem(STORAGE_KEY);
    setState(INITIAL_GAME_STATE);
    setDraftName(INITIAL_GAME_STATE.studentName);
    setDraftTrack(INITIAL_GAME_STATE.majorTrack);
    setShowResetModal(false);
    setActiveTab('studio');
    playTone('click', INITIAL_GAME_STATE.soundEnabled);
    pushToast('รีเซ็ตสตูดิโอเริ่มต้นเรียบร้อย', 'info');
  };

  const openShopWithFilter = (filter: 'all' | 'avatar' = 'all') => {
    setShopFilter(filter);
    setActiveTab('shop');
  };

  const navItems: { id: TabId; label: string; shortLabel: string; icon: React.ReactNode }[] = [
    {
      id: 'studio',
      label: 'สตูดิโอของฉัน',
      shortLabel: 'สตูดิโอ',
      icon: <Home className="w-5 h-5" />,
    },
    {
      id: 'critique',
      label: 'ส่งงานตรวจ',
      shortLabel: 'ส่งงาน',
      icon: <Camera className="w-5 h-5" />,
    },
    {
      id: 'shop',
      label: 'ร้านค้า & ควิซ',
      shortLabel: 'ร้านค้า',
      icon: <ShoppingBag className="w-5 h-5" />,
    },
    {
      id: 'classmates',
      label: 'ส่องห้องเพื่อน',
      shortLabel: 'เพื่อน',
      icon: <Users className="w-5 h-5" />,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F4] text-[#1F1D1A] pb-20 md:pb-8">
      {/* Top Bar */}
      <header className="bg-white/95 backdrop-blur-sm border-b border-[#E7E1D6] md:sticky md:top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-8">
          <button
            type="button"
            onClick={() => setActiveTab('studio')}
            className="font-display text-base sm:text-lg font-bold tracking-tight text-[#1F1D1A] whitespace-nowrap shrink-0 cursor-pointer"
          >
            Born to be Art
          </button>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#6E675F]">
            {navItems.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    if (tab.id === 'shop') setShopFilter('all');
                    setActiveTab(tab.id);
                  }}
                  className={`py-2 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    isActive
                      ? 'border-[#2563EB] text-[#1F1D1A] font-semibold'
                      : 'border-transparent hover:text-[#1F1D1A]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>

          <div className="shrink-0">
            <button
              type="button"
              onClick={() => {
                setDraftName(state.studentName);
                setDraftTrack(state.majorTrack);
                setShowProfileModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[38px] rounded-xl bg-[#FAF8F4] border border-[#DED5C5] text-xs sm:text-sm font-medium text-[#1F1D1A] hover:bg-[#F1ECE2] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <UserPen className="w-4 h-4 text-[#2563EB]" />
              <span>โปรไฟล์นักเรียน</span>
            </button>
          </div>
        </div>
      </header>

      {/* Studio Status Strip */}
      <div className="border-b border-[#ECE6DA] bg-[#FAF6EE]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs sm:text-sm text-[#6E675F] flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="font-semibold text-[#1F1D1A]">{state.studentName}</span>
            <span aria-hidden="true">·</span>
            <span>{state.majorTrack}</span>
            <span aria-hidden="true" className="hidden sm:inline">·</span>
            <span className="hidden sm:inline text-[#2D6A4F] font-medium">
              {getStudioRank(state.fame)}
            </span>
          </div>

          <div className="flex items-center gap-4 sm:gap-5">
            <div
              className={`inline-flex items-center gap-1.5 font-mono-num text-sm sm:text-base font-bold text-[#D97706] ${
                coinBounce ? 'animate-coin-bounce' : ''
              }`}
              title="Idea Coins"
            >
              <Coins className="w-4 h-4" />
              <span>{state.coins.toLocaleString()}</span>
              <span className="text-xs font-sans font-medium text-[#6E675F]">Idea Coins</span>
            </div>

            <div className="h-4 w-px bg-[#DED5C5]" />

            <div
              className="inline-flex items-center gap-1.5 font-mono-num text-sm sm:text-base font-bold text-[#2D6A4F]"
              title="Studio Fame"
            >
              <Star className="w-4 h-4 fill-[#2D6A4F]" />
              <span>{state.fame.toLocaleString()}</span>
              <span className="text-xs font-sans font-medium text-[#6E675F]">Fame</span>
            </div>

            <button
              type="button"
              onClick={() =>
                setState((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }))
              }
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-[#6E675F] hover:bg-[#ECE6DA] transition-colors cursor-pointer"
              aria-label={state.soundEnabled ? 'ปิดเสียงเอฟเฟกต์' : 'เปิดเสียงเอฟเฟกต์'}
              title={state.soundEnabled ? 'ปิดเสียง' : 'เปิดเสียง'}
            >
              {state.soundEnabled ? (
                <Volume2 className="w-4 h-4" />
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Floating Reward / Feedback Toasts */}
      <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`animate-float-reward px-4 py-2.5 rounded-xl border shadow-md text-xs sm:text-sm font-medium ${
              toast.tone === 'reward'
                ? 'bg-[#1F1D1A] text-white border-[#33302B]'
                : 'bg-white text-[#1F1D1A] border-[#E7E1D6]'
            }`}
          >
            {toast.text}
          </div>
        ))}
      </div>

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-5 sm:py-6">
        {activeTab === 'studio' && (
          <MyStudioTab
            state={state}
            onPlaceItem={handlePlaceItem}
            onMoveOrSwapItem={handleMoveOrSwapItem}
            onRotateItem={handleRotateItem}
            onRemoveItem={handleRemoveItem}
            onSelectWall={handleSelectWall}
            onSelectFloor={handleSelectFloor}
            onUpdateAvatar={handleUpdateAvatar}
            onGoToShop={openShopWithFilter}
            onGoToCritique={() => setActiveTab('critique')}
          />
        )}

        {activeTab === 'critique' && (
          <ArtCritiqueTab
            studentTrack={state.majorTrack}
            gallery={state.gallery}
            onClaimCritique={handleClaimCritique}
          />
        )}

        {activeTab === 'shop' && (
          <ShopAndQuizTab
            state={state}
            initialFilter={shopFilter}
            onBuyItem={handleBuyItem}
            onBuyWall={handleBuyWall}
            onSelectWall={handleSelectWall}
            onBuyFloor={handleBuyFloor}
            onSelectFloor={handleSelectFloor}
            onBuyAvatarItem={handleBuyAvatarItem}
            onGoToStudio={() => setActiveTab('studio')}
            onQuizAnswered={handleQuizAnswered}
          />
        )}

        {activeTab === 'classmates' && (
          <ClassmatesTab
            votedClassmates={state.votedClassmates}
            onSendSticker={handleSendSticker}
          />
        )}
      </main>

      {/* Footer with Reset Demo */}
      <footer className="max-w-7xl w-full mx-auto px-4 sm:px-6 pt-4 pb-6 flex flex-wrap items-center justify-between gap-3 text-xs text-[#8C8377] border-t border-[#ECE6DA]">
        <span>Born to be Art: Dream Studio · สตูดิโอติวศิลปะและการออกแบบ</span>
        <button
          type="button"
          onClick={() => setShowResetModal(true)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[#6E675F] hover:text-[#BE123C] hover:bg-[#FFF1F2] transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Demo
        </button>
      </footer>

      {/* Mobile Fixed Bottom Navigation Bar (< md) */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E7E1D6]"
        aria-label="เมนูหลักมือถือ"
      >
        <div className="grid grid-cols-4 h-14 items-center">
          {navItems.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  if (tab.id === 'shop') setShopFilter('all');
                  setActiveTab(tab.id);
                }}
                className={`flex flex-col items-center justify-center min-h-[44px] gap-0.5 text-[11px] font-medium transition-colors cursor-pointer ${
                  isActive ? 'text-[#2563EB]' : 'text-[#6E675F]'
                }`}
              >
                {tab.icon}
                <span className="truncate max-w-[72px]">{tab.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Edit Student Profile Modal */}
      {showProfileModal && (
        <div
          className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4"
          onClick={() => setShowProfileModal(false)}
        >
          <form
            onSubmit={handleSaveProfile}
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-[#E7E1D6] rounded-2xl max-w-md w-full p-5 sm:p-6 space-y-4"
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-[#1F1D1A]">
                ตั้งค่าโปรไฟล์นักเรียนศิลปะ
              </h2>
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-[#6E675F] hover:bg-[#FAF8F4] cursor-pointer"
                aria-label="ปิด"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="student-name" className="block text-xs font-medium text-[#6E675F]">
                ชื่อเล่น / ชื่อเจ้าของสตูดิโอ
              </label>
              <input
                id="student-name"
                type="text"
                maxLength={24}
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                className="w-full px-3.5 py-2.5 min-h-[44px] rounded-xl bg-[#FAF8F4] border border-[#E7E1D6] text-sm text-[#1F1D1A] focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#6E675F]">
                สายการเรียนที่กำลังเตรียมพอร์ต
              </label>
              <div className="grid grid-cols-1 gap-1.5">
                {MAJOR_TRACKS.map((track) => (
                  <button
                    key={track}
                    type="button"
                    onClick={() => setDraftTrack(track)}
                    className={`px-3.5 py-2.5 min-h-[42px] rounded-xl border text-left text-sm transition-colors cursor-pointer ${
                      draftTrack === track
                        ? 'bg-[#EFF6FF] border-[#2563EB] text-[#1E3A8A] font-medium'
                        : 'bg-[#FAF8F4] border-[#E7E1D6] text-[#1F1D1A] hover:bg-[#F1ECE2]'
                    }`}
                  >
                    {track}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                className="px-4 py-2.5 min-h-[44px] rounded-xl border border-[#DED5C5] text-sm font-medium text-[#1F1D1A] hover:bg-[#FAF8F4] cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 min-h-[44px] rounded-xl bg-[#2563EB] text-white text-sm font-medium hover:bg-[#1D4ED8] cursor-pointer"
              >
                บันทึก
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reset Demo Confirmation Modal */}
      {showResetModal && (
        <div
          className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4"
          onClick={() => setShowResetModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-[#E7E1D6] rounded-2xl max-w-sm w-full p-5 sm:p-6 space-y-4"
          >
            <h2 className="text-base font-semibold text-[#1F1D1A]">
              ยืนยันการ Reset Demo
            </h2>
            <p className="text-sm text-[#6E675F] leading-relaxed">
              ต้องการล้างข้อมูลสตูดิโอ เหรียญ ไอเทม และแกลเลอรีทั้งหมดเพื่อเริ่มเล่นใหม่ตั้งแต่ต้นใช่ไหม?
            </p>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 min-h-[42px] rounded-xl border border-[#DED5C5] text-sm font-medium text-[#1F1D1A] hover:bg-[#FAF8F4] cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleResetDemo}
                className="px-4 py-2 min-h-[42px] rounded-xl bg-[#E11D48] text-white text-sm font-medium hover:bg-[#BE123C] cursor-pointer"
              >
                รีเซ็ตเลย
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
