"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  CardMedia,
  Stack,
  Avatar,
  Chip,
  Grid,
  Paper,
  CircularProgress,
  Alert,
} from "@mui/material";
import { MusicNote, PlayArrow, Schedule } from "@mui/icons-material";

interface Album {
  _id: string;
  title: string;
  artist: string;
  coverImageUrl?: string;
  postedBy: {
    name: string;
    username: string;
  };
  postedAt: string;
  group: {
    name: string;
  };
}

interface TurnStatus {
  isMyTurn: boolean;
  currentTurnUser: {
    _id: string;
    name: string;
    username: string;
    image?: string;
  };
  nextTurnUser: {
    _id: string;
    name: string;
    username: string;
    image?: string;
  };
  currentTurnIndex: number;
  totalMembers: number;
  turnOrder: Array<{
    _id: string;
    name: string;
    username: string;
    image?: string;
  }>;
  groupName: string;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [recentAlbums, setRecentAlbums] = useState<Album[]>([]);
  const [currentAlbum, setCurrentAlbum] = useState<Album | null>(null);
  const [turnStatus, setTurnStatus] = useState<TurnStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    } else if (status === "authenticated") {
      fetchDashboardData();
    }
  }, [status, router]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch turn status (replaces groups functionality)
      const turnResponse = await fetch("/api/turn-status");
      if (turnResponse.ok) {
        const turnData = await turnResponse.json();
        // Validate the data structure before setting state
        if (turnData && typeof turnData === "object") {
          setTurnStatus(turnData);
        } else {
          console.error("Invalid turn status data:", turnData);
        }
      }

      // Fetch recent albums
      const albumsResponse = await fetch("/api/albums?limit=6");
      if (albumsResponse.ok) {
        const albumsData = await albumsResponse.json();
        setRecentAlbums(albumsData.albums || []);

        // Set current album as the most recent
        if (albumsData.albums && albumsData.albums.length > 0) {
          setCurrentAlbum(albumsData.albums[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading || !session?.user) {
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
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (!session?.user?.name) return null;

  return (
    <Box
      sx={{ minHeight: "100vh", bgcolor: "background.default", pt: 10, pb: 4 }}
    >
      <Container maxWidth="lg">
        <Stack spacing={6}>
          {/* Header */}
          <Stack spacing={1}>
            <Typography variant="h3" fontWeight={900}>
              Hey, {session?.user?.name?.split(" ")[0] || "there"}! 👋
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Ready to share some music?
            </Typography>
          </Stack>

          {/* Success/Error Messages */}
          {success && (
            <Alert severity="success" sx={{ borderRadius: 2 }}>
              {success}
            </Alert>
          )}
          {error && (
            <Alert
              severity="error"
              sx={{ borderRadius: 2 }}
              onClose={() => setError("")}
            >
              {error}
            </Alert>
          )}

          {/* Latest Album Hero - FIRST */}
          {currentAlbum && (
            <Paper
              elevation={0}
              sx={{
                p: { xs: 3, md: 5 },
                background: "linear-gradient(135deg, rgba(33, 150, 243, 0.08), rgba(244, 67, 54, 0.08))",
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 3,
              }}
            >
              <Stack spacing={3}>
                <Typography variant="overline" fontWeight={700} color="text.secondary">
                  Latest Pick
                </Typography>

                <Grid container spacing={4} alignItems="center">
                  <Grid size={{ xs: 12, md: 4 }}>
                    {currentAlbum.coverImageUrl ? (
                      <Box
                        sx={{
                          width: "100%",
                          paddingTop: "100%",
                          position: "relative",
                          borderRadius: 2,
                          overflow: "hidden",
                          boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
                        }}
                      >
                        <CardMedia
                          component="img"
                          image={currentAlbum.coverImageUrl}
                          alt={currentAlbum.title}
                          sx={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      </Box>
                    ) : (
                      <Box
                        sx={{
                          width: "100%",
                          paddingTop: "100%",
                          position: "relative",
                          borderRadius: 2,
                          bgcolor: "action.hover",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <MusicNote sx={{ fontSize: 80, color: "text.secondary" }} />
                      </Box>
                    )}
                  </Grid>

                  <Grid size={{ xs: 12, md: 8 }}>
                    <Stack spacing={3}>
                      <Stack spacing={1.5}>
                        <Typography variant="h3" fontWeight={900}>
                          {currentAlbum.title}
                        </Typography>
                        <Typography variant="h5" color="text.secondary" fontWeight={500}>
                          {currentAlbum.artist}
                        </Typography>
                        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                          <Chip
                            avatar={<Avatar>{currentAlbum.postedBy?.name?.[0] || "?"}</Avatar>}
                            label={currentAlbum.postedBy?.name || "Unknown"}
                            variant="outlined"
                          />
                          <Typography variant="body2" color="text.secondary">
                            •
                          </Typography>
                          <Chip
                            label={currentAlbum.group?.name || "Unknown Group"}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        </Stack>
                      </Stack>

                      <Button
                        variant="contained"
                        size="large"
                        component={Link}
                        href={`/albums/${currentAlbum._id}`}
                        endIcon={<PlayArrow />}
                        sx={{ width: "fit-content" }}
                      >
                        Listen & Discuss
                      </Button>
                    </Stack>
                  </Grid>
                </Grid>
              </Stack>
            </Paper>
          )}

          {/* Your Turn CTA - SECOND (only if it's your turn) */}
          {turnStatus?.isMyTurn && (
            <Paper
              elevation={0}
              sx={{
                p: 4,
                background: "linear-gradient(135deg, rgba(244, 67, 54, 0.1), rgba(33, 150, 243, 0.1))",
                border: "2px solid",
                borderColor: "primary.main",
                borderRadius: 3,
              }}
            >
              <Stack spacing={3} alignItems="center" textAlign="center">
                <Stack spacing={2} alignItems="center">
                  <Box
                    sx={{
                      width: 64,
                      height: 64,
                      borderRadius: "50%",
                      bgcolor: "primary.main",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <MusicNote sx={{ fontSize: 32, color: "white" }} />
                  </Box>
                  <Typography variant="h4" fontWeight={900}>
                    It's Your Turn! 🎵
                  </Typography>
                  <Typography variant="body1" color="text.secondary" maxWidth={600}>
                    Choose an amazing album to share with the community
                  </Typography>
                </Stack>

                <Button
                  variant="contained"
                  size="large"
                  startIcon={<MusicNote />}
                  component={Link}
                  href="/post-album"
                  sx={{
                    px: 4,
                    py: 1.5,
                    fontSize: "1.1rem",
                    background: "linear-gradient(45deg, #f44336 30%, #2196f3 90%)",
                    "&:hover": {
                      background: "linear-gradient(45deg, #d32f2f 30%, #1976d2 90%)",
                    },
                  }}
                >
                  Share Your Pick
                </Button>
              </Stack>
            </Paper>
          )}

          {/* Turn Status - THIRD (minimalist when not your turn) */}
          {turnStatus && !turnStatus.isMyTurn && (
            <Paper
              elevation={0}
              sx={{
                p: 3,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2,
              }}
            >
              <Stack spacing={2.5}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Schedule sx={{ fontSize: 28, color: "text.secondary" }} />
                  <Stack spacing={0.5}>
                    <Typography variant="h6" fontWeight={700}>
                      {turnStatus.currentTurnUser?.name || "Unknown User"}'s Turn
                    </Typography>
                    {turnStatus.nextTurnUser?.name && (
                      <Typography variant="body2" color="text.secondary">
                        Up next: <strong>{turnStatus.nextTurnUser.name}</strong>
                      </Typography>
                    )}
                  </Stack>
                </Stack>

                {/* Turn Order - Collapsed */}
                {turnStatus.turnOrder && Array.isArray(turnStatus.turnOrder) && turnStatus.turnOrder.length > 0 && (
                  <Stack spacing={1.5}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase">
                      Turn Order
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      {turnStatus.turnOrder
                        .filter((user: any) => user && user._id)
                        .map((user: any, index: number) => (
                          <Chip
                            key={user._id}
                            avatar={<Avatar src={user?.image} sx={{ width: 24, height: 24 }}>{user?.name?.[0] || "?"}</Avatar>}
                            label={user?.name || "Unknown User"}
                            variant={index === turnStatus.currentTurnIndex ? "filled" : "outlined"}
                            color={index === turnStatus.currentTurnIndex ? "primary" : "default"}
                            size="small"
                          />
                        ))}
                    </Stack>
                  </Stack>
                )}

                <Button
                  variant="text"
                  size="small"
                  startIcon={<MusicNote />}
                  component={Link}
                  href="/post-album?override=true"
                  sx={{ width: "fit-content", color: "text.secondary" }}
                >
                  Post out of turn
                </Button>
              </Stack>
            </Paper>
          )}

          {/* Recent Albums */}
          {recentAlbums.length > 0 && (
            <Stack spacing={3}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography variant="h4" fontWeight={700}>
                  Recent Albums
                </Typography>
                <Button
                  component={Link}
                  href="/albums"
                  endIcon={<PlayArrow />}
                  variant="outlined"
                >
                  View All
                </Button>
              </Stack>

              <Grid container spacing={3}>
                {recentAlbums.slice(0, 6).map((album) => (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={album._id}>
                    <Card
                      sx={{
                        height: "100%",
                        cursor: "pointer",
                        transition: "all 0.3s ease",
                        border: "none",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                        "&:hover": {
                          transform: "translateY(-4px)",
                          boxShadow: "0 8px 16px rgba(0,0,0,0.2)",
                        },
                      }}
                      component={Link}
                      href={`/albums/${album._id}`}
                    >
                      {album.coverImageUrl && (
                        <CardMedia
                          component="img"
                          height="200"
                          image={album.coverImageUrl}
                          alt={album.title}
                        />
                      )}
                      <CardContent>
                        <Typography variant="h6" fontWeight={700} noWrap>
                          {album.title}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          noWrap
                        >
                          {album.artist}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          by {album.postedBy?.name || "Unknown"} •{" "}
                          {album.group?.name || "Unknown Group"}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Stack>
          )}
        </Stack>
      </Container>

      {/* Group creation/join dialogs - Hidden for single group mode 
      <Dialog open={createGroupOpen} onClose={() => setCreateGroupOpen(false)}>
        // dialog content
      </Dialog>
      */}
    </Box>
  );
}
