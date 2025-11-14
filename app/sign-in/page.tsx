// app/sign-in/page.tsx
import { redirect } from "next/navigation";

export default function SignInPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const rawNext = searchParams?.next;
  const next =
    typeof rawNext === "string" && rawNext.length > 0
      ? rawNext
      : "/upload-test";

  // always forward to the real Supabase sign-in
  redirect(`/auth/sign-in?next=${encodeURIComponent(next)}`);
}
