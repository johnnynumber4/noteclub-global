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
        <Stack spacing={4}>
          {/* Header */}
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems="center"
            spacing={2}
          >
            <Stack spacing={1}>
              <Typography variant="h3" fontWeight={900}>
                Hey, {session?.user?.name?.split(" ")[0] || "there"}! 👋
              </Typography>
              <Typography variant="h6" color="text.secondary">
                Ready to share some music?
              </Typography>
            </Stack>

            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                component={Link}
                href="/groups"
                startIcon={<MusicNote />}
              >
                Manage Groups
              </Button>
            </Stack>
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

          {/* Your Turn Section */}
          <Stack spacing={3}>
            <Typography variant="h4" fontWeight={700}>
              Your Turn Status
            </Typography>

            {turnStatus ? (
              <Paper
                sx={{
                  p: 4,
                  background: turnStatus.isMyTurn
                    ? "linear-gradient(135deg, rgba(244, 67, 54, 0.1), rgba(33, 150, 243, 0.1))"
                    : "background.paper",
                  border: turnStatus.isMyTurn ? "2px solid" : "1px solid",
                  borderColor: turnStatus.isMyTurn ? "primary.main" : "divider",
                }}
              >
                <Stack spacing={3}>
                  {turnStatus.isMyTurn ? (
                    <>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <PlayArrow
                          sx={{ fontSize: 40, color: "primary.main" }}
                        />
                        <Typography
                          variant="h5"
                          fontWeight={700}
                          color="primary"
                        >
                          Your Turn 🎵
                        </Typography>
                      </Stack>
                      <Typography variant="body1" color="text.secondary">
                        Choose an amazing album to share with the NoteClub
                        community!
                      </Typography>
                      <Button
                        variant="contained"
                        size="large"
                        startIcon={<MusicNote />}
                        component={Link}
                        href="/post-album"
                        sx={{
                          background:
                            "linear-gradient(45deg, #f44336 30%, #2196f3 90%)",
                          "&:hover": {
                            background:
                              "linear-gradient(45deg, #d32f2f 30%, #1976d2 90%)",
                          },
                          width: "fit-content",
                        }}
                      >
                        Post Your Album
                      </Button>
                    </>
                  ) : (
                    <>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Schedule
                          sx={{ fontSize: 40, color: "text.secondary" }}
                        />
                        <Typography variant="h5" fontWeight={700}>
                          {turnStatus.currentTurnUser?.name || "Unknown User"}&rsquo;s Turn
                        </Typography>
                      </Stack>
                      <Typography variant="body1" color="text.secondary">
                        {turnStatus.nextTurnUser?.name && (
                          <>
                            Up next:{" "}
                            <strong>{turnStatus.nextTurnUser?.name}</strong>
                          </>
                        )}
                      </Typography>

                      <Button
                        variant="outlined"
                        size="medium"
                        startIcon={<MusicNote />}
                        component={Link}
                        href="/post-album?override=true"
                        sx={{
                          width: "fit-content",
                          mt: 2,
                          borderColor: "primary.main",
                          color: "primary.main",
                          "&:hover": {
                            backgroundColor: "primary.main",
                            color: "white",
                          },
                        }}
                      >
                        Did you need to Post out of turn?
                      </Button>
                    </>
                  )}

                  {/* Turn Order Display */}
                  {turnStatus.turnOrder &&
                    Array.isArray(turnStatus.turnOrder) &&
                    turnStatus.turnOrder.length > 0 && (
                      <Box>
                        <Typography variant="h6" gutterBottom>
                          Turn Order (Alphabetical)
                        </Typography>
                        <Stack
                          direction="row"
                          spacing={1}
                          flexWrap="wrap"
                          useFlexGap
                        >
                          {turnStatus.turnOrder
                            .filter((user: any) => user && user._id)
                            .map((user: any, index: number) => (
                              <Chip
                                key={user._id}
                                avatar={
                                  <Avatar src={user?.image}>
                                    {user?.name?.[0] || "?"}
                                  </Avatar>
                                }
                                label={user?.name || "Unknown User"}
                                variant={
                                  index === turnStatus.currentTurnIndex
                                    ? "filled"
                                    : "outlined"
                                }
                                color={
                                  index === turnStatus.currentTurnIndex
                                    ? "primary"
                                    : "default"
                                }
                                size="small"
                              />
                            ))}
                        </Stack>
                      </Box>
                    )}
                </Stack>
              </Paper>
            ) : (
              <Paper sx={{ p: 6, textAlign: "center" }}>
                <CircularProgress />
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ mt: 2 }}
                >
                  Loading turn status...
                </Typography>
              </Paper>
            )}
          </Stack>

          {/* Current Album */}
          {currentAlbum && (
            <Stack spacing={3}>
              <Typography variant="h4" fontWeight={700}>
                Current Album Pick
              </Typography>

              <Paper
                sx={{
                  p: 4,
                  background:
                    "linear-gradient(135deg, rgba(33, 150, 243, 0.05), rgba(244, 67, 54, 0.05))",
                }}
              >
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  spacing={3}
                  alignItems="center"
                >
                  {currentAlbum.coverImageUrl && (
                    <Box
                      sx={{
                        width: { xs: 200, md: 150 },
                        height: { xs: 200, md: 150 },
                        borderRadius: 2,
                        overflow: "hidden",
                        flexShrink: 0,
                      }}
                    >
                      <CardMedia
                        component="img"
                        sx={{ width: "100%", height: "100%" }}
                        image={currentAlbum.coverImageUrl}
                        alt={currentAlbum.title}
                      />
                    </Box>
                  )}

                  <Stack spacing={2} flex={1}>
                    <Stack spacing={1}>
                      <Typography variant="h5" fontWeight={700}>
                        {currentAlbum.title}
                      </Typography>
                      <Typography variant="h6" color="text.secondary">
                        {currentAlbum.artist}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Latest pick by{" "}
                        {currentAlbum.postedBy?.name || "Unknown"} •{" "}
                        {currentAlbum.group?.name || "Unknown Group"}
                      </Typography>
                    </Stack>

                    <Button
                      variant="outlined"
                      size="small"
                      component={Link}
                      href={`/albums/${currentAlbum._id}`}
                      sx={{ width: "fit-content" }}
                    >
                      View Details
                    </Button>
                  </Stack>
                </Stack>
              </Paper>
            </Stack>
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
