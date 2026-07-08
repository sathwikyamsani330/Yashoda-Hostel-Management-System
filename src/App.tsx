import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const logoImage = '/src/assets/images/peacock_vel_logo_1783414034362.jpg';
import { 
  LayoutDashboard, 
  BedDouble, 
  Users, 
  Receipt, 
  Wrench, 
  Menu, 
  X, 
  Building,
  Bell,
  MapPin,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';

import { Room, Resident, Payment, Complaint, PaymentMethod, ComplaintStatus, Expense } from './types';
import { loadState, saveState, formatCurrency } from './utils';

// Firebase imports
import { collection, onSnapshot } from 'firebase/firestore';
import { 
  db, 
  seedDatabaseIfEmpty,
  dbAddRoom, 
  dbEditRoom, 
  dbAddResident, 
  dbEditResident, 
  dbDeleteResident, 
  dbAddPayment, 
  dbEditPayment, 
  dbDeletePayment, 
  dbAddComplaint, 
  dbEditComplaint, 
  dbDeleteComplaint, 
  dbAddExpense, 
  dbDeleteExpense,
  isMockFirebase
} from './firebase';
import { INITIAL_ROOMS, INITIAL_RESIDENTS, INITIAL_PAYMENTS, INITIAL_COMPLAINTS, INITIAL_EXPENSES } from './data';

// Import sub-components
import Dashboard from './components/Dashboard';
import RoomManager from './components/RoomManager';
import ResidentManager from './components/ResidentManager';
import PaymentTracker from './components/PaymentTracker';
import MaintenanceHelpdesk from './components/MaintenanceHelpdesk';
import StudentPortal from './components/StudentPortal';
import { Lock, Eye, EyeOff, LogOut, ArrowRight } from 'lucide-react';

export default function App() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // State to track if Firestore data has loaded
  const [dataLoaded, setDataLoaded] = useState({
    rooms: false,
    residents: false,
    payments: false,
    complaints: false,
    expenses: false
  });
  const [isAllDataLoaded, setIsAllDataLoaded] = useState(false);
  const schedulerHasRun = useRef(false);

  // 1. Seed database on load
  useEffect(() => {
    const runSeeding = async () => {
      await seedDatabaseIfEmpty(
        INITIAL_ROOMS,
        INITIAL_RESIDENTS,
        INITIAL_PAYMENTS,
        INITIAL_COMPLAINTS,
        INITIAL_EXPENSES
      );
    };
    runSeeding();
  }, []);

  // 2. Subscribe to Firestore collections in real time
  useEffect(() => {
    const unsubRooms = onSnapshot(collection(db, 'rooms'), (snapshot) => {
      const list: Room[] = [];
      snapshot.forEach(doc => {
        list.push(doc.data() as Room);
      });
      setRooms(list);
      setDataLoaded(prev => ({ ...prev, rooms: true }));
    }, (error) => console.error("Error fetching rooms: ", error));

    const unsubResidents = onSnapshot(collection(db, 'residents'), (snapshot) => {
      const list: Resident[] = [];
      snapshot.forEach(doc => {
        list.push(doc.data() as Resident);
      });
      setResidents(list);
      setDataLoaded(prev => ({ ...prev, residents: true }));
    }, (error) => console.error("Error fetching residents: ", error));

    const unsubPayments = onSnapshot(collection(db, 'payments'), (snapshot) => {
      const list: Payment[] = [];
      snapshot.forEach(doc => {
        list.push(doc.data() as Payment);
      });
      setPayments(list);
      setDataLoaded(prev => ({ ...prev, payments: true }));
    }, (error) => console.error("Error fetching payments: ", error));

    const unsubComplaints = onSnapshot(collection(db, 'complaints'), (snapshot) => {
      const list: Complaint[] = [];
      snapshot.forEach(doc => {
        list.push(doc.data() as Complaint);
      });
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setComplaints(list);
      setDataLoaded(prev => ({ ...prev, complaints: true }));
    }, (error) => console.error("Error fetching complaints: ", error));

    const unsubExpenses = onSnapshot(collection(db, 'expenses'), (snapshot) => {
      const list: Expense[] = [];
      snapshot.forEach(doc => {
        list.push(doc.data() as Expense);
      });
      list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setExpenses(list);
      setDataLoaded(prev => ({ ...prev, expenses: true }));
    }, (error) => console.error("Error fetching expenses: ", error));

    return () => {
      unsubRooms();
      unsubResidents();
      unsubPayments();
      unsubComplaints();
      unsubExpenses();
    };
  }, []);

  // 3. Monitor data loading status
  useEffect(() => {
    if (
      dataLoaded.rooms &&
      dataLoaded.residents &&
      dataLoaded.payments &&
      dataLoaded.complaints &&
      dataLoaded.expenses
    ) {
      setIsAllDataLoaded(true);
    }
  }, [dataLoaded]);

  // Active Hostel Context
  const [activeHostelId, setActiveHostelId] = useState<'1' | '2'>('1');

  const HOSTEL_NAMES = {
    '1': 'Yashoda Deluxe Boys Hostel',
    '2': 'Yashoda-2 Deluxe Boys Hostel'
  };

  // Filtered views based on selected hostel
  const filteredRooms = rooms.filter(r => r.hostelId === activeHostelId);
  const filteredResidents = residents.filter(r => r.hostelId === activeHostelId);
  const filteredPayments = payments.filter(p => p.hostelId === activeHostelId);
  const filteredComplaints = complaints.filter(c => c.hostelId === activeHostelId);
  const filteredExpenses = expenses.filter(e => e.hostelId === activeHostelId);

  // Layout View Control
  const [view, setView] = useState<'dashboard' | 'rooms' | 'residents' | 'payments' | 'maintenance'>('dashboard');
  const [selectedResidentId, setSelectedResidentId] = useState<string | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Dynamic Notifications based on data
  const alertComplaints = complaints.filter(
    c => c.hostelId === activeHostelId && c.status !== 'Resolved'
  );
  const alertPayments = payments.filter(
    p => p.hostelId === activeHostelId && p.status === 'Overdue'
  );

  const activeNotifications = [
    ...alertComplaints.map(c => ({
      id: `notif-comp-${c.id}`,
      title: `${c.priority} Priority - ${c.category}`,
      description: `Room ${c.roomId}: ${c.title}`,
      type: 'complaint',
      meta: c.status,
      color: c.priority === 'High' ? 'text-rose-600' : 'text-amber-600',
      bgColor: c.priority === 'High' ? 'bg-rose-50' : 'bg-amber-50',
      action: () => {
        setView('maintenance');
        setIsNotificationsOpen(false);
      }
    })),
    ...alertPayments.map(p => ({
      id: `notif-pay-${p.id}`,
      title: 'Payment Overdue',
      description: `${p.residentName} (Room ${p.roomId}) owes ${formatCurrency(p.amount)}`,
      type: 'payment',
      meta: p.month,
      color: 'text-rose-600',
      bgColor: 'bg-rose-50',
      action: () => {
        setView('payments');
        setIsNotificationsOpen(false);
      }
    }))
  ];
  
  // Mobile drawer
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Admin Login States
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('admin_authenticated') === 'true';
  });
  const [isStudentView, setIsStudentView] = useState<boolean>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('mode') === 'student';
  });
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Forgot Password States
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [securityPassword, setSecurityPassword] = useState('');
  const [recoveryError, setRecoveryError] = useState('');
  const [recoveredPassword, setRecoveredPassword] = useState('');

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (loginUsername.trim() === 'Admin' && loginPassword === 'Thiru#7245') {
      setIsAdminLoggedIn(true);
      localStorage.setItem('admin_authenticated', 'true');
    } else {
      setLoginError('Invalid Username or Password. Please check your credentials.');
    }
  };

  const handleVerifySecurityPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError('');
    setRecoveredPassword('');
    if (securityPassword === 'Rudra@17') {
      setRecoveredPassword('Thiru#7245');
    } else {
      setRecoveryError('Incorrect security key. Access denied.');
    }
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    localStorage.removeItem('admin_authenticated');
  };

  const handleAddStudentComplaint = async (newComplaint: Complaint) => {
    await dbAddComplaint(newComplaint);
  };

  // Helper to get Today's Date String
  const getTodayDateStr = () => {
    const now = new Date();
    if (now.getFullYear() < 2026) {
      return '2026-07-07';
    }
    return now.toISOString().split('T')[0];
  };

  // Helper to compute resident rent and bus fees based on payment plan & sharing type
  const getResidentBillingAmounts = (res: Resident, room: Room | undefined) => {
    let rentAmount = room ? room.rent : 450;
    let busFeeAmount = 0;

    if (res.sharingType === '3 Sharing') {
      rentAmount = res.paymentPlan === '6 Months' ? 45000 : 9000;
    } else if (res.sharingType === '4 Sharing') {
      rentAmount = res.paymentPlan === '6 Months' ? 40000 : 7500;
    } else if (room) {
      rentAmount = res.paymentPlan === '6 Months' ? room.rent * 6 : room.rent;
    }

    if (res.busOption) {
      busFeeAmount = res.paymentPlan === '6 Months' ? 6000 : 1000;
    }

    return { rentAmount, busFeeAmount, totalAmount: rentAmount + busFeeAmount };
  };

  // Scheduler running once data is loaded from Firestore
  useEffect(() => {
    if (!isAllDataLoaded || schedulerHasRun.current) return;
    schedulerHasRun.current = true;

    const runScheduler = async () => {
      const today = getTodayDateStr();
      let stateChanged = false;
      const updatedPayments = [...payments];
      const updatedResidents = [...residents];

      // Part A: Automatically transition pending invoices to Overdue if past due date
      for (let i = 0; i < updatedPayments.length; i++) {
        const p = updatedPayments[i];
        if (p.status === 'Pending' && p.dueDate < today) {
          const updatedP = { ...p, status: 'Overdue' as const };
          updatedPayments[i] = updatedP;
          await dbEditPayment(updatedP);
          stateChanged = true;
        }
      }

      // Part B: Automatically generate subsequent invoices for Active residents based on check-in date
      for (let i = 0; i < updatedResidents.length; i++) {
        let res = updatedResidents[i];
        if (res.status !== 'Active' || !res.roomId) continue;

        const room = rooms.find(r => r.id === res.roomId && r.hostelId === res.hostelId);
        const { rentAmount, busFeeAmount, totalAmount } = getResidentBillingAmounts(res, room);

        // Start from check-in date and progress by interval
        let anniversary = res.checkInDate;
        const intervalMonths = res.paymentPlan === '6 Months' ? 6 : 1;

        // Keep generating cycles until the anniversary goes past today
        while (anniversary <= today) {
          const dateObj = new Date(anniversary);
          let monthName = dateObj.toLocaleString('default', { month: 'long', year: 'numeric' });
          
          if (res.paymentPlan === '6 Months') {
            // Format e.g., "Jan 2026 - Jun 2026"
            const endCycleDate = new Date(anniversary);
            endCycleDate.setMonth(endCycleDate.getMonth() + 5);
            const startStr = dateObj.toLocaleString('default', { month: 'short', year: 'numeric' });
            const endStr = endCycleDate.toLocaleString('default', { month: 'short', year: 'numeric' });
            monthName = `${startStr} - ${endStr}`;
          }

          // Check if an invoice for this specific anniversary / billing month already exists
          const invoiceExists = updatedPayments.some(p => 
            p.residentId === res.id && 
            (p.dueDate === anniversary || p.month === monthName)
          );

          if (!invoiceExists) {
            const isOverdue = anniversary < today;
            const invoiceStatus = isOverdue ? 'Overdue' : 'Pending';

            const newInvoice: Payment = {
              id: `pay-auto-${res.id.slice(-4)}-${anniversary.replace(/-/g, '')}`,
              hostelId: res.hostelId,
              residentId: res.id,
              residentName: res.name,
              roomId: res.roomId,
              amount: totalAmount,
              month: monthName,
              dueDate: anniversary,
              status: invoiceStatus as any,
              paidDate: null,
              paymentMethod: null,
              busAmount: busFeeAmount,
              busStatus: res.busOption ? 'Pending' : 'Not Subscribed',
              busPaymentMethod: null,
              busReceivedBy: undefined,
              amountPaid: 0,
              balance: totalAmount,
              packageType: res.paymentPlan || 'Monthly',
              checkInDate: res.checkInDate,
              monthlyFee: rentAmount / (res.paymentPlan === '6 Months' ? 6 : 1)
            };

            await dbAddPayment(newInvoice);
            updatedPayments.push(newInvoice);
            
            // Increment resident outstanding balance
            res = {
              ...res,
              outstandingFees: res.outstandingFees + totalAmount
            };
            await dbEditResident(res);
            updatedResidents[i] = res;
            
            stateChanged = true;
          }

          // Advance to next cycle date
          const nextDate = new Date(anniversary);
          nextDate.setMonth(nextDate.getMonth() + intervalMonths);
          anniversary = nextDate.toISOString().split('T')[0];
        }
      }
    };

    runScheduler();
  }, [isAllDataLoaded, rooms, residents, payments]);

  // Handle Quick Actions
  const handleQuickAction = (action: string) => {
    if (action === 'check-in') {
      setView('residents');
      // Trigger opening register modal inside ResidentManager
      setTimeout(() => {
        const checkInBtn = document.getElementById('check-in-btn');
        if (checkInBtn) checkInBtn.click();
      }, 100);
    } else if (action === 'complaint') {
      setView('maintenance');
      setTimeout(() => {
        const lodgeBtn = document.getElementById('lodge-complaint-btn');
        if (lodgeBtn) lodgeBtn.click();
      }, 100);
    }
  };

  // State modification dispatchers using Firestore
  const handleAddRoom = async (newRoom: Room) => {
    const roomWithHostel: Room = {
      ...newRoom,
      hostelId: activeHostelId
    };
    await dbAddRoom(roomWithHostel);
  };

  const handleEditRoom = async (updatedRoom: Room) => {
    await dbEditRoom({ ...updatedRoom, hostelId: activeHostelId });
  };

  const handleCheckIn = async (newResident: Resident, roomId: string) => {
    // 1. Add resident with hostelId
    const residentWithHostel: Resident = {
      ...newResident,
      hostelId: activeHostelId
    };

    // 2. Assign resident to the room in the active hostel
    const room = rooms.find(r => r.id === roomId && r.hostelId === activeHostelId);
    if (room) {
      const updatedRoom: Room = {
        ...room,
        residentIds: [...room.residentIds, newResident.id]
      };

      // 3. Generate initial pending rent invoice for this resident
      let rentAmount = room.rent;
      let busFeeAmount = 0;

      if (newResident.sharingType === '3 Sharing') {
        rentAmount = newResident.paymentPlan === '6 Months' ? 45000 : 9000;
      } else if (newResident.sharingType === '4 Sharing') {
        rentAmount = newResident.paymentPlan === '6 Months' ? 40000 : 7500;
      }

      if (newResident.busOption) {
        busFeeAmount = newResident.paymentPlan === '6 Months' ? 6000 : 1000;
      }

      const totalAmount = rentAmount + busFeeAmount;

      const initialPayment: Payment = {
        id: `pay-gen-${Date.now()}`,
        hostelId: activeHostelId,
        residentId: newResident.id,
        residentName: newResident.name,
        roomId: roomId,
        amount: totalAmount,
        month: 'July 2026',
        dueDate: '2026-07-10',
        status: 'Pending',
        paidDate: null,
        paymentMethod: null,
        busAmount: busFeeAmount,
        busStatus: newResident.busOption ? 'Pending' : 'Not Subscribed',
        busPaymentMethod: null,
        busReceivedBy: undefined
      };

      // 4. Update the resident's outstanding balance
      const finalResident = {
        ...residentWithHostel,
        outstandingFees: totalAmount
      };

      await dbAddResident(finalResident);
      await dbEditRoom(updatedRoom);
      await dbAddPayment(initialPayment);
    }
  };

  const handleCheckOut = async (residentId: string) => {
    const resident = residents.find(r => r.id === residentId && r.hostelId === activeHostelId);
    if (!resident) return;

    // 1. Mark checked-out
    const updatedResident = {
      ...resident,
      status: 'Checked-Out' as const,
      roomId: null,
      checkOutDate: new Date().toISOString().split('T')[0]
    };
    await dbEditResident(updatedResident);

    // 2. Remove from room list
    if (resident.roomId) {
      const room = rooms.find(r => r.id === resident.roomId && r.hostelId === activeHostelId);
      if (room) {
        const updatedRoom = {
          ...room,
          residentIds: room.residentIds.filter(id => id !== residentId)
        };
        await dbEditRoom(updatedRoom);
      }
    }
  };

  const handleDeleteResident = async (residentId: string, resetStats?: boolean) => {
    const resident = residents.find(r => r.id === residentId);
    if (resident) {
      if (resident.roomId) {
        const room = rooms.find(r => r.id === resident.roomId && r.hostelId === resident.hostelId);
        if (room) {
          const updatedRoom = {
            ...room,
            residentIds: room.residentIds.filter(id => id !== residentId)
          };
          await dbEditRoom(updatedRoom);
        }
      }
      if (resetStats) {
        const residentPayments = payments.filter(p => p.residentId === residentId);
        for (const p of residentPayments) {
          await dbDeletePayment(p.id);
        }
      }
    }
    await dbDeleteResident(residentId);
  };

  const handleClearCheckedOut = async () => {
    const toDelete = residents.filter(r => r.status === 'Checked-Out' && r.hostelId === activeHostelId);
    for (const res of toDelete) {
      await dbDeleteResident(res.id);
    }
  };

  const handleClearAllActiveCheckins = async () => {
    const activeRooms = rooms.filter(room => room.hostelId === activeHostelId);
    for (const room of activeRooms) {
      const updatedRoom = { ...room, residentIds: [] };
      await dbEditRoom(updatedRoom);
    }

    const activeResidents = residents.filter(r => r.status === 'Active' && r.hostelId === activeHostelId);
    for (const res of activeResidents) {
      await dbDeleteResident(res.id);
    }
  };

  const handleRecordPayment = async (paymentId: string, method: PaymentMethod, receivedBy?: string) => {
    const payment = payments.find(p => p.id === paymentId && p.hostelId === activeHostelId);
    if (!payment) return;

    // 1. Update payment status to Paid (Rent only)
    const updatedPayment = {
      ...payment,
      status: 'Paid' as const,
      paidDate: new Date().toISOString().split('T')[0],
      paymentMethod: method,
      receivedBy: receivedBy
    };
    await dbEditPayment(updatedPayment);

    // 2. Decrease outstandingFees on the resident profile by the rent amount only
    const rentAmount = payment.amount - (payment.busAmount || 0);
    const res = residents.find(r => r.id === payment.residentId && r.hostelId === activeHostelId);
    if (res) {
      const updatedResident = {
        ...res,
        outstandingFees: Math.max(0, res.outstandingFees - rentAmount)
      };
      await dbEditResident(updatedResident);
    }
  };

  const handleRecordBusPayment = async (paymentId: string, method: PaymentMethod, receivedBy?: string) => {
    const payment = payments.find(p => p.id === paymentId && p.hostelId === activeHostelId);
    if (!payment) return;

    // 1. Update payment busStatus to Paid
    const updatedPayment = {
      ...payment,
      busStatus: 'Paid' as const,
      busPaymentMethod: method,
      busReceivedBy: receivedBy
    };
    await dbEditPayment(updatedPayment);

    // 2. Decrease outstandingFees on the resident profile by the bus amount
    if (payment.busStatus === 'Pending' && payment.busAmount) {
      const res = residents.find(r => r.id === payment.residentId && r.hostelId === activeHostelId);
      if (res) {
        const updatedResident = {
          ...res,
          outstandingFees: Math.max(0, res.outstandingFees - payment.busAmount)
        };
        await dbEditResident(updatedResident);
      }
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    const payment = payments.find(p => p.id === paymentId && p.hostelId === activeHostelId);
    if (!payment) return;

    // If payment was pending, decrease the resident's outstanding balance
    if (payment.status === 'Pending') {
      const res = residents.find(r => r.id === payment.residentId && r.hostelId === activeHostelId);
      if (res) {
        const updatedResident = {
          ...res,
          outstandingFees: Math.max(0, res.outstandingFees - payment.amount)
        };
        await dbEditResident(updatedResident);
      }
    }

    await dbDeletePayment(paymentId);
  };

  const handleGenerateInvoices = async (month: string, dueDate: string) => {
    const activeWithRooms = residents.filter(r => r.status === 'Active' && r.roomId && r.hostelId === activeHostelId);
    
    for (const res of activeWithRooms) {
      // Avoid duplicating invoice for the same person in the same month
      const alreadyHas = payments.some(p => p.residentId === res.id && p.month === month && p.hostelId === activeHostelId);
      if (!alreadyHas && res.roomId) {
        const room = rooms.find(r => r.id === res.roomId && r.hostelId === activeHostelId);
        if (room) {
          let rentAmount = room.rent;
          let busFeeAmount = 0;

          if (res.sharingType === '3 Sharing') {
            rentAmount = res.paymentPlan === '6 Months' ? 45000 : 9000;
          } else if (res.sharingType === '4 Sharing') {
            rentAmount = res.paymentPlan === '6 Months' ? 40000 : 7500;
          }

          if (res.busOption) {
            busFeeAmount = res.paymentPlan === '6 Months' ? 6000 : 1000;
          }

          const totalAmount = rentAmount + busFeeAmount;

          const newInvoice: Payment = {
            id: `pay-gen-${Date.now()}-${res.id}`,
            hostelId: activeHostelId,
            residentId: res.id,
            residentName: res.name,
            roomId: res.roomId,
            amount: totalAmount,
            month: month,
            dueDate: dueDate,
            status: 'Pending',
            paidDate: null,
            paymentMethod: null,
            busAmount: busFeeAmount,
            busStatus: res.busOption ? 'Pending' : 'Not Subscribed',
            busPaymentMethod: null,
            busReceivedBy: undefined
          };

          await dbAddPayment(newInvoice);

          const updatedResident = {
            ...res,
            outstandingFees: res.outstandingFees + totalAmount
          };
          await dbEditResident(updatedResident);
        }
      }
    }
  };

  const handleAddComplaint = async (newComplaint: Complaint) => {
    const complaintWithHostel: Complaint = {
      ...newComplaint,
      hostelId: newComplaint.hostelId || activeHostelId
    };
    await dbAddComplaint(complaintWithHostel);
  };

  const handleUpdateComplaintStatus = async (complaintId: string, status: ComplaintStatus) => {
    const complaint = complaints.find(c => c.id === complaintId && c.hostelId === activeHostelId);
    if (complaint) {
      const updatedComplaint = {
        ...complaint,
        status,
        resolvedAt: status === 'Resolved' ? new Date().toISOString() : null
      };
      await dbEditComplaint(updatedComplaint);
    }
  };

  const handleDeleteComplaint = async (complaintId: string) => {
    await dbDeleteComplaint(complaintId);
  };

  const handleClearResolvedComplaints = async () => {
    const resolved = complaints.filter(c => c.status === 'Resolved' && c.hostelId === activeHostelId);
    for (const c of resolved) {
      await dbDeleteComplaint(c.id);
    }
  };

  // Open profile drawer directly
  const handleSelectResidentProfile = (residentId: string) => {
    setSelectedResidentId(residentId);
    setView('residents');
  };

  const handleAddExpense = async (newExpense: Omit<Expense, 'id' | 'hostelId'>) => {
    const expense: Expense = {
      ...newExpense,
      id: `exp-${Date.now()}`,
      hostelId: activeHostelId
    };
    await dbAddExpense(expense);
  };

  const handleDeleteExpense = async (expenseId: string) => {
    await dbDeleteExpense(expenseId);
  };

  const sidebarTabs = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'rooms', name: 'Room Directory', icon: BedDouble },
    { id: 'residents', name: 'Residents Directory', icon: Users },
    { id: 'payments', name: 'Fees & Invoices', icon: Receipt },
    { id: 'maintenance', name: 'Helpdesk Support', icon: Wrench },
  ] as const;

  if (isStudentView) {
    return (
      <StudentPortal
        complaints={complaints}
        rooms={rooms}
        residents={residents}
        onAddComplaint={handleAddStudentComplaint}
        onExit={() => setIsStudentView(false)}
      />
    );
  }

  if (!isAdminLoggedIn) {
    if (isForgotPasswordOpen) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 md:p-8 font-sans" id="admin-forgot-password-screen">
          <div className="w-full max-w-md bg-white border border-gray-200 rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
            {/* Top subtle visual decor */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 to-orange-600" />
            
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-amber-50 border border-amber-100 rounded-2xl flex items-center justify-center mx-auto text-amber-600">
                  <Lock className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h1 className="text-xl font-display font-bold text-gray-950">Password Recovery</h1>
                  <p className="text-xs text-gray-500 mt-1">Please enter your master security key to retrieve the password.</p>
                </div>
              </div>

              {recoveryError && (
                <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-rose-700 text-xs font-medium flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-rose-500 rounded-full shrink-0 animate-ping" style={{ width: '6px', height: '6px' }} />
                  <span>{recoveryError}</span>
                </div>
              )}

              {recoveredPassword ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center space-y-3">
                  <span className="text-emerald-800 text-xs font-bold uppercase tracking-wider block">Access Granted</span>
                  <p className="text-xs text-gray-600">Your Warden credentials are:</p>
                  <div className="bg-white border border-emerald-100 p-3 rounded-xl inline-block text-left font-mono text-xs text-gray-800 space-y-1">
                    <div>Username: <strong className="text-indigo-600 select-all">Admin</strong></div>
                    <div>Password: <strong className="text-indigo-600 select-all">Thiru#7245</strong></div>
                  </div>
                  <p className="text-4xs text-emerald-600 font-semibold uppercase tracking-wider">Use these credentials to sign in.</p>
                </div>
              ) : (
                <form onSubmit={handleVerifySecurityPassword} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">Master Security Key</label>
                    <input
                      type="password"
                      placeholder="Enter security key"
                      value={securityPassword}
                      onChange={(e) => setSecurityPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 bg-gray-50/50"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl transition-all shadow-sm cursor-pointer text-sm"
                  >
                    Verify Security Key
                  </button>
                </form>
              )}

              <button
                type="button"
                onClick={() => {
                  setIsForgotPasswordOpen(false);
                  setSecurityPassword('');
                  setRecoveryError('');
                  setRecoveredPassword('');
                }}
                className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl transition-all text-xs cursor-pointer"
              >
                Back to Sign In
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 md:p-8 font-sans" id="admin-login-screen">
        <div className="w-full max-w-md bg-white border border-gray-200 rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
          {/* Top subtle visual decor */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 to-blue-600" />
          
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center mx-auto text-indigo-600">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-display font-bold text-gray-950">Yashoda Deluxe Hostels</h1>
                <p className="text-xs text-gray-500 mt-1">Authorized warden and administrator login only.</p>
              </div>
            </div>

            {loginError && (
              <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-rose-700 text-xs font-medium flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Username</label>
                <input
                  type="text"
                  id="login-username"
                  placeholder="e.g. Admin"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 bg-gray-50/50"
                  required
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-gray-700">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPasswordOpen(true);
                      setLoginError('');
                    }}
                    className="text-3xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="login-password"
                    placeholder="Enter password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full pl-3.5 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 bg-gray-50/50"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                id="login-submit-btn"
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl transition-all shadow-sm shadow-indigo-100 cursor-pointer text-sm"
              >
                Sign In
              </button>
            </form>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-gray-100" />
              <span className="flex-shrink mx-4 text-gray-400 text-3xs uppercase tracking-wider font-semibold">Student Access</span>
              <div className="flex-grow border-t border-gray-100" />
            </div>

            <button
              onClick={() => setIsStudentView(true)}
              className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl transition-all text-xs cursor-pointer shadow-2xs"
            >
              <ArrowRight className="w-4 h-4 text-emerald-600" />
              <span>Go to Student Helpdesk Portal</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-800" id="hostel-portal-root">
      {isMockFirebase && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-center text-xs text-amber-800 font-medium flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 animate-pulse shrink-0" />
          <span><strong>Running in Mock Mode:</strong> Real-time database synchronization is disabled. Please configure your Firebase environment variables in Vercel settings and locally in `.env` to synchronize data across devices.</span>
        </div>
      )}
      <div className="flex flex-row flex-1 min-h-0">
      
      {/* LEFT SIDEBAR - Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-white text-slate-800 shrink-0 border-r border-gray-200 sticky top-0 h-screen">
        {/* Brand name */}
        <div className="p-6 border-b border-gray-100 flex items-center gap-3">
          <div 
            id="brand-logo-clickable"
            onClick={() => {
              setView('dashboard');
              setSelectedResidentId(null);
            }}
            className="p-1.5 bg-white border border-gray-200 rounded-xl cursor-pointer hover:scale-105 hover:shadow-xs active:scale-95 transition-all flex items-center justify-center w-10 h-10 shrink-0"
            title="Go to Dashboard"
          >
            <img 
              src={logoImage} 
              alt="Yashoda Deluxe Logo" 
              className="w-full h-full object-contain rounded-lg"
              referrerPolicy="no-referrer" 
            />
          </div>
          <div>
            <h1 className="font-display font-bold text-sm tracking-tight text-gray-950 leading-tight">Yashoda Deluxe</h1>
            <p className="text-3xs text-indigo-600 font-semibold tracking-wide uppercase">Management Hub</p>
          </div>
        </div>

        {/* Hostel Selector Switcher */}
        <div className="p-4 bg-gray-50 border-b border-gray-100 flex flex-col gap-1.5">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">Selected Hostel</span>
          <div className="flex flex-col gap-1">
            <button
              onClick={() => {
                setActiveHostelId('1');
                setSelectedResidentId(null);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer border ${
                activeHostelId === '1'
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span>Yashoda Deluxe Boys</span>
              <span className={`text-[10px] font-mono p-0.5 px-1.5 rounded-full ${
                activeHostelId === '1' ? 'bg-indigo-700 text-indigo-100' : 'bg-gray-100 text-gray-500'
              }`}>H1</span>
            </button>
            <button
              onClick={() => {
                setActiveHostelId('2');
                setSelectedResidentId(null);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer border ${
                activeHostelId === '2'
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span>Yashoda-2 Deluxe Boys</span>
              <span className={`text-[10px] font-mono p-0.5 px-1.5 rounded-full ${
                activeHostelId === '2' ? 'bg-indigo-700 text-indigo-100' : 'bg-gray-100 text-gray-500'
              }`}>H2</span>
            </button>
          </div>
        </div>

        {/* Sidebar Tabs */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {sidebarTabs.map(tab => {
            const isActive = view === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setView(tab.id);
                  setSelectedResidentId(null);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                  isActive 
                    ? 'bg-indigo-50 text-indigo-700 shadow-2xs font-semibold' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <tab.icon className={`w-4.5 h-4.5 shrink-0 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`} />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Info Box Footer */}
        <div className="p-4 m-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-2 text-xs">
          <div className={`flex items-center gap-2 ${isMockFirebase ? 'text-amber-600' : 'text-emerald-600'}`}>
            {isMockFirebase ? <AlertTriangle className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span className="font-semibold">{isMockFirebase ? 'Mock Database Active' : 'Firebase Synced'}</span>
          </div>
          <p className="text-gray-500 leading-normal text-2xs">
            {isMockFirebase 
              ? 'Real-time synchronization across devices is disabled. Set VITE_FIREBASE_* environment variables to enable it.' 
              : 'Every check-in, payment, and complaint is instantly synchronized in real time across all connected devices.'}
          </p>
        </div>

        {/* Admin Logout Button */}
        <div className="px-4 pb-4 mt-auto border-t border-gray-100 pt-4">
          <button
            onClick={handleAdminLogout}
            className="w-full flex items-center justify-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold py-2.5 rounded-xl transition-all cursor-pointer border border-rose-100"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* MOBILE DRAWER SIDEBAR */}
      <AnimatePresence>
        {isSidebarOpen && (
          <div className="fixed inset-0 z-40 lg:hidden flex">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black"
            />
            {/* Sidebar Body */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-64 max-w-[80vw] bg-white text-slate-800 flex flex-col h-full z-10 shadow-2xl border-r border-gray-200"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div 
                  className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => {
                    setView('dashboard');
                    setSelectedResidentId(null);
                    setIsSidebarOpen(false);
                  }}
                >
                  <img 
                    src={logoImage} 
                    alt="Yashoda Deluxe Logo" 
                    className="w-6 h-6 object-contain rounded-md border border-gray-100"
                    referrerPolicy="no-referrer" 
                  />
                  <span className="font-display font-bold text-sm tracking-tight text-gray-950">Yashoda Deluxe Portal</span>
                </div>
                <button 
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-1 rounded-lg bg-gray-50 text-gray-500 hover:text-gray-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Hostel Selector Switcher */}
              <div className="p-4 bg-gray-50 border-b border-gray-100 flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">Selected Hostel</span>
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => {
                      setActiveHostelId('1');
                      setSelectedResidentId(null);
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer border ${
                      activeHostelId === '1'
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span>Yashoda Deluxe Boys</span>
                    <span className={`text-[10px] font-mono p-0.5 px-1 rounded-full ${
                      activeHostelId === '1' ? 'bg-indigo-750 text-indigo-100' : 'bg-gray-100 text-gray-500'
                    }`}>H1</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveHostelId('2');
                      setSelectedResidentId(null);
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer border ${
                      activeHostelId === '2'
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span>Yashoda-2 Deluxe Boys</span>
                    <span className={`text-[10px] font-mono p-0.5 px-1 rounded-full ${
                      activeHostelId === '2' ? 'bg-indigo-750 text-indigo-100' : 'bg-gray-100 text-gray-500'
                    }`}>H2</span>
                  </button>
                </div>
              </div>

              <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
                {sidebarTabs.map(tab => {
                  const isActive = view === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setView(tab.id);
                        setSelectedResidentId(null);
                        setIsSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                        isActive 
                          ? 'bg-indigo-50 text-indigo-700 font-semibold' 
                          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <tab.icon className={`w-4.5 h-4.5 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`} />
                      <span>{tab.name}</span>
                    </button>
                  );
                })}
              </nav>

              <div className="p-4 border-t border-gray-100 text-center text-3xs text-gray-400 space-y-3">
                <span>{HOSTEL_NAMES[activeHostelId]}</span>
                <button
                  onClick={() => {
                    setIsSidebarOpen(false);
                    handleAdminLogout();
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold py-2.5 rounded-xl transition-all cursor-pointer border border-rose-100 mt-2"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col overflow-x-hidden min-h-screen">
        {/* TOP NAVBAR (Header) */}
        <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
          <div className="flex items-center gap-3 lg:gap-0">
            {/* Hamburger button */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl border border-gray-100 hover:bg-gray-50 text-gray-600 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Desktop breadcrumb */}
            <div className="hidden lg:flex items-center gap-2 text-xs">
              <span className="text-gray-400 font-medium font-mono">{HOSTEL_NAMES[activeHostelId]}</span>
              <span className="text-gray-300 font-light">/</span>
              <span className="text-gray-900 font-medium capitalize">{view.replace('-', ' ')}</span>
            </div>

            {/* Mobile title */}
            <div className="lg:hidden">
              <span className="font-display font-bold text-gray-950 text-sm">{activeHostelId === '1' ? 'Yashoda Boys' : 'Yashoda-2 Boys'}</span>
            </div>
          </div>

          {/* Quick Stats Tray / Settings info */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-1 text-2xs font-medium text-gray-500 bg-gray-50 border border-gray-100 rounded-lg p-1.5 px-3">
              <MapPin className="w-3.5 h-3.5 text-indigo-600" />
              <span>Wing A & B • Fully Operational</span>
            </div>

            {/* Notification alert bubble */}
            <div className="relative">
              <button
                id="bell-notification-btn"
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="relative p-2 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-100 text-gray-500 cursor-pointer transition-all duration-200"
                title="View Notifications"
              >
                <Bell className="w-4 h-4" />
                {activeNotifications.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                )}
              </button>

              <AnimatePresence>
                {isNotificationsOpen && (
                  <>
                    {/* Clickaway backdrop */}
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsNotificationsOpen(false)} 
                    />
                    
                    {/* Dropdown Menu */}
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden"
                    >
                      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <span className="font-display font-bold text-gray-950 text-sm">Recent Notifications</span>
                        <span className="text-3xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                          {activeNotifications.length} active
                        </span>
                      </div>

                      <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                        {activeNotifications.length === 0 ? (
                          <div className="p-8 text-center text-gray-400 space-y-2">
                            <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
                            <p className="text-xs font-semibold text-gray-700">No new alerts</p>
                            <p className="text-4xs text-gray-400 leading-normal">All systems are operational and dues are cleared.</p>
                          </div>
                        ) : (
                          activeNotifications.map(notif => (
                            <button
                              key={notif.id}
                              onClick={notif.action}
                              className="w-full text-left p-4 hover:bg-gray-50 transition-colors flex gap-3 cursor-pointer items-start border-none outline-none"
                            >
                              <div className={`p-2 rounded-lg ${notif.bgColor} ${notif.color} shrink-0 mt-0.5`}>
                                {notif.type === 'complaint' ? (
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                ) : (
                                  <Clock className="w-3.5 h-3.5" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline gap-1">
                                  <span className="font-semibold text-xs text-gray-900 truncate">
                                    {notif.title}
                                  </span>
                                  <span className="text-[10px] text-gray-400 font-mono shrink-0 uppercase">
                                    {notif.meta}
                                  </span>
                                </div>
                                <p className="text-3xs text-gray-500 mt-0.5 leading-normal font-normal">
                                  {notif.description}
                                </p>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* SCROLLABLE MAIN BODY */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.18 }}
              className="h-full"
            >
              {view === 'dashboard' && (
                <Dashboard 
                  rooms={filteredRooms}
                  residents={filteredResidents}
                  payments={filteredPayments}
                  complaints={filteredComplaints}
                  expenses={filteredExpenses}
                  onAddExpense={handleAddExpense}
                  onDeleteExpense={handleDeleteExpense}
                  hostelName={HOSTEL_NAMES[activeHostelId]}
                  setView={setView}
                  triggerQuickAction={handleQuickAction}
                />
              )}

              {view === 'rooms' && (
                <RoomManager 
                  rooms={filteredRooms}
                  residents={filteredResidents}
                  onAddRoom={handleAddRoom}
                  onEditRoom={handleEditRoom}
                  onSelectResident={handleSelectResidentProfile}
                />
              )}

              {view === 'residents' && (
                <ResidentManager 
                  residents={filteredResidents}
                  rooms={filteredRooms}
                  payments={filteredPayments}
                  complaints={filteredComplaints}
                  onCheckIn={handleCheckIn}
                  onCheckOut={handleCheckOut}
                  onDeleteResident={handleDeleteResident}
                  onClearCheckedOut={handleClearCheckedOut}
                  onClearActiveCheckins={handleClearAllActiveCheckins}
                  onSelectResidentId={selectedResidentId}
                  onClearSelectResident={() => setSelectedResidentId(null)}
                  setView={setView}
                />
              )}

              {view === 'payments' && (
                <PaymentTracker 
                  payments={filteredPayments}
                  residents={filteredResidents}
                  rooms={filteredRooms}
                  onRecordPayment={handleRecordPayment}
                  onRecordBusPayment={handleRecordBusPayment}
                  onGenerateInvoices={handleGenerateInvoices}
                  onDeletePayment={handleDeletePayment}
                />
              )}

              {view === 'maintenance' && (
                <MaintenanceHelpdesk 
                  complaints={filteredComplaints}
                  residents={filteredResidents}
                  onAddComplaint={handleAddComplaint}
                  onUpdateComplaintStatus={handleUpdateComplaintStatus}
                  onDeleteComplaint={handleDeleteComplaint}
                  onClearResolvedComplaints={handleClearResolvedComplaints}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      </div>
    </div>
  );
}
