import { Room, Resident, Payment, Complaint, Expense } from './types';

export const INITIAL_ROOMS: Room[] = [
  // Hostel 1 (Yashoda Deluxe Boys Hostel)
  {
    id: '101',
    hostelId: '1',
    type: 'Single',
    floor: 1,
    wing: 'Wing A',
    capacity: 1,
    rent: 450,
    amenities: ['AC', 'Wi-Fi', 'Attached Bath', 'Study Table'],
    residentIds: ['res-1']
  },
  {
    id: '102',
    hostelId: '1',
    type: 'Double',
    floor: 1,
    wing: 'Wing A',
    capacity: 2,
    rent: 300,
    amenities: ['Wi-Fi', 'Attached Bath', 'Study Table', 'Balcony'],
    residentIds: ['res-2']
  },
  {
    id: '103',
    hostelId: '1',
    type: 'Double',
    floor: 1,
    wing: 'Wing B',
    capacity: 2,
    rent: 300,
    amenities: ['Wi-Fi', 'Common Bath', 'Study Table'],
    residentIds: []
  },
  {
    id: '201',
    hostelId: '1',
    type: 'Single',
    floor: 2,
    wing: 'Wing A',
    capacity: 1,
    rent: 480,
    amenities: ['AC', 'Wi-Fi', 'Attached Bath', 'Study Table', 'Refrigerator'],
    residentIds: ['res-3']
  },
  {
    id: '202',
    hostelId: '1',
    type: 'Triple',
    floor: 2,
    wing: 'Wing B',
    capacity: 3,
    rent: 220,
    amenities: ['Wi-Fi', 'Common Bath', 'Study Table', 'Balcony'],
    residentIds: ['res-4', 'res-5']
  },
  {
    id: '203',
    hostelId: '1',
    type: 'Single',
    floor: 2,
    wing: 'Wing B',
    capacity: 1,
    rent: 450,
    amenities: ['AC', 'Wi-Fi', 'Attached Bath', 'Study Table'],
    residentIds: []
  },

  // Hostel 2 (Yashoda-2 Deluxe Boys Hostel)
  {
    id: '101',
    hostelId: '2',
    type: 'Single',
    floor: 1,
    wing: 'Wing A',
    capacity: 1,
    rent: 450,
    amenities: ['AC', 'Wi-Fi', 'Attached Bath', 'Study Table'],
    residentIds: ['res-10']
  },
  {
    id: '102',
    hostelId: '2',
    type: 'Double',
    floor: 1,
    wing: 'Wing A',
    capacity: 2,
    rent: 320,
    amenities: ['Wi-Fi', 'Attached Bath', 'Study Table', 'Balcony'],
    residentIds: ['res-11']
  },
  {
    id: '103',
    hostelId: '2',
    type: 'Triple',
    floor: 1,
    wing: 'Wing B',
    capacity: 3,
    rent: 240,
    amenities: ['Wi-Fi', 'Common Bath', 'Study Table'],
    residentIds: []
  },
  {
    id: '201',
    hostelId: '2',
    type: 'Single',
    floor: 2,
    wing: 'Wing A',
    capacity: 1,
    rent: 490,
    amenities: ['AC', 'Wi-Fi', 'Attached Bath', 'Study Table', 'Refrigerator'],
    residentIds: []
  }
];

