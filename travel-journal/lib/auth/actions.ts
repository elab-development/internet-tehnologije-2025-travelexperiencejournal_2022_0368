"use server";

import { signIn, signOut } from "next-auth/react";
import { redirect } from "next/navigation";

export async function loginAction(email: string, password: string) {
  try {
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      return { error: result.error };
    }

    return { success: true };
  } catch (error) {
    return { error: "Greška pri prijavljivanju" };
  }
}

export async function logoutAction() {
  await signOut({ redirect: false });
  redirect("/login");
}