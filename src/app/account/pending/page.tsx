import { redirect } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { auth, signOut } from "@/lib/auth";

export const metadata = {
  title: "Pending approval · UMAXES",
};

export default async function PendingPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/account/pending");
  if (session.user.status === "APPROVED") redirect("/account");

  return (
    <>
      <Header />
      <main className="flex-1 px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-lg">
          <p className="font-display text-xs font-semibold tracking-[0.18em] text-umx-orange uppercase">
            Under review
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">
            Account pending approval
          </h1>
          <p className="mt-4 font-body text-black">
            Thanks for registering
            {session.user.name ? `, ${session.user.name}` : ""}. An administrator
            will review your company and assign your wholesale level before you
            can place orders.
          </p>
          <form
            className="mt-10"
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="border border-black/20 px-5 py-3 font-display text-sm font-semibold transition hover:border-umx-orange hover:text-umx-orange"
            >
              Sign out
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </>
  );
}
