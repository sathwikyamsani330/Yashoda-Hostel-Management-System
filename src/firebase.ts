import { initializeApp, getApp, getApps } from 'firebase/app';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
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

// Helper to retrieve the current active configuration
export const getActiveFirebaseConfig = () => {
  // Check URL params first for shared live sync settings
  try {
    if (typeof window !== 'undefined' && window.location && window.location.search) {
      const params = new URLSearchParams(window.location.search);
      const dbParam = params.get('db_sync');
      if (dbParam) {
        const decoded = atob(dbParam);
        const parsed = JSON.parse(decoded);
        if (parsed.projectId && parsed.apiKey) {
          localStorage.setItem('yashoda_firebase_config', JSON.stringify(parsed));
          // Clean the query parameters from the address bar to keep it tidy
          const url = new URL(window.location.href);
          url.searchParams.delete('db_sync');
          window.history.replaceState({}, '', url.toString());
          return parsed;
        }
      }
    }
  } catch (e) {
    console.error("Failed to parse firebase config from URL param", e);
  }

  try {
    const saved = localStorage.getItem('yashoda_firebase_config');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.projectId && parsed.apiKey) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Failed to parse firebase config from localStorage", e);
  }

  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCpkwxuNj_GE-Zi7HYxJ4Oscea9jpHPeEA",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "yashoda-hostel.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "yashoda-hostel",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "yashoda-hostel.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "360162847604",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:360162847604:web:7fa70aec61c7614824da21",
  };
};

const activeConfig = getActiveFirebaseConfig();

// Helper to determine if we are using the fallback mock configuration
export const isMockFirebase = !activeConfig.projectId || !activeConfig.apiKey || activeConfig.apiKey === "mock-api-key";

const finalFirebaseConfig = isMockFirebase ? {
  apiKey: "mock-api-key",
  authDomain: "mock-project.firebaseapp.com",
  projectId: "mock-project",
  storageBucket: "mock-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef",
} : activeConfig;

// Initialize Firebase App
let app;
try {
  if (getApps().length === 0) {
    app = initializeApp(finalFirebaseConfig);
  } else {
    app = getApp();
  }
} catch (error) {
  console.error("Firebase App initialization failed, falling back to mock:", error);
  const mockConfig = {
    apiKey: "mock-api-key",
    authDomain: "mock-project.firebaseapp.com",
    projectId: "mock-project",
    storageBucket: "mock-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef",
  };
  app = initializeApp(mockConfig);
}

// Initialize Firestore with persistent caching
export let db: any;
try {
  db = initializeFirestore(app, {
    ignoreUndefinedProperties: true,
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    })
  });
} catch (error) {
  console.error("Firestore persistence initialization failed. Falling back to default firestore.", error);
  db = getFirestore(app);
}


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

export const dbDeleteRoom = async (hostelId: string, id: string) => {
  await deleteDoc(doc(db, 'rooms', `${hostelId || '1'}_${id}`));
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
