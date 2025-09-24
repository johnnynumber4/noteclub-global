import {
  Box,
  Container,
  Typography,
  Button,
  Stack,
  Paper,
} from "@mui/material";
import { CloudOff, Refresh, MusicNote } from "@mui/icons-material";

export default function OfflinePage() {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
        p: 2,
      }}
    >
      <Container maxWidth="sm">
        <Paper sx={{ p: 6, textAlign: "center" }}>
          <Stack spacing={4} alignItems="center">
            <Box
              sx={{
                width: 120,
                height: 120,
                borderRadius: "50%",
                bgcolor: "rgba(244, 67, 54, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CloudOff sx={{ fontSize: 60, color: "error.main" }} />
            </Box>

            <Stack spacing={2} textAlign="center">
              <Typography variant="h3" fontWeight={900}>
                You&apos;re Offline
              </Typography>
              <Typography variant="h6" color="text.secondary">
                Check your internet connection and try again
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Don&apos;t worry - your music will be waiting when you&apos;re
                back online!
              </Typography>
            </Stack>

            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                startIcon={<Refresh />}
                onClick={handleRefresh}
                size="large"
              >
                Try Again
              </Button>
              <Button
                variant="outlined"
                startIcon={<MusicNote />}
                href="/dashboard"
                size="large"
              >
                Go to Dashboard
              </Button>
            </Stack>

            <Typography variant="caption" color="text.secondary">
              Note Club works best with an internet connection for discovering
              new music
            </Typography>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
