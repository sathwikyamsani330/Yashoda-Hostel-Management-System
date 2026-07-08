import { Room, Resident, Payment, Complaint, Expense } from './types';
import { INITIAL_ROOMS, INITIAL_RESIDENTS, INITIAL_PAYMENTS, INITIAL_COMPLAINTS, INITIAL_EXPENSES } from './data';

export const loadState = () => {
  const rooms = localStorage.getItem('hostel_rooms');
  const residents = localStorage.getItem('hostel_residents');
  const payments = localStorage.getItem('hostel_payments');
  const complaints = localStorage.getItem('hostel_complaints');
  const expenses = localStorage.getItem('hostel_expenses');

  const parsedRooms: Room[] = rooms ? JSON.parse(rooms) : INITIAL_ROOMS;
  const parsedResidents: Resident[] = residents ? JSON.parse(residents) : INITIAL_RESIDENTS;
  const parsedPayments: Payment[] = payments ? JSON.parse(payments) : INITIAL_PAYMENTS;
  const parsedComplaints: Complaint[] = complaints ? JSON.parse(complaints) : INITIAL_COMPLAINTS;
  const parsedExpenses: Expense[] = expenses ? JSON.parse(expenses) : INITIAL_EXPENSES;

  return {
    rooms: parsedRooms.map(r => ({ ...r, hostelId: r.hostelId || '1' })),
    residents: parsedResidents.map(r => ({ ...r, hostelId: r.hostelId || '1' })),
    payments: parsedPayments.map(p => ({ ...p, hostelId: p.hostelId || '1' })),
    complaints: parsedComplaints.map(c => ({ ...c, hostelId: c.hostelId || '1' })),
    expenses: parsedExpenses.map(e => ({ ...e, hostelId: e.hostelId || '1' })),
  };
};

export const saveState = (state: {
  rooms: Room[];
  residents: Resident[];
  payments: Payment[];
  complaints: Complaint[];
  expenses: Expense[];
}) => {
  localStorage.setItem('hostel_rooms', JSON.stringify(state.rooms));
  localStorage.setItem('hostel_residents', JSON.stringify(state.residents));
  localStorage.setItem('hostel_payments', JSON.stringify(state.payments));
  localStorage.setItem('hostel_complaints', JSON.stringify(state.complaints));
  localStorage.setItem('hostel_expenses', JSON.stringify(state.expenses));
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

export const formatDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};
