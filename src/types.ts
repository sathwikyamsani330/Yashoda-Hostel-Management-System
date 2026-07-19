export type RoomType = 'Single' | 'Double' | 'Triple' | 'Quadruple' | 'Quintuple';

export interface Room {
  id: string; // e.g., "101"
  hostelId?: '1' | '2';
  type: RoomType;
  floor: number;
  wing?: 'Wing A' | 'Wing B';
  capacity: number;
  rent: number;
  amenities: string[];
  residentIds: string[];
}

export interface EmergencyContact {
  name: string;
  relation: string;
  phone: string;
}

export interface Resident {
  id: string;
  hostelId?: '1' | '2';
  name: string;
  email: string;
  phone: string;
  roomId: string | null;
  checkInDate: string;
  checkOutDate: string | null;
  status: 'Active' | 'Checked-Out';
  outstandingFees: number;
  emergencyContact: EmergencyContact;
  aadhaarNumber?: string;
  sharingType?: '3 Sharing' | '4 Sharing' | 'Other';
  paymentPlan?: 'Monthly' | '6 Months';
  busOption?: boolean;
  busPackage?: 'Monthly' | '6 Months';
  monthlyFee?: number;
  packageStartDate?: string;
  packageEndDate?: string;
  paymentStatus?: PaymentStatus;
  allocatedSpot?: number;
  address?: string;
  deposit?: number;
  feeAmount?: number;
  idProof?: string;
  profilePhoto?: string;
  notes?: string;
}

export type PaymentStatus = 'Paid' | 'Pending' | 'Overdue' | 'Partial Payment';
export type PaymentMethod = 'Cash' | 'Card' | 'Bank Transfer' | 'UPI';

export interface Payment {
  id: string;
  hostelId?: '1' | '2';
  residentId: string;
  residentName: string;
  roomId: string;
  amount: number;
  month: string; // e.g., "July 2026"
  dueDate: string;
  status: PaymentStatus;
  paidDate: string | null;
  paymentMethod: PaymentMethod | null;
  receivedBy?: string;
  busAmount?: number;
  busStatus?: 'Paid' | 'Pending' | 'Not Subscribed';
  busPaymentMethod?: PaymentMethod | null;
  busReceivedBy?: string;
  amountPaid?: number;
  balance?: number;
  lastPaymentDate?: string;
  packageType?: 'Monthly' | '6 Months';
  checkInDate?: string;
  monthlyFee?: number;
}

export type ComplaintCategory = 'Plumbing' | 'Electrical' | 'Cleaning' | 'Wi-Fi' | 'Furniture' | 'Security' | 'Other';
export type ComplaintPriority = 'Low' | 'Medium' | 'High';
export type ComplaintStatus = 'Open' | 'In Progress' | 'Resolved';

export interface Complaint {
  id: string;
  hostelId?: '1' | '2';
  residentId: string;
  residentName: string;
  roomId: string;
  category: ComplaintCategory;
  priority: ComplaintPriority;
  title: string;
  description: string;
  status: ComplaintStatus;
  createdAt: string;
  resolvedAt: string | null;
}

export type ExpenseCategory = 'Current Bill' | 'Groceries' | 'Mechanical & Electrical Bills';

export interface Expense {
  id: string;
  hostelId: '1' | '2';
  category: ExpenseCategory;
  amount: number;
  date: string;
  description: string;
  month: string;
}
