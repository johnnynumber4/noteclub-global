"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Box,
  Container,
  Typography,
  Avatar,
  Stack,
  Card,
  CardContent,
  Chip,
  Button,
  Grid,
  Paper,
  Divider,
  IconButton,
  CircularProgress,
  LinearProgress,
} from "@mui/material";
import {
  Person,
  LocationOn,
  CalendarToday,
  MusicNote,
  Album as AlbumIcon,
  Favorite,
  Comment,
  Edit,
  Share,
  Email,
  OpenInNew,
  Verified,
  Star,
} from "@mui/icons-material";
import { useSession } from "next-auth/react";

interface UserProfile {
  _id: string;
  name: string;
  username: string;
  email?: string;
  image?: string;
  bio?: string;
  location?: string;
  favoriteGenres: string[];
  musicPlatforms: {
    spotify?: string;
    youtubeMusic?: string;
    appleMusic?: string;
    tidal?: string;
    deezer?: string;
  };
  joinedAt: string;
  lastActive: string;
  isVerified: boolean;
  role: string;
  albums: Album[];
  stats: {
    albumsPosted: number;
    likesReceived: number;
    commentsReceived: number;
    profileCompletion: number;
  };
  isOwnProfile: boolean;
}

interface Album {
  _id: string;
  title: string;
  artist: string;
  year?: number;
  coverImageUrl?: string;
  theme: {
    title: string;
  };
  postedAt: string;
  likeCount: number;
  commentCount: number;
}

