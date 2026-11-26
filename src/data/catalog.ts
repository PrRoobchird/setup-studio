import {
  AvatarConfig,
  AvatarItemDef,
  BlushStyleId,
  DoorTheme,
  EyeStyleId,
  EyebrowStyleId,
  FloorTheme,
  HairStyleId,
  MajorTrack,
  MouthStyleId,
  OwnedPet,
  PetBreedDef,
  PetFoodDef,
  PetSpecies,
  PlacedItem,
  StudioGameState,
  StudioItemDef,
  WallTheme,
  WindowViewTheme,
} from '../types/studio';

export const MAX_FAME = 500;
export const STUDIO_EXPANSION_FAME = 100;
export const STUDIO_EXPANSION_PRICE = 2500;
export const QUIZ_CORRECT_REWARD = 15;
export const CLASSMATE_STICKER_REWARD = 10;

export const MAX_PETS = 5;
export const PET_FEED_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000; // 7 วัน
export const PET_DEATH_GRACE_MS = 3 * 24 * 60 * 60 * 1000; // ป่วยเกิน 3 วัน (รวม 10 วันไม่ให้อาหาร) -> ตาย
export const HEARTLESS_PENALTY_MS = 7 * 24 * 60 * 60 * 1000; // โทษสตูขาว-ดำ + "คนใจร้าย" 7 วัน
export const PET_DEATH_FAME_PENALTY = 25;

export interface RankTierInfo {
  level: number;
  title: string;
  minFame: number;
  maxFame: number;
  maxPetSlots: number;
}

export const RANK_TIERS: RankTierInfo[] = [
  {
    level: 1,
    title: 'น้องติวฝึกหัดมือเปื้อนชาร์โคล',
    minFame: 0,
    maxFame: 50,
    maxPetSlots: 0,
  },
  {
    level: 2,
    title: 'นักเรียนขาประจำเจ้าถิ่น',
    minFame: 51,
    maxFame: 100,
    maxPetSlots: 1,
  },
  {
    level: 3,
    title: 'นักออกแบบมือใหม่ไฟแรงเฟร่อ',
    minFame: 101,
    maxFame: 200,
    maxPetSlots: 2,
  },
  {
    level: 4,
    title: 'ขาใหญ่จอมซ่าสายปั่นพอร์ต',
    minFame: 201,
    maxFame: 300,
    maxPetSlots: 3,
  },
  {
    level: 5,
    title: 'ตัวตึงตึกติวระดับตำนาน',
    minFame: 301,
    maxFame: 400,
    maxPetSlots: 4,
  },
  {
    level: 6,
    title: 'ว่าที่นักศึกษาไฟแรงยืนหนึ่ง',
    minFame: 401,
    maxFame: 500,
    maxPetSlots: 5,
  },
];

export function isDecemberSnowSeason(now = new Date()): boolean {
  return now.getMonth() === 11 && now.getDate() >= 1 && now.getDate() <= 31;
}

export function getHolidayEventStatus(now = new Date()): {
  isActive: boolean;
  isSnowActive: boolean;
  daysLeft: number;
  deadlineLabel: string;
} {
  const month = now.getMonth(); // 0..11 (10 = Nov, 11 = Dec)
  const day = now.getDate();
  const isActive = month === 10 || (month === 11 && day <= 31);
  const isSnowActive = isDecemberSnowSeason(now);
  const year = now.getFullYear();
  const end = new Date(year, 11, 31, 23, 59, 59);
  const diffMs = Math.max(0, end.getTime() - now.getTime());
  const daysLeft = isActive ? Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24))) : 0;

  return {
    isActive,
    isSnowActive,
    daysLeft,
    deadlineLabel: 'เปิดขายวันนี้ – 31 ธันวาคมนี้เท่านั้น',
  };
}

export const MAJOR_TRACKS: MajorTrack[] = [
  'สถาปัตยกรรม',
  'นิเทศศิลป์',
  'มัณฑนศิลป์',
  'แฟชั่นดีไซน์',
  'วิจิตรศิลป์ & แอนิเมชัน',
];

export const SKIN_TONES: { id: string; name: string; hex: string }[] = [
  { id: 'terracotta_peach', name: 'ดินเผาพีชละมุน', hex: '#E9AA8A' },
  { id: 'porcelain', name: 'ขาวสว่างใส', hex: '#FFF0E6' },
  { id: 'ivory', name: 'ขาวชมพู', hex: '#FCE2D2' },
  { id: 'warm_peach', name: 'เหลืองนวลอบอุ่น', hex: '#F6CCA9' },
  { id: 'honey', name: 'น้ำผึ้งละมุน', hex: '#E0AC82' },
  { id: 'caramel', name: 'แทนคาราเมล', hex: '#B97E58' },
  { id: 'espresso', name: 'น้ำตาลเข้มอบอุ่น', hex: '#8D583B' },
];

export const HAIR_STYLES: { id: HairStyleId; name: string }[] = [
  { id: 'bob', name: 'ผมบ๊อบหน้าม้า' },
  { id: 'ponytail', name: 'มัดหางม้าสูง' },
  { id: 'wavy', name: 'ลอนยาวธรรมชาติ' },
  { id: 'messy_short', name: 'สั้นซอยเท่ๆ' },
  { id: 'twintails', name: 'ทวินเทลน่ารัก' },
  { id: 'wolf_cut', name: 'วูล์ฟคัทสุดชิค' },
  { id: 'bun', name: 'มัดดังโงะคิ้วท์' },
  { id: 'side_part', name: 'แสกข้างมินิมอล' },
  { id: 'comma_hair', name: 'คอมม่าแฮร์เกาหลี (ชาย)' },
  { id: 'two_block', name: 'ทูบล็อกมินิมอล (ชาย)' },
  { id: 'curly_crop', name: 'ผมหยิกฟูสไตล์อาร์ต (ชาย)' },
  { id: 'slick_back', name: 'เสยเปิดหน้าผากสุดเท่ (ชาย)' },
];

export const HAIR_COLORS: { id: string; name: string; hex: string }[] = [
  { id: 'cocoa', name: 'น้ำตาลโกโก้', hex: '#543D33' },
  { id: 'ink_black', name: 'ดำธรรมชาติ', hex: '#282529' },
  { id: 'milk_tea', name: 'ชานมคาราเมล', hex: '#9A6F52' },
  { id: 'cream_blonde', name: 'บลอนด์ครีม', hex: '#E6C88A' },
  { id: 'strawberry', name: 'ชมพูพาสเทล', hex: '#E38FA3' },
  { id: 'lavender_ash', name: 'ม่วงหม่นแอช', hex: '#9A8CC2' },
  { id: 'denim_blue', name: 'น้ำเงินมิดไนท์', hex: '#3F5D8C' },
  { id: 'mint_sage', name: 'เขียวมิ้นท์อาร์ต', hex: '#71A895' },
  { id: 'cherry_wine', name: 'แดงเชอร์รี่ไวน์', hex: '#8F3144' },
];

export const EYE_STYLES: { id: EyeStyleId; name: string }[] = [
  { id: 'classic', name: 'ตากลมโตใส' },
  { id: 'sparkle', name: 'วิ้งค์สายอาร์ต' },
  { id: 'chill', name: 'ยิ้มตาหยีละมุน' },
  { id: 'sharp', name: 'ตาคมมีสไตล์' },
];

export const EYEBROW_STYLES: { id: EyebrowStyleId; name: string }[] = [
  { id: 'soft', name: 'คิ้วโค้งนุ่ม' },
  { id: 'straight', name: 'คิ้วตรงเกาหลี' },
  { id: 'arched', name: 'คิ้วโก่งคม' },
];

export const MOUTH_STYLES: { id: MouthStyleId; name: string }[] = [
  { id: 'smile', name: 'ยิ้มหวานละมุน' },
  { id: 'cat', name: 'ปากแมวสุดคิวท์ :3' },
  { id: 'grin', name: 'ยิ้มกว้างสดใส' },
  { id: 'calm', name: 'หน้านิ่งมินิมอล' },
];

export const BLUSH_STYLES: { id: BlushStyleId; name: string; hex: string }[] = [
  { id: 'rosy', name: 'แก้มชมพูระเรื่อ', hex: '#F497A3' },
  { id: 'peach', name: 'แก้มส้มพีช', hex: '#F4AA84' },
  { id: 'none', name: 'ไม่ปัดแก้ม', hex: '#E5DDD0' },
];

