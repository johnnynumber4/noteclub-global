"use client";

import { useTurnStatus } from "@/hooks/useTurnStatus";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Disc3 } from "lucide-react";

export function TurnFAB() {
  const { data: session } = useSession();
  const { isMyTurn } = useTurnStatus();

  // Only show FAB when authenticated and it's the user's turn
  if (!session || !isMyTurn) {
    return null;
  }

  return (
    <Link
      href="/post-album"
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 flex items-center justify-center gap-2 px-4 py-3 sm:px-6 sm:py-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 md:hidden"
      style={{
        background: "linear-gradient(45deg, #4CAF50 30%, #66BB6A 90%)",
      }}
    >
      <Disc3 className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
      <span className="text-white font-bold text-xs sm:text-sm">Your Turn!</span>

      {/* Pulsing ring animation */}
      <span className="absolute inset-0 rounded-full animate-ping opacity-30"
        style={{
          background: "linear-gradient(45deg, #4CAF50 30%, #66BB6A 90%)",
        }}
      />
    </Link>
  );
}
