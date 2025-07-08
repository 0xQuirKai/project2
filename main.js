import { app, BrowserWindow, ipcMain , shell} from 'electron';
import { join  } from 'path';
import { mkdir, readFile, writeFile, readdir } from 'fs/promises';
import { appendFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { existsSync, mkdirSync, copyFileSync } from 'fs';
import { readdirSync, statSync } from "fs";

function copyFolderRecursiveSync(src, dest) {
  const entries = readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);

    if (entry.isDirectory()) {
      mkdirSync(destPath, { recursive: true });
      copyFolderRecursiveSync(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ───────────── GLOBAL PATHS ─────────────
let dataDir = '';
let TRIPS_PATH = '';
let BOOKINGS_PATH = '';
let CLIENTS_PATH = '';
let PASSPORTS_DIR = '';

const initPaths = () => {
  dataDir = join(app.getPath('userData'), 'data');
  TRIPS_PATH = join(dataDir, 'trips.json');
  BOOKINGS_PATH = join(dataDir, 'bookings.json');
  CLIENTS_PATH = join(dataDir, 'clients.json');
  PASSPORTS_DIR = join(dataDir, 'public', 'uploads', 'passports');

  console.log('📁 Using data dir:', dataDir);
};

function copyDefaultsIfMissing() {
  const sourceDataDir = join(process.resourcesPath, 'data'); // JSON files
  const sourceUploadsDir = join(process.resourcesPath, 'public', 'uploads', 'passports'); // uploads

  // Ensure data dir exists
  mkdirSync(dataDir, { recursive: true });

  // Copy JSON files
  const files = ['trips.json', 'bookings.json', 'clients.json'];
  for (const file of files) {
    const src = join(sourceDataDir, file);
    const dest = join(dataDir, file);
    if (!existsSync(dest)) {
      copyFileSync(src, dest);
      console.log(`✅ Copied default ${file} to userData folder`);
    }
  }

  // Copy uploads/passports if missing
  const destUploadsDir = join(dataDir, 'public', 'uploads', 'passports');
  if (!existsSync(destUploadsDir)) {
    mkdirSync(destUploadsDir, { recursive: true });
    copyFolderRecursiveSync(sourceUploadsDir, destUploadsDir);
    console.log('✅ Copied default passports upload folder');
  }
}


const createWindow = async () => {
  await mkdir(dataDir, { recursive: true });


  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,       // ✅ must be false
    sandbox: false,
      webSecurity: false, // important for file:// access

    },
  });

  win.loadFile(join(__dirname, 'out', 'index.html'));
};

// ───────────── HELPERS ─────────────
function generateId(list) {
  if (!Array.isArray(list) || list.length === 0) return 1;
  return (list[list.length - 1]?.id || 0) + 1;
}

function sanitizeName(name) {
  return name.normalize("NFD")
             .replace(/[\u0300-\u036f]/g, '')
             .replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '_');
}

