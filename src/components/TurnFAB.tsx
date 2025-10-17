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
      className="fixed bottom-6 right-6 z-40 flex items-center justify-center gap-2 px-6 py-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 md:hidden"
      style={{
        background: "linear-gradient(45deg, #4CAF50 30%, #66BB6A 90%)",
      }}
    >
      <Disc3 className="h-5 w-5 text-white" />
      <span className="text-white font-bold text-sm">Your Turn!</span>

      {/* Pulsing ring animation */}
      <span className="absolute inset-0 rounded-full animate-ping opacity-30"
        style={{
          background: "linear-gradient(45deg, #4CAF50 30%, #66BB6A 90%)",
        }}
      />
    </Link>
  );
}
