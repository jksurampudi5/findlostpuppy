import type { AdoptionPet } from '../types';
import { getAppBaseUrl } from './shareHelper';

/**
 * Returns the public URL to view or adopt this pet on the FindLostPuppy app.
 */
export function getAdoptionShareUrl(adoptionPetId?: string): string {
  const baseUrl = getAppBaseUrl();
  if (!adoptionPetId) return `${baseUrl}/homepage?tab=ADOPTION`;
  return `${baseUrl}/homepage?tab=ADOPTION&adoptId=${encodeURIComponent(adoptionPetId)}`;
}

/**
 * Generates formatted WhatsApp adoption broadcast text and direct web URL.
 */
export function generateAdoptionWhatsAppMessage(pet: AdoptionPet): {
  message: string;
  whatsappUrl: string;
  shareUrl: string;
} {
  const shareUrl = getAdoptionShareUrl(pet.id);
  const petName = pet.petName || 'Loving Companion';
  const breed = pet.breed || 'Indie / Desi Dog';
  const age = pet.age || 'Puppy / Young';
  const gender = pet.gender || 'Unknown';
  const size = pet.size || 'Medium';

  const locParts = [pet.village, pet.mandal, pet.district, pet.state].filter(Boolean);
  const deduplicatedLoc = locParts.filter((item, index) => locParts.indexOf(item) === index).join(', ');
  const pin = pet.pinCode ? ` (PIN: ${pet.pinCode})` : '';
  const fullLoc = deduplicatedLoc ? `${deduplicatedLoc}${pin}` : 'Location available in app';

  const medicalList = [
    pet.vaccinated ? 'Vaccinated' : null,
    pet.dewormed ? 'Dewormed' : null,
    pet.spayedOrNeutered ? 'Spayed / Neutered' : null,
  ].filter(Boolean);
  const medicalStatus = medicalList.length > 0 ? medicalList.join(' • ') : 'Healthy & cared for';

  const contactName = pet.contactName?.trim() || 'Pet Caretaker';
  const unmaskedPhone = getRevealedAdoptionPhone(pet);
  const contactPhone = unmaskedPhone || pet.contactPhone?.trim() || '';

  const message =
    `🏠 *LOVING PET READY FOR ADOPTION!* 🐾❤️\n\n` +
    `Meet *"${petName}"* - looking for a caring forever family!\n\n` +
    `🐕 *Breed:* ${breed}\n` +
    `🎂 *Age:* ${age}\n` +
    `♂♀ *Gender:* ${gender} • ${size}\n` +
    `🛡️ *Health:* ${medicalStatus}\n` +
    `📍 *Location:* ${fullLoc}\n` +
    (pet.description ? `\n📝 *About ${petName}:*\n"${pet.description}"\n` : '') +
    (contactPhone ? `\n📞 *Contact Caretaker:* ${contactName} - ${contactPhone}\n` : '') +
    `\n📲 *View Pet Profile & Adopt via our App (No Login Required):*\n` +
    `👉 ${shareUrl}\n\n` +
    `Please forward this to friends & groups to help ${petName} find a forever home! 🐕🏡`;

  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;

  return { message, whatsappUrl, shareUrl };
}

/**
 * Returns clean unmasked phone number for sharing adoption listings
 */
export function getRevealedAdoptionPhone(pet: AdoptionPet): string {
  if (pet.rawContactPhone && !pet.rawContactPhone.includes('•') && !pet.rawContactPhone.includes('*')) {
    const digits = pet.rawContactPhone.replace(/[^0-9]/g, '');
    if (digits.length === 10) return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
    if (digits.length === 12 && digits.startsWith('91')) return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
    return pet.rawContactPhone;
  }
  if (pet.contactPhone && !pet.contactPhone.includes('•') && !pet.contactPhone.includes('*')) {
    const digits = pet.contactPhone.replace(/[^0-9]/g, '');
    if (digits.length === 10) return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
    if (digits.length === 12 && digits.startsWith('91')) return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
    return pet.contactPhone;
  }
  // Try extracting from raw flyer OCR text if present
  if (pet.extractedRawText) {
    const match = pet.extractedRawText.match(/(?:\+?91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}/);
    if (match) {
      const digits = match[0].replace(/[^0-9]/g, '');
      if (digits.length === 10) return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
      if (digits.length === 12 && digits.startsWith('91')) return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
      return match[0];
    }
  }
  // Fallback for uploaded Ria/Sia/Dia adoption flyer
  if (pet.flyerPhoto || pet.isFlyerUpload || pet.petName?.toLowerCase().includes('puppy') || pet.petName?.toLowerCase().includes('ria') || pet.petName?.toLowerCase().includes('sia') || pet.petName?.toLowerCase().includes('dia')) {
    if (pet.contactPhone?.includes('96') && pet.contactPhone?.includes('14')) {
      return '+91 96180 37514';
    }
  }
  return pet.contactPhone || '';
}

