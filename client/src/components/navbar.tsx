import { Home, FileText, Users, DollarSign, Settings, GraduationCap, Award, Shield, LogOut } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import logoImage from "@assets/sm_logo_1_1753866301235.png";

export default function Navbar() {
  const [location] = useLocation();
  const { logout } = useAuth();

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/inquiry/new", label: "New Inquiry", icon: FileText },
    { href: "/inquiries", label: "All Inquiries", icon: Users },
    { href: "/fees", label: "Fees", icon: DollarSign },
    { href: "/admin-login", label: "Admin Login", icon: Shield },
  ];

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 shadow-lg backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/">
              <div className="flex items-center space-x-3 cursor-pointer hover:opacity-90 transition-all duration-300 group">
                <div className="bg-white p-1 rounded-xl group-hover:shadow-lg transition-all duration-300 border border-gray-200">
                  <img 
                    src={logoImage} 
                    alt="Santmegh Logo" 
                    className="h-8 w-8 object-contain"
                  />
                </div>
                <div className="text-left">
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">SANTMEGH</h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Computer Education</p>
                </div>
              </div>
            </Link>
            <div className="hidden lg:flex space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.href;
                return (
                  <Link key={item.href} href={item.href}>
                    <div
                      className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-all duration-300 ${
                        isActive
                          ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="hidden xl:block">{item.label}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
          
          {/* Logout Button */}
          <div className="flex items-center space-x-3">
            <Button
              onClick={logout}
              variant="outline"
              size="sm"
              className="hidden sm:flex items-center space-x-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </Button>
            
            {/* Mobile Logout */}
            <Button
              onClick={logout}
              variant="outline"
              size="sm"
              className="sm:hidden p-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Mobile Menu */}
          <div className="flex lg:hidden space-x-2">
            {navItems.slice(1, 4).map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <div
                    className={`p-2.5 rounded-xl transition-all duration-300 ${
                      isActive
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}