export const INITIAL_RESIDENTS: Resident[] = [
  // Hostel 1 (Yashoda Deluxe Boys Hostel)
  {
    id: 'res-1',
    hostelId: '1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    roomId: '101',
    checkInDate: '2026-01-10',
    checkOutDate: null,
    status: 'Active',
    outstandingFees: 0,
    emergencyContact: {
      name: 'Richard Doe',
      relation: 'Father',
      phone: '+1 (555) 123-4560'
    },
    aadhaarNumber: '1111 2222 3333',
    busOption: true
  },
  {
    id: 'res-2',
    hostelId: '1',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    phone: '+1 (555) 234-5678',
    roomId: '102',
    checkInDate: '2026-02-15',
    checkOutDate: null,
    status: 'Active',
    outstandingFees: 300,
    emergencyContact: {
      name: 'Mary Smith',
      relation: 'Mother',
      phone: '+1 (555) 234-5670'
    },
    aadhaarNumber: '4444 5555 6666',
    busOption: true
  },
  {
    id: 'res-3',
    hostelId: '1',
    name: 'Robert Johnson',
    email: 'robert.j@example.com',
    phone: '+1 (555) 345-6789',
    roomId: '201',
    checkInDate: '2026-03-01',
    checkOutDate: null,
    status: 'Active',
    outstandingFees: 0,
    emergencyContact: {
      name: 'Sarah Johnson',
      relation: 'Sister',
      phone: '+1 (555) 345-6780'
    },
    aadhaarNumber: '7777 8888 9999',
    busOption: true
  },
  {
    id: 'res-4',
    hostelId: '1',
    name: 'Emily Davis',
    email: 'emily.d@example.com',
    phone: '+1 (555) 456-7890',
    roomId: '202',
    checkInDate: '2026-04-10',
    checkOutDate: null,
    status: 'Active',
    outstandingFees: 220,
    emergencyContact: {
      name: 'David Davis',
      relation: 'Father',
      phone: '+1 (555) 456-7891'
    },
    aadhaarNumber: '1212 3434 5656'
  },
  {
    id: 'res-5',
    hostelId: '1',
    name: 'Michael Brown',
    email: 'michael.b@example.com',
    phone: '+1 (555) 567-8901',
    roomId: '202',
    checkInDate: '2026-04-12',
    checkOutDate: null,
    status: 'Active',
    outstandingFees: 0,
    emergencyContact: {
      name: 'Patricia Brown',
      relation: 'Mother',
      phone: '+1 (555) 567-8902'
    },
    aadhaarNumber: '7878 9090 1212'
  },

  // Hostel 2 (Yashoda-2 Deluxe Boys Hostel)
  {
    id: 'res-10',
    hostelId: '2',
    name: 'Alex Mercer',
    email: 'alex.mercer@example.com',
    phone: '+1 (555) 789-0123',
    roomId: '101',
    checkInDate: '2026-05-01',
    checkOutDate: null,
    status: 'Active',
    outstandingFees: 0,
    emergencyContact: {
      name: 'Thomas Mercer',
      relation: 'Father',
      phone: '+1 (555) 789-0120'
    },
    aadhaarNumber: '3434 5656 7878'
  },
  {
    id: 'res-11',
    hostelId: '2',
    name: 'David Miller',
    email: 'david.miller@example.com',
    phone: '+1 (555) 890-1234',
    roomId: '102',
    checkInDate: '2026-05-10',
    checkOutDate: null,
    status: 'Active',
    outstandingFees: 320,
    emergencyContact: {
      name: 'Susan Miller',
      relation: 'Mother',
      phone: '+1 (555) 890-1230'
    },
    aadhaarNumber: '9090 1212 3434'
  }
];

export const INITIAL_PAYMENTS: Payment[] = [
  // Hostel 1 (Yashoda Deluxe Boys Hostel)
  {
    id: 'pay-1',
    hostelId: '1',
    residentId: 'res-1',
    residentName: 'John Doe',
    roomId: '101',
    amount: 450,
    month: 'June 2026',
    dueDate: '2026-06-05',
    status: 'Paid',
    paidDate: '2026-06-03',
    paymentMethod: 'UPI',
    busAmount: 100,
    busStatus: 'Paid',
    busPaymentMethod: 'UPI',
    busReceivedBy: 'Hostel Warden'
  },
  {
    id: 'pay-2',
    hostelId: '1',
    residentId: 'res-2',
    residentName: 'Jane Smith',
    roomId: '102',
    amount: 300,
    month: 'July 2026',
    dueDate: '2026-07-10',
    status: 'Pending',
    paidDate: null,
    paymentMethod: null,
    busAmount: 100,
    busStatus: 'Pending'
  },
  {
    id: 'pay-3',
    hostelId: '1',
    residentId: 'res-4',
    residentName: 'Emily Davis',
    roomId: '202',
    amount: 220,
    month: 'June 2026',
    dueDate: '2026-06-10',
    status: 'Overdue',
    paidDate: null,
    paymentMethod: null,
    busAmount: 0,
    busStatus: 'Not Subscribed'
  },
  {
    id: 'pay-4',
    hostelId: '1',
    residentId: 'res-3',
    residentName: 'Robert Johnson',
    roomId: '201',
    amount: 480,
    month: 'June 2026',
    dueDate: '2026-06-05',
    status: 'Paid',
    paidDate: '2026-06-04',
    paymentMethod: 'Bank Transfer',
    busAmount: 100,
    busStatus: 'Paid',
    busPaymentMethod: 'Bank Transfer',
    busReceivedBy: 'Hostel Warden'
  },
  {
    id: 'pay-5',
    hostelId: '1',
    residentId: 'res-5',
    residentName: 'Michael Brown',
    roomId: '202',
    amount: 220,
    month: 'June 2026',
    dueDate: '2026-06-05',
    status: 'Paid',
    paidDate: '2026-06-05',
    paymentMethod: 'Card',
    busAmount: 0,
    busStatus: 'Not Subscribed'
  },

  // Hostel 2 (Yashoda-2 Deluxe Boys Hostel)
  {
    id: 'pay-10',
    hostelId: '2',
    residentId: 'res-10',
    residentName: 'Alex Mercer',
    roomId: '101',
    amount: 450,
    month: 'June 2026',
    dueDate: '2026-06-05',
    status: 'Paid',
    paidDate: '2026-06-04',
    paymentMethod: 'UPI',
    busAmount: 100,
    busStatus: 'Paid',
    busPaymentMethod: 'UPI',
    busReceivedBy: 'Hostel Warden'
  },
  {
    id: 'pay-11',
    hostelId: '2',
    residentId: 'res-11',
    residentName: 'David Miller',
    roomId: '102',
    amount: 320,
    month: 'July 2026',
    dueDate: '2026-07-10',
    status: 'Pending',
    paidDate: null,
    paymentMethod: null,
    busAmount: 0,
    busStatus: 'Not Subscribed'
  }
];

