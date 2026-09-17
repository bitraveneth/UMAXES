/** Paths guests may open without an account. */
export function needsMemberLogin(href: string) {
  const path = href.split("?")[0].split("#")[0] || "/";
  if (path === "/") return true;
  if (
    path === "/shop" ||
    path.startsWith("/shop/") ||
    path === "/products" ||
    path === "/maxcore" ||
    path === "/news" ||
    path.startsWith("/news/") ||
    path === "/cart" ||
    path.startsWith("/cart/") ||
    path === "/checkout" ||
    path.startsWith("/checkout/") ||
    path === "/about"
  ) {
    return true;
  }
  if (path === "/product" || path.startsWith("/product/")) return true;
  if (path.startsWith("/blog/")) return true;
  return false;
}