export const AVATAR_SHOP_ITEMS: AvatarItemDef[] = [
  // ชุดแต่งตัว (Outfits)
  {
    id: 'outfit_clay_overalls',
    slot: 'outfit',
    slotLabel: 'ชุดแต่งตัว',
    name: 'เสื้อลายขวาง & เอี๊ยมยีนส์ (หุ่นดินเผาปั้นมือ)',
    price: 0,
    fameBonus: 0,
    description: 'เสื้อแขนยาวลายขวางดินเผาแดง-ครีมคู่เอี๊ยมยีนส์กระดุมทองแดง สไตล์หุ่นดินเผาปั้นมือ',
    primaryHex: '#4E6E96',
    secondaryHex: '#F5ECE0',
  },
  {
    id: 'outfit_bjd_ribbon_dress',
    slot: 'outfit',
    slotLabel: 'ชุดแต่งตัว',
    name: 'เดรสเลเยอร์ผูกโบว์ & รองเท้าแมรี่เจน',
    price: 0,
    fameBonus: 0,
    description: 'เดรสลูกไม้หลายชั้นแต่งโบว์ซาตินคู่กับถุงเท้ายาวและรองเท้า Mary Jane',
    primaryHex: '#F4C2C9',
    secondaryHex: '#FFF8F2',
  },
  {
    id: 'outfit_starter_tank',
    slot: 'outfit',
    slotLabel: 'ชุดแต่งตัว',
    name: 'เสื้อกล้าม & กางเกงขาสั้น (ลำลอง)',
    price: 0,
    fameBonus: 0,
    description: 'ชุดเสื้อกล้ามสีขาวและกางเกงขาสั้นลำลอง สำหรับเปลี่ยนลุคสบายๆ ในสตูดิโอ',
    primaryHex: '#F8FAFC',
    secondaryHex: '#4A668C',
  },
  {
    id: 'outfit_hoodie_apron',
    slot: 'outfit',
    slotLabel: 'ชุดแต่งตัว',
    name: 'ฮู้ดดี้ฟ้า & ผ้ากันเปื้อนอาร์ต',
    price: 220,
    fameBonus: 2,
    description: 'ชุดเด็กติว Born to be Art สุดคลาสสิก ใส่คล่องตัวทั้งวาดเส้นและลงสี',
    primaryHex: '#7FA3C7',
    secondaryHex: '#EFE4D2',
  },
  {
    id: 'outfit_overalls',
    slot: 'outfit',
    slotLabel: 'ชุดแต่งตัว',
    name: 'เอี๊ยมยีนส์สายปั่นพอร์ต',
    price: 260,
    fameBonus: 2,
    description: 'ชุดเอี๊ยมยีนส์ทับเสื้อยืดสีมัสตาร์ด พร้อมกระเป๋าหน้าไว้เสียบดินสอ',
    primaryHex: '#4E6E9A',
    secondaryHex: '#EAB348',
  },
  {
    id: 'outfit_cardigan',
    slot: 'outfit',
    slotLabel: 'ชุดแต่งตัว',
    name: 'คาร์ดิแกนไหมพรมเกาหลี',
    price: 300,
    fameBonus: 2,
    description: 'เสื้อคลุมไหมพรมสีครีมนมจับคู่กระโปรงโทนละมุนสไตล์สตูดิโอโซล',
    primaryHex: '#F3DFCC',
    secondaryHex: '#9D7B67',
  },
  {
    id: 'outfit_pastel_atelier',
    slot: 'outfit',
    slotLabel: 'ชุดแต่งตัว',
    name: 'ชุดเอี๊ยมผ้าลินินสีมัทฉะ',
    price: 340,
    fameBonus: 2,
    description: 'ชุดลินินโทนเขียวเซจสบายตา เหมาะกับสายมัณฑนศิลป์และแฟชั่น',
    primaryHex: '#7CA88A',
    secondaryHex: '#FFF8F0',
  },
  {
    id: 'outfit_varsity',
    slot: 'outfit',
    slotLabel: 'ชุดแต่งตัว',
    name: 'แจ็กเก็ตเด็กนิเทศศิลป์',
    price: 420,
    fameBonus: 3,
    description: 'แจ็กเก็ตทูโทนแดงอิฐ-ครีม สตรีทลุคสุดเท่สำหรับสายกราฟิกดีไซน์',
    primaryHex: '#C94E3B',
    secondaryHex: '#F4EDE2',
  },
  {
    id: 'outfit_arch_blazer',
    slot: 'outfit',
    slotLabel: 'ชุดแต่งตัว',
    name: 'เบลเซอร์มินิมอลสายสถาปัตย์',
    price: 520,
    fameBonus: 3,
    description: 'ชุดเบลเซอร์สีเทาชาโคลแมตช์เสื้อคอเต่า ดูภูมิฐานพร้อมพรีเซนต์งานอาจารย์',
    primaryHex: '#4B525C',
    secondaryHex: '#E8E3DC',
  },
  // Seasonal Outfits (Christmas & New Year)
  {
    id: 'outfit_xmas_knit',
    slot: 'outfit',
    slotLabel: 'ชุดแต่งตัว · อีเว้นท์',
    name: 'สเวตเตอร์คริสต์มาสผ้าพันคอเขียว',
    price: 420,
    fameBonus: 3,
    description: 'สเวตเตอร์ไหมพรมแดงคริสต์มาสแต่งขอบขนปุยขาว พร้อมผ้าพันคอสีสนเขียวรับลมหนาว',
    primaryHex: '#C83B45',
    secondaryHex: '#2F6F4E',
    isSeasonal: true,
    eventTag: 'คริสต์มาส & ปีใหม่ · ถึง 31 ธ.ค.',
  },
  {
    id: 'outfit_ny_party',
    slot: 'outfit',
    slotLabel: 'ชุดแต่งตัว · อีเว้นท์',
    name: 'โค้ทเคาท์ดาวน์ปีใหม่โกลด์',
    price: 480,
    fameBonus: 3,
    description: 'โค้ทยาวสีมิดไนท์เนวี่ตัดปกสีทองแชมเปญ ฉลองคืนข้ามปีอย่างมีสไตล์',
    primaryHex: '#263859',
    secondaryHex: '#E8C067',
    isSeasonal: true,
    eventTag: 'คริสต์มาส & ปีใหม่ · ถึง 31 ธ.ค.',
  },

  // หมวก & เครื่องหัว (Headwear)
  {
    id: 'head_none',
    slot: 'headwear',
    slotLabel: 'หมวก & เครื่องหัว',
    name: 'ไม่สวมหมวก',
    price: 0,
    fameBonus: 0,
    description: 'โชว์ทรงผมธรรมชาติแบบเรียบง่าย',
    primaryHex: '#CBD5E1',
    secondaryHex: '#94A3B8',
  },
  {
    id: 'head_beret_pink',
    slot: 'headwear',
    slotLabel: 'หมวก & เครื่องหัว',
    name: 'เบเร่ต์ศิลปินสีชมพูพีช',
    price: 140,
    fameBonus: 1,
    description: 'หมวกเบเร่ต์ทรงนุ่มสีชมพูอมส้ม ไอเทมซิกเนเจอร์ประจำสายอาร์ต',
    primaryHex: '#EB8F9C',
    secondaryHex: '#D1707E',
  },
  {
    id: 'head_beret_navy',
    slot: 'headwear',
    slotLabel: 'หมวก & เครื่องหัว',
    name: 'เบเร่ต์สีกรมท่าคลาสสิก',
    price: 180,
    fameBonus: 1,
    description: 'เบเร่ต์ผ้าสักหลาดสีน้ำเงินเข้ม ดูสุขุมแบบศิลปินปารีส',
    primaryHex: '#3B5378',
    secondaryHex: '#283A56',
  },
  {
    id: 'head_beanie_mustard',
    slot: 'headwear',
    slotLabel: 'หมวก & เครื่องหัว',
    name: 'ไหมพรมบีนนี่สีมัสตาร์ด',
    price: 200,
    fameBonus: 1,
    description: 'หมวกไหมพรมถักอุ่นๆ สีเหลืองมัสตาร์ด สายอินดี้ห้ามพลาด',
    primaryHex: '#E5A93B',
    secondaryHex: '#C78C24',
  },
  {
    id: 'head_cap_cobalt',
    slot: 'headwear',
    slotLabel: 'หมวก & เครื่องหัว',
    name: 'หมวกแก๊ปสายสตรีท',
    price: 220,
    fameBonus: 2,
    description: 'หมวกแก๊ปสีโคบอลต์-ครีม ใส่ลุยสเก็ตช์งานนอกสถานที่',
    primaryHex: '#4674B8',
    secondaryHex: '#F5EFE6',
  },
  {
    id: 'head_cat_ears',
    slot: 'headwear',
    slotLabel: 'หมวก & เครื่องหัว',
    name: 'ที่คาดผมหูแมวส้ม',
    price: 280,
    fameBonus: 2,
    description: 'ที่คาดผมหูแมวสุดคิวท์ เข้าคู่กับน้องแมวประจำสตูดิโอ!',
    primaryHex: '#EF9F61',
    secondaryHex: '#F9C6CF',
  },
  // Seasonal Headwear
  {
    id: 'head_santa_hat',
    slot: 'headwear',
    slotLabel: 'หมวก · อีเว้นท์',
    name: 'หมวกซานต้าปอมปอมนุ่ม',
    price: 260,
    fameBonus: 2,
    description: 'หมวกซานต้ากำมะหยี่สีแดงขอบขนฟูสีขาว เติมฟีลเทศกาลคริสต์มาสในสตูดิโอ',
    primaryHex: '#D13B47',
    secondaryHex: '#FAF8F4',
    isSeasonal: true,
    eventTag: 'คริสต์มาส & ปีใหม่ · ถึง 31 ธ.ค.',
  },
  {
    id: 'head_reindeer',
    slot: 'headwear',
    slotLabel: 'หมวก · อีเว้นท์',
    name: 'ที่คาดผมเขากวางเรนเดียร์',
    price: 280,
    fameBonus: 2,
    description: 'เขากวางเรนเดียร์สีน้ำตาลอบอุ่นแต่งกระพรวนทองและใบฮอลลี่สีแดง',
    primaryHex: '#8E5A38',
    secondaryHex: '#EAB308',
    isSeasonal: true,
    eventTag: 'คริสต์มาส & ปีใหม่ · ถึง 31 ธ.ค.',
  },

  // แว่นตา (Glasses)
  {
    id: 'glasses_none',
    slot: 'glasses',
    slotLabel: 'แว่นตา',
    name: 'ไม่สวมแว่น',
    price: 0,
    fameBonus: 0,
    description: 'ลุคใสๆ ไม่ใส่แว่นตา',
    primaryHex: '#CBD5E1',
    secondaryHex: '#94A3B8',
  },
  {
    id: 'glasses_round_gold',
    slot: 'glasses',
    slotLabel: 'แว่นตา',
    name: 'แว่นทรงกลมกรอบทอง',
    price: 160,
    fameBonus: 1,
    description: 'แว่นตากลมกรอบบางสีทอง ดูฉลาดและมีสไตล์แบบนักออกแบบ',
    primaryHex: '#D8A648',
    secondaryHex: '#E0F2FE',
  },
  {
    id: 'glasses_square_black',
    slot: 'glasses',
    slotLabel: 'แว่นตา',
    name: 'แว่นกรอบดำเด็กสถาปัตย์',
    price: 190,
    fameBonus: 1,
    description: 'แว่นทรงเหลี่ยมกรอบหนา เสริมความเป๊ะเวลาส่องสเกลแบบแปลน',
    primaryHex: '#2F333B',
    secondaryHex: '#E0F2FE',
  },
  {
    id: 'glasses_tinted_amber',
    slot: 'glasses',
    slotLabel: 'แว่นตา',
    name: 'แว่นเลนส์ชาแฟชั่น',
    price: 240,
    fameBonus: 2,
    description: 'แว่นกรอบใสเลนส์สีชาอ่อน เพิ่มออร่าความติสต์ระดับตัวท็อป',
    primaryHex: '#C98A52',
    secondaryHex: '#FDE68A',
  },

  // ของถือคู่ใจ (Hand Items)
  {
    id: 'hand_none',
    slot: 'handItem',
    slotLabel: 'ของถือคู่ใจ',
    name: 'ไม่ถือของ',
    price: 0,
    fameBonus: 0,
    description: 'ปล่อยมือโล่งๆ เดินเล่นในสตูดิโอแบบสบายๆ',
    primaryHex: '#CBD5E1',
    secondaryHex: '#94A3B8',
  },
  {
    id: 'hand_brush',
    slot: 'handItem',
    slotLabel: 'ของถือคู่ใจ',
    name: 'พู่กันจุ่มสีคู่ใจ',
    price: 100,
    fameBonus: 1,
    description: 'พู่กันด้ามไม้ปลายแต้มสี พร้อมตวัดเส้นลงผืนผ้าใบทุกเมื่อ',
    primaryHex: '#C28E5C',
    secondaryHex: '#E05A47',
  },
  {
    id: 'hand_coffee',
    slot: 'handItem',
    slotLabel: 'ของถือคู่ใจ',
    name: 'แก้วลาเต้ร้อนปั่นงานดึก',
    price: 150,
    fameBonus: 1,
    description: 'กาแฟอุ่นๆ เติมพลังระหว่างนั่งทำงานส่งอาจารย์',
    primaryHex: '#F5EFE6',
    secondaryHex: '#8C5E3C',
  },
  {
    id: 'hand_sketchbook',
    slot: 'handItem',
    slotLabel: 'ของถือคู่ใจ',
    name: 'สมุดสเก็ตช์ปกแข็ง',
    price: 200,
    fameBonus: 1,
    description: 'สมุดสเก็ตช์เล่มโปรดสำหรับจดไอเดียและวาดตีบด่วน',
    primaryHex: '#E06453',
    secondaryHex: '#FAF8F4',
  },
  {
    id: 'hand_stylus',
    slot: 'handItem',
    slotLabel: 'ของถือคู่ใจ',
    name: 'แท็บเล็ต & ปากกาสไตลัส',
    price: 340,
    fameBonus: 2,
    description: 'แท็บเล็ตวาดรูปพกพาคู่ใจสายดิจิทัลอาร์ตและคาแรคเตอร์ดีไซน์',
    primaryHex: '#374151',
    secondaryHex: '#60A5FA',
  },
  {
    id: 'hand_camera',
    slot: 'handItem',
    slotLabel: 'ของถือคู่ใจ',
    name: 'กล้องฟิล์มเรโทรเก็บแสง',
    price: 380,
    fameBonus: 2,
    description: 'กล้องฟิล์มวินเทจสีเงิน-หนังดำ เอาไว้ถ่าย Reference แสงเงาและองค์ประกอบ',
    primaryHex: '#334155',
    secondaryHex: '#CBD5E1',
  },
  {
    id: 'hand_xmas_gift',
    slot: 'handItem',
    slotLabel: 'ของถือ · อีเว้นท์',
    name: 'กล่องของขวัญปีใหม่ผูกโบว์ทอง',
    price: 240,
    fameBonus: 2,
    description: 'กล่องของขวัญคริสต์มาสและปีใหม่สีแดงริบบิ้นทองสุดลิมิเต็ด',
    primaryHex: '#D13B47',
    secondaryHex: '#FACC15',
    isSeasonal: true,
    eventTag: 'คริสต์มาส & ปีใหม่ · ถึง 31 ธ.ค.',
  },
];

