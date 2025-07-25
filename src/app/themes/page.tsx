"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  IconButton,
  Paper,
  CircularProgress,
  LinearProgress,
  Avatar,
  AvatarGroup,
} from "@mui/material";
import {
  Event,
  MusicNote,
  People,
  TrendingUp,
  CalendarToday,
  Timer,
  Album as AlbumIcon,
  PlayArrow,
  ArrowForward,
  Schedule,
} from "@mui/icons-material";

interface Theme {
  _id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  albumCount: number;
  participantCount: number;
  participants: Array<{
    name: string;
    username: string;
    image?: string;
  }>;
}

interface ApiResponse {
  themes: Theme[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default function ThemesPage() {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchThemes();
  }, []);

  const fetchThemes = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/themes");
      if (!response.ok) {
        throw new Error("Failed to fetch themes");
      }
      const data: ApiResponse = await response.json();
      setThemes(data.themes || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      console.error("Error fetching themes:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getTimeRemaining = (endDate: string) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return "Ended";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days} days left`;
    return `${hours} hours left`;
  };

  const getProgress = (startDate: string, endDate: string) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    const total = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();

    return Math.max(0, Math.min(100, (elapsed / total) * 100));
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "background.default",
        }}
      >
        <Stack spacing={2} alignItems="center">
          <CircularProgress size={60} />
          <Typography variant="h6" color="text.secondary">
            Loading themes...
          </Typography>
        </Stack>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "background.default",
        }}
      >
        <Container maxWidth="md">
          <Stack spacing={4} alignItems="center" textAlign="center">
            <Event sx={{ fontSize: 80, color: "text.secondary" }} />
            <Typography variant="h4" fontWeight={700}>
              Unable to Load Themes
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {error}
            </Typography>
            <Button
              variant="contained"
              startIcon={<Event />}
              onClick={fetchThemes}
              size="large"
            >
              Try Again
            </Button>
          </Stack>
        </Container>
      </Box>
    );
  }

  const activeTheme = themes.find((theme) => theme.isActive);
  const pastThemes = themes.filter((theme) => !theme.isActive);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", pt: 10 }}>
      <Container maxWidth="lg">
        <Stack spacing={6}>
          {/* Header */}
          <Stack spacing={4} textAlign="center">
            <Typography variant="h2" fontWeight={900}>
              Music{" "}
              <Box component="span" color="primary.main">
                Themes
              </Box>
            </Typography>
            <Typography
              variant="h5"
              color="text.secondary"
              maxWidth={600}
              mx="auto"
            >
              Discover and participate in weekly music themes that bring our
              community together
            </Typography>
          </Stack>

          {/* Active Theme */}
          {activeTheme && (
            <Stack spacing={3}>
              <Typography variant="h4" fontWeight={700}>
                🔥 Current Theme
              </Typography>
              <Card
                sx={{
                  background:
                    "linear-gradient(135deg, rgba(244, 67, 54, 0.2), rgba(33, 150, 243, 0.2))",
                  border: "2px solid",
                  borderColor: "primary.main",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Progress Bar */}
                <LinearProgress
                  variant="determinate"
                  value={getProgress(
                    activeTheme.startDate,
                    activeTheme.endDate
                  )}
                  sx={{
                    height: 4,
                    bgcolor: "rgba(255,255,255,0.1)",
                    "& .MuiLinearProgress-bar": {
                      background: "linear-gradient(90deg, #f44336, #2196f3)",
                    },
                  }}
                />

                <CardContent sx={{ p: 4 }}>
                  <Stack spacing={3}>
                    <Stack
                      direction={{ xs: "column", md: "row" }}
                      spacing={3}
                      alignItems={{ md: "center" }}
                    >
                      <Box sx={{ flex: 1 }}>
                        <Stack spacing={2}>
                          <Typography variant="h3" fontWeight={900}>
                            {activeTheme.title}
                          </Typography>
                          <Typography variant="h6" color="text.secondary">
                            {activeTheme.description}
                          </Typography>
                        </Stack>
                      </Box>

                      <Stack
                        spacing={2}
                        alignItems={{ xs: "flex-start", md: "center" }}
                      >
                        <Chip
                          icon={<Timer />}
                          label={getTimeRemaining(activeTheme.endDate)}
                          color="error"
                          size="medium"
                          sx={{ fontWeight: 700, px: 2, py: 1 }}
                        />
                        <Button
                          variant="contained"
                          size="large"
                          startIcon={<PlayArrow />}
                          endIcon={<ArrowForward />}
                          sx={{ minWidth: 200 }}
                        >
                          Submit Album
                        </Button>
                      </Stack>
                    </Stack>

                    {/* Stats */}
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      spacing={3}
                      justifyContent="space-between"
                    >
                      <Stack direction="row" spacing={4}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <AlbumIcon color="primary" />
                          <Typography variant="body2" color="text.secondary">
                            <strong>{activeTheme.albumCount}</strong> albums
                            shared
                          </Typography>
                        </Stack>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <People color="primary" />
                          <Typography variant="body2" color="text.secondary">
                            <strong>{activeTheme.participantCount}</strong>{" "}
                            participants
                          </Typography>
                        </Stack>
                      </Stack>

                      <Stack direction="row" spacing={1} alignItems="center">
                        <CalendarToday sx={{ fontSize: 16 }} />
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(activeTheme.startDate)} -{" "}
                          {formatDate(activeTheme.endDate)}
                        </Typography>
                      </Stack>
                    </Stack>

                    {/* Participants */}
                    {activeTheme.participants &&
                      activeTheme.participants.length > 0 && (
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Typography variant="body2" color="text.secondary">
                            Active participants:
                          </Typography>
                          <AvatarGroup
                            max={8}
                            sx={{
                              "& .MuiAvatar-root": { width: 32, height: 32 },
                            }}
                          >
                            {activeTheme.participants.map(
                              (participant, index) => (
                                <Avatar
                                  key={index}
                                  src={participant.image}
                                  alt={participant.name}
                                  title={participant.name}
                                >
                                  {participant.name[0]?.toUpperCase()}
                                </Avatar>
                              )
                            )}
                          </AvatarGroup>
                        </Stack>
                      )}
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          )}

          {/* Past Themes */}
          {pastThemes.length > 0 && (
            <Stack spacing={3}>
              <Typography variant="h4" fontWeight={700}>
                📚 Past Themes
              </Typography>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, 1fr)",
                    md: "repeat(3, 1fr)",
                  },
                  gap: 3,
                }}
              >
                {pastThemes.map((theme) => (
                  <Card
                    key={theme._id}
                    sx={{
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: "0 12px 24px rgba(0,0,0,0.3)",
                      },
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Stack spacing={2}>
                        <Typography variant="h6" fontWeight={700}>
                          {theme.title}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          noWrap
                        >
                          {theme.description}
                        </Typography>

                        <Stack
                          direction="row"
                          spacing={2}
                          justifyContent="space-between"
                          alignItems="center"
                        >
                          <Stack direction="row" spacing={1}>
                            <Chip
                              icon={<AlbumIcon />}
                              label={theme.albumCount}
                              size="small"
                              variant="outlined"
                            />
                            <Chip
                              icon={<People />}
                              label={theme.participantCount}
                              size="small"
                              variant="outlined"
                            />
                          </Stack>

                          <IconButton size="small">
                            <ArrowForward sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Stack>

                        <Stack direction="row" spacing={1} alignItems="center">
                          <Schedule sx={{ fontSize: 14 }} />
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(theme.startDate)}
                          </Typography>
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </Stack>
          )}

          {/* No Themes */}
          {themes.length === 0 && (
            <Paper sx={{ p: 8, textAlign: "center" }}>
              <Stack spacing={3} alignItems="center">
                <Event sx={{ fontSize: 80, color: "text.secondary" }} />
                <Typography variant="h4" fontWeight={700}>
                  No Themes Yet
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Themes will appear here as they are created by the community.
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<Event />}
                  sx={{ mt: 2 }}
                >
                  Suggest a Theme
                </Button>
              </Stack>
            </Paper>
          )}
        </Stack>
      </Container>
    </Box>
  );
}
