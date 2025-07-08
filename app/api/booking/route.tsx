// app/api/add-booking/route.ts
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const BOOKINGS_PATH = path.join(process.cwd(), 'data', 'bookings.json');

function generateId(bookings: any[]): number {
  if (bookings.length === 0) return 1;
  const lastId = bookings[bookings.length - 1].id || 0;
  return lastId + 1;
}

export async function POST(req: NextRequest) {
  try {
    const bookingData = await req.json();

    // Read existing bookings
    let bookings: any[] = [];
    try {
      const data = await fs.readFile(BOOKINGS_PATH, 'utf-8');
      bookings = JSON.parse(data);
      if (!Array.isArray(bookings)) bookings = [];
    } catch {
      bookings = [];
    }

    const newBooking = {
      ...bookingData,
      id: generateId(bookings),
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
    await fs.writeFile(BOOKINGS_PATH, JSON.stringify(bookings, null, 2), 'utf-8');
    // Update client's totalSpent
    const CLIENTS_PATH = path.join(process.cwd(), 'data', 'clients.json');
    try {
      const clientsData = await fs.readFile(CLIENTS_PATH, 'utf-8');
      const clients = JSON.parse(clientsData);
      const clientIndex = clients.findIndex((c: any) => c.id === bookingData.clientId);
      if (clientIndex !== -1) {
      clients[clientIndex].totalSpent =
        (clients[clientIndex].totalSpent || 0) + (bookingData.paidAmount || 0);
      await fs.writeFile(CLIENTS_PATH, JSON.stringify(clients, null, 2), 'utf-8');
      }
    } catch (e) {
      // If clients file doesn't exist or error occurs, skip updating totalSpent
      console.error('Error updating client totalSpent:', e);
    }
    return NextResponse.json({ success: true, booking: newBooking });


    
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
