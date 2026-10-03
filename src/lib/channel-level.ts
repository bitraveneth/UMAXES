export function isChannelBuyerLevel(level?: string | null) {
  return level === "WHOLESALER" || level === "DISTRO";
}
