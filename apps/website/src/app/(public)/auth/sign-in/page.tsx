import { Suspense } from "react";
import { SignInForm } from "./SignInForm";

export default function SignInPage() {
  return (
    <div className="container mx-auto max-w-md px-6 py-20">
      <div className="rounded-2xl border border-border/40 bg-card/40 p-8 flex flex-col gap-5">
        <h1 className="text-2xl font-medium">Sign in</h1>
        <Suspense fallback={<div className="h-32" />}>
          <SignInForm />
        </Suspense>
      </div>
    </div>
  );
}
