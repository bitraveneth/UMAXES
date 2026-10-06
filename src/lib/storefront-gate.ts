import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getSiteSettings, isStaffRole } from "@/lib/site-settings";

/**
 * When maintenance mode is on, send non-staff visitors to /maintenance.
 * Staff (and already-authenticated ops) keep working.
 */
export async function enforceStorefrontAccess() {
  const settings = await getSiteSettings();
  if (!settings.maintenanceMode) return settings;

  const session = await auth();
  if (session?.user && isStaffRole(session.user.role)) return settings;

  redirect("/maintenance");
}
