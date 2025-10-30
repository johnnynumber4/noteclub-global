"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Box,
  Container,
  Typography,
  Button,
  TextField,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Avatar,
  Stack,
  IconButton,
  Paper,
  InputAdornment,
  CircularProgress,
} from "@mui/material";
import {
  MusicNote,
  Search,
  FilterList,
  OpenInNew,
  Favorite,
  Comment,
  CalendarToday,
  Album as AlbumIcon,
  PlayArrow,
  Close,
  Delete,
  Casino,
} from "@mui/icons-material";

interface Album {
  _id: string;
  title: string;
  artist: string;
  year?: number;
  genre?: string;
  description?: string;
  postedBy: {
    _id: string;
    name: string;
    username: string;
    image?: string;
  };
  theme: {
    title: string;
  };
  spotifyUrl?: string;
  youtubeMusicUrl?: string;
  appleMusicUrl?: string;
  coverImageUrl?: string;
  likeCount: number;
  commentCount: number;
  postedAt: string;
  turnNumber: number;
  isLikedByUser: boolean;
}

interface ApiResponse {
  albums: Album[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default function AlbumsPage() {
  const { data: session } = useSession();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedPlayAlbum, setExpandedPlayAlbum] = useState<string | null>(null);
  const [deletingAlbumId, setDeletingAlbumId] = useState<string | null>(null);
  const [luckyLoading, setLuckyLoading] = useState(false);

  // Check if current user is admin (jyoungiv@gmail.com)
  const isAdmin = session?.user?.email === "jyoungiv@gmail.com";

  useEffect(() => {
    fetchAlbums();
  }, []);

  useEffect(() => {
    // Debounce search to avoid too many API calls
    const timeoutId = setTimeout(() => {
      fetchAlbums();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const fetchAlbums = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) {
        params.append('search', searchTerm);
      } else {
        params.append('limit', '100');
      }
      const response = await fetch(`/api/albums?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch albums");
      }
      const data: ApiResponse = await response.json();
      setAlbums(data.albums || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      console.error("Error fetching albums:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatYouTubeMusicUrl = (url: string | undefined): string | undefined => {
    if (!url) return undefined;
    // If it's already a full URL, return it
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    // If it's just an ID, construct the full URL
    return `https://music.youtube.com/playlist?list=${url}`;
  };

  const handlePlayClick = (albumId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent card click
    setExpandedPlayAlbum(expandedPlayAlbum === albumId ? null : albumId);
  };

  const handleServiceClick = (url: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent card click
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleAlbumClick = (albumId: string) => {
    // Navigate to album detail page (we'll create this route)
    window.location.href = `/albums/${albumId}`;
  };

  const handleDeleteClick = async (albumId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent card click

    if (!isAdmin) {
      alert("You don't have permission to delete albums.");
      return;
    }

    const album = albums.find(a => a._id === albumId);
    if (!album) return;

    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${album.title}" by ${album.artist}? This action cannot be undone.`
    );

    if (!confirmDelete) return;

    try {
      setDeletingAlbumId(albumId);

      const response = await fetch(`/api/albums?id=${albumId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete album');
      }

      // Remove album from local state
      setAlbums(prevAlbums => prevAlbums.filter(a => a._id !== albumId));

      const result = await response.json();
      alert(`Successfully deleted "${result.deletedAlbum.title}" by ${result.deletedAlbum.artist}`);

    } catch (err) {
      console.error('Error deleting album:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete album');
    } finally {
      setDeletingAlbumId(null);
    }
  };

  const handleLikeClick = async (albumId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent card click
    try {
      const response = await fetch(`/api/albums/${albumId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        // Refresh albums to get updated like count
        fetchAlbums();
      }
    } catch (error) {
      console.error('Error liking album:', error);
    }
  };

  const handleCommentClick = (albumId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent card click
    // Navigate to album page and focus comment section
    window.location.href = `/albums/${albumId}#comments`;
  };

  const handleImFeelingLucky = async () => {
    try {
      setLuckyLoading(true);
      const response = await fetch('/api/albums/random');

      if (!response.ok) {
        throw new Error('Failed to fetch random album');
      }

      const data = await response.json();

      if (data.albumId) {
        window.location.href = `/albums/${data.albumId}`;
      }
    } catch (error) {
      console.error('Error fetching random album:', error);
      alert('Unable to find a random album. Please try again.');
    } finally {
      setLuckyLoading(false);
    }
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
            Loading albums...
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
            <MusicNote sx={{ fontSize: 80, color: "text.secondary" }} />
            <Typography variant="h4" fontWeight={700}>
              Unable to Load Albums
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {error}
            </Typography>
            <Button
              variant="contained"
              startIcon={<AlbumIcon />}
              onClick={fetchAlbums}
              size="large"
            >
              Try Again
            </Button>
          </Stack>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", pt: { xs: 8, md: 10 } }}>
      <Container maxWidth="lg">
        <Stack spacing={6}>
          {/* Header */}
          <Stack spacing={4} textAlign="center">
            <Typography variant="h2" fontWeight={900}>
              Music{" "}
              <Box component="span" color="primary.main">
                Albums
              </Box>
            </Typography>
            <Typography
              variant="h5"
              color="text.secondary"
              maxWidth={600}
              mx="auto"
            >
              Discover incredible albums shared by our community members
            </Typography>

            {/* Search Bar */}
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              sx={{ maxWidth: 700, mx: "auto" }}
              alignItems="stretch"
            >
              <TextField
                fullWidth
                placeholder="Search albums, artists, or themes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    borderRadius: 3,
                  },
                }}
              />
              <Button
                variant="contained"
                color="secondary"
                startIcon={luckyLoading ? <CircularProgress size={20} color="inherit" /> : <Casino />}
                onClick={handleImFeelingLucky}
                disabled={luckyLoading}
                sx={{
                  whiteSpace: "nowrap",
                  minWidth: { xs: "100%", sm: "auto" },
                  borderRadius: 3,
                  px: 3,
                }}
              >
                I'm Feeling Lucky
              </Button>
            </Stack>

            {/* Stats */}
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              justifyContent="center"
            >
              <Chip
                icon={<AlbumIcon />}
                label={`${albums.length} Albums`}
                color="primary"
                variant="outlined"
              />
              <Chip
                icon={<FilterList />}
                label={`${albums.length} Results`}
                color="secondary"
                variant="outlined"
              />
            </Stack>
          </Stack>

          {/* Albums Grid */}
          {albums.length === 0 ? (
            <Paper sx={{ p: 8, textAlign: "center" }}>
              <Stack spacing={3} alignItems="center">
                <MusicNote sx={{ fontSize: 80, color: "text.secondary" }} />
                <Typography variant="h4" fontWeight={700}>
                  No Albums Found
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {searchTerm
                    ? `No albums match "${searchTerm}". Try a different search term.`
                    : "No albums have been shared yet. Be the first to share an album!"}
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<AlbumIcon />}
                  sx={{ mt: 2 }}
                >
                  Share an Album
                </Button>
              </Stack>
            </Paper>
          ) : (
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
              {albums.map((album) => (
                <Card
                  key={album._id}
                  onClick={() => handleAlbumClick(album._id)}
                  sx={{
                    height: "100%",
                    background:
                      "linear-gradient(135deg, rgba(244, 67, 54, 0.1), rgba(33, 150, 243, 0.1))",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: "0 12px 24px rgba(0,0,0,0.3)",
                    },
                  }}
                >
                  {/* Album Cover */}
                  <Box sx={{ position: "relative" }}>
                    {album.coverImageUrl ? (
                      <CardMedia
                        component="img"
                        image={album.coverImageUrl}
                        alt={album.title}
                        sx={{
                          objectFit: "cover",
                          height: { xs: 180, sm: 200, md: 220 },
                          width: "100%"
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          height: { xs: 180, sm: 200, md: 220 },
                          background: "linear-gradient(135deg, #333, #666)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <MusicNote
                          sx={{ fontSize: 64, color: "white", opacity: 0.7 }}
                        />
                      </Box>
                    )}

                    {/* Play Button Overlay */}
                    <Box
                      sx={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        opacity: 0,
                        transition: "all 0.3s ease",
                        ".MuiCard-root:hover &": {
                          opacity: 1,
                        },
                      }}
                    >
                      {expandedPlayAlbum === album._id ? (
                        // Expanded streaming service icons
                        <Stack 
                          direction="row" 
                          spacing={1}
                          sx={{
                            bgcolor: "rgba(0, 0, 0, 0.8)",
                            borderRadius: "24px",
                            p: 1,
                          }}
                        >
                          {album.spotifyUrl && (
                            <IconButton
                              onClick={(e) => album.spotifyUrl && handleServiceClick(album.spotifyUrl, e)}
                              sx={{
                                bgcolor: "#1DB954",
                                color: "white",
                                "&:hover": {
                                  bgcolor: "#1ed760",
                                },
                                width: 40,
                                height: 40,
                              }}
                              title="Listen on Spotify"
                            >
                              <Box
                                component="svg"
                                viewBox="0 0 24 24"
                                sx={{ width: 20, height: 20, fill: 'currentColor' }}
                              >
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 14.4c-.17.29-.55.39-.84.22-2.29-1.4-5.18-1.72-8.58-.94-.33.07-.66-.13-.73-.46-.07-.33.13-.66.46-.73 3.74-.85 6.96-.49 9.51 1.05.29.17.39.55.22.84v.02zm1.2-2.68c-.21.34-.66.45-1 .24-2.62-1.61-6.61-2.07-9.72-1.13-.39.12-.8-.09-.92-.48s.09-.8.48-.92c3.56-1.08 8.02-.57 11.42 1.3.34.21.45.66.24 1v-.01zm.11-2.8C14.3 9 8.52 8.8 4.95 9.98c-.46.15-.94-.1-1.09-.56s.1-.94.56-1.09C8.69 7.14 15.1 7.38 19.33 9.5c.42.21.58.72.37 1.14-.21.42-.72.58-1.14.37-.01-.01-.02-.01-.03-.02v.03z"/>
                              </Box>
                            </IconButton>
                          )}
                          {album.youtubeMusicUrl && (
                            <IconButton
                              onClick={(e) => {
                                const url = formatYouTubeMusicUrl(album.youtubeMusicUrl);
                                if (url) handleServiceClick(url, e);
                              }}
                              sx={{
                                bgcolor: "#FF0000",
                                color: "white",
                                "&:hover": {
                                  bgcolor: "#ff1744",
                                },
                                width: 40,
                                height: 40,
                              }}
                            >
                              <PlayArrow />
                            </IconButton>
                          )}
                          <IconButton
                            onClick={(e) => handlePlayClick(album._id, e)}
                            sx={{
                              bgcolor: "rgba(255, 255, 255, 0.2)",
                              color: "white",
                              "&:hover": {
                                bgcolor: "rgba(255, 255, 255, 0.3)",
                              },
                              width: 40,
                              height: 40,
                            }}
                          >
                            <Close />
                          </IconButton>
                        </Stack>
                      ) : (
                        // Collapsed play button
                        <IconButton
                          onClick={(e) => handlePlayClick(album._id, e)}
                          sx={{
                            bgcolor: "rgba(244, 67, 54, 0.9)",
                            color: "white",
                            "&:hover": {
                              bgcolor: "primary.main",
                            },
                          }}
                          size="large"
                        >
                          <PlayArrow sx={{ fontSize: 32 }} />
                        </IconButton>
                      )}
                    </Box>
                  </Box>

                  <CardContent sx={{ p: 3 }}>
                    <Stack spacing={2}>
                      {/* Album Info */}
                      <Stack spacing={1}>
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
                        {album.year && (
                          <Typography variant="caption" color="text.secondary">
                            {album.year}
                          </Typography>
                        )}
                      </Stack>

                      {/* Theme */}
                      <Chip
                        label={album.theme?.title || 'No Theme'}
                        size="small"
                        color="secondary"
                        variant="outlined"
                      />

                      {/* Posted By */}
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (album.postedBy?._id) {
                            window.location.href = `/profile/${album.postedBy._id}`;
                          }
                        }}
                        sx={{
                          cursor: album.postedBy?._id ? 'pointer' : 'default',
                          '&:hover': album.postedBy?._id ? {
                            '& .MuiTypography-root': {
                              color: 'primary.main'
                            }
                          } : {}
                        }}
                      >
                        <Avatar
                          src={album.postedBy?.image}
                          alt={album.postedBy?.name || 'Unknown'}
                          sx={{ width: 24, height: 24 }}
                        >
                          {album.postedBy?.name?.[0]?.toUpperCase() || '?'}
                        </Avatar>
                        <Typography variant="caption" color="text.secondary">
                          by {album.postedBy?.name || 'Unknown'}
                        </Typography>
                      </Stack>

                      {/* Date */}
                      <Stack direction="row" spacing={1} alignItems="center">
                        <CalendarToday sx={{ fontSize: 14 }} />
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(album.postedAt)}
                        </Typography>
                      </Stack>

                      {/* Actions */}
                      <Stack
                        direction="row"
                        spacing={2}
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Stack direction="row" spacing={1}>
                          <Chip
                            icon={<Favorite />}
                            label={album.likeCount}
                            size="small"
                            variant={album.isLikedByUser ? "filled" : "outlined"}
                            color={album.isLikedByUser ? "error" : "default"}
                            onClick={(e) => handleLikeClick(album._id, e)}
                            sx={{ 
                              cursor: 'pointer',
                              '&:hover': {
                                bgcolor: album.isLikedByUser 
                                  ? 'rgba(244, 67, 54, 0.8)' 
                                  : 'rgba(244, 67, 54, 0.1)',
                                borderColor: 'error.main'
                              }
                            }}
                          />
                          <Chip
                            icon={<Comment />}
                            label={album.commentCount}
                            size="small"
                            variant="outlined"
                            onClick={(e) => handleCommentClick(album._id, e)}
                            sx={{
                              cursor: 'pointer',
                              '&:hover': {
                                bgcolor: 'rgba(33, 150, 243, 0.1)',
                                borderColor: 'secondary.main'
                              }
                            }}
                          />
                          {/* Delete button - only visible to admin */}
                          {isAdmin && (
                            <Chip
                              icon={deletingAlbumId === album._id ? <CircularProgress size={16} /> : <Delete />}
                              label="Delete"
                              size="small"
                              variant="outlined"
                              color="error"
                              disabled={deletingAlbumId === album._id}
                              onClick={(e) => handleDeleteClick(album._id, e)}
                              sx={{
                                cursor: 'pointer',
                                '&:hover': {
                                  bgcolor: 'rgba(244, 67, 54, 0.1)',
                                  borderColor: 'error.main'
                                }
                              }}
                            />
                          )}
                        </Stack>

                        {/* Streaming Links */}
                        <Stack direction="row" spacing={0.5}>
                          {album.spotifyUrl && (
                            <IconButton
                              component="a"
                              href={album.spotifyUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              size="small"
                              sx={{
                                color: "#1DB954",
                                '&:hover': {
                                  bgcolor: 'rgba(29, 185, 84, 0.1)'
                                }
                              }}
                              title="Listen on Spotify"
                            >
                              <Box
                                component="svg"
                                viewBox="0 0 24 24"
                                sx={{ width: 16, height: 16, fill: 'currentColor' }}
                              >
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 14.4c-.17.29-.55.39-.84.22-2.29-1.4-5.18-1.72-8.58-.94-.33.07-.66-.13-.73-.46-.07-.33.13-.66.46-.73 3.74-.85 6.96-.49 9.51 1.05.29.17.39.55.22.84v.02zm1.2-2.68c-.21.34-.66.45-1 .24-2.62-1.61-6.61-2.07-9.72-1.13-.39.12-.8-.09-.92-.48s.09-.8.48-.92c3.56-1.08 8.02-.57 11.42 1.3.34.21.45.66.24 1v-.01zm.11-2.8C14.3 9 8.52 8.8 4.95 9.98c-.46.15-.94-.1-1.09-.56s.1-.94.56-1.09C8.69 7.14 15.1 7.38 19.33 9.5c.42.21.58.72.37 1.14-.21.42-.72.58-1.14.37-.01-.01-.02-.01-.03-.02v.03z"/>
                              </Box>
                            </IconButton>
                          )}
                          {album.youtubeMusicUrl && (
                            <IconButton
                              component="a"
                              href={formatYouTubeMusicUrl(album.youtubeMusicUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                              size="small"
                              sx={{
                                color: "#FF0000",
                                '&:hover': {
                                  bgcolor: 'rgba(255, 0, 0, 0.1)'
                                }
                              }}
                              title="Listen on YouTube Music"
                            >
                              <Box
                                component="svg"
                                viewBox="0 0 24 24"
                                sx={{ width: 16, height: 16, fill: 'currentColor' }}
                              >
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.31-.22-.69-.32-1.09-.32H8.45c-.4 0-.78.1-1.09.32S6.8 9.37 6.8 9.8v4.4c0 .43.25.8.56 1.02s.69.32 1.09.32h7.1c.4 0 .78-.1 1.09-.32s.56-.59.56-1.02V9.8c0-.43-.25-.8-.56-1.02zM14 12.5l-2.5 1.73c-.32.22-.7.01-.7-.38V10.15c0-.39.38-.6.7-.38L14 11.5c.32.22.32.78 0 1z"/>
                              </Box>
                            </IconButton>
                          )}
                          {album.appleMusicUrl && (
                            <IconButton
                              component="a"
                              href={album.appleMusicUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              size="small"
                              sx={{
                                color: "#FA57C1",
                                '&:hover': {
                                  bgcolor: 'rgba(250, 87, 193, 0.1)'
                                }
                              }}
                              title="Listen on Apple Music"
                            >
                              <Box
                                component="svg"
                                viewBox="0 0 24 24"
                                sx={{ width: 16, height: 16, fill: 'currentColor' }}
                              >
                                <path d="M23.997 6.124c0-.738-.065-1.47-.24-2.19-.317-1.31-1.062-2.31-2.18-3.043C21.003.517 20.373.285 19.7.164c-.517-.093-1.038-.135-1.564-.123-.31-.004-.62.01-.93.035-.5.04-.99.117-1.36.28-.96.42-1.51 1.01-1.51 1.01s-.55-.59-1.51-1.01c-.37-.163-.86-.24-1.36-.28-.31-.025-.62-.04-.93-.035-.526-.012-1.047.03-1.564.123-.673.12-1.303.353-1.877.817-1.118.734-1.863 1.734-2.18 3.043-.175.72-.24 1.452-.24 2.19 0 .02 0 .04.001.06v12.457c0 1.102.898 2 2 2h.01c.665 0 1.275-.388 1.556-.991l6.831-14.68c.78-1.675 2.77-2.51 4.445-1.73.835.39 1.34 1.195 1.34 2.08v9.32c0 2.21-1.79 4-4 4s-4-1.79-4-4V9.124c0-.552.448-1 1-1s1 .448 1 1v3.876c0 1.105.895 2 2 2s2-.895 2-2v-9.32c0-.423-.203-.823-.55-1.07-.695-.495-1.73-.35-2.225.345L9.776 17.633c-.1.177-.29.29-.498.29-.552 0-1-.448-1-1V6.185c0-.517.06-1.022.179-1.515.24-.99.79-1.64 1.314-1.968.394-.246.84-.35 1.29-.35.31 0 .62.04.91.12.54.15.99.44 1.31.85.32-.41.77-.7 1.31-.85.29-.08.6-.12.91-.12.45 0 .896.104 1.29.35.524.328 1.074.978 1.314 1.968.119.493.179.998.179 1.515z"/>
                              </Box>
                            </IconButton>
                          )}
                        </Stack>
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </Stack>
      </Container>
    </Box>
  );
}
