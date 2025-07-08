"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import DashboardLayout from "@/components/layouts/DashboardLayout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { FileUpload } from "@/components/ui/file-upload"
import { Plus, Search, Phone, Mail, FileText, AlertTriangle, Download, Upload } from "lucide-react"
import { DataManager } from "@/lib/data-manager"

// Define the Client interface
interface Client {
  id: number
  name: string
  phone: string
  email: string
  passportNumber?: string
  passportExpiry?: string
  address?: string
  dateOfBirth?: string
  emergencyContact?: string
  totalBookings?: number
  totalSpent?: number
}
function sanitizeFileName(name: string) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '_');
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
    const [selectedClient, setSelectedClient] = useState<any | null>(null);

  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
   const [open, setOpen] = useState(false);
const [passportPath, setPassportPath] = useState<string | null>(null);

 // or .png if needed
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    passportNumber: "",
    passportExpiry: "",
    address: "",
    dateOfBirth: "",
    emergencyContact: "",
    totalSpent: 0,
    totalBookings: 0,


  })

  const dataManager = DataManager.getInstance()

  useEffect(() => {
    loadClients()
  }, [])

  const loadClients = async () => {
    try {
      // Try to load from localStorage first, then fallback to JSON import

    if (!window.api) {
      throw new Error("window.api is not available");
    }
    const clientsData = await window.api.getClients();

    setClients(clientsData.clients);
    console.log("Loaded clientsData:", clientsData);

    localStorage.setItem('clients', JSON.stringify(clientsData));

    } catch (error) {
      console.error("Error loading clients:", error)
    }
  }
  useEffect(() => {
  const loadPassport = async () => {
    if (!window.api) {
      console.error("window.api is not available");
      return;
    }
    const res = await window.api.getClientFiles(selectedClient.name);
    if (Array.isArray(res) && res.length > 0 && res[0].path) {
      console.log(res[0].path);
      setPassportPath(`file://${res[0].path}`);
    } else if (res && res.path) {
      console.log(res.path);
      setPassportPath(`file://${res.path}`);
    } else {
      console.error(res.message || "No files found for this client.");
    }
  };

  if (selectedClient) {
    loadPassport();
  }
}, [selectedClient]);
const handleDelete = async (clientId: number) => {
  const confirmed = confirm("هل أنت متأكد من حذف هذا العميل و حجوزاته السابقة ما يعني خسارتها نهائيا ؟");
  if (!confirmed) return;

  if (!window.api) return alert("Electron API not available.");

  const res = await window.api.deleteClient(clientId);

  if (res.success) {
    setClients(prev => prev.filter(c => c.id !== clientId));
  } else {
    alert("فشل في الحذف.");
  }
};

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleFileSelect = (files: File[]) => {
    setSelectedFiles(files)
  }
