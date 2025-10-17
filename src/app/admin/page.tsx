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
import { AdminPanelSettings, ArrowBack, Group, People, SkipNext, TouchApp } from "@mui/icons-material";
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

  // Turn management state
  const [turnStatus, setTurnStatus] = useState<any>(null);
  const [advancingTurn, setAdvancingTurn] = useState(false);
  const [settingTurn, setSettingTurn] = useState(false);

  // Check if user is admin by checking email directly
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (session?.user?.email) {
        try {
          // Check if user is admin based on email
          const isAdmin = session.user.email === "jyoungiv@gmail.com";
          setIsAdminUser(isAdmin);

          if (!isAdmin) {
            router.push("/dashboard");
          } else {
            fetchUsers();
            fetchGroups();
            fetchTurnStatus();
          }
          setCheckingAdmin(false);
        } catch (error) {
          console.error('Error checking admin status:', error);
          router.push("/dashboard");
          setCheckingAdmin(false);
        }
      } else {
        setCheckingAdmin(false);
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

  const fetchTurnStatus = async () => {
    try {
      const response = await fetch("/api/turn-status");
      if (response.ok) {
        const data = await response.json();
        setTurnStatus(data);
      }
    } catch (error) {
      console.error("Error fetching turn status:", error);
    }
  };

  const advanceTurn = async () => {
    try {
      setAdvancingTurn(true);
      setError("");
      setSuccess("");

      const response = await fetch("/api/admin/turn/advance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to advance turn");
      }

      setSuccess(data.message || `Turn advanced to ${data.currentTurnUser?.name}`);
      await fetchTurnStatus();
    } catch (error) {
      console.error("Error advancing turn:", error);
      setError(error instanceof Error ? error.message : "Failed to advance turn");
    } finally {
      setAdvancingTurn(false);
    }
  };

  const setUserTurn = async (userId: string) => {
    try {
      setSettingTurn(true);
      setError("");
      setSuccess("");

      const response = await fetch("/api/admin/turn/set", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to set turn");
      }

      setSuccess(data.message || `Turn set to ${data.newLastPosted?.user?.name}`);
      await fetchTurnStatus();
    } catch (error) {
      console.error("Error setting turn:", error);
      setError(error instanceof Error ? error.message : "Failed to set turn");
    } finally {
      setSettingTurn(false);
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
              <Tab icon={<SkipNext />} iconPosition="start" label="Turn Management" />
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

          {/* Turn Management Tab */}
          {activeTab === 2 && (
            <>
              {/* Current Turn Status */}
              {turnStatus && (
                <Paper sx={{ p: 4 }}>
                  <Stack spacing={3}>
                    <Typography variant="h5" fontWeight={700}>
                      Current Turn Status
                    </Typography>

                    <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
                      {/* Current Turn User */}
                      <Paper sx={{ p: 3, flex: 1, bgcolor: "success.light", color: "success.contrastText" }}>
                        <Stack spacing={2} alignItems="center">
                          <Typography variant="overline">Current Turn</Typography>
                          <Avatar
                            src={turnStatus.currentTurnUser?.image}
                            sx={{ width: 80, height: 80 }}
                          >
                            {turnStatus.currentTurnUser?.name?.[0]}
                          </Avatar>
                          <Typography variant="h5" fontWeight={700}>
                            {turnStatus.currentTurnUser?.name || "Unknown"}
                          </Typography>
                          <Typography variant="body2">
                            @{turnStatus.currentTurnUser?.username}
                          </Typography>
                        </Stack>
                      </Paper>

                      {/* Next Turn User */}
                      <Paper sx={{ p: 3, flex: 1, bgcolor: "info.light", color: "info.contrastText" }}>
                        <Stack spacing={2} alignItems="center">
                          <Typography variant="overline">Up Next</Typography>
                          <Avatar
                            src={turnStatus.nextTurnUser?.image}
                            sx={{ width: 64, height: 64 }}
                          >
                            {turnStatus.nextTurnUser?.name?.[0]}
                          </Avatar>
                          <Typography variant="h6" fontWeight={600}>
                            {turnStatus.nextTurnUser?.name || "Unknown"}
                          </Typography>
                          <Typography variant="body2">
                            @{turnStatus.nextTurnUser?.username}
                          </Typography>
                        </Stack>
                      </Paper>
                    </Stack>

                    {/* Advance Turn Button */}
                    <Stack direction="row" spacing={2} justifyContent="center">
                      <Button
                        variant="contained"
                        size="large"
                        startIcon={advancingTurn ? <CircularProgress size={20} /> : <SkipNext />}
                        onClick={advanceTurn}
                        disabled={advancingTurn}
                        sx={{
                          background: "linear-gradient(45deg, #4CAF50 30%, #66BB6A 90%)",
                          px: 4,
                        }}
                      >
                        {advancingTurn ? "Advancing..." : "Advance to Next Turn"}
                      </Button>
                    </Stack>
                  </Stack>
                </Paper>
              )}

              {/* Turn Order List */}
              {turnStatus && turnStatus.turnOrder && (
                <Paper sx={{ p: 4 }}>
                  <Typography variant="h5" fontWeight={700} gutterBottom>
                    Turn Order - Set Specific User's Turn
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
                    Click on any user to set it as their turn
                  </Typography>

                  <Stack spacing={2}>
                    {turnStatus.turnOrder.map((user: any, index: number) => {
                      const isCurrentTurn = user._id === turnStatus.currentTurnUser?._id;
                      const isNextTurn = user._id === turnStatus.nextTurnUser?._id;

                      return (
                        <Paper
                          key={user._id}
                          sx={{
                            p: 2,
                            cursor: "pointer",
                            transition: "all 0.2s",
                            border: isCurrentTurn ? "2px solid" : "1px solid",
                            borderColor: isCurrentTurn ? "success.main" : "divider",
                            bgcolor: isCurrentTurn
                              ? "success.light"
                              : isNextTurn
                              ? "info.light"
                              : "background.paper",
                            "&:hover": {
                              transform: "translateY(-2px)",
                              boxShadow: 3,
                            },
                          }}
                          onClick={() => !settingTurn && setUserTurn(user._id)}
                        >
                          <Stack direction="row" alignItems="center" spacing={2}>
                            <Chip
                              label={index + 1}
                              size="small"
                              color={isCurrentTurn ? "success" : "default"}
                              sx={{ fontWeight: 700 }}
                            />
                            <Avatar src={user.image} sx={{ width: 40, height: 40 }}>
                              {user.name?.[0]}
                            </Avatar>
                            <Stack flex={1}>
                              <Typography variant="body1" fontWeight={600}>
                                {user.name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                @{user.username}
                              </Typography>
                            </Stack>
                            {isCurrentTurn && (
                              <Chip
                                icon={<TouchApp />}
                                label="Current Turn"
                                color="success"
                                size="small"
                              />
                            )}
                            {isNextTurn && !isCurrentTurn && (
                              <Chip label="Up Next" color="info" size="small" />
                            )}
                          </Stack>
                        </Paper>
                      );
                    })}
                  </Stack>
                </Paper>
              )}

              {/* Stats */}
              <Stack direction="row" spacing={3} flexWrap="wrap" useFlexGap>
                <Paper sx={{ p: 3, flex: 1, minWidth: 200 }}>
                  <Typography variant="h4" fontWeight={700} color="primary.main">
                    {turnStatus?.totalMembers || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Members in Turn Order
                  </Typography>
                </Paper>
                <Paper sx={{ p: 3, flex: 1, minWidth: 200 }}>
                  <Typography variant="h4" fontWeight={700} color="success.main">
                    {turnStatus?.currentTurnIndex !== undefined
                      ? turnStatus.currentTurnIndex + 1
                      : 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Current Turn Position
                  </Typography>
                </Paper>
                <Paper sx={{ p: 3, flex: 1, minWidth: 200 }}>
                  <Typography variant="h4" fontWeight={700} sx={{ color: "#9c27b0" }}>
                    {turnStatus?.groupName || "N/A"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Group Name
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
