import React from 'react';
import {
  AlertTriangle,
  Coins,
  Heart,
  Move,
  RotateCw,
  ShoppingBag,
  Undo2,
  Utensils,
  X,
} from 'lucide-react';
import {
  PET_BREED_MAP,
  PET_DEATH_GRACE_MS,
  PET_FEED_INTERVAL_MS,
  PET_FOOD_MAP,
} from '../data/catalog';
import { OwnedPet, PetSpecies } from '../types/studio';
import { PetIllustration } from './PetIllustration';

interface PetCareModalProps {
  pet: OwnedPet;
  foodStock: number;
  coins: number;
  onFeedPet: (petInstanceId: string) => void;
  onBuyPetFood: (species: PetSpecies) => void;
  onRotatePet: (petInstanceId: string) => void;
  onStartMovePet: (petInstanceId: string) => void;
  onReturnPet: (petInstanceId: string) => void;
  onClose: () => void;
}

function formatRemainingTime(ms: number): string {
  if (ms <= 0) return 'ครบกำหนดแล้ว';
  const totalHours = Math.ceil(ms / (1000 * 60 * 60));
  if (totalHours < 24) return `${totalHours} ชั่วโมง`;
  const days = Math.floor(totalHours / 24);
  const remH = totalHours % 24;
  return remH > 0 ? `${days} วัน ${remH} ชม.` : `${days} วัน`;
}

