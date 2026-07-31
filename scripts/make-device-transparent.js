const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const src = "D:/UMAXES/image (2).jpg";
const out = "D:/UMAXES/public/images/product/device-transparent.png";
const outBrand = "D:/UMAXES/public/images/product/umaxes-device.png";

function isCheckerPixel(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const sat = max === 0 ? 0 : (max - min) / max;
  const brightness = (r + g + b) / 3;

  // Neutral gray/white checker tiles (low saturation, mid-to-high brightness)
  if (sat < 0.08 && brightness > 145) return true;
  // Near-white tile
  if (r > 230 && g > 230 && b > 230) return true;
  // Typical light gray tile ~#C0C0C0 / #D9D9D9
  if (sat < 0.06 && brightness > 170 && brightness < 250) return true;
  return false;
}

(async () => {
  const { data, info } = await sharp(src)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  console.log("input", info.format || "raw", width, height, "hasAlpha was false (jpeg)");

  for (let i = 0; i < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (isCheckerPixel(r, g, b)) {
      data[i + 3] = 0;
    }
  }

  // Soften fringe: if almost checker-like, fade alpha
  for (let i = 0; i < data.length; i += channels) {
    if (data[i + 3] === 0) continue;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const sat = max === 0 ? 0 : (max - min) / max;
    const brightness = (r + g + b) / 3;
    if (sat < 0.12 && brightness > 160) {
      const t = Math.min(1, (brightness - 160) / 80);
      data[i + 3] = Math.round(data[i + 3] * (1 - t * 0.85));
    }
  }

  fs.mkdirSync(path.dirname(out), { recursive: true });
  const tmp = "D:/UMAXES/public/images/product/_tmp-device.png";
  await sharp(data, { raw: { width, height, channels } }).png().toFile(tmp);
  await sharp(tmp).trim({ threshold: 10 }).png().toFile(out);
  fs.copyFileSync(out, outBrand);
  fs.unlinkSync(tmp);

  const meta = await sharp(out).metadata();
  console.log("output", meta.width, meta.height, "alpha=" + meta.hasAlpha, "format=" + meta.format);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
