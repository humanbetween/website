import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Mail, Sparkles } from "lucide-react";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function CheckoutWelcomePage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (session) {
    redirect("/account?checkout=success");
  }

  return (
    <div className="container mx-auto max-w-xl px-6 py-24">
      <div className="rounded-2xl border border-border/40 bg-card/40 p-8 sm:p-10 flex flex-col gap-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-sky-400 via-cyan-400 to-emerald-400 flex items-center justify-center text-slate-900">
            <Sparkles className="h-5 w-5" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-medium tracking-tight">
            Thanks for joining Human Between.
          </h1>
          <p className="text-sm text-muted-foreground max-w-md">
            Your payment is confirmed. We just sent a sign-in link to the email
            you used at checkout.
          </p>
        </div>

        <div className="rounded-xl border border-dashed border-border/60 px-4 py-4 flex items-start gap-3">
          <Mail className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
          <div className="text-sm">
            <p className="font-medium">Check your inbox</p>
            <p className="text-muted-foreground mt-1">
              Open the email titled <em>“Sign in to Human Between”</em> and
              click the button. The link is valid for 5 minutes.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 text-xs text-muted-foreground">
          <p>
            Don’t see it? Check spam / promotions, and make sure the email
            address you entered at checkout was correct.
          </p>
          <p>
            Still stuck?{" "}
            <a
              href="mailto:hello@humanprompts.ai"
              className="underline hover:text-foreground"
            >
              hello@humanprompts.ai
            </a>{" "}
            — we’ll get you in.
          </p>
        </div>

        <Link
          href="/auth/sign-in"
          className="text-xs text-muted-foreground hover:text-foreground self-center underline"
        >
          Or request a new sign-in link
        </Link>
      </div>
    </div>
  );
}
