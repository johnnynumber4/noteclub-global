"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
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
  IconButton,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  Add,
  MusicNote,
  Group as GroupIcon,
  PlayArrow,
  Share,
  Settings,
  ArrowBack,
  ContentCopy,
  PersonAdd,
  Schedule,
  Album as AlbumIcon,
} from "@mui/icons-material";

interface Group {
  _id: string;
  name: string;
  description?: string;
  inviteCode: string;
  memberCount: number;
  currentTurnUserId?: string;
  nextTurnUserId?: string;
  totalAlbumsShared: number;
  turnDurationDays: number;
  members: Array<{
    _id: string;
    name: string;
    username: string;
    image?: string;
  }>;
  admins: Array<{
    _id: string;
    name: string;
    username: string;
  }>;
}

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
}

export default function GroupDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const groupId = params.groupId as string;

  const [group, setGroup] = useState<Group | null>(null);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    } else if (status === "authenticated" && groupId) {
      fetchGroupData();
    }
  }, [status, router, groupId]);

  const fetchGroupData = async () => {
    try {
      setLoading(true);
      
      // Fetch group details
      const groupResponse = await fetch(`/api/groups/${groupId}`);
      if (groupResponse.ok) {
        const groupData = await groupResponse.json();
        setGroup(groupData.group);
      } else {
        setError("Group not found or access denied");
      }

      // Fetch group albums
      const albumsResponse = await fetch(`/api/albums?groupId=${groupId}`);
      if (albumsResponse.ok) {
        const albumsData = await albumsResponse.json();
        setAlbums(albumsData.albums || []);
      }
    } catch (error) {
      console.error("Error fetching group data:", error);
      setError("Failed to load group");
    } finally {
      setLoading(false);
    }
  };

  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setSuccess("Invite code copied!");
    setTimeout(() => setSuccess(""), 2000);
  };

  const isMyTurn = () => {
    return group?.currentTurnUserId === session?.user?.id;
  };

  const isAdmin = () => {
    return group?.admins.some(admin => admin._id === session?.user?.id);
  };

  if (status === "loading" || loading) {
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

  if (!session) return null;

  if (error) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "background.default", pt: 10, pb: 4 }}>
        <Container maxWidth="md">
          <Stack spacing={4} alignItems="center" textAlign="center">
            <Typography variant="h4" fontWeight={700}>
              Group Not Found
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {error}
            </Typography>
            <Button
              component={Link}
              href="/dashboard"
              variant="contained"
              startIcon={<ArrowBack />}
            >
              Back to Dashboard
            </Button>
          </Stack>
        </Container>
      </Box>
    );
  }

  if (!group) return null;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", pt: 10, pb: 4 }}>
      <Container maxWidth="lg">
        <Stack spacing={4}>
          {/* Header */}
          <Stack spacing={2}>
            <Button
              component={Link}
              href="/dashboard"
              variant="text"
              startIcon={<ArrowBack />}
              sx={{ alignSelf: "flex-start" }}
            >
              Back to Dashboard
            </Button>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", sm: "center" }}
              spacing={2}
            >
              <Stack spacing={1}>
                <Typography variant="h3" fontWeight={900}>
                  {group.name}
                </Typography>
                {group.description && (
                  <Typography variant="h6" color="text.secondary">
                    {group.description}
                  </Typography>
                )}
              </Stack>

              <Stack direction="row" spacing={2}>
                {isMyTurn() && (
                  <Button
                    component={Link}
                    href={`/post-album?groupId=${groupId}`}
                    variant="contained"
                    startIcon={<Add />}
                    color="success"
                  >
                    Share Album
                  </Button>
                )}
                <Button
                  variant="outlined"
                  startIcon={<ContentCopy />}
                  onClick={() => copyInviteCode(group.inviteCode)}
                >
                  Copy Invite
                </Button>
                {isAdmin() && (
                  <Button
                    variant="outlined"
                    startIcon={<Settings />}
                  >
                    Settings
                  </Button>
                )}
              </Stack>
            </Stack>
          </Stack>

          {/* Success/Error Messages */}
          {success && (
            <Alert severity="success" sx={{ borderRadius: 2 }}>
              {success}
            </Alert>
          )}

          {/* Group Info Cards */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Stack spacing={3}>
                    <Typography variant="h5" fontWeight={700}>
                      Current Turn
                    </Typography>
                    
                    {isMyTurn() ? (
                      <Paper sx={{ p: 3, bgcolor: "rgba(76, 175, 80, 0.1)", textAlign: "center" }}>
                        <Stack spacing={2}>
                          <Typography variant="h4" fontWeight={700} color="success.main">
                            🎵 It's Your Turn!
                          </Typography>
                          <Typography variant="body1" color="text.secondary">
                            Share an album with your group
                          </Typography>
                          <Button
                            component={Link}
                            href={`/post-album?groupId=${groupId}`}
                            variant="contained"
                            size="large"
                            startIcon={<Add />}
                            color="success"
                          >
                            Share Album Now
                          </Button>
                        </Stack>
                      </Paper>
                    ) : group.currentTurnUserId ? (
                      <Paper sx={{ p: 3, bgcolor: "rgba(33, 150, 243, 0.1)", textAlign: "center" }}>
                        <Stack spacing={2}>
                          <Typography variant="h5" fontWeight={700}>
                            Someone Else's Turn
                          </Typography>
                          <Typography variant="body1" color="text.secondary">
                            Waiting for the next album share...
                          </Typography>
                        </Stack>
                      </Paper>
                    ) : (
                      <Paper sx={{ p: 3, bgcolor: "rgba(255, 193, 7, 0.1)", textAlign: "center" }}>
                        <Stack spacing={2}>
                          <Typography variant="h5" fontWeight={700}>
                            Waiting for Members
                          </Typography>
                          <Typography variant="body1" color="text.secondary">
                            Invite more people to start sharing music!
                          </Typography>
                        </Stack>
                      </Paper>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Stack spacing={3}>
                {/* Group Stats */}
                <Card>
                  <CardContent>
                    <Stack spacing={2}>
                      <Typography variant="h6" fontWeight={700}>
                        Group Stats
                      </Typography>
                      <Stack spacing={1}>
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="body2" color="text.secondary">Members</Typography>
                          <Typography variant="body2" fontWeight={600}>{group.memberCount}</Typography>
                        </Stack>
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="body2" color="text.secondary">Albums Shared</Typography>
                          <Typography variant="body2" fontWeight={600}>{group.totalAlbumsShared}</Typography>
                        </Stack>
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="body2" color="text.secondary">Turn Duration</Typography>
                          <Typography variant="body2" fontWeight={600}>{group.turnDurationDays} days</Typography>
                        </Stack>
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="body2" color="text.secondary">Invite Code</Typography>
                          <Typography variant="body2" fontWeight={600} fontFamily="monospace">
                            {group.inviteCode}
                          </Typography>
                        </Stack>
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>

                {/* Members */}
                <Card>
                  <CardContent>
                    <Stack spacing={2}>
                      <Typography variant="h6" fontWeight={700}>
                        Members ({group.memberCount})
                      </Typography>
                      <Stack spacing={1}>
                        {group.members.map((member) => (
                          <Stack key={member._id} direction="row" spacing={2} alignItems="center">
                            <Avatar src={member?.image} sx={{ width: 32, height: 32 }}>
                              {member?.name?.[0] || '?'}
                            </Avatar>
                            <Stack flex={1}>
                              <Typography variant="body2" fontWeight={600}>
                                {member?.name || 'Unknown'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                @{member?.username || 'unknown'}
                              </Typography>
                            </Stack>
                            {group.admins.some(admin => admin._id === member._id) && (
                              <Chip label="Admin" size="small" color="primary" />
                            )}
                          </Stack>
                        ))}
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              </Stack>
            </Grid>
          </Grid>

          {/* Recent Albums */}
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Stack spacing={3}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography variant="h5" fontWeight={700}>
                    Recent Albums
                  </Typography>
                  <Button
                    component={Link}
                    href={`/groups/${group._id}/albums`}
                    endIcon={<PlayArrow />}
                    variant="outlined"
                  >
                    View All
                  </Button>
                </Stack>

                {albums.length === 0 ? (
                  <Paper sx={{ p: 6, textAlign: "center" }}>
                    <Stack spacing={3} alignItems="center">
                      <AlbumIcon sx={{ fontSize: 80, color: "text.secondary" }} />
                      <Typography variant="h5" fontWeight={700}>
                        No Albums Yet
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        Be the first to share an album with this group!
                      </Typography>
                      {isMyTurn() && (
                        <Button
                          component={Link}
                          href={`/post-album?groupId=${groupId}`}
                          variant="contained"
                          startIcon={<Add />}
                        >
                          Share First Album
                        </Button>
                      )}
                    </Stack>
                  </Paper>
                ) : (
                  <Grid container spacing={3}>
                    {albums.slice(0, 6).map((album) => (
                      <Grid item xs={12} sm={6} md={4} key={album._id}>
                        <Card
                          sx={{
                            cursor: "pointer",
                            transition: "all 0.3s ease",
                            "&:hover": {
                              transform: "translateY(-2px)",
                              boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                            },
                          }}
                        >
                          <Stack direction="row" spacing={2} p={2}>
                            {album.coverImageUrl ? (
                              <CardMedia
                                component="img"
                                sx={{ width: 60, height: 60, borderRadius: 1 }}
                                image={album.coverImageUrl}
                                alt={album.title}
                              />
                            ) : (
                              <Box
                                sx={{
                                  width: 60,
                                  height: 60,
                                  bgcolor: "grey.300",
                                  borderRadius: 1,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <MusicNote />
                              </Box>
                            )}

                            <Stack spacing={0.5} flex={1} minWidth={0}>
                              <Typography variant="subtitle2" fontWeight={600} noWrap>
                                {album.title}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" noWrap>
                                {album.artist}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" noWrap>
                                by {album.postedBy?.name || 'Unknown'}
                              </Typography>
                            </Stack>
                          </Stack>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </Container>
    </Box>
  );
}