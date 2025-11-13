import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Users, CreditCard, Package, TrendingUp, Loader2, RefreshCw, Plus, Minus, Search } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import {
  fetchAdminStats,
  fetchAdminUsersWithCredits,
  adjustUserCredits,
  fetchAdminOrders,
  fetchCreditTransactions,
  type AdminUserRow,
  type AdminStats,
  type AdminOrder,
  type CreditTransaction,
} from "@/services/api/admin";

export default function AdminDashboardControl() {
  const auth = useAuth() || { user: null, isAdmin: false, loading: false };
  const { user, isAdmin, loading } = auth;

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);

  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("overview");

  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUserRow | null>(null);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustType, setAdjustType] = useState<"add" | "subtract">("add");
  const [adjustReason, setAdjustReason] = useState("");
  const [adjusting, setAdjusting] = useState(false);

  useEffect(() => {
    if (!loading && user && isAdmin) {
      loadStats();
    }
  }, [loading, user, isAdmin]);

  useEffect(() => {
    if (activeTab === "users" && users.length === 0) {
      loadUsers();
    } else if (activeTab === "orders" && orders.length === 0) {
      loadOrders();
    } else if (activeTab === "transactions" && transactions.length === 0) {
      loadTransactions();
    }
  }, [activeTab]);

  const loadStats = async () => {
    setLoadingStats(true);
    try {
      const data = await fetchAdminStats();
      setStats(data);
    } catch (error) {
      console.error("Error loading stats:", error);
      toast.error("Failed to load dashboard stats");
    } finally {
      setLoadingStats(false);
    }
  };

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const data = await fetchAdminUsersWithCredits(searchQuery);
      setUsers(data);
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadOrders = async () => {
    setLoadingOrders(true);
    try {
      const data = await fetchAdminOrders({ status: statusFilter });
      setOrders(data);
    } catch (error) {
      console.error("Error loading orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setLoadingOrders(false);
    }
  };

  const loadTransactions = async () => {
    setLoadingTransactions(true);
    try {
      const data = await fetchCreditTransactions();
      setTransactions(data);
    } catch (error) {
      console.error("Error loading transactions:", error);
      toast.error("Failed to load transactions");
    } finally {
      setLoadingTransactions(false);
    }
  };

  const handleAdjustCredits = async () => {
    if (!selectedUser || !adjustAmount || !adjustReason.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    const amount = parseInt(adjustAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    const delta = adjustType === "add" ? amount : -amount;

    setAdjusting(true);
    try {
      const result = await adjustUserCredits(selectedUser.id, delta, adjustReason);

      if (result.success) {
        toast.success(`Credits ${adjustType === "add" ? "added" : "subtracted"} successfully`);
        setAdjustModalOpen(false);
        setAdjustAmount("");
        setAdjustReason("");
        setSelectedUser(null);
        loadUsers();
      } else {
        toast.error(result.error || "Failed to adjust credits");
      }
    } catch (error) {
      console.error("Error adjusting credits:", error);
      toast.error("An error occurred");
    } finally {
      setAdjusting(false);
    }
  };

  const openAdjustModal = (user: AdminUserRow) => {
    setSelectedUser(user);
    setAdjustModalOpen(true);
    setAdjustAmount("");
    setAdjustReason("");
    setAdjustType("add");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-slate-500">
        Loading...
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Admin Dashboard</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Manage users, credits, and orders.</p>
        </div>

        {loadingStats ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="w-4 h-4 text-slate-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Credits Outstanding</CardTitle>
                <CreditCard className="w-4 h-4 text-slate-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalCreditsOutstanding}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <Package className="w-4 h-4 text-slate-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalOrders}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Orders Today</CardTitle>
                <TrendingUp className="w-4 h-4 text-slate-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.ordersToday}</div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Quick Links</CardTitle>
                <CardDescription>Navigate to different sections</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" onClick={() => setActiveTab("users")} className="h-auto py-4">
                  <div className="text-left">
                    <div className="font-semibold">Users & Credits</div>
                    <div className="text-sm text-muted-foreground">Manage user accounts and balances</div>
                  </div>
                </Button>
                <Button variant="outline" onClick={() => setActiveTab("orders")} className="h-auto py-4">
                  <div className="text-left">
                    <div className="font-semibold">Orders</div>
                    <div className="text-sm text-muted-foreground">View and manage orders</div>
                  </div>
                </Button>
                <Button variant="outline" onClick={() => setActiveTab("transactions")} className="h-auto py-4">
                  <div className="text-left">
                    <div className="font-semibold">Transactions</div>
                    <div className="text-sm text-muted-foreground">View credit transaction history</div>
                  </div>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Users & Credits</CardTitle>
                    <CardDescription>{users.length} users</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative w-64">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by email or name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                    <Button onClick={loadUsers} size="sm" variant="outline">
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Refresh
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loadingUsers ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                  </div>
                ) : users.length === 0 ? (
                  <Alert>
                    <AlertDescription>No users found</AlertDescription>
                  </Alert>
                ) : (
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead className="text-right">Credits</TableHead>
                          <TableHead>Last Login</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.name || "N/A"}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded text-xs ${user.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-800'}`}>
                                {user.role || "user"}
                              </span>
                            </TableCell>
                            <TableCell className="text-right font-semibold">{user.credits}</TableCell>
                            <TableCell>{user.last_login ? new Date(user.last_login).toLocaleDateString() : "Never"}</TableCell>
                            <TableCell className="text-right">
                              <Button onClick={() => openAdjustModal(user)} size="sm" variant="outline">
                                Adjust Credits
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Orders</CardTitle>
                    <CardDescription>{orders.length} orders</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={loadOrders} size="sm" variant="outline">
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Refresh
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loadingOrders ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                  </div>
                ) : orders.length === 0 ? (
                  <Alert>
                    <AlertDescription>No orders found</AlertDescription>
                  </Alert>
                ) : (
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order ID</TableHead>
                          <TableHead>User Email</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead className="text-right">Images</TableHead>
                          <TableHead className="text-right">Credits</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orders.map((order) => (
                          <TableRow key={order.id}>
                            <TableCell className="font-mono text-xs">{order.id.slice(0, 8)}...</TableCell>
                            <TableCell>{order.user_email}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded text-xs ${
                                order.status === 'completed' ? 'bg-green-100 text-green-800' :
                                order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                order.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {order.status}
                              </span>
                            </TableCell>
                            <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                            <TableCell className="text-right">{order.total_images}</TableCell>
                            <TableCell className="text-right">{order.credits_used}</TableCell>
                            <TableCell className="text-right">
                              <Link to={`/admin/orders/${order.id}`}>
                                <Button size="sm" variant="ghost">View</Button>
                              </Link>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Credit Transactions</CardTitle>
                    <CardDescription>{transactions.length} transactions</CardDescription>
                  </div>
                  <Button onClick={loadTransactions} size="sm" variant="outline">
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingTransactions ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                  </div>
                ) : transactions.length === 0 ? (
                  <Alert>
                    <AlertDescription>No transactions found</AlertDescription>
                  </Alert>
                ) : (
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>User Email</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead className="text-right">Change</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead className="text-right">New Balance</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.map((txn) => (
                          <TableRow key={txn.id}>
                            <TableCell>{new Date(txn.created_at).toLocaleString()}</TableCell>
                            <TableCell>{txn.user_email}</TableCell>
                            <TableCell>
                              <span className="px-2 py-1 rounded text-xs bg-slate-100 text-slate-800">
                                {txn.transaction_type}
                              </span>
                            </TableCell>
                            <TableCell className={`text-right font-semibold ${txn.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {txn.amount > 0 ? '+' : ''}{txn.amount}
                            </TableCell>
                            <TableCell className="max-w-xs truncate">{txn.description || "N/A"}</TableCell>
                            <TableCell className="text-right font-semibold">{txn.balance_after}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={adjustModalOpen} onOpenChange={setAdjustModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Credits</DialogTitle>
            <DialogDescription>
              {selectedUser && (
                <>
                  {selectedUser.name || "User"} ({selectedUser.email})<br />
                  Current balance: <span className="font-semibold">{selectedUser.credits} credits</span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Action</Label>
              <Select value={adjustType} onValueChange={(v) => setAdjustType(v as "add" | "subtract")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">
                    <div className="flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      Add Credits
                    </div>
                  </SelectItem>
                  <SelectItem value="subtract">
                    <div className="flex items-center gap-2">
                      <Minus className="w-4 h-4" />
                      Subtract Credits
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                min="1"
                placeholder="Enter amount"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason (required)</Label>
              <Textarea
                id="reason"
                placeholder="Enter reason for adjustment"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustModalOpen(false)} disabled={adjusting}>
              Cancel
            </Button>
            <Button onClick={handleAdjustCredits} disabled={adjusting}>
              {adjusting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {adjustType === "add" ? "Add" : "Subtract"} Credits
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
