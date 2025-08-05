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
  TrendingDown
} from "lucide-react";
import type { EnrollmentWithDetails, InquiryWithCourse, Course } from "@shared/schema";
import { BATCHES } from "@shared/schema";
import StudentManagement from "@/components/student-management";
import ExportReports from "@/components/export-reports";
import { apiRequest } from "@/lib/queryClient";

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
  const [courseForm, setCourseForm] = useState({
    name: "",
    code: "",
    duration: "",
    fullFee: "",
    installmentFee: "",
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
      toast({
        title: "Data Refreshed",
        description: "All data has been updated successfully",
      });
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  }, [refetchStats, refetchEnrollments, refetchInquiries, refetchCourses, toast]);

  // Chart data processing
  const getChartData = useCallback(() => {
    if (!enrollments || !courses) return [];
    
    const courseData: ChartData[] = courses.map(course => {
      const courseEnrollments = enrollments.filter(e => e.courseId === course.id);
      const revenue = courseEnrollments.reduce((sum, e) => {
        const payments = e.payments?.reduce((pSum, p) => pSum + parseFloat(p.amount.toString()), 0) || 0;
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
      
      const revenue = enrollment.payments?.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0) || 0;
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
      feePlans: "[]",
      description: ""
    });
    setEditingCourse(null);
  };

  const handleCourseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const courseData = {
      name: courseForm.name,
      code: courseForm.code,
      duration: parseInt(courseForm.duration),
      fullFee: parseFloat(courseForm.fullFee),
      installmentFee: parseFloat(courseForm.installmentFee),
      feePlans: JSON.parse(courseForm.feePlans || "[]"),
      description: courseForm.description
    };

    if (editingCourse) {
      updateCourseMutation.mutate({ id: editingCourse.id, courseData });
    } else {
      createCourseMutation.mutate(courseData);
    }
  };

  const handleEditCourse = (course: Course) => {
    setEditingCourse(course);
    setCourseForm({
      name: course.name,
      code: course.code,
      duration: course.duration.toString(),
      fullFee: course.fullFee.toString(),
      installmentFee: course.installmentFee.toString(),
      feePlans: JSON.stringify(course.feePlans || []),
      description: course.description || ""
    });
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
      const payments = e.payments?.reduce((pSum, p) => pSum + parseFloat(p.amount.toString()), 0) || 0;
      return sum + payments;
    }, 0) || 0;
    
    const pendingFees = enrollments?.reduce((sum, e) => {
      const totalFee = parseFloat(e.totalFee.toString());
      const paidAmount = e.payments?.reduce((pSum, p) => pSum + parseFloat(p.amount.toString()), 0) || 0;
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
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Ccircle cx="7" cy="7" r="1"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30"></div>
            
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
                      SANTMEGH Computer Education Management
                    </motion.p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
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

        {/* Quick Stats Cards */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.div variants={fadeInUp}>
            <Card className="relative overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Students</p>
                    <p className="text-3xl font-bold text-blue-600">{quickStats.totalStudents}</p>
                  </div>
                  <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <Card className="relative overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Inquiries</p>
                    <p className="text-3xl font-bold text-orange-600">{quickStats.activeInquiries}</p>
                  </div>
                  <div className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded-full">
                    <MessageSquare className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-red-500"></div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <Card className="relative overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Courses</p>
                    <p className="text-3xl font-bold text-green-600">{quickStats.totalCourses}</p>
                  </div>
                  <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full">
                    <BookOpen className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-500"></div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <Card className="relative overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">This Month</p>
                    <p className="text-3xl font-bold text-purple-600">{quickStats.thisMonthEnrollments}</p>
                  </div>
                  <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-full">
                    <Calendar className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-indigo-500"></div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Main Dashboard Tabs */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          transition={{ delay: 0.3 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:grid-cols-6">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="students" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Students
              </TabsTrigger>
              <TabsTrigger value="inquiries" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Inquiries
              </TabsTrigger>
              <TabsTrigger value="courses" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Courses
              </TabsTrigger>
              <TabsTrigger value="payments" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Payments
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Enrollments */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserCheck className="h-5 w-5 text-blue-600" />
                      Recent Enrollments
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {enrollmentsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {enrollments?.slice(0, 5).map((enrollment) => (
                          <div key={enrollment.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div>
                              <p className="font-medium">{enrollment.studentName}</p>
                              <p className="text-sm text-gray-500">{enrollment.course?.name}</p>
                            </div>
                            <Badge variant="outline">
                              {new Date(enrollment.startDate).toLocaleDateString()}
                            </Badge>
                          </div>
                        ))}
                        {(!enrollments || enrollments.length === 0) && (
                          <p className="text-center text-gray-500 py-4">No enrollments yet</p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Inquiries */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-orange-600" />
                      Recent Inquiries
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {inquiriesLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {inquiries?.slice(0, 5).map((inquiry) => (
                          <div key={inquiry.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div>
                              <p className="font-medium">{inquiry.studentName}</p>
                              <p className="text-sm text-gray-500">{inquiry.course?.name}</p>
                            </div>
                            <Badge 
                              variant={inquiry.status === 'pending' ? 'secondary' : 'default'}
                            >
                              {inquiry.status}
                            </Badge>
                          </div>
                        ))}
                        {(!inquiries || inquiries.length === 0) && (
                          <p className="text-center text-gray-500 py-4">No inquiries yet</p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-purple-600" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Button 
                      variant="outline" 
                      className="h-20 flex flex-col gap-2"
                      onClick={() => setLocation('/inquiry-form')}
                    >
                      <UserPlus className="h-6 w-6" />
                      Add Inquiry
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-20 flex flex-col gap-2"
                      onClick={() => setActiveTab('students')}
                    >
                      <Users className="h-6 w-6" />
                      Manage Students
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-20 flex flex-col gap-2"
                      onClick={() => setShowAddCourse(true)}
                    >
                      <BookOpen className="h-6 w-6" />
                      Add Course
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-20 flex flex-col gap-2"
                      onClick={() => setLocation('/fees-management')}
                    >
                      <Receipt className="h-6 w-6" />
                      Fee Management
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Students Tab */}
            <TabsContent value="students">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    Student Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <StudentManagement />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Inquiries Tab */}
            <TabsContent value="inquiries">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-orange-600" />
                      Inquiries Management
                    </CardTitle>
                    <Button onClick={() => setLocation('/inquiries-list')}>
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
                          <TableRow>
                            <TableHead>Student Name</TableHead>
                            <TableHead>Course</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {inquiries?.slice(0, 10).map((inquiry) => (
                            <TableRow key={inquiry.id}>
                              <TableCell className="font-medium">{inquiry.studentName}</TableCell>
                              <TableCell>{inquiry.course?.name}</TableCell>
                              <TableCell>{inquiry.contactNo}</TableCell>
                              <TableCell>
                                <Badge 
                                  variant={inquiry.status === 'pending' ? 'secondary' : 'default'}
                                >
                                  {inquiry.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button size="sm" variant="outline">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button size="sm" variant="outline">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      {(!inquiries || inquiries.length === 0) && (
                        <p className="text-center text-gray-500 py-8">No inquiries found</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Courses Tab */}
            <TabsContent value="courses">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-green-600" />
                      Course Management
                    </CardTitle>
                    <Button onClick={() => setShowAddCourse(true)}>
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
                          <TableRow>
                            <TableHead>Course Name</TableHead>
                            <TableHead>Code</TableHead>
                            <TableHead>Duration</TableHead>
                            <TableHead>Full Fee</TableHead>
                            <TableHead>Installment Fee</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {courses?.map((course) => (
                            <TableRow key={course.id}>
                              <TableCell className="font-medium">{course.name}</TableCell>
                              <TableCell>{course.code}</TableCell>
                              <TableCell>{course.duration} months</TableCell>
                              <TableCell>₹{course.fullFee.toLocaleString()}</TableCell>
                              <TableCell>₹{course.installmentFee.toLocaleString()}</TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleEditCourse(course)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => {
                                      if (window.confirm('Are you sure you want to delete this course?')) {
                                        deleteCourseMutation.mutate(course.id);
                                      }
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      {(!courses || courses.length === 0) && (
                        <p className="text-center text-gray-500 py-8">No courses found</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Payments Tab */}
            <TabsContent value="payments">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-purple-600" />
                      Payment Management
                    </CardTitle>
                    <Button onClick={() => setLocation('/fees-management')}>
                      View All Payments
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                            <p className="text-2xl font-bold text-green-600">
                              ₹{stats?.totalRevenue?.toLocaleString() || '0'}
                            </p>
                          </div>
                          <DollarSign className="h-8 w-8 text-green-600" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Pending Fees</p>
                            <p className="text-2xl font-bold text-orange-600">
                              ₹{stats?.pendingFees?.toLocaleString() || '0'}
                            </p>
                          </div>
                          <Clock className="h-8 w-8 text-orange-600" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">This Month</p>
                            <p className="text-2xl font-bold text-blue-600">
                              ₹{stats?.monthlyRevenue?.toLocaleString() || '0'}
                            </p>
                          </div>
                          <TrendingUp className="h-8 w-8 text-blue-600" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="text-center py-8">
                    <Button 
                      size="lg" 
                      onClick={() => setLocation('/fees-management')}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    >
                      <Receipt className="h-5 w-5 mr-2" />
                      Open Payment Management
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-red-600" />
                      Security Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Admin Password</span>
                      <Button variant="outline" size="sm">
                        <Key className="h-4 w-4 mr-2" />
                        Change Password
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Session Timeout</span>
                      <Select>
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="30 min" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15 min</SelectItem>
                          <SelectItem value="30">30 min</SelectItem>
                          <SelectItem value="60">1 hour</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="h-5 w-5 text-blue-600" />
                      System Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Backup Data</span>
                      <Button variant="outline" size="sm">
                        <CloudDownload className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Export Reports</span>
                      <Button variant="outline" size="sm">
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>

      {/* Add/Edit Course Dialog */}
      <Dialog open={showAddCourse} onOpenChange={setShowAddCourse}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCourse ? 'Edit Course' : 'Add New Course'}
            </DialogTitle>
            <DialogDescription>
              {editingCourse ? 'Update course information' : 'Create a new course for your institution'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="max-h-[60vh] overflow-y-auto pr-2">
            <form onSubmit={handleCourseSubmit} className="space-y-6">
              {/* Basic Information Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Basic Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium">Course Name *</Label>
                    <Input
                      id="name"
                      value={courseForm.name}
                      onChange={(e) => setCourseForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Basic Computer Course"
                      className="h-10"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="code" className="text-sm font-medium">Course Code *</Label>
                    <Input
                      id="code"
                      value={courseForm.code}
                      onChange={(e) => setCourseForm(prev => ({ ...prev, code: e.target.value }))}
                      placeholder="e.g., BCC001"
                      className="h-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                  <Textarea
                    id="description"
                    value={courseForm.description}
                    onChange={(e) => setCourseForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Course description and details..."
                    rows={3}
                    className="resize-none"
                  />
                </div>
              </div>

              <Separator />

              {/* Duration & Fee Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Duration & Fee Structure
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="duration" className="text-sm font-medium">Duration (months) *</Label>
                    <Input
                      id="duration"
                      type="number"
                      min="1"
                      max="36"
                      value={courseForm.duration}
                      onChange={(e) => setCourseForm(prev => ({ ...prev, duration: e.target.value }))}
                      placeholder="6"
                      className="h-10"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fullFee" className="text-sm font-medium">Full Fee (₹) *</Label>
                    <Input
                      id="fullFee"
                      type="number"
                      min="0"
                      step="100"
                      value={courseForm.fullFee}
                      onChange={(e) => setCourseForm(prev => ({ ...prev, fullFee: e.target.value }))}
                      placeholder="15000"
                      className="h-10"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="installmentFee" className="text-sm font-medium">Installment Fee (₹) *</Label>
                    <Input
                      id="installmentFee"
                      type="number"
                      min="0"
                      step="100"
                      value={courseForm.installmentFee}
                      onChange={(e) => setCourseForm(prev => ({ ...prev, installmentFee: e.target.value }))}
                      placeholder="3000"
                      className="h-10"
                      required
                    />
                  </div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    <strong>Note:</strong> Installment fee is the monthly payment amount when students choose the installment payment plan.
                  </p>
                </div>
              </div>
            </form>
          </div>
          
          <Separator className="my-4" />
          
          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setShowAddCourse(false);
                resetCourseForm();
              }}
              className="flex-1 h-11"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button 
              type="submit" 
              onClick={handleCourseSubmit}
              className="flex-1 h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              disabled={createCourseMutation.isPending || updateCourseMutation.isPending}
            >
              {(createCourseMutation.isPending || updateCourseMutation.isPending) ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {editingCourse ? 'Updating...' : 'Creating...'}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {editingCourse ? (
                    <>
                      <Edit className="h-4 w-4" />
                      Update Course
                    </>
                  ) : (
                    <>
                      <PlusCircle className="h-4 w-4" />
                      Create Course
                    </>
                  )}
                </div>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}