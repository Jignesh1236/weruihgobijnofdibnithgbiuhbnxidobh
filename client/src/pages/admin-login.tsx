import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { 
  Lock, 
  Eye, 
  EyeOff, 
  Shield, 
  ArrowRight, 
  User, 
  GraduationCap,
  Building,
  CheckCircle,
  Clock,
  Sparkles,
  Globe,
  Zap,
  BookOpen,
  Users,
  Monitor
} from "lucide-react";
import logoImage from "@assets/sm_logo_1_1753866301235.png";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('admin_auth', 'true');
        toast({
          title: "Login Successful",
          description: "Welcome to admin dashboard",
        });
        setLocation('/admin-dashboard');
      } else {
        toast({
          title: "Login Failed",
          description: data.message || "Invalid password",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Connection failed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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

  const scaleIn = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Side - Welcome Section */}
      <motion.div 
        className="flex-1 flex flex-col justify-center px-8 lg:px-16"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        {/* Secure Site Access Badge */}
        <motion.div 
          variants={fadeInUp} 
          className="mb-8"
        >
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium">
            <Shield className="h-4 w-4" />
            Secure Site Access
          </div>
        </motion.div>

        {/* Main Heading */}
        <motion.div variants={fadeInUp} className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to
          </h1>
          <h2 className="text-4xl font-bold mb-2">
            <span className="text-blue-600">Santmegh</span>{" "}
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Computer
            </span>
          </h2>
          <h3 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-6">Education</h3>
          
          <p className="text-gray-700 mb-6 max-w-md font-medium">
            Enter the password to access our educational platform
          </p>
          
          <p className="text-gray-600 mb-8 max-w-lg">
            Complete student management system with course enrollment, 
            fee tracking, and comprehensive administrative tools.
          </p>
        </motion.div>

        {/* Feature List */}
        <motion.div variants={fadeInUp} className="space-y-4">
          {[
            { icon: Shield, text: "Secure Educational Platform", color: "text-green-600" },
            { icon: Users, text: "Student Management System", color: "text-blue-600" },
            { icon: Monitor, text: "Institution Dashboard", color: "text-purple-600" },
            { icon: Clock, text: "24/7 Online Access", color: "text-orange-600" }
          ].map((feature, index) => (
            <motion.div
              key={index}
              className="flex items-center gap-4"
              variants={fadeInUp}
              transition={{ delay: 0.1 * index }}
            >
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-md border border-gray-100">
                <feature.icon className={`h-6 w-6 ${feature.color}`} />
              </div>
              <span className="text-gray-700 font-medium text-lg">{feature.text}</span>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* Right Side - Login Card */}
      <motion.div 
        className="flex-1 flex items-center justify-center p-8"
        initial="hidden"
        animate="visible"
        variants={scaleIn}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <div className="w-full max-w-md">
          <Card className="overflow-hidden shadow-2xl border-0 bg-white">
            {/* Card Header with Gradient */}
            <CardHeader className="relative text-center bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 text-white p-8">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/20 rounded-full blur-2xl"></div>
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/20 rounded-full blur-2xl"></div>
              </div>

              <div className="relative z-10">
                <div className="flex items-center justify-center gap-2 mb-6">
                  <Lock className="h-6 w-6" />
                  <CardTitle className="text-2xl font-bold">Site Access</CardTitle>
                </div>
                
                <motion.div 
                  className="flex justify-center mb-6"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <img 
                      src={logoImage} 
                      alt="Santmegh Logo" 
                      className="h-16 w-16 object-contain rounded-full"
                    />
                  </div>
                </motion.div>
                
                <h3 className="text-xl font-semibold mb-2">Santmegh Computer Education</h3>
                <p className="text-purple-100 text-sm italic">Educational Management Platform</p>
              </div>
            </CardHeader>
            
            <CardContent className="p-8">
              {/* Protected Access Section */}
              <div className="text-center mb-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-2">Protected Access</h4>
                <p className="text-sm text-gray-600">Enter the site password to continue</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-6">
                <motion.div 
                  className="space-y-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Shield className="h-4 w-4 text-blue-600" />
                    Site Password
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter the site access password"
                      className="h-12 pr-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-gray-50 focus:bg-white"
                      required
                    />
                    <motion.button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </motion.button>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Lock className="h-3 w-3" />
                    <span>Secure access to educational platform</span>
                  </div>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 hover:from-purple-700 hover:via-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                    disabled={isLoading || !password}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-3">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Verifying...</span>
                      </div>
                    ) : (
                      <motion.div 
                        className="flex items-center gap-3"
                        whileHover={{ x: 5 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Shield className="h-5 w-5" />
                        <span>Enter Platform</span>
                        <ArrowRight className="h-5 w-5" />
                      </motion.div>
                    )}
                  </Button>
                </motion.div>
              </form>
              
              {/* Footer Section */}
              <motion.div 
                className="mt-8 pt-6 border-t border-gray-200"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                <div className="flex items-center justify-center gap-6 text-xs">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="font-medium">Secure Platform</span>
                  </div>
                  <div className="flex items-center gap-2 text-blue-600">
                    <BookOpen className="h-4 w-4" />
                    <span className="font-medium">Education Portal</span>
                  </div>
                </div>
                
                <div className="text-center mt-4">
                  <p className="text-xs text-gray-500">
                    Comprehensive platform for student enrollment and institutional management
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    © 2025 SANTMEGH • Educational Institution
                  </p>
                </div>
              </motion.div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}