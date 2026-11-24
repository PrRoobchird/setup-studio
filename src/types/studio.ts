export type TabId = 'studio' | 'critique' | 'shop' | 'classmates';

export type MajorTrack =
  | 'สถาปัตยกรรม'
  | 'นิเทศศิลป์'
  | 'มัณฑนศิลป์'
  | 'แฟชั่นดีไซน์'
  | 'วิจิตรศิลป์ & แอนิเมชัน';

export type ItemCategory = 'furniture' | 'equipment' | 'decor';

export interface StudioItemDef {
  id: string;
  name: string;
  category: ItemCategory;
  categoryLabel: string;
  price: number;
  fameBonus: number;
  description: string;
  accentHex: string;
}

export interface WallTheme {
  id: string;
  name: string;
  price: number;
  fameBonus: number;
  leftWall: string;
  rightWall: string;
  trimColor: string;
  swatchColor: string;
}

export interface FloorTheme {
  id: string;
  name: string;
  price: number;
  fameBonus: number;
  tileA: string;
  tileB: string;
  borderColor: string;
  swatchColor: string;
}

export interface PlacedItem {
  instanceId: string;
  itemId: string;
  x: number; // 0..4
  y: number; // 0..4
  rotationStep?: number; // 0, 1, 2, 3 (90 deg increments in 3D)
  flipped?: boolean;
}

export type AvatarSlot = 'outfit' | 'headwear' | 'glasses' | 'handItem';

export type HairStyleId = 'bob' | 'ponytail' | 'wavy' | 'messy_short' | 'twintails';

export interface AvatarConfig {
  skinToneHex: string;
  hairStyleId: HairStyleId;
  hairColorHex: string;
  outfitId: string;
  headwearId: string;
  glassesId: string;
  handItemId: string;
}

export interface AvatarItemDef {
  id: string;
  slot: AvatarSlot;
  slotLabel: string;
  name: string;
  price: number;
  fameBonus: number;
  description: string;
  primaryHex: string;
  secondaryHex: string;
}

export type ArtCategory =
  | 'วาดเส้น Drawing'
  | 'ออกแบบสื่อสาร'
  | 'สถาปัตยกรรม'
  | 'ทฤษฎีสี/องค์ประกอบศิลป์';

export interface CritiqueResult {
  starRating: number;
  coinsEarned: number;
  fameEarned: number;
  compliment: string;
  weaknesses: string;
  advice: string;
  designTip: string;
}

export interface ArtSubmission {
  id: string;
  imageDataUrl: string;
  category: ArtCategory;
  assignmentBrief?: string;
  note?: string;
  createdAt: string;
  critique: CritiqueResult;
}

export type QuizExamCode = 'TPAT4' | 'TPAT21';
export type QuizEra = 'past_5y' | 'forecast_5y' | 'ai_live';

export interface QuizQuestion {
  id: string;
  examCode: QuizExamCode;
  era: QuizEra;
  yearLabel: string;
  category: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export type StickerType = 'จัดวางเฉียบ!' | 'โทนสีละมุน!' | 'สายปั่นพอร์ต!';

export interface ClassmateStudio {
  id: string;
  name: string;
  roleLabel: string;
  track: MajorTrack;
  avatarColor: string;
  avatarInitials: string;
  bio: string;
  baseFame: number;
  wallThemeId: string;
  floorThemeId: string;
  placedItems: PlacedItem[];
  avatar: AvatarConfig;
  latestArtwork: {
    title: string;
    category: ArtCategory;
    imageUrl: string;
    caption: string;
  };
}

export interface StudioGameState {
  studentName: string;
  majorTrack: MajorTrack;
  coins: number;
  fame: number;
  ownedItems: Record<string, number>;
  ownedWalls: string[];
  ownedFloors: string[];
  activeWallId: string;
  activeFloorId: string;
  placedItems: PlacedItem[];
  avatar: AvatarConfig;
  ownedAvatarItems: string[];
  gallery: ArtSubmission[];
  votedClassmates: Record<string, StickerType>;
  quizCorrectCount: number;
  quizAttemptCount: number;
  answeredQuizIds: string[];
  dailyQuizDate: string;
  dailyQuizCount: number;
  soundEnabled: boolean;
}
