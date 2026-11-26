import React, { useEffect, useRef, useState } from 'react';
import {
  Brain,
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
import { QuizTab } from './components/QuizTab';
import { ShopFilter, ShopTab } from './components/ShopTab';
import {
  AVATAR_ITEM_MAP,
  CLASSMATE_STICKER_REWARD,
  DOOR_MAP,
  FLOOR_MAP,
  HEARTLESS_PENALTY_MS,
  INITIAL_AVATAR_CONFIG,
  INITIAL_GAME_STATE,
  INITIAL_OWNED_AVATAR_ITEMS,
  ITEM_MAP,
  MAJOR_TRACKS,
  MAX_FAME,
  PET_BREED_MAP,
  PET_DEATH_FAME_PENALTY,
  PET_DEATH_GRACE_MS,
  PET_FEED_INTERVAL_MS,
  PET_FOOD_MAP,
  QUIZ_CORRECT_REWARD,
  STUDIO_EXPANSION_FAME,
  STUDIO_EXPANSION_PRICE,
  WALL_FRAME_ITEMS,
  WALL_MAP,
  WINDOW_VIEW_MAP,
  findFreeTilesForPet,
  getOccupiedTileSet,
  getPetFootprintTiles,
  getRankInfo,
} from './data/catalog';
import {
  ArtSubmission,
  AvatarConfig,
  AvatarGender,
  AvatarSlot,
  MajorTrack,
  OwnedPet,
  PetSpecies,
  StickerType,
  StudioGameState,
  TabId,
  WallFrameArtwork,
  WallFrameType,
} from './types/studio';
import { DAILY_QUIZ_LIMIT, getLocalDateKey } from './data/tpatQuizBank';
import { playTone } from './utils/sound';

const STORAGE_KEY = 'born_to_be_art_dream_studio_v1';

function clampFame(current: number, delta: number): number {
  return Math.min(MAX_FAME, Math.max(0, current + Math.max(0, delta)));
}

function reconcilePetLifecycle(
  prev: StudioGameState,
  now: number
): {
  nextState: StudioGameState;
  diedNames: string[];
  sickNames: string[];
  penaltyCleared: boolean;
} {
  const diedNames: string[] = [];
  const sickNames: string[] = [];
  const survivingPets: OwnedPet[] = [];

  for (const pet of prev.pets) {
    const elapsed = Math.max(0, now - pet.lastFedAt);
    if (elapsed > PET_FEED_INTERVAL_MS + PET_DEATH_GRACE_MS) {
      diedNames.push(pet.nickname);
    } else if (elapsed > PET_FEED_INTERVAL_MS) {
      if (pet.status !== 'sick') {
        sickNames.push(pet.nickname);
      }
      survivingPets.push(pet.status === 'sick' ? pet : { ...pet, status: 'sick' });
    } else {
      survivingPets.push(pet.status === 'healthy' ? pet : { ...pet, status: 'healthy' });
    }
  }

  let nextPenaltyUntil = prev.heartlessPenaltyUntil;
  let penaltyCleared = false;
  if (nextPenaltyUntil && now >= nextPenaltyUntil && diedNames.length === 0) {
    nextPenaltyUntil = null;
    penaltyCleared = true;
  }
  if (diedNames.length > 0) {
    nextPenaltyUntil = now + HEARTLESS_PENALTY_MS;
  }

  const petsChanged =
    diedNames.length > 0 ||
    sickNames.length > 0 ||
    survivingPets.length !== prev.pets.length ||
    survivingPets.some((p, idx) => p !== prev.pets[idx]);

  if (!petsChanged && !penaltyCleared) {
    return { nextState: prev, diedNames, sickNames, penaltyCleared };
  }

  const fameLoss = diedNames.length * PET_DEATH_FAME_PENALTY;
  return {
    nextState: {
      ...prev,
      pets: survivingPets,
      deadPetCount: prev.deadPetCount + diedNames.length,
      fame: Math.max(0, prev.fame - fameLoss),
      heartlessPenaltyUntil: nextPenaltyUntil,
    },
    diedNames,
    sickNames,
    penaltyCleared,
  };
}

function loadSavedState(): StudioGameState {
  const today = getLocalDateKey();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { ...INITIAL_GAME_STATE, dailyQuizDate: today, dailyQuizCount: 0 };
    }
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

    const answeredQuizIds = Array.isArray(parsed.answeredQuizIds)
      ? parsed.answeredQuizIds.filter((id): id is string => typeof id === 'string')
      : [];
    const isSameDay = parsed.dailyQuizDate === today;
    const dailyQuizCount = isSameDay ? Math.max(0, Number(parsed.dailyQuizCount) || 0) : 0;

    const rawFrames = Array.isArray(parsed.ownedWallFrames)
      ? parsed.ownedWallFrames.filter(
          (f): f is WallFrameType => f === 'landscape' || f === 'portrait'
        )
      : [];

    const ownedDoors = Array.isArray(parsed.ownedDoors)
      ? Array.from(new Set(['door_terracotta', ...parsed.ownedDoors]))
      : INITIAL_GAME_STATE.ownedDoors;

    const activeDoorId =
      typeof parsed.activeDoorId === 'string' &&
      ownedDoors.includes(parsed.activeDoorId) &&
      DOOR_MAP[parsed.activeDoorId]
        ? parsed.activeDoorId
        : INITIAL_GAME_STATE.activeDoorId;

    const ownedWindowViews = Array.isArray(parsed.ownedWindowViews)
      ? Array.from(new Set(['city_warm', ...parsed.ownedWindowViews]))
      : INITIAL_GAME_STATE.ownedWindowViews;

    const activeWindowViewId =
      typeof parsed.activeWindowViewId === 'string' &&
      ownedWindowViews.includes(parsed.activeWindowViewId) &&
      WINDOW_VIEW_MAP[parsed.activeWindowViewId]
        ? parsed.activeWindowViewId
        : INITIAL_GAME_STATE.activeWindowViewId;

    const now = Date.now();
    const rawPets: OwnedPet[] = Array.isArray(parsed.pets)
      ? parsed.pets
          .filter(
            (p): p is OwnedPet =>
              Boolean(p && typeof p.instanceId === 'string' && PET_BREED_MAP[p.breedId])
          )
          .map((p) => ({
            ...p,
            rotationStep: typeof p.rotationStep === 'number' ? p.rotationStep % 4 : 0,
            adoptedAt: typeof p.adoptedAt === 'number' ? p.adoptedAt : now,
            lastFedAt: typeof p.lastFedAt === 'number' ? p.lastFedAt : now,
            status: p.status === 'sick' ? 'sick' : 'healthy',
          }))
      : [];

    const hydrated: StudioGameState = {
      ...INITIAL_GAME_STATE,
      ...parsed,
      fame: Math.min(MAX_FAME, Math.max(0, Number(parsed.fame ?? INITIAL_GAME_STATE.fame))),
      studioExpanded: Boolean(parsed.studioExpanded),
      ownedItems: { ...INITIAL_GAME_STATE.ownedItems, ...(parsed.ownedItems || {}) },
      ownedWalls:
        Array.isArray(parsed.ownedWalls) && parsed.ownedWalls.length > 0
          ? parsed.ownedWalls
          : INITIAL_GAME_STATE.ownedWalls,
      ownedFloors:
        Array.isArray(parsed.ownedFloors) && parsed.ownedFloors.length > 0
          ? parsed.ownedFloors
          : INITIAL_GAME_STATE.ownedFloors,
      ownedDoors,
      activeDoorId,
      ownedWindowViews,
      activeWindowViewId,
      placedItems: normalizedPlaced,
      ownedWallFrames: Array.from(new Set(rawFrames)),
      wallFrameArtworks: {
        landscape: parsed.wallFrameArtworks?.landscape ?? null,
        portrait: parsed.wallFrameArtworks?.portrait ?? null,
      },
      pets: rawPets,
      petFood: {
        ...INITIAL_GAME_STATE.petFood,
        ...(parsed.petFood || {}),
      },
      heartlessPenaltyUntil:
        typeof parsed.heartlessPenaltyUntil === 'number' ? parsed.heartlessPenaltyUntil : null,
      deadPetCount: Math.max(0, Number(parsed.deadPetCount) || 0),
      avatar: {
        ...INITIAL_AVATAR_CONFIG,
        ...(parsed.avatar || {}),
      },
      ownedAvatarItems: Array.isArray(parsed.ownedAvatarItems)
        ? Array.from(new Set([...INITIAL_OWNED_AVATAR_ITEMS, ...parsed.ownedAvatarItems]))
        : INITIAL_OWNED_AVATAR_ITEMS,
      hasSelectedGender: Boolean(parsed.hasSelectedGender),
      gallery: Array.isArray(parsed.gallery) ? parsed.gallery : [],
      votedClassmates: parsed.votedClassmates || {},
      answeredQuizIds,
      dailyQuizDate: today,
      dailyQuizCount,
    };

    const ownedAvSet = new Set(hydrated.ownedAvatarItems);
    if (!ownedAvSet.has(hydrated.avatar.outfitId) || !AVATAR_ITEM_MAP[hydrated.avatar.outfitId]) {
      hydrated.avatar.outfitId = 'outfit_clay_overalls';
    }
    if (!ownedAvSet.has(hydrated.avatar.headwearId)) {
      hydrated.avatar.headwearId = 'head_none';
    }
    if (!ownedAvSet.has(hydrated.avatar.glassesId)) {
      hydrated.avatar.glassesId = 'glasses_none';
    }
    if (!ownedAvSet.has(hydrated.avatar.handItemId)) {
      hydrated.avatar.handItemId = 'hand_none';
    }

    return reconcilePetLifecycle(hydrated, now).nextState;
  } catch {
    return { ...INITIAL_GAME_STATE, dailyQuizDate: today, dailyQuizCount: 0 };
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
  const [draftGender, setDraftGender] = useState<AvatarGender>(state.avatar.gender ?? 'female');

  const toastIdRef = useRef(0);
  const stateRef = useRef(state);
  stateRef.current = state;

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

  useEffect(() => {
    const checkPets = () => {
      const now = Date.now();
      const res = reconcilePetLifecycle(stateRef.current, now);
      if (res.nextState === stateRef.current) return;

      setState(res.nextState);
      if (res.diedNames.length > 0) {
        pushToast(
          `${res.diedNames.join(', ')} อดอาหารจนตาย! ติดสถานะ "คนใจร้าย" (สตูขาว-ดำ 7 วัน) และเสีย ${
            res.diedNames.length * PET_DEATH_FAME_PENALTY
          } ⭐`,
          'info'
        );
      } else if (res.sickNames.length > 0) {
        pushToast(
          `${res.sickNames.join(', ')} เริ่มป่วยแล้ว! รีบให้อาหารภายใน 3 วันนะ`,
          'info'
        );
      } else if (res.penaltyCleared) {
        pushToast('พ้นโทษ "คนใจร้าย" แล้ว สตูดิโอกลับมาสดใสเหมือนเดิม!', 'reward');
      }
    };

    const timer = window.setInterval(checkPets, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  // Room placement handlers
  const handlePlaceItem = (itemId: string, x: number, y: number) => {
    const def = ITEM_MAP[itemId];
    if (!def) return;
    const occupiedNow = getOccupiedTileSet(state.placedItems, state.pets);
    if (occupiedNow.has(`${x},${y}`)) {
      playTone('error', state.soundEnabled);
      pushToast('ช่องนี้มีเฟอร์นิเจอร์หรือคอกสัตว์เลี้ยงวางอยู่แล้ว', 'info');
      return;
    }
    setState((prev) => {
      const occupied = getOccupiedTileSet(prev.placedItems, prev.pets);
      if (occupied.has(`${x},${y}`)) return prev;
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
    const petOccupied = getOccupiedTileSet([], state.pets);
    if (petOccupied.has(`${x},${y}`)) {
      playTone('error', state.soundEnabled);
      pushToast('ช่องนี้มีคอก/กรงสัตว์เลี้ยงตั้งอยู่แล้ว!', 'info');
      return;
    }
    setState((prev) => {
      const petBlocked = getOccupiedTileSet([], prev.pets);
      if (petBlocked.has(`${x},${y}`)) return prev;
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

  const handleSelectDoor = (doorId: string) => {
    if (!state.ownedDoors.includes(doorId)) return;
    setState((prev) => ({ ...prev, activeDoorId: doorId }));
    playTone('click', state.soundEnabled);
  };

  const handleSelectWindowView = (viewId: string) => {
    if (!state.ownedWindowViews.includes(viewId)) return;
    setState((prev) => ({ ...prev, activeWindowViewId: viewId }));
    playTone('click', state.soundEnabled);
  };

  // Avatar customization & fashion purchase
  const handleUpdateAvatar = (patch: Partial<AvatarConfig>) => {
    setState((prev) => ({
      ...prev,
      hasSelectedGender: patch.gender ? true : prev.hasSelectedGender,
      avatar: { ...prev.avatar, ...patch },
    }));
    playTone('click', state.soundEnabled);
  };

  const handleSelectStarterGender = (gender: AvatarGender) => {
    setState((prev) => {
      const nextHair =
        prev.avatar.hairStyleId === 'bob' ||
        prev.avatar.hairStyleId === 'wavy' ||
        prev.avatar.hairStyleId === 'side_part' ||
        prev.avatar.hairStyleId === 'messy_short'
          ? gender === 'male'
            ? 'side_part'
            : 'bob'
          : prev.avatar.hairStyleId;
      return {
        ...prev,
        hasSelectedGender: true,
        avatar: {
          ...prev.avatar,
          gender,
          hairStyleId: nextHair,
        },
      };
    });
    playTone('click', state.soundEnabled);
    pushToast(
      gender === 'male' ? 'เลือกตัวละครอวตารผู้ชายแล้ว!' : 'เลือกตัวละครอวตารผู้หญิงแล้ว!',
      'info'
    );
  };

  const handleBuyAvatarItem = (itemId: string) => {
    const item = AVATAR_ITEM_MAP[itemId];
    if (!item || state.ownedAvatarItems.includes(itemId) || state.coins < item.price) {
      playTone('error', state.soundEnabled);
      return;
    }
    const gainedFame = Math.max(0, Math.min(item.fameBonus, MAX_FAME - state.fame));
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
        fame: clampFame(prev.fame, item.fameBonus),
        ownedAvatarItems: [...prev.ownedAvatarItems, item.id],
        avatar: nextAvatar,
      };
    });
    playTone('coin', state.soundEnabled);
    pushToast(
      gainedFame > 0
        ? `ซื้อและสวม ${item.name} แล้ว (+${gainedFame} ⭐)`
        : `ซื้อและสวม ${item.name} แล้ว!`
    );
  };

  const handleEquipOwnedAvatarItem = (slot: AvatarSlot, itemId: string) => {
    const item = AVATAR_ITEM_MAP[itemId];
    const isOwned =
      (item && item.price === 0) || state.ownedAvatarItems.includes(itemId);
    if (!item || !isOwned) {
      playTone('error', state.soundEnabled);
      return;
    }
    setState((prev) => {
      const ownedNow = item.price === 0 || prev.ownedAvatarItems.includes(itemId);
      if (!ownedNow) return prev;
      const nextAvatar: AvatarConfig = { ...prev.avatar };
      if (slot === 'outfit') nextAvatar.outfitId = itemId;
      if (slot === 'headwear') nextAvatar.headwearId = itemId;
      if (slot === 'glasses') nextAvatar.glassesId = itemId;
      if (slot === 'handItem') nextAvatar.handItemId = itemId;
      return { ...prev, avatar: nextAvatar };
    });
    playTone('click', state.soundEnabled);
    pushToast(`เปลี่ยนมาสวม ${item.name} ในสตูดิโอแล้ว`, 'info');
  };

  // Critique claim
  const handleClaimCritique = (submission: ArtSubmission) => {
    const gainedFame = Math.max(0, Math.min(submission.critique.fameEarned, MAX_FAME - state.fame));
    setState((prev) => ({
      ...prev,
      coins: prev.coins + submission.critique.coinsEarned,
      fame: clampFame(prev.fame, submission.critique.fameEarned),
      gallery: [submission, ...prev.gallery].slice(0, 24),
    }));
    playTone('success', state.soundEnabled);
    triggerCoinBounce();
    pushToast(
      gainedFame > 0
        ? `+${submission.critique.coinsEarned} 💡 · +${gainedFame} ⭐ เข้าสตูดิโอ!`
        : `+${submission.critique.coinsEarned} 💡 เข้าสตูดิโอ (Fame เต็ม ${MAX_FAME} แล้ว!)`
    );
  };

  // Shop handlers
  const handleBuyItem = (itemId: string) => {
    const item = ITEM_MAP[itemId];
    if (!item || state.coins < item.price) {
      playTone('error', state.soundEnabled);
      return;
    }

    const isFirstPurchase = (state.ownedItems[item.id] || 0) === 0;
    const fameToAdd = isFirstPurchase ? item.fameBonus : 0;
    const gainedFame = Math.max(0, Math.min(fameToAdd, MAX_FAME - state.fame));
    let autoPlaced = false;

    setState((prev) => {
      if (prev.coins < item.price) return prev;
      const gridLimit = prev.studioExpanded ? 7 : 5;
      const occupiedSet = getOccupiedTileSet(prev.placedItems, prev.pets);
      let emptySpot: { x: number; y: number } | null = null;
      for (let y = 0; y < gridLimit && !emptySpot; y++) {
        for (let x = 0; x < gridLimit && !emptySpot; x++) {
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
      const firstBuy = (prev.ownedItems[item.id] || 0) === 0;

      return {
        ...prev,
        coins: prev.coins - item.price,
        fame: firstBuy ? clampFame(prev.fame, item.fameBonus) : prev.fame,
        ownedItems: {
          ...prev.ownedItems,
          [item.id]: (prev.ownedItems[item.id] || 0) + 1,
        },
        placedItems: nextPlaced,
      };
    });

    playTone('coin', state.soundEnabled);
    const fameText = gainedFame > 0 ? ` (+${gainedFame} ⭐)` : '';
    pushToast(
      autoPlaced
        ? `ซื้อ ${item.name} แล้ว${fameText} วางในห้องให้เลย!`
        : `ซื้อ ${item.name} แล้ว${fameText} เก็บในคลังแล้ว!`
    );
  };

  const handleBuyWall = (wallId: string) => {
    const wall = WALL_MAP[wallId];
    if (!wall || state.ownedWalls.includes(wallId) || state.coins < wall.price) return;
    const gainedFame = Math.max(0, Math.min(wall.fameBonus, MAX_FAME - state.fame));
    setState((prev) => ({
      ...prev,
      coins: prev.coins - wall.price,
      fame: clampFame(prev.fame, wall.fameBonus),
      ownedWalls: [...prev.ownedWalls, wallId],
      activeWallId: wallId,
    }));
    playTone('coin', state.soundEnabled);
    pushToast(
      gainedFame > 0
        ? `เปลี่ยนเป็น ${wall.name} (+${gainedFame} ⭐)`
        : `เปลี่ยนเป็น ${wall.name} แล้ว!`
    );
  };

  const handleBuyFloor = (floorId: string) => {
    const floor = FLOOR_MAP[floorId];
    if (!floor || state.ownedFloors.includes(floorId) || state.coins < floor.price) return;
    const gainedFame = Math.max(0, Math.min(floor.fameBonus, MAX_FAME - state.fame));
    setState((prev) => ({
      ...prev,
      coins: prev.coins - floor.price,
      fame: clampFame(prev.fame, floor.fameBonus),
      ownedFloors: [...prev.ownedFloors, floorId],
      activeFloorId: floorId,
    }));
    playTone('coin', state.soundEnabled);
    pushToast(
      gainedFame > 0
        ? `เปลี่ยนเป็น ${floor.name} (+${gainedFame} ⭐)`
        : `เปลี่ยนเป็น ${floor.name} แล้ว!`
    );
  };

  const handleBuyDoor = (doorId: string) => {
    const door = DOOR_MAP[doorId];
    if (!door || state.ownedDoors.includes(doorId) || state.coins < door.price) {
      playTone('error', state.soundEnabled);
      return;
    }
    const gainedFame = Math.max(0, Math.min(door.fameBonus, MAX_FAME - state.fame));
    setState((prev) => {
      if (prev.ownedDoors.includes(doorId) || prev.coins < door.price) return prev;
      return {
        ...prev,
        coins: prev.coins - door.price,
        fame: clampFame(prev.fame, door.fameBonus),
        ownedDoors: [...prev.ownedDoors, doorId],
        activeDoorId: doorId,
      };
    });
    playTone('coin', state.soundEnabled);
    pushToast(
      gainedFame > 0
        ? `เปลี่ยนประตูเป็น ${door.name} (+${gainedFame} ⭐)`
        : `เปลี่ยนประตูเป็น ${door.name} แล้ว!`
    );
  };

  const handleBuyWallFrame = (frameType: WallFrameType) => {
    const frameItem = WALL_FRAME_ITEMS.find((f) => f.frameOrientation === frameType);
    if (
      !frameItem ||
      state.ownedWallFrames.includes(frameType) ||
      state.coins < frameItem.price
    ) {
      playTone('error', state.soundEnabled);
      return;
    }
    const gainedFame = Math.max(0, Math.min(frameItem.fameBonus, MAX_FAME - state.fame));
    setState((prev) => {
      if (prev.ownedWallFrames.includes(frameType) || prev.coins < frameItem.price) return prev;
      return {
        ...prev,
        coins: prev.coins - frameItem.price,
        fame: clampFame(prev.fame, frameItem.fameBonus),
        ownedWallFrames: [...prev.ownedWallFrames, frameType],
      };
    });
    playTone('coin', state.soundEnabled);
    pushToast(
      gainedFame > 0
        ? `ติดตั้ง ${frameItem.name} แล้ว (+${gainedFame} ⭐) เปลี่ยนรูปในห้องได้ไม่จำกัด!`
        : `ติดตั้ง ${frameItem.name} แล้ว เปลี่ยนรูปในห้องได้ไม่จำกัด!`
    );
  };

  const handleSetWallFrameArtwork = (frameType: WallFrameType, artwork: WallFrameArtwork | null) => {
    if (!state.ownedWallFrames.includes(frameType)) return;
    setState((prev) => ({
      ...prev,
      wallFrameArtworks: {
        ...prev.wallFrameArtworks,
        [frameType]: artwork,
      },
    }));
    playTone(artwork ? 'place' : 'click', state.soundEnabled);
    pushToast(
      artwork ? `อัปเดตภาพในเฟรมติดผนังแล้ว (${artwork.title})` : 'นำภาพออกจากเฟรมแล้ว',
      'info'
    );
  };

  const handleBuyWindowView = (viewId: string) => {
    const view = WINDOW_VIEW_MAP[viewId];
    if (!view || state.ownedWindowViews.includes(viewId) || state.coins < view.price) {
      playTone('error', state.soundEnabled);
      return;
    }
    const gainedFame = Math.max(0, Math.min(view.fameBonus, MAX_FAME - state.fame));
    setState((prev) => {
      if (prev.ownedWindowViews.includes(viewId) || prev.coins < view.price) return prev;
      return {
        ...prev,
        coins: prev.coins - view.price,
        fame: clampFame(prev.fame, view.fameBonus),
        ownedWindowViews: [...prev.ownedWindowViews, viewId],
        activeWindowViewId: viewId,
      };
    });
    playTone('coin', state.soundEnabled);
    pushToast(
      gainedFame > 0
        ? `เปลี่ยนวิวหน้าต่างเป็น ${view.name} (+${gainedFame} ⭐)`
        : `เปลี่ยนวิวหน้าต่างเป็น ${view.name} แล้ว!`
    );
  };

  // Pet adoption, feeding, moving, rotating & returning handlers
  const handleAdoptPet = (breedId: string) => {
    const breed = PET_BREED_MAP[breedId];
    if (!breed) return;
    const now = Date.now();
    const rankInfo = getRankInfo(state.fame, state.heartlessPenaltyUntil, now);

    if (rankInfo.isHeartless) {
      playTone('error', state.soundEnabled);
      pushToast(
        `ติดสถานะ "คนใจร้าย" อีก ${rankInfo.penaltyDaysLeft} วัน ยังรับเลี้ยงสัตว์เพิ่มไม่ได้นะ`,
        'info'
      );
      return;
    }
    if (state.pets.length >= rankInfo.maxPetSlots) {
      playTone('error', state.soundEnabled);
      pushToast(
        rankInfo.maxPetSlots === 0
          ? 'ต้องถึงขั้น 2 (51+ Fame) ก่อนจึงจะเริ่มเลี้ยงสัตว์ได้!'
          : `ตอนนี้เลี้ยงครบโควตา ${rankInfo.maxPetSlots} ตัวแล้ว เลื่อนขั้นเพื่อปลดล็อกเพิ่ม!`,
        'info'
      );
      return;
    }
    if (state.coins < breed.price) {
      playTone('error', state.soundEnabled);
      return;
    }

    const freeSpot = findFreeTilesForPet(
      breed.id,
      state.placedItems,
      state.pets,
      state.studioExpanded
    );
    if (!freeSpot) {
      playTone('error', state.soundEnabled);
      pushToast(
        `พื้นที่ว่างไม่พอสำหรับ ${breed.enclosureName} ลองเก็บเฟอร์นิเจอร์บางชิ้นก่อนนะ!`,
        'info'
      );
      return;
    }

    const gainedFame = Math.max(0, Math.min(breed.fameBonus, MAX_FAME - state.fame));
    const newPet: OwnedPet = {
      instanceId: `pet-${now}-${Math.random().toString(36).slice(2, 6)}`,
      breedId: breed.id,
      species: breed.species,
      nickname: breed.breedName.split(' ')[0] || breed.speciesLabel,
      x: freeSpot.x,
      y: freeSpot.y,
      rotationStep: freeSpot.rotationStep,
      adoptedAt: now,
      lastFedAt: now,
      status: 'healthy',
    };

    setState((prev) => ({
      ...prev,
      coins: prev.coins - breed.price,
      fame: clampFame(prev.fame, breed.fameBonus),
      pets: [...prev.pets, newPet],
    }));
    playTone('success', state.soundEnabled);
    triggerCoinBounce();
    pushToast(
      gainedFame > 0
        ? `รับเลี้ยง ${breed.breedName} เข้าสตูดิโอแล้ว (+${gainedFame} ⭐)`
        : `รับเลี้ยง ${breed.breedName} เข้าสตูดิโอแล้ว!`
    );
  };

  const handleBuyPetFood = (species: PetSpecies) => {
    const food = PET_FOOD_MAP[species];
    if (!food || state.coins < food.price) {
      playTone('error', state.soundEnabled);
      return;
    }
    setState((prev) => {
      if (prev.coins < food.price) return prev;
      return {
        ...prev,
        coins: prev.coins - food.price,
        petFood: {
          ...prev.petFood,
          [species]: (prev.petFood[species] || 0) + food.servings,
        },
      };
    });
    playTone('coin', state.soundEnabled);
    pushToast(`ซื้อ ${food.name} (+${food.servings} มื้อ) แล้ว!`);
  };

  const handleFeedPet = (petInstanceId: string) => {
    const targetPet = state.pets.find((p) => p.instanceId === petInstanceId);
    if (!targetPet) return;
    const stock = state.petFood[targetPet.species] || 0;
    if (stock <= 0) {
      playTone('error', state.soundEnabled);
      pushToast('อาหารหมดแล้ว! ซื้อเพิ่มได้ในหน้าต่างดูแลหรือร้านสัตว์เลี้ยง', 'info');
      return;
    }
    const now = Date.now();
    setState((prev) => {
      const curStock = prev.petFood[targetPet.species] || 0;
      if (curStock <= 0) return prev;
      return {
        ...prev,
        petFood: {
          ...prev.petFood,
          [targetPet.species]: curStock - 1,
        },
        pets: prev.pets.map((p) =>
          p.instanceId === petInstanceId ? { ...p, lastFedAt: now, status: 'healthy' } : p
        ),
      };
    });
    playTone('success', state.soundEnabled);
    pushToast(`ให้อาหาร ${targetPet.nickname} แล้ว! อิ่มสบายไปอีก 7 วัน`);
  };

  const handleMovePet = (petInstanceId: string, x: number, y: number) => {
    const pet = state.pets.find((p) => p.instanceId === petInstanceId);
    if (!pet) return;
    const gridLimit = state.studioExpanded ? 7 : 5;
    const occupied = getOccupiedTileSet(state.placedItems, state.pets, petInstanceId);
    const footprint = getPetFootprintTiles({
      breedId: pet.breedId,
      x,
      y,
      rotationStep: pet.rotationStep,
    });

    const isValid = footprint.every(
      (t) =>
        t.x >= 0 &&
        t.y >= 0 &&
        t.x < gridLimit &&
        t.y < gridLimit &&
        !occupied.has(`${t.x},${t.y}`)
    );

    if (!isValid) {
      playTone('error', state.soundEnabled);
      pushToast('ช่องนี้วางคอก/กรงสัตว์เลี้ยงไม่ได้ (ติดขอบห้องหรือชนของชิ้นอื่น)', 'info');
      return;
    }

    setState((prev) => ({
      ...prev,
      pets: prev.pets.map((p) => (p.instanceId === petInstanceId ? { ...p, x, y } : p)),
    }));
    playTone('place', state.soundEnabled);
    pushToast(`ย้ายคอก/กรงของ ${pet.nickname} แล้ว`, 'info');
  };

  const handleRotatePet = (petInstanceId: string) => {
    const pet = state.pets.find((p) => p.instanceId === petInstanceId);
    if (!pet) return;
    const nextRot = ((pet.rotationStep ?? 0) + 1) % 4;
    const gridLimit = state.studioExpanded ? 7 : 5;
    const occupied = getOccupiedTileSet(state.placedItems, state.pets, petInstanceId);

    // Check current origin, or fallback shifted by -1 on x or y for 2x1 playpens near edges
    const candidateAnchors = [
      { x: pet.x, y: pet.y },
      { x: pet.x - 1, y: pet.y },
      { x: pet.x, y: pet.y - 1 },
    ];

    const validAnchor = candidateAnchors.find((pos) =>
      getPetFootprintTiles({
        breedId: pet.breedId,
        x: pos.x,
        y: pos.y,
        rotationStep: nextRot,
      }).every(
        (t) =>
          t.x >= 0 &&
          t.y >= 0 &&
          t.x < gridLimit &&
          t.y < gridLimit &&
          !occupied.has(`${t.x},${t.y}`)
      )
    );

    if (!validAnchor) {
      playTone('error', state.soundEnabled);
      pushToast('มุมนี้ติดผนังหรือเฟอร์นิเจอร์ ลองย้ายคอกไปช่องกลางห้องก่อนหมุนนะ!', 'info');
      return;
    }

    setState((prev) => ({
      ...prev,
      pets: prev.pets.map((p) =>
        p.instanceId === petInstanceId
          ? { ...p, x: validAnchor.x, y: validAnchor.y, rotationStep: nextRot }
          : p
      ),
    }));
    playTone('click', state.soundEnabled);
  };

  const handleReturnPet = (petInstanceId: string) => {
    const pet = state.pets.find((p) => p.instanceId === petInstanceId);
    if (!pet) return;
    const breed = PET_BREED_MAP[pet.breedId];
    const fee = breed?.returnFee ?? 120;
    if (state.coins < fee) {
      playTone('error', state.soundEnabled);
      pushToast(`ต้องใช้ ${fee} Idea Coins เป็นค่าธรรมเนียมส่งคืนร้านค้า`, 'info');
      return;
    }
    setState((prev) => {
      if (prev.coins < fee) return prev;
      return {
        ...prev,
        coins: prev.coins - fee,
        pets: prev.pets.filter((p) => p.instanceId !== petInstanceId),
      };
    });
    playTone('click', state.soundEnabled);
    pushToast(`นำ ${pet.nickname} ส่งคืนร้านค้าเรียบร้อย (ค่าธรรมเนียม ${fee} 💡)`, 'info');
  };

  const handleExpandStudio = () => {
    if (state.studioExpanded) return;
    if (state.fame < STUDIO_EXPANSION_FAME || state.coins < STUDIO_EXPANSION_PRICE) {
      playTone('error', state.soundEnabled);
      return;
    }
    setState((prev) => {
      if (
        prev.studioExpanded ||
        prev.fame < STUDIO_EXPANSION_FAME ||
        prev.coins < STUDIO_EXPANSION_PRICE
      ) {
        return prev;
      }
      return {
        ...prev,
        coins: prev.coins - STUDIO_EXPANSION_PRICE,
        studioExpanded: true,
      };
    });
    playTone('success', state.soundEnabled);
    pushToast('ขยายพื้นที่สตูดิโอเพิ่ม 1 เท่า (7×7 · 49 ช่อง) สำเร็จ!');
  };

  const handleQuizAnswered = (questionId: string, isCorrect: boolean) => {
    const today = getLocalDateKey();
    const usedToday = state.dailyQuizDate === today ? state.dailyQuizCount : 0;
    if (usedToday >= DAILY_QUIZ_LIMIT) {
      playTone('error', state.soundEnabled);
      pushToast(`วันนี้ทำควิซครบ ${DAILY_QUIZ_LIMIT} ข้อแล้ว พรุ่งนี้มาลุยต่อนะ!`, 'info');
      return;
    }

    setState((prev) => {
      const prevCount = prev.dailyQuizDate === today ? prev.dailyQuizCount : 0;
      if (prevCount >= DAILY_QUIZ_LIMIT) return prev;
      const nextAnsweredIds = prev.answeredQuizIds.includes(questionId)
        ? prev.answeredQuizIds
        : [...prev.answeredQuizIds, questionId];

      return {
        ...prev,
        coins: prev.coins + (isCorrect ? QUIZ_CORRECT_REWARD : 0),
        quizAttemptCount: prev.quizAttemptCount + 1,
        quizCorrectCount: prev.quizCorrectCount + (isCorrect ? 1 : 0),
        answeredQuizIds: nextAnsweredIds,
        dailyQuizDate: today,
        dailyQuizCount: prevCount + 1,
      };
    });

    if (isCorrect) {
      playTone('coin', state.soundEnabled);
      triggerCoinBounce();
      pushToast(`ตอบถูก! รับ +${QUIZ_CORRECT_REWARD} Idea Coins`);
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
        coins: prev.coins + CLASSMATE_STICKER_REWARD,
        votedClassmates: {
          ...prev.votedClassmates,
          [classmateId]: sticker,
        },
      };
    });
    playTone('coin', state.soundEnabled);
    triggerCoinBounce();
    pushToast(`ส่ง "${sticker}" แล้ว · รับโบนัส +${CLASSMATE_STICKER_REWARD} 💡`);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedName = draftName.trim() || 'น้องอาร์ต';
    setState((prev) => ({
      ...prev,
      studentName: cleanedName,
      majorTrack: draftTrack,
      hasSelectedGender: true,
      avatar: {
        ...prev.avatar,
        gender: draftGender,
      },
    }));
    setShowProfileModal(false);
    playTone('click', state.soundEnabled);
    pushToast('อัปเดตข้อมูลนักเรียนแล้ว', 'info');
  };

  const handleResetDemo = () => {
    localStorage.removeItem(STORAGE_KEY);
    setState({ ...INITIAL_GAME_STATE, dailyQuizDate: getLocalDateKey(), dailyQuizCount: 0 });
    setDraftName(INITIAL_GAME_STATE.studentName);
    setDraftTrack(INITIAL_GAME_STATE.majorTrack);
    setShowResetModal(false);
    setActiveTab('studio');
    playTone('click', INITIAL_GAME_STATE.soundEnabled);
    pushToast('รีเซ็ตสตูดิโอเริ่มต้นเรียบร้อย', 'info');
  };

  const openShopWithFilter = (filter: ShopFilter = 'all') => {
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
      id: 'quiz',
      label: 'ควิซ TPAT',
      shortLabel: 'ควิซ',
      icon: <Brain className="w-5 h-5" />,
    },
    {
      id: 'shop',
      label: 'ร้านค้า',
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
                setDraftGender(state.avatar.gender ?? 'female');
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
            {(() => {
              const rankInfo = getRankInfo(state.fame, state.heartlessPenaltyUntil);
              return (
                <span
                  className={`hidden sm:inline font-medium ${
                    rankInfo.isHeartless ? 'text-[#BE123C] font-semibold' : 'text-[#2D6A4F]'
                  }`}
                >
                  ขั้น {rankInfo.level} · {rankInfo.title}
                  {rankInfo.isHeartless ? ` (สตูขาว-ดำ ${rankInfo.penaltyDaysLeft} วัน)` : ''}
                </span>
              );
            })()}
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
              title={`Studio Fame (สูงสุด ${MAX_FAME})`}
            >
              <Star className="w-4 h-4 fill-[#2D6A4F]" />
              <span>
                {Math.min(MAX_FAME, state.fame)}/{MAX_FAME}
              </span>
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
            onSelectDoor={handleSelectDoor}
            onSelectWindowView={handleSelectWindowView}
            onUpdateAvatar={handleUpdateAvatar}
            onSelectStarterGender={handleSelectStarterGender}
            onSetWallFrameArtwork={handleSetWallFrameArtwork}
            onFeedPet={handleFeedPet}
            onBuyPetFood={handleBuyPetFood}
            onMovePet={handleMovePet}
            onRotatePet={handleRotatePet}
            onReturnPet={handleReturnPet}
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

        {activeTab === 'quiz' && (
          <QuizTab
            state={state}
            onQuizAnswered={handleQuizAnswered}
            onGoToCritique={() => setActiveTab('critique')}
            onGoToShop={() => openShopWithFilter('all')}
          />
        )}

        {activeTab === 'shop' && (
          <ShopTab
            state={state}
            initialFilter={shopFilter}
            onBuyItem={handleBuyItem}
            onBuyWall={handleBuyWall}
            onSelectWall={handleSelectWall}
            onBuyFloor={handleBuyFloor}
            onSelectFloor={handleSelectFloor}
            onBuyDoor={handleBuyDoor}
            onSelectDoor={handleSelectDoor}
            onBuyWindowView={handleBuyWindowView}
            onSelectWindowView={handleSelectWindowView}
            onBuyAvatarItem={handleBuyAvatarItem}
            onEquipAvatarItem={handleEquipOwnedAvatarItem}
            onBuyWallFrame={handleBuyWallFrame}
            onAdoptPet={handleAdoptPet}
            onBuyPetFood={handleBuyPetFood}
            onFeedPet={handleFeedPet}
            onReturnPet={handleReturnPet}
            onExpandStudio={handleExpandStudio}
            onGoToStudio={() => setActiveTab('studio')}
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
        <div className="grid grid-cols-5 h-14 items-center">
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
                เพศของตัวอวตาร 3D
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { id: 'female', label: 'ผู้หญิง' },
                    { id: 'male', label: 'ผู้ชาย' },
                  ] as const
                ).map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setDraftGender(g.id)}
                    className={`px-3 py-2 min-h-[40px] rounded-xl border text-sm font-medium transition-colors cursor-pointer ${
                      draftGender === g.id
                        ? 'bg-[#EFF6FF] border-[#2563EB] text-[#1E3A8A]'
                        : 'bg-[#FAF8F4] border-[#E7E1D6] text-[#1F1D1A] hover:bg-[#F1ECE2]'
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
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
