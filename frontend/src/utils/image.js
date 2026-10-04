export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp"];

/** Returns an error message, or "" when the file is an acceptable apartment photo. */
export function checkImage(file) {
  if (!file) return "Please choose a photo.";
  const okType = TYPES.includes(file.type) || /\.(jpe?g|png|webp)$/i.test(file.name);
  if (!okType) return "Only JPG, PNG or WebP photos are accepted.";
  if (file.size > MAX_IMAGE_BYTES) return "The photo must be 5 MB or smaller.";
  return "";
}