export const AVATAR_ITEM_MAP: Record<string, AvatarItemDef> = Object.fromEntries(
  AVATAR_SHOP_ITEMS.map((item) => [item.id, item])
);

export const INITIAL_AVATAR_CONFIG: AvatarConfig = {
  gender: 'male',
  skinToneHex: '#E9AA8A',
  hairStyleId: 'side_part',
  hairColorHex: '#5E4235',
  eyeStyleId: 'classic',
  eyebrowStyleId: 'soft',
  mouthStyleId: 'smile',
  blushStyleId: 'rosy',
  outfitId: 'outfit_clay_overalls',
  headwearId: 'head_none',
  glassesId: 'glasses_none',
  handItemId: 'hand_none',
};

export const INITIAL_OWNED_AVATAR_ITEMS: string[] = [
  'outfit_clay_overalls',
  'outfit_bjd_ribbon_dress',
  'outfit_starter_tank',
  'head_none',
  'glasses_none',
  'hand_none',
];

export const WALL_THEMES: WallTheme[] = [
  {
    id: 'warm_ivory',
    name: 'ครีมนมละมุน (Cream Ivory)',
    price: 0,
    fameBonus: 0,
    leftWall: '#F6EEDF',
    rightWall: '#EDE2CF',
    trimColor: '#E5D9C7',
    swatchColor: '#F3E9D8',
  },
  {
    id: 'gallery_white',
    name: 'ขาวแกลเลอรีคลีน',
    price: 160,
    fameBonus: 1,
    leftWall: '#FAF9F6',
    rightWall: '#EFECE6',
    trimColor: '#E2DDD4',
    swatchColor: '#F7F5F0',
  },
  {
    id: 'sage_studio',
    name: 'เขียวมัทฉะมิลค์',
    price: 240,
    fameBonus: 2,
    leftWall: '#DFECE1',
    rightWall: '#D2E2D4',
    trimColor: '#BED2C1',
    swatchColor: '#D8E7DA',
  },
  {
    id: 'cobalt_atelier',
    name: 'ฟ้าพาสเทลสดใส',
    price: 300,
    fameBonus: 2,
    leftWall: '#DDE9F7',
    rightWall: '#CFDFEF',
    trimColor: '#B5CAE3',
    swatchColor: '#D6E4F4',
  },
  {
    id: 'terracotta_warm',
    name: 'พีชดินเผาอบอุ่น',
    price: 360,
    fameBonus: 3,
    leftWall: '#F7E1DB',
    rightWall: '#EED2CA',
    trimColor: '#DCB8AE',
    swatchColor: '#F2DAD3',
  },
];

export const FLOOR_THEMES: FloorTheme[] = [
  {
    id: 'japanese_oak',
    name: 'ไม้โอ๊คฮันนี่ (Setup Classic)',
    price: 0,
    fameBonus: 0,
    tileA: '#E5BD8C',
    tileB: '#DDB27F',
    borderColor: '#C49563',
    swatchColor: '#E1B785',
  },
  {
    id: 'studio_grid',
    name: 'กระเบื้องครีมตารางสถาปัตย์',
    price: 180,
    fameBonus: 1,
    tileA: '#F4EFE7',
    tileB: '#EAE3D8',
    borderColor: '#D3C9BA',
    swatchColor: '#EFE9DF',
  },
  {
    id: 'walnut_loft',
    name: 'ไม้คาราเมลวอลนัท',
    price: 280,
    fameBonus: 2,
    tileA: '#BD926C',
    tileB: '#B28660',
    borderColor: '#946A47',
    swatchColor: '#B78C66',
  },
  {
    id: 'concrete_atelier',
    name: 'ปูนเปลือยมินิมอล',
    price: 340,
    fameBonus: 3,
    tileA: '#D9DDE2',
    tileB: '#CFD4DA',
    borderColor: '#B3B9C1',
    swatchColor: '#D4D8DE',
  },
];