export const INITIAL_COMPLAINTS: Complaint[] = [
  // Hostel 1 (Yashoda Deluxe Boys Hostel)
  {
    id: 'comp-1',
    hostelId: '1',
    residentId: 'res-2',
    residentName: 'Jane Smith',
    roomId: '102',
    category: 'Plumbing',
    priority: 'High',
    title: 'Bathroom pipe leak',
    description: 'The basin pipe in Room 102 is leaking heavily. There is a puddle forming on the bathroom floor.',
    status: 'Open',
    createdAt: '2026-07-04T10:30:00Z',
    resolvedAt: null
  },
  {
    id: 'comp-2',
    hostelId: '1',
    residentId: 'res-3',
    residentName: 'Robert Johnson',
    roomId: '201',
    category: 'Wi-Fi',
    priority: 'Medium',
    title: 'Weak Wi-Fi connection',
    description: 'The wireless signal drops frequently or gets extremely slow during peak evening hours (8 PM - 11 PM).',
    status: 'In Progress',
    createdAt: '2026-07-05T08:15:00Z',
    resolvedAt: null
  },
  {
    id: 'comp-3',
    hostelId: '1',
    residentId: 'res-5',
    residentName: 'Michael Brown',
    roomId: '202',
    category: 'Electrical',
    priority: 'High',
    title: 'Flickering lights',
    description: 'The primary ceiling tube light has started flickering continuously. Needs replacement.',
    status: 'Resolved',
    createdAt: '2026-06-25T14:20:00Z',
    resolvedAt: '2026-06-26T11:00:00Z'
  },

  // Hostel 2 (Yashoda-2 Deluxe Boys Hostel)
  {
    id: 'comp-10',
    hostelId: '2',
    residentId: 'res-11',
    residentName: 'David Miller',
    roomId: '102',
    category: 'Wi-Fi',
    priority: 'Medium',
    title: 'Wi-Fi keeps dropping out',
    description: 'Signal in room 102 is very unstable, disconnects every few minutes.',
    status: 'Open',
    createdAt: '2026-07-06T09:00:00Z',
    resolvedAt: null
  }
];

export const INITIAL_EXPENSES: Expense[] = [
  // Hostel 1 (Yashoda Deluxe Boys Hostel)
  {
    id: 'exp-1',
    hostelId: '1',
    category: 'Current Bill',
    amount: 18500,
    date: '2026-06-05',
    description: 'Electricity bill for June 2026',
    month: 'June 2026'
  },
  {
    id: 'exp-2',
    hostelId: '1',
    category: 'Groceries',
    amount: 12400,
    date: '2026-06-12',
    description: 'Weekly mess and vegetable supplies',
    month: 'June 2026'
  },
  {
    id: 'exp-3',
    hostelId: '1',
    category: 'Mechanical & Electrical Bills',
    amount: 4500,
    date: '2026-06-18',
    description: 'AC servicing and pump repairs',
    month: 'June 2026'
  },
  {
    id: 'exp-4',
    hostelId: '1',
    category: 'Current Bill',
    amount: 19200,
    date: '2026-07-01',
    description: 'Electricity bill for July 2026',
    month: 'July 2026'
  },
  {
    id: 'exp-5',
    hostelId: '1',
    category: 'Groceries',
    amount: 14200,
    date: '2026-07-04',
    description: 'Provisions and dairy supplies',
    month: 'July 2026'
  },
  {
    id: 'exp-6',
    hostelId: '1',
    category: 'Mechanical & Electrical Bills',
    amount: 3200,
    date: '2026-07-05',
    description: 'Plumbing fittings & pipe replacement',
    month: 'July 2026'
  },

  // Hostel 2 (Yashoda-2 Deluxe Boys Hostel)
  {
    id: 'exp-10',
    hostelId: '2',
    category: 'Current Bill',
    amount: 15400,
    date: '2026-06-05',
    description: 'Electricity bill for June 2026',
    month: 'June 2026'
  },
  {
    id: 'exp-11',
    hostelId: '2',
    category: 'Groceries',
    amount: 9800,
    date: '2026-06-15',
    description: 'Mess supplies and groceries',
    month: 'June 2026'
  },
  {
    id: 'exp-12',
    hostelId: '2',
    category: 'Mechanical & Electrical Bills',
    amount: 2800,
    date: '2026-06-20',
    description: 'Electrical wiring and fan replacements',
    month: 'June 2026'
  },
  {
    id: 'exp-13',
    hostelId: '2',
    category: 'Current Bill',
    amount: 16100,
    date: '2026-07-01',
    description: 'Electricity bill for July 2026',
    month: 'July 2026'
  },
  {
    id: 'exp-14',
    hostelId: '2',
    category: 'Groceries',
    amount: 11000,
    date: '2026-07-03',
    description: 'Monthly grocery refill for kitchen',
    month: 'July 2026'
  },
  {
    id: 'exp-15',
    hostelId: '2',
    category: 'Mechanical & Electrical Bills',
    amount: 1500,
    date: '2026-07-05',
    description: 'Water dispenser maintenance',
    month: 'July 2026'
  }
];