export default function ProfilePage() {
  const params = useParams();
  const userId = params.userId as string;
  const { data: session } = useSession();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/users/${userId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch profile");
      }
      const data = await response.json();
      setProfile(data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      console.error("Error fetching profile:", err);
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

  const handleAlbumClick = (albumId: string) => {
    window.location.href = `/albums/${albumId}`;
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
            Loading profile...
          </Typography>
        </Stack>
      </Box>
    );
  }

  if (error || !profile) {
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
            <Person sx={{ fontSize: 80, color: "text.secondary" }} />
            <Typography variant="h4" fontWeight={700}>
              Profile Not Found
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {error || "The user profile you're looking for doesn't exist."}
            </Typography>
            <Button
              variant="contained"
              href="/albums"
              size="large"
            >
              Back to Albums
            </Button>
          </Stack>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", pt: 10, pb: 8 }}>
      <Container maxWidth="lg">
        <Stack spacing={6}>
          {/* Profile Header */}
          <Paper sx={{ p: 4, position: "relative" }}>
            <Grid container spacing={4} alignItems="center">
              <Grid item xs={12} md="auto">
                <Avatar
                  src={profile.image}
                  alt={profile.name}
                  sx={{
                    width: { xs: 120, md: 150 },
                    height: { xs: 120, md: 150 },
                    mx: { xs: "auto", md: 0 },
                    border: "4px solid",
                    borderColor: "primary.main",
                  }}
                >
                  {profile.name[0]?.toUpperCase()}
                </Avatar>
              </Grid>

              <Grid item xs={12} md>
                <Stack spacing={2}>
                  {/* Name and Username */}
                  <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                    <Typography variant="h3" fontWeight={900}>
                      {profile.name}
                    </Typography>
                    {profile.isVerified && (
                      <Verified color="primary" sx={{ fontSize: 28 }} />
                    )}
                    <Chip
                      label={`@${profile.username}`}
                      variant="outlined"
                      size="small"
                    />
                    <Chip
                      label={profile.role}
                      color={profile.role === "admin" ? "error" : profile.role === "moderator" ? "warning" : "default"}
                      size="small"
                    />
                  </Stack>

                  {/* Bio */}
                  {profile.bio && (
                    <Typography variant="body1" color="text.secondary" maxWidth={600}>
                      {profile.bio}
                    </Typography>
                  )}

                  {/* Location and Join Date */}
                  <Stack direction="row" spacing={3} flexWrap="wrap">
                    {profile.location && (
                      <Stack direction="row" spacing={1} alignItems="center">
                        <LocationOn color="action" sx={{ fontSize: 18 }} />
                        <Typography variant="body2" color="text.secondary">
                          {profile.location}
                        </Typography>
                      </Stack>
                    )}
                    <Stack direction="row" spacing={1} alignItems="center">
                      <CalendarToday color="action" sx={{ fontSize: 18 }} />
                      <Typography variant="body2" color="text.secondary">
                        Joined {formatDate(profile.joinedAt)}
                      </Typography>
                    </Stack>
                  </Stack>

                  {/* Profile Completion */}
                  <Stack spacing={1}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" color="text.secondary">
                        Profile Completion
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {profile.stats.profileCompletion}%
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={profile.stats.profileCompletion}
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  </Stack>
                </Stack>
              </Grid>

              {/* Actions */}
              <Grid item xs={12} md="auto">
                <Stack direction={{ xs: "row", md: "column" }} spacing={2}>
                  {profile.isOwnProfile ? (
                    <Button
                      variant="contained"
                      startIcon={<Edit />}
                      href="/profile/edit"
                      fullWidth
                    >
                      Edit Profile
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="outlined"
                        startIcon={<Share />}
                        fullWidth
                      >
                        Share
                      </Button>
                      {profile.email && (
                        <IconButton color="primary">
                          <Email />
                        </IconButton>
                      )}
                    </>
                  )}
                </Stack>
              </Grid>
            </Grid>
          </Paper>

          <Grid container spacing={4}>
            {/* Stats Cards */}
            <Grid item xs={12} md={4}>
              <Stack spacing={3}>
                {/* Statistics */}
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    Statistics
                  </Typography>
                  <Stack spacing={2}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Stack direction="row" spacing={1} alignItems="center">
                        <AlbumIcon color="primary" sx={{ fontSize: 20 }} />
                        <Typography variant="body2">Albums Posted</Typography>
                      </Stack>
                      <Typography variant="h6" fontWeight={700}>
                        {profile.stats.albumsPosted}
                      </Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Favorite color="error" sx={{ fontSize: 20 }} />
                        <Typography variant="body2">Likes Received</Typography>
                      </Stack>
                      <Typography variant="h6" fontWeight={700}>
                        {profile.stats.likesReceived}
                      </Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Comment color="info" sx={{ fontSize: 20 }} />
                        <Typography variant="body2">Comments Received</Typography>
                      </Stack>
                      <Typography variant="h6" fontWeight={700}>
                        {profile.stats.commentsReceived}
                      </Typography>
                    </Stack>
                  </Stack>
                </Paper>

                {/* Favorite Genres */}
                {profile.favoriteGenres && profile.favoriteGenres.length > 0 && (
                  <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" fontWeight={700} gutterBottom>
                      Favorite Genres
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                      {profile.favoriteGenres.map((genre, index) => (
                        <Chip
                          key={index}
                          label={genre}
                          size="small"
                          color="secondary"
                          variant="outlined"
                        />
                      ))}
                    </Stack>
                  </Paper>
                )}

                {/* Music Platforms */}
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    Music Platforms
                  </Typography>
                  <Stack spacing={2}>
                    {profile.musicPlatforms.spotify && (
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" color="#1DB954">
                          Spotify
                        </Typography>
                        <IconButton
                          component="a"
                          href={profile.musicPlatforms.spotify}
                          target="_blank"
                          rel="noopener noreferrer"
                          size="small"
                          sx={{ color: "#1DB954" }}
                        >
                          <OpenInNew sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Stack>
                    )}
                    {profile.musicPlatforms.youtubeMusic && (
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" color="#FF0000">
                          YouTube Music
                        </Typography>
                        <IconButton
                          component="a"
                          href={profile.musicPlatforms.youtubeMusic}
                          target="_blank"
                          rel="noopener noreferrer"
                          size="small"
                          sx={{ color: "#FF0000" }}
                        >
                          <OpenInNew sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Stack>
                    )}
                    {profile.musicPlatforms.appleMusic && (
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" color="#FA57C1">
                          Apple Music
                        </Typography>
                        <IconButton
                          component="a"
                          href={profile.musicPlatforms.appleMusic}
                          target="_blank"
                          rel="noopener noreferrer"
                          size="small"
                          sx={{ color: "#FA57C1" }}
                        >
                          <OpenInNew sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Stack>
                    )}
                    {!Object.values(profile.musicPlatforms).some(url => url) && (
                      <Typography variant="body2" color="text.secondary" textAlign="center">
                        No music platforms linked
                      </Typography>
                    )}
                  </Stack>
                </Paper>
              </Stack>
            </Grid>

            {/* Recent Albums */}
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 3 }}>
                <Stack spacing={3}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6" fontWeight={700}>
                      Recent Albums ({profile.albums.length})
                    </Typography>
                    {profile.albums.length > 0 && (
                      <Button variant="outlined" size="small">
                        View All
                      </Button>
                    )}
                  </Stack>

                  {profile.albums.length === 0 ? (
                    <Stack spacing={3} alignItems="center" textAlign="center" py={6}>
                      <MusicNote sx={{ fontSize: 64, color: "text.secondary" }} />
                      <Typography variant="h6" color="text.secondary">
                        No Albums Yet
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {profile.isOwnProfile 
                          ? "Start sharing your favorite albums with the community!"
                          : `${profile.name} hasn't shared any albums yet.`}
                      </Typography>
                      {profile.isOwnProfile && (
                        <Button
                          variant="contained"
                          startIcon={<AlbumIcon />}
                          href="/post-album"
                        >
                          Share an Album
                        </Button>
                      )}
                    </Stack>
                  ) : (
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: {
                          xs: "1fr",
                          sm: "repeat(2, 1fr)",
                        },
                        gap: 3,
                      }}
                    >
                      {profile.albums.map((album) => (
                        <Card
                          key={album._id}
                          onClick={() => handleAlbumClick(album._id)}
                          sx={{
                            cursor: "pointer",
                            transition: "all 0.3s ease",
                            "&:hover": {
                              transform: "translateY(-2px)",
                              boxShadow: "0 8px 16px rgba(0,0,0,0.2)",
                            },
                          }}
                        >
                          <Stack direction="row" spacing={2} p={2}>
                            {album.coverImageUrl ? (
                              <Box
                                component="img"
                                src={album.coverImageUrl}
                                alt={album.title}
                                sx={{
                                  width: 60,
                                  height: 60,
                                  borderRadius: 1,
                                  objectFit: "cover",
                                }}
                              />
                            ) : (
                              <Box
                                sx={{
                                  width: 60,
                                  height: 60,
                                  backgroundColor: "action.hover",
                                  borderRadius: 1,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <MusicNote color="action" />
                              </Box>
                            )}
                            
                            <Stack spacing={1} flex={1} minWidth={0}>
                              <Typography variant="body1" fontWeight={600} noWrap>
                                {album.title}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" noWrap>
                                {album.artist}
                              </Typography>
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Chip
                                  label={album.theme?.title || 'No Theme'}
                                  size="small"
                                  variant="outlined"
                                />
                                <Typography variant="caption" color="text.secondary">
                                  {formatDate(album.postedAt)}
                                </Typography>
                              </Stack>
                            </Stack>
                          </Stack>
                        </Card>
                      ))}
                    </Box>
                  )}
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </Stack>
      </Container>
    </Box>
  );
}