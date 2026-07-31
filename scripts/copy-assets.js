const fs = require("fs");
const path = require("path");

const src = "D:/UMAXES/D63030-UMAXES-";
const files = fs.readdirSync(src);

function num(f) {
  const m = f.match(/-(\d+)\.png$/i);
  return m ? parseInt(m[1], 10) : 0;
}

function byNum(a, b) {
  return num(a) - num(b);
}

// Group by unique middle segments (mojibake-stable when read from disk)
const hero = files.filter((f) => /-\d+\.png$/i.test(f) && f.includes("主图")).sort(byNum);
const product = files.filter((f) => /-\d+\.png$/i.test(f) && f.includes("产品图") && !f.includes("产品+")).sort(byNum);
const testimonials = files
  .filter((f) => /-\d+\.png$/i.test(f) && (f.includes("用户") || f.includes("评价") || f.includes("模特")))
  .sort(byNum);

// Fallback: classify by size buckets / count if Chinese names fail under encoding
function fallbackGroups() {
  const pngs = files.filter((f) => f.endsWith(".png"));
  const withStats = pngs.map((f) => ({
    f,
    size: fs.statSync(path.join(src, f)).size,
    n: num(f),
  }));

  // Hero: 4 files ~1.8–2.4MB without + in name, mid size large
  // From earlier dir: 主图 ~1.8-2.3MB, 产品+小图 ~650k, 口味图 ~1.5-1.7MB, 评价 ~1.6-2.0MB
  // Safer: use filename patterns from user's path suffixes by counting groups of 4, 10, 4

  // Partition by shared name stem (everything before last -N.png)
  const stems = new Map();
  for (const f of pngs) {
    const stem = f.replace(/-\d+\.png$/i, "").replace(/\.png$/i, "");
    if (!stems.has(stem)) stems.set(stem, []);
    stems.get(stem).push(f);
  }

  const groups = [...stems.entries()].map(([stem, list]) => ({
    stem,
    list: list.sort(byNum),
    count: list.length,
    avgSize: list.reduce((s, f) => s + fs.statSync(path.join(src, f)).size, 0) / list.length,
  }));

  groups.sort((a, b) => b.avgSize - a.avgSize);
  console.log(
    "stems:",
    groups.map((g) => ({ count: g.count, avg: Math.round(g.avgSize), sample: g.list[0] }))
  );

  // Match user mapping:
  // hero = 4 images (largest avg among count===4 that aren't testimonials)
  // product = count === 10 (口味图 per user path ┐┌╬╢═╝)
  // testimonials = other count === 4
  const tens = groups.filter((g) => g.count === 10);
  const fours = groups.filter((g) => g.count === 4);

  // User said product is ┐┌╬╢═╝ with 10 files - the larger 10-set is 口味图 (~1.5MB), smaller is 产品+小图 (~650k)
  // User explicitly listed product as those 10 paths matching ┐┌╬╢═╝ - pick the larger 10-group
  tens.sort((a, b) => b.avgSize - a.avgSize);
  fours.sort((a, b) => b.avgSize - a.avgSize);

  // Hero paths were 主图 (large ~2MB), testimonials 模特用户评价 (~1.8MB)
  // Largest 4-group = hero, second 4-group = testimonials
  return {
    hero: fours[0]?.list || [],
    testimonials: fours[1]?.list || [],
    product: tens[0]?.list || [],
  };
}

let groups = { hero, product, testimonials };
if (hero.length !== 4 || product.length !== 10 || testimonials.length !== 4) {
  console.log("Chinese name match incomplete, using stem fallback", {
    hero: hero.length,
    product: product.length,
    testimonials: testimonials.length,
  });
  groups = fallbackGroups();
}

console.log("final counts", {
  hero: groups.hero.length,
  product: groups.product.length,
  testimonials: groups.testimonials.length,
});

function ensure(p) {
  fs.mkdirSync(p, { recursive: true });
}

ensure("D:/UMAXES/public/images/hero");
ensure("D:/UMAXES/public/images/product");
ensure("D:/UMAXES/public/images/testimonials");
ensure("D:/UMAXES/public/images/logo");

function copyGroup(list, destDir) {
  list.forEach((f, i) => {
    const n = String(i + 1).padStart(2, "0");
    fs.copyFileSync(path.join(src, f), path.join(destDir, `${n}.png`));
  });
}

copyGroup(groups.hero, "D:/UMAXES/public/images/hero");
copyGroup(groups.product, "D:/UMAXES/public/images/product");
copyGroup(groups.testimonials, "D:/UMAXES/public/images/testimonials");

const logoSrc = "D:/UMAXES/brand-guide/logo";
const logos = [
  ["umaxes-logo-orange-on-cream.png", "orange-on-cream.png"],
  ["umaxes-logo-cream-on-ink.png", "cream-on-ink.png"],
  ["umaxes-logo-cream-on-orange.png", "cream-on-orange.png"],
];
for (const [from, to] of logos) {
  const fromPath = path.join(logoSrc, from);
  if (fs.existsSync(fromPath)) {
    fs.copyFileSync(fromPath, path.join("D:/UMAXES/public/images/logo", to));
  }
}

console.log("copied", {
  hero: fs.readdirSync("D:/UMAXES/public/images/hero"),
  product: fs.readdirSync("D:/UMAXES/public/images/product"),
  testimonials: fs.readdirSync("D:/UMAXES/public/images/testimonials"),
  logo: fs.readdirSync("D:/UMAXES/public/images/logo"),
});
