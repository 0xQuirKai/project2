"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  Plane,
  Users,
  Calendar,
  CreditCard,
  Package,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react"

const sidebarItems = [
  {
    title: "لوحة التحكم",
    href: "dashboard.html",
    icon: LayoutDashboard,
  },
  {
    title: "الرحلات",
    href: "trips.html",
    icon: Plane,
  },
  {
    title: "العملاء",
    href: "clients.html",
    icon: Users,
  },
  {
    title: "الحجوزات",
    href: "bookings.html",
    icon: Calendar,
  }

]

export function Sidebar() {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated")
    localStorage.removeItem("user")
    window.location.href = "login.html"
  }

  return (
    <>
      {/* Mobile overlay */}
      {!isCollapsed && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setIsCollapsed(true)}
        />
      )}

      <div
        className={cn(
          "fixed right-0 top-0 z-40 h-screen bg-gradient-to-b from-slate-900 to-slate-800 transition-all duration-300",
          isCollapsed ? "w-0 md:w-16" : "w-64",
          "md:relative md:translate-x-0",
          !isCollapsed && "translate-x-0",
          isCollapsed && "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-16 items-center justify-between px-4 border-b border-slate-700">
            {!isCollapsed && (
              <div className="flex items-center space-x-2 space-x-reverse">
                <div className="w-8 h-8 bg-gradient-to-r from-teal-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Plane className="w-5 h-5 text-white" />
                </div>
                <span className="text-white font-semibold">وكالة السفر</span>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="text-white hover:bg-slate-700"
            >
              {isCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2 p-4">
            {sidebarItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <button
  key={item.href}
  onClick={() => window.location.href = item.href}>
                  <div
                    className={cn(
                      "flex items-center space-x-3 space-x-reverse rounded-lg px-3 py-2 text-sm transition-colors",
                      isActive
                        ? "bg-gradient-to-r from-teal-500 to-blue-600 text-white"
                        : "text-slate-300 hover:bg-slate-700 hover:text-white",
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {!isCollapsed && <span>{item.title}</span>}
                  </div>
                </button>
              )
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-slate-700">
            <Button
              variant="ghost"
              onClick={handleLogout}
              className={cn(
                "w-full justify-start text-slate-300 hover:bg-slate-700 hover:text-white",
                isCollapsed && "justify-center px-2",
              )}
            >
              <LogOut className="h-5 w-5 shrink-0" />
              {!isCollapsed && <span className="mr-3">تسجيل الخروج</span>}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}