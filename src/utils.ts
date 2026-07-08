import { Room, Resident, Payment, Complaint, Expense } from './types';
import { INITIAL_ROOMS, INITIAL_RESIDENTS, INITIAL_PAYMENTS, INITIAL_COMPLAINTS, INITIAL_EXPENSES } from './data';

export const loadState = () => {
  return {
    rooms: [],
    residents: [],
    payments: [],
    complaints: [],
    expenses: [],
  };
};

export const saveState = (state: {
  rooms: Room[];
  residents: Resident[];
  payments: Payment[];
  complaints: Complaint[];
  expenses: Expense[];
}) => {
  // Disabled - State is stored in Firebase Firestore
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
