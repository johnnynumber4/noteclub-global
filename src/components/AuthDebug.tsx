"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Stack,
  Chip,
} from "@mui/material";
import {
  CheckCircle,
  Error,
  Info,
  Refresh,
} from "@mui/icons-material";

export default function AuthDebug() {
  const { data: session, status } = useSession();
  const [debugData, setDebugData] = useState<any>(null);

  const runDebug = async () => {
    try {
      const response = await fetch("/api/auth-debug");
      const data = await response.json();
      setDebugData(data);
      console.log("🔍 Auth Debug Data:", data);
    } catch (error) {
      console.error("🔍 Auth Debug Error:", error);
    }
  };

  useEffect(() => {
    runDebug();
  }, [status]);

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <Paper
      sx={{
        position: "fixed",
        bottom: 16,
        right: 16,
        p: 2,
        maxWidth: 300,
        bgcolor: "rgba(0, 0, 0, 0.8)",
        color: "white",
        fontSize: "0.75rem",
        zIndex: 1000,
      }}
    >
      <Stack spacing={1}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="caption" fontWeight={700}>
            Auth Debug
          </Typography>
          <Button size="small" onClick={runDebug} startIcon={<Refresh />}>
            Refresh
          </Button>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center">
          <Chip
            icon={status === "authenticated" ? <CheckCircle /> : <Error />}
            label={`Client: ${status}`}
            size="small"
            color={status === "authenticated" ? "success" : "error"}
          />
        </Stack>

        {session && (
          <Box>
            <Typography variant="caption">Session:</Typography>
            <Typography variant="caption" sx={{ fontFamily: "monospace", display: "block" }}>
              ID: {session.user?.id?.slice(0, 8)}...
            </Typography>
            <Typography variant="caption" sx={{ fontFamily: "monospace", display: "block" }}>
              Email: {session.user?.email}
            </Typography>
          </Box>
        )}

        {debugData && (
          <Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip
                icon={debugData.hasSession ? <CheckCircle /> : <Error />}
                label={`Server: ${debugData.hasSession ? "Yes" : "No"}`}
                size="small"
                color={debugData.hasSession ? "success" : "error"}
              />
              <Chip
                icon={debugData.hasSessionToken ? <CheckCircle /> : <Error />}
                label={`Token: ${debugData.hasSessionToken ? "Yes" : "No"}`}
                size="small"
                color={debugData.hasSessionToken ? "success" : "error"}
              />
            </Stack>
            
            <Typography variant="caption" sx={{ display: "block", mt: 1 }}>
              Cookies: {debugData.cookies?.length || 0}
            </Typography>
          </Box>
        )}
      </Stack>
    </Paper>
  );
}