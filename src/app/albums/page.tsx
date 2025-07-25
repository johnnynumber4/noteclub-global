"use client";

import { useState, useEffect } from "react";
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
  Grid,
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
} from "@mui/icons-material";

interface Album {
  _id: string;
  title: string;
  artist: string;
  year?: number;
  genre?: string;
  description?: string;
  postedBy: {
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
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredAlbums, setFilteredAlbums] = useState<Album[]>([]);

  useEffect(() => {
    fetchAlbums();
  }, []);

  useEffect(() => {
    const filtered = albums.filter(
      (album) =>
        album.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        album.artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
        album.theme.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredAlbums(filtered);
  }, [albums, searchTerm]);

  const fetchAlbums = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/albums");
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
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", pt: 10 }}>
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
            <Box sx={{ maxWidth: 500, mx: "auto" }}>
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
            </Box>

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
                label={`${filteredAlbums.length} Results`}
                color="secondary"
                variant="outlined"
              />
            </Stack>
          </Stack>

          {/* Albums Grid */}
          {filteredAlbums.length === 0 ? (
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
              {filteredAlbums.map((album) => (
                <Card
                  key={album._id}
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
                        height="200"
                        image={album.coverImageUrl}
                        alt={album.title}
                        sx={{ objectFit: "cover" }}
                      />
                    ) : (
                      <Box
                        sx={{
                          height: 200,
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
                        transition: "opacity 0.3s ease",
                        ".MuiCard-root:hover &": {
                          opacity: 1,
                        },
                      }}
                    >
                      <IconButton
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
                        label={album.theme.title}
                        size="small"
                        color="secondary"
                        variant="outlined"
                      />

                      {/* Posted By */}
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Avatar
                          src={album.postedBy.image}
                          alt={album.postedBy.name}
                          sx={{ width: 24, height: 24 }}
                        >
                          {album.postedBy.name[0]?.toUpperCase()}
                        </Avatar>
                        <Typography variant="caption" color="text.secondary">
                          by {album.postedBy.name}
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
                            variant="outlined"
                          />
                          <Chip
                            icon={<Comment />}
                            label={album.commentCount}
                            size="small"
                            variant="outlined"
                          />
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
                              sx={{ color: "#1DB954" }}
                            >
                              <OpenInNew sx={{ fontSize: 16 }} />
                            </IconButton>
                          )}
                          {album.youtubeMusicUrl && (
                            <IconButton
                              component="a"
                              href={album.youtubeMusicUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              size="small"
                              sx={{ color: "#FF0000" }}
                            >
                              <OpenInNew sx={{ fontSize: 16 }} />
                            </IconButton>
                          )}
                          {album.appleMusicUrl && (
                            <IconButton
                              component="a"
                              href={album.appleMusicUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              size="small"
                              sx={{ color: "#FA57C1" }}
                            >
                              <OpenInNew sx={{ fontSize: 16 }} />
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
