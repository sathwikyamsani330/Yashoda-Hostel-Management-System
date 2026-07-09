import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  DollarSign, 
  CreditCard, 
  Search, 
  Plus, 
  Check, 
  AlertTriangle, 
  Clock, 
  X, 
  Calendar,
  AlertCircle,
  FileSpreadsheet,
  MessageCircle,
  Copy,
  ExternalLink,
  QrCode,
  Trash2,
  Bus
} from 'lucide-react';
import { Payment, Resident, Room, PaymentMethod } from '../types';
import { formatCurrency, formatDate } from '../utils';

interface PaymentTrackerProps {
  payments: Payment[];
  residents: Resident[];
  rooms: Room[];
  onRecordPayment: (paymentId: string, method: PaymentMethod, receivedBy?: string) => void;
  onRecordBusPayment?: (paymentId: string, method: PaymentMethod, receivedBy?: string) => void;
  onGenerateInvoices: (month: string, dueDate: string) => void;
  onDeletePayment: (paymentId: string) => void;
  onClearCompletedInvoices: () => void;
}

export default function PaymentTracker({ 
  payments, 
  residents, 
  rooms, 
  onRecordPayment,
  onRecordBusPayment,
  onGenerateInvoices,
  onDeletePayment,
  onClearCompletedInvoices
}: PaymentTrackerProps) {
  // States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Paid' | 'Pending' | 'Overdue' | 'Bus Pass'>('All');
  const [monthFilter, setMonthFilter] = useState<string>('All');
  const [yearFilter, setYearFilter] = useState<string>('All');
  const [packageFilter, setPackageFilter] = useState<'All' | 'Monthly' | '6 Months'>('All');
  const [hostelFilter, setHostelFilter] = useState<'All' | '1' | '2'>('All');
  const [floorFilter, setFloorFilter] = useState<string>('All');
  const [roomFilter, setRoomFilter] = useState<string>('');

  const [viewMode, setViewMode] = useState<'ledger' | 'calendar'>('ledger');
  const [calendarYear, setCalendarYear] = useState(2026);
  const [calendarMonth, setCalendarMonth] = useState(6); // 0-indexed: 6 is July
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<number | null>(null);

  // Non-blocking delete confirmation state
  const [pendingDeletePaymentId, setPendingDeletePaymentId] = useState<string | null>(null);

  // Modals state
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [activePayment, setActivePayment] = useState<Payment | null>(null);

  // Independent Bus Payment Modal States
  const [isBusPayOpen, setIsBusPayOpen] = useState(false);
  const [activeBusPayment, setActiveBusPayment] = useState<Payment | null>(null);
  const [busPaymentMethod, setBusPaymentMethod] = useState<PaymentMethod>('UPI');
  const [busReceivedBy, setBusReceivedBy] = useState('Hostel Warden');

  // Reminder Modal States
  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const [reminderPayment, setReminderPayment] = useState<Payment | null>(null);
  const [reminderTab, setReminderTab] = useState<'resident' | 'nominee'>('resident');
  const [copiedNotification, setCopiedNotification] = useState(false);

  // Form states
  const [billingMonth, setBillingMonth] = useState('July 2026');
  const [billingDueDate, setBillingDueDate] = useState('2026-07-10');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [receivedBy, setReceivedBy] = useState('Hostel Warden');
  const [billingError, setBillingError] = useState('');
  const [billingSuccess, setBillingSuccess] = useState('');
  const [forceProceed, setForceProceed] = useState(false);

  // Extract all distinct months in payments for filters
  const distinctMonths = Array.from(new Set(payments.map(p => p.month)));

  // Outstanding fee stats
  const totalInvoiced = payments.reduce((acc, p) => acc + p.amount, 0);
  const totalPaid = payments.filter(p => p.status === 'Paid').reduce((acc, p) => acc + p.amount, 0);
  const totalUnpaid = totalInvoiced - totalPaid;

  // Filtered payments
  const filteredPayments = payments.filter(p => {
    const matchesSearch = p.residentName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.roomId.includes(searchQuery) ||
                          p.id.includes(searchQuery);

    // Status match
    let matchesStatus = false;
    if (statusFilter === 'All') {
      matchesStatus = true;
    } else if (statusFilter === 'Bus Pass') {
      matchesStatus = p.busStatus === 'Paid' && !!p.busAmount && p.busAmount > 0;
    } else {
      matchesStatus = p.status === statusFilter;
    }

    // Month match (either matches invoice month or p.month includes it)
    let matchesMonth = false;
    if (monthFilter === 'All') {
      matchesMonth = true;
    } else {
      matchesMonth = p.month.toLowerCase().includes(monthFilter.toLowerCase());
    }

    // Year match
    let matchesYear = false;
    if (yearFilter === 'All') {
      matchesYear = true;
    } else {
      matchesYear = p.dueDate.startsWith(yearFilter) || p.month.includes(yearFilter);
    }

    // Package Type match
    let matchesPackage = false;
    if (packageFilter === 'All') {
      matchesPackage = true;
    } else {
      matchesPackage = (p.packageType || 'Monthly') === packageFilter;
    }

    // Hostel match
    let matchesHostel = false;
    if (hostelFilter === 'All') {
      matchesHostel = true;
    } else {
      matchesHostel = p.hostelId === hostelFilter;
    }

    // Floor match (derived from room number first character)
    let matchesFloor = false;
    if (floorFilter === 'All') {
      matchesFloor = true;
    } else {
      const roomFloor = p.roomId && p.roomId.length >= 3 ? p.roomId[0] : 'Other';
      matchesFloor = roomFloor === floorFilter;
    }

    // Room number match
    let matchesRoom = false;
    if (!roomFilter) {
      matchesRoom = true;
    } else {
      matchesRoom = p.roomId.includes(roomFilter);
    }

    return matchesSearch && matchesStatus && matchesMonth && matchesYear && matchesPackage && matchesHostel && matchesFloor && matchesRoom;
  });

  const handleGenerateInvoicesSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBillingError('');
    setBillingSuccess('');

    // Count active residents with rooms
    const activeWithRooms = residents.filter(r => r.status === 'Active' && r.roomId);

    if (activeWithRooms.length === 0) {
      setBillingError('No active residents with room placements found to bill.');
      return;
    }

    // Check if invoices already exist for this month
    const alreadyInvoiced = payments.some(p => p.month === billingMonth);
    if (alreadyInvoiced && !forceProceed) {
      setBillingError(`Invoices for ${billingMonth} already exist. Please check the confirmation box below to generate incremental bills.`);
      return;
    }

    // Determine how many residents will be billed
    const unbilledResidents = activeWithRooms.filter(r => 
      !payments.some(p => p.residentId === r.id && p.month === billingMonth)
    );

    if (unbilledResidents.length === 0) {
      setBillingError(`All ${activeWithRooms.length} active residents are already billed for ${billingMonth}.`);
      return;
    }

    onGenerateInvoices(billingMonth, billingDueDate);
    setBillingSuccess(`Successfully generated ${unbilledResidents.length} rent invoices for ${billingMonth}!`);
    setTimeout(() => {
      setIsGenerateOpen(false);
      setBillingSuccess('');
      setForceProceed(false);
    }, 1500);
  };

  const openPaymentRecord = (payment: Payment) => {
    setActivePayment(payment);
    setPaymentMethod('UPI');
    setReceivedBy('Hostel Warden');
    setIsPayOpen(true);
  };

  const handleRecordPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePayment) return;

    onRecordPayment(activePayment.id, paymentMethod, receivedBy.trim());
    setIsPayOpen(false);
    setActivePayment(null);
  };

  const openBusPaymentRecord = (payment: Payment) => {
    setActiveBusPayment(payment);
    setBusPaymentMethod('UPI');
    setBusReceivedBy('Hostel Warden');
    setIsBusPayOpen(true);
  };

  const handleRecordBusPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBusPayment) return;

    if (onRecordBusPayment) {
      onRecordBusPayment(activeBusPayment.id, busPaymentMethod, busReceivedBy.trim());
    }
    setIsBusPayOpen(false);
    setActiveBusPayment(null);
  };

  const getWhatsAppContent = (p: Payment, target: 'resident' | 'nominee' = 'resident') => {
    const resident = residents.find(r => r.id === p.residentId);
    const phone = target === 'resident' 
      ? (resident?.phone || '') 
      : (resident?.emergencyContact?.phone || '');
    let phoneClean = phone.replace(/\D/g, '');
    if (phoneClean.length === 10) {
      phoneClean = '91' + phoneClean;
    }
    
    const hostelName = p.hostelId === '2' ? 'Yashoda-2 Deluxe Boys Hostel' : 'Yashoda Deluxe Boys Hostel';
    const formattedAmount = formatCurrency(p.amount);
    const dueDateStr = formatDate(p.dueDate);

    let message = '';
    if (target === 'resident') {
      message = `Dear *${p.residentName}*,

This is a rent payment reminder from *${hostelName}*.

• *Room Number:* Room ${p.roomId}
• *Billing Month:* ${p.month}
• *Due Amount:* ${formattedAmount}
• *Deadline:* ${dueDateStr}

Please clear your dues by the deadline (${dueDateStr}) to avoid overdue charges. If you have already paid, please reply with the screenshot of your receipt.

Thank you!
*${hostelName} Management*`;
    } else {
      const nomineeName = resident?.emergencyContact?.name || 'Nominee';
      const nomineeRelation = resident?.emergencyContact?.relation || 'Guardian';
      message = `Dear *${nomineeName}* (${nomineeRelation} of *${p.residentName}*),

This is a rent payment reminder regarding your ward *${p.residentName}* residing in Room ${p.roomId} at *${hostelName}*.

• *Billing Month:* ${p.month}
• *Due Amount:* ${formattedAmount}
• *Deadline:* ${dueDateStr}

Please ensure the dues are cleared by the deadline (${dueDateStr}) to avoid overdue charges. If already paid, please reply with the screenshot of the receipt.

Thank you!
*${hostelName} Management*`;
    }

    const waLink = `https://wa.me/${phoneClean}?text=${encodeURIComponent(message)}`;

    return {
      phone,
      phoneClean,
      message,
      waLink
    };
  };

  return (
    <div className="space-y-6" id="payment-tracker-view">
      {/* Header and billing action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-semibold text-gray-950">Fees & Payments Ledger</h2>
          <p className="text-gray-500 text-sm mt-0.5">Track financial accounts, issue monthly rent bills, and log UPI/cash transactions.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* View Toggle Switch */}
          <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
            <button
              onClick={() => setViewMode('ledger')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'ledger'
                  ? 'bg-white text-gray-950 shadow-3xs'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Ledger View</span>
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'calendar'
                  ? 'bg-white text-gray-950 shadow-3xs'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Calendar View</span>
            </button>
          </div>

          <button
            id="generate-bills-btn"
            onClick={() => {
              setBillingError('');
              setBillingSuccess('');
              setIsGenerateOpen(true);
            }}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2.5 rounded-xl transition-all shadow-sm shadow-indigo-100 cursor-pointer text-sm"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Generate Month Bills
          </button>

          <button
            id="clear-completed-bills-btn"
            onClick={onClearCompletedInvoices}
            className="flex items-center justify-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold px-4 py-2.5 rounded-xl transition-all border border-rose-100 cursor-pointer text-sm shadow-2xs active:scale-[0.98]"
            title="Delete paid invoices for checked-out or deleted residents"
          >
            <Trash2 className="w-4 h-4" />
            Clear Completed Dues
          </button>
        </div>
      </div>

      {/* Account Ledgers Mini Blocks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <span className="text-gray-400 text-3xs font-semibold uppercase tracking-wider block">Total Billed Volume</span>
            <p className="text-2xl font-display font-bold text-gray-950 mt-1">{formatCurrency(totalInvoiced)}</p>
            <span className="text-2xs text-gray-500 block mt-1">All historic logs</span>
          </div>
          <div className="p-3 bg-gray-50 text-gray-600 rounded-xl">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <span className="text-gray-400 text-3xs font-semibold uppercase tracking-wider block">Collected Cash</span>
            <p className="text-2xl font-display font-bold text-indigo-600 mt-1">{formatCurrency(totalPaid)}</p>
            <span className="text-2xs text-indigo-600 block mt-1">
              {totalInvoiced > 0 ? Math.round((totalPaid/totalInvoiced)*100) : 0}% collection rate
            </span>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Check className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <span className="text-gray-400 text-3xs font-semibold uppercase tracking-wider block">Outstanding Receivables</span>
            <p className="text-2xl font-display font-bold text-rose-600 mt-1">{formatCurrency(totalUnpaid)}</p>
            <span className="text-2xs text-rose-600 block mt-1">Pending and Overdue dues</span>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4.5 h-4.5" />
            <input
              id="payment-search-input"
              type="text"
              placeholder="Search transactions by guest, room, receipt ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Status buttons */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-gray-500 font-semibold">Status:</span>
            <div className="flex flex-wrap bg-gray-50 p-0.5 rounded-lg border border-gray-100">
              {(['All', 'Paid', 'Pending', 'Overdue', 'Bus Pass'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                    statusFilter === s 
                      ? 'bg-white text-gray-950 shadow-2xs' 
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Second Row: Advanced Selectors */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-3 border-t border-gray-100 text-xs">
          {/* Month */}
          <div className="flex flex-col gap-1">
            <span className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Month</span>
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-lg p-1.5 px-2 font-medium focus:outline-none focus:border-indigo-500 cursor-pointer text-gray-700"
            >
              <option value="All">All Months</option>
              <option value="January">January</option>
              <option value="February">February</option>
              <option value="March">March</option>
              <option value="April">April</option>
              <option value="May">May</option>
              <option value="June">June</option>
              <option value="July">July</option>
              <option value="August">August</option>
              <option value="September">September</option>
              <option value="October">October</option>
              <option value="November">November</option>
              <option value="December">December</option>
            </select>
          </div>

          {/* Year */}
          <div className="flex flex-col gap-1">
            <span className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Year</span>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-lg p-1.5 px-2 font-medium focus:outline-none focus:border-indigo-500 cursor-pointer text-gray-700"
            >
              <option value="All">All Years</option>
              <option value="2026">2026</option>
              <option value="2027">2027</option>
            </select>
          </div>

          {/* Package Type */}
          <div className="flex flex-col gap-1">
            <span className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Package Type</span>
            <select
              value={packageFilter}
              onChange={(e) => setPackageFilter(e.target.value as any)}
              className="bg-gray-50 border border-gray-200 rounded-lg p-1.5 px-2 font-medium focus:outline-none focus:border-indigo-500 cursor-pointer text-gray-700"
            >
              <option value="All">All Packages</option>
              <option value="Monthly">Monthly</option>
              <option value="6 Months">6 Months</option>
            </select>
          </div>

          {/* Hostel */}
          <div className="flex flex-col gap-1">
            <span className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Hostel</span>
            <select
              value={hostelFilter}
              onChange={(e) => setHostelFilter(e.target.value as any)}
              className="bg-gray-50 border border-gray-200 rounded-lg p-1.5 px-2 font-medium focus:outline-none focus:border-indigo-500 cursor-pointer text-gray-700"
            >
              <option value="All">All Hostels</option>
              <option value="1">Yashoda Deluxe</option>
              <option value="2">Yashoda-2 Deluxe</option>
            </select>
          </div>

          {/* Floor */}
          <div className="flex flex-col gap-1">
            <span className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Floor</span>
            <select
              value={floorFilter}
              onChange={(e) => setFloorFilter(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-lg p-1.5 px-2 font-medium focus:outline-none focus:border-indigo-500 cursor-pointer text-gray-700"
            >
              <option value="All">All Floors</option>
              <option value="1">1st Floor</option>
              <option value="2">2nd Floor</option>
              <option value="3">3rd Floor</option>
              <option value="4">4th Floor</option>
            </select>
          </div>

          {/* Room Number */}
          <div className="flex flex-col gap-1">
            <span className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Room Number</span>
            <input
              type="text"
              placeholder="e.g. 101, 203"
              value={roomFilter}
              onChange={(e) => setRoomFilter(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-lg p-1.5 px-2 font-medium focus:outline-none focus:border-indigo-500 text-gray-700 text-xs placeholder:text-gray-300"
            />
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-medium text-xs">
                <th className="py-4 px-6">Receipt ID</th>
                <th className="py-4 px-6">Guest Resident</th>
                <th className="py-4 px-6">Room Assigned</th>
                <th className="py-4 px-6">Billing Month</th>
                <th className="py-4 px-6">Due Date</th>
                <th className="py-4 px-6">Charged Amount</th>
                <th className="py-4 px-6">Status / Method</th>
                <th className="py-4 px-6">Bus Status / Method / Paid To</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-gray-500">
                    <DollarSign className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="font-semibold text-gray-900">No matching bills</p>
                    <p className="text-2xs text-gray-400 mt-0.5">Refine your keywords or billing parameters.</p>
                  </td>
                </tr>
              ) : (
                filteredPayments.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-6 font-mono text-2xs font-semibold text-gray-500">
                      {p.id}
                    </td>
                    <td className="py-4 px-6">
                      <p className="font-medium text-gray-900">{p.residentName}</p>
                      <span className="text-3xs text-gray-400 font-mono">ID: {p.residentId}</span>
                    </td>
                    <td className="py-4 px-6 font-semibold text-gray-700">
                      Room {p.roomId}
                    </td>
                    <td className="py-4 px-6 text-gray-500">
                      {p.month}
                    </td>
                    <td className="py-4 px-6 text-gray-500">
                      {formatDate(p.dueDate)}
                    </td>
                     <td className="py-4 px-6">
                      <div className="space-y-1">
                        <span className="font-semibold text-gray-950 block">
                          {formatCurrency(p.amount)}
                        </span>
                        {p.busAmount && p.busAmount > 0 ? (
                          <span className="text-3xs text-gray-400 block ml-0.5">
                            Rent: {formatCurrency(p.amount - p.busAmount)} | Bus: {formatCurrency(p.busAmount)}
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="space-y-1">
                        <span className={`inline-flex items-center gap-1 text-3xs font-semibold px-2 py-0.5 rounded-full ${
                          p.status === 'Paid' 
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' 
                            : p.status === 'Pending'
                            ? 'bg-amber-50 text-amber-700 border border-amber-100'
                            : 'bg-rose-50 text-rose-700 border border-rose-100'
                        }`}>
                          {p.status === 'Paid' && <Check className="w-2.5 h-2.5" />}
                          {p.status === 'Pending' && <Clock className="w-2.5 h-2.5" />}
                          {p.status === 'Overdue' && <AlertTriangle className="w-2.5 h-2.5" />}
                          {p.status}
                        </span>
                        {p.status === 'Paid' && p.paymentMethod && (
                          <span className="text-3xs text-gray-400 block ml-0.5">via {p.paymentMethod}</span>
                        )}
                        {p.status === 'Paid' && p.receivedBy && (
                          <span className="text-3xs text-indigo-600 block font-medium ml-0.5">To: {p.receivedBy}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="space-y-1">
                        {p.busStatus === 'Not Subscribed' || !p.busAmount ? (
                          <span className="inline-flex items-center gap-1 text-3xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200">
                            No Bus Facility
                          </span>
                        ) : (
                          <div className="flex flex-col gap-1">
                            <span className={`inline-flex items-center gap-1 text-3xs font-semibold px-2 py-0.5 rounded-full self-start ${
                              p.busStatus === 'Paid' 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                : 'bg-amber-50 text-amber-700 border border-amber-100'
                            }`}>
                              {p.busStatus === 'Paid' ? <Check className="w-2.5 h-2.5" /> : <Clock className="w-2.5 h-2.5" />}
                              {p.busStatus} (Fee: {formatCurrency(p.busAmount)})
                            </span>
                            {p.busStatus === 'Paid' ? (
                              <>
                                {p.busPaymentMethod && (
                                  <span className="text-3xs text-gray-400 block ml-0.5">via {p.busPaymentMethod}</span>
                                )}
                                {p.busReceivedBy && (
                                  <span className="text-3xs text-emerald-600 block font-semibold ml-0.5 font-medium">To: {p.busReceivedBy}</span>
                                )}
                              </>
                            ) : (
                              <button
                                onClick={() => openBusPaymentRecord(p)}
                                className="mt-1 px-2.5 py-1 text-3xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all shadow-3xs cursor-pointer inline-flex items-center gap-1 self-start"
                              >
                                <Bus className="w-2.5 h-2.5" />
                                Record Bus Pay
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                     <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {p.status !== 'Paid' ? (
                          <>
                            <button
                              onClick={() => {
                                setReminderPayment(p);
                                setIsReminderOpen(true);
                              }}
                              className="inline-flex items-center justify-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all shadow-3xs cursor-pointer"
                              title="Send WhatsApp payment reminder"
                            >
                              <MessageCircle className="w-3.5 h-3.5 animate-pulse" />
                              <span>Remind</span>
                            </button>
                            <button
                              onClick={() => openPaymentRecord(p)}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all shadow-sm cursor-pointer whitespace-nowrap"
                            >
                              Record Pay
                            </button>
                          </>
                        ) : (
                          <span className="text-xs text-gray-400 font-mono">
                            Paid {p.paidDate ? formatDate(p.paidDate) : ''}
                          </span>
                        )}

                        {/* Individual Invoice Delete Action */}
                        <div className="ml-1 shrink-0">
                          {pendingDeletePaymentId === p.id ? (
                            <div className="inline-flex items-center gap-1 bg-rose-50 border border-rose-200 p-1 rounded-lg text-3xs">
                              <span className="text-rose-700 font-semibold px-1">Delete?</span>
                              <button
                                onClick={() => {
                                  onDeletePayment(p.id);
                                  setPendingDeletePaymentId(null);
                                }}
                                className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-1.5 py-0.5 rounded cursor-pointer"
                              >
                                Yes
                              </button>
                              <button
                                onClick={() => setPendingDeletePaymentId(null)}
                                className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium px-1.5 py-0.5 rounded cursor-pointer"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setPendingDeletePaymentId(p.id)}
                              className="p-1.5 hover:bg-rose-50 rounded-lg text-gray-400 hover:text-rose-600 transition-colors cursor-pointer inline-flex items-center justify-center"
                              title="Delete invoice permanently"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Generator Modal */}
      <AnimatePresence>
        {isGenerateOpen && (
          <div className="fixed inset-0 bg-gray-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-gray-200 rounded-2xl w-full max-w-md overflow-hidden shadow-xl"
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-display font-bold text-gray-950">Generate Batch Invoices</h3>
                  <p className="text-gray-500 text-xs mt-0.5">Bill rent invoices to all active residents in bulk.</p>
                </div>
                <button
                  onClick={() => setIsGenerateOpen(false)}
                  className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleGenerateInvoicesSubmit} className="p-6 space-y-4">
                {billingError && (
                  <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-rose-700 text-xs font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{billingError}</span>
                  </div>
                )}
                {billingSuccess && (
                  <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 text-indigo-700 text-xs font-medium flex items-center gap-2">
                    <Check className="w-4 h-4 shrink-0" />
                    <span>{billingSuccess}</span>
                  </div>
                )}

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Select Billing Term / Month</label>
                  <select
                    value={billingMonth}
                    onChange={(e) => setBillingMonth(e.target.value)}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 bg-white"
                  >
                    <option value="July 2026">July 2026</option>
                    <option value="August 2026">August 2026</option>
                    <option value="September 2026">September 2026</option>
                    <option value="October 2026">October 2026</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Invoice Due Date</label>
                  <input
                    type="date"
                    value={billingDueDate}
                    onChange={(e) => setBillingDueDate(e.target.value)}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                    required
                  />
                  <span className="text-3xs text-gray-400 mt-1 block">Usually the 5th or 10th day of the billing term.</span>
                </div>

                {payments.some(p => p.month === billingMonth) && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-800 text-xs space-y-1.5 shadow-2xs">
                    <div className="flex items-center gap-1.5 font-bold">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Dues already exist for {billingMonth}</span>
                    </div>
                    <p className="text-3xs text-amber-700 leading-normal">
                      Generating again will only create bills for active residents who are not yet invoiced for this month.
                    </p>
                    <label className="flex items-center gap-2 mt-1 cursor-pointer font-semibold text-3xs select-none">
                      <input
                        type="checkbox"
                        checked={forceProceed}
                        onChange={(e) => {
                          setForceProceed(e.target.checked);
                          if (e.target.checked) setBillingError('');
                        }}
                        className="rounded border-amber-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                      />
                      <span className="text-amber-950">I confirm and want to proceed</span>
                    </label>
                  </div>
                )}

                <div className="bg-gray-50 border border-gray-100 p-3 rounded-xl space-y-1.5 text-xs">
                  <span className="text-gray-400 text-3xs font-semibold uppercase block">Invoice Preview Facts</span>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Active Billable Guests</span>
                    <span className="font-semibold">{residents.filter(r => r.status === 'Active' && r.roomId).length} residents</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Invoice Basis</span>
                    <span className="font-semibold">Associated Room Rent</span>
                  </div>
                </div>

                {/* Footer buttons */}
                <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsGenerateOpen(false)}
                    className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 font-medium hover:bg-gray-50 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all shadow-sm shadow-indigo-200 cursor-pointer"
                  >
                    Generate Dues
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Record Payment Transaction Modal */}
      <AnimatePresence>
        {isPayOpen && activePayment && (
          <div className="fixed inset-0 bg-gray-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-gray-200 rounded-2xl w-full max-w-sm overflow-hidden shadow-xl"
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-display font-bold text-gray-950">Record Cash Receipt</h3>
                  <p className="text-gray-500 text-xs mt-0.5">Collect and register payment for active resident.</p>
                </div>
                <button
                  onClick={() => setIsPayOpen(false)}
                  className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleRecordPaymentSubmit} className="p-6 space-y-4">
                <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex items-center gap-4">
                  <div className="p-3 bg-indigo-600 text-white rounded-xl">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-indigo-800 text-2xs uppercase block">Rent Amount Due</span>
                    <span className="text-2xl font-bold text-indigo-950">
                      {formatCurrency(activePayment.amount - (activePayment.busAmount || 0))}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs border-b border-gray-100 pb-3">
                  <div className="flex justify-between text-gray-500">
                    <span>Resident</span>
                    <span className="font-semibold text-gray-800">{activePayment.residentName}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Billing Month</span>
                    <span className="font-semibold text-gray-800">{activePayment.month}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Room ID</span>
                    <span className="font-semibold text-gray-800">Room {activePayment.roomId}</span>
                  </div>
                  {activePayment.busAmount && activePayment.busAmount > 0 ? (
                    <div className="mt-2 bg-amber-50 border border-amber-100 p-2.5 rounded-xl space-y-1 text-3xs text-amber-900">
                      <div className="flex justify-between">
                        <span>Room Rent:</span>
                        <span className="font-semibold text-gray-950">{formatCurrency(activePayment.amount - activePayment.busAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Bus Fee:</span>
                        <span className="font-semibold text-indigo-700">{formatCurrency(activePayment.busAmount)}</span>
                      </div>
                      <p className="text-[10px] text-amber-700 mt-1 italic leading-normal">
                        Note: This registers payment specifically for Room Rent. Bus Fee transportation dues are recorded independently via the "Record Bus Pay" button.
                      </p>
                    </div>
                  ) : null}
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1.5">Payment Method</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['UPI', 'Cash', 'Bank Transfer', 'Card'] as const).map(method => {
                      const isSelected = paymentMethod === method;
                      return (
                        <div 
                          key={method}
                          onClick={() => setPaymentMethod(method)}
                          className={`p-2.5 border rounded-xl flex items-center gap-2 cursor-pointer text-xs transition-all ${
                            isSelected 
                              ? 'bg-indigo-50 border-indigo-500 text-indigo-950 font-semibold' 
                              : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          <CreditCard className="w-3.5 h-3.5 text-gray-400" />
                          <span>{method}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1.5">Paid To / Received By</label>
                  <input
                    type="text"
                    placeholder="e.g. Hostel Warden / sathwik"
                    value={receivedBy}
                    onChange={(e) => setReceivedBy(e.target.value)}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                {/* Footer buttons */}
                <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsPayOpen(false)}
                    className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 font-medium hover:bg-gray-50 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all shadow-sm shadow-indigo-200 cursor-pointer"
                  >
                    Confirm Payment
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Record Bus Payment Transaction Modal */}
        {isBusPayOpen && activeBusPayment && (
          <div className="fixed inset-0 bg-gray-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-gray-200 rounded-2xl w-full max-w-sm overflow-hidden shadow-xl"
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-display font-bold text-gray-950 flex items-center gap-1.5">
                    <Bus className="w-5 h-5 text-indigo-600" />
                    Record Bus Payment
                  </h3>
                  <p className="text-gray-500 text-xs mt-0.5">Collect and register independent bus transportation fee.</p>
                </div>
                <button
                  onClick={() => setIsBusPayOpen(false)}
                  className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleRecordBusPaymentSubmit} className="p-6 space-y-4">
                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-center gap-4">
                  <div className="p-3 bg-emerald-600 text-white rounded-xl">
                    <Bus className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-emerald-800 text-2xs uppercase block font-semibold">Bus Fee Due</span>
                    <span className="text-2xl font-bold text-emerald-950">{formatCurrency(activeBusPayment.busAmount || 0)}</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs border-b border-gray-100 pb-3">
                  <div className="flex justify-between text-gray-500">
                    <span>Resident</span>
                    <span className="font-semibold text-gray-800">{activeBusPayment.residentName}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Billing Month</span>
                    <span className="font-semibold text-gray-800">{activeBusPayment.month}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Room ID</span>
                    <span className="font-semibold text-gray-800">Room {activeBusPayment.roomId}</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1.5">Bus Payment Method</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['UPI', 'Cash', 'Bank Transfer', 'Card'] as const).map(method => {
                      const isSelected = busPaymentMethod === method;
                      return (
                        <div 
                          key={method}
                          onClick={() => setBusPaymentMethod(method)}
                          className={`p-2.5 border rounded-xl flex items-center gap-2 cursor-pointer text-xs transition-all ${
                            isSelected 
                              ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-semibold' 
                              : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          <CreditCard className="w-3.5 h-3.5 text-gray-400" />
                          <span>{method}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1.5">Paid To / Received By</label>
                  <input
                    type="text"
                    placeholder="e.g. Hostel Warden / sathwik"
                    value={busReceivedBy}
                    onChange={(e) => setBusReceivedBy(e.target.value)}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                {/* Footer buttons */}
                <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsBusPayOpen(false)}
                    className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 font-medium hover:bg-gray-50 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-all shadow-sm shadow-emerald-200 cursor-pointer"
                  >
                    Confirm Bus Payment
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Rent Reminder Modal */}
        {isReminderOpen && reminderPayment && (() => {
          const content = getWhatsAppContent(reminderPayment, reminderTab);
          const residentObj = residents.find(r => r.id === reminderPayment.residentId);
          return (
            <div className="fixed inset-0 bg-gray-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white border border-gray-200 rounded-2xl w-full max-w-lg overflow-hidden shadow-xl"
              >
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
                      <MessageCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-display font-bold text-gray-950">Send Payment Reminder</h3>
                      <p className="text-gray-500 text-xs mt-0.5">Share rent reminder via WhatsApp to resident or nominee.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setIsReminderOpen(false);
                      setReminderPayment(null);
                      setCopiedNotification(false);
                      setReminderTab('resident');
                    }}
                    className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
 
                {/* Modal Content */}
                <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
                  {/* Recipient Selector Toggle */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700">Select Recipient</label>
                    <div className="grid grid-cols-2 gap-2 p-1 bg-gray-50 border border-gray-100 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setReminderTab('resident')}
                        className={`py-2 rounded-lg font-medium text-xs transition-all cursor-pointer text-center ${
                          reminderTab === 'resident'
                            ? 'bg-white text-gray-950 shadow-2xs font-semibold border border-gray-100'
                            : 'text-gray-500 hover:text-gray-800'
                        }`}
                      >
                        👤 Resident ({reminderPayment.residentName})
                      </button>
                      <button
                        type="button"
                        onClick={() => setReminderTab('nominee')}
                        className={`py-2 rounded-lg font-medium text-xs transition-all cursor-pointer text-center ${
                          reminderTab === 'nominee'
                            ? 'bg-white text-gray-950 shadow-2xs font-semibold border border-gray-100'
                            : 'text-gray-500 hover:text-gray-800'
                        }`}
                      >
                        🛡️ Nominee ({residentObj?.emergencyContact?.name || 'Nominee'})
                      </button>
                    </div>
                  </div>

                  {/* Message Preview Section */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-gray-700">WhatsApp Message Template Preview</label>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(content.message);
                          setCopiedNotification(true);
                          setTimeout(() => setCopiedNotification(false), 2000);
                        }}
                        className="text-indigo-600 hover:text-indigo-700 text-xs font-medium flex items-center gap-1 cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Message Text</span>
                      </button>
                    </div>
                    
                    <div className="bg-emerald-50/50 border border-emerald-100/60 p-4 rounded-xl text-xs font-mono text-gray-700 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                      {content.message}
                    </div>
                  </div>
 
                  {/* Notification feedback */}
                  {copiedNotification && (
                    <div className="p-2.5 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs rounded-xl text-center font-medium">
                      ✓ Copied to clipboard successfully!
                    </div>
                  )}
                </div>
 
                {/* Footer buttons */}
                <div className="p-6 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-2xs text-gray-400 text-center sm:text-left">
                    {content.phone ? (
                      <span>Sending to: <strong className="font-semibold text-gray-600">{content.phone}</strong></span>
                    ) : (
                      <span className="text-rose-600 font-semibold">No phone number associated!</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setIsReminderOpen(false);
                        setReminderPayment(null);
                        setCopiedNotification(false);
                        setReminderTab('resident');
                      }}
                      className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 font-medium hover:bg-gray-100 rounded-xl cursor-pointer w-full sm:w-auto text-center"
                    >
                      Cancel
                    </button>
                    <a
                      href={content.waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`px-5 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-all shadow-md shadow-emerald-100 flex items-center justify-center gap-1.5 w-full sm:w-auto text-center cursor-pointer ${
                        !content.phone ? 'pointer-events-none opacity-50 bg-gray-400' : ''
                      }`}
                    >
                      <MessageCircle className="w-4 h-4" />
                      Send on WhatsApp
                    </a>
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
