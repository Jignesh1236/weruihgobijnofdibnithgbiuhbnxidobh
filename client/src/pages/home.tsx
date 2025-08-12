import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { 
  UserPlus, 
  Users,
  BookOpen,
  GraduationCap,
  TrendingUp,
  Star,
  ArrowRight,
  Award,
  Target,
  Building,
  Clock,
  CheckCircle,
  BarChart3,
  Calendar,
  Shield,
  Zap,
  Globe,
  HeartHandshake,
  Search,
  Filter,
  Check,
  UserCheck,
  Eye,
  DollarSign,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  ChevronDown
} from "lucide-react";
import logoImage from "@assets/image_1754034460400.png";

type Stats = {
  totalInquiries: number;
  enrolledStudents: number;
  pendingPayments: string;
  overduePayments: number;
  totalCollected: string;
};

type InquiryWithCourse = {
  id: string;
  studentName: string;
  contactNo: string;
  fatherContactNo: string;
  address: string;
  courseId: string;
  batchId: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
  course: {
    id: string;
    name: string;
    duration: number;
    fullFee: string;
    installmentFee: string;
  };
};

type Course = {
  id: string;
  name: string;
  duration: number;
  fullFee: string;
  installmentFee: string;
};

export default function Home() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [showQuickFilters, setShowQuickFilters] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { data: stats, isLoading } = useQuery<Stats>({
    queryKey: ["/api/stats"],
  });

  const { data: courses } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  const { data: inquiries } = useQuery<InquiryWithCourse[]>({
    queryKey: ["/api/inquiries"],
  });

  // Filter inquiries based on search and filters
  const filteredInquiries = inquiries?.filter((inquiry) => {
    const matchesSearch = 
      inquiry.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inquiry.contactNo.includes(searchTerm) ||
      inquiry.address.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCourse = !selectedCourse || selectedCourse === "all" || inquiry.courseId === selectedCourse;
    const matchesStatus = !selectedStatus || selectedStatus === "all" || inquiry.status === selectedStatus;

    return matchesSearch && matchesCourse && matchesStatus;
  }) || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </Badge>;
      case "confirmed":
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
          <Check className="w-3 h-3 mr-1" />
          Confirmed
        </Badge>;
      case "enrolled":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          <UserCheck className="w-3 h-3 mr-1" />
          Enrolled
        </Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 60 },
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 overflow-x-hidden">
      {/* Hero Section */}
      <motion.section 
        className="relative px-4 py-16 sm:px-6 lg:px-8"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        

        <div className="relative max-w-7xl mx-auto">
          {/* Header with Logo */}
          <motion.div 
            className="text-center mb-12"
            variants={fadeInUp}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center justify-center p-4 mb-8 bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700">
              <img 
                src={logoImage} 
                alt="Santmegh Computer Education" 
                className="h-32 sm:h-40 lg:h-48 w-auto object-contain"
              />
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent pt-[5px] pb-[5px]">
                Santmegh Computer Education
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
              Excellence in computer education with modern learning solutions.
              Building digital skills for tomorrow's success.
            </p>

            {/* Quick Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-8">
              {[
                { label: "Total Students", value: stats?.enrolledStudents || 0, icon: Users, color: "text-blue-600" },
                { label: "Active Courses", value: courses?.length || 0, icon: BookOpen, color: "text-green-600" },
                { label: "Inquiries", value: stats?.totalInquiries || 0, icon: Clock, color: "text-orange-600" },
                { label: "Success Rate", value: "98%", icon: Award, color: "text-purple-600" }
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg border border-gray-200 dark:border-gray-700"
                  variants={fadeInUp}
                  transition={{ delay: 0.1 * index }}
                >
                  <div className="flex items-center justify-center mb-2">
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Live Status */}
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-8">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>System Online • {currentTime.toLocaleTimeString()}</span>
            </div>

            {/* Key Features */}
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              {[
                { icon: Shield, text: "Secure Platform", color: "text-green-600" },
                { icon: Zap, text: "Fast Performance", color: "text-yellow-600" },
                { icon: Globe, text: "24/7 Access", color: "text-blue-600" },
                { icon: HeartHandshake, text: "Student Support", color: "text-purple-600" }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-full shadow-md border border-gray-200 dark:border-gray-700"
                  variants={fadeInUp}
                  transition={{ delay: 0.1 * index }}
                >
                  <feature.icon className={`h-4 w-4 ${feature.color}`} />
                  <span className="text-sm font-medium">{feature.text}</span>
                </motion.div>
              ))}
            </div>

            {/* Login Button */}
            <motion.div 
              className="flex justify-center mb-12"
              variants={fadeInUp}
              transition={{ delay: 0.5 }}
            >
              <Link href="/admin-login">
                <Button className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 text-white px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 text-lg font-semibold group">
                  <Shield className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform duration-300" />
                  Admin Login
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Quick Actions Grid */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20"
            variants={staggerContainer}
          >
            {[
              {
                title: "New Student Inquiry",
                description: "Register new student inquiries and course interests with our streamlined process",
                icon: UserPlus,
                href: "/inquiry/new",
                gradient: "from-blue-500 via-blue-600 to-cyan-600",
                bgGradient: "from-blue-50/80 via-blue-50 to-cyan-50 dark:from-blue-900/30 dark:via-blue-900/20 dark:to-cyan-900/20",
                pattern: "opacity-5",
                stats: `${stats?.totalInquiries || 0} Total`,
                badge: "Popular"
              },
              {
                title: "Manage Inquiries",
                description: "View, process and track all student inquiries in one place",
                icon: BookOpen,
                href: "/inquiries",
                gradient: "from-emerald-500 via-teal-500 to-green-600",
                bgGradient: "from-emerald-50/80 via-teal-50 to-emerald-50 dark:from-emerald-900/30 dark:via-teal-900/20 dark:to-emerald-900/20",
                pattern: "opacity-5",
                stats: `${inquiries?.length || 0} Active`,
                badge: "Essential"
              },
              {
                title: "Fee Management",
                description: "Track payments, manage fee structures and generate reports",
                icon: DollarSign,
                href: "/fees-management",
                gradient: "from-orange-500 via-amber-500 to-yellow-500",
                bgGradient: "from-orange-50/80 via-amber-50 to-yellow-50 dark:from-orange-900/30 dark:via-amber-900/20 dark:to-yellow-900/20",
                pattern: "opacity-5",
                stats: `₹${stats?.pendingPayments ? parseFloat(stats.pendingPayments).toLocaleString() : '0'} Due`,
                badge: "Finance"
              },
              {
                title: "Admin Login",
                description: "Access administrative dashboard with complete management controls",
                icon: Shield,
                href: "/admin-login",
                gradient: "from-purple-500 via-violet-500 to-indigo-600",
                bgGradient: "from-purple-50/80 via-violet-50 to-indigo-50 dark:from-purple-900/30 dark:via-violet-900/20 dark:to-indigo-900/20",
                pattern: "opacity-5",
                stats: "Secure Access",
                badge: "Admin"
              }
            ].map((action, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                transition={{ delay: 0.15 * index }}
                whileHover={{ y: -8, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link href={action.href}>
                  <Card className={`group relative overflow-hidden bg-gradient-to-br ${action.bgGradient} border-0 shadow-xl hover:shadow-2xl transition-all duration-700 cursor-pointer h-full`}>
                    {/* Background Pattern */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    
                    {/* Floating Background Elements */}
                    <div className="absolute inset-0 overflow-hidden">
                      <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                      <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-black/5 rounded-full blur-lg group-hover:blur-xl transition-all duration-500"></div>
                    </div>

                    {/* Content */}
                    <div className="relative p-8 h-full flex flex-col">
                      {/* Badge */}
                      <div className="absolute top-4 right-4">
                        <Badge className="bg-white/20 text-gray-700 dark:text-gray-300 border-0 backdrop-blur-sm text-xs font-medium">
                          {action.badge}
                        </Badge>
                      </div>

                      {/* Icon */}
                      <div className="relative mb-6">
                        <div className={`w-16 h-16 bg-gradient-to-br ${action.gradient} rounded-3xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg`}>
                          <action.icon className="h-8 w-8 text-white" />
                        </div>
                        {/* Icon glow effect */}
                        <div className={`absolute inset-0 w-16 h-16 bg-gradient-to-br ${action.gradient} rounded-3xl blur-lg opacity-0 group-hover:opacity-30 transition-opacity duration-500`}></div>
                      </div>

                      {/* Content */}
                      <div className="flex flex-col flex-1">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-gray-800 dark:group-hover:text-gray-100 transition-colors">
                            {action.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-4 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors">
                            {action.description}
                          </p>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center justify-between mt-4">
                          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-white/50 dark:bg-gray-800/50 px-3 py-1 rounded-full backdrop-blur-sm">
                            {action.stats}
                          </div>
                          <div className="flex items-center text-sm font-semibold text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-all duration-300">
                            <span className="mr-2">Explore</span>
                            <ArrowRight className="h-4 w-4 group-hover:translate-x-2 transition-transform duration-300" />
                          </div>
                        </div>
                      </div>

                      {/* Bottom accent */}
                      <div className={`absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r ${action.gradient} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left`}></div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </motion.div>

          {/* Action Cards Benefits */}
          <motion.div 
            className="text-center mb-12"
            variants={fadeInUp}
            transition={{ delay: 0.6 }}
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {[
                { icon: Shield, text: "Secure & Reliable", color: "text-green-600" },
                { icon: Zap, text: "Fast Processing", color: "text-yellow-600" },
                { icon: CheckCircle, text: "Easy to Use", color: "text-blue-600" },
                { icon: HeartHandshake, text: "24/7 Support", color: "text-purple-600" }
              ].map((benefit, index) => (
                <motion.div
                  key={index}
                  className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 hover:bg-white dark:hover:bg-gray-800 transition-all duration-300 hover:-translate-y-1"
                  variants={fadeInUp}
                  transition={{ delay: 0.1 * index }}
                  whileHover={{ scale: 1.05 }}
                >
                  <benefit.icon className={`h-6 w-6 ${benefit.color}`} />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 text-center">{benefit.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.section>
      {/* Quick Filters Section */}
      <motion.section 
        className="px-4 py-12 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={staggerContainer}
      >
        <div className="max-w-7xl mx-auto">
          <motion.div className="text-center mb-8" variants={fadeInUp}>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Quick Search & Filter
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Find and manage student inquiries efficiently
            </p>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <Card className="p-6 bg-white dark:bg-gray-800 shadow-xl border-0">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Search Students
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search by name, phone, address..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 h-11"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Course
                  </label>
                  <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="All Courses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Courses</SelectItem>
                      {courses?.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="enrolled">Enrolled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedCourse("all");
                      setSelectedStatus("all");
                    }}
                  >
                    Clear Filters
                  </Button>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {filteredInquiries.length} result{filteredInquiries.length !== 1 ? 's' : ''} found
                  </div>
                </div>
                
                <Button
                  onClick={() => setShowQuickFilters(!showQuickFilters)}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  {showQuickFilters ? "Hide Results" : "Show Results"}
                  <ChevronDown className={`h-4 w-4 transition-transform ${showQuickFilters ? 'rotate-180' : ''}`} />
                </Button>
              </div>

              {/* Quick Results Preview */}
              {showQuickFilters && (
                <motion.div 
                  className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  {filteredInquiries.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No inquiries match your search criteria</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                          Search Results ({filteredInquiries.length})
                        </h4>
                        <Link href="/inquiries">
                          <Button variant="outline" size="sm">
                            View All Inquiries
                          </Button>
                        </Link>
                      </div>
                      
                      {filteredInquiries.slice(0, 5).map((inquiry) => (
                        <div key={inquiry.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="font-medium text-gray-900 dark:text-gray-100">
                                {inquiry.studentName}
                              </div>
                              {getStatusBadge(inquiry.status)}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                              <div className="flex items-center gap-4">
                                <span className="flex items-center gap-1">
                                  <BookOpen className="h-3 w-3" />
                                  {inquiry.course.name}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {inquiry.contactNo}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {inquiry.address}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <Link href="/inquiries">
                              <Button variant="outline" size="sm" className="hover:bg-blue-50 dark:hover:bg-blue-900/20">
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </Button>
                            </Link>
                          </div>
                        </div>
                      ))}
                      
                      {filteredInquiries.length > 5 && (
                        <div className="text-center text-sm text-gray-500 dark:text-gray-400 pt-4">
                          ...and {filteredInquiries.length - 5} more inquiries
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </Card>
          </motion.div>
        </div>
      </motion.section>
      {/* Statistics Section */}
      <motion.section 
        className="px-4 py-16 sm:px-6 lg:px-8 bg-white dark:bg-gray-900"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={staggerContainer}
      >
        <div className="max-w-7xl mx-auto">
          <motion.div className="text-center mb-12" variants={fadeInUp}>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Platform Analytics
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Real-time insights into student management and institutional performance
            </p>
          </motion.div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="p-6 animate-pulse">
                  <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
                </Card>
              ))}
            </div>
          ) : (
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
              variants={staggerContainer}
            >
              {[
                {
                  title: "Total Inquiries",
                  value: stats?.totalInquiries || 0,
                  icon: Users,
                  gradient: "from-blue-500 to-blue-600",
                  bgGradient: "from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20",
                  change: "+12%"
                },
                {
                  title: "Enrolled Students",
                  value: stats?.enrolledStudents || 0,
                  icon: GraduationCap,
                  gradient: "from-emerald-500 to-emerald-600",
                  bgGradient: "from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20",
                  change: "+8%"
                },
                {
                  title: "Pending Payments",
                  value: `₹${stats?.pendingPayments ? parseFloat(stats.pendingPayments).toLocaleString() : '0'}`,
                  icon: Calendar,
                  gradient: "from-orange-500 to-orange-600",
                  bgGradient: "from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20",
                  change: "-5%"
                },
                {
                  title: "Overdue Payments",
                  value: stats?.overduePayments || 0,
                  icon: Clock,
                  gradient: "from-red-500 to-red-600",
                  bgGradient: "from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20",
                  change: "-15%"
                }
              ].map((stat, index) => (
                <motion.div key={index} variants={fadeInUp} transition={{ delay: 0.1 * index }}>
                  <Card className={`p-6 bg-gradient-to-br ${stat.bgGradient} border-0 hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-12 h-12 bg-gradient-to-br ${stat.gradient} rounded-xl flex items-center justify-center`}>
                        <stat.icon className="h-6 w-6 text-white" />
                      </div>
                      <Badge variant="secondary" className="text-xs font-medium">
                        {stat.change}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{stat.title}</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </motion.section>
      {/* Call to Action */}
      <motion.section 
        className="relative px-4 py-16 sm:px-6 lg:px-8 overflow-hidden"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeInUp}
      >
        {/* Floating Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-20 h-20 bg-blue-400/10 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-32 h-32 bg-purple-400/10 rounded-full blur-2xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/3 w-16 h-16 bg-indigo-400/10 rounded-full blur-lg animate-pulse delay-500"></div>
        </div>

        <div className="max-w-4xl mx-auto text-center relative">
          <Card className="relative p-12 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 border-0 text-white overflow-hidden">

            
            <div className="relative z-10">
              <motion.div 
                className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Sparkles className="h-4 w-4" />
                <span className="text-sm font-medium">Join Our Success Story</span>
              </motion.div>
              
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                Ready to Transform Your Future?
              </h2>
              
              <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
                Join hundreds of successful students in our comprehensive computer education programs. 
                Start your journey towards a brighter career today.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <Link href="/inquiry/new">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold shadow-xl">
                      <UserPlus className="mr-2 h-5 w-5" />
                      Start Your Journey
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </motion.div>
                </Link>
                <Link href="/admin-dashboard">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 text-lg font-semibold backdrop-blur-sm">
                      <BarChart3 className="mr-2 h-5 w-5" />
                      Admin Dashboard
                    </Button>
                  </motion.div>
                </Link>
              </div>
              
              {/* Contact Info */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-white/80 text-sm">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>Call for Admission</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>Expert Guidance Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Open 24/7 Online</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </motion.section>
    </div>
  );
}
