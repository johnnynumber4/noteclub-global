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
  Tabs,
  Tab,
} from "@mui/material";
import { AdminPanelSettings, ArrowBack, Group, People } from "@mui/icons-material";
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

interface GroupMember {
  _id: string;
  name: string;
  email: string;
  username: string;
  image?: string;
  isActive: boolean;
}

interface GroupData {
  _id: string;
  name: string;
  description?: string;
  isPrivate: boolean;
  inviteCode: string;
  maxMembers: number;
  members: GroupMember[];
  admins: Array<{
    _id: string;
    name: string;
    email: string;
    username: string;
  }>;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<GroupData[]>([]);
  const [totalAlbums, setTotalAlbums] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  // Check if user is admin by fetching their role
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (session?.user?.id) {
        try {
          const response = await fetch(`/api/users/${session.user.id}`);
          if (response.ok) {
            const data = await response.json();
            const hasAdmin = data.user.role === 'admin';
            setIsAdminUser(hasAdmin);

            if (!hasAdmin) {
              router.push("/dashboard");
            } else {
              fetchUsers();
              fetchGroups();
            }
          }
        } catch (error) {
          console.error('Error checking admin status:', error);
          router.push("/dashboard");
        } finally {
          setCheckingAdmin(false);
        }
      }
    };

    if (status === "unauthenticated") {
      router.push("/auth/signin");
    } else if (status === "authenticated") {
      checkAdminStatus();
    }
  }, [status, session, router]);

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

  const fetchGroups = async () => {
    try {
      const response = await fetch("/api/admin/groups");
      if (!response.ok) {
        throw new Error("Failed to fetch groups");
      }
      const data = await response.json();
      setGroups(data.groups || []);
    } catch (error) {
      console.error("Error fetching groups:", error);
      setError("Failed to load groups");
    }
  };

  const toggleUserActive = async (userId: string, currentStatus: boolean) => {
    try {
      setUpdatingUserId(userId);
      setError("");
      setSuccess("");

      console.log("Toggling user active status:", { userId, currentStatus, newStatus: !currentStatus });

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

      const data = await response.json();
      console.log("Toggle response:", data);

      if (!response.ok) {
        const errorMessage = data.error || "Failed to update user status";
        const details = data.details ? `: ${data.details}` : "";
        throw new Error(errorMessage + details);
      }

      // Update local state
      setUsers(users.map(user =>
        user._id === userId
          ? { ...user, isActive: !currentStatus }
          : user
      ));

      setSuccess(`User ${!currentStatus ? "activated" : "deactivated"} successfully`);
    } catch (error) {
      console.error("Error updating user:", error);
      const errorMsg = error instanceof Error ? error.message : "Failed to update user status";
      setError(errorMsg);

      // If user not found, refresh the user list to get current data
      if (errorMsg.includes("not found")) {
        console.log("User not found - refreshing user list");
        await fetchUsers();
      }
    } finally {
      setUpdatingUserId(null);
    }
  };

  if (status === "loading" || loading || checkingAdmin) {
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

  if (!isAdminUser) {
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

          {/* Tabs */}
          <Paper sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
              <Tab icon={<People />} iconPosition="start" label="Users" />
              <Tab icon={<Group />} iconPosition="start" label="Groups" />
            </Tabs>
          </Paper>

          {/* Tab Content */}
          {activeTab === 0 && (
            <>
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
                          <Typography
                            variant="body2"
                            color="primary"
                            component={Link}
                            href={`/profile/${user._id}`}
                            sx={{
                              textDecoration: "none",
                              "&:hover": { textDecoration: "underline" }
                            }}
                          >
                            @{user.username}
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
            </>
          )}

          {/* Groups Tab */}
          {activeTab === 1 && (
            <>
              {/* Groups Table */}
              <Paper sx={{ width: "100%", overflow: "hidden" }}>
                <TableContainer sx={{ maxHeight: "70vh" }}>
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Group Name</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell align="center">Members</TableCell>
                        <TableCell align="center">Privacy</TableCell>
                        <TableCell align="center">Invite Code</TableCell>
                        <TableCell align="center">Created By</TableCell>
                        <TableCell align="center">Created</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {groups.map((group) => (
                        <TableRow
                          key={group._id}
                          sx={{ "&:hover": { bgcolor: "action.hover" } }}
                        >
                          <TableCell>
                            <Typography
                              variant="body1"
                              fontWeight={600}
                              component={Link}
                              href={`/groups/${group._id}`}
                              sx={{
                                textDecoration: "none",
                                color: "text.primary",
                                "&:hover": { color: "primary.main" }
                              }}
                            >
                              {group.name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary" noWrap>
                              {group.description || "-"}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Stack direction="row" spacing={-1} justifyContent="center">
                              {group.members.slice(0, 3).map((member) => (
                                <Avatar
                                  key={member._id}
                                  src={member.image}
                                  sx={{ width: 28, height: 28, fontSize: 12, border: "2px solid white" }}
                                  title={member.name}
                                >
                                  {member.name[0]}
                                </Avatar>
                              ))}
                              {group.members.length > 3 && (
                                <Avatar sx={{ width: 28, height: 28, fontSize: 10 }}>
                                  +{group.members.length - 3}
                                </Avatar>
                              )}
                            </Stack>
                            <Typography variant="caption" color="text.secondary">
                              {group.members.length} / {group.maxMembers}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={group.isPrivate ? "Private" : "Public"}
                              size="small"
                              color={group.isPrivate ? "warning" : "success"}
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2" fontFamily="monospace">
                              {group.inviteCode}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2" color="text.secondary">
                              {group.createdBy?.name || "Unknown"}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2" color="text.secondary">
                              {new Date(group.createdAt).toLocaleDateString()}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>

              {/* Group Summary */}
              <Stack direction="row" spacing={3} flexWrap="wrap" useFlexGap>
                <Paper sx={{ p: 3, flex: 1, minWidth: 200 }}>
                  <Typography variant="h4" fontWeight={700} color="primary.main">
                    {groups.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Groups
                  </Typography>
                </Paper>
                <Paper sx={{ p: 3, flex: 1, minWidth: 200 }}>
                  <Typography variant="h4" fontWeight={700} color="success.main">
                    {groups.filter(g => !g.isPrivate).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Public Groups
                  </Typography>
                </Paper>
                <Paper sx={{ p: 3, flex: 1, minWidth: 200 }}>
                  <Typography variant="h4" fontWeight={700} color="warning.main">
                    {groups.filter(g => g.isPrivate).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Private Groups
                  </Typography>
                </Paper>
                <Paper sx={{ p: 3, flex: 1, minWidth: 200 }}>
                  <Typography variant="h4" fontWeight={700} sx={{ color: "#9c27b0" }}>
                    {groups.reduce((sum, g) => sum + g.members.length, 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Memberships
                  </Typography>
                </Paper>
              </Stack>
            </>
          )}
        </Stack>
      </Container>
    </Box>
  );
}
