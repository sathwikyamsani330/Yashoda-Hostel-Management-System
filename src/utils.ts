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

export const getBillingAmounts = (
  hostelId: '1' | '2',
  sharingType: '3 Sharing' | '4 Sharing' | 'Other' | undefined,
  paymentPlan: 'Monthly' | '6 Months' | undefined,
  busOption: boolean | undefined,
  roomRent: number = 0
) => {
  let rentAmount = roomRent;
  let busFeeAmount = 0;

  if (sharingType === '3 Sharing') {
    if (hostelId === '1') {
      rentAmount = paymentPlan === '6 Months' ? 45000 : 8000;
    } else { // Hostel 2
      rentAmount = paymentPlan === '6 Months' ? 45000 : 9000;
    }
  } else if (sharingType === '4 Sharing') {
    if (hostelId === '1') {
      rentAmount = paymentPlan === '6 Months' ? 40000 : 7500;
    } else { // Hostel 2
      rentAmount = paymentPlan === '6 Months' ? 40000 : 7500;
    }
  } else {
    // Other / standard room base rent
    rentAmount = paymentPlan === '6 Months' ? roomRent * 6 : roomRent;
  }

  if (busOption) {
    busFeeAmount = paymentPlan === '6 Months' ? 6000 : 1000;
  }

  return {
    rentAmount,
    busFeeAmount,
    totalAmount: rentAmount + busFeeAmount
  };
};

export const getResidentOutstandingFees = (residentId: string, payments: Payment[]): number => {
  return payments
    .filter(p => p.residentId === residentId)
    .reduce((total, p) => {
      const rentOutstanding = p.status !== 'Paid' ? (p.amount - (p.busAmount || 0)) : 0;
      const busOutstanding = p.busStatus === 'Pending' ? (p.busAmount || 0) : 0;
      return total + rentOutstanding + busOutstanding;
    }, 0);
};

