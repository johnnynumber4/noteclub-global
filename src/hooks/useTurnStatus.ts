"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface TurnUser {
  _id: string;
  name: string;
  username: string;
  image?: string;
}

interface TurnStatus {
  isMyTurn: boolean;
  currentTurnUser: TurnUser | null;
  nextTurnUser: TurnUser | null;
  currentTurnIndex: number;
  totalMembers: number;
  turnOrder: TurnUser[];
  groupName: string;
}

export function useTurnStatus() {
  const { data: session, status } = useSession();
  const [turnStatus, setTurnStatus] = useState<TurnStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTurnStatus = async () => {
      if (status !== "authenticated") {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/turn-status");
        if (response.ok) {
          const data = await response.json();
          setTurnStatus(data);
          setError(null);
        } else {
          setError("Failed to fetch turn status");
        }
      } catch (err) {
        console.error("Error fetching turn status:", err);
        setError("Failed to fetch turn status");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTurnStatus();

    // Refresh turn status every 30 seconds
    const interval = setInterval(fetchTurnStatus, 30000);

    return () => clearInterval(interval);
  }, [status, session]);

  return {
    turnStatus,
    isLoading,
    error,
    isMyTurn: turnStatus?.isMyTurn || false,
  };
}