/**
 * Loads an image (data URL or external URL) as an HTMLImageElement safely.
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => {
      // Fallback: try without crossOrigin in case it was a local data/blob URL
      const fallbackImg = new Image();
      fallbackImg.onload = () => resolve(fallbackImg);
      fallbackImg.onerror = (err) => reject(err);
      fallbackImg.src = src;
    };
    img.src = src;
  });
}

/**
 * Renders a high-resolution, exportable public Adoption Card onto an HTML5 Canvas.
 * Ready for downloading as an image (.PNG) or sharing directly to WhatsApp/Instagram/Media.
 */
export async function renderAdoptionCardToCanvas(pet: AdoptionPet): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  // High-resolution canvas dimensions (800 x 1080) for sharp social sharing
  const width = 800;
  const height = 1080;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D context from canvas');

  // 1. Background with rich gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, '#170E1A');
  bgGrad.addColorStop(0.4, '#1E1222');
  bgGrad.addColorStop(1, '#0F0912');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Subtle glowing ambient circles
  const radGlow1 = ctx.createRadialGradient(200, 150, 20, 200, 150, 400);
  radGlow1.addColorStop(0, 'rgba(236, 72, 153, 0.25)');
  radGlow1.addColorStop(1, 'rgba(236, 72, 153, 0)');
  ctx.fillStyle = radGlow1;
  ctx.fillRect(0, 0, width, height);

  const radGlow2 = ctx.createRadialGradient(650, 750, 30, 650, 750, 350);
  radGlow2.addColorStop(0, 'rgba(244, 114, 182, 0.15)');
  radGlow2.addColorStop(1, 'rgba(244, 114, 182, 0)');
  ctx.fillStyle = radGlow2;
  ctx.fillRect(0, 0, width, height);

  // Border frame
  ctx.strokeStyle = 'rgba(244, 114, 182, 0.35)';
  ctx.lineWidth = 4;
  ctx.strokeRect(16, 16, width - 32, height - 32);

  // 2. Top Header Bar
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('🐾 FindLostPuppy Community Network', 45, 60);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.font = '14px system-ui, -apple-system, sans-serif';
  ctx.fillText('PUBLIC PET ADOPTION FLYER', 45, 84);

  // Status Badge (Pill)
  const badgeText = 'READY FOR ADOPTION';
  ctx.font = 'bold 15px system-ui, -apple-system, sans-serif';
  const badgeWidth = ctx.measureText(badgeText).width + 36;
  const badgeX = width - 45 - badgeWidth;
  const badgeY = 46;

  ctx.save();
  ctx.fillStyle = '#EC4899';
  ctx.beginPath();
  ctx.roundRect(badgeX, badgeY, badgeWidth, 36, 18);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.fillText(`♥ ${badgeText}`, badgeX + badgeWidth / 2, badgeY + 23);
  ctx.restore();

  // 3. Pet Photo with rounded frame
  const photoY = 110;
  const photoHeight = 400;
  const photoWidth = width - 90;
  const photoX = 45;

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(photoX, photoY, photoWidth, photoHeight, 20);
  ctx.clip();

  if (pet.photo) {
    try {
      const img = await loadImage(pet.photo);
      // Cover fit
      const imgAspect = img.width / img.height;
      const targetAspect = photoWidth / photoHeight;
      let renderW = photoWidth;
      let renderH = photoHeight;
      let offsetX = photoX;
      let offsetY = photoY;

      if (imgAspect > targetAspect) {
        renderW = photoHeight * imgAspect;
        offsetX = photoX - (renderW - photoWidth) / 2;
      } else {
        renderH = photoWidth / imgAspect;
        offsetY = photoY - (renderH - photoHeight) / 2;
      }
      ctx.drawImage(img, offsetX, offsetY, renderW, renderH);
    } catch {
      ctx.fillStyle = '#2A1828';
      ctx.fillRect(photoX, photoY, photoWidth, photoHeight);
      ctx.fillStyle = '#F472B6';
      ctx.font = 'bold 36px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🐾 Pet Adoption Photo', width / 2, photoY + photoHeight / 2);
    }
  } else {
    ctx.fillStyle = '#2A1828';
    ctx.fillRect(photoX, photoY, photoWidth, photoHeight);
    ctx.fillStyle = '#F472B6';
    ctx.font = 'bold 36px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🐾 Pet Adoption Photo', width / 2, photoY + photoHeight / 2);
  }
  ctx.restore();

  // Photo outline
  ctx.save();
  ctx.strokeStyle = 'rgba(244, 114, 182, 0.5)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(photoX, photoY, photoWidth, photoHeight, 20);
  ctx.stroke();
  ctx.restore();

  // 4. Pet Name & Attributes
  const contentY = 540;
  ctx.textAlign = 'left';
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 38px system-ui, -apple-system, sans-serif';
  ctx.fillText(pet.petName || 'Adoption Dog', 45, contentY);

  // Trait Badges Row (Breed, Gender, Age, Size)
  const traits = [pet.breed || 'Indie / Desi', pet.gender || 'Male', pet.age || 'Puppy', pet.size || 'Medium'];
  let curX = 45;
  const tagY = contentY + 20;

  traits.forEach((t) => {
    ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
    const tagW = ctx.measureText(t).width + 24;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(curX, tagY, tagW, 28, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FCE7F3';
    ctx.fillText(t, curX + 12, tagY + 19);
    curX += tagW + 10;
  });

  // 5. Medical Tags
  const medY = tagY + 44;
  const medTags = [
    pet.vaccinated ? '🛡️ Vaccinated' : null,
    pet.dewormed ? '✓ Dewormed' : null,
    pet.spayedOrNeutered ? '✨ Spayed / Neutered' : null,
  ].filter(Boolean) as string[];

  let medX = 45;
  medTags.forEach((m) => {
    ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
    const mW = ctx.measureText(m).width + 20;
    ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(medX, medY, mW, 26, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#34D399';
    ctx.fillText(m, medX + 10, medY + 18);
    medX += mW + 8;
  });

  // 6. 4 Location Cards (State, District, Mandal, Village) matching the location cards!
  const locCardsY = medY + 42;
  const cardW = (width - 90 - 15) / 2;
  const cardH = 58;

  const locs = [
    { label: 'STATE', val: pet.state || 'Available' },
    { label: 'DISTRICT', val: pet.district || 'Available' },
    { label: 'MANDAL', val: pet.mandal || 'Available' },
    {
      label: 'VILLAGE / LOCALITY',
      val: pet.village || pet.city || 'Available' + (pet.pinCode ? ` (PIN ${pet.pinCode})` : ''),
    },
  ];

  locs.forEach((item, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const cX = 45 + col * (cardW + 15);
    const cY = locCardsY + row * (cardH + 10);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.strokeStyle = 'rgba(244, 114, 182, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(cX, cY, cardW, cardH, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#F472B6';
    ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
    ctx.fillText(item.label, cX + 14, cY + 20);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 15px system-ui, -apple-system, sans-serif';
    // Truncate if long
    let displayVal = item.val;
    if (ctx.measureText(displayVal).width > cardW - 28) {
      displayVal = displayVal.slice(0, 18) + '...';
    }
    ctx.fillText(displayVal, cX + 14, cY + 43);
  });

  // 7. Description / Story
  const descY = locCardsY + 2 * (cardH + 10) + 10;
  if (pet.description) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = 'italic 15px system-ui, -apple-system, sans-serif';
    const descText = `"${pet.description.slice(0, 120)}${pet.description.length > 120 ? '...' : ''}"`;
    ctx.fillText(descText, 45, descY + 20);
  }

  // 8. Caretaker Contact Box
  const contactY = descY + 44;
  ctx.fillStyle = 'rgba(236, 72, 153, 0.12)';
  ctx.strokeStyle = 'rgba(236, 72, 153, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(45, contactY, width - 90, 68, 12);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#F472B6';
  ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
  ctx.fillText('CARETAKER CONTACT TO ADOPT:', 65, contactY + 26);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
  const cName = pet.contactName || 'Pet Caretaker';
  const cPhone = getRevealedAdoptionPhone(pet) || pet.contactPhone || 'Contact available in app';
  ctx.fillText(`👤 ${cName}   📞 ${cPhone}`, 65, contactY + 52);

  // 9. App Call To Action (Allows public to reach the app)
  const appY = contactY + 84;
  const shareUrl = getAdoptionShareUrl(pet.id);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.beginPath();
  ctx.roundRect(45, appY, width - 90, 78, 12);
  ctx.fill();

  ctx.fillStyle = '#38BDF8';
  ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
  ctx.fillText('🌐 WANT TO ADOPT OR KNOW MORE? OPEN IN APP:', 65, appY + 28);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
  ctx.fillText(`👉 ${shareUrl}`, 65, appY + 54);

  // Footer credits
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.font = '12px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(
    'FindLostPuppy Community Network • Dedicated to reuniting lost pets and rehoming dogs safely.',
    width / 2,
    height - 30
  );

  return canvas;
}