// ───────────── API HANDLERS ─────────────
ipcMain.handle('get-bookings', async () => {
  try {
    const bookings = JSON.parse(await readFile(BOOKINGS_PATH, 'utf-8'));
    return { success: true, bookings };
  } catch (error) {
    console.error('get-bookings error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-clients', async () => {
  try {
    const clients = JSON.parse(await readFile(CLIENTS_PATH, 'utf-8'));
    return { success: true, clients };
  } catch (error) {
    console.error('get-clients error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-trips', async () => {
  try {
    const trips = JSON.parse(await readFile(TRIPS_PATH, 'utf-8'));
    return { success: true, trips };
  } catch (error) {
    console.error('get-trips error:', error);
    return { success: false, error: error.message };
  }
});


// 1. Create trip
ipcMain.handle('create-trip', async (event, newTrip) => {
  try {
    const requiredFields = ['destination', 'startDate', 'endDate', 'price'];
    for (const field of requiredFields) {
      if (!(field in newTrip) || newTrip[field] === undefined || newTrip[field] === null) {
        newTrip[field] = field === 'price' ? 0 : '';
      }
    }

    const trips = JSON.parse(await readFile(TRIPS_PATH, 'utf-8'));
    newTrip.id = generateId(trips);
    trips.push(newTrip);
    await writeFile(TRIPS_PATH, JSON.stringify(trips, null, 2), 'utf-8');

    return { success: true, trip: newTrip };
  } catch (error) {
    console.error('Error saving trip:', error);
    return { success: false, error: 'Failed to save trip' };
  }
});

// 2. Add booking
ipcMain.handle('add-booking', async (event, bookingData) => {
  console.log("📥 Received booking data:", bookingData);

  try {
    let bookings = [];

    try {
      const raw = await readFile(BOOKINGS_PATH, 'utf-8');
      bookings = JSON.parse(raw);
      console.log("✅ Loaded bookings:", bookings.length);
    } catch (readErr) {
      console.warn("⚠️ No bookings file found. Creating a new one.");
      bookings = [];
    }

    const newBooking = {
      ...bookingData,
      id: bookings.length > 0 ? bookings[bookings.length - 1].id + 1 : 1,
      bookingDate: new Date().toISOString().split('T')[0],
      status: 'قيد الانتظار',
      paymentStatus:
        bookingData.paidAmount >= bookingData.totalAmount
          ? 'مدفوع بالكامل'
          : bookingData.paidAmount > 0
          ? 'دفع جزئي'
          : 'غير مدفوع',
    };

    bookings.push(newBooking);
    await writeFile(BOOKINGS_PATH, JSON.stringify(bookings, null, 2), 'utf-8');
    console.log("💾 Booking saved successfully.");

    // Update client's totalSpent
    try {
      const clientsRaw = await readFile(CLIENTS_PATH, 'utf-8');
      const clients = JSON.parse(clientsRaw);
      const clientIndex = clients.findIndex(c => c.id === bookingData.clientId);
      if (clientIndex !== -1) {
        clients[clientIndex].totalSpent =
          (clients[clientIndex].totalSpent || 0) + (bookingData.paidAmount || 0);
           clients[clientIndex].totalBookings =
          (clients[clientIndex].totalBookings || 0) + 1;
        await writeFile(CLIENTS_PATH, JSON.stringify(clients, null, 2), 'utf-8');
        console.log("🧾 Client updated:", clients[clientIndex]);
      } else {
        console.warn("❓ Client not found.");
      }
    } catch (clientErr) {
      console.error("❌ Error updating client:", clientErr);
    }

    return { success: true, booking: newBooking };
  } catch (err) {
    console.error("🔥 add-booking handler failed:", err);
    return { success: false, error: 'Internal server error' };
  }
});


// 3. Get client passport files
ipcMain.handle('get-client-files', async (event, clientName) => {
  try {
    const safeName = clientName.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filePath = join(PASSPORTS_DIR, `client_${safeName}.pdf`);

  if (existsSync(filePath)) {
    return { success: true, path: filePath };
  } else {
    return { success: false, message: 'File not found' };
  }
  }
  catch (err) {
    console.error('❌ Error opening passport files:', err);
    return { success: false, message: 'Server error' };
  }
});

// 4. Delete client and bookings
ipcMain.handle('delete-client', async (event, clientId) => {
  try {
    clientId = parseInt(clientId);
    if (isNaN(clientId)) return { success: false, error: 'Invalid ID' };

    const clients = JSON.parse(await readFile(CLIENTS_PATH, 'utf-8'));
    const updatedClients = clients.filter(c => c.id !== clientId);
    await writeFile(CLIENTS_PATH, JSON.stringify(updatedClients, null, 2), 'utf-8');

    const bookings = JSON.parse(await readFile(BOOKINGS_PATH, 'utf-8'));
    const updatedBookings = bookings.filter(b => b.clientId !== clientId);
    await writeFile(BOOKINGS_PATH, JSON.stringify(updatedBookings, null, 2), 'utf-8');

    return { success: true };
  } catch (err) {
    console.error('Error deleting client:', err);
    return { success: false, error: 'Server error' };
  }
});

// 5. Add new client
ipcMain.handle('add-client', async (event, newClient) => {
  try {
    const clients = JSON.parse(await readFile(CLIENTS_PATH, 'utf-8'));
    newClient.id = generateId(clients);
    clients.push(newClient);
    await writeFile(CLIENTS_PATH, JSON.stringify(clients, null, 2), 'utf-8');
    return { success: true, client: newClient };
  } catch (error) {
    console.error('Error saving client:', error);
    return { success: false, error: 'Server error' };
  }
});

// 6. Get clients for a specific trip
ipcMain.handle('get-trip-clients', async (event, tripId) => {
  try {
    tripId = Number(tripId);
    if (isNaN(tripId)) return { error: 'Invalid tripId' };

    const bookings = JSON.parse(await readFile(BOOKINGS_PATH, 'utf-8'));
    const clients = JSON.parse(await readFile(CLIENTS_PATH, 'utf-8'));

    const result = bookings.filter(b => b.tripId === tripId).map(b => {
        const client = clients.find(c => c.id === b.clientId);
        return client ? { ...client, booking: b } : null;
      }).filter(Boolean);

    return result;
  } catch (error) {
    console.error('Error fetching trip clients:', error);
    return { error: 'Internal Server Error' };
  }
});

// 7. Upload passport image
ipcMain.handle('upload-passport', async (event, clientName, fileBuffers) => {
  try {
    if (!clientName || !fileBuffers?.length) {
      return { success: false, message: 'Missing client name or files' };
    }

    await mkdir(PASSPORTS_DIR, { recursive: true });

    const savedFiles = [];
    for (const file of fileBuffers) {
      const { name, data } = file;
      const ext = name.split('.').pop() || 'jpg';
      const safeName = sanitizeName(clientName);
      const fileName = `client_${safeName}.${ext}`;
      const filePath = join(PASSPORTS_DIR, fileName);
      const buffer = Buffer.from(data, 'base64');
      await writeFile(filePath, buffer);
      savedFiles.push(fileName);
    }

    return { success: true, files: savedFiles };
  } catch (error) {
    console.error('Upload error:', error);
    return { success: false, message: 'Upload failed' };
  }
});

// ───────────── APP INIT ─────────────
app.whenReady().then(() => {
    initPaths();      // ✅ initialize all paths here
   copyDefaultsIfMissing()
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
