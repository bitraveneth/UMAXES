const sharp = require("sharp");
const fs = require("fs");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080">
  <defs>
    <radialGradient id="g" cx="50%" cy="45%" r="70%">
      <stop offset="0%" stop-color="#FFE8A3"/>
      <stop offset="35%" stop-color="#FFB84D"/>
      <stop offset="65%" stop-color="#FF8C1A"/>
      <stop offset="100%" stop-color="#E85D04"/>
    </radialGradient>
    <filter id="blur"><feGaussianBlur stdDeviation="48"/></filter>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <circle cx="380" cy="280" r="240" fill="#FFD36A" opacity="0.55" filter="url(#blur)"/>
  <circle cx="1480" cy="720" r="300" fill="#FF7A1A" opacity="0.5" filter="url(#blur)"/>
  <ellipse cx="960" cy="540" rx="440" ry="340" fill="#FFE29A" opacity="0.28" filter="url(#blur)"/>
  <circle cx="1100" cy="260" r="160" fill="#FFF3C4" opacity="0.4" filter="url(#blur)"/>
</svg>`;

const out = "D:/UMAXES/public/images/flavors/mango.png";
fs.mkdirSync("D:/UMAXES/public/images/flavors", { recursive: true });

sharp(Buffer.from(svg))
  .png()
  .toFile(out)
  .then(() => console.log("wrote", out))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