export const DOOR_THEMES: DoorTheme[] = [
  {
    id: 'door_terracotta',
    name: 'ประตูอิฐดินเผาขอบครีม (คลาสสิก)',
    price: 0,
    fameBonus: 0,
    description: 'ประตูสีส้มดินเผาอบอุ่นตัดกรอบครีมสไตล์ Setup Dream Room เข้ากับผนังครีมนมและพีช',
    style: 'classic_panel',
    frameColor: '#F6F0E6',
    leafColor: '#D9482B',
    accentColor: '#B7371E',
    knobColor: '#F3E8D6',
    swatchColor: '#D9482B',
  },
  {
    id: 'door_ivory_molding',
    name: 'ประตูบัวครีมงาช้างแกลเลอรี',
    price: 180,
    fameBonus: 2,
    description: 'ประตูสีครีมงาช้างตีคิ้วบัวคลาสสิก พร้อมมือจับก้านโยกทองเหลือง เหมาะกับห้องแกลเลอรีคลีน',
    style: 'ivory_molding',
    frameColor: '#EBE4D8',
    leafColor: '#FAF6EE',
    accentColor: '#DED6C8',
    knobColor: '#C9A25B',
    swatchColor: '#F5EFE4',
  },
  {
    id: 'door_oak_slat',
    name: 'ประตูไม้โอ๊คระแนงสไตล์ญี่ปุ่น',
    price: 220,
    fameBonus: 2,
    description: 'ประตูไม้โอ๊คเรียงระแนงตั้งสไตล์มูจิ-ญี่ปุ่น พร้อมมือจับแท่งยาวสีดำด้าน เข้ากับพื้นไม้ฮันนี่',
    style: 'nordic_slat',
    frameColor: '#B68556',
    leafColor: '#CFA06E',
    accentColor: '#9C6C42',
    knobColor: '#2B2724',
    swatchColor: '#CFA06E',
  },
  {
    id: 'door_sage_glass',
    name: 'ประตูเขียวเซจช่องกระจกใส',
    price: 260,
    fameBonus: 3,
    description: 'ประตูสีเขียวมัทฉะเซจเจาะช่องกระจกสี่เหลี่ยมด้านบน ช่วยให้แสงธรรมชาติผ่านเข้ามาในห้อง',
    style: 'sage_glass',
    frameColor: '#F6F2EA',
    leafColor: '#7EA68A',
    accentColor: '#DCEEF2',
    knobColor: '#D2B06E',
    swatchColor: '#7EA68A',
  },
  {
    id: 'door_arch_walnut',
    name: 'ประตูซุ้มโค้งไม้วอลนัทอุ่น',
    price: 300,
    fameBonus: 3,
    description: 'ซุ้มประตูทรงโค้งมนละมุนสไตล์สตูดิโออาร์ตเมดิเตอร์เรเนียน เข้ากับพื้นวอลนัทและผนังพีช',
    style: 'arch_mediterranean',
    frameColor: '#F2EAE0',
    leafColor: '#9D6D47',
    accentColor: '#7A5030',
    knobColor: '#E5C687',
    swatchColor: '#9D6D47',
  },
  {
    id: 'door_loft_steel',
    name: 'ประตูกระจกกรอบเหล็กดำลอฟท์',
    price: 340,
    fameBonus: 4,
    description: 'ประตูกระจกตารางเฟรมเหล็กสีดำด้านสไตล์อินดัสเทรียลลอฟท์ เข้ากับพื้นปูนเปลือยและห้องฟ้า',
    style: 'industrial_loft',
    frameColor: '#282E36',
    leafColor: '#363D47',
    accentColor: '#C2DCEC',
    knobColor: '#94A3B8',
    swatchColor: '#363D47',
  },
  {
    id: 'door_xmas_pine',
    name: 'ประตูสนเขียว & พวงมาลัยคริสต์มาส',
    price: 320,
    fameBonus: 4,
    description: 'ประตูสีเขียวต้นสนตกแต่งพวงมาลัยฮอลลี่ โบว์แดง และกระดิ่งทอง ต้อนรับเทศกาลคริสต์มาส-ปีใหม่',
    style: 'xmas_wreath',
    frameColor: '#FAF5EC',
    leafColor: '#235D3F',
    accentColor: '#DC2626',
    knobColor: '#FACC15',
    swatchColor: '#235D3F',
    isSeasonal: true,
    eventTag: 'คริสต์มาส & ปีใหม่ · ถึง 31 ธ.ค.',
  },
];

export const WALL_FRAME_ITEMS: StudioItemDef[] = [
  {
    id: 'wall_frame_landscape',
    name: 'เฟรมภาพแขวนผนัง (แนวนอน)',
    category: 'frames',
    categoryLabel: 'เฟรมติดผนัง',
    price: 320,
    fameBonus: 3,
    description:
      'กรอบรูปไม้โอ๊คแนวนอนติดผนังฝั่งหน้าต่าง ใส่รูปผลงานของตัวเองและเปลี่ยนภาพได้ไม่จำกัดครั้ง',
    accentHex: '#B45309',
    frameOrientation: 'landscape',
  },
  {
    id: 'wall_frame_portrait',
    name: 'เฟรมภาพแขวนผนัง (แนวตั้ง)',
    category: 'frames',
    categoryLabel: 'เฟรมติดผนัง',
    price: 320,
    fameBonus: 3,
    description:
      'กรอบรูปแกลเลอรีแนวตั้งติดผนังด้านซ้าย โชว์ผลงาน Drawing/Poster ของตัวเองและเปลี่ยนภาพได้ตลอด',
    accentHex: '#2563EB',
    frameOrientation: 'portrait',
  },
];

export const WINDOW_VIEW_THEMES: WindowViewTheme[] = [
  {
    id: 'city_warm',
    name: 'วิวตึกเมืองอบอุ่น (ค่าเริ่มต้น)',
    price: 0,
    fameBonus: 0,
    description: 'วิวตึกพาสเทลสบายตาสไตล์ Setup Dream Room กลางเมืองอาร์ต',
    skyTop: '#FCE3C8',
    skyBottom: '#F7CAA4',
    nightSkyTop: '#1E2547',
    nightSkyBottom: '#353F6B',
    accentHex: '#D97706',
  },
  {
    id: 'highrise_skyline',
    name: 'วิวตึกสูงมหานคร & ตึกกระจก',
    price: 320,
    fameBonus: 4,
    description: 'ตึกระฟ้าใจกลางย่านดีไซน์พร้อมแสงไฟหน้าต่างระยิบระยับยามค่ำคืน',
    skyTop: '#B9DCFA',
    skyBottom: '#F2E7D8',
    nightSkyTop: '#0F172A',
    nightSkyBottom: '#2B3A67',
    accentHex: '#2563EB',
  },
  {
    id: 'beach_ocean',
    name: 'วิวทะเลริมชายหาด',
    price: 380,
    fameBonus: 5,
    description: 'เกลียวคลื่นทะเลสีเทอร์ควอยซ์ หาดทรายสีทอง และต้นมะพร้าวรับลมทะเล',
    skyTop: '#7DD3FC',
    skyBottom: '#FEF08A',
    nightSkyTop: '#162847',
    nightSkyBottom: '#2C5270',
    accentHex: '#0284C7',
  },
  {
    id: 'snow_mountain',
    name: 'วิวภูเขาหิมะแอลป์',
    price: 420,
    fameBonus: 5,
    description: 'ยอดเขาหิมะขาวโพลนตัดฟ้าใส พร้อมทิวสนฤดูหนาวสุดสงบ',
    skyTop: '#BAE6FD',
    skyBottom: '#E0F2FE',
    nightSkyTop: '#182442',
    nightSkyBottom: '#3B4D75',
    accentHex: '#38BDF8',
  },
  {
    id: 'nature_forest',
    name: 'วิวป่าธรรมชาติ & ขุนเขาเขียว',
    price: 350,
    fameBonus: 4,
    description: 'ทิวป่าสนและภูเขาสีเขียวไล่เฉดหมอกยามเช้า ช่วยพักสายตาหลังปั่นพอร์ต',
    skyTop: '#C7EAD8',
    skyBottom: '#EDF7E6',
    nightSkyTop: '#132A24',
    nightSkyBottom: '#26463D',
    accentHex: '#15803D',
  },
  {
    id: 'sakura_park',
    name: 'วิวสวนซากุระ & แม่น้ำญี่ปุ่น',
    price: 460,
    fameBonus: 6,
    description: 'ต้นซากุระบานสะพรั่งสีชมพูละมุนริมแม่น้ำ ให้แรงบันดาลใจสายมัณฑนศิลป์',
    skyTop: '#FDE2EC',
    skyBottom: '#FFF5F8',
    nightSkyTop: '#241B38',
    nightSkyBottom: '#47305C',
    accentHex: '#EC4899',
  },
  {
    id: 'starry_aurora',
    name: 'วิวแสงเหนือ & ท้องฟ้ายามค่ำ',
    price: 540,
    fameBonus: 7,
    description: 'ริ้วแสงเหนือสีมรกต-ม่วงพาดผ่านหมู่ดาวและขุนเขายามรัตติกาล',
    skyTop: '#1E2A4A',
    skyBottom: '#2B5B6C',
    nightSkyTop: '#0B1226',
    nightSkyBottom: '#193C4D',
    accentHex: '#10B981',
  },
  {
    id: 'christmas_window',
    name: 'วิวหน้าต่างคืนคริสต์มาสแสนอบอุ่น',
    price: 450,
    fameBonus: 6,
    description: 'ต้นสนคริสต์มาสประดับไฟระยิบระยับ บ้านไม้กลางหิมะ และเกล็ดหิมะโปรยปรายนอกหน้าต่าง',
    skyTop: '#243B6B',
    skyBottom: '#6D88B8',
    nightSkyTop: '#0F1B3A',
    nightSkyBottom: '#253966',
    accentHex: '#DC2626',
    isSeasonal: true,
    eventTag: 'คริสต์มาส & ปีใหม่ · ถึง 31 ธ.ค.',
  },
];

