import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// Java 10: kërkesa nuk është më simulim; ruhet në Neon nga faqja e detajeve.
export default async function Kerkesa({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/udhetimi/${encodeURIComponent(id)}#kerkesa`);
}
