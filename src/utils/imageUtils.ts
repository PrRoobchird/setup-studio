export interface CompressedImage {
  base64: string;
  mimeType: string;
  dataUrl: string;
}

export function compressImageFile(file: File, maxSize = 1024): Promise<CompressedImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('ไม่สามารถอ่านไฟล์ภาพได้'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('ไฟล์นี้ไม่ใช่รูปภาพที่รองรับ'));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          if (width >= height) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          } else {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('เบราว์เซอร์ไม่รองรับการประมวลผลภาพ'));
          return;
        }
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.86);
        const base64 = dataUrl.split(',')[1] || '';
        resolve({
          base64,
          mimeType: 'image/jpeg',
          dataUrl,
        });
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export async function imageUrlToCompressed(url: string, maxSize = 1024): Promise<CompressedImage> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('ไม่สามารถโหลดภาพตัวอย่างได้');
  }
  const blob = await response.blob();
  const file = new File([blob], 'artwork.jpg', { type: blob.type || 'image/jpeg' });
  return compressImageFile(file, maxSize);
}