const handleUpload = async (name: string) => {

  if (!window.api) return alert("Electron API not available.");

  const fileBuffers = await Promise.all(
    selectedFiles.map(async (file) => {
      const buffer = await file.arrayBuffer();
      return {
        name: file.name,
        data: Buffer.from(buffer).toString('base64'),
      };
    })
  );

  try {
    const res = await window.api.uploadPassport(name, fileBuffers);
    if (res.success) {
      alert('Files uploaded successfully!');
    } else {
      alert('Upload failed.');
    }
  } catch (err) {
    console.error('Upload error:', err);
    alert('An error occurred during upload.');
  }
};


  const handleSubmit = async () => {
    if (!formData.name || !formData.phone || !formData.email) {
      alert("يرجى ملء جميع الحقول المطلوبة")
      return
    }

    setIsLoading(true)

    try {
      // Add client to data
      const success = await dataManager.addClient(formData)
      handleUpload(formData.name)
      if (success) {
        // Upload files if any
        if (selectedFiles.length > 0) {
          const newClientId = dataManager.generateId(clients)
          for (const file of selectedFiles) {
          }
        }

        // Reload clients
        await loadClients()

        // Reset form
        setFormData({
          name: "",
          phone: "",
          email: "",
          passportNumber: "",
          passportExpiry: "",
          address: "",
          dateOfBirth: "",
          emergencyContact: "",
          totalSpent: 0,
          totalBookings: 0,
        })
        setSelectedFiles([])
        setIsDialogOpen(false)

        alert("تم إضافة العميل بنجاح!")
      } else {
        alert("حدث خطأ أثناء إضافة العميل")
      }
    } catch (error) {
      console.error("Error adding client:", error)
      alert("حدث خطأ أثناء إضافة العميل")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownloadFiles = (clientId: number) => {
    const files = dataManager.getClientFiles(clientId)
    if (files.length === 0) {
      alert("لا توجد ملفات لهذا العميل")
      return
    }

    files.forEach(file => {
      dataManager.downloadFile(clientId, file.fileName)
    })
  }

  const filteredClients = clients.filter((client: Client) =>
  client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
  client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
  client.phone?.includes(searchTerm)
);


  const downloadPDF = () => {
    const pdfContent = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>تقرير العملاء</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            direction: rtl;
            text-align: right;
            margin: 20px;
            line-height: 1.6;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #0d9488;
            padding-bottom: 20px;
        }
        .header h1 {
            color: #0d9488;
            margin: 0;
        }
        .header p {
            color: #666;
            margin: 5px 0;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: right;
        }
        th {
            background-color: #0d9488;
            color: white;
            font-weight: bold;
        }
        tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        .status-valid {
            color: #059669;
            font-weight: bold;
        }
        .status-expired {
            color: #dc2626;
            font-weight: bold;
        }
        .footer {
            margin-top: 30px;
            text-align: center;
            color: #666;
            font-size: 12px;
        }
        .summary {
            background-color: #f0fdfa;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .summary h3 {
            color: #0d9488;
            margin-top: 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>وكالة السفر والسياحة</h1>
        <p>تقرير شامل لجميع العملاء</p>
        <p>تاريخ التقرير: ${new Date().toLocaleDateString('ar-SA')}</p>
    </div>

    <div class="summary">
        <h3>ملخص العملاء</h3>
        <p><strong>إجمالي العملاء:</strong> ${clients.length}</p>
        <p><strong>إجمالي الإيرادات:</strong> ${clients.reduce((sum: number, client: any) => sum + client.totalSpent, 0).toLocaleString()} دج</p>
    </div>

    <table>
        <thead>
            <tr>
                <th>الاسم</th>
                <th>الهاتف</th>
                <th>البريد الإلكتروني</th>
                <th>رقم الجواز</th>
                <th>انتهاء الجواز</th>
                <th>إجمالي المبلغ</th>
            </tr>
        </thead>
        <tbody>
            ${filteredClients.map((client: any) => `
                <tr>
                    <td>${client.name}</td>
                    <td>${client.phone}</td>
                    <td>${client.email}</td>
                    <td>${client.passportNumber}</td>
                    <td>${client.passportExpiry}</td>
                    <td>${client.totalSpent.toLocaleString()} دج</td>
                </tr>
            `).join('')}
        </tbody>
    </table>

    <div class="footer">
        <p>تم إنشاء هذا التقرير بواسطة نظام إدارة وكالة السفر والسياحة</p>
        <p>جميع الحقوق محفوظة © ${new Date().getFullYear()}</p>
    </div>
</body>
</html>
    `

    const blob = new Blob([pdfContent], { type: 'text/html' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `تقرير_العملاء_${new Date().toISOString().split('T')[0]}.html`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  return (
    <DashboardLayout> <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">إدارة العملاء</h1>
          <p className="text-gray-600 text-sm sm:text-base">إدارة معلومات العملاء ووثائقهم</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button
            onClick={downloadPDF}
            variant="outline"
            className="bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 w-full sm:w-auto"
          >
            <Download className="ml-2 h-4 w-4" />
            تحميل PDF
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 w-full sm:w-auto">
                <Plus className="ml-2 h-4 w-4" />
                إضافة عميل جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl mx-4 sm:mx-auto max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-right">إضافة عميل جديد</DialogTitle>
                <DialogDescription className="text-right">أدخل معلومات العميل الجديد</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-right">
                      الاسم الكامل *
                    </Label>
                    <Input
                      id="name"
                      className="text-right"
                      placeholder="مثال: أحمد محمد"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-right">
                      رقم الهاتف *
                    </Label>
                    <Input
                      id="phone"
                      className="text-right"
                      placeholder="0555123456"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-right">
                    البريد الإلكتروني *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    className="text-right"
                    placeholder="example@email.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="passport" className="text-right">
                      رقم جواز السفر
                    </Label>
                    <Input
                      id="passport"
                      className="text-right"
                      placeholder="A12345678"
                      value={formData.passportNumber}
                      onChange={(e) => handleInputChange('passportNumber', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="passportExpiry" className="text-right">
                      تاريخ انتهاء الجواز
                    </Label>
                    <Input
                      id="passportExpiry"
                      type="date"
                      value={formData.passportExpiry}
                      onChange={(e) => handleInputChange('passportExpiry', e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-right">
                      العنوان
                    </Label>
                    <Input
                      id="address"
                      className="text-right"
                      placeholder="العنوان الكامل"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth" className="text-right">
                      تاريخ الميلاد
                    </Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyContact" className="text-right">
                    جهة الاتصال في حالات الطوارئ
                  </Label>
                  <Input
                    id="emergencyContact"
                    className="text-right"
                    placeholder="رقم هاتف للطوارئ"
                    value={formData.emergencyContact}
                    onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                  />
                </div>

                {/* File Upload Section */}
                <div className="space-y-2">
                  <Label className="text-right">رفع الوثائق (جواز السفر، صور شخصية، إلخ)</Label>
                  <FileUpload
                    onFileSelect={handleFileSelect}
                    accept=".pdf"
                    multiple={true}
                    maxSize={10}
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
                  {isLoading ? "جاري الحفظ..." : "حفظ العميل"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-full sm:max-w-md">
        <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="البحث في العملاء..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pr-10 text-right"
        />
      </div>

      {/* Clients Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-right">قائمة العملاء</CardTitle>
          <CardDescription className="text-right">جميع العملاء المسجلين في النظام</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right min-w-[120px]">الاسم</TableHead>
                <TableHead className="text-right min-w-[150px]">معلومات الاتصال</TableHead>
                <TableHead className="text-right min-w-[120px]">جواز السفر</TableHead>
                <TableHead className="text-right min-w-[120px]">إجمالي المبلغ</TableHead>
                <TableHead className="text-right min-w-[150px]">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client: any) => (
                <TableRow key={client.id}>
                  <TableCell className="text-right">
                    <div className="font-medium">{client.name}</div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-sm">
                        <Phone className="h-3 w-3" />
                        {client.phone}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {client.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="space-y-1">
                      <div className="font-mono text-sm">{client.passportNumber}</div>
                      <div className="text-xs text-muted-foreground">ينتهي: {client.passportExpiry}</div>
                    </div>
                  </TableCell>


                  <TableCell className="text-right">
                    <div className="font-medium text-teal-600">{client.totalSpent.toLocaleString()} دج</div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-col sm:flex-row gap-2">

<Button
        onClick={() => setSelectedClient(client)

        }
variant="outline" size="sm" className="w-full sm:w-auto" >
         الوثائق
      </Button>

      {selectedClient && !open && (
        <div className="fixed inset-0  flex items-center justify-center z-50">
          <div className="client-doc-modal">
            <button
              onClick={() => setSelectedClient(false)}
              className="client-doc-close"
            >
              ✕
            </button>
            <h2 className="client-doc-title">وثيقة - {selectedClient.name}</h2>
            {passportPath ? (
              <iframe
                src={passportPath}
                title={`${client.name} document`}
                className="client-doc-iframe"
                width="750px"
  height="700px"
                onError={() => setSelectedClient(false)}
              />
            ) : (
              <div className="client-doc-error">لا يوجد ملف متاح للعرض</div>
            )}
          </div>
        </div>
      )}
<Dialog
    open={selectedClient && selectedClient.id === client.id && open}
    onOpenChange={(open) => {
        setOpen(open);
        if (!open) setSelectedClient(false);
    }}
>
    <DialogTrigger asChild>
        <Button
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
            onClick={() => {
                setSelectedClient(client);
                setOpen(true);
            }}
        >
            التفاصيل
        </Button>
    </DialogTrigger>
    <DialogContent className="max-w-lg mx-auto">
        <DialogHeader>
            <DialogTitle className="text-right">تفاصيل العميل</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 text-right" dir="rtl">
            <div><strong>الاسم:</strong> {client.name}</div>
            <div><strong>رقم الهاتف:</strong> {client.phone}</div>
            <div><strong>البريد الإلكتروني:</strong> {client.email}</div>
            <div><strong>رقم جواز السفر:</strong> {client.passportNumber || "-"}</div>
            <div><strong>تاريخ انتهاء الجواز:</strong> {client.passportExpiry || "-"}</div>
            <div><strong>العنوان:</strong> {client.address || "-"}</div>
            <div><strong>تاريخ الميلاد:</strong> {client.dateOfBirth || "-"}</div>
            <div><strong>جهة الاتصال للطوارئ:</strong> {client.emergencyContact || "-"}</div>
            <div><strong>إجمالي الحجوزات:</strong> {client.totalBookings ?? 0}</div>
            <div><strong>إجمالي المبلغ:</strong> {client.totalSpent?.toLocaleString() ?? 0} دج</div>
        </div>
    </DialogContent>
</Dialog>

                      <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => handleDelete(client.id)}
>
                        حدف
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-right">إجمالي العملاء</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-right">{clients.length}</div>
          </CardContent>
        </Card>
        <Card>


        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-right">إجمالي الإيرادات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-teal-600 text-right">
              {clients.reduce((sum: number, client: any) => sum + client.totalSpent, 0).toLocaleString()} دج
            </div>
          </CardContent>
        </Card>
      </div>
    </div></DashboardLayout>

  )
}