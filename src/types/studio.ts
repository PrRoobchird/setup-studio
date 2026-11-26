export type TabId = 'studio' | 'critique' | 'quiz' | 'shop' | 'classmates';

export type MajorTrack =
  | 'สถาปัตยกรรม'
  | 'นิเทศศิลป์'
  | 'มัณฑนศิลป์'
  | 'แฟชั่นดีไซน์'
  | 'วิจิตรศิลป์ & แอนิเมชัน';

export type ItemCategory = 'furniture' | 'equipment' | 'decor' | 'frames' | 'petgear';

export interface StudioItemDef {
  id: string;
  name: string;
  category: ItemCategory;
  categoryLabel: string;
  price: number;
  fameBonus: number;
  description: string;
  accentHex: string;
  isSeasonal?: boolean;
  eventTag?: string;
  frameOrientation?: WallFrameType;
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

export interface WindowViewTheme {
  id: string;
  name: string;
  price: number;
  fameBonus: number;
  description: string;
  skyTop: string;
  skyBottom: string;
  nightSkyTop: string;
  nightSkyBottom: string;
  accentHex: string;
  isSeasonal?: boolean;
  eventTag?: string;
}

export type PetSpecies = 'dog' | 'cat' | 'goldfish' | 'hedgehog' | 'snake';
export type PetHealthStatus = 'healthy' | 'sick';

export interface PetBreedDef {
  id: string;
  species: PetSpecies;
  speciesLabel: string;
  breedName: string;
  price: number;
  returnFee: number;
  fameBonus: number;
  description: string;
  primaryHex: string;
  secondaryHex: string;
  eyeHex: string;
  enclosureName: string;
  gridW: number;
  gridH: number;
}

export interface PetFoodDef {
  id: string;
  species: PetSpecies;
  name: string;
  price: number;
  servings: number;
  description: string;
  accentHex: string;
}

export interface OwnedPet {
  instanceId: string;
  breedId: string;
  species: PetSpecies;
  nickname: string;
  x: number;
  y: number;
  rotationStep: number; // 0..3
  adoptedAt: number;
  lastFedAt: number;
  status: PetHealthStatus;
}

export interface PlacedItem {
  instanceId: string;
  itemId: string;
  x: number; // 0..4 (or 0..6 when expanded)
  y: number; // 0..4 (or 0..6 when expanded)
  rotationStep?: number; // 0, 1, 2, 3 (90 deg increments in 3D)
  flipped?: boolean;
}

export type WallFrameType = 'landscape' | 'portrait';

export interface WallFrameArtwork {
  id: string;
  title: string;
  imageDataUrl: string;
  updatedAt: string;
}

export type AvatarSlot = 'outfit' | 'headwear' | 'glasses' | 'handItem';

export type AvatarGender = 'female' | 'male';

export type HairStyleId =
  | 'bob'
  | 'ponytail'
  | 'wavy'
  | 'messy_short'
  | 'twintails'
  | 'wolf_cut'
  | 'bun'
  | 'side_part'
  | 'comma_hair'
  | 'two_block'
  | 'curly_crop'
  | 'slick_back';

export type EyeStyleId = 'classic' | 'sparkle' | 'chill' | 'sharp';
export type EyebrowStyleId = 'soft' | 'straight' | 'arched';
export type MouthStyleId = 'smile' | 'cat' | 'grin' | 'calm';
export type BlushStyleId = 'rosy' | 'peach' | 'none';

export interface AvatarConfig {
  gender?: AvatarGender;
  skinToneHex: string;
  hairStyleId: HairStyleId;
  hairColorHex: string;
  eyeStyleId?: EyeStyleId;
  eyebrowStyleId?: EyebrowStyleId;
  mouthStyleId?: MouthStyleId;
  blushStyleId?: BlushStyleId;
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
  isSeasonal?: boolean;
  eventTag?: string;
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
  fame: number; // Max 500
  studioExpanded: boolean;
  ownedItems: Record<string, number>;
  ownedWalls: string[];
  ownedFloors: string[];
  ownedWindowViews: string[];
  activeWallId: string;
  activeFloorId: string;
  activeWindowViewId: string;
  placedItems: PlacedItem[];
  ownedWallFrames: WallFrameType[];
  wallFrameArtworks: {
    landscape: WallFrameArtwork | null;
    portrait: WallFrameArtwork | null;
  };
  pets: OwnedPet[];
  petFood: Record<PetSpecies, number>;
  heartlessPenaltyUntil: number | null;
  deadPetCount: number;
  avatar: AvatarConfig;
  ownedAvatarItems: string[];
  hasSelectedGender?: boolean;
  gallery: ArtSubmission[];
  votedClassmates: Record<string, StickerType>;
  quizCorrectCount: number;
  quizAttemptCount: number;
  answeredQuizIds: string[];
  dailyQuizDate: string;
  dailyQuizCount: number;
  soundEnabled: boolean;
}
