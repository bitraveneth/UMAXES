/** Login / register carousel image rules — full-bleed panel photos. */

export const LOGIN_IMAGE = {
  maxUploadBytes: 4 * 1024 * 1024, // 4 MB
  maxDimension: 2400,
  webpQuality: 82,
  acceptMime: ["image/jpeg", "image/png", "image/webp"] as const,
  acceptAttr: "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp",
} as const;

export const LOGIN_IMAGE_HELP = {
  formats: "JPEG, PNG, or WebP",
  maxUpload: "4 MB max upload",
  output: "Saved as WebP, max 2400px on the long edge",
  recommended: "Landscape product / lifestyle shot · ~16:10 or taller for the login panel",
} as const;
