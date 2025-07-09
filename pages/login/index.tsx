"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plane, Lock, User } from "lucide-react"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    // Simulate API call
    setTimeout(() => {
      if (username === "admin" && password === "admin123") {
        localStorage.setItem("isAuthenticated", "true")
        localStorage.setItem(
          "user",
          JSON.stringify({
            name: "أحمد محمد",
            role: "مدير النظام",
            email: "admin@travelagency.com",
          }),
        )
        window.location.href = "dashboard.html";

      } else {
        setError("اسم المستخدم أو كلمة المرور غير صحيحة")
      }
      setLoading(false)
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[url('/placeholder.svg?height=1080&width=1920')] bg-cover bg-center opacity-5"></div>

      <Card className="w-full max-w-md backdrop-blur-sm bg-white/80 shadow-2xl border-0">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-teal-500 to-blue-600 rounded-full flex items-center justify-center">
            <Plane className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-xl sm:text-2xl font-bold text-gray-800">نظام إدارة وكالة السفر</CardTitle>
          <CardDescription className="text-gray-600">مرحباً بك في لوحة التحكم الإدارية</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-800 mb-2">بيانات تجريبية للدخول:</h3>

          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-right block">
                اسم المستخدم
              </Label>
              <div className="relative">
                <User className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pr-10 text-right"
                  placeholder="أدخل اسم المستخدم"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-right block">
                كلمة المرور
              </Label>
              <div className="relative">
                <Lock className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10 text-right"
                  placeholder="أدخل كلمة المرور"
                  required
                />
              </div>
            </div>

            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-700 text-right">{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700"
              disabled={loading}
            >
              {loading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}