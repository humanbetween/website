"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";
import { authClient } from "@/lib/auth-client";
import { PaywallModal } from "./PaywallModal";

const FREE_LIMIT = 3;
const STORAGE_KEY = "hp_free_copies";

type FreeCopyContextValue = {
  /**
   * Call right before copying a free prompt. Returns true if the copy is
   * allowed (and consumes one credit for anonymous users); returns false and
   * opens the paywall when the limit is reached.
   */
  tryConsume: () => boolean;
};

const FreeCopyContext = createContext<FreeCopyContextValue>({
  tryConsume: () => true,
});

export function useFreeCopy() {
  return useContext(FreeCopyContext);
}

export function FreeCopyProvider({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = authClient.useSession();
  const [paywallOpen, setPaywallOpen] = useState(false);

  const tryConsume = useCallback(() => {
    // Signed-in users (free or paid) copy without limit; while the session is
    // still loading, don't penalize them.
    if (isPending || session?.user) return true;

    let count = 0;
    try {
      count = Number.parseInt(localStorage.getItem(STORAGE_KEY) ?? "0", 10) || 0;
    } catch {
      /* storage blocked — treat as 0 */
    }
    if (count >= FREE_LIMIT) {
      setPaywallOpen(true);
      return false;
    }
    try {
      localStorage.setItem(STORAGE_KEY, String(count + 1));
    } catch {
      /* ignore */
    }
    return true;
  }, [isPending, session?.user]);

  return (
    <FreeCopyContext.Provider value={{ tryConsume }}>
      {children}
      <PaywallModal open={paywallOpen} onOpenChange={setPaywallOpen} />
    </FreeCopyContext.Provider>
  );
}