export const PET_BREEDS: PetBreedDef[] = [
  // 1. สุนัข (Dog) - คอกสุนัข 2x1 ช่อง
  {
    id: 'dog_corgi',
    species: 'dog',
    speciesLabel: 'สุนัข',
    breedName: 'คอร์กี้ขาสั้นจอมซน',
    price: 480,
    returnFee: 140,
    fameBonus: 6,
    description: 'น้องหมาคอร์กี้สีส้มคาราเมล-ขาว เดินดุ๊กดิ๊กในคอกไม้ 2 ช่อง เฝ้าโต๊ะวาดรูปไม่ห่าง',
    primaryHex: '#D98245',
    secondaryHex: '#FFF6EB',
    eyeHex: '#231C18',
    enclosureName: 'คอกไม้สุนัข (ใช้ 2 ช่องพื้น)',
    gridW: 2,
    gridH: 1,
  },
  {
    id: 'dog_shiba',
    species: 'dog',
    speciesLabel: 'สุนัข',
    breedName: 'ชิบะอินุหน้ากวน',
    price: 520,
    returnFee: 150,
    fameBonus: 6,
    description: 'ชิบะสีครีมทองแก้มกลม แสนรู้และชอบวิ่งวนรอบคอกไม้รอขนมทุกสัปดาห์',
    primaryHex: '#E0A35C',
    secondaryHex: '#FFF8EE',
    eyeHex: '#1F1A17',
    enclosureName: 'คอกไม้สุนัข (ใช้ 2 ช่องพื้น)',
    gridW: 2,
    gridH: 1,
  },
  {
    id: 'dog_poodle',
    species: 'dog',
    speciesLabel: 'สุนัข',
    breedName: 'ทอยพุดเดิ้ลช็อกโก้',
    price: 560,
    returnFee: 150,
    fameBonus: 7,
    description: 'พุดเดิ้ลขนฟูสีช็อกโกแลต ขี้อ้อนสุดๆ มาพร้อมคอกรั้วไม้และชามอาหารคู่ใจ',
    primaryHex: '#6F4A37',
    secondaryHex: '#A67A5B',
    eyeHex: '#181412',
    enclosureName: 'คอกไม้สุนัข (ใช้ 2 ช่องพื้น)',
    gridW: 2,
    gridH: 1,
  },

  // 2. แมว (Cat) - คอนโดแมว 1x1 ช่อง
  {
    id: 'cat_orange',
    species: 'cat',
    speciesLabel: 'แมว',
    breedName: 'แมวส้มสายอ้อน',
    price: 420,
    returnFee: 120,
    fameBonus: 5,
    description: 'เหมียวส้มจอมป่วนประจำสตูดิโอ ชอบปีนป่ายบนคอนโดแมว 1 ช่องและแกว่งหางไปมา',
    primaryHex: '#E78A47',
    secondaryHex: '#FFE8D2',
    eyeHex: '#2F5E38',
    enclosureName: 'คอนโด & เบาะแมว (ใช้ 1 ช่องพื้น)',
    gridW: 1,
    gridH: 1,
  },
  {
    id: 'cat_siamese',
    species: 'cat',
    speciesLabel: 'แมว',
    breedName: 'วิเชียรมาศตาฟ้า',
    price: 460,
    returnFee: 120,
    fameBonus: 6,
    description: 'แมวไทยมงคลขนครีมแต้มน้ำตาลเข้ม นัยน์ตาสีฟ้าใส ชอบนั่งมองงานศิลปะจากคอนโด',
    primaryHex: '#EFE2CE',
    secondaryHex: '#4E392E',
    eyeHex: '#38BDF8',
    enclosureName: 'คอนโด & เบาะแมว (ใช้ 1 ช่องพื้น)',
    gridW: 1,
    gridH: 1,
  },
  {
    id: 'cat_tuxedo',
    species: 'cat',
    speciesLabel: 'แมว',
    breedName: 'แมวทักซิโด้สุดเนี๊ยบ',
    price: 450,
    returnFee: 120,
    fameBonus: 6,
    description: 'เหมียวใส่สูทดำ-ขาวสุดเท่ เดินตรวจความเรียบร้อยบนคอนโดแมวตลอดเวลา',
    primaryHex: '#2A2B30',
    secondaryHex: '#F9FAFB',
    eyeHex: '#F59E0B',
    enclosureName: 'คอนโด & เบาะแมว (ใช้ 1 ช่องพื้น)',
    gridW: 1,
    gridH: 1,
  },

  // 3. ปลาทอง (Goldfish) - ตู้ปลากระจกบนขาตั้ง 1x1 ช่อง
  {
    id: 'fish_oranda',
    species: 'goldfish',
    speciesLabel: 'ปลาทอง',
    breedName: 'ปลาทองออรันดาส้ม-ขาว',
    price: 340,
    returnFee: 100,
    fameBonus: 4,
    description: 'ปลาทองหางพริ้วสีส้มสลับขาว ว่ายวนเป็นเลข 8 ในตู้กระจกใสมุมห้องช่วยให้ใจสงบ',
    primaryHex: '#F97316',
    secondaryHex: '#FFF7ED',
    eyeHex: '#111827',
    enclosureName: 'ตู้ปลาทองขาตั้งไม้ (ใช้ 1 ช่องพื้น)',
    gridW: 1,
    gridH: 1,
  },
  {
    id: 'fish_calico',
    species: 'goldfish',
    speciesLabel: 'ปลาทอง',
    breedName: 'ปลาทองริวกิ้นสามสี',
    price: 380,
    returnFee: 100,
    fameBonus: 5,
    description: 'ปลาทองลายคาลิโก้ส้ม-ดำ-ขาว สีสันสดใสเหมือนพู่กันสะบัดในตู้ไม้น้ำ',
    primaryHex: '#EA580C',
    secondaryHex: '#FDE68A',
    eyeHex: '#1E293B',
    enclosureName: 'ตู้ปลาทองขาตั้งไม้ (ใช้ 1 ช่องพื้น)',
    gridW: 1,
    gridH: 1,
  },
  {
    id: 'fish_blackmoor',
    species: 'goldfish',
    speciesLabel: 'ปลาทอง',
    breedName: 'ปลาทองรักเร่ดำกำมะหยี่',
    price: 400,
    returnFee: 100,
    fameBonus: 5,
    description: 'ปลาทองสีดำขลับตากลมโต หางคู่ยาวพลิ้วไหวในตู้กระจกไฟอุ่น',
    primaryHex: '#27272A',
    secondaryHex: '#52525B',
    eyeHex: '#D97706',
    enclosureName: 'ตู้ปลาทองขาตั้งไม้ (ใช้ 1 ช่องพื้น)',
    gridW: 1,
    gridH: 1,
  },

  // 4. เม่นแคระ (Hedgehog) - กรงเทอร์ราเรียม + ลู่วิ่ง 1x1 ช่อง
  {
    id: 'hedge_saltpepper',
    species: 'hedgehog',
    speciesLabel: 'เม่นแคระ',
    breedName: 'เม่นแคระสีเกลือพริกไทย',
    price: 390,
    returnFee: 110,
    fameBonus: 5,
    description: 'เจ้าหนามจิ๋วสีเทา-ขาว วิ่งดุ๊กดิ๊กในกรงไม้วางขี้เลื่อยพร้อมลู่วิ่งหมุนตลอดเวลา',
    primaryHex: '#6B625B',
    secondaryHex: '#F5ECE2',
    eyeHex: '#18181B',
    enclosureName: 'กรงเม่นแคระ & ลู่วิ่ง (ใช้ 1 ช่องพื้น)',
    gridW: 1,
    gridH: 1,
  },
  {
    id: 'hedge_albino',
    species: 'hedgehog',
    speciesLabel: 'เม่นแคระ',
    breedName: 'เม่นแคระขาวเผือกตาแดง',
    price: 430,
    returnFee: 110,
    fameBonus: 5,
    description: 'เม่นแคระสีขาวมุกสุดแรร์ จมูกชมพู วิ่งสำรวจกรงและปั่นลู่วิ่งอย่างขยันขันแข็ง',
    primaryHex: '#F5EFE6',
    secondaryHex: '#FCE7F3',
    eyeHex: '#DC2626',
    enclosureName: 'กรงเม่นแคระ & ลู่วิ่ง (ใช้ 1 ช่องพื้น)',
    gridW: 1,
    gridH: 1,
  },
  {
    id: 'hedge_cinnamon',
    species: 'hedgehog',
    speciesLabel: 'เม่นแคระ',
    breedName: 'เม่นแคระสีชินนามอน',
    price: 410,
    returnFee: 110,
    fameBonus: 5,
    description: 'เม่นแคระสีน้ำตาลอบเชยอบอุ่น ชอบดมฟุดฟิดและวิ่งเล่นในกรงไม้สน',
    primaryHex: '#B77B54',
    secondaryHex: '#FBF1E6',
    eyeHex: '#27272A',
    enclosureName: 'กรงเม่นแคระ & ลู่วิ่ง (ใช้ 1 ช่องพื้น)',
    gridW: 1,
    gridH: 1,
  },

  // 5. งูเลี้ยง (Snake) - ตู้กระจกเทอร์ราเรียม 1x1 ช่อง
  {
    id: 'snake_corn',
    species: 'snake',
    speciesLabel: 'งูเลี้ยง',
    breedName: 'คอร์นสเน็กสีส้มสตรอว์เบอร์รี',
    price: 400,
    returnFee: 110,
    fameBonus: 5,
    description: 'งูคอร์นสเน็กนิสัยเชื่องมาก สีส้มอมแดงลายครีม เลื้อยขดบนกิ่งไม้ในตู้กระจกเทอร์ราเรียม 1 ช่อง',
    primaryHex: '#E0643A',
    secondaryHex: '#FBE7C6',
    eyeHex: '#1F1A17',
    enclosureName: 'ตู้กระจกเทอร์ราเรียมงู (ใช้ 1 ช่องพื้น)',
    gridW: 1,
    gridH: 1,
  },
  {
    id: 'snake_ball_python',
    species: 'snake',
    speciesLabel: 'งูเลี้ยง',
    breedName: 'บอลไพธอนพาสเทลเหลืองทอง',
    price: 470,
    returnFee: 120,
    fameBonus: 6,
    description: 'บอลไพธอนสุดน่ารักสีเหลืองพาสเทลตัดลายน้ำตาลเข้ม ชอบขดตัวกลมอย่างสงบในตู้เทอร์ราเรียม',
    primaryHex: '#E5B94C',
    secondaryHex: '#6F4A37',
    eyeHex: '#1F1A17',
    enclosureName: 'ตู้กระจกเทอร์ราเรียมงู (ใช้ 1 ช่องพื้น)',
    gridW: 1,
    gridH: 1,
  },
  {
    id: 'snake_milk',
    species: 'snake',
    speciesLabel: 'งูเลี้ยง',
    breedName: 'มิลค์สเน็กสามสีลายวงแหวน',
    price: 440,
    returnFee: 115,
    fameBonus: 6,
    description: 'งูมิลค์สเน็กสีแดงสดสลับขาวครีมและดำ สีสันจัดจ้านสะดุดตาเหมือนงานศิลปะป๊อปอาร์ต',
    primaryHex: '#D13B47',
    secondaryHex: '#FAF3E6',
    eyeHex: '#18181B',
    enclosureName: 'ตู้กระจกเทอร์ราเรียมงู (ใช้ 1 ช่องพื้น)',
    gridW: 1,
    gridH: 1,
  },
];

