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
  TextField,
  InputAdornment,
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
  Search,
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
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchProfile();
  }, [userId, debouncedSearch]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const url = debouncedSearch
        ? `/api/users/${userId}?search=${encodeURIComponent(debouncedSearch)}`
        : `/api/users/${userId}`;
      const response = await fetch(url);
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
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", pt: { xs: 8, md: 10 }, pb: 8 }}>
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
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Box
                            component="svg"
                            viewBox="0 0 24 24"
                            sx={{ width: 20, height: 20, fill: '#1DB954' }}
                          >
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 14.4c-.17.29-.55.39-.84.22-2.29-1.4-5.18-1.72-8.58-.94-.33.07-.66-.13-.73-.46-.07-.33.13-.66.46-.73 3.74-.85 6.96-.49 9.51 1.05.29.17.39.55.22.84v.02zm1.2-2.68c-.21.34-.66.45-1 .24-2.62-1.61-6.61-2.07-9.72-1.13-.39.12-.8-.09-.92-.48s.09-.8.48-.92c3.56-1.08 8.02-.57 11.42 1.3.34.21.45.66.24 1v-.01zm.11-2.8C14.3 9 8.52 8.8 4.95 9.98c-.46.15-.94-.1-1.09-.56s.1-.94.56-1.09C8.69 7.14 15.1 7.38 19.33 9.5c.42.21.58.72.37 1.14-.21.42-.72.58-1.14.37-.01-.01-.02-.01-.03-.02v.03z"/>
                          </Box>
                          <Typography variant="body2" color="#1DB954">
                            Spotify
                          </Typography>
                        </Stack>
                        <IconButton
                          component="a"
                          href={profile.musicPlatforms.spotify}
                          target="_blank"
                          rel="noopener noreferrer"
                          size="small"
                          sx={{
                            color: "#1DB954",
                            '&:hover': {
                              bgcolor: 'rgba(29, 185, 84, 0.1)'
                            }
                          }}
                          title="View Spotify Profile"
                        >
                          <OpenInNew sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Stack>
                    )}
                    {profile.musicPlatforms.youtubeMusic && (
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Box
                            component="svg"
                            viewBox="0 0 24 24"
                            sx={{ width: 20, height: 20, fill: '#FF0000' }}
                          >
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.31-.22-.69-.32-1.09-.32H8.45c-.4 0-.78.1-1.09.32S6.8 9.37 6.8 9.8v4.4c0 .43.25.8.56 1.02s.69.32 1.09.32h7.1c.4 0 .78-.1 1.09-.32s.56-.59.56-1.02V9.8c0-.43-.25-.8-.56-1.02zM14 12.5l-2.5 1.73c-.32.22-.7.01-.7-.38V10.15c0-.39.38-.6.7-.38L14 11.5c.32.22.32.78 0 1z"/>
                          </Box>
                          <Typography variant="body2" color="#FF0000">
                            YouTube Music
                          </Typography>
                        </Stack>
                        <IconButton
                          component="a"
                          href={profile.musicPlatforms.youtubeMusic}
                          target="_blank"
                          rel="noopener noreferrer"
                          size="small"
                          sx={{
                            color: "#FF0000",
                            '&:hover': {
                              bgcolor: 'rgba(255, 0, 0, 0.1)'
                            }
                          }}
                          title="View YouTube Music Profile"
                        >
                          <OpenInNew sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Stack>
                    )}
                    {profile.musicPlatforms.appleMusic && (
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Box
                            component="svg"
                            viewBox="0 0 24 24"
                            sx={{ width: 20, height: 20, fill: '#FA57C1' }}
                          >
                            <path d="M23.997 6.124c0-.738-.065-1.47-.24-2.19-.317-1.31-1.062-2.31-2.18-3.043C21.003.517 20.373.285 19.7.164c-.517-.093-1.038-.135-1.564-.123-.31-.004-.62.01-.93.035-.5.04-.99.117-1.36.28-.96.42-1.51 1.01-1.51 1.01s-.55-.59-1.51-1.01c-.37-.163-.86-.24-1.36-.28-.31-.025-.62-.04-.93-.035-.526-.012-1.047.03-1.564.123-.673.12-1.303.353-1.877.817-1.118.734-1.863 1.734-2.18 3.043-.175.72-.24 1.452-.24 2.19 0 .02 0 .04.001.06v12.457c0 1.102.898 2 2 2h.01c.665 0 1.275-.388 1.556-.991l6.831-14.68c.78-1.675 2.77-2.51 4.445-1.73.835.39 1.34 1.195 1.34 2.08v9.32c0 2.21-1.79 4-4 4s-4-1.79-4-4V9.124c0-.552.448-1 1-1s1 .448 1 1v3.876c0 1.105.895 2 2 2s2-.895 2-2v-9.32c0-.423-.203-.823-.55-1.07-.695-.495-1.73-.35-2.225.345L9.776 17.633c-.1.177-.29.29-.498.29-.552 0-1-.448-1-1V6.185c0-.517.06-1.022.179-1.515.24-.99.79-1.64 1.314-1.968.394-.246.84-.35 1.29-.35.31 0 .62.04.91.12.54.15.99.44 1.31.85.32-.41.77-.7 1.31-.85.29-.08.6-.12.91-.12.45 0 .896.104 1.29.35.524.328 1.074.978 1.314 1.968.119.493.179.998.179 1.515z"/>
                          </Box>
                          <Typography variant="body2" color="#FA57C1">
                            Apple Music
                          </Typography>
                        </Stack>
                        <IconButton
                          component="a"
                          href={profile.musicPlatforms.appleMusic}
                          target="_blank"
                          rel="noopener noreferrer"
                          size="small"
                          sx={{
                            color: "#FA57C1",
                            '&:hover': {
                              bgcolor: 'rgba(250, 87, 193, 0.1)'
                            }
                          }}
                          title="View Apple Music Profile"
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
                  <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
                    <Typography variant="h6" fontWeight={700}>
                      Recent Albums ({profile.albums.length})
                    </Typography>
                  </Stack>

                  {/* Search Field */}
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Search albums by title or artist..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search />
                        </InputAdornment>
                      ),
                    }}
                  />

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