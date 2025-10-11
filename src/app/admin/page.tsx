"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Box,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Switch,
  CircularProgress,
  Alert,
  Chip,
  Avatar,
  Stack,
  Button,
} from "@mui/material";
import { AdminPanelSettings, ArrowBack } from "@mui/icons-material";
import Link from "next/link";

interface User {
  _id: string;
  name: string;
  email: string;
  username: string;
  image?: string;
  isActive: boolean;
  role: string;
  turnOrder: number;
  albumsPosted: number;
  joinedAt: string;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [totalAlbums, setTotalAlbums] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  // Check if user is admin
  const isAdmin = session?.user?.email === "jyoungiv@gmail.com";

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    } else if (status === "authenticated" && !isAdmin) {
      router.push("/dashboard");
    } else if (status === "authenticated" && isAdmin) {
      fetchUsers();
    }
  }, [status, isAdmin, router]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/users");
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      const data = await response.json();
      setUsers(data.users || []);
      setTotalAlbums(data.totalAlbums || 0);
    } catch (error) {
      console.error("Error fetching users:", error);
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const toggleUserActive = async (userId: string, currentStatus: boolean) => {
    try {
      setUpdatingUserId(userId);
      setError("");
      setSuccess("");

      const response = await fetch("/api/admin/users/toggle-active", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          isActive: !currentStatus,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update user status");
      }

      const data = await response.json();

      // Update local state
      setUsers(users.map(user =>
        user._id === userId
          ? { ...user, isActive: !currentStatus }
          : user
      ));

      setSuccess(`User ${!currentStatus ? "activated" : "deactivated"} successfully`);
    } catch (error) {
      console.error("Error updating user:", error);
      setError("Failed to update user status");
    } finally {
      setUpdatingUserId(null);
    }
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

  if (!isAdmin) {
    return null;
  }

  return (
    <Box
      sx={{ minHeight: "100vh", bgcolor: "background.default", pt: 10, pb: 4 }}
    >
      <Container maxWidth="xl">
        <Stack spacing={4}>
          {/* Header */}
          <Stack spacing={2}>
            <Button
              component={Link}
              href="/dashboard"
              startIcon={<ArrowBack />}
              sx={{ width: "fit-content" }}
            >
              Back to Dashboard
            </Button>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              alignItems="center"
              spacing={2}
            >
              <AdminPanelSettings sx={{ fontSize: 48, color: "primary.main" }} />
              <Stack>
                <Typography variant="h3" fontWeight={900}>
                  Admin Panel
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Manage users and their active status
                </Typography>
              </Stack>
            </Stack>
          </Stack>

          {/* Messages */}
          {success && (
            <Alert severity="success" onClose={() => setSuccess("")}>
              {success}
            </Alert>
          )}
          {error && (
            <Alert severity="error" onClose={() => setError("")}>
              {error}
            </Alert>
          )}

          {/* Users Table */}
          <Paper sx={{ width: "100%", overflow: "hidden" }}>
            <TableContainer sx={{ maxHeight: "70vh" }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Username</TableCell>
                    <TableCell align="center">Turn Order</TableCell>
                    <TableCell align="center">Albums Posted</TableCell>
                    <TableCell align="center">Role</TableCell>
                    <TableCell align="center">Joined</TableCell>
                    <TableCell align="center">Active Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((user) => (
                      <TableRow
                        key={user._id}
                        sx={{
                          "&:hover": { bgcolor: "action.hover" },
                          opacity: user.isActive ? 1 : 0.6,
                        }}
                      >
                        <TableCell>
                          <Stack direction="row" spacing={2} alignItems="center">
                            <Avatar src={user.image} alt={user.name}>
                              {user.name[0]}
                            </Avatar>
                            <Typography variant="body1" fontWeight={600}>
                              {user.name}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {user.email}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {user.username}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={user.turnOrder}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2">
                            {user.albumsPosted}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={user.role}
                            size="small"
                            color={
                              user.role === "admin"
                                ? "error"
                                : user.role === "moderator"
                                ? "warning"
                                : "default"
                            }
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" color="text.secondary">
                            {new Date(user.joinedAt).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Stack
                            direction="row"
                            alignItems="center"
                            justifyContent="center"
                            spacing={1}
                          >
                            <Typography
                              variant="body2"
                              color={user.isActive ? "success.main" : "error.main"}
                              fontWeight={600}
                            >
                              {user.isActive ? "Active" : "Inactive"}
                            </Typography>
                            <Switch
                              checked={user.isActive}
                              onChange={() =>
                                toggleUserActive(user._id, user.isActive)
                              }
                              disabled={updatingUserId === user._id}
                              color="success"
                            />
                            {updatingUserId === user._id && (
                              <CircularProgress size={20} />
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* Summary */}
          <Stack direction="row" spacing={3} flexWrap="wrap" useFlexGap>
            <Paper sx={{ p: 3, flex: 1, minWidth: 200 }}>
              <Typography variant="h4" fontWeight={700} color="primary.main">
                {users.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Users
              </Typography>
            </Paper>
            <Paper sx={{ p: 3, flex: 1, minWidth: 200 }}>
              <Typography variant="h4" fontWeight={700} color="success.main">
                {users.filter(u => u.isActive).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Users
              </Typography>
            </Paper>
            <Paper sx={{ p: 3, flex: 1, minWidth: 200 }}>
              <Typography variant="h4" fontWeight={700} color="error.main">
                {users.filter(u => !u.isActive).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Inactive Users
              </Typography>
            </Paper>
            <Paper sx={{ p: 3, flex: 1, minWidth: 200 }}>
              <Typography variant="h4" fontWeight={700} sx={{ color: "#9c27b0" }}>
                {totalAlbums}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Albums
              </Typography>
            </Paper>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