export const PET_FOODS: PetFoodDef[] = [
  {
    id: 'food_dog',
    species: 'dog',
    name: 'อาหารเม็ดสุนัขสูตรอาร์ตติสต์ (3 มื้อ)',
    price: 45,
    servings: 3,
    description: 'อาหารสุนัขครบโภชนาการ 1 ถุงให้อาหารได้ 3 สัปดาห์ (สัปดาห์ละ 1 ครั้ง)',
    accentHex: '#D97706',
  },
  {
    id: 'food_cat',
    species: 'cat',
    name: 'อาหารเปียกแมวปลาทูน่า (3 มื้อ)',
    price: 40,
    servings: 3,
    description: 'ปลาทูน่าหอมยั่วใจเหมียว 1 แพ็กให้อาหารได้ 3 สัปดาห์',
    accentHex: '#EA580C',
  },
  {
    id: 'food_goldfish',
    species: 'goldfish',
    name: 'อาหารเม็ดปลาทองเร่งสี (4 มื้อ)',
    price: 35,
    servings: 4,
    description: 'เม็ดลอยน้ำไม่ทำให้น้ำขุ่น 1 กระปุกให้อาหารได้ 4 สัปดาห์',
    accentHex: '#0284C7',
  },
  {
    id: 'food_hedgehog',
    species: 'hedgehog',
    name: 'อาหารเม่นแคระ & หนอนอบแห้ง (3 มื้อ)',
    price: 40,
    servings: 3,
    description: 'โปรตีนสูงบำรุงขนหนาม 1 ถุงให้อาหารได้ 3 สัปดาห์',
    accentHex: '#65A30D',
  },
  {
    id: 'food_snake',
    species: 'snake',
    name: 'อาหารงู & แร่ธาตุสำเร็จรูป (3 มื้อ)',
    price: 45,
    servings: 3,
    description: 'โปรตีนสะอาดปลอดภัยสำหรับงูเลี้ยง 1 ชุดให้อาหารได้ 3 สัปดาห์',
    accentHex: '#0D9488',
  },
];

