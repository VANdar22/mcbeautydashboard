// src/lib/uploadImage.js  (admin dashboard, Supabase Storage version)
// Shrinks the photo in the browser, uploads it to the "product-images" bucket in Supabase,
// and returns its public URL. Same exports as before, so the screens don't change.
//
// One-time setup in Supabase: run the SQL for the bucket and its admin-only upload rule
// (see the message that came with this file).

import { supabase } from "./supabase";

const BUCKET = "product-images";
const MAX_MB = 12; // size you may pick; it is reduced before upload
const MAX_SIDE = 1200; // longest edge in pixels after shrinking
const TYPES = ["image/jpeg", "image/png", "image/webp"];

// Resize and convert to WebP (falls back to JPEG in browsers that can't encode WebP).
async function shrink(file) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();

  let blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", 0.85));
  if (!blob || blob.type !== "image/webp") {
    blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.88));
  }
  return blob;
}

export async function uploadImage(file) {
  if (!TYPES.includes(file.type)) throw new Error("Use a JPG, PNG or WebP image.");
  if (file.size > MAX_MB * 1024 * 1024) throw new Error(`Image must be under ${MAX_MB} MB.`);

  const blob = await shrink(file);
  const ext = blob.type === "image/webp" ? "webp" : "jpg";
  const path = `products/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { contentType: blob.type, cacheControl: "31536000", upsert: false });
  if (error) {
    throw new Error(
      /row-level security|not authorized|jwt/i.test(error.message)
        ? "Upload not allowed. Check that you are an admin and the bucket rule was created."
        : error.message
    );
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, publicId: path };
}

// Attach an uploaded image to a product.
export async function saveProductImage(productId, { url }, { position = 0, isPrimary = false } = {}) {
  const { error } = await supabase
    .from("product_images")
    .insert({ product_id: productId, url, position, is_primary: isPrimary });
  if (error) throw error;
}