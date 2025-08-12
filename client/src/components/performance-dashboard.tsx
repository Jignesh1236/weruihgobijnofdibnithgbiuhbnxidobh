import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Target, Users, BookOpen, DollarSign, Clock, Calendar } from 'lucide-react';

interface PerformanceDashboardProps {
  stats: any;
  enrollments: any[];
  inquiries: any[];
  courses: any[];
}

export default function PerformanceDashboard({ stats, enrollments, inquiries, courses }: PerformanceDashboardProps) {
  const conversionRate = stats ? Math.round((stats.enrolledStudents / Math.max(stats.totalInquiries, 1)) * 100) : 0;
  const avgMonthlyRevenue = stats ? Math.round(stats.monthlyRevenue / 1000) : 0;
  const activeCoursesCount = courses?.length || 0;
  const pendingInquiriesRate = stats ? Math.round((stats.pendingInquiries / Math.max(stats.totalInquiries, 1)) * 100) : 0;

  const performanceMetrics = [
    {
      title: "Conversion Rate",
      value: `${conversionRate}%`,
      target: 75,
      current: conversionRate,
      trend: conversionRate > 60 ? "up" : "down",
      icon: Target,
      color: conversionRate > 60 ? "text-green-600" : "text-red-600",
      bgColor: conversionRate > 60 ? "bg-green-50" : "bg-red-50"
    },
    {
      title: "Monthly Revenue",
      value: `₹${avgMonthlyRevenue}K`,
      target: 100,
      current: avgMonthlyRevenue,
      trend: avgMonthlyRevenue > 50 ? "up" : "down",
      icon: DollarSign,
      color: avgMonthlyRevenue > 50 ? "text-green-600" : "text-orange-600",
      bgColor: avgMonthlyRevenue > 50 ? "bg-green-50" : "bg-orange-50"
    },
    {
      title: "Active Students",
      value: stats?.enrolledStudents || 0,
      target: 100,
      current: ((stats?.enrolledStudents || 0) / 100) * 100,
      trend: (stats?.enrolledStudents || 0) > 50 ? "up" : "stable",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Course Utilization",
      value: `${Math.round((activeCoursesCount / Math.max(activeCoursesCount, 1)) * 100)}%`,
      target: 80,
      current: 85,
      trend: "up",
      icon: BookOpen,
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    }
  ];

  const systemHealth = [
    {
      metric: "Response Time",
      value: "< 200ms",
      status: "excellent",
      color: "bg-green-500"
    },
    {
      metric: "Database Performance",
      value: "99.9%",
      status: "excellent", 
      color: "bg-green-500"
    },
    {
      metric: "API Availability",
      value: "100%",
      status: "excellent",
      color: "bg-green-500"
    },
    {
      metric: "Storage Usage",
      value: "23%",
      status: "good",
      color: "bg-blue-500"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Performance KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {performanceMetrics.map((metric, index) => (
          <motion.div
            key={metric.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={`${metric.bgColor} border-0 shadow-lg hover:shadow-xl transition-all duration-300`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <metric.icon className={`h-4 w-4 ${metric.color}`} />
                      <span className="text-sm font-medium text-gray-600">{metric.title}</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 mb-2">{metric.value}</div>
                    <div className="space-y-2">
                      <Progress value={metric.current} className="h-2" />
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Target: {metric.target}%</span>
                        <div className="flex items-center gap-1">
                          {metric.trend === "up" ? (
                            <TrendingUp className="h-3 w-3 text-green-500" />
                          ) : metric.trend === "down" ? (
                            <TrendingDown className="h-3 w-3 text-red-500" />
                          ) : null}
                          <span>Current</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* System Health */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-green-600" />
            System Health Monitor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {systemHealth.map((item, index) => (
              <motion.div
                key={item.metric}
                className="p-4 bg-gray-50 rounded-lg"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">{item.metric}</span>
                  <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                </div>
                <div className="text-lg font-bold text-gray-900">{item.value}</div>
                <Badge 
                  variant="outline" 
                  className={`mt-2 text-xs ${
                    item.status === 'excellent' ? 'bg-green-50 text-green-700 border-green-200' :
                    item.status === 'good' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    'bg-yellow-50 text-yellow-700 border-yellow-200'
                  }`}
                >
                  {item.status}
                </Badge>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Insights */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-purple-600" />
            Today's Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-white/60 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{inquiries?.length || 0}</div>
              <div className="text-sm text-gray-600">New Inquiries Today</div>
            </div>
            <div className="text-center p-4 bg-white/60 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                ₹{Math.round((stats?.monthlyRevenue || 0) / 30).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Daily Revenue Target</div>
            </div>
            <div className="text-center p-4 bg-white/60 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{pendingInquiriesRate}%</div>
              <div className="text-sm text-gray-600">Follow-up Required</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}