export const STUDIO_ITEMS: StudioItemDef[] = [
  // เฟอร์นิเจอร์
  {
    id: 'drafting_table',
    name: 'โต๊ะดราฟต์สถาปัตย์ & เก้าอี้',
    category: 'furniture',
    categoryLabel: 'เฟอร์นิเจอร์',
    price: 280,
    fameBonus: 2,
    description: 'โต๊ะเขียนแบบพร้อมแปลนอาคาร ไม้ฉากสามเหลี่ยม และเก้าอี้หมุนคู่ใจ',
    accentHex: '#C28E5C',
  },
  {
    id: 'coffee_table',
    name: 'ตู้ข้างเตียง & โคมไฟอุ่น',
    category: 'furniture',
    categoryLabel: 'เฟอร์นิเจอร์',
    price: 240,
    fameBonus: 2,
    description: 'ตู้ลิ้นชัก 2 ชั้นสไตล์ Setup Dream Room พร้อมโคมไฟตั้งโต๊ะส่องสว่างตอนกลางคืน',
    accentHex: '#8C857D',
  },
  {
    id: 'bookshelf',
    name: 'ตู้หนังสือสูง & ม้วนแบบแปลน',
    category: 'furniture',
    categoryLabel: 'เฟอร์นิเจอร์',
    price: 380,
    fameBonus: 3,
    description: 'ชั้นหนังสือไม้โอ๊คเต็มตู้ อัดแน่นด้วยอาร์ตบุ๊ก นิตยสาร และต้นไม้ด้านบน',
    accentHex: '#B6895B',
  },
  {
    id: 'cozy_sofa',
    name: 'โซฟาลินินพักไอเดีย',
    category: 'furniture',
    categoryLabel: 'เฟอร์นิเจอร์',
    price: 460,
    fameBonus: 3,
    description: 'โซฟาผ้านุ่มสีเทาอบอุ่น นั่งดู Reference หรือพักสายตาระหว่างปั่นพอร์ต',
    accentHex: '#98A2B3',
  },
  {
    id: 'digital_desk',
    name: 'โต๊ะคอมจอดูอัล & เมาส์ปากกา',
    category: 'furniture',
    categoryLabel: 'เฟอร์นิเจอร์',
    price: 780,
    fameBonus: 5,
    description: 'สเตชันจอคู่แต่งภาพและวาดดิจิทัลอาร์ต พร้อมเมาส์ปากกาและเก้าอี้ทำงาน',
    accentHex: '#2563EB',
  },
  {
    id: 'model_workbench',
    name: 'โต๊ะปั้นหุ่น & ตัดโมเดลสถาปัตย์',
    category: 'furniture',
    categoryLabel: 'เฟอร์นิเจอร์',
    price: 860,
    fameBonus: 5,
    description: 'โต๊ะเวิร์กเบนช์ไม้เนื้อแข็ง พร้อมโมเดลอาคารไม้และชุดปั้นดินเผาสำหรับทำพอร์ต',
    accentHex: '#A6784E',
  },

  // อุปกรณ์ศิลปะ
  {
    id: 'blueprint_basket',
    name: 'ถังม้วนแบบแปลน & กระบอกแบบ',
    category: 'equipment',
    categoryLabel: 'อุปกรณ์ศิลปะ',
    price: 160,
    fameBonus: 1,
    description: 'ตะกร้าใส่ม้วนกระดาษร่างแบบแปลน กระดาษวาดเส้น และไม้บรรทัดเหล็ก',
    accentHex: '#B45309',
  },
  {
    id: 'sketch_mess',
    name: 'มุมสเก็ตช์บุ๊ก & จานสีตั้งพื้น',
    category: 'equipment',
    categoryLabel: 'อุปกรณ์ศิลปะ',
    price: 190,
    fameBonus: 1,
    description: 'สมุดสเก็ตช์เปิดกาง จานสีน้ำ และแก้วล้างพู่กัน เติมฟีลห้องทำงานศิลปินตัวจริง',
    accentHex: '#2563EB',
  },
  {
    id: 'mannequin',
    name: 'หุ่นไม้ & หุ่นปั้นสัดส่วน',
    category: 'equipment',
    categoryLabel: 'อุปกรณ์ศิลปะ',
    price: 230,
    fameBonus: 2,
    description: 'หุ่นฝึกอนาโตมีและจัดท่าทาง ช่วยเรื่องสัดส่วนคนและแฟชั่น',
    accentHex: '#C99B6B',
  },
  {
    id: 'easel',
    name: 'ขาตั้งวาดรูปสีน้ำ & ผ้าใบ',
    category: 'equipment',
    categoryLabel: 'อุปกรณ์ศิลปะ',
    price: 340,
    fameBonus: 3,
    description: 'ขาตั้งไม้บีชพร้อมผ้าใบเพนต์งานโมเดิร์น คู่กับสมุดสเก็ตช์และถ้วยน้ำ',
    accentHex: '#D97706',
  },
  {
    id: 'geometry_pedestal',
    name: 'แท่นหุ่นนิ่งเรขาคณิต',
    category: 'equipment',
    categoryLabel: 'อุปกรณ์ศิลปะ',
    price: 410,
    fameBonus: 3,
    description: 'ทรงกลมและลูกบาศก์ปูนปลาสเตอร์ สำหรับฝึกแรเงาแสงเงา',
    accentHex: '#94A3B8',
  },
  {
    id: 'copic_rack',
    name: 'เคาน์เตอร์สีโคปิก & พู่กัน',
    category: 'equipment',
    categoryLabel: 'อุปกรณ์ศิลปะ',
    price: 580,
    fameBonus: 4,
    description: 'ตู้ลิ้นชักเก็บอุปกรณ์ พร้อมแท่นเสียบพู่กัน สีโคปิก และจานสีครบชุด',
    accentHex: '#E11D48',
  },
  {
    id: 'printer_3d',
    name: 'เครื่องพิมพ์ 3D ขึ้นรูปโมเดล',
    category: 'equipment',
    categoryLabel: 'อุปกรณ์ศิลปะ',
    price: 1150,
    fameBonus: 6,
    description: 'เครื่องพรินต์ 3 มิติสำหรับพรินต์ชิ้นงานสถาปัตยกรรมและโปรดักต์ดีไซน์',
    accentHex: '#0F766E',
  },

  // ของตกแต่งทั่วไป
  {
    id: 'monstera',
    name: 'ต้นมอนสเตอร่ากระถางดินเผา',
    category: 'decor',
    categoryLabel: 'ของตกแต่ง',
    price: 160,
    fameBonus: 1,
    description: 'เพิ่มพื้นที่สีเขียวสบายตา ช่วยให้สตูดิโอดูสดชื่นและมีชีวิตชีวา',
    accentHex: '#2D6A4F',
  },
  {
    id: 'beanbag_yellow',
    name: 'เบาะบีนแบ็กสีเหลืองมัสตาร์ด',
    category: 'decor',
    categoryLabel: 'ของตกแต่ง',
    price: 200,
    fameBonus: 2,
    description: 'เบาะนั่งทรงกลมนุ่มนิ่มสีเหลืองอบอุ่น วางมุมหน้าต่างไว้นั่งสเก็ตช์ไอเดีย',
    accentHex: '#EAB308',
  },
  {
    id: 'beanbag_purple',
    name: 'เบาะบีนแบ็กสีม่วงพาสเทล',
    category: 'decor',
    categoryLabel: 'ของตกแต่ง',
    price: 200,
    fameBonus: 2,
    description: 'เบาะนั่งทรงกลมสีลาเวนเดอร์ละมุน เข้ามุมอ่านอาร์ตบุ๊กข้างตู้หนังสือได้พอดี',
    accentHex: '#A855F7',
  },
  {
    id: 'bauhaus_poster',
    name: 'ขาตั้งโปสเตอร์ Bauhaus',
    category: 'decor',
    categoryLabel: 'ของตกแต่ง',
    price: 240,
    fameBonus: 2,
    description: 'บอร์ดแสดงผลงานโปสเตอร์กราฟิกแนว Modernist วางโชว์กลางห้อง',
    accentHex: '#2563EB',
  },
  {
    id: 'woven_rug',
    name: 'พรมวงกลมลายทางพาสเทล',
    category: 'decor',
    categoryLabel: 'ของตกแต่ง',
    price: 260,
    fameBonus: 2,
    description: 'พรมทอกลมลายวงแหวนสีพีช-ครีมสไตล์ Setup Dream Room ปูกลางห้องสุดละมุน',
    accentHex: '#EC4899',
  },
  {
    id: 'wall_shelf_paints',
    name: 'ชั้นวางขวดสี & ต้นไม้จิ๋ว',
    category: 'decor',
    categoryLabel: 'ของตกแต่ง',
    price: 290,
    fameBonus: 2,
    description: 'ตู้ลอยตัวเล็กสำหรับวางเรียงขวดสีอะคริลิก อาร์ตบุ๊ก และต้นกระบองเพชร',
    accentHex: '#10B981',
  },
  {
    id: 'akari_lamp',
    name: 'โคมไฟกระดาษสา Akari',
    category: 'decor',
    categoryLabel: 'ของตกแต่ง',
    price: 380,
    fameBonus: 3,
    description: 'โคมไฟดีไซน์ไอคอนิกของ Isamu Noguchi ให้แสงนุ่มนวลอบอุ่นในห้อง 3D',
    accentHex: '#F59E0B',
  },
  {
    id: 'studio_certificate',
    name: 'แท่นโชว์ใบประกาศ Born to be Art',
    category: 'decor',
    categoryLabel: 'ของตกแต่ง',
    price: 440,
    fameBonus: 3,
    description: 'กรอบใบประกาศเกียรติบัตรประจำสำนัก เพิ่มความน่าเชื่อถือและแรงบันดาลใจ!',
    accentHex: '#B45309',
  },
  {
    id: 'studio_cat',
    name: 'น้องแมวส้มประจำสตูดิโอ',
    category: 'decor',
    categoryLabel: 'ของตกแต่ง',
    price: 680,
    fameBonus: 4,
    description: 'เจ้าเหมียวโมเดล 3D สุดน่ารัก มานอนขดเป็นกำลังใจให้เจ้าของห้องเวลาปั่นงานดึก',
    accentHex: '#D97706',
  },

  // ของตกแต่งช่วงอีเว้นท์: คริสต์มาสและปีใหม่ (เปิดขายถึง 31 ธันวาคม)
  {
    id: 'xmas_snowman_plush',
    name: 'ตุ๊กตาหิมะผ้าพันคอแดง',
    category: 'decor',
    categoryLabel: 'อีเว้นท์เทศกาล',
    price: 290,
    fameBonus: 3,
    description: 'ตุ๊กตาหิมะ 3 มิติสุดคิวท์สวมหมวกทรงสูงและผ้าพันคอแดง บนพรมหิมะนุ่มฟู',
    accentHex: '#EF4444',
    isSeasonal: true,
    eventTag: 'คริสต์มาส & ปีใหม่ · ถึง 31 ธ.ค.',
  },
  {
    id: 'xmas_wreath_stand',
    name: 'มุมพวงมาลัยฮอลลี่ & กล่องของขวัญ',
    category: 'decor',
    categoryLabel: 'อีเว้นท์เทศกาล',
    price: 340,
    fameBonus: 3,
    description: 'ซุ้มพวงมาลัยคริสต์มาสประดับโบว์แดงพร้อมกองกล่องของขวัญปีใหม่สุดอบอุ่น',
    accentHex: '#15803D',
    isSeasonal: true,
    eventTag: 'คริสต์มาส & ปีใหม่ · ถึง 31 ธ.ค.',
  },
  {
    id: 'xmas_tree',
    name: 'ต้นคริสต์มาสสตูดิโอพร้อมไฟประดับ',
    category: 'decor',
    categoryLabel: 'อีเว้นท์เทศกาล',
    price: 480,
    fameBonus: 4,
    description: 'ต้นสนคริสต์มาสประดับลูกบอลสีทอง-แดง ดาวยอดต้น และไฟวอร์มไลท์ส่องสว่างยามค่ำคืน',
    accentHex: '#16A34A',
    isSeasonal: true,
    eventTag: 'คริสต์มาส & ปีใหม่ · ถึง 31 ธ.ค.',
  },
  {
    id: 'ny_countdown_lamp',
    name: 'แท่นไฟดาวเคาท์ดาวน์ปีใหม่',
    category: 'decor',
    categoryLabel: 'อีเว้นท์เทศกาล',
    price: 520,
    fameBonus: 4,
    description: 'ประติมากรรมโคมไฟดาวทองฉลองคืนส่งท้ายปีเก่าต้อนรับปีใหม่ ส่องประกายอุ่นกลางห้อง',
    accentHex: '#EAB308',
    isSeasonal: true,
    eventTag: 'คริสต์มาส & ปีใหม่ · ถึง 31 ธ.ค.',
  },

  // อุปกรณ์เสริมสัตว์เลี้ยง (Pet Gear)
  {
    id: 'pet_bowl_set',
    name: 'แท่นชามอาหารไม้ & ขวดน้ำคู่ใจ',
    category: 'petgear',
    categoryLabel: 'อุปกรณ์สัตว์เลี้ยง',
    price: 180,
    fameBonus: 3,
    description: 'แท่นวางชามอาหารเซรามิกคู่สำหรับสุนัขและแมว จัดมุมป้อนข้าวในสตูดิโอให้เป๊ะ',
    accentHex: '#B45309',
  },
  {
    id: 'pet_play_tunnel',
    name: 'อุโมงค์ของเล่น & ลูกบอลสัตว์เลี้ยง',
    category: 'petgear',
    categoryLabel: 'อุปกรณ์สัตว์เลี้ยง',
    price: 250,
    fameBonus: 4,
    description: 'อุโมงค์ผ้าสีพาสเทลและลูกบอลกระพรวน ช่วยให้น้องหมา น้องแมว และเม่นแคระอารมณ์ดี',
    accentHex: '#EC4899',
  },
  {
    id: 'pet_grooming_cart',
    name: 'รถเข็นดูแลสัตว์เลี้ยง & แปรงขน',
    category: 'petgear',
    categoryLabel: 'อุปกรณ์สัตว์เลี้ยง',
    price: 320,
    fameBonus: 5,
    description: 'ชุดแชมพู ผ้าเช็ดตัว และแปรงหวีขนสำหรับดูแลสุขภาพสัตว์เลี้ยงในห้อง',
    accentHex: '#0EA5E9',
  },
];

