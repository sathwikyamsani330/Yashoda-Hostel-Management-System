import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Search, 
  UserPlus, 
  X, 
  Check, 
  Mail, 
  Phone, 
  Calendar, 
  AlertCircle, 
  UserMinus, 
  CreditCard, 
  ShieldAlert,
  MapPin,
  ClipboardList,
  MessageCircle,
  Trash2,
  Fingerprint,
  Copy,
  CheckCircle
} from 'lucide-react';
import { Resident, Room, Payment, Complaint } from '../types';
import { formatCurrency, formatDate, getBillingAmounts } from '../utils';

interface ResidentManagerProps {
  residents: Resident[];
  rooms: Room[];
  payments: Payment[];
  complaints: Complaint[];
  onCheckIn: (resident: Resident, roomId: string) => void;
  onCheckOut: (residentId: string) => void;
  onDeleteResident: (residentId: string, resetStats?: boolean) => void;
  onClearCheckedOut: () => void;
  onClearActiveCheckins: () => void;
  onSelectResidentId: string | null;
  onClearSelectResident: () => void;
  setView: (view: 'dashboard' | 'rooms' | 'residents' | 'payments' | 'maintenance') => void;
  activeHostelId?: '1' | '2';
}

export default function ResidentManager({ 
  residents, 
  rooms, 
  payments, 
  complaints,
  onCheckIn, 
  onCheckOut,
  onDeleteResident,
  onClearCheckedOut,
  onClearActiveCheckins,
  onSelectResidentId,
  onClearSelectResident,
  setView,
  activeHostelId = '1'
}: ResidentManagerProps) {
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Checked-Out'>('All');
  const [feeFilter, setFeeFilter] = useState<'All' | 'Has Dues' | 'No Dues'>('All');

  // Modal control
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [detailResidentId, setDetailResidentId] = useState<string | null>(onSelectResidentId);
  const [confirmCheckOutId, setConfirmCheckOutId] = useState<string | null>(null);

  // Non-blocking iframe-safe confirmations
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [resetStatsOnDelete, setResetStatsOnDelete] = useState(true);
  const [pendingBulkClearCheckedOut, setPendingBulkClearCheckedOut] = useState<boolean>(false);
  const [pendingBulkClearActive, setPendingBulkClearActive] = useState<boolean>(false);
  const [isConfirmingDetailDelete, setIsConfirmingDetailDelete] = useState<boolean>(false);

  // Dues Reminder Modal States
  const [isDuesReminderOpen, setIsDuesReminderOpen] = useState(false);
  const [duesReminderResident, setDuesReminderResident] = useState<Resident | null>(null);
  const [duesReminderTab, setDuesReminderTab] = useState<'resident' | 'nominee'>('resident');
  const [duesCopiedNotification, setDuesCopiedNotification] = useState(false);

  const handleSelectResidentIdWithReset = (id: string | null) => {
    setDetailResidentId(id);
    setIsConfirmingDetailDelete(false);
    setConfirmCheckOutId(null);
  };

  // Form states
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAadhaarNumber, setFormAadhaarNumber] = useState('');
  const [formRoomId, setFormRoomId] = useState('');
  const [formEmergencyName, setFormEmergencyName] = useState('');
  const [formEmergencyRelation, setFormEmergencyRelation] = useState('');
  const [formEmergencyPhone, setFormEmergencyPhone] = useState('');
  const [formCheckInDate, setFormCheckInDate] = useState(new Date().toISOString().split('T')[0]);
  const [formSharingType, setFormSharingType] = useState<'3 Sharing' | '4 Sharing' | 'Other'>('3 Sharing');
  const [formPaymentPlan, setFormPaymentPlan] = useState<'Monthly' | '6 Months'>('Monthly');
  const [formBusOption, setFormBusOption] = useState<boolean>(false);
  const [formError, setFormError] = useState('');

  // Handle automatic details modal trigger from prop
  if (onSelectResidentId && detailResidentId !== onSelectResidentId) {
    setDetailResidentId(onSelectResidentId);
  }

  // Find available rooms
  const availableRooms = rooms.filter(r => r.residentIds.length < r.capacity);

  const openCheckInModal = () => {
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormAadhaarNumber('');
    setFormRoomId(availableRooms[0]?.id || '');
    setFormEmergencyName('');
    setFormEmergencyRelation('Father');
    setFormEmergencyPhone('');
    setFormCheckInDate(new Date().toISOString().split('T')[0]);
    setFormSharingType('3 Sharing');
    setFormPaymentPlan('Monthly');
    setFormBusOption(false);
    setFormError('');
    setIsCheckInOpen(true);
  };

  const handleAadhaarChange = (val: string) => {
    const clean = val.replace(/\D/g, '');
    const limited = clean.slice(0, 12);
    const formatted = limited.match(/.{1,4}/g)?.join(' ') || limited;
    setFormAadhaarNumber(formatted);
  };

  const handleCheckInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim() || !formPhone.trim() || !formRoomId) {
      setFormError('All fields including Room Allocation are required.');
      return;
    }
    if (!formEmergencyName.trim() || !formEmergencyPhone.trim()) {
      setFormError('Emergency contact details are required.');
      return;
    }

    const cleanAadhaar = formAadhaarNumber.replace(/\s/g, '');
    if (!cleanAadhaar) {
      setFormError('Aadhaar Number is required for guest ID verification.');
      return;
    }
    if (!/^\d{12}$/.test(cleanAadhaar)) {
      setFormError('Aadhaar Number must be exactly 12 numeric digits.');
      return;
    }

    const newResident: Resident = {
      id: `res-${Date.now()}`,
      name: formName.trim(),
      email: formEmail.trim(),
      phone: formPhone.trim(),
      roomId: formRoomId,
      checkInDate: formCheckInDate,
      checkOutDate: null,
      status: 'Active',
      outstandingFees: 0,
      emergencyContact: {
        name: formEmergencyName.trim(),
        relation: formEmergencyRelation,
        phone: formEmergencyPhone.trim()
      },
      aadhaarNumber: formAadhaarNumber.trim(),
      sharingType: formSharingType,
      paymentPlan: formPaymentPlan,
      busOption: formBusOption
    };

    onCheckIn(newResident, formRoomId);
    setIsCheckInOpen(false);
  };

  const handleCheckOutClick = (residentId: string) => {
    const res = residents.find(r => r.id === residentId);
    if (!res) return;

    // Strict rule: cannot checkout if outstanding fees are present
    if (res.outstandingFees > 0) {
      return;
    }

    if (confirmCheckOutId === residentId) {
      onCheckOut(residentId);
      setConfirmCheckOutId(null);
      setDetailResidentId(null);
      onClearSelectResident();
    } else {
      setConfirmCheckOutId(residentId);
    }
  };

  const getDuesWhatsAppContent = (r: Resident, target: 'resident' | 'nominee' = 'resident') => {
    const phone = target === 'resident' ? r.phone : (r.emergencyContact?.phone || '');
    let phoneClean = phone.replace(/\D/g, '');
    if (phoneClean.length === 10) {
      phoneClean = '91' + phoneClean;
    }

    const hostelName = r.hostelId === '2' ? 'Yashoda-2 Deluxe Boys Hostel' : 'Yashoda Deluxe Boys Hostel';
    const formattedAmount = formatCurrency(r.outstandingFees);
    
    // Get months that have dues
    const unpaidList = payments.filter(p => p.residentId === r.id && p.status !== 'Paid');
    const dueMonthsStr = unpaidList.map(p => `${p.month} (${formatCurrency(p.amount)})`).join(', ');

    let message = '';
    if (target === 'resident') {
      message = `Dear *${r.name}*,

This is a reminder regarding your *outstanding rent dues* at *${hostelName}*.

• *Room Number:* Room ${r.roomId}
• *Total Outstanding:* ${formattedAmount}
${dueMonthsStr ? `• *Pending Months:* ${dueMonthsStr}` : ''}

Please clear your pending dues as soon as possible to avoid overdue penalties and service disruption. If you have already cleared, please share the receipt.

Thank you!
*${hostelName} Management*`;
    } else {
      const nomineeName = r.emergencyContact?.name || 'Nominee';
      const nomineeRelation = r.emergencyContact?.relation || 'Guardian';
      message = `Dear *${nomineeName}* (${nomineeRelation} of *${r.name}*),

This is a reminder regarding the *outstanding rent dues* for your ward *${r.name}* residing in Room ${r.roomId} at *${hostelName}*.

• *Total Outstanding dues:* ${formattedAmount}
${dueMonthsStr ? `• *Pending Months:* ${dueMonthsStr}` : ''}

Please ensure that these pending dues are cleared at the earliest. If already paid, kindly reply with the screenshot of the transaction.

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

  const openDuesReminder = (r: Resident) => {
    setDuesReminderResident(r);
    setDuesReminderTab('resident');
    setDuesCopiedNotification(false);
    setIsDuesReminderOpen(true);
  };

  // Filter residents
  const filteredResidents = residents.filter(r => {
    const cleanQuery = searchQuery.replace(/\s/g, '').toLowerCase();
    const cleanAadhaar = (r.aadhaarNumber || '').replace(/\s/g, '');
    const cleanPhone = (r.phone || '').replace(/[^\d+]/g, '');

    const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          r.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          cleanPhone.includes(cleanQuery) ||
                          (r.roomId && r.roomId.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (cleanAadhaar && cleanAadhaar.includes(cleanQuery));
    
    const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
    
    let matchesFees = true;
    if (feeFilter === 'Has Dues') {
      matchesFees = r.outstandingFees > 0;
    } else if (feeFilter === 'No Dues') {
      matchesFees = r.outstandingFees === 0;
    }

    return matchesSearch && matchesStatus && matchesFees;
  });

  const activeDetailResident = residents.find(r => r.id === detailResidentId);
  const residentPayments = detailResidentId ? payments.filter(p => p.residentId === detailResidentId) : [];
  const residentComplaints = detailResidentId ? complaints.filter(c => c.residentId === detailResidentId) : [];

  return (
    <div className="space-y-6" id="resident-manager-view">
      {/* Header Row */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-semibold text-gray-950">Residents Directory</h2>
          <p className="text-gray-500 text-sm mt-0.5">Manage student check-ins, check-outs, contact details, and emergency logs.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {residents.some(r => r.status === 'Checked-Out') && (
            <div className="relative">
              {!pendingBulkClearCheckedOut ? (
                <button
                  onClick={() => setPendingBulkClearCheckedOut(true)}
                  className="flex items-center justify-center gap-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-700 font-medium px-3.5 py-2 rounded-xl transition-all cursor-pointer text-xs h-10"
                  title="Bulk clear checked-out resident profiles"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  Clear Checked-Out Profiles
                </button>
              ) : (
                <div className="flex items-center gap-1 bg-rose-50 border border-rose-200 p-1.5 rounded-xl text-xs h-10 animate-pulse">
                  <span className="text-rose-700 font-semibold px-1 text-2xs">Confirm?</span>
                  <button
                    onClick={() => {
                      onClearCheckedOut();
                      setPendingBulkClearCheckedOut(false);
                    }}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-2 py-1 rounded-lg text-3xs cursor-pointer"
                  >
                    Yes, Delete
                  </button>
                  <button
                    onClick={() => setPendingBulkClearCheckedOut(false)}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium px-2 py-1 rounded-lg text-3xs cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}

          {residents.some(r => r.status === 'Active') && (
            <div className="relative">
              {!pendingBulkClearActive ? (
                <button
                  onClick={() => setPendingBulkClearActive(true)}
                  className="flex items-center justify-center gap-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-100 text-amber-800 font-medium px-3.5 py-2 rounded-xl transition-all cursor-pointer text-xs h-10"
                  title="Bulk clear active guest check-ins"
                >
                  <Trash2 className="w-3.5 h-3.5 text-amber-600" />
                  Clear Active Check-ins
                </button>
              ) : (
                <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 p-1.5 rounded-xl text-xs h-10 animate-pulse">
                  <span className="text-amber-800 font-semibold px-1 text-2xs">Delete All?</span>
                  <button
                    onClick={() => {
                      onClearActiveCheckins();
                      setPendingBulkClearActive(false);
                    }}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-2 py-1 rounded-lg text-3xs cursor-pointer"
                  >
                    Yes, Clear
                  </button>
                  <button
                    onClick={() => setPendingBulkClearActive(false)}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium px-2 py-1 rounded-lg text-3xs cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}

          <button
            id="check-in-btn"
            onClick={openCheckInModal}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2.5 rounded-xl transition-all shadow-sm shadow-indigo-100 cursor-pointer text-sm h-10"
          >
            <UserPlus className="w-4 h-4" />
            Check-In Resident
          </button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col md:flex-row md:items-center gap-4 shadow-2xs">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4.5 h-4.5" />
          <input
            id="resident-search-input"
            type="text"
            placeholder="Search residents by name, room, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1">
            <span className="text-gray-500">Status:</span>
            <div className="flex bg-gray-50 p-0.5 rounded-lg border border-gray-100 flex-wrap">
              {(['All', 'Active', 'Checked-Out'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-2 py-1 rounded-md font-medium transition-all cursor-pointer whitespace-nowrap ${
                    statusFilter === s 
                      ? 'bg-white text-gray-950 shadow-2xs font-semibold' 
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-gray-500">Fees:</span>
            <div className="flex bg-gray-50 p-0.5 rounded-lg border border-gray-100">
              {(['All', 'Has Dues', 'No Dues'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFeeFilter(f)}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                    feeFilter === f 
                      ? 'bg-white text-gray-950 shadow-2xs' 
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Directory Grid */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-medium text-xs">
                <th className="py-4 px-6">Name</th>
                <th className="py-4 px-6">Room Assigned</th>
                <th className="py-4 px-6">Check-In Date</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6">Outstanding Balance</th>
                <th className="py-4 px-6 text-right">Emergency Link</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredResidents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-gray-500">
                    <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="font-semibold text-gray-900">No residents matched search criteria</p>
                    <p className="text-2xs text-gray-400 mt-0.5">Double check keywords or clear filters</p>
                  </td>
                </tr>
              ) : (
                filteredResidents.map(res => (
                  <tr 
                    key={res.id} 
                    onClick={() => handleSelectResidentIdWithReset(res.id)}
                    className="hover:bg-gray-50/50 transition-colors cursor-pointer group"
                  >
                    <td className="py-4 px-6">
                       <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center font-display font-semibold text-sm">
                          {res.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 group-hover:text-indigo-700 transition-colors">{res.name}</p>
                          <p className="text-2xs text-gray-400 font-mono mt-0.5">{res.email}</p>
                          {res.aadhaarNumber && (
                            <p className="text-3xs text-indigo-600 font-mono mt-0.5">Aadhaar: {res.aadhaarNumber}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-medium text-gray-700">
                      {res.roomId ? `Room ${res.roomId}` : 'Unassigned'}
                    </td>
                    <td className="py-4 px-6 text-gray-500">
                      {formatDate(res.checkInDate)}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center text-3xs font-semibold px-2 py-0.5 rounded-full ${
                        res.status === 'Active' 
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' 
                          : 'bg-gray-100 text-gray-600 border border-gray-200'
                      }`}>
                        {res.status}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`font-semibold ${
                        res.outstandingFees > 0 ? 'text-rose-600' : 'text-gray-500'
                      }`}>
                        {formatCurrency(res.outstandingFees)}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right text-xs text-gray-400">
                      <span>{res.emergencyContact.name} ({res.emergencyContact.relation})</span>
                    </td>
                    <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                      {pendingDeleteId === res.id ? (
                        <div className="inline-flex flex-col items-end gap-1.5 bg-rose-50 border border-rose-200 p-2 rounded-xl text-3xs">
                          <div className="flex items-center gap-1">
                            <input
                              type="checkbox"
                              id={`reset-check-${res.id}`}
                              checked={resetStatsOnDelete}
                              onChange={(e) => setResetStatsOnDelete(e.target.checked)}
                              className="rounded text-rose-600 w-3 h-3 cursor-pointer"
                            />
                            <label htmlFor={`reset-check-${res.id}`} className="text-rose-700 font-semibold cursor-pointer select-none">Reset stats & room</label>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => {
                                onDeleteResident(res.id, resetStatsOnDelete);
                                setPendingDeleteId(null);
                              }}
                              className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-2 py-0.5 rounded cursor-pointer"
                            >
                              Yes, Delete
                            </button>
                            <button
                              onClick={() => setPendingDeleteId(null)}
                              className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium px-2 py-0.5 rounded cursor-pointer"
                            >
                              No
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setPendingDeleteId(res.id)}
                          className="p-1.5 hover:bg-rose-50 rounded-lg text-gray-400 hover:text-rose-600 transition-colors cursor-pointer inline-flex items-center justify-center"
                          title="Delete resident record permanently"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Check-In Resident Modal */}
      <AnimatePresence>
        {isCheckInOpen && (
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
            {/* Smooth animated backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCheckInOpen(false)}
              className="absolute inset-0 bg-gray-950/40 backdrop-blur-xs cursor-pointer"
            />
            
            {/* Spring transition container */}
            <motion.div
              initial={{ opacity: 0, y: 25, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 25, scale: 0.98 }}
              transition={{ type: 'spring', duration: 0.45, bounce: 0.12 }}
              className="relative bg-white border border-gray-200 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden shadow-xl z-10"
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0">
                <div>
                  <h3 className="text-lg font-display font-bold text-gray-950">Check-In Guest Resident</h3>
                  <p className="text-gray-500 text-xs mt-0.5">Assign a bed space, collect details, and verify contact links.</p>
                </div>
                <button
                  onClick={() => setIsCheckInOpen(false)}
                  className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleCheckInSubmit} className="flex-1 flex flex-col overflow-hidden">
                <div 
                  className="flex-1 overflow-y-auto max-h-[calc(90vh-140px)] p-6 space-y-4 md:space-y-6 scrollbar-thin"
                  style={{ WebkitOverflowScrolling: 'touch' }}
                >
                  {formError && (
                    <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-rose-700 text-xs font-medium flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{formError}</span>
                    </div>
                  )}

                 {/* Section 1: Demographics */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Demographics</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1">Full Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Liam Neeson"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1">Email Address</label>
                      <input
                        type="email"
                        placeholder="liam@example.com"
                        value={formEmail}
                        onChange={(e) => setFormEmail(e.target.value)}
                        className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1">Phone Number</label>
                      <input
                        type="text"
                        placeholder="+1 (555) 000-0000"
                        value={formPhone}
                        onChange={(e) => setFormPhone(e.target.value)}
                        className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1">Aadhaar Number (12 Digits)</label>
                      <input
                        type="text"
                        placeholder="e.g. 1234 5678 9012"
                        value={formAadhaarNumber}
                        onChange={(e) => handleAadhaarChange(e.target.value)}
                        className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 font-mono"
                        maxLength={14}
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1">Check-In Date</label>
                      <input
                        type="date"
                        value={formCheckInDate}
                        onChange={(e) => setFormCheckInDate(e.target.value)}
                        className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Room Assignment */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Room Placement</h4>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">Select Living Room</label>
                    {availableRooms.length === 0 ? (
                      <div className="bg-amber-50 border border-amber-100 text-amber-800 text-xs p-3 rounded-xl">
                        No beds are currently available in any room. Please add a room or check out another resident first.
                      </div>
                    ) : (
                      <select
                        value={formRoomId}
                        onChange={(e) => setFormRoomId(e.target.value)}
                        className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 bg-white"
                      >
                        {availableRooms.map(r => (
                          <option key={r.id} value={r.id}>
                            Room {r.id} ({r.type} Suite - {r.capacity - r.residentIds.length} spots left - {formatCurrency(r.rent)}/mo)
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {/* Section 3: Subscription & Billing Options */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Subscription & Billing</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1">Sharing Option</label>
                      <select
                        value={formSharingType}
                        onChange={(e) => setFormSharingType(e.target.value as '3 Sharing' | '4 Sharing' | 'Other')}
                        className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 bg-white font-medium"
                      >
                        <option value="3 Sharing">3 Sharing (Triple)</option>
                        <option value="4 Sharing">4 Sharing (Quadruple)</option>
                        <option value="Other">Standard Room Rent</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1">Payment Plan</label>
                      <select
                        value={formPaymentPlan}
                        onChange={(e) => setFormPaymentPlan(e.target.value as 'Monthly' | '6 Months')}
                        className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 bg-white font-medium"
                      >
                        <option value="Monthly">Monthly Cycle</option>
                        <option value="6 Months">6 Months Package</option>
                      </select>
                    </div>
                  </div>

                  {/* Bus Option */}
                  <div className="p-3 bg-indigo-50/50 border border-indigo-100/70 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">🚌</span>
                      <div>
                        <p className="text-xs font-bold text-gray-900">Include Bus Facility</p>
                        <p className="text-3xs text-gray-500 mt-0.5">₹6,000 for 6 months (or ₹1,000/month for monthly plan)</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={formBusOption}
                        onChange={(e) => setFormBusOption(e.target.checked)}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-gray-250 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  {/* Calculated Fees Preview */}
                  {(() => {
                    const billing = getBillingAmounts(
                      activeHostelId,
                      formSharingType,
                      formPaymentPlan,
                      formBusOption,
                      rooms.find(r => r.id === formRoomId)?.rent || 0
                    );
                    return (
                      <div className="p-3.5 bg-gray-50 border border-gray-150 rounded-xl space-y-1">
                        <span className="text-3xs text-gray-400 font-bold uppercase tracking-wider block">Estimated Billing Preview</span>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-500">
                            {formSharingType === 'Other' ? 'Room Base Rent' : `${formSharingType} Rent (${formPaymentPlan})`}:
                          </span>
                          <span className="font-semibold text-gray-900 font-mono">
                            {formatCurrency(billing.rentAmount)}
                          </span>
                        </div>
                        {formBusOption && (
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-500">Bus Subscription Fee:</span>
                            <span className="font-semibold text-gray-900 font-mono">
                              {formatCurrency(billing.busFeeAmount)}
                            </span>
                          </div>
                        )}
                        <div className="border-t border-gray-200/60 pt-1.5 flex justify-between items-center text-xs font-bold text-indigo-750">
                          <span>Total Initial Invoice:</span>
                          <span className="font-mono text-sm text-indigo-900">
                            {formatCurrency(billing.totalAmount)}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Section 4: Emergency Link */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Emergency Contact</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1">Contact Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Richard Neeson"
                        value={formEmergencyName}
                        onChange={(e) => setFormEmergencyName(e.target.value)}
                        className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1">Relation</label>
                      <select
                        value={formEmergencyRelation}
                        onChange={(e) => setFormEmergencyRelation(e.target.value)}
                        className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 bg-white"
                      >
                        <option value="Father">Father</option>
                        <option value="Mother">Mother</option>
                        <option value="Guardian">Guardian</option>
                        <option value="Sibling">Sibling</option>
                        <option value="Spouse">Spouse</option>
                        <option value="Friend">Friend</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1">Contact Phone</label>
                      <input
                        type="text"
                        placeholder="+1 (555) 999-1111"
                        value={formEmergencyPhone}
                        onChange={(e) => setFormEmergencyPhone(e.target.value)}
                        className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>
                  </div>
                </div>

                </div>

                {/* Footer buttons */}
                <div className="p-6 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50/50 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsCheckInOpen(false)}
                    className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 font-medium hover:bg-gray-50 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={availableRooms.length === 0}
                    className="px-5 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium rounded-xl transition-all shadow-sm shadow-indigo-200 cursor-pointer"
                  >
                    Complete Check-In
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Resident Detailed Profile Modal */}
      <AnimatePresence>
        {activeDetailResident && (
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
            {/* Smooth animated backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setDetailResidentId(null);
                setConfirmCheckOutId(null);
                onClearSelectResident();
              }}
              className="absolute inset-0 bg-gray-950/40 backdrop-blur-xs cursor-pointer"
            />

            {/* Spring transition container */}
            <motion.div
              initial={{ opacity: 0, y: 25, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 25, scale: 0.98 }}
              transition={{ type: 'spring', duration: 0.45, bounce: 0.12 }}
              className="relative bg-white border border-gray-200 rounded-2xl w-full max-w-2xl overflow-hidden shadow-xl z-10"
            >
              {/* Header card with initial & name */}
              <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-white/10 text-indigo-100 border border-white/10 flex items-center justify-center font-display font-semibold text-xl shrink-0">
                    {activeDetailResident.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="text-xl font-display font-bold">{activeDetailResident.name}</h3>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-300">
                      <span className="bg-indigo-950/50 px-2 py-0.5 rounded-md font-mono">
                        {activeDetailResident.roomId ? `Room ${activeDetailResident.roomId}` : 'Unassigned'}
                      </span>
                      <span>•</span>
                      <span className="capitalize">{activeDetailResident.status} Resident</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setDetailResidentId(null);
                    setConfirmCheckOutId(null);
                    onClearSelectResident();
                  }}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Main Detailed Grid */}
              <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
                
                {/* Section: Demographics & Security Contact */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Personal Contact */}
                  <div className="space-y-3">
                    <span className="text-gray-400 text-3xs font-semibold uppercase tracking-wider block">Resident Contact Info</span>
                    <div className="space-y-2 text-sm text-gray-700">
                      <div className="flex items-center gap-2.5">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="font-mono text-xs">{activeDetailResident.email}</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-gray-50 pb-1.5">
                        <div className="flex items-center gap-2.5">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span>{activeDetailResident.phone}</span>
                        </div>
                        <a
                          href={`https://wa.me/${activeDetailResident.phone.replace(/\D/g, '').length === 10 ? '91' + activeDetailResident.phone.replace(/\D/g, '') : activeDetailResident.phone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100 text-3xs font-semibold px-2 py-0.5 rounded-md transition-all cursor-pointer shadow-3xs"
                          title="Open direct WhatsApp chat"
                        >
                          <MessageCircle className="w-2.5 h-2.5" />
                          <span>WhatsApp</span>
                        </a>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>Checked-in: {formatDate(activeDetailResident.checkInDate)}</span>
                      </div>
                      {activeDetailResident.aadhaarNumber && (
                        <div className="flex items-center gap-2.5 pt-1 border-t border-gray-50">
                          <Fingerprint className="w-4 h-4 text-indigo-500" />
                          <span className="font-semibold text-xs text-gray-500">Aadhaar:</span>
                          <span className="font-mono text-xs text-indigo-900 bg-indigo-50/50 px-1.5 py-0.5 rounded-md">{activeDetailResident.aadhaarNumber}</span>
                        </div>
                      )}
                      {activeDetailResident.sharingType && (
                        <div className="flex items-center gap-2.5 pt-1 border-t border-gray-50">
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                          <span className="font-semibold text-xs text-gray-500">Plan Option:</span>
                          <span className="font-medium text-xs text-slate-800 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded-md">
                            {activeDetailResident.sharingType} ({activeDetailResident.paymentPlan || 'Monthly'})
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2.5 pt-1 border-t border-gray-50">
                        <span className="text-xs text-center w-4 font-mono">🚌</span>
                        <span className="font-semibold text-xs text-gray-500">Bus Facility:</span>
                        <span className={`font-semibold text-xs px-1.5 py-0.5 rounded-md ${
                          activeDetailResident.busOption 
                            ? 'text-emerald-700 bg-emerald-50 border border-emerald-100' 
                            : 'text-gray-400 bg-gray-50 border border-gray-100'
                        }`}>
                          {activeDetailResident.busOption 
                            ? (activeDetailResident.paymentPlan === '6 Months' ? 'Subscribed (₹6,000 / 6-mo)' : 'Subscribed (₹1,000 / mo)') 
                            : 'Not Subscribed'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Emergency link */}
                  <div className="space-y-3">
                    <span className="text-gray-400 text-3xs font-semibold uppercase tracking-wider block">Emergency Contact</span>
                    <div className="bg-gray-50 border border-gray-100 p-3 rounded-xl text-sm">
                      <p className="font-semibold text-gray-900">{activeDetailResident.emergencyContact.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{activeDetailResident.emergencyContact.relation}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-600 mt-2">
                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                        <span>{activeDetailResident.emergencyContact.phone}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section: Financial Dues status & Ledger */}
                <div className="border-t border-gray-100 pt-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-3xs font-semibold uppercase tracking-wider block">Dues & Ledgers</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold ${
                        activeDetailResident.outstandingFees > 0 ? 'text-rose-600' : 'text-indigo-600'
                      }`}>
                        Outstanding: {formatCurrency(activeDetailResident.outstandingFees)}
                      </span>
                      {activeDetailResident.outstandingFees > 0 && (
                        <button
                          onClick={() => openDuesReminder(activeDetailResident)}
                          className="inline-flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-3xs font-semibold px-2 py-0.5 rounded-md transition-all cursor-pointer shadow-3xs"
                          title="Send outstanding dues reminder to resident or nominee via WhatsApp"
                        >
                          <MessageCircle className="w-2.5 h-2.5" />
                          <span>Send Reminder</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {residentPayments.length === 0 ? (
                    <p className="text-gray-400 text-xs py-2">No transaction history recorded yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {residentPayments.map(p => (
                        <div key={p.id} className="flex items-center justify-between bg-gray-50/50 p-2.5 px-3 rounded-xl border border-gray-100">
                          <div>
                            <p className="text-xs font-medium text-gray-900">{p.month}</p>
                            <span className="text-3xs text-gray-400 block font-mono">
                              ID: {p.id} • Due: {formatDate(p.dueDate)}
                              {p.status === 'Paid' && p.paymentMethod && ` • via ${p.paymentMethod}`}
                              {p.status === 'Paid' && p.receivedBy && ` • To: ${p.receivedBy}`}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-semibold text-gray-900 block">{formatCurrency(p.amount)}</span>
                            <span className={`inline-block text-3xs px-1.5 py-0.2 rounded-full font-medium ${
                              p.status === 'Paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                            }`}>
                              {p.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={() => {
                      setDetailResidentId(null);
                      onClearSelectResident();
                      setView('payments');
                    }}
                    className="text-xs text-indigo-600 hover:text-indigo-700 hover:underline font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <CreditCard className="w-3 h-3" />
                    Manage Bills & Payments
                  </button>
                </div>

                {/* Section: Active complaints */}
                <div className="border-t border-gray-100 pt-5 space-y-3">
                  <span className="text-gray-400 text-3xs font-semibold uppercase tracking-wider block">Registered Tickets</span>
                  
                  {residentComplaints.length === 0 ? (
                    <p className="text-gray-400 text-xs py-1">No complaints logged by this resident.</p>
                  ) : (
                    <div className="space-y-2">
                      {residentComplaints.map(c => (
                        <div key={c.id} className="p-3 border border-gray-100 rounded-xl bg-gray-50/50 text-xs">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-gray-900">{c.title}</span>
                            <span className={`inline-block text-3xs px-1.5 py-0.1 rounded-full font-semibold uppercase tracking-wider ${
                              c.priority === 'High' ? 'bg-rose-100 text-rose-700' : 'bg-gray-100 text-gray-700'
                            }`}>
                              {c.priority}
                            </span>
                          </div>
                          <p className="text-gray-500 text-2xs leading-normal">{c.description}</p>
                          <div className="mt-1.5 flex justify-between items-center text-3xs text-gray-400">
                            <span>Status: <strong className="capitalize text-indigo-600">{c.status}</strong></span>
                            <span>{formatDate(c.createdAt)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={() => {
                      setDetailResidentId(null);
                      onClearSelectResident();
                      setView('maintenance');
                    }}
                    className="text-xs text-indigo-600 hover:text-indigo-700 hover:underline font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <ClipboardList className="w-3 h-3" />
                    Open Helpdesk Support
                  </button>
                </div>

              </div>

              {/* Action Footer: Check-Out or Delete */}
              {activeDetailResident.status === 'Active' && (
                <div className="bg-gray-50 border-t border-gray-100 p-4 px-6">
                  {activeDetailResident.outstandingFees > 0 ? (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
                      <div className="flex items-center gap-2 text-rose-600 text-xs font-semibold">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>Unable to check out: Outstanding dues of {formatCurrency(activeDetailResident.outstandingFees)} must be cleared first.</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {isConfirmingDetailDelete ? (
                          <div className="flex flex-col items-end gap-1.5 bg-rose-50 border border-rose-200 p-2 rounded-xl text-3xs">
                            <div className="flex items-center gap-1">
                              <input
                                type="checkbox"
                                id={`reset-check-detail-1`}
                                checked={resetStatsOnDelete}
                                onChange={(e) => setResetStatsOnDelete(e.target.checked)}
                                className="rounded text-rose-600 w-3 h-3 cursor-pointer"
                              />
                              <label htmlFor={`reset-check-detail-1`} className="text-rose-700 font-semibold cursor-pointer select-none">Reset stats & room</label>
                            </div>
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => {
                                  onDeleteResident(activeDetailResident.id, resetStatsOnDelete);
                                  handleSelectResidentIdWithReset(null);
                                  onClearSelectResident();
                                }}
                                className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-2 py-1 rounded-lg cursor-pointer"
                              >
                                Yes, Delete
                              </button>
                              <button
                                onClick={() => setIsConfirmingDetailDelete(false)}
                                className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium px-2 py-1 rounded-lg cursor-pointer"
                              >
                                No
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setIsConfirmingDetailDelete(true)}
                            className="flex items-center gap-1.5 bg-gray-100 hover:bg-rose-50 border border-gray-200 hover:border-rose-200 text-gray-600 hover:text-rose-700 text-xs font-medium px-4 py-2 rounded-xl transition-all cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete Profile
                          </button>
                        )}
                        <button
                          disabled
                          className="flex items-center gap-1.5 bg-gray-100 border border-gray-200 text-gray-400 text-xs font-medium px-4 py-2 rounded-xl cursor-not-allowed"
                          title="Outstanding dues block check-out"
                        >
                          <UserMinus className="w-4 h-4 text-gray-300" />
                          Check-Out Blocked
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
                      <div className="flex items-center gap-2 text-gray-500 text-xs font-medium">
                        <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
                        <span>{confirmCheckOutId === activeDetailResident.id ? 'Click again to confirm immediate bed release.' : 'Resident Check-out is irreversible.'}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {isConfirmingDetailDelete ? (
                          <div className="flex flex-col items-end gap-1.5 bg-rose-50 border border-rose-200 p-2 rounded-xl text-3xs mr-1">
                            <div className="flex items-center gap-1">
                              <input
                                type="checkbox"
                                id={`reset-check-detail-2`}
                                checked={resetStatsOnDelete}
                                onChange={(e) => setResetStatsOnDelete(e.target.checked)}
                                className="rounded text-rose-600 w-3 h-3 cursor-pointer"
                              />
                              <label htmlFor={`reset-check-detail-2`} className="text-rose-700 font-semibold cursor-pointer select-none">Reset stats & room</label>
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={() => {
                                  onDeleteResident(activeDetailResident.id, resetStatsOnDelete);
                                  handleSelectResidentIdWithReset(null);
                                  onClearSelectResident();
                                }}
                                className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-2 py-1 rounded-lg cursor-pointer"
                              >
                                Yes, Delete
                              </button>
                              <button
                                onClick={() => setIsConfirmingDetailDelete(false)}
                                className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium px-2 py-1 rounded-lg cursor-pointer"
                              >
                                No
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setIsConfirmingDetailDelete(true)}
                            className="flex items-center gap-1.5 bg-gray-100 hover:bg-rose-50 border border-gray-200 hover:border-rose-200 text-gray-600 hover:text-rose-700 text-xs font-medium px-4 py-2 rounded-xl transition-all cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete Profile
                          </button>
                        )}
                        <button
                          onClick={() => handleCheckOutClick(activeDetailResident.id)}
                          className={`flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-xl transition-all cursor-pointer border ${
                            confirmCheckOutId === activeDetailResident.id
                              ? 'bg-rose-600 border-rose-600 text-white hover:bg-rose-700'
                              : 'bg-rose-50 border-rose-100 text-rose-700 hover:bg-rose-100'
                          }`}
                        >
                          <UserMinus className="w-4 h-4" />
                          <span>{confirmCheckOutId === activeDetailResident.id ? 'Confirm Check-Out' : 'Check-Out Resident'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeDetailResident.status === 'Checked-Out' && (
                <div className="bg-rose-50/50 border-t border-rose-100 p-4 px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-rose-700 text-xs font-semibold">
                    <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>Resident is checked out. You can delete their record permanently.</span>
                  </div>
                  {isConfirmingDetailDelete ? (
                    <div className="flex items-center gap-1.5 bg-rose-100 border border-rose-300 p-1.5 rounded-xl text-3xs animate-pulse">
                      <span className="text-rose-800 font-semibold px-1">Permanently erase history?</span>
                      <button
                        onClick={() => {
                          onDeleteResident(activeDetailResident.id);
                          handleSelectResidentIdWithReset(null);
                          onClearSelectResident();
                        }}
                        className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-2.5 py-1 rounded-lg cursor-pointer text-2xs"
                      >
                        Yes, Delete
                      </button>
                      <button
                        onClick={() => setIsConfirmingDetailDelete(false)}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium px-2 py-1 rounded-lg cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsConfirmingDetailDelete(true)}
                      className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium px-4 py-2 rounded-xl transition-all cursor-pointer shadow-sm shadow-rose-200 border border-rose-600"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Profile Permanently
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        )}

        {/* Total Outstanding Dues Reminder Modal */}
        {isDuesReminderOpen && duesReminderResident && (() => {
          const content = getDuesWhatsAppContent(duesReminderResident, duesReminderTab);
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
                      <h3 className="text-base font-display font-bold text-gray-950">Send Outstanding Dues Reminder</h3>
                      <p className="text-gray-500 text-xs mt-0.5">Share total outstanding dues reminder via WhatsApp.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setIsDuesReminderOpen(false);
                      setDuesReminderResident(null);
                      setDuesCopiedNotification(false);
                      setDuesReminderTab('resident');
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
                        onClick={() => setDuesReminderTab('resident')}
                        className={`py-2 rounded-lg font-medium text-xs transition-all cursor-pointer text-center ${
                          duesReminderTab === 'resident'
                            ? 'bg-white text-gray-950 shadow-2xs font-semibold border border-gray-100'
                            : 'text-gray-500 hover:text-gray-800'
                        }`}
                      >
                        👤 Resident ({duesReminderResident.name})
                      </button>
                      <button
                        type="button"
                        onClick={() => setDuesReminderTab('nominee')}
                        className={`py-2 rounded-lg font-medium text-xs transition-all cursor-pointer text-center ${
                          duesReminderTab === 'nominee'
                            ? 'bg-white text-gray-950 shadow-2xs font-semibold border border-gray-100'
                            : 'text-gray-500 hover:text-gray-800'
                        }`}
                      >
                        🛡️ Nominee ({duesReminderResident.emergencyContact?.name || 'Nominee'})
                      </button>
                    </div>
                  </div>

                  {/* Message Preview Section */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-gray-700">WhatsApp Message Template Preview</label>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(content.message);
                          setDuesCopiedNotification(true);
                          setTimeout(() => setDuesCopiedNotification(false), 2000);
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
                  {duesCopiedNotification && (
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
                        setIsDuesReminderOpen(false);
                        setDuesReminderResident(null);
                        setDuesCopiedNotification(false);
                        setDuesReminderTab('resident');
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
