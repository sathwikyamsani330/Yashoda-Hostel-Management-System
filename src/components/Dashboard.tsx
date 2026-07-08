import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  DoorOpen, 
  DollarSign, 
  AlertTriangle, 
  Plus, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  MapPin,
  ClipboardList,
  Receipt,
  ShoppingCart,
  Wrench,
  Trash2,
  Calendar,
  X,
  Bus
} from 'lucide-react';
import { Room, Resident, Payment, Complaint, Expense, ExpenseCategory } from '../types';
import { formatCurrency, formatDate } from '../utils';

interface DashboardProps {
  rooms: Room[];
  residents: Resident[];
  payments: Payment[];
  complaints: Complaint[];
  expenses: Expense[];
  onAddExpense: (expense: Omit<Expense, 'id' | 'hostelId'>) => void;
  onDeleteExpense: (expenseId: string) => void;
  hostelName: string;
  setView: (view: 'dashboard' | 'rooms' | 'residents' | 'payments' | 'maintenance') => void;
  triggerQuickAction: (action: string) => void;
}

export default function Dashboard({ 
  rooms, 
  residents, 
  payments, 
  complaints, 
  expenses = [],
  onAddExpense,
  onDeleteExpense,
  hostelName,
  setView,
  triggerQuickAction
}: DashboardProps) {
  // Calculations
  const activeResidents = residents.filter(r => r.status === 'Active');
  const totalCapacity = rooms.reduce((acc, r) => acc + r.capacity, 0);
  const occupiedBeds = rooms.reduce((acc, r) => acc + r.residentIds.length, 0);
  const occupancyRate = totalCapacity > 0 ? Math.round((occupiedBeds / totalCapacity) * 100) : 0;
  
  const totalOutstanding = activeResidents.reduce((acc, r) => acc + r.outstandingFees, 0);
  const pendingComplaints = complaints.filter(c => c.status !== 'Resolved');

  // Payment rate calculation (Paid vs Total for latest payments)
  const paidPayments = payments.filter(p => p.status === 'Paid');
  const totalPaymentsAmount = payments.reduce((acc, p) => acc + p.amount, 0);
  const paidPaymentsAmount = paidPayments.reduce((acc, p) => acc + p.amount, 0);
  const collectionRate = totalPaymentsAmount > 0 ? Math.round((paidPaymentsAmount / totalPaymentsAmount) * 100) : 0;

  // Bus Calculations
  const busBilled = payments.reduce((acc, p) => acc + (p.busAmount || 0), 0);
  const busCollected = payments
    .filter(p => p.busStatus === 'Paid')
    .reduce((acc, p) => acc + (p.busAmount || 0), 0);
  const busOutstanding = busBilled - busCollected;
  const residentsWithBus = activeResidents.filter(r => r.busOption).length;
  const busSubscriptionRate = activeResidents.length > 0 
    ? Math.round((residentsWithBus / activeResidents.length) * 100) 
    : 0;
  const busCollectionRate = busBilled > 0 ? Math.round((busCollected / busBilled) * 100) : 0;

  // Floor stats
  const floorCounts = rooms.reduce((acc: { [key: number]: { occupied: number; total: number } }, r) => {
    if (!acc[r.floor]) acc[r.floor] = { occupied: 0, total: 0 };
    acc[r.floor].total += r.capacity;
    acc[r.floor].occupied += r.residentIds.length;
    return acc;
  }, {});

  // High priority / unresolved complaints
  const urgentComplaints = complaints
    .filter(c => c.status !== 'Resolved')
    .sort((a, b) => {
      const priorityOrder = { High: 3, Medium: 2, Low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    })
    .slice(0, 3);

  // Recent payment transactions
  const recentPayments = [...payments]
    .sort((a, b) => b.id.localeCompare(a.id))
    .slice(0, 3);

  // Expense Logging States
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>('Current Bill');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [expenseError, setExpenseError] = useState('');

  // Total spent per category
  const getCategorySpent = (categoryName: ExpenseCategory) => {
    return expenses
      .filter(e => e.category === categoryName)
      .reduce((acc, e) => acc + e.amount, 0);
  };

  const handleRecordExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseAmount || isNaN(Number(expenseAmount)) || Number(expenseAmount) <= 0) {
      setExpenseError('Please enter a valid expense amount greater than zero.');
      return;
    }
    if (!expenseDescription.trim()) {
      setExpenseError('Please enter a description for the expense.');
      return;
    }

    onAddExpense({
      category: expenseCategory,
      amount: Number(expenseAmount),
      date: expenseDate,
      description: expenseDescription.trim(),
      month: new Date(expenseDate).toLocaleString('default', { month: 'long', year: 'numeric' })
    });

    // Reset Form
    setExpenseAmount('');
    setExpenseDescription('');
    setExpenseDate(new Date().toISOString().split('T')[0]);
    setExpenseError('');
    setIsExpenseModalOpen(false);
  };

  return (
    <div className="space-y-8" id="dashboard-view">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-indigo-50 border border-indigo-100 rounded-2xl p-6 md:p-8">
        <div>
          <h1 className="text-3xl font-display font-semibold text-indigo-950">Hostel Overview</h1>
          <p className="text-indigo-800 mt-2 text-sm md:text-base">
            Welcome to the command center. Track your occupancy, manage resident requests, and oversee fee updates.
          </p>
        </div>
        <div className="flex gap-3 shrink-0">
          <button 
            id="quick-check-in-btn"
            onClick={() => triggerQuickAction('check-in')}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2.5 rounded-xl transition-all shadow-sm shadow-indigo-200 cursor-pointer text-sm"
          >
            <Plus className="w-4 h-4" />
            Check-In Resident
          </button>
          <button 
            id="quick-complaint-btn"
            onClick={() => triggerQuickAction('complaint')}
            className="flex items-center gap-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-medium px-4 py-2.5 rounded-xl transition-all cursor-pointer text-sm"
          >
            <Plus className="w-4 h-4" />
            Log Complaint
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          {
            id: "stat-occupancy",
            title: "Occupancy Rate",
            value: `${occupancyRate}%`,
            subtitle: `${occupiedBeds} of ${totalCapacity} beds filled`,
            icon: DoorOpen,
            color: "indigo",
            borderColor: "border-gray-200",
            iconBg: "bg-indigo-50 text-indigo-600",
            onClick: () => setView('rooms')
          },
          {
            id: "stat-residents",
            title: "Active Residents",
            value: activeResidents.length.toString(),
            subtitle: "Registered members",
            icon: Users,
            color: "blue",
            borderColor: "border-gray-200",
            iconBg: "bg-blue-50 text-blue-600",
            onClick: () => setView('residents')
          },
          {
            id: "stat-outstanding",
            title: "Outstanding Fees",
            value: formatCurrency(totalOutstanding),
            subtitle: "Unpaid resident dues",
            icon: DollarSign,
            color: "amber",
            borderColor: "border-gray-200",
            iconBg: "bg-amber-50 text-amber-600",
            onClick: () => setView('payments')
          },
          {
            id: "stat-complaints",
            title: "Pending Issues",
            value: pendingComplaints.length.toString(),
            subtitle: "Maintenance required",
            icon: AlertTriangle,
            color: "rose",
            borderColor: "border-gray-200",
            iconBg: "bg-rose-50 text-rose-600",
            onClick: () => setView('maintenance')
          }
        ].map((card, idx) => (
          <motion.div
            key={card.title}
            id={card.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            onClick={card.onClick}
            className={`bg-white border ${card.borderColor} hover:shadow-md rounded-2xl p-6 transition-all duration-300 cursor-pointer flex flex-col justify-between`}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-gray-400 text-3xs font-bold uppercase tracking-widest block">{card.title}</span>
                <p className="text-3xl font-display font-bold text-gray-950 mt-1">{card.value}</p>
              </div>
              <div className={`p-3 rounded-xl ${card.iconBg}`}>
                <card.icon className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
              <span>{card.subtitle}</span>
              <span className="text-indigo-600 hover:underline font-semibold inline-flex items-center gap-0.5">
                Manage
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Grid: Details & Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Occupancy details & Collections block */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Hostel Analytics Card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h3 className="font-display font-semibold text-gray-900 text-lg flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              Operational Health
            </h3>
            <p className="text-gray-500 text-xs mt-1">Status of different floors and revenue collection rate.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              {/* Collection Tracker */}
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-5 flex flex-col justify-between">
                <div>
                  <span className="text-gray-400 text-3xs font-bold uppercase tracking-widest block">Fee Collection Rate</span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-2xl font-bold text-gray-900">{collectionRate}%</span>
                    <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                      This Term
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 font-normal">
                    Collected {formatCurrency(paidPaymentsAmount)} out of total {formatCurrency(totalPaymentsAmount)} billed.
                  </p>
                </div>
                
                {/* Custom Styled Bar */}
                <div className="mt-4">
                  <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${collectionRate}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-3xs text-gray-400 font-mono mt-1.5 uppercase font-bold tracking-wider">
                    <span>Paid</span>
                    <span>Pending/Overdue</span>
                  </div>
                </div>
              </div>

              {/* Bus Fee Analytics Tracker */}
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-5 flex flex-col justify-between">
                <div>
                  <span className="text-gray-400 text-3xs font-bold uppercase tracking-widest block flex items-center gap-1">
                    <Bus className="w-3.5 h-3.5 text-indigo-600" />
                    Bus Fee Tracker
                  </span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-2xl font-bold text-indigo-950">{busCollectionRate}%</span>
                    <span className="text-3xs font-bold text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded-full">
                      {residentsWithBus} Users
                    </span>
                  </div>
                  <div className="space-y-1 mt-2 text-xs text-gray-600">
                    <div className="flex justify-between">
                      <span>Billed Volume:</span>
                      <span className="font-semibold text-gray-900">{formatCurrency(busBilled)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Collected Cash:</span>
                      <span className="font-semibold text-emerald-600">{formatCurrency(busCollected)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Outstanding:</span>
                      <span className="font-semibold text-rose-600">{formatCurrency(busOutstanding)}</span>
                    </div>
                  </div>
                </div>

                {/* Custom Styled Progress Bar for Bus */}
                <div className="mt-4">
                  <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${busCollectionRate}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-3xs text-gray-400 font-mono mt-1.5 uppercase font-bold tracking-wider">
                    <span>Collected</span>
                    <span>Pending ({busCollectionRate}%)</span>
                  </div>
                </div>
              </div>

              {/* Floor wise bed allocation */}
              <div className="space-y-4 bg-gray-50/30 border border-gray-100/50 rounded-xl p-5">
                <span className="text-gray-400 text-3xs font-bold uppercase tracking-widest block">Floor Occupancy</span>
                <div className="space-y-3">
                  {Object.entries(floorCounts).map(([floor, data]) => {
                    const rate = data.total > 0 ? Math.round((data.occupied / data.total) * 100) : 0;
                    return (
                      <div key={floor} className="space-y-1">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-gray-700">Floor {floor}</span>
                          <span className="text-gray-500">{data.occupied} / {data.total} beds ({rate}%)</span>
                        </div>
                        <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-indigo-500 h-full rounded-full"
                            style={{ width: `${rate}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Maintenance & Spent Analysis */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-2xs" id="spent-analysis-card">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-100">
              <div>
                <h3 className="font-display font-semibold text-gray-900 text-lg flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-indigo-600" />
                  Maintenance & Spent Analysis
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Categorized operational expenses, current bills, and utility tracking for this hostel.
                </p>
              </div>
              <button
                onClick={() => setIsExpenseModalOpen(true)}
                className="flex items-center justify-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-800 font-semibold text-xs px-3.5 py-2 rounded-xl transition-all cursor-pointer border border-indigo-100 shrink-0"
              >
                <Plus className="w-4 h-4" />
                Record Expense
              </button>
            </div>

            {/* Spent Categories Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
              {[
                {
                  name: 'Current Bill' as ExpenseCategory,
                  icon: Receipt,
                  color: 'text-amber-600',
                  bg: 'bg-amber-50/70',
                  border: 'border-amber-100',
                  barColor: 'bg-amber-500',
                  budget: 25000,
                  desc: 'Electricity, water, utilities'
                },
                {
                  name: 'Groceries' as ExpenseCategory,
                  icon: ShoppingCart,
                  color: 'text-emerald-600',
                  bg: 'bg-emerald-50/70',
                  border: 'border-emerald-100',
                  barColor: 'bg-emerald-500',
                  budget: 20000,
                  desc: 'Mess and kitchen provisions'
                },
                {
                  name: 'Mechanical & Electrical Bills' as ExpenseCategory,
                  icon: Wrench,
                  color: 'text-rose-600',
                  bg: 'bg-rose-50/70',
                  border: 'border-rose-100',
                  barColor: 'bg-rose-500',
                  budget: 15000,
                  desc: 'AC repairs, plumbing, generators'
                }
              ].map(category => {
                const totalSpent = getCategorySpent(category.name);
                const percent = Math.min(100, Math.round((totalSpent / category.budget) * 100));
                
                return (
                  <div key={category.name} className={`p-4 rounded-xl border ${category.border} ${category.bg} flex flex-col justify-between`}>
                    <div>
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-lg bg-white shadow-3xs ${category.color}`}>
                          <category.icon className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-gray-900 leading-tight">{category.name}</h4>
                          <p className="text-4xs text-gray-400 mt-0.5 leading-none">{category.desc}</p>
                        </div>
                      </div>

                      <div className="mt-4">
                        <span className="text-2xs text-gray-400 font-mono">SPENT</span>
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <span className="text-lg font-bold text-gray-900">{formatCurrency(totalSpent)}</span>
                          <span className="text-3xs text-gray-400">/ {formatCurrency(category.budget)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="flex justify-between text-3xs font-semibold text-gray-500 mb-1">
                        <span>Usage</span>
                        <span>{percent}%</span>
                      </div>
                      <div className="w-full bg-white/80 h-1.5 rounded-full overflow-hidden border border-gray-100/50">
                        <div 
                          className={`${category.barColor} h-full rounded-full transition-all duration-500`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Recent Expenses List */}
            <div className="mt-8 border-t border-gray-100 pt-6">
              <h4 className="font-display font-semibold text-gray-900 text-sm mb-4 flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-gray-500" />
                Logged Transactions for {hostelName}
              </h4>

              {expenses.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-gray-100 rounded-xl bg-gray-50/50">
                  <p className="text-gray-400 text-xs">No transactions logged for this hostel yet.</p>
                  <p className="text-4xs text-gray-400 mt-1">Use the Record Expense button to register some spent entries.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-gray-100 text-gray-400 font-semibold">
                        <th className="pb-3 font-normal">Details</th>
                        <th className="pb-3 font-normal hidden md:table-cell">Category</th>
                        <th className="pb-3 font-normal hidden sm:table-cell">Date</th>
                        <th className="pb-3 font-normal text-right">Spent Amount</th>
                        <th className="pb-3 font-normal text-right w-12"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {expenses.map(expense => (
                        <tr key={expense.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-3">
                            <span className="font-medium text-gray-900 block">{expense.description}</span>
                            <span className="text-4xs text-gray-400 block md:hidden mt-0.5">{expense.category} • {formatDate(expense.date)}</span>
                          </td>
                          <td className="py-3 hidden md:table-cell">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-4xs font-medium border ${
                              expense.category === 'Current Bill' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                              expense.category === 'Groceries' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                              'bg-rose-50 text-rose-700 border-rose-100'
                            }`}>
                              {expense.category}
                            </span>
                          </td>
                          <td className="py-3 text-gray-500 font-medium hidden sm:table-cell">
                            {formatDate(expense.date)}
                          </td>
                          <td className="py-3 text-right font-bold text-gray-900 font-mono">
                            {formatCurrency(expense.amount)}
                          </td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => onDeleteExpense(expense.id)}
                              className="text-gray-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer inline-flex items-center justify-center"
                              title="Delete transaction record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Recent Payments and Receipts */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-semibold text-gray-900 text-lg flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-indigo-600" />
                Recent Payments
              </h3>
              <button 
                onClick={() => setView('payments')}
                className="text-indigo-600 hover:text-indigo-700 font-bold text-xs hover:underline cursor-pointer"
              >
                View All
              </button>
            </div>
            
            <div className="mt-4 divide-y divide-gray-100">
              {recentPayments.length === 0 ? (
                <p className="text-gray-500 text-sm py-4 text-center">No payment history yet.</p>
              ) : (
                recentPayments.map(p => (
                  <div key={p.id} className="py-3.5 flex items-center justify-between first:pt-0 last:pb-0">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{p.residentName}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                        <span className="font-mono">Room {p.roomId}</span>
                        <span>•</span>
                        <span>{p.month}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">{formatCurrency(p.amount)}</p>
                      <span className={`inline-flex items-center gap-1 text-2xs font-semibold px-2.5 py-0.5 rounded-full mt-1 ${
                        p.status === 'Paid' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                          : p.status === 'Pending'
                          ? 'bg-amber-50 text-amber-700 border border-amber-100'
                          : 'bg-rose-50 text-rose-700 border border-rose-100'
                      }`}>
                        {p.status === 'Paid' && <CheckCircle className="w-3 h-3 text-emerald-600" />}
                        {p.status === 'Pending' && <Clock className="w-3 h-3 text-amber-600" />}
                        {p.status === 'Overdue' && <AlertTriangle className="w-3 h-3 text-rose-600" />}
                        {p.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right column: Action-oriented urgent complaints card */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col h-full">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-semibold text-gray-900 text-base flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Active Complaints
              </h3>
              <button 
                onClick={() => setView('maintenance')}
                className="text-indigo-600 hover:text-indigo-700 font-bold text-xs hover:underline cursor-pointer"
              >
                View Tickets
              </button>
            </div>
            <p className="text-gray-500 text-xs mt-1">Needs attention from facilities manager.</p>

            <div className="mt-4 space-y-3.5 flex-1">
              {urgentComplaints.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-gray-200 rounded-xl">
                  <CheckCircle className="w-8 h-8 text-emerald-400 mb-2" />
                  <p className="text-gray-900 font-semibold text-sm">All complaints resolved</p>
                  <p className="text-gray-400 text-2xs mt-1">Excellent! No outstanding room tickets.</p>
                </div>
              ) : (
                urgentComplaints.map(c => (
                  <div key={c.id} className="p-4 border border-gray-100 hover:border-gray-200 rounded-xl bg-gray-50/50 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <span className={`inline-flex items-center text-3xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        c.priority === 'High' 
                          ? 'bg-rose-100 text-rose-700' 
                          : c.priority === 'Medium'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {c.priority} Priority
                      </span>
                      <span className="text-2xs text-gray-400 font-mono">Room {c.roomId}</span>
                    </div>
                    
                    <p className="text-sm font-semibold text-gray-900 mt-2 leading-tight">{c.title}</p>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-normal">{c.description}</p>
                    
                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-2xs text-gray-400">
                      <span>By {c.residentName}</span>
                      <span className="capitalize text-indigo-600 font-semibold">{c.status}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          {/* Amenities & Quick Facts block */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xs">
            <h4 className="font-display font-medium text-sm text-indigo-400 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-indigo-400" />
              Quick Hostel Info
            </h4>
            
            <div className="mt-4 space-y-3 text-xs">
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Name</span>
                <span className="font-semibold text-slate-100">{hostelName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Total Rooms</span>
                <span className="font-semibold text-slate-100">{rooms.length} Units</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Supported Amenities</span>
                <span className="font-semibold text-right text-slate-100">AC, Refrigerator, Balcony, Wi-Fi</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-slate-400">Contact Desk</span>
                <span className="font-semibold text-slate-100">9100229820, 9652231162</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* RECORD EXPENSE MODAL */}
      <AnimatePresence>
        {isExpenseModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsExpenseModalOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.15 }}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-gray-100 z-10 text-left"
            >
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="font-display font-semibold text-gray-900 text-sm">Record Hostel Expense</h3>
                  <p className="text-4xs text-gray-400 mt-0.5 uppercase tracking-wider font-semibold font-mono">{hostelName}</p>
                </div>
                <button
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleRecordExpenseSubmit} className="p-6 space-y-4">
                {expenseError && (
                  <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs font-medium flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{expenseError}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-2xs font-bold text-gray-400 uppercase tracking-wider">Expense Category</label>
                  <select
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value as ExpenseCategory)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-medium focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
                  >
                    <option value="Current Bill">Current Bill (Electricity, water, utilities)</option>
                    <option value="Groceries">Groceries (Mess, provisions, kitchen)</option>
                    <option value="Mechanical & Electrical Bills">Mechanical & Electrical Bills (Repairs, AC, plumbing)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-2xs font-bold text-gray-400 uppercase tracking-wider">Amount Spent (INR)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold font-mono text-xs">₹</span>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="e.g. 5000"
                      value={expenseAmount}
                      onChange={(e) => setExpenseAmount(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl pl-8 pr-4 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-2xs font-bold text-gray-400 uppercase tracking-wider">Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="date"
                      required
                      value={expenseDate}
                      onChange={(e) => setExpenseDate(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl pl-11 pr-4 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-2xs font-bold text-gray-400 uppercase tracking-wider">Description</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AC service for room 204 or grocery order ref-99"
                    value={expenseDescription}
                    onChange={(e) => setExpenseDescription(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-medium focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsExpenseModalOpen(false)}
                    className="flex-1 bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-700 font-semibold text-xs py-3 rounded-xl transition-all cursor-pointer text-center"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-3 rounded-xl shadow-xs transition-all cursor-pointer text-center"
                  >
                    Save Entry
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