export const ITEM_MAP: Record<string, StudioItemDef> = Object.fromEntries(
  [...STUDIO_ITEMS, ...WALL_FRAME_ITEMS].map((item) => [item.id, item])
);

export const WALL_MAP: Record<string, WallTheme> = Object.fromEntries(
  WALL_THEMES.map((w) => [w.id, w])
);

export const FLOOR_MAP: Record<string, FloorTheme> = Object.fromEntries(
  FLOOR_THEMES.map((f) => [f.id, f])
);

export const DOOR_MAP: Record<string, DoorTheme> = Object.fromEntries(
  DOOR_THEMES.map((d) => [d.id, d])
);

export const WINDOW_VIEW_MAP: Record<string, WindowViewTheme> = Object.fromEntries(
  WINDOW_VIEW_THEMES.map((v) => [v.id, v])
);

export const PET_BREED_MAP: Record<string, PetBreedDef> = Object.fromEntries(
  PET_BREEDS.map((b) => [b.id, b])
);

export const PET_FOOD_MAP: Record<PetSpecies, PetFoodDef> = Object.fromEntries(
  PET_FOODS.map((f) => [f.species, f])
) as Record<PetSpecies, PetFoodDef>;

export function getRankInfo(
  fame: number,
  heartlessPenaltyUntil: number | null = null,
  now = Date.now()
): {
  level: number;
  title: string;
  normalTitle: string;
  minFame: number;
  maxFame: number;
  nextFameTarget: number;
  maxPetSlots: number;
  isHeartless: boolean;
  penaltyDaysLeft: number;
} {
  const clamped = Math.min(MAX_FAME, Math.max(0, Math.round(fame)));
  const tier =
    RANK_TIERS.find((t) => clamped >= t.minFame && clamped <= t.maxFame) ??
    RANK_TIERS[RANK_TIERS.length - 1];

  const isHeartless = Boolean(heartlessPenaltyUntil && now < heartlessPenaltyUntil);
  const penaltyDaysLeft = isHeartless && heartlessPenaltyUntil
    ? Math.max(1, Math.ceil((heartlessPenaltyUntil - now) / (1000 * 60 * 60 * 24)))
    : 0;

  return {
    level: tier.level,
    title: isHeartless ? 'คนใจร้าย' : tier.title,
    normalTitle: tier.title,
    minFame: tier.minFame,
    maxFame: tier.maxFame,
    nextFameTarget: tier.level < 6 ? tier.maxFame + 1 : MAX_FAME,
    maxPetSlots: tier.maxPetSlots,
    isHeartless,
    penaltyDaysLeft,
  };
}

export function getStudioRank(
  fame: number,
  heartlessPenaltyUntil: number | null = null
): string {
  return getRankInfo(fame, heartlessPenaltyUntil).title;
}

export function getPetFootprintTiles(pet: Pick<OwnedPet, 'breedId' | 'x' | 'y' | 'rotationStep'>): {
  x: number;
  y: number;
}[] {
  const breed = PET_BREED_MAP[pet.breedId];
  const baseW = breed?.gridW ?? 1;
  const baseH = breed?.gridH ?? 1;
  const rot = (pet.rotationStep ?? 0) % 2;
  const w = rot === 1 ? baseH : baseW;
  const h = rot === 1 ? baseW : baseH;
  const tiles: { x: number; y: number }[] = [];
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      tiles.push({ x: pet.x + dx, y: pet.y + dy });
    }
  }
  return tiles;
}

export function getOccupiedTileSet(
  placedItems: PlacedItem[],
  pets: OwnedPet[],
  ignorePetId?: string
): Set<string> {
  const occupied = new Set<string>();
  for (const item of placedItems) {
    occupied.add(`${item.x},${item.y}`);
  }
  for (const pet of pets) {
    if (ignorePetId && pet.instanceId === ignorePetId) continue;
    for (const t of getPetFootprintTiles(pet)) {
      occupied.add(`${t.x},${t.y}`);
    }
  }
  return occupied;
}

export function findFreeTilesForPet(
  breedId: string,
  placedItems: PlacedItem[],
  pets: OwnedPet[],
  studioExpanded: boolean,
  ignorePetId?: string
): { x: number; y: number; rotationStep: number } | null {
  const gridLimit = studioExpanded ? 7 : 5;
  const occupied = getOccupiedTileSet(placedItems, pets, ignorePetId);
  const breed = PET_BREED_MAP[breedId];
  const baseW = breed?.gridW ?? 1;
  const baseH = breed?.gridH ?? 1;

  for (const rot of [0, 1]) {
    const w = rot === 1 ? baseH : baseW;
    const h = rot === 1 ? baseW : baseH;
    for (let y = 0; y <= gridLimit - h; y++) {
      for (let x = 0; x <= gridLimit - w; x++) {
        let ok = true;
        for (let dy = 0; dy < h && ok; dy++) {
          for (let dx = 0; dx < w && ok; dx++) {
            if (occupied.has(`${x + dx},${y + dy}`)) ok = false;
          }
        }
        if (ok) return { x, y, rotationStep: rot };
      }
    }
  }
  return null;
}

export const INITIAL_GAME_STATE: StudioGameState = {
  studentName: 'น้องกานต์',
  majorTrack: 'สถาปัตยกรรม',
  coins: 120,
  fame: 5,
  studioExpanded: false,
  ownedItems: {
    drafting_table: 1,
    monstera: 1,
    beanbag_yellow: 1,
    woven_rug: 1,
    coffee_table: 1,
  },
  ownedWalls: ['warm_ivory'],
  ownedFloors: ['japanese_oak'],
  ownedDoors: ['door_terracotta'],
  ownedWindowViews: ['city_warm'],
  activeWallId: 'warm_ivory',
  activeFloorId: 'japanese_oak',
  activeDoorId: 'door_terracotta',
  activeWindowViewId: 'city_warm',
  placedItems: [
    { instanceId: 'starter-1', itemId: 'drafting_table', x: 1, y: 0, rotationStep: 0 },
    { instanceId: 'starter-2', itemId: 'coffee_table', x: 3, y: 0, rotationStep: 0 },
    { instanceId: 'starter-3', itemId: 'monstera', x: 0, y: 3, rotationStep: 0 },
    { instanceId: 'starter-4', itemId: 'woven_rug', x: 2, y: 2, rotationStep: 0 },
    { instanceId: 'starter-5', itemId: 'beanbag_yellow', x: 1, y: 4, rotationStep: 0 },
  ],
  ownedWallFrames: [],
  wallFrameArtworks: {
    landscape: null,
    portrait: null,
  },
  pets: [],
  petFood: {
    dog: 1,
    cat: 1,
    goldfish: 1,
    hedgehog: 1,
    snake: 1,
  },
  heartlessPenaltyUntil: null,
  deadPetCount: 0,
  avatar: INITIAL_AVATAR_CONFIG,
  ownedAvatarItems: INITIAL_OWNED_AVATAR_ITEMS,
  hasSelectedGender: false,
  gallery: [],
  votedClassmates: {},
  quizCorrectCount: 0,
  quizAttemptCount: 0,
  answeredQuizIds: [],
  dailyQuizDate: '',
  dailyQuizCount: 0,
  soundEnabled: true,
};
