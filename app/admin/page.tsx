"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { 
  Users, 
  Globe, 
  Flag, 
  Eye, 
  Search, 
  ShieldAlert, 
  CheckCircle, 
  ExternalLink, 
  Lock,
  ArrowRight,
  ShieldCheck,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function AdminPage() {
  const router = useRouter();
  const [isAdminAuthenticated, setIsAdminAuthenticated] = React.useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = React.useState(true);

  // Admin login form state
  const [adminEmail, setAdminEmail] = React.useState("isreeharim@gmail.com");
  const [adminPassword, setAdminPassword] = React.useState("812940");
  const [loginError, setLoginError] = React.useState<string | null>(null);
  const [isSubmittingLogin, setIsSubmittingLogin] = React.useState(false);

  // Admin data
  const [usersList, setUsersList] = React.useState<any[]>([]);
  const [portfoliosList, setPortfoliosList] = React.useState<any[]>([]);
  const [reportsList, setReportsList] = React.useState<any[]>([]);
  const [userSearch, setUserSearch] = React.useState("");

  // Check auth session
  React.useEffect(() => {
    async function checkAdmin() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

          if (profile && profile.role === "admin") {
            setIsAdminAuthenticated(true);
            loadAdminData();
            return;
          }
        }
      } catch (err) {
        console.warn("Admin check:", err);
      } finally {
        setIsLoadingAuth(false);
      }
    }
    checkAdmin();
  }, []);

  const loadAdminData = async () => {
    try {
      const supabase = createClient();

      const [profilesRes, portfoliosRes, reportsRes] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("portfolios").select("*, profiles(display_name, username)").order("created_at", { ascending: false }),
        supabase.from("content_reports").select("*, portfolios(slug)").order("created_at", { ascending: false }),
      ]);

      if (profilesRes.data) setUsersList(profilesRes.data);
      if (portfoliosRes.data) setPortfoliosList(portfoliosRes.data);
      if (reportsRes.data) setReportsList(reportsRes.data);
    } catch (err) {
      console.warn("Failed to load admin data:", err);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    try {
      setIsSubmittingLogin(true);
      const supabase = createClient();

      const { data, error } = await supabase.auth.signInWithPassword({
        email: adminEmail.trim(),
        password: adminPassword,
      });

      if (error) throw error;

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      if (profile && profile.role === "admin") {
        setIsAdminAuthenticated(true);
        toast.success("Administrator access granted!");
        loadAdminData();
      } else {
        throw new Error("Access denied. This account does not have administrator privileges.");
      }
    } catch (err: any) {
      setLoginError(err.message || "Admin authentication failed.");
    } finally {
      setIsSubmittingLogin(false);
    }
  };

  const handleToggleSuspend = async (userId: string, currentStatus: boolean) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .update({ is_suspended: !currentStatus })
        .eq("id", userId);

      if (error) throw error;

      toast.success(currentStatus ? "User reactivated" : "User suspended");
      setUsersList((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_suspended: !currentStatus } : u))
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to update user status");
    }
  };

  const handleTogglePortfolioPublish = async (portfolioId: string, currentStatus: boolean) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("portfolios")
        .update({ is_published: !currentStatus })
        .eq("id", portfolioId);

      if (error) throw error;

      toast.success(currentStatus ? "Portfolio unlisted" : "Portfolio published");
      setPortfoliosList((prev) =>
        prev.map((p) => (p.id === portfolioId ? { ...p, is_published: !currentStatus } : p))
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to update portfolio visibility");
    }
  };

  const handleResolveReport = async (reportId: string, action: "resolved" | "dismissed") => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("content_reports")
        .update({ status: action })
        .eq("id", reportId);

      if (error) throw error;

      toast.success(`Report ${action}`);
      setReportsList((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status: action } : r))
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to update report");
    }
  };

  // Filtered users
  const filteredUsers = usersList.filter(
    (u) =>
      u.username?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.display_name?.toLowerCase().includes(userSearch.toLowerCase())
  );

  if (isLoadingAuth) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-6 h-6 animate-spin text-gray-500" />
      </div>
    );
  }

  // If not authenticated as admin, render login card
  if (!isAdminAuthenticated) {
    return (
      <div className="max-w-md mx-auto py-12">
        <Card className="border-gray-300 shadow-xl rounded-2xl bg-white">
          <CardHeader className="text-center space-y-2">
            <span className="text-3xl mx-auto">🛡️</span>
            <p className="text-[10px] font-bold tracking-widest uppercase text-gray-500">
              RESTRICTED ACCESS
            </p>
            <CardTitle className="font-serif text-2xl">Admin Portal</CardTitle>
            <CardDescription className="text-xs">
              Sign in with an authorized administrator account.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Admin Email</label>
                <Input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Password</label>
                <Input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                />
              </div>

              {loginError && (
                <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600 font-medium">
                  {loginError}
                </div>
              )}

              <Button
                type="submit"
                disabled={isSubmittingLogin}
                className="w-full bg-gray-900 hover:bg-black text-white rounded-xl gap-1"
              >
                {isSubmittingLogin ? "Authenticating..." : "Sign In to Admin Center"}
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Admin Dashboard Content
  return (
    <div className="space-y-8">
      {/* Top Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-gray-300 p-5 bg-white shadow-xs">
          <div className="flex items-center justify-between text-gray-500 text-xs mb-2">
            <span>Total Registered Users</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 font-serif">{usersList.length}</p>
        </Card>

        <Card className="border-gray-300 p-5 bg-white shadow-xs">
          <div className="flex items-center justify-between text-gray-500 text-xs mb-2">
            <span>Total Portfolios</span>
            <Globe className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 font-serif">{portfoliosList.length}</p>
        </Card>

        <Card className="border-gray-300 p-5 bg-white shadow-xs">
          <div className="flex items-center justify-between text-gray-500 text-xs mb-2">
            <span>Pending Reports</span>
            <Flag className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 font-serif">
            {reportsList.filter((r) => r.status === "pending").length}
          </p>
        </Card>
      </div>

      {/* Admin Tabs */}
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="bg-gray-200 p-1 rounded-xl h-11">
          <TabsTrigger value="users" className="rounded-lg text-xs font-semibold gap-1.5">
            <Users className="w-3.5 h-3.5" />
            <span>User Management ({usersList.length})</span>
          </TabsTrigger>
          <TabsTrigger value="portfolios" className="rounded-lg text-xs font-semibold gap-1.5">
            <Globe className="w-3.5 h-3.5" />
            <span>Portfolios ({portfoliosList.length})</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="rounded-lg text-xs font-semibold gap-1.5">
            <Flag className="w-3.5 h-3.5" />
            <span>Content Reports ({reportsList.length})</span>
          </TabsTrigger>
        </TabsList>

        {/* 1. USERS TAB */}
        <TabsContent value="users" className="space-y-4 pt-4">
          <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-300">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by username or display name..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="w-full text-xs text-gray-900 focus:outline-none bg-transparent"
            />
          </div>

          <div className="bg-white rounded-xl border border-gray-300 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs text-gray-700">
              <thead className="bg-gray-100 border-b border-gray-300 text-gray-600 uppercase font-semibold">
                <tr>
                  <th className="p-3.5">User</th>
                  <th className="p-3.5">Role</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Created</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="p-3.5">
                      <p className="font-bold text-gray-900">{user.display_name}</p>
                      <p className="text-[11px] text-gray-500 font-mono">@{user.username}</p>
                    </td>
                    <td className="p-3.5">
                      <Badge variant={user.role === "admin" ? "default" : "outline"} className="text-[10px]">
                        {user.role}
                      </Badge>
                    </td>
                    <td className="p-3.5">
                      {user.is_suspended ? (
                        <span className="text-red-600 font-semibold text-[11px]">Suspended</span>
                      ) : (
                        <span className="text-emerald-600 font-semibold text-[11px]">Active</span>
                      )}
                    </td>
                    <td className="p-3.5 text-gray-500 text-[11px]">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-3.5 text-right">
                      {user.role !== "admin" && (
                        <Button
                          size="sm"
                          variant={user.is_suspended ? "outline" : "destructive"}
                          onClick={() => handleToggleSuspend(user.id, user.is_suspended)}
                          className="text-xs h-7 px-2.5 rounded-lg"
                        >
                          {user.is_suspended ? "Unsuspend" : "Suspend"}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* 2. PORTFOLIOS TAB */}
        <TabsContent value="portfolios" className="space-y-4 pt-4">
          <div className="bg-white rounded-xl border border-gray-300 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs text-gray-700">
              <thead className="bg-gray-100 border-b border-gray-300 text-gray-600 uppercase font-semibold">
                <tr>
                  <th className="p-3.5">Title / Owner</th>
                  <th className="p-3.5">Slug</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {portfoliosList.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="p-3.5">
                      <p className="font-bold text-gray-900">{p.title || "Untitled"}</p>
                      <p className="text-[11px] text-gray-500">{p.profiles?.display_name || "Unknown"}</p>
                    </td>
                    <td className="p-3.5 font-mono text-gray-600">/{p.slug}</td>
                    <td className="p-3.5">
                      {p.is_published ? (
                        <Badge variant="success" className="text-[10px]">Published</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px]">Draft</Badge>
                      )}
                    </td>
                    <td className="p-3.5 text-right space-x-2">
                      <a href={`/${p.slug}`} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="ghost" className="text-xs h-7 px-2">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Button>
                      </a>
                      <Button
                        size="sm"
                        variant={p.is_published ? "outline" : "default"}
                        onClick={() => handleTogglePortfolioPublish(p.id, p.is_published)}
                        className="text-xs h-7 px-2.5 rounded-lg"
                      >
                        {p.is_published ? "Unlist" : "Publish"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* 3. REPORTS TAB */}
        <TabsContent value="reports" className="space-y-4 pt-4">
          <div className="bg-white rounded-xl border border-gray-300 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs text-gray-700">
              <thead className="bg-gray-100 border-b border-gray-300 text-gray-600 uppercase font-semibold">
                <tr>
                  <th className="p-3.5">Portfolio</th>
                  <th className="p-3.5">Reason</th>
                  <th className="p-3.5">Details</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reportsList.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="p-3.5 font-mono font-bold">/{r.portfolios?.slug || "unknown"}</td>
                    <td className="p-3.5 font-semibold text-gray-900">{r.reason}</td>
                    <td className="p-3.5 text-gray-500 max-w-xs truncate">{r.details || "—"}</td>
                    <td className="p-3.5">
                      <Badge
                        variant={r.status === "resolved" ? "success" : r.status === "dismissed" ? "outline" : "secondary"}
                        className="text-[10px]"
                      >
                        {r.status}
                      </Badge>
                    </td>
                    <td className="p-3.5 text-right space-x-2">
                      {r.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleResolveReport(r.id, "resolved")}
                            className="text-xs h-7 px-2 rounded-lg"
                          >
                            Resolve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleResolveReport(r.id, "dismissed")}
                            className="text-xs h-7 px-2 rounded-lg"
                          >
                            Dismiss
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
                {reportsList.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-xs text-gray-400">
                      No reports in the queue.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
