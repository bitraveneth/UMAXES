"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function updateBuyerProfile(input: {
  name: string;
  email: string;
  phone: string;
  jobTitle: string;
  image: string | null;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "CUSTOMER") {
    throw new Error("Unauthorized");
  }
  if (session.user.status !== "APPROVED") {
    throw new Error("Account not approved");
  }

  const name = input.name.trim();
  const email = input.email.trim().toLowerCase() || null;
  const phone = input.phone.trim() || null;
  const jobTitle = input.jobTitle.trim() || null;

  if (!name) throw new Error("Name is required");
  if (!email && !phone) throw new Error("Email or phone is required");

  if (email) {
    const taken = await prisma.user.findFirst({
      where: { email, id: { not: session.user.id } },
      select: { id: true },
    });
    if (taken) throw new Error("Email already in use");
  }
  if (phone) {
    const taken = await prisma.user.findFirst({
      where: { phone, id: { not: session.user.id } },
      select: { id: true },
    });
    if (taken) throw new Error("Phone already in use");
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name,
      email,
      phone,
      jobTitle,
      image: input.image || null,
    },
  });

  revalidatePath("/account");
  revalidatePath("/account/profile");
}