export const PetCareModal: React.FC<PetCareModalProps> = ({
  pet,
  foodStock,
  coins,
  onFeedPet,
  onBuyPetFood,
  onRotatePet,
  onStartMovePet,
  onReturnPet,
  onClose,
}) => {
  const breed = PET_BREED_MAP[pet.breedId];
  const food = PET_FOOD_MAP[pet.species];
  const now = Date.now();
  const elapsedSinceFed = Math.max(0, now - pet.lastFedAt);
  const isSick = pet.status === 'sick' || elapsedSinceFed > PET_FEED_INTERVAL_MS;
  const untilHungryMs = Math.max(0, PET_FEED_INTERVAL_MS - elapsedSinceFed);
  const untilDeathMs = Math.max(
    0,
    PET_FEED_INTERVAL_MS + PET_DEATH_GRACE_MS - elapsedSinceFed
  );

  const canAffordFood = coins >= (food?.price ?? 40);
  const canAffordReturn = coins >= (breed?.returnFee ?? 120);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/55 flex items-center justify-center p-3 sm:p-5"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#FAF8F4] border border-[#E5DCCB] rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl"
      >
        <div className="px-5 py-4 bg-white border-b border-[#ECE6DA] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-b from-[#6FA6E8] to-[#98C2F4] flex items-center justify-center shrink-0">
              <PetIllustration breedId={pet.breedId} className="w-10 h-10" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-[#1F1D1A] truncate">
                {pet.nickname} ({breed?.breedName ?? pet.species})
              </h2>
              <p className="text-xs text-[#6E675F]">
                {breed?.enclosureName ?? 'กรงสัตว์เลี้ยง'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[#6E675F] hover:bg-[#F1ECE2] cursor-pointer"
            aria-label="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Health & Feeding Countdown */}
          <div
            className={`p-4 rounded-2xl border space-y-2 ${
              isSick
                ? 'bg-[#FFF1F2] border-[#FECDD3] text-[#9F1239]'
                : 'bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold">
                {isSick ? (
                  <>
                    <AlertTriangle className="w-4 h-4 text-[#E11D48]" />
                    สถานะ: กำลังป่วย! (ขาดอาหารเกิน 1 สัปดาห์)
                  </>
                ) : (
                  <>
                    <Heart className="w-4 h-4 text-[#10B981]" />
                    สถานะ: แข็งแรง อารมณ์ดี
                  </>
                )}
              </span>
              <span className="font-mono-num text-xs font-semibold">
                อาหารคงเหลือ {foodStock} มื้อ
              </span>
            </div>

            <p className="text-xs leading-relaxed">
              {isSick
                ? `รีบให้อาหารภายใน ${formatRemainingTime(untilDeathMs)} ไม่เช่นนั้นสัตว์เลี้ยงจะตาย ค่า Fame จะลดลง และสตูดิโอจะติดโทษขาว-ดำ (คนใจร้าย) เป็นเวลา 7 วัน`
                : `อิ่มสบาย! อย่าลืมให้อาหารอย่างน้อยสัปดาห์ละ 1 ครั้ง (รอบถัดไปภายใน ${formatRemainingTime(untilHungryMs)})`}
            </p>
          </div>

          {/* Feed Action */}
          <div className="bg-white border border-[#E7E1D6] rounded-2xl p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-sm font-semibold text-[#1F1D1A]">
                  {food?.name ?? 'อาหารสัตว์เลี้ยง'}
                </div>
                <div className="text-xs text-[#6E675F]">
                  ให้อาหาร 1 มื้อจะรีเซ็ตเวลาเป็น 7 วันทันทีและรักษาอาการป่วยได้
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={foodStock <= 0}
                onClick={() => onFeedPet(pet.instanceId)}
                className={`flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 min-h-[42px] rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  foodStock > 0
                    ? 'bg-[#16A34A] text-white hover:bg-[#15803D] cursor-pointer'
                    : 'bg-[#E7E1D6] text-[#8C8377] cursor-not-allowed'
                }`}
              >
                <Utensils className="w-4 h-4" />
                {foodStock > 0 ? 'ให้อาหารตอนนี้ (-1 มื้อ)' : 'อาหารหมดแล้ว'}
              </button>

              {food && (
                <button
                  type="button"
                  disabled={!canAffordFood}
                  onClick={() => onBuyPetFood(pet.species)}
                  className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 min-h-[42px] rounded-xl text-xs font-semibold transition-all ${
                    canAffordFood
                      ? 'bg-[#2563EB] text-white hover:bg-[#1D4ED8] cursor-pointer'
                      : 'bg-[#E7E1D6] text-[#8C8377] cursor-not-allowed'
                  }`}
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  ซื้อ +{food.servings} มื้อ ({food.price} 💡)
                </button>
              )}
            </div>
          </div>

          {/* Placement Controls */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => {
                onStartMovePet(pet.instanceId);
                onClose();
              }}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 min-h-[42px] rounded-xl bg-white border border-[#DED5C5] text-xs sm:text-sm font-medium text-[#1F1D1A] hover:bg-[#F1ECE2] cursor-pointer"
            >
              <Move className="w-4 h-4 text-[#2563EB]" />
              ย้ายตำแหน่งคอก/กรง
            </button>
            <button
              type="button"
              onClick={() => onRotatePet(pet.instanceId)}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 min-h-[42px] rounded-xl bg-white border border-[#DED5C5] text-xs sm:text-sm font-medium text-[#1F1D1A] hover:bg-[#F1ECE2] cursor-pointer"
            >
              <RotateCw className="w-4 h-4 text-[#A9623F]" />
              หมุนทิศทาง 90°
            </button>
          </div>

          {/* Return Pet to Shop (With Return Fee) */}
          <div className="pt-3 border-t border-[#E7E1D6] flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-[#6E675F]">
              ต้องการเปลี่ยนตัวหรือเลิกเลี้ยง? ต้องนำกลับไปคืนร้านค้า
            </div>
            <button
              type="button"
              disabled={!canAffordReturn}
              onClick={() => {
                onReturnPet(pet.instanceId);
                onClose();
              }}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[38px] rounded-xl text-xs font-semibold transition-all ${
                canAffordReturn
                  ? 'bg-[#FFF1F2] border border-[#FECDD3] text-[#BE123C] hover:bg-[#FFE4E6] cursor-pointer'
                  : 'bg-[#E7E1D6] text-[#8C8377] cursor-not-allowed'
              }`}
            >
              <Undo2 className="w-3.5 h-3.5" />
              คืนร้านค้า (ค่าธรรมเนียม {breed?.returnFee ?? 120} <Coins className="w-3 h-3 inline" />)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