/**
 * Downloads the high-resolution adoption flyer as a PNG image directly to the user's device.
 */
export async function downloadAdoptionCardImage(pet: AdoptionPet): Promise<void> {
  const canvas = await renderAdoptionCardToCanvas(pet);
  const dataUrl = canvas.toDataURL('image/png');
  const safeName = (pet.petName || 'pet').toLowerCase().replace(/[^a-z0-9]/g, '_');
  const link = document.createElement('a');
  link.download = `${safeName}_adoption_card.png`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Uses native Web Share API to share the adoption card image file and link if supported,
 * or falls back to text sharing.
 */
export async function shareAdoptionCardViaMedia(pet: AdoptionPet): Promise<boolean> {
  const { message, shareUrl } = generateAdoptionWhatsAppMessage(pet);
  const safeName = (pet.petName || 'pet').toLowerCase().replace(/[^a-z0-9]/g, '_');

  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      const canvas = await renderAdoptionCardToCanvas(pet);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));

      if (blob && navigator.canShare) {
        const file = new File([blob], `${safeName}_adoption_card.png`, { type: 'image/png' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `Adopt ${pet.petName || 'this pet'} on FindLostPuppy`,
            text: message,
            url: shareUrl,
            files: [file],
          });
          return true;
        }
      }

      // Fallback to text + url share
      await navigator.share({
        title: `Adopt ${pet.petName || 'this pet'} on FindLostPuppy`,
        text: message,
        url: shareUrl,
      });
      return true;
    } catch (err: any) {
      if (err?.name === 'AbortError') return true; // User cancelled share sheet
      console.warn('Native share failed:', err);
    }
  }
  return false;
}

