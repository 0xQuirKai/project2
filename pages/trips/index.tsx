"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/layouts/DashboardLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, MapPin, Calendar, Users, DollarSign, Eye, Edit } from "lucide-react"

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
  image: string
}

type Client = {
  id: number
  name: string
  phone: string
  email: string
  booking?: {
    status: string
    paidAmount: number
    paymentStatus: string
  }
}

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [tripClients, setTripClients] = useState<Client[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        if (window.api) {
          const tripsData = await window.api.getTrips()
          console.log("Loaded trips:", tripsData)
          setTrips(tripsData.trips)
        } else {
          console.error("window.api is undefined")
        }
      } catch (error) {
        console.error("Error loading trips:", error)
      }
    }
    loadData()
  }, [])

  useEffect(() => {
    const loadClients = async () => {
                  console.log("cc" , selectedTrip)

      if (!selectedTrip?.id) return
      try {
        if (window.api) {
          const clients = await window.api.getTripClients(selectedTrip.id)
          console.log(clients)
          setTripClients(clients)
        } else {
          console.error("window.api is undefined")
          setTripClients([])
        }
      } catch (error) {
        console.error("Error loading trip clients:", error)
        setTripClients([])
      }
    }
    loadClients()
  }, [selectedTrip])

  const filteredTrips = trips.filter(
    (trip) =>
      trip.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.destination.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSaveTrip = async () => {
    const trip = {
      name: (document.getElementById("name") as HTMLInputElement).value,
      destination: (document.getElementById("destination") as HTMLInputElement).value,
      startDate: (document.getElementById("startDate") as HTMLInputElement).value,
      endDate: (document.getElementById("endDate") as HTMLInputElement).value,
      price: parseFloat((document.getElementById("price") as HTMLInputElement).value),
      capacity: parseInt((document.getElementById("capacity") as HTMLInputElement).value),
      description: (document.getElementById("description") as HTMLTextAreaElement).value,
    }

    try {
      if (window.api) {
        const res = await window.api.createTrip(trip)
        if (res.success) {
          alert("تم حفظ الرحلة بنجاح!")
          setTrips((prev) => [...prev, res.trip])
          setIsDialogOpen(false)
        } else {
          alert("فشل في حفظ الرحلة")
        }
      } else {
        alert("الواجهة البرمجية غير متوفرة")
        console.error("window.api is undefined")
      }
    } catch (error) {
      console.error(error)
      alert("حدث خطأ أثناء حفظ الرحلة")
    }
  }

  return (
    <DashboardLayout>
<div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">إدارة الرحلات</h1>
          <p className="text-gray-600 text-sm sm:text-base">إدارة وتنظيم جميع الرحلات السياحية</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 w-full sm:w-auto">
              <Plus className="ml-2 h-4 w-4" />
              إضافة رحلة جديدة
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl mx-4 sm:mx-auto">
            <DialogHeader>
              <DialogTitle className="text-right">إضافة رحلة جديدة</DialogTitle>
              <DialogDescription className="text-right">أدخل تفاصيل الرحلة الجديدة</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-right">اسم الرحلة</Label>
                  <Input id="name" className="text-right" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="destination" className="text-right">الوجهة</Label>
                  <Input id="destination" className="text-right" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate" className="text-right">تاريخ البداية</Label>
                  <Input id="startDate" type="date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate" className="text-right">تاريخ النهاية</Label>
                  <Input id="endDate" type="date" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price" className="text-right">السعر</Label>
                  <Input id="price" type="number" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capacity" className="text-right">السعة</Label>
                  <Input id="capacity" type="number" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="text-right">الوصف</Label>
                <Textarea id="description" className="text-right" />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>إلغاء</Button>
              <Button className="bg-gradient-to-r from-teal-500 to-blue-600" onClick={handleSaveTrip}>حفظ الرحلة</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-full sm:max-w-md">
        <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="البحث في الرحلات..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pr-10 text-right"
        />
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {filteredTrips.map((trip) => (
          <Card key={trip.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="aspect-video bg-gradient-to-r from-teal-100 to-blue-100 flex items-center justify-center">
              <img src={trip.image || "/placeholder.svg"} alt={trip.name} className="w-full h-full object-cover" />
            </div>
            <CardHeader className="p-4">
              <div className="flex justify-between items-start gap-2">
                <CardTitle className="text-right text-base sm:text-lg line-clamp-2">{trip.name}</CardTitle>
                <Badge variant={
                  trip.status === "مؤكدة" ? "default" :
                  trip.status === "قيد التخطيط" ? "secondary" : "destructive"
                }>
                  {trip.status}
                </Badge>
              </div>
              <CardDescription className="text-right flex items-center gap-1">
                <MapPin className="h-4 w-4 shrink-0" />
                <span className="line-clamp-1">{trip.destination}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-4 pt-0">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-right">
                  <div className="flex items-center gap-1 text-muted-foreground"><Calendar className="h-4 w-4" /><span>تاريخ البداية</span></div>
                  <div className="font-medium text-xs sm:text-sm">{trip.startDate}</div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-muted-foreground"><Users className="h-4 w-4" /><span>المحجوز/السعة</span></div>
                  <div className="font-medium text-xs sm:text-sm">{trip.booked}/{trip.capacity}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-muted-foreground text-sm"><DollarSign className="h-4 w-4" /><span>السعر</span></div>
                <div className="text-lg sm:text-xl font-bold text-teal-600">{trip.price ? trip.price.toLocaleString() : 0} دج</div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button variant="outline" size="sm" className="flex-1 bg-transparent"><Edit className="ml-1 h-3 w-3" />تعديل</Button>
                <Button size="sm" className="flex-1 bg-gradient-to-r from-teal-500 to-blue-600" onClick={() => { setSelectedTrip(trip); setIsDetailsOpen(true) }}>
                  <Eye className="ml-1 h-3 w-3" />عرض التفاصيل
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen} >
        <DialogContent className="max-w-4xl mx-4 sm:mx-auto max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-right">{selectedTrip?.name}</DialogTitle>
            <DialogDescription className="text-right">تفاصيل الرحلة والعملاء المسجلين</DialogDescription>
          </DialogHeader>

          {selectedTrip && (
            <div className="space-y-6" dir="rtl">
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                <div className="text-right"><label className="text-sm font-medium text-gray-500">الوجهة</label><p className="font-medium">{selectedTrip.destination}</p></div>
                <div className="text-right"><label className="text-sm font-medium text-gray-500">تاريخ البداية</label><p className="font-medium">{selectedTrip.startDate}</p></div>
                <div className="text-right"><label className="text-sm font-medium text-gray-500">تاريخ النهاية</label><p className="font-medium">{selectedTrip.endDate}</p></div>
                <div className="text-right"><label className="text-sm font-medium text-gray-500">السعر</label><p className="font-medium text-teal-600">{selectedTrip.price ? selectedTrip.price.toLocaleString() : 0} دج</p></div>
                <div className="text-right"><label className="text-sm font-medium text-gray-500">السعة</label><p className="font-medium">{selectedTrip.capacity} شخص</p></div>
                <div className="text-right"><label className="text-sm font-medium text-gray-500">المحجوز</label><p className="font-medium">{selectedTrip.booked} شخص</p></div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4 text-right">العملاء المسجلين في هذه الرحلة</h3>
                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-right min-w-[120px]">اسم العميل</TableHead>
                            <TableHead className="text-right min-w-[120px]">رقم الهاتف</TableHead>
                            <TableHead className="text-right min-w-[150px]">البريد الإلكتروني</TableHead>
                            <TableHead className="text-right min-w-[100px]">حالة الحجز</TableHead>
                            <TableHead className="text-right min-w-[120px]">المبلغ المدفوع</TableHead>
                            <TableHead className="text-right min-w-[100px]">حالة الدفع</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tripClients?.map((client) => (
                            <TableRow key={client.id}>
                              <TableCell className="text-right font-medium">{client.name}</TableCell>
                              <TableCell className="text-right">{client.phone}</TableCell>
                              <TableCell className="text-right">{client.email}</TableCell>
                              <TableCell className="text-right">
                                <Badge variant={client.booking?.status === "مؤكد" ? "default" : "secondary"}>
                                  {client.booking?.status || "غير محدد"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right text-teal-600 font-medium">
                                {client.booking?.paidAmount?.toLocaleString() || 0} دج
                              </TableCell>
                              <TableCell className="text-right">
                                <Badge variant={client.booking?.paymentStatus === "مدفوع بالكامل" ? "default" : "destructive"}>
                                  {client.booking?.paymentStatus || "غير محدد"}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
    </DashboardLayout>

  )
}
