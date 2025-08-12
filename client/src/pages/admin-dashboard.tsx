import { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from "recharts";
import { 
  Users, 
  BookOpen, 
  DollarSign, 
  TrendingUp,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  Download,
  Settings,
  UserPlus,
  GraduationCap,
  FileText,
  Database,
  Bell,
  Mail,
  Shield,
  Activity,
  BarChart3,
  Edit,
  Search,
  Filter,
  RefreshCw,
  MessageSquare,
  Phone,
  CreditCard,
  Banknote,
  PlusCircle,
  Eye,
  Star,
  Globe,
  Lock,
  Key,
  CloudDownload,
  FileSpreadsheet,
  Printer,
  Trash2,
  LogOut,
  Home,
  UserCheck,
  Receipt,
  X,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Target,
  Award,
  TrendingDown,
  MoreVertical
} from "lucide-react";
import type { EnrollmentWithDetails, InquiryWithCourse, Course } from "@shared/schema";
import { BATCHES } from "@shared/schema";
import StudentManagement from "@/components/student-management";
import ExportReports from "@/components/export-reports";
import ChangeWebsitePassword from "@/components/change-website-password";
import ChangeAdminPassword from "@/components/change-admin-password";
import PerformanceDashboard from "@/components/performance-dashboard";
import { apiRequest } from "@/lib/queryClient";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";

interface DashboardStats {
  totalInquiries: number;
  enrolledStudents: number;
  pendingInquiries: number;
  totalRevenue: number;
  pendingFees: number;
  monthlyRevenue: number;
}

interface ChartData {
  name: string;
  value: number;
  growth?: number;
  enrollments?: number;
  revenue?: number;
}

const CHART_COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AdminDashboard() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [showExportReports, setShowExportReports] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState('');
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [systemAlerts, setSystemAlerts] = useState<any[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<any>({});
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [courseForm, setCourseForm] = useState({
    name: "",
    code: "",
    duration: "",
    fullFee: "",
    installmentFee: "",
    installment1: "", // Added
    installment2: "", // Added
    feePlans: "[]",
    description: ""
  });

  const queryClient = useQueryClient();

  // Check authentication on component mount
  useEffect(() => {
    const isAuthenticated = localStorage.getItem('admin_auth');
    if (!isAuthenticated) {
      toast({
        title: "Access Denied",
        description: "Please login to access admin dashboard",
        variant: "destructive",
      });
      setLocation('/admin-login');
    }
  }, [setLocation, toast]);

  // Auto-refresh data every 30 seconds
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery<DashboardStats>({
    queryKey: ["/api/stats"],
    refetchInterval: 30000, // Refresh every 30 seconds
    refetchIntervalInBackground: true,
  });

  const { data: enrollments, isLoading: enrollmentsLoading, refetch: refetchEnrollments } = useQuery<EnrollmentWithDetails[]>({
    queryKey: ["/api/enrollments"],
    refetchInterval: 30000,
    refetchIntervalInBackground: true,
  });

  const { data: inquiries, isLoading: inquiriesLoading, refetch: refetchInquiries } = useQuery<InquiryWithCourse[]>({
    queryKey: ["/api/inquiries"], 
    refetchInterval: 30000,
    refetchIntervalInBackground: true,
  });

  const { data: courses, isLoading: coursesLoading, refetch: refetchCourses } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
    refetchInterval: 60000, // Courses change less frequently
    refetchIntervalInBackground: true,
  });

  // Manual refresh function
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchStats(),
        refetchEnrollments(),
        refetchInquiries(),
        refetchCourses()
      ]);

      // Add notification for successful refresh
      const newNotification = {
        id: Date.now(),
        title: "Data Refreshed",
        message: "All dashboard data has been updated successfully",
        type: "success",
        timestamp: new Date()
      };
      setNotifications(prev => [newNotification, ...prev.slice(0, 9)]);

      toast({
        title: "Data Refreshed",
        description: "All data has been updated successfully",
      });
    } catch (error) {
      const errorNotification = {
        id: Date.now(),
        title: "Refresh Failed",
        message: "Unable to update dashboard data",
        type: "error",
        timestamp: new Date()
      };
      setNotifications(prev => [errorNotification, ...prev.slice(0, 9)]);

      toast({
        title: "Refresh Failed",
        description: "Failed to refresh data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  }, [refetchStats, refetchEnrollments, refetchInquiries, refetchCourses, toast]);

  // System monitoring and alerts
  useEffect(() => {
    const checkSystemHealth = () => {
      const alerts = [];

      // Check for pending inquiries
      if (stats && stats.pendingInquiries > 5) {
        alerts.push({
          id: 'pending_inquiries',
          type: 'warning',
          title: 'High Pending Inquiries',
          message: `${stats.pendingInquiries} inquiries need attention`,
          action: () => setActiveTab('inquiries')
        });
      }

      // Check for pending fees
      if (stats && stats.pendingFees > 50000) {
        alerts.push({
          id: 'pending_fees',
          type: 'error',
          title: 'High Pending Fees',
          message: `₹${stats.pendingFees.toLocaleString()} in pending payments`,
          action: () => setActiveTab('students')
        });
      }

      setSystemAlerts(alerts);
    };

    if (stats) {
      checkSystemHealth();
    }
  }, [stats]);

  // Activity tracking
  useEffect(() => {
    const activities: any[] = [];

    if (enrollments && enrollments.length > 0) {
      enrollments.slice(0, 3).forEach(enrollment => {
        activities.push({
          id: `enroll_${enrollment.id}`,
          type: 'enrollment',
          message: `${enrollment.studentName} enrolled in ${enrollment.course?.name}`,
          timestamp: enrollment.startDate ? new Date(enrollment.startDate) : new Date(),
          icon: UserCheck
        });
      });
    }

    if (inquiries && inquiries.length > 0) {
      inquiries.slice(0, 3).forEach(inquiry => {
        activities.push({
          id: `inquiry_${inquiry.id}`,
          type: 'inquiry',
          message: `New inquiry from ${inquiry.studentName}`,
          timestamp: inquiry.createdAt ? new Date(inquiry.createdAt) : new Date(),
          icon: MessageSquare
        });
      });
    }

    setRecentActivity(activities.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ).slice(0, 5));
  }, [enrollments, inquiries]);

  // Chart data processing
  const getChartData = useCallback(() => {
    if (!enrollments || !courses) return [];

    const courseData: ChartData[] = courses.map(course => {
      const courseEnrollments = enrollments.filter(e => e.courseId === course.id);
      const revenue = courseEnrollments.reduce((sum, e) => {
        const payments = e.payments?.reduce((pSum: number, p: any) => pSum + parseFloat(p.amount.toString()), 0) || 0;
        return sum + payments;
      }, 0);

      return {
        name: course.name.substring(0, 15) + (course.name.length > 15 ? '...' : ''),
        value: courseEnrollments.length,
        enrollments: courseEnrollments.length,
        revenue: revenue
      };
    });

    return courseData.filter(d => d.value > 0);
  }, [enrollments, courses]);

  const getRevenueChartData = useCallback(() => {
    if (!enrollments) return [];

    const monthlyData: { [key: string]: { enrollments: number; revenue: number } } = {};

    enrollments.forEach(enrollment => {
      const month = new Date(enrollment.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      if (!monthlyData[month]) {
        monthlyData[month] = { enrollments: 0, revenue: 0 };
      }
      monthlyData[month].enrollments += 1;

      const revenue = enrollment.payments?.reduce((sum: number, p: any) => sum + parseFloat(p.amount.toString()), 0) || 0;
      monthlyData[month].revenue += revenue;
    });

    return Object.entries(monthlyData)
      .map(([name, data]) => ({ name, ...data }))
      .slice(-6);
  }, [enrollments]);

  // Course management mutations
  const createCourseMutation = useMutation({
    mutationFn: async (courseData: any) => {
      await apiRequest("POST", "/api/courses", courseData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      setShowAddCourse(false);
      resetCourseForm();
      toast({
        title: "Course Created",
        description: "New course has been added successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create course. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateCourseMutation = useMutation({
    mutationFn: async ({ id, courseData }: { id: string; courseData: any }) => {
      await apiRequest("PATCH", `/api/courses/${id}`, courseData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      setEditingCourse(null);
      resetCourseForm();
      toast({
        title: "Course Updated",
        description: "Course has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update course. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteCourseMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/courses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      toast({
        title: "Course Deleted",
        description: "Course has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete course. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetCourseForm = () => {
    setCourseForm({
      name: "",
      code: "",
      duration: "",
      fullFee: "",
      installmentFee: "",
      installment1: "", // Added
      installment2: "", // Added
      description: "",
      feePlans: JSON.stringify([
        {
          name: "Full Payment",
          amount: 0,
          description: "Complete payment at enrollment"
        },
        {
          name: "Monthly Plan",
          installments: [
            { month: 0, amount: 0 },
            { month: 1, amount: 0 },
            { month: 2, amount: 0 }
          ],
          totalAmount: 0,
          description: "Pay in monthly installments"
        }
      ])
    });
  };

  const handleCourseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const courseData = {
      name: courseForm.name,
      code: courseForm.code,
      duration: parseInt(courseForm.duration),
      fullFee: parseFloat(courseForm.fullFee),
      installmentFee: parseFloat(courseForm.installmentFee),
      installment1: parseFloat(courseForm.installment1 || '0'), // Added
      installment2: parseFloat(courseForm.installment2 || '0'), // Added
      feePlans: JSON.parse(courseForm.feePlans || "[]"),
      description: courseForm.description
    };

    if (editingCourse) {
      updateCourseMutation.mutate({ id: editingCourse.id, courseData });
    } else {
      createCourseMutation.mutate(courseData);
    }
  };

  // Student and inquiry management mutations
  const deleteEnrollmentMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/enrollments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Student Deleted",
        description: "Student enrollment has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete student. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteInquiryMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/inquiries/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inquiries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Inquiry Deleted",
        description: "Inquiry has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete inquiry. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateInquiryStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await apiRequest("PATCH", `/api/inquiries/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inquiries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Status Updated",
        description: "Inquiry status has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update status. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleEditCourse = (course: Course) => {
    setCourseForm({
      name: course.name,
      code: course.code,
      duration: course.duration.toString(),
      fullFee: course.fullFee.toString(),
      installmentFee: course.installmentFee.toString(),
      installment1: course.installment1?.toString() || "", // Added
      installment2: course.installment2?.toString() || "", // Added
      feePlans: JSON.stringify(course.feePlans || []),
      description: course.description || ""
    });
    setEditingCourse(course);
    setShowAddCourse(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_auth');
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully",
    });
    setLocation('/admin-login');
  };

  // Enhanced stats calculations
  const quickStats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonth = new Date(currentYear, currentMonth - 1);

    const thisMonthEnrollments = enrollments?.filter(e => {
      const enrollDate = new Date(e.startDate);
      return enrollDate.getMonth() === currentMonth && enrollDate.getFullYear() === currentYear;
    }).length || 0;

    const lastMonthEnrollments = enrollments?.filter(e => {
      const enrollDate = new Date(e.startDate);
      return enrollDate.getMonth() === lastMonth.getMonth() && enrollDate.getFullYear() === lastMonth.getFullYear();
    }).length || 0;

    const enrollmentGrowth = lastMonthEnrollments > 0 
      ? ((thisMonthEnrollments - lastMonthEnrollments) / lastMonthEnrollments) * 100 
      : thisMonthEnrollments > 0 ? 100 : 0;

    const totalRevenue = enrollments?.reduce((sum, e) => {
      const payments = e.payments?.reduce((pSum: number, p: any) => pSum + parseFloat(p.amount.toString()), 0) || 0;
      return sum + payments;
    }, 0) || 0;

    const pendingFees = enrollments?.reduce((sum, e) => {
      const totalFee = parseFloat(e.totalFee.toString());
      const paidAmount = e.payments?.reduce((pSum: number, p: any) => pSum + parseFloat(p.amount.toString()), 0) || 0;
      return sum + Math.max(0, totalFee - paidAmount);
    }, 0) || 0;

    return {
      totalStudents: enrollments?.length || 0,
      activeInquiries: inquiries?.filter(i => i.status === 'pending').length || 0,
      totalCourses: courses?.length || 0,
      thisMonthEnrollments,
      enrollmentGrowth,
      totalRevenue,
      pendingFees,
      completionRate: enrollments?.length ? 
        ((enrollments.length / (inquiries?.length || 1)) * 100).toFixed(1) : '0'
    };
  }, [enrollments, inquiries, courses]);

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const chartData = getChartData();
  const revenueData = getRevenueChartData();

  // Filtered data based on search
  const filteredInquiries = inquiries?.filter(inquiry =>
    inquiry.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inquiry.course?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inquiry.contactNo.includes(searchTerm)
  );

  const filteredEnrollments = enrollments?.filter(enrollment =>
    enrollment.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    enrollment.course?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    enrollment.contactNo.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 dark:from-gray-900 dark:via-blue-950/20 dark:to-purple-950/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Enhanced Header */}
        <motion.div 
          className="mb-8"
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
        >
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white p-6 rounded-2xl shadow-xl relative overflow-hidden">
            {/* Simple Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: 'radial-gradient(circle at 25% 25%, white 2px, transparent 2px)',
                backgroundSize: '24px 24px'
              }}></div>
            </div>

            <div className="relative z-10">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <motion.div 
                    className="bg-white/20 p-3 rounded-xl backdrop-blur-sm"
                    whileHover={{ scale: 1.05, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300, damping: 10 }}
                  >
                    <Settings className="h-8 w-8 text-white" />
                  </motion.div>
                  <div>
                    <motion.h1 
                      className="text-3xl lg:text-4xl font-bold"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      Admin Dashboard
                    </motion.h1>
                    <motion.p 
                      className="text-blue-100 text-lg"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      Santmegh Computer Education Management
                    </motion.p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Refresh Button */}
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
                    onClick={handleRefresh}
                    disabled={refreshing}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>

                  {/* Notifications */}
                  <div className="relative">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
                      onClick={() => setShowNotifications(!showNotifications)}
                    >
                      <Bell className="h-4 w-4 mr-2" />
                      Alerts
                      {(notifications.length > 0 || systemAlerts.length > 0) && (
                        <Badge className="ml-2 bg-red-500 text-white text-xs px-1 py-0">
                          {notifications.length + systemAlerts.length}
                        </Badge>
                      )}
                    </Button>

                    {showNotifications && (
                      <motion.div 
                        className="absolute right-0 top-full mt-2 w-80 bg-white/95 backdrop-blur-sm rounded-lg shadow-xl border z-50"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-gray-900">Notifications</h3>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => setShowNotifications(false)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>

                          <ScrollArea className="max-h-64">
                            {/* System Alerts */}
                            {systemAlerts.map((alert) => (
                              <div 
                                key={alert.id} 
                                className={`p-3 mb-2 rounded-lg cursor-pointer hover:opacity-80 ${
                                  alert.type === 'error' ? 'bg-red-50 border-l-4 border-red-500' : 
                                  alert.type === 'warning' ? 'bg-yellow-50 border-l-4 border-yellow-500' : 
                                  'bg-blue-50 border-l-4 border-blue-500'
                                }`}
                                onClick={alert.action}
                              >
                                <div className="font-medium text-sm text-gray-900">{alert.title}</div>
                                <div className="text-xs text-gray-600">{alert.message}</div>
                              </div>
                            ))}

                            {/* Recent Notifications */}
                            {notifications.map((notification) => (
                              <div 
                                key={notification.id} 
                                className={`p-3 mb-2 rounded-lg ${
                                  notification.type === 'success' ? 'bg-green-50' : 
                                  notification.type === 'error' ? 'bg-red-50' : 'bg-blue-50'
                                }`}
                              >
                                <div className="font-medium text-sm text-gray-900">{notification.title}</div>
                                <div className="text-xs text-gray-600">{notification.message}</div>
                                <div className="text-xs text-gray-400 mt-1">
                                  {notification.timestamp.toLocaleTimeString()}
                                </div>
                              </div>
                            ))}

                            {notifications.length === 0 && systemAlerts.length === 0 && (
                              <div className="text-center text-gray-500 py-4">
                                No notifications
                              </div>
                            )}
                          </ScrollArea>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Export Reports */}
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
                    onClick={() => setShowExportReports(true)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>

                  {/* Quick Add */}
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
                    onClick={() => setShowAddCourse(true)}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Quick Add
                  </Button>

                  <Button 
                    variant="outline" 
                    size="sm"
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
                    onClick={() => setLocation('/')}
                  >
                    <Home className="h-4 w-4 mr-2" />
                    Home
                  </Button>

                  <Button 
                    variant="outline" 
                    size="sm"
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Quick Stats Cards */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.div variants={fadeInUp}>
            <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Students</p>
                    <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{quickStats.totalStudents}</p>
                    <div className="flex items-center mt-2">
                      <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                      <span className="text-sm text-green-600 font-medium">Active</span>
                    </div>
                  </div>
                  <div className="bg-blue-500/20 p-4 rounded-full">
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-blue-600"></div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/50 dark:to-orange-900/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-700 dark:text-orange-300">Active Inquiries</p>
                    <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">{quickStats.activeInquiries}</p>
                    <div className="flex items-center mt-2">
                      <Clock className="h-4 w-4 text-orange-600 mr-1" />
                      <span className="text-sm text-orange-600 font-medium">Pending</span>
                    </div>
                  </div>
                  <div className="bg-orange-500/20 p-4 rounded-full">
                    <MessageSquare className="h-8 w-8 text-orange-600" />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-orange-600"></div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-700 dark:text-green-300">Total Courses</p>
                    <p className="text-3xl font-bold text-green-900 dark:text-green-100">{quickStats.totalCourses}</p>
                    <div className="flex items-center mt-2">
                      <BookOpen className="h-4 w-4 text-green-600 mr-1" />
                      <span className="text-sm text-green-600 font-medium">Available</span>
                    </div>
                  </div>
                  <div className="bg-green-500/20 p-4 rounded-full">
                    <BookOpen className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-green-600"></div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Revenue</p>
                    <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">₹{quickStats.totalRevenue.toLocaleString()}</p>
                    <div className="flex items-center mt-2">
                      <DollarSign className="h-4 w-4 text-purple-600 mr-1" />
                      <span className="text-sm text-purple-600 font-medium">Total</span>
                    </div>
                  </div>
                  <div className="bg-purple-500/20 p-4 rounded-full">
                    <DollarSign className="h-8 w-8 text-purple-600" />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-purple-600"></div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          className="mb-6"
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          transition={{ delay: 0.3 }}
        >
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search students, courses, or inquiries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/80 backdrop-blur-sm border-0 shadow-lg"
              />
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-white/80 backdrop-blur-sm">
                Last updated: {new Date().toLocaleTimeString()}
              </Badge>
            </div>
          </div>
        </motion.div>

        {/* Main Dashboard Tabs */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          transition={{ delay: 0.4 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg h-auto p-1">
              <TabsTrigger value="overview" className="flex flex-col items-center gap-1 px-3 py-3 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <BarChart3 className="h-4 w-4" />
                <span className="text-xs">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="students" className="flex flex-col items-center gap-1 px-3 py-3 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <Users className="h-4 w-4" />
                <span className="text-xs">Students</span>
              </TabsTrigger>
              <TabsTrigger value="inquiries" className="flex flex-col items-center gap-1 px-3 py-3 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <MessageSquare className="h-4 w-4" />
                <span className="text-xs">Inquiries</span>
              </TabsTrigger>
              <TabsTrigger value="courses" className="flex flex-col items-center gap-1 px-3 py-3 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <BookOpen className="h-4 w-4" />
                <span className="text-xs">Courses</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex flex-col items-center gap-1 px-3 py-3 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <Activity className="h-4 w-4" />
                <span className="text-xs">Analytics</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex flex-col items-center gap-1 px-3 py-3 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <Settings className="h-4 w-4" />
                <span className="text-xs">Settings</span>
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Performance Dashboard */}
              <PerformanceDashboard 
                stats={stats}
                enrollments={filteredEnrollments || []}
                inquiries={filteredInquiries || []}
                courses={courses || []}
              />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Analytics Charts */}
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-blue-600" />
                      Course Enrollment Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, value }) => `${name}: ${value}`}
                          >
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Revenue Trend */}
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      Revenue Trend
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={revenueData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip formatter={(value, name) => [
                            name === 'revenue' ? `₹${value.toLocaleString()}` : value,
                            name === 'revenue' ? 'Revenue' : 'Enrollments'
                          ]} />
                          <Area type="monotone" dataKey="revenue" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                          <Area type="monotone" dataKey="enrollments" stackId="2" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Enrollments */}
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserCheck className="h-5 w-5 text-blue-600" />
                      Recent Enrollments
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-64">
                      {enrollmentsLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {filteredEnrollments?.slice(0, 5).map((enrollment) => (
                            <motion.div 
                              key={enrollment.id} 
                              className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-750 rounded-lg hover:shadow-md transition-all duration-200"
                              whileHover={{ scale: 1.02 }}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                  <Users className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-gray-100">{enrollment.studentName}</p>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">{enrollment.course?.name}</p>
                                </div>
                              </div>
                              <Badge variant="outline" className="bg-white">
                                {new Date(enrollment.startDate).toLocaleDateString()}
                              </Badge>
                            </motion.div>
                          ))}
                          {(!filteredEnrollments || filteredEnrollments.length === 0) && (
                            <p className="text-center text-gray-500 py-8">No enrollments found</p>
                          )}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* Recent Inquiries */}
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-orange-600" />
                      Recent Inquiries
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-64">
                      {inquiriesLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {filteredInquiries?.slice(0, 5).map((inquiry) => (
                            <motion.div 
                              key={inquiry.id} 
                              className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-750 rounded-lg hover:shadow-md transition-all duration-200"
                              whileHover={{ scale: 1.02 }}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                                  <MessageSquare className="h-5 w-5 text-orange-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-gray-100">{inquiry.studentName}</p>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">{inquiry.course?.name}</p>
                                </div>
                              </div>
                              <Badge 
                                variant={inquiry.status === 'pending' ? 'secondary' : inquiry.status === 'confirmed' ? 'default' : 'outline'}
                                className={inquiry.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                                inquiry.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                                inquiry.status === 'enrolled' ? 'bg-green-100 text-green-800' :
                                inquiry.status === 'books_given' ? 'bg-purple-100 text-purple-800' :
                                inquiry.status === 'exam_completed' ? 'bg-indigo-100 text-indigo-800' :
                                inquiry.status === 'certificate_issued' ? 'bg-pink-100 text-pink-800' :
                                'bg-gray-100 text-gray-800'}
                              >
                                {inquiry.status}
                              </Badge>
                            </motion.div>
                          ))}
                          {(!filteredInquiries || filteredInquiries.length === 0) && (
                            <p className="text-center text-gray-500 py-8">No inquiries found</p>
                          )}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-purple-600" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button 
                        variant="outline" 
                        className="h-20 w-full flex flex-col gap-2 bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border-blue-200"
                        onClick={() => setLocation('/inquiry/new')}
                      >
                        <UserPlus className="h-6 w-6 text-blue-600" />
                        <span className="text-sm font-medium">Add Inquiry</span>
                      </Button>
                    </motion.div>

                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button 
                        variant="outline" 
                        className="h-20 w-full flex flex-col gap-2 bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 border-green-200"
                        onClick={() => setActiveTab('students')}
                      >
                        <Users className="h-6 w-6 text-green-600" />
                        <span className="text-sm font-medium">Manage Students</span>
                      </Button>
                    </motion.div>

                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button 
                        variant="outline" 
                        className="h-20 w-full flex flex-col gap-2 bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 border-purple-200"
                        onClick={() => setShowAddCourse(true)}
                      >
                        <BookOpen className="h-6 w-6 text-purple-600" />
                        <span className="text-sm font-medium">Add Course</span>
                      </Button>
                    </motion.div>

                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button 
                        variant="outline" 
                        className="h-20 w-full flex flex-col gap-2 bg-gradient-to-br from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 border-orange-200"
                        onClick={() => setLocation('/fees')}
                      >
                        <Receipt className="h-6 w-6 text-orange-600" />
                        <span className="text-sm font-medium">Fee Management</span>
                      </Button>
                    </motion.div>

                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button 
                        variant="outline" 
                        className="h-20 w-full flex flex-col gap-2 bg-gradient-to-br from-teal-50 to-teal-100 hover:from-teal-100 hover:to-teal-200 border-teal-200"
                        onClick={() => setShowExportReports(true)}
                      >
                        <CloudDownload className="h-6 w-6 text-teal-600" />
                        <span className="text-sm font-medium">Export Reports</span>
                      </Button>
                    </motion.div>

                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button 
                        variant="outline" 
                        className="h-20 w-full flex flex-col gap-2 bg-gradient-to-br from-pink-50 to-pink-100 hover:from-pink-100 hover:to-pink-200 border-pink-200"
                        onClick={() => setActiveTab('analytics')}
                      >
                        <BarChart3 className="h-6 w-6 text-pink-600" />
                        <span className="text-sm font-medium">Analytics</span>
                      </Button>
                    </motion.div>

                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button 
                        variant="outline" 
                        className="h-20 w-full flex flex-col gap-2 bg-gradient-to-br from-indigo-50 to-indigo-100 hover:from-indigo-100 hover:to-indigo-200 border-indigo-200"
                        onClick={() => setActiveTab('settings')}
                      >
                        <Settings className="h-6 w-6 text-indigo-600" />
                        <span className="text-sm font-medium">Settings</span>
                      </Button>
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Students Tab */}
            <TabsContent value="students">
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    Enrolled Students
                  </CardTitle>
                  <CardDescription>
                    Manage student records, track payments, and handle enrollments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <StudentManagement searchTerm={searchTerm} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Inquiries Tab */}
            <TabsContent value="inquiries">
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-orange-600" />
                        Inquiries Management
                      </CardTitle>
                      <CardDescription>
                        Track and manage student inquiries and follow-ups
                      </CardDescription>
                    </div>
                    <Button onClick={() => setLocation('/inquiries')} className="bg-orange-600 hover:bg-orange-700">
                      <Eye className="h-4 w-4 mr-2" />
                      View All Inquiries
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {inquiriesLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-gray-200">
                            <TableHead className="font-semibold">Student Name</TableHead>
                            <TableHead className="font-semibold">Course</TableHead>
                            <TableHead className="font-semibold">Contact</TableHead>
                            <TableHead className="font-semibold">Batch</TableHead>
                            <TableHead className="font-semibold">Status</TableHead>
                            <TableHead className="font-semibold">Date</TableHead>
                            <TableHead className="font-semibold">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredInquiries?.slice(0, 10).map((inquiry) => (
                            <TableRow key={inquiry.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                              <TableCell className="font-medium">{inquiry.studentName}</TableCell>
                              <TableCell>{inquiry.course?.name}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Phone className="h-3 w-3 text-gray-400" />
                                  {inquiry.contactNo}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {BATCHES.find(b => b.id === inquiry.batchId)?.name || inquiry.batchId}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant={inquiry.status === 'pending' ? 'secondary' : inquiry.status === 'confirmed' ? 'default' : 'outline'}
                                  className={
                                    inquiry.status === 'pending' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' :
                                    inquiry.status === 'confirmed' ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' :
                                    inquiry.status === 'enrolled' ? 'bg-green-100 text-green-800 hover:bg-green-200' :
                                    inquiry.status === 'books_given' ? 'bg-purple-100 text-purple-800 hover:bg-purple-200' :
                                    inquiry.status === 'exam_completed' ? 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200' :
                                    inquiry.status === 'certificate_issued' ? 'bg-pink-100 text-pink-800 hover:bg-pink-200' :
                                    'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                  }
                                >
                                  {inquiry.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm text-gray-500">
                                {new Date(inquiry.createdAt || '').toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-8 px-2">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="bg-white/95 backdrop-blur-sm">
                                    <DropdownMenuItem onClick={() => setLocation(`/inquiry/edit/${inquiry.id}`)} className="hover:cursor-pointer">
                                      <Eye className="w-4 h-4 mr-2" />
                                      View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setLocation(`/inquiry/edit/${inquiry.id}`)} className="hover:cursor-pointer">
                                      <Edit className="w-4 h-4 mr-2" />
                                      Edit Inquiry
                                    </DropdownMenuItem>
                                    {inquiry.status === 'pending' && (
                                      <>
                                        <DropdownMenuItem onClick={() => setLocation(`/enrollment/new?inquiryId=${inquiry.id}`)} className="hover:cursor-pointer">
                                          <UserCheck className="w-4 h-4 mr-2" />
                                          Enroll Student
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => updateInquiryStatusMutation.mutate({ id: inquiry.id, status: "confirmed" })} className="hover:cursor-pointer">
                                          <CheckCircle className="w-4 h-4 mr-2" />
                                          Confirm Inquiry
                                        </DropdownMenuItem>
                                      </>
                                    )}
                                    {inquiry.status === "confirmed" && (
                                      <DropdownMenuItem onClick={() => setLocation(`/inquiry/enroll/${inquiry.id}`)} className="hover:cursor-pointer">
                                        <UserCheck className="w-4 h-4 mr-2" />
                                        Enroll Student
                                      </DropdownMenuItem>
                                    )}
                                    {inquiry.status === "enrolled" && (
                                      <>
                                        <DropdownMenuItem onClick={() => updateInquiryStatusMutation.mutate({ id: inquiry.id, status: "books_given" })} className="hover:cursor-pointer">
                                          <BookOpen className="w-4 h-4 mr-2" />
                                          Mark Books Given
                                        </DropdownMenuItem>
                                      </>
                                    )}
                                    {inquiry.status === "books_given" && (
                                      <DropdownMenuItem onClick={() => updateInquiryStatusMutation.mutate({ id: inquiry.id, status: "exam_completed" })} className="hover:cursor-pointer">
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Mark Exam Completed
                                      </DropdownMenuItem>
                                    )}
                                    {inquiry.status === "exam_completed" && (
                                      <DropdownMenuItem onClick={() => updateInquiryStatusMutation.mutate({ id: inquiry.id, status: "certificate_issued" })} className="hover:cursor-pointer">
                                        <Award className="w-4 h-4 mr-2" />
                                        Issue Certificate
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem onClick={() => {
                                      if (window.confirm('Are you sure you want to delete this inquiry?')) {
                                        deleteInquiryMutation.mutate(inquiry.id);
                                      }
                                    }} className="text-red-600 hover:cursor-pointer focus:bg-red-500 focus:text-red-100">
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Delete Inquiry
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      {(!filteredInquiries || filteredInquiries.length === 0) && (
                        <div className="text-center py-8">
                          <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500 text-lg">No inquiries found</p>
                          <p className="text-gray-400 text-sm">When students submit inquiries, they'll appear here</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Courses Tab */}
            <TabsContent value="courses">
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-green-600" />
                        Course Management
                      </CardTitle>
                      <CardDescription>
                        Manage course offerings, fees, and curriculum details
                      </CardDescription>
                    </div>
                    <Button onClick={() => setShowAddCourse(true)} className="bg-green-600 hover:bg-green-700">
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add Course
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {coursesLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-gray-200">
                            <TableHead className="font-semibold">Course Name</TableHead>
                            <TableHead className="font-semibold">Code</TableHead>
                            <TableHead className="font-semibold">Duration</TableHead>
                            <TableHead className="font-semibold">Full Fee</TableHead>
                            <TableHead className="font-semibold">Installment Fee</TableHead>
                            <TableHead className="font-semibold">Installment 1</TableHead> {/* Added */}
                            <TableHead className="font-semibold">Installment 2</TableHead> {/* Added */}
                            <TableHead className="font-semibold">Enrollments</TableHead>
                            <TableHead className="font-semibold">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {courses?.map((course) => {
                            const courseEnrollments = enrollments?.filter(e => e.courseId === course.id).length || 0;
                            return (
                              <TableRow key={course.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                <TableCell>
                                  <div>
                                    <div className="font-medium">{course.name}</div>
                                    {course.description && (
                                      <div className="text-sm text-gray-500 truncate max-w-xs">
                                        {course.description.substring(0, 50)}...
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="font-mono">
                                    {course.code}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3 text-gray-400" />
                                    {course.duration} months
                                  </div>
                                </TableCell>
                                <TableCell className="font-medium text-green-600">
                                  ₹{parseFloat(course.fullFee.toString()).toLocaleString()}
                                </TableCell>
                                <TableCell className="font-medium text-blue-600">
                                  ₹{parseFloat(course.installmentFee.toString()).toLocaleString()}
                                </TableCell>
                                <TableCell className="font-medium text-purple-600">
                                  ₹{parseFloat(course.installment1?.toString() || '0').toLocaleString()}
                                </TableCell>
                                <TableCell className="font-medium text-orange-600">
                                  ₹{parseFloat(course.installment2?.toString() || '0').toLocaleString()}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                      {courseEnrollments} students
                                    </Badge>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="outline" size="sm" className="h-8 px-2">
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="bg-white/95 backdrop-blur-sm">
                                      <DropdownMenuItem onClick={() => handleEditCourse(course)} className="hover:cursor-pointer">
                                        <Edit className="w-4 h-4 mr-2" />
                                        Edit Course
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => {
                                        if (window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
                                          deleteCourseMutation.mutate(course.id);
                                        }
                                      }} className="text-red-600 hover:cursor-pointer focus:bg-red-500 focus:text-red-100">
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete Course
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                      {(!courses || courses.length === 0) && (
                        <div className="text-center py-8">
                          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500 text-lg">No courses available</p>
                          <p className="text-gray-400 text-sm">Add your first course to get started</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Performance Metrics */}
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-indigo-600" />
                      Performance Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Inquiry Conversion Rate</span>
                        <span className="text-sm text-indigo-600 font-semibold">{quickStats.completionRate}%</span>
                      </div>
                      <Progress value={parseFloat(quickStats.completionRate)} className="h-2" />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Monthly Growth</span>
                        <span className={`text-sm font-semibold flex items-center gap-1 ${
                          quickStats.enrollmentGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {quickStats.enrollmentGrowth >= 0 ? (
                            <ArrowUpRight className="h-3 w-3" />
                          ) : (
                            <ArrowDownRight className="h-3 w-3" />
                          )}
                          {Math.abs(quickStats.enrollmentGrowth).toFixed(1)}%
                        </span>
                      </div>
                      <Progress 
                        value={Math.min(Math.abs(quickStats.enrollmentGrowth), 100)} 
                        className="h-2" 
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4">
                      <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">₹{quickStats.totalRevenue.toLocaleString()}</div>
                        <div className="text-sm text-green-700">Total Revenue</div>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">₹{quickStats.pendingFees.toLocaleString()}</div>
                        <div className="text-sm text-orange-700">Pending Fees</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Monthly Performance Chart */}
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-purple-600" />
                      Monthly Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={revenueData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="enrollments" fill="#3b82f6" name="Enrollments" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Security Settings */}
                <div className="space-y-6">
                  <ChangeWebsitePassword />
                  <ChangeAdminPassword />
                </div>

                {/* System Settings */}
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5 text-gray-600" />
                      System Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Auto Refresh</div>
                        <div className="text-sm text-gray-500">Automatically refresh data every 30 seconds</div>
                      </div>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Enabled
                      </Badge>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Export Reports</div>
                        <div className="text-sm text-gray-500">Generate and download detailed reports</div>
                      </div>
                      <Button size="sm" onClick={() => setShowExportReports(true)}>
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Data Backup</div>
                        <div className="text-sm text-gray-500">Last backup: Today at 2:00 AM</div>
                      </div>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                        Automated
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Stats Summary */}
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-yellow-600" />
                      System Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                        <div className="text-lg font-bold text-blue-600">{quickStats.totalStudents}</div>
                        <div className="text-xs text-blue-700">Active Students</div>
                      </div>
                      <div className="text-center p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                        <div className="text-lg font-bold text-green-600">{quickStats.totalCourses}</div>
                        <div className="text-xs text-green-700">Total Courses</div>
                      </div>
                      <div className="text-center p-3 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
                        <div className="text-lg font-bold text-orange-600">{quickStats.activeInquiries}</div>
                        <div className="text-xs text-orange-700">Pending Inquiries</div>
                      </div>
                      <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                        <div className="text-lg font-bold text-purple-600">{quickStats.completionRate}%</div>
                        <div className="text-xs text-purple-700">Conversion Rate</div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Database Status</span>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Online
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>API Status</span>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Last Update</span>
                        <span className="text-gray-500">{new Date().toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>

      {/* Add Course Dialog */}
      <Dialog open={showAddCourse} onOpenChange={setShowAddCourse}>
        <DialogContent className="sm:max-w-[600px] bg-white/95 backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-green-600" />
              {editingCourse ? 'Edit Course' : 'Add New Course'}
            </DialogTitle>
            <DialogDescription>
              {editingCourse ? 'Update the course information below.' : 'Fill in the details to create a new course.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCourseSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Course Name</Label>
                <Input
                  id="name"
                  value={courseForm.name}
                  onChange={(e) => setCourseForm({...courseForm, name: e.target.value})}
                  placeholder="e.g., Web Development"
                  required
                />
              </div>
              <div>
                <Label htmlFor="code">Course Code</Label>
                <Input
                  id="code"
                  value={courseForm.code}
                  onChange={(e) => setCourseForm({...courseForm, code: e.target.value})}
                  placeholder="e.g., WEB001"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4"> {/* Changed to grid-cols-4 */}
              <div>
                <Label htmlFor="duration">Duration (months)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={courseForm.duration}
                  onChange={(e) => setCourseForm({...courseForm, duration: e.target.value})}
                  placeholder="6"
                  min="1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="fullFee">Full Fee (₹)</Label>
                <Input
                  id="fullFee"
                  type="number"
                  value={courseForm.fullFee}
                  onChange={(e) => setCourseForm({...courseForm, fullFee: e.target.value})}
                  placeholder="50000"
                  min="0"
                  required
                />
              </div>
              <div>
                <Label htmlFor="installmentFee">Installment Fee (₹)</Label>
                <Input
                  id="installmentFee"
                  type="number"
                  value={courseForm.installmentFee}
                  onChange={(e) => setCourseForm({...courseForm, installmentFee: e.target.value})}
                  placeholder="10000"
                  min="0"
                  required
                />
              </div>
              <div>
                <Label htmlFor="installment1">Installment 1 (₹)</Label> {/* Added */}
                <Input
                  id="installment1"
                  type="number"
                  value={courseForm.installment1}
                  onChange={(e) => setCourseForm({...courseForm, installment1: e.target.value})}
                  placeholder="10000"
                  min="0"
                />
              </div>
              <div>
                <Label htmlFor="installment2">Installment 2 (₹)</Label> {/* Added */}
                <Input
                  id="installment2"
                  type="number"
                  value={courseForm.installment2}
                  onChange={(e) => setCourseForm({...courseForm, installment2: e.target.value})}
                  placeholder="10000"
                  min="0"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={courseForm.description}
                onChange={(e) => setCourseForm({...courseForm, description: e.target.value})}
                placeholder="Describe the course curriculum and objectives..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowAddCourse(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-green-600 hover:bg-green-700"
                disabled={createCourseMutation.isPending || updateCourseMutation.isPending}
              >
                {editingCourse ? (
                  updateCourseMutation.isPending ? 'Updating...' : 'Update Course'
                ) : (
                  createCourseMutation.isPending ? 'Creating...' : 'Create Course'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Export Reports Dialog */}
      <AnimatePresence>
        {showExportReports && (
          <Dialog open={showExportReports} onOpenChange={setShowExportReports}>
            <DialogContent className="sm:max-w-[500px] bg-white/95 backdrop-blur-sm">
              <ExportReports onClose={() => setShowExportReports(false)} />
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  );
}