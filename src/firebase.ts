import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  limit
} from 'firebase/firestore';
import { Room, Resident, Payment, Complaint, Expense } from './types';

// Web app's Firebase configuration (using Vite environment variables or fallback values)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "mock-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "mock-project.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "mock-project",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "mock-project.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789:web:abcdef",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Helper to determine if we are using the fallback mock configuration
export const isMockFirebase = !import.meta.env.VITE_FIREBASE_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY === "mock-api-key";


// Seeding function: Populate Firestore collections if they are empty
export const seedDatabaseIfEmpty = async (
  initialRooms: Room[],
  initialResidents: Resident[],
  initialPayments: Payment[],
  initialComplaints: Complaint[],
  initialExpenses: Expense[]
) => {
  try {
    const q = query(collection(db, 'rooms'), limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      console.log('Firestore is empty. Seeding initial data...');

      // Seed Rooms (Document ID uses hostelId_roomId to avoid duplicates)
      for (const room of initialRooms) {
        await setDoc(doc(db, 'rooms', `${room.hostelId || '1'}_${room.id}`), room);
      }

      // Seed Residents
      for (const resident of initialResidents) {
        await setDoc(doc(db, 'residents', resident.id), resident);
      }

      // Seed Payments
      for (const payment of initialPayments) {
        await setDoc(doc(db, 'payments', payment.id), payment);
      }

      // Seed Complaints
      for (const complaint of initialComplaints) {
        await setDoc(doc(db, 'complaints', complaint.id), complaint);
      }

      // Seed Expenses
      for (const expense of initialExpenses) {
        await setDoc(doc(db, 'expenses', expense.id), expense);
      }

      console.log('Database seeded successfully.');
    }
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};

// --- CRUD Helpers ---

// Rooms
export const dbAddRoom = async (room: Room) => {
  await setDoc(doc(db, 'rooms', `${room.hostelId || '1'}_${room.id}`), room);
};

export const dbEditRoom = async (room: Room) => {
  await setDoc(doc(db, 'rooms', `${room.hostelId || '1'}_${room.id}`), room);
};

// Residents
export const dbAddResident = async (resident: Resident) => {
  await setDoc(doc(db, 'residents', resident.id), resident);
};

export const dbEditResident = async (resident: Resident) => {
  await setDoc(doc(db, 'residents', resident.id), resident);
};

export const dbDeleteResident = async (id: string) => {
  await deleteDoc(doc(db, 'residents', id));
};

// Payments
export const dbAddPayment = async (payment: Payment) => {
  await setDoc(doc(db, 'payments', payment.id), payment);
};

export const dbEditPayment = async (payment: Payment) => {
  await setDoc(doc(db, 'payments', payment.id), payment);
};

export const dbDeletePayment = async (id: string) => {
  await deleteDoc(doc(db, 'payments', id));
};

// Complaints
export const dbAddComplaint = async (complaint: Complaint) => {
  await setDoc(doc(db, 'complaints', complaint.id), complaint);
};

export const dbEditComplaint = async (complaint: Complaint) => {
  await setDoc(doc(db, 'complaints', complaint.id), complaint);
};

export const dbDeleteComplaint = async (id: string) => {
  await deleteDoc(doc(db, 'complaints', id));
};

// Expenses
export const dbAddExpense = async (expense: Expense) => {
  await setDoc(doc(db, 'expenses', expense.id), expense);
};

export const dbDeleteExpense = async (id: string) => {
  await deleteDoc(doc(db, 'expenses', id));
};
