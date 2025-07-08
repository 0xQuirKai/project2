"use client"
import DashboardLayout from "@/components/layouts/DashboardLayout"
import { useState, useEffect } from "react"

// Add this global type declaration for electronAPI
declare global {
  interface Window {
    api?: {
      uploadPassport(name: string, fileBuffers: { name: string; data: string }[]): unknown
      deleteClient(clientId: number): unknown
      addClient(clientData: any): unknown
      getTrips(): any
      getClients(): any
      getClientFiles(clientId: number): any[]
      getTripClients(id : any): any
      createTrip(tripData: any): unknown
      getBookings(): any
      invoke: (channel: string, ...args: any[]) => Promise<any>
    }
  }
}
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { Plus, Search, Filter, Calendar, DollarSign, User, Eye, Edit } from "lucide-react"
import { DataManager } from "@/lib/data-manager"

type Client = {
  id: number
  name: string
  phone: string
  email: string
  passportNumber: string
  passportExpiry: string
  totalBookings: number
  totalSpent: number
  documents: string[]
  address: string
  dateOfBirth: string
  emergencyContact: string
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [trips, setTrips] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    clientId: "",
    tripId: "",
    totalAmount: "",
    paidAmount: "",
    notes: ""
  })

  const dataManager = DataManager.getInstance()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
  try {
    if (!window.api) {
      alert('Electron API is not available.');
      return;
    }

    const [bookingsResult, clientsResult, tripsResult] = await Promise.all([
      window.api.getBookings(),
      window.api.getClients(),
      window.api.getTrips()
    ]);

    if (!bookingsResult.success || !clientsResult.success || !tripsResult.success) {
      alert('Failed to load data from main process');
      return;
    }

    setBookings(bookingsResult.bookings);
    setClients(clientsResult.clients);
    setTrips(tripsResult.trips);

    localStorage.setItem('bookings', JSON.stringify(bookingsResult.bookings));
    localStorage.setItem('clients', JSON.stringify(clientsResult.clients));
    localStorage.setItem('trips', JSON.stringify(tripsResult.trips));

  } catch (error) {
    console.error("❌ Error loading data:", error);
  }
};



  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    if (!formData.clientId || !formData.tripId || !formData.totalAmount) {
      alert("يرجى ملء جميع الحقول المطلوبة")
      return
    }

    setIsLoading(true)

    try {
      const bookingData = {
        clientId: parseInt(formData.clientId),
        tripId: parseInt(formData.tripId),
        totalAmount: parseFloat(formData.totalAmount),
        paidAmount: parseFloat(formData.paidAmount) || 0,
        notes: formData.notes
      }

      const success = await dataManager.addBooking(bookingData)

      if (success) {
        await loadData()
        setFormData({
          clientId: "",
          tripId: "",
          totalAmount: "",
          paidAmount: "",
          notes: ""
        })
        setIsDialogOpen(false)
        alert("تم إضافة الحجز بنجاح!")
      } else {
        alert("حدث خطأ أثناء إضافة الحجز")
      }
    } catch (error) {
      console.error("Error adding booking:", error)
      alert("حدث خطأ أثناء إضافة الحجز")
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusChange = async (bookingId: number, newStatus: string) => {
    const success = await dataManager.updateBookingStatus(bookingId, newStatus)
    if (success) {
      await loadData()
      // Refresh the page to reflect the updated status
      window.location.reload()
      alert("تم تحديث حالة الحجز بنجاح!")
    } else {
      alert("حدث خطأ أثناء تحديث حالة الحجز")
    }
  }

  const showBookingDetails = (booking: any) => {
    setSelectedBooking(booking)
    setIsDetailsOpen(true)
  }

  const getClientName = (clientId: number) => {
    const client = clients.find((c: any) => c.id === clientId)
    return client ? client.name : "غير معروف"
  }

  const getTripName = (tripId: number) => {
    const trip = trips.find((t: any) => t.id === tripId)
    return trip ? trip.name : "غير معروف"
  }

  const filteredBookings = bookings.filter((booking: any) => {
    const matchesSearch =
      getClientName(booking.clientId).toLowerCase().includes(searchTerm.toLowerCase()) ||
      getTripName(booking.tripId).toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || booking.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "مؤكد":
        return "default"
      case "قيد الانتظار":
        return "secondary"
      case "ملغي":
        return "destructive"
      default:
        return "outline"
    }
  }

  const getPaymentStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "مدفوع بالكامل":
        return "default"
      case "دفع جزئي":
        return "secondary"
      case "غير مدفوع":
        return "destructive"
      default:
        return "outline"
    }
  }

  return (
    <DashboardLayout>
<div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">إدارة الحجوزات</h1>
          <p className="text-gray-600 text-sm sm:text-base">متابعة وإدارة جميع حجوزات العملاء</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 w-full sm:w-auto">
              <Plus className="ml-2 h-4 w-4" />
              إضافة حجز جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl mx-4 sm:mx-auto">
            <DialogHeader>
              <DialogTitle className="text-right">إضافة حجز جديد</DialogTitle>
              <DialogDescription className="text-right">أدخل تفاصيل الحجز الجديد</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client" className="text-right">
                    العميل *
                  </Label>
                  <Select value={formData.clientId} onValueChange={(value) => handleInputChange('clientId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر العميل" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client: any) => (
                        <SelectItem key={client.id} value={client.id.toString()}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="trip" className="text-right">
                    الرحلة *
                  </Label>
                  <Select value={formData.tripId} onValueChange={(value) => handleInputChange('tripId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الرحلة" />
                    </SelectTrigger>
                    <SelectContent>
                      {trips.map((trip: any) => (
                        <SelectItem key={trip.id} value={trip.id.toString()}>
                          {trip.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="totalAmount" className="text-right">
                    المبلغ الإجمالي (دج) *
                  </Label>
                  <Input
                    id="totalAmount"
                    type="number"
                    className="text-right"
                    placeholder="85000"
                    value={formData.totalAmount}
                    onChange={(e) => handleInputChange('totalAmount', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paidAmount" className="text-right">
                    المبلغ المدفوع (دج)
                  </Label>
                  <Input
                    id="paidAmount"
                    type="number"
                    className="text-right"
                    placeholder="0"
                    value={formData.paidAmount}
                    onChange={(e) => handleInputChange('paidAmount', e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-right">
                  ملاحظات
                </Label>
                <Textarea
                  id="notes"
                  className="text-right"
                  placeholder="ملاحظات إضافية..."
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="w-full sm:w-auto"
                disabled={isLoading}
              >
                إلغاء
              </Button>
              <Button
                className="bg-gradient-to-r from-teal-500 to-blue-600 w-full sm:w-auto"
                onClick={handleSubmit}
                disabled={isLoading}
              >
                {isLoading ? "جاري الحفظ..." : "حفظ الحجز"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
        <div className="relative flex-1 max-w-full sm:max-w-md">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="البحث في الحجوزات..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10 text-right"
          />
        </div>

      </div>

      {/* Bookings Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-right">قائمة الحجوزات</CardTitle>
          <CardDescription className="text-right">جميع الحجوزات المسجلة في النظام</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right min-w-[100px]">رقم الحجز</TableHead>
                <TableHead className="text-right min-w-[120px]">العميل</TableHead>
                <TableHead className="text-right min-w-[150px]">الرحلة</TableHead>
                <TableHead className="text-right min-w-[100px]">تاريخ الحجز</TableHead>
                <TableHead className="text-right min-w-[120px]">المبلغ الإجمالي</TableHead>
                <TableHead className="text-right min-w-[120px]">المبلغ المدفوع</TableHead>
                <TableHead className="text-right min-w-[100px]">حالة الدفع</TableHead>
                <TableHead className="text-right min-w-[150px]">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBookings.map((booking: any) => (
                <TableRow key={booking.id}>
                  <TableCell className="text-right">
                    <div className="font-mono font-medium">#{booking.id}</div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{getClientName(booking.clientId)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="font-medium">{getTripName(booking.tripId)}</div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{booking.bookingDate}</span>
                    </div>
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{booking.totalAmount.toLocaleString()} دج</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="font-medium text-teal-600">{booking.paidAmount.toLocaleString()} دج</div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={getPaymentStatusBadgeVariant(booking.paymentStatus)}>{booking.paymentStatus}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full sm:w-auto"
                        onClick={() => showBookingDetails(booking)}
                      >
                        <Eye className="h-3 w-3 ml-1" />
                        عرض
                      </Button>

                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Booking Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="text-right">تفاصيل الحجز #{selectedBooking?.id}</DialogTitle>
            <DialogDescription className="text-right">معلومات مفصلة عن الحجز</DialogDescription>
          </DialogHeader>

          {selectedBooking && (
            <div className="space-y-4">
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                <div className="text-right">
                  <label className="text-sm font-medium text-gray-500">العميل</label>
                  <p className="font-medium">{getClientName(selectedBooking.clientId)}</p>
                </div>
                <div className="text-right">
                  <label className="text-sm font-medium text-gray-500">الرحلة</label>
                  <p className="font-medium">{getTripName(selectedBooking.tripId)}</p>
                </div>
                <div className="text-right">
                  <label className="text-sm font-medium text-gray-500">تاريخ الحجز</label>
                  <p className="font-medium">{selectedBooking.bookingDate}</p>
                </div>
                <div className="text-right">
                  <label className="text-sm font-medium text-gray-500">حالة الحجز</label>
                  <Badge variant={getStatusBadgeVariant(selectedBooking.status)}>
                    {selectedBooking.status}
                  </Badge>
                </div>
                <div className="text-right">
                  <label className="text-sm font-medium text-gray-500">المبلغ الإجمالي</label>
                  <p className="font-medium text-teal-600">{selectedBooking.totalAmount.toLocaleString()} دج</p>
                </div>
                <div className="text-right">
                  <label className="text-sm font-medium text-gray-500">المبلغ المدفوع</label>
                  <p className="font-medium text-green-600">{selectedBooking.paidAmount.toLocaleString()} دج</p>
                </div>
              </div>

              {selectedBooking.notes && (
                <div className="text-right">
                  <label className="text-sm font-medium text-gray-500">ملاحظات</label>
                  <p className="font-medium">{selectedBooking.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-right">إجمالي الحجوزات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-right">{bookings.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-right">إجمالي الإيرادات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-teal-600 text-right">
              {bookings.reduce((sum: number, booking: any) => sum + booking.paidAmount, 0).toLocaleString()} دج
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </DashboardLayout>

  )
}