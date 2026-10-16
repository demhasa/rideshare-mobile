"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ndryshoOren } from "@/lib/lejet";

export async function ruajOren(formData: FormData) {
  const idValue = formData.get("id");
  const oraValue = formData.get("ora");
  const id = typeof idValue === "string" ? idValue : "";
  const ora = typeof oraValue === "string" ? oraValue : "";

  let result: "hyr" | "ndaluar" | "fushe" | "ruajtur" | "databaza";
  try {
    result = await ndryshoOren(id, ora);
  } catch (error) {
    console.error("Nuk u ndryshua ora e udhëtimit në Neon.", error);
    result = "databaza";
  }

  if (result === "ruajtur") {
    revalidatePath("/");
    revalidatePath("/udhetimi/2");
  }

  redirect(`/panel?m=${encodeURIComponent(result)}`);
}