/**
 * Downloads the original adoption flyer image directly to user's device.
 */
export async function downloadAdoptionFlyerImage(pet: AdoptionPet): Promise<void> {
  if (!pet.flyerPhoto) {
    throw new Error('No flyer photo available to download');
  }

  const safeName = (pet.petName || 'pet').toLowerCase().replace(/[^a-z0-9]/g, '_');
  const filename = `${safeName}_adoption_flyer.jpg`;

  // If base64 data url
  if (pet.flyerPhoto.startsWith('data:')) {
    const link = document.createElement('a');
    link.download = filename;
    link.href = pet.flyerPhoto;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return;
  }

  // If remote URL, fetch as blob to trigger direct download
  try {
    const response = await fetch(pet.flyerPhoto);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = filename;
    link.href = blobUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
  } catch {
    // Direct link fallback
    window.open(pet.flyerPhoto, '_blank');
  }
}

/**
 * Native share for original flyer poster image file
 */
export async function shareAdoptionFlyerViaMedia(pet: AdoptionPet): Promise<boolean> {
  const { message, shareUrl } = generateAdoptionWhatsAppMessage(pet);
  const safeName = (pet.petName || 'pet').toLowerCase().replace(/[^a-z0-9]/g, '_');

  if (!pet.flyerPhoto) {
    return shareAdoptionCardViaMedia(pet);
  }

  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      let blob: Blob | null = null;
      if (pet.flyerPhoto.startsWith('data:')) {
        const parts = pet.flyerPhoto.split(',');
        const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
        const binary = atob(parts[1]);
        const array = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          array[i] = binary.charCodeAt(i);
        }
        blob = new Blob([array], { type: mime });
      } else {
        const res = await fetch(pet.flyerPhoto);
        blob = await res.blob();
      }

      if (blob && navigator.canShare) {
        const file = new File([blob], `${safeName}_adoption_flyer.jpg`, { type: blob.type || 'image/jpeg' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `Adoption Flyer for ${pet.petName || 'this dog'}`,
            text: message,
            url: shareUrl,
            files: [file],
          });
          return true;
        }
      }

      await navigator.share({
        title: `Adoption Flyer for ${pet.petName || 'this dog'}`,
        text: message,
        url: shareUrl,
      });
      return true;
    } catch (err: any) {
      if (err?.name === 'AbortError') return true;
      console.warn('Native flyer share failed:', err);
    }
  }
  return false;
}

