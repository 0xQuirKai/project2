"use client"
import DashboardLayout from "@/components/layouts/DashboardLayout"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plane, Users, Calendar, DollarSign, TrendingUp, AlertCircle, CheckCircle } from "lucide-react"

export default function DashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState({
    totalTrips: 0,
    totalClients: 0,
    totalBookings: 0,
    totalRevenue: 0,
    upcomingTrips: 0,
    pendingPayments: 0,
  })

  type Booking = {
    clientId: number
    tripId: number
    totalAmount: number
    paidAmount: number
    notes: string
    id: number
    bookingDate: string
    status: string
    paymentStatus: string
  }
  const [recentBookings, setRecentBookings] = useState<Booking[]>([])
  type Trip = {
    id: number
    name: string
    destination: string
    startDate: string
    endDate: string
    price: number
    status: string
    capacity: number
    booked: number
    image?: string
    description?: string
  }
  const [upcomingTrips, setUpcomingTrips] = useState<Trip[]>([])
  const [alerts, setAlerts] = useState({
    pendingBookings: 0,
    expiredVisas: 0,
    completedToday: 0,
    paymentsReceived: 0
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Load from localStorage first, then fallback to JSON imports
      let trips, clients, bookings



        const tripsData = await window.api?.getTrips()
        const clientsData = await window.api?.getClients()
        const bookingsData = await window.api?.getBookings()

        trips = tripsData.trips
        clients = clientsData.clients
        bookings = bookingsData.bookings


      // Calculate stats
      const totalRevenue = bookings.reduce((sum: number, booking: any) => sum + booking.paidAmount, 0)
      const pendingPayments = bookings.filter((booking: any) => booking.paymentStatus !== "مدفوع بالكامل").length
      const upcomingTripsCount = trips.filter((trip: any) => new Date(trip.startDate) > new Date()).length

      setStats({
        totalTrips: trips.length,
        totalClients: clients.length,
        totalBookings: bookings.length,
        totalRevenue,
        upcomingTrips: upcomingTripsCount,
        pendingPayments,
      })

      setRecentBookings(bookings.slice(-5).reverse())
      setUpcomingTrips(
        trips
          .filter((trip: any) => new Date(trip.startDate) > new Date())
          .map((trip: any) => ({
            id: trip.id,
            name: trip.name,
            destination: trip.destination,
            startDate: trip.startDate,
            endDate: trip.endDate,
            price: trip.price,
            status: trip.status ?? "",
            capacity: trip.capacity ?? 0,
            booked: trip.booked ?? 0,
            image: trip.image,
            description: trip.description,
          }))
          .slice(0, 3)
      )

      // Calculate alerts
      const pendingBookingsCount = bookings.filter((booking: any) => booking.status === "قيد الانتظار").length
      const today = new Date().toISOString().split('T')[0]
      const completedTodayCount = bookings.filter((booking: any) => booking.bookingDate === today).length

      setAlerts({
        pendingBookings: pendingBookingsCount,
        expiredVisas: 0,
        completedToday: completedTodayCount,
        paymentsReceived: 2 // Mock data
      })

    } catch (error) {
      console.error("Error loading data:", error)
    }
  }

  const navigateToPage = (path: string) => {
    window.location.href = path ;
  }

  const statCards = [
    {
      title: "إجمالي الرحلات",
      value: stats.totalTrips,
      icon: Plane,
      color: "from-blue-500 to-blue-600",
      change: "+12%",
      onClick: () => navigateToPage("trips.html")
    },
    {
      title: "إجمالي العملاء",
      value: stats.totalClients,
      icon: Users,
      color: "from-green-500 to-green-600",
      change: "+8%",
      onClick: () => navigateToPage("clients.html")
    },
    {
      title: "إجمالي الحجوزات",
      value: stats.totalBookings,
      icon: Calendar,
      color: "from-purple-500 to-purple-600",
      change: "+15%",
      onClick: () => navigateToPage("bookings.html")
    },
    {
      title: "إجمالي الإيرادات",
      value: `${stats.totalRevenue.toLocaleString()} دج`,
      icon: DollarSign,
      color: "from-yellow-500 to-yellow-600",
      change: "+23%",
      onClick: () => navigateToPage("bookings.html")
    },
  ]

  return (
    <DashboardLayout>
<div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-teal-500 to-blue-600 rounded-lg p-4 sm:p-6 text-white">
        <h1 className="text-xl sm:text-2xl font-bold mb-2">مرحباً بك في لوحة التحكم</h1>
        <p className="text-teal-100 text-sm sm:text-base">إدارة شاملة لوكالة السفر والسياحة</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, index) => {
          const Icon = card.icon
          return (
            <Card
              key={index}
              className="relative overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
              onClick={card.onClick}
            >
              <div className={`absolute inset-0 bg-gradient-to-r ${card.color} opacity-5`}></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-right">{card.title}</CardTitle>
                <div className={`w-8 h-8 bg-gradient-to-r ${card.color} rounded-lg flex items-center justify-center`}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold text-right">{card.value}</div>

              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Recent Bookings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-right">الحجوزات الأخيرة</CardTitle>
            <CardDescription className="text-right">آخر 5 حجوزات تم إجراؤها</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentBookings.map((booking: any) => (
              <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="text-right">
                  <div className="font-medium">حجز رقم #{booking.id}</div>
                  <div className="text-sm text-muted-foreground">{booking.bookingDate}</div>
                </div>
                <div className="text-left">
                  <Badge
                    variant={
                      booking.status === "مؤكد"
                        ? "default"
                        : booking.status === "قيد الانتظار"
                          ? "secondary"
                          : "destructive"
                    }
                  >
                    {booking.status}
                  </Badge>
                  <div className="text-sm font-medium mt-1">{booking.paidAmount.toLocaleString()} دج</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Upcoming Trips */}
        <Card>
          <CardHeader>
            <CardTitle className="text-right">الرحلات القادمة</CardTitle>
            <CardDescription className="text-right">الرحلات المجدولة قريباً</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingTrips.map((trip: any) => (
              <div key={trip.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="text-right">
                  <div className="font-medium">{trip.name}</div>
                  <div className="text-sm text-muted-foreground">{trip.destination}</div>
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium">{trip.startDate}</div>
                  <div className="text-xs text-muted-foreground">
                    {trip.booked}/{trip.capacity} محجوز
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-right">إجراءات سريعة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <Button
              className="bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700"
              onClick={() => navigateToPage("trips.html")}
            >
              <Plane className="ml-2 h-4 w-4" />
              إضافة رحلة جديدة
            </Button>
            <Button
              variant="outline"
              onClick={() => navigateToPage("clients.html")}
            >
              <Users className="ml-2 h-4 w-4" />
              إضافة عميل جديد
            </Button>
            <Button
              variant="outline"
              onClick={() => navigateToPage("bookings.html")}
            >
              <Calendar className="ml-2 h-4 w-4" />
              إنشاء حجز جديد
            </Button>

          </div>
        </CardContent>
      </Card>

      {/* Dynamic Alerts */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-right flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              تنبيهات مهمة
            </CardTitle>
          </CardHeader>

        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-right flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              إنجازات اليوم
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-right">
              <div className="text-sm">• تم إنشاء {alerts.completedToday} حجوزات جديدة</div>
              <div className="text-sm">• تم تحديث معلومات العملاء</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </DashboardLayout>

  )
}