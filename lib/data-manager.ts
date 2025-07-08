

export class DataManager {
  private static instance: DataManager;

  private constructor() {}

  static getInstance(): DataManager {
    if (!DataManager.instance) {
      DataManager.instance = new DataManager();
    }
    return DataManager.instance;
  }

  // Generic method to save data to JSON files
  async saveData(fileName: string, data: any): Promise<boolean> {
    try {
      // In a real application, this would make an API call to save data
      // For now, we'll simulate saving to localStorage and update the JSON structure
      const existingData = localStorage.getItem(fileName);
      let parsedData = existingData ? JSON.parse(existingData) : {};

      // Merge new data with existing data
      Object.assign(parsedData, data);

      localStorage.setItem(fileName, JSON.stringify(parsedData));
      return true;
    } catch (error) {
      console.error(`Error saving ${fileName}:`, error);
      return false;
    }
  }

  // Generic method to load data from JSON files
  async loadData(fileName: string): Promise<any> {
    try {
      const data = localStorage.getItem(fileName);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Error loading ${fileName}:`, error);
      return null;
    }
  }

  // Generate unique ID
  generateId(existingItems: any[]): number {
    const maxId = existingItems.length > 0 ? Math.max(...existingItems.map(item => item.id)) : 0;
    return maxId + 1;
  }



  // Get client files
  getClientFiles(clientId: number): any[] {
    const files = JSON.parse(localStorage.getItem('clientFiles') || '{}');
    return files[clientId] || [];
  }

  // Download file
  downloadFile(clientId: number, fileName: string): void {
    const files = this.getClientFiles(clientId);
    const file = files.find(f => f.fileName === fileName);

    if (file) {
      const link = document.createElement('a');
      link.href = file.url;
      link.download = file.originalName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  // Add new client
  async  addClient(clientData: any): Promise<boolean> {
  if (!window.api) {
    // fallback: store in localStorage
    const clients = JSON.parse(localStorage.getItem('clients') || '[]');
    const newClient = {
      ...clientData,
      id: clients.length ? clients[clients.length - 1].id + 1 : 1,
      totalBookings: 0,
      totalSpent: 0,
      documents: ["جواز السفر", "صورة شخصية"],
      visaStatus: "صالحة"
    };
    clients.push(newClient);
    localStorage.setItem('clients', JSON.stringify(clients));
    return true;
  }

  try {
    const result = await window.api.addClient(clientData);
    return (result as { success: boolean }).success;
  } catch (error) {
    console.error("❌ Failed to add client via Electron API:", error);
    return false;
  }
}

async addBooking(bookingData: any): Promise<boolean> {
  try {
    interface WindowWithApi extends Window {
      api?: {
        addBooking?: (
          data: any
        ) => Promise<{ success: boolean; booking?: any; error?: any }>;
      };
    }

    const win = window as WindowWithApi;

    let result:
      | { success: boolean; booking?: any; error?: any }
      | undefined;

    if (win.api?.addBooking) {
      console.log("📡 Using Electron API to add booking...");
      result = await win.api.addBooking(bookingData);
    } else {
      console.warn("⚠️ Electron API not found. Falling back to localStorage...");
      let bookings: any[] = [];

      try {
        const stored = localStorage.getItem("bookings");
        bookings = stored ? JSON.parse(stored) : [];
      } catch (e) {
        console.warn("⚠️ Failed to parse localStorage 'bookings'. Resetting.");
        bookings = [];
      }

      const newBooking = {
        ...bookingData,
        id: bookings.length > 0 ? bookings[bookings.length - 1].id + 1 : 1,
        status: "جديد",
      };

      bookings.push(newBooking);
      localStorage.setItem("bookings", JSON.stringify(bookings));

      result = { success: true, booking: newBooking };
    }

    if (result.success) {
      console.log("✅ Booking added:", result.booking);
      return true;
    } else {
      console.error("❌ Failed to add booking:", result.error);
      return false;
    }
  } catch (error) {
    console.error("🔥 Exception in addBooking:", error);
    return false;
  }
}


  // Add new trip
  async addTrip(tripData: any): Promise<boolean> {
    try {
      const trips = JSON.parse(localStorage.getItem('trips') || '[]');
      // Fill empty fields with "empty" or 0
      const filledTripData = { ...tripData };
      for (const key in filledTripData) {
        if (
          filledTripData[key] === undefined ||
          filledTripData[key] === null ||
          filledTripData[key] === ""
        ) {
          // If it's a number field, set to 0, else "empty"
          filledTripData[key] =
            typeof filledTripData[key] === "number" ? 0 : "empty";
        }
      }
      const newTrip = {
        ...filledTripData,
        id: this.generateId(trips),
        booked: 0,
        status: "قيد التخطيط",
        image: "/placeholder.svg?height=200&width=300"
      };  trips.push(newTrip);
      localStorage.setItem('trips', JSON.stringify(trips));
      return true;
    } catch (error) {
      console.error('Error adding trip:', error);
      return false;
    }
  }

  // Add new booking








  // Update booking status
  async updateBookingStatus(bookingId: number, status: string): Promise<boolean> {
    try {
      const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
      const bookingIndex = bookings.findIndex((b: any) => b.id === bookingId);
      if (bookingIndex !== -1) {
        bookings[bookingIndex].status = status;
        localStorage.setItem('bookings', JSON.stringify(bookings));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating booking status:', error);
      return false;
    }
  }
}