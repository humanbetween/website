"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

export function CheckoutCancelToast() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    if (params.get("checkout") !== "cancel") return;
    toast("Payment cancelled — no charge.");
    router.replace("/pricing", { scroll: false });
  }, [params, router]);

  return null;
}
