/** Product CMS image rules — matches existing shop assets (~430–540 KB WebP). */

export const PRODUCT_IMAGE = {
  /** Reject uploads larger than this before processing */
  maxUploadBytes: 2 * 1024 * 1024, // 2 MB
  /** Longest edge after resize */
  maxDimension: 1600,
  /** WebP quality (existing catalog assets are ~0.4–0.5 MB) */
  webpQuality: 80,
  /** Accepted upload MIME types */
  acceptMime: ["image/jpeg", "image/png", "image/webp"] as const,
  /** Shown in file picker */
  acceptAttr: "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp",
  /** Public folder for saved files */
  uploadDir: "uploads/products",
} as const;

export const PRODUCT_IMAGE_HELP = {
  formats: "JPEG, PNG, or WebP",
  maxUpload: "2 MB max upload",
  output: "Saved as WebP, max 1600px on the long edge",
  recommended: "Square or portrait product shot · aim under 500 KB after optimize (same as current flavor images)",
} as const;

export function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
