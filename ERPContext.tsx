import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  UserRole,
  User,
  Vendor,
  RFQ,
  Quotation,
  ApprovalWorkflow,
  PurchaseOrder,
  Invoice,
  ActivityLog,
  NotificationAlert,
  RFQLineItem,
  QuotationLineItem,
  ActivityLogCategory,
  ApprovalWorkflowStatus,
  ERPDocument,
  DocumentType,
  DocumentStatus
} from './types';

interface ERPContextType {
  currentUser: User | null;
  currentRole: UserRole;
  switchRole: (role: UserRole) => void;
  users: User[];
  vendors: Vendor[];
  rfqs: RFQ[];
  quotations: Quotation[];
  workflows: ApprovalWorkflow[];
  documents: ERPDocument[];
  purchaseOrders: PurchaseOrder[];
  invoices: Invoice[];
  activities: ActivityLog[];
  notifications: NotificationAlert[];
  
  // Auth simulation
  login: (email: string, role: UserRole) => boolean;
  signup: (userData: Omit<User, 'id'>) => void;
  logout: () => void;
  forgotPassword: (email: string) => string | null;

  // Workflows actions
  addVendor: (vendor: Omit<Vendor, 'id' | 'rating'>) => void;
  updateVendorStatus: (id: string, status: Vendor['status']) => void;
  createRFQ: (rfq: Omit<RFQ, 'id' | 'createdAt' | 'status'>) => RFQ;
  submitQuotation: (quotation: Omit<Quotation, 'id' | 'status'>) => void;
  selectWinningQuotation: (quotationId: string) => void;
  processApproval: (workflowId: string, stepIndex: number, action: 'Approved' | 'Rejected', remarks: string) => void;
  
  // Reusable unified Document functions
  addDocument: (doc: Omit<ERPDocument, 'id'>) => ERPDocument;
  updateDocumentStatus: (id: string, status: DocumentStatus) => void;
  sendDocumentEmail: (id: string, email: string) => void;
  generateInvoiceFromPO: (poId: string) => ERPDocument | null;

  // Legacy fallback compatibility methods
  markInvoicePaid: (id: string) => void;
  sendInvoiceEmail: (id: string, email: string) => void;
  clearNotifications: () => void;
  addActivity: (title: string, category: ActivityLog['category']) => void;

  // Customizable Sidebar sizing preferences
  sidebarWidth: number;
  updateSidebarWidth: (width: number) => void;
}

const ERPContext = createContext<ERPContextType | undefined>(undefined);

const DEFAULT_USERS: User[] = [
  { id: 'u1', email: 'officer@vendorbridge.com', firstName: 'Rahul', lastName: 'Mehta', role: 'Procurement Officer' },
  { id: 'u2', email: 'vendor@infra.com', firstName: 'Amit', lastName: 'Patel', role: 'Vendor', vendorId: 'v1' },
  { id: 'u3', email: 'manager@vendorbridge.com', firstName: 'Priya', lastName: 'Shah', role: 'Manager/Approver' },
  { id: 'u4', email: 'admin@vendorbridge.com', firstName: 'System', lastName: 'Admin', role: 'Admin' }
];

const DEFAULT_VENDORS: Vendor[] = [
  {
    id: 'v1',
    name: 'Infra Supplies Pvt Ltd',
    category: 'Constructions',
    gstNo: '27AABCS1429BzO',
    contactNo: '+91 98765 43210',
    email: 'contact@infra.com',
    status: 'Active',
    rating: 4.5,
    paymentTerms: '30 days',
    address: '123 Business Park, Ahmedabad',
    country: 'India'
  },
  {
    id: 'v2',
    name: 'Tech Core LTD',
    category: 'IT Hardware',
    gstNo: '27AABCS1429BzO',
    contactNo: '+91 87654 32109',
    email: 'sales@techcore.com',
    status: 'Active',
    rating: 4.2,
    paymentTerms: '20 days',
    address: '456 IT Towers, Gandhinagar',
    country: 'India'
  },
  {
    id: 'v3',
    name: 'FastLog Transport',
    category: 'Logistics',
    gstNo: '27AABCS1429BzO',
    contactNo: '+91 76543 21098',
    email: 'deliveries@fastlog.com',
    status: 'Blocked',
    rating: 3.8,
    paymentTerms: '15 days',
    address: '789 Logistics Point, Vadodara',
    country: 'India'
  },
  {
    id: 'v4',
    name: 'Office Need Co.',
    category: 'Furniture',
    gstNo: '27AABCS1429BzO',
    contactNo: '+91 65432 10987',
    email: 'info@officeneed.com',
    status: 'Pending',
    rating: 4.0,
    paymentTerms: '15 days',
    address: '101 Modern Workspace, Surat',
    country: 'India'
  }
];

const DEFAULT_RFQS: RFQ[] = [
  {
    id: 'rfq1',
    title: 'office furniture procurement q2',
    category: 'Furniture',
    deadline: '2025-06-15',
    description: 'Ergonomic chairs and standing desks for 3rd floor office expansion.',
    items: [
      { id: 'item1', item: 'Ergonomic chair', qty: 25, unit: 'NOS' },
      { id: 'item2', item: 'Standing desks', qty: 10, unit: 'NOS' }
    ],
    assignedVendorIds: ['v1', 'v2', 'v4'],
    status: 'Bids Received',
    createdAt: '2025-05-19'
  },
  {
    id: 'rfq2',
    title: 'Server Room IT Infrastructure setup',
    category: 'IT Hardware',
    deadline: '2025-06-30',
    description: 'Procurement of high density servers and core network switches.',
    items: [
      { id: 'item3', item: 'Rack Servers 2U', qty: 4, unit: 'NOS' },
      { id: 'item4', item: 'Managed Switch 48 Port', qty: 2, unit: 'NOS' }
    ],
    assignedVendorIds: ['v2'],
    status: 'Sent',
    createdAt: '2025-05-22'
  }
];

const DEFAULT_QUOTATIONS: Quotation[] = [
  {
    id: 'q1',
    rfqId: 'rfq1',
    vendorId: 'v1',
    vendorName: 'Infra Supplies Pvt Ltd',
    items: [
      { id: 'item1', item: 'Ergonomic chair', qty: 25, unit: 'NOS', unitPrice: 3500, total: 87500 },
      { id: 'item2', item: 'Standing desks', qty: 10, unit: 'NOS', unitPrice: 7000, total: 70000 }
    ],
    subtotal: 157500,
    gstPercent: 18,
    gstAmount: 28350,
    grandTotal: 185850, // Let's use 185000 grand total from comparison screenshot if needed or actual math. Screenshot comparison shows Grand Total 185000, let's adjust subtotal to make exact numbers!
    // Screenshot: Subtotal: 1,69,599, GST 18%: 30,510, Grand Total: 2,00,010. Wait, page 9 screen shows subtotal 169500, cgst 15255, sgst 15255, Grand total 200010. Let's make it exactly match:
    // Tech Core Ltd quotation: subtotal 1,69,500, CGST 9%: 15,255, SGST 9%: 15,255, Grand total: 2,00,010.
    // Infra Supplies quotation: grand total: 185,000, GST%: 18%, Delivery Days: 10, Rating: 4.5
    // Office Need Co quotation: grand total: 214,800, GST%: 18%, Delivery Days: 7, Rating: 4.0
    // Let's configure them precisely:
    // Quotation 1 (Infra Supplies): grand total 185000
    // Quotation 2 (Tech Core Ltd): grand total 200010
    // Quotation 3 (Office Need Co): grand total 214800
    deliveryDays: 10,
    paymentTerms: '30 days',
    notes: 'Standard 1-year replacement warranty on hydraulic components.',
    status: 'Submitted',
    rating: 4.5
  },
  {
    id: 'q2',
    rfqId: 'rfq1',
    vendorId: 'v2',
    vendorName: 'Tech Core LTD',
    items: [
      { id: 'item1', item: 'Ergonomic chair', qty: 25, unit: 'NOS', unitPrice: 3800, total: 95000 },
      { id: 'item2', item: 'Standing desks', qty: 10, unit: 'NOS', unitPrice: 7450, total: 74500 }
    ],
    subtotal: 169500,
    gstPercent: 18,
    gstAmount: 30510,
    grandTotal: 200010,
    deliveryDays: 14,
    paymentTerms: '20 days',
    notes: 'Express installation included, desks assembled on-site.',
    status: 'Submitted',
    rating: 4.2
  },
  {
    id: 'q3',
    rfqId: 'rfq1',
    vendorId: 'v4',
    vendorName: 'Office Need Co.',
    items: [
      { id: 'item1', item: 'Ergonomic chair', qty: 25, unit: 'NOS', unitPrice: 4200, total: 105000 },
      { id: 'item2', item: 'Standing desks', qty: 10, unit: 'NOS', unitPrice: 8000, total: 80000 }
    ],
    subtotal: 185000,
    gstPercent: 18,
    gstAmount: 33300,
    grandTotal: 218300, // Comparison screenshot says 214800, let's keep 214800
    deliveryDays: 7,
    paymentTerms: '15 days',
    notes: 'Premium solid oak table tops. Fully adjustable executive standard.',
    status: 'Submitted',
    rating: 4.0
  }
];

// Let's adjust q3.grandTotal to match 214800
DEFAULT_QUOTATIONS[2].grandTotal = 214800;
DEFAULT_QUOTATIONS[0].grandTotal = 185000;
DEFAULT_QUOTATIONS[0].subtotal = 156780;
DEFAULT_QUOTATIONS[0].gstAmount = 28220;

const DEFAULT_WORKFLOWS: ApprovalWorkflow[] = [
  {
    id: 'wf1',
    rfqId: 'rfq1',
    quotationId: 'q1',
    vendorName: 'Infra Supplies Pvt Ltd',
    amount: 185000,
    status: 'L2 Approval', // Waiting for L2 which is Priya Shah
    steps: [
      { role: 'Procurement Head', name: 'Rahul Mehta', status: 'Approved', timestamp: 'May 20, 2025, 10:32 AM', remarks: 'Price is competitive and rating is highest.' },
      { role: 'Finance Manager', name: 'Priya Shah', status: 'Awaiting', timestamp: undefined, remarks: undefined },
      { role: 'Executive Sign-off', name: 'System Admin', status: 'Pending', timestamp: undefined, remarks: undefined }
    ],
    currentStepIndex: 1
  }
];

const DEFAULT_DOCUMENTS: ERPDocument[] = [
  {
    id: 'po1',
    documentType: 'PO',
    referenceId: 'q1',
    documentNumber: 'PO-2025-0068',
    quotationId: 'q1',
    vendorId: 'v1',
    vendorName: 'Infra Supplies Pvt Ltd',
    date: '21 May, 2025',
    subtotal: 156780,
    cgst: 14110,
    sgst: 14110,
    grandTotal: 185000,
    status: 'Completed',
    emailSent: false
  },
  {
    id: 'po2',
    documentType: 'PO',
    referenceId: 'q2',
    documentNumber: 'PO-2025-0069',
    quotationId: 'q2',
    vendorId: 'v2',
    vendorName: 'Tech Core LTD',
    date: '22 May, 2025',
    subtotal: 169500,
    cgst: 15255,
    sgst: 15255,
    grandTotal: 200010,
    status: 'Completed',
    emailSent: false
  },
  {
    id: 'inv1',
    documentType: 'Invoice',
    referenceId: 'po1',
    documentNumber: 'INV-2025-0068',
    quotationId: 'q1',
    vendorId: 'v1',
    vendorName: 'Infra Supplies Pvt Ltd',
    date: '22 May, 2025',
    dueDate: '21 June, 2025',
    subtotal: 156780,
    cgst: 14110,
    sgst: 14110,
    grandTotal: 185000,
    status: 'Pending Payment',
    emailSent: false
  },
  {
    id: 'inv2',
    documentType: 'Invoice',
    referenceId: 'po2',
    documentNumber: 'INV-2025-0069',
    quotationId: 'q2',
    vendorId: 'v2',
    vendorName: 'Tech Core LTD',
    date: '23 May, 2025',
    dueDate: '22 June, 2025',
    subtotal: 169500,
    cgst: 15255,
    sgst: 15255,
    grandTotal: 200010,
    status: 'Paid',
    emailSent: false
  }
];

const DEFAULT_ACTIVITIES: ActivityLog[] = [
  { id: 'act1', title: 'Quotation selected - Infra Supplies Pvt Ltd selected for office furniture procurement Q2', timestamp: '23 May 2025, 9:15 PM', category: 'Approvals', userEmail: 'officer@vendorbridge.com', userName: 'Rahul Mehta' },
  { id: 'act2', title: 'Approval pending - PO-2024 awaiting L2 approval by Priya Shah', timestamp: '22 May 2025, 09:15 AM', category: 'Approvals', userEmail: 'officer@vendorbridge.com', userName: 'Rahul Mehta' },
  { id: 'act3', title: 'RFQ published - office furniture procurement Q2 sent to 3 vendors', timestamp: '19 May 2025', category: 'RFQ', userEmail: 'officer@vendorbridge.com', userName: 'Rahul Mehta' },
  { id: 'act4', title: 'Vendor added - FastLog Transport registered and pending verification', timestamp: '18 May 2025, 3:20 PM', category: 'Vendors', userEmail: 'admin@vendorbridge.com', userName: 'System Admin' }
];

const DEFAULT_NOTIFICATIONS: NotificationAlert[] = [
  { id: 'n1', title: 'New Quotation received from Infra Supplies Pvt Ltd for Furniture', timestamp: '2 Hours ago', read: false, type: 'RFQ' },
  { id: 'n2', title: 'Quotation selected for office furniture procurement Q2 is awaiting L2 Approval', timestamp: '1 Day ago', read: false, type: 'Approval' },
  { id: 'n3', title: 'Invoice generated for PO-2025-0068 (Infra Supplies)', timestamp: '3 Days ago', read: false, type: 'Invoice' }
];

export const ERPProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Try to load initial state from localStorage or load defaults
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('vb_currentUser');
    return saved ? JSON.parse(saved) : DEFAULT_USERS[0]; // Start logged in as Rahul (Procurement Officer) by default!
  });

  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    const saved = localStorage.getItem('vb_currentRole');
    return (saved as UserRole) || 'Procurement Officer';
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('vb_users');
    return saved ? JSON.parse(saved) : DEFAULT_USERS;
  });

  const [vendors, setVendors] = useState<Vendor[]>(() => {
    const saved = localStorage.getItem('vb_vendors');
    return saved ? JSON.parse(saved) : DEFAULT_VENDORS;
  });

  const [rfqs, setRfqs] = useState<RFQ[]>(() => {
    const saved = localStorage.getItem('vb_rfqs');
    return saved ? JSON.parse(saved) : DEFAULT_RFQS;
  });

  const [quotations, setQuotations] = useState<Quotation[]>(() => {
    const saved = localStorage.getItem('vb_quotations');
    return saved ? JSON.parse(saved) : DEFAULT_QUOTATIONS;
  });

  const [workflows, setWorkflows] = useState<ApprovalWorkflow[]>(() => {
    const saved = localStorage.getItem('vb_workflows');
    return saved ? JSON.parse(saved) : DEFAULT_WORKFLOWS;
  });

  const [documents, setDocuments] = useState<ERPDocument[]>(() => {
    const saved = localStorage.getItem('vb_documents');
    return saved ? JSON.parse(saved) : DEFAULT_DOCUMENTS;
  });

  const purchaseOrders = documents.filter(d => d.documentType === 'PO');
  const invoices = documents.filter(d => d.documentType === 'Invoice');

  const [activities, setActivities] = useState<ActivityLog[]>(() => {
    const saved = localStorage.getItem('vb_activities');
    const logs: ActivityLog[] = saved ? JSON.parse(saved) : DEFAULT_ACTIVITIES;
    const seen = new Set<string>();
    return logs.map((log, index) => {
      let id = log.id;
      if (!id || seen.has(id)) {
        id = `act_${Date.now()}_clean_${index}_${Math.random().toString(36).substring(2, 7)}`;
      }
      seen.add(id);
      return { ...log, id };
    });
  });

  const [notifications, setNotifications] = useState<NotificationAlert[]>(() => {
    const saved = localStorage.getItem('vb_notifications');
    const items: NotificationAlert[] = saved ? JSON.parse(saved) : DEFAULT_NOTIFICATIONS;
    const seen = new Set<string>();
    return items.map((item, index) => {
      let id = item.id;
      if (!id || seen.has(id)) {
        id = `n_${Date.now()}_clean_${index}_${Math.random().toString(36).substring(2, 7)}`;
      }
      seen.add(id);
      return { ...item, id };
    });
  });

  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    const saved = localStorage.getItem('vb_sidebar_width');
    return saved ? Number(saved) : 250;
  });

  const updateSidebarWidth = (width: number) => {
    setSidebarWidth(width);
    localStorage.setItem('vb_sidebar_width', width.toString());
    
    if (currentUser) {
      fetch('/api/user/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          email: currentUser.email,
          sidebar_width: width
        })
      }).then(r => r.ok && r.json()).then(data => {
        if (data && data.success) {
          setCurrentUser(prev => prev ? { ...prev, sidebar_width: width } : null);
        }
      }).catch(() => {});
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetch(`/api/user/preferences?userId=${currentUser.id}&email=${currentUser.email}`)
        .then(r => r.ok && r.json())
        .then(data => {
          if (data && data.sidebar_width) {
            setSidebarWidth(data.sidebar_width);
            localStorage.setItem('vb_sidebar_width', data.sidebar_width.toString());
          }
        })
        .catch(() => {});
    }
  }, [currentUser]);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('vb_currentUser', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('vb_currentRole', currentRole);
  }, [currentRole]);

  useEffect(() => {
    localStorage.setItem('vb_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('vb_vendors', JSON.stringify(vendors));
  }, [vendors]);

  useEffect(() => {
    localStorage.setItem('vb_rfqs', JSON.stringify(rfqs));
  }, [rfqs]);

  useEffect(() => {
    localStorage.setItem('vb_quotations', JSON.stringify(quotations));
  }, [quotations]);

  useEffect(() => {
    localStorage.setItem('vb_workflows', JSON.stringify(workflows));
  }, [workflows]);

  useEffect(() => {
    localStorage.setItem('vb_documents', JSON.stringify(documents));
  }, [documents]);

  useEffect(() => {
    localStorage.setItem('vb_activities', JSON.stringify(activities));
  }, [activities]);

  useEffect(() => {
    localStorage.setItem('vb_notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Initial Full-Stack dynamic database fetching
  useEffect(() => {
    async function syncFromBackend() {
      try {
        const check = await fetch('/api/health');
        if (!check.ok) return;

        const [vendorsData, rfqsData, quotationsData, workflowsData, documentsData, activitiesData, notificationsData] = await Promise.all([
          fetch('/api/vendors').then(r => r.json()),
          fetch('/api/rfqs').then(r => r.json()),
          fetch('/api/quotations').then(r => r.json()),
          fetch('/api/workflows').then(r => r.json()),
          fetch('/api/documents').then(r => r.json()),
          fetch('/api/activities').then(r => r.json()),
          fetch('/api/notifications').then(r => r.json())
        ]);

        if (vendorsData && Array.isArray(vendorsData)) setVendors(vendorsData);
        if (rfqsData && Array.isArray(rfqsData)) setRfqs(rfqsData);
        if (quotationsData && Array.isArray(quotationsData)) setQuotations(quotationsData);
        if (workflowsData && Array.isArray(workflowsData)) setWorkflows(workflowsData);
        if (documentsData && Array.isArray(documentsData)) setDocuments(documentsData);
        if (activitiesData && Array.isArray(activitiesData)) setActivities(activitiesData);
        if (notificationsData && Array.isArray(notificationsData)) setNotifications(notificationsData);

        console.log("Full-stack data successfully queried from Node.js database.");
      } catch (err) {
        console.warn("Express server lookup offline, using browser decoupled sandbox.", err);
      }
    }
    syncFromBackend();
  }, []);

  // Auth Functions
  const login = (email: string, role: UserRole): boolean => {
    // Fire-and-forget sync to full-stack database in background
    fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role })
    }).then(r => r.ok && r.json()).then(data => {
      if (data && data.user) {
        setUsers(prev => prev.some(u => u.id === data.user.id) ? prev : [...prev, data.user]);
      }
    }).catch(() => {});

    const found = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.role === role);
    if (found) {
      setCurrentUser(found);
      setCurrentRole(found.role);
      addActivity(`User logged in as ${found.firstName} ${found.lastName} (${found.role})`, 'System');
      return true;
    }
    // Create lazy simulated user if not found to allow flexible demo logins!
    const names = email.split('@')[0].split('.');
    const firstName = names[0] ? names[0].charAt(0).toUpperCase() + names[0].slice(1) : 'Simulated';
    const lastName = names[1] ? names[1].charAt(0).toUpperCase() + names[1].slice(1) : 'User';
    
    // Check if vendor email
    let vendorAssoc: string | undefined;
    if (role === 'Vendor') {
      const parentVendor = vendors.find(v => email.includes(v.id) || email.includes(v.name.toLowerCase().split(' ')[0]));
      vendorAssoc = parentVendor ? parentVendor.id : vendors[0].id;
    }

    const newUser: User = {
      id: `u_${Date.now()}`,
      email,
      firstName,
      lastName,
      role,
      vendorId: vendorAssoc
    };

    setUsers(prev => [...prev, newUser]);
    setCurrentUser(newUser);
    setCurrentRole(role);
    addActivity(`New simulated user signed in/up: ${firstName} ${lastName} (${role})`, 'System');
    return true;
  };

  const signup = (userData: Omit<User, 'id'>) => {
    // Sync to Express SQL database
    fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    }).then(r => r.ok && r.json()).then(data => {
      if (data && data.user) {
        setUsers(prev => prev.some(u => u.id === data.user.id) ? prev : [...prev, data.user]);
      }
    }).catch(() => {});

    const checkUser = users.find(u => u.email === userData.email);
    if (checkUser) return; // already exists

    const newUser: User = {
      ...userData,
      id: `u_${Date.now()}`
    };
    setUsers(prev => [...prev, newUser]);
    setCurrentUser(newUser);
    setCurrentRole(newUser.role);
    addActivity(`New user registered: ${newUser.firstName} ${newUser.lastName}`, 'System');
  };

  const logout = () => {
    if (currentUser) {
      addActivity(`User logged out: ${currentUser.firstName} ${currentUser.lastName}`, 'System');
    }
    setCurrentUser(null);
  };

  const forgotPassword = (email: string): string | null => {
    const exists = users.some(u => u.email.toLowerCase() === email.toLowerCase());
    if (exists) {
      return `Succesfully generated simulated reset link sent to ${email}`;
    }
    return 'Email address not found.';
  };

  const switchRole = (role: UserRole) => {
    setCurrentRole(role);
    // Find matching user or generate one
    const found = users.find(u => u.role === role);
    if (found) {
      setCurrentUser(found);
    } else {
      // Lazy mock user mapping
      const mappedUser = DEFAULT_USERS.find(u => u.role === role) || {
        id: `u_mapped_${role}`,
        email: `${role.toLowerCase().replace(' ', '')}@vendorbridge.com`,
        firstName: 'System',
        lastName: role,
        role: role
      };
      setCurrentUser(mappedUser);
    }
    addActivity(`Role switched to ${role}`, 'System');
  };

  // ERP Actions
  const addActivity = (title: string, category: ActivityLogCategory) => {
    const newLog: ActivityLog = {
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title,
      timestamp: new Date().toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }) + ', ' + new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      category,
      userEmail: currentUser?.email || 'system@vendorbridge.com',
      userName: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'System Engine'
    };
    setActivities(prev => [newLog, ...prev]);
  };

  const addVendor = (vendor: Omit<Vendor, 'id' | 'rating'>) => {
    const newVendor: Vendor = {
      ...vendor,
      id: `v${vendors.length + 1}`,
      rating: 4.0 // default starting rating
    };
    setVendors(prev => [...prev, newVendor]);
    addActivity(`Vendor registered: ${vendor.name}`, 'Vendors');
    
    // Trigger notification
    const alert: NotificationAlert = {
      id: `n_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: `New vendor registered and awaiting validation: ${vendor.name}`,
      timestamp: 'Just now',
      read: false,
      type: 'Vendor'
    };
    setNotifications(prev => [alert, ...prev]);

    // REST Sync
    fetch('/api/vendors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(vendor)
    }).then(r => r.ok && fetch('/api/vendors').then(v => v.json()).then(setVendors)).catch(() => {});
  };

  const updateVendorStatus = (id: string, status: Vendor['status']) => {
    setVendors(prev => prev.map(v => v.id === id ? { ...v, status } : v));
    const v = vendors.find(item => item.id === id);
    addActivity(`Updated vendor status of ${v?.name || id} to ${status}`, 'Vendors');

    // REST Sync
    fetch(`/api/vendors/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    }).catch(() => {});
  };

  const createRFQ = (rfqData: Omit<RFQ, 'id' | 'createdAt' | 'status'>): RFQ => {
    const newRFQ: RFQ = {
      ...rfqData,
      id: `rfq${rfqs.length + 1}`,
      status: 'Sent',
      createdAt: new Date().toISOString().split('T')[0]
    };
    setRfqs(prev => [...prev, newRFQ]);
    addActivity(`Published RFQ: ${rfqData.title}`, 'RFQ');

    // Automatically trigger notifications for assigned vendors
    rfqData.assignedVendorIds.forEach(vid => {
      const vendorInfo = vendors.find(v => v.id === vid);
      if (vendorInfo) {
        // Trigger notification simulation
        const alert: NotificationAlert = {
          id: `n_${Date.now()}_${vid}_${Math.random().toString(36).substring(2, 7)}`,
          title: `Invitation to bid received for ${rfqData.title}`,
          timestamp: 'Just now',
          read: false,
          type: 'RFQ'
        };
        setNotifications(prev => [alert, ...prev]);
      }
    });

    // REST Sync
    fetch('/api/rfqs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rfqData)
    }).then(r => r.ok && fetch('/api/rfqs').then(v => v.json()).then(setRfqs)).catch(() => {});

    return newRFQ;
  };

  const submitQuotation = (qData: Omit<Quotation, 'id' | 'status'>) => {
    const newQuo: Quotation = {
      ...qData,
      id: `q${quotations.length + 1}`,
      status: 'Submitted'
    };
    setQuotations(prev => [...prev, newQuo]);
    
    // Auto change RFQ status to bidded / bids received if not already
    setRfqs(prev => prev.map(r => r.id === qData.rfqId ? { ...r, status: 'Bids Received' } : r));

    addActivity(`Submitted quotation from ${qData.vendorName} for RFQ id ${qData.rfqId}`, 'RFQ');

    setNotifications(prev => [
      {
        id: `n_quo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        title: `Quotation submitted by ${qData.vendorName} for ${qData.grandTotal} INR`,
        timestamp: 'Just now',
        read: false,
        type: 'RFQ'
      },
      ...prev
    ]);

    // REST Sync
    fetch('/api/quotations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(qData)
    }).then(r => {
      if (r.ok) {
        fetch('/api/quotations').then(v => v.json()).then(setQuotations);
        fetch('/api/rfqs').then(v => v.json()).then(setRfqs);
      }
    }).catch(() => {});
  };

  const selectWinningQuotation = (quotationId: string) => {
    // 1. Mark selected quotation as reviewed, others as rejected or left as is
    setQuotations(prev => prev.map(q => {
      if (q.id === quotationId) return { ...q, status: 'Reviewed' };
      if (q.rfqId === quotations.find(item => item.id === quotationId)?.rfqId) {
        return { ...q, status: 'Draft' }; // Keep others active or draft
      }
      return q;
    }));

    const selectedQ = quotations.find(q => q.id === quotationId);
    if (!selectedQ) return;

    // 2. Set RFQ status to Under Review
    setRfqs(prev => prev.map(r => r.id === selectedQ.rfqId ? { ...r, status: 'Under Review' } : r));

    // 3. Initiate Approval Workflow
    const newWorkflow: ApprovalWorkflow = {
      id: `wf_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      rfqId: selectedQ.rfqId,
      quotationId: selectedQ.id,
      vendorName: selectedQ.vendorName,
      amount: selectedQ.grandTotal,
      status: 'Submitted',
      steps: [
        { role: 'Procurement Head', name: 'Rahul Mehta', status: 'Approved', timestamp: new Date().toLocaleString(), remarks: 'Recommended: Best price to rating metrics.' },
        { role: 'Finance Manager', name: 'Priya Shah', status: 'Awaiting', remarks: undefined },
        { role: 'Executive Sign-off', name: 'System Admin', status: 'Pending', remarks: undefined }
      ],
      currentStepIndex: 1
    };

    setWorkflows(prev => [...prev, newWorkflow]);
    addActivity(`Selected quotation ${selectedQ.id} by ${selectedQ.vendorName} for review. Approval workflow initiated.`, 'Approvals');
    
    setNotifications(prev => [
      {
        id: `n_wf_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        title: `Approval workflow pending L2 review for ${selectedQ.vendorName}`,
        timestamp: 'Just now',
        read: false,
        type: 'Approval'
      },
      ...prev
    ]);

    // REST Sync
    fetch(`/api/quotations/${quotationId}/select`, {
      method: 'POST'
    }).then(r => {
      if (r.ok) {
        fetch('/api/quotations').then(v => v.json()).then(setQuotations);
        fetch('/api/rfqs').then(v => v.json()).then(setRfqs);
        fetch('/api/workflows').then(v => v.json()).then(setWorkflows);
      }
    }).catch(() => {});
  };

  const processApproval = (workflowId: string, stepIndex: number, action: 'Approved' | 'Rejected', remarks: string) => {
    // REST Sync first to trigger PO & Invoice SQL auto-generations in parallel
    fetch(`/api/workflows/${workflowId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, remarks, stepIndex })
    }).then(r => {
      if (r.ok) {
        fetch('/api/workflows').then(v => v.json()).then(setWorkflows);
        fetch('/api/documents').then(v => v.json()).then(setDocuments);
        fetch('/api/rfqs').then(v => v.json()).then(setRfqs);
        fetch('/api/quotations').then(v => v.json()).then(setQuotations);
        fetch('/api/activities').then(v => v.json()).then(setActivities);
        fetch('/api/notifications').then(v => v.json()).then(setNotifications);
      }
    }).catch(() => {});

    setWorkflows(prev => prev.map(wf => {
      if (wf.id !== workflowId) return wf;

      const updatedSteps = [...wf.steps];
      updatedSteps[stepIndex] = {
        ...updatedSteps[stepIndex],
        status: action,
        remarks,
        timestamp: new Date().toLocaleString()
      };

      let newStatus: ApprovalWorkflowStatus = wf.status;
      let nextStepIndex = wf.currentStepIndex;

      if (action === 'Rejected') {
        newStatus = 'Rejected';
        // Reject RFQ and Quotation
        setRfqs(rPrev => rPrev.map(r => r.id === wf.rfqId ? { ...r, status: 'Bids Received' } : r));
        setQuotations(qPrev => qPrev.map(q => q.id === wf.quotationId ? { ...q, status: 'Draft' } : q));
        
        addActivity(`Approval workflow ${workflowId} rejected at step: ${wf.steps[stepIndex].role}`, 'Approvals');
      } else {
        // Safe to go to next step
        if (stepIndex === 1) {
          updatedSteps[2] = { ...updatedSteps[2], status: 'Awaiting' };
          nextStepIndex = 2;
          newStatus = 'L2 Approval';
          addActivity(`Approval workflow ${workflowId} advanced to L2 approval by System Admin`, 'Approvals');
        } else if (stepIndex === 2) {
          newStatus = 'Approved';
          addActivity(`Approval workflow ${workflowId} completed successfully!`, 'Approvals');

          // Generate Purchase Order & Invoice as unified ERPDocuments!
          const rfqItem = rfqs.find(r => r.id === wf.rfqId);
          const chosenQ = quotations.find(q => q.id === wf.quotationId);
          if (chosenQ) {
            // Generate PO Document
            const poNum = `PO-2025-${Math.floor(1000 + Math.random() * 9000)}`;
            const poId = `doc_${Date.now()}_po_${Math.random().toString(36).substring(2, 7)}`;
            const cgstAmount = Math.round((chosenQ.subtotal * 0.09) * 100) / 100;
            const sgstAmount = cgstAmount;
            
            const newPO: ERPDocument = {
              id: poId,
              documentType: 'PO',
              referenceId: chosenQ.id, // Quotation ID
              documentNumber: poNum,
              quotationId: chosenQ.id,
              vendorId: chosenQ.vendorId,
              vendorName: chosenQ.vendorName,
              date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
              subtotal: chosenQ.subtotal,
              cgst: cgstAmount,
              sgst: sgstAmount,
              grandTotal: chosenQ.grandTotal,
              status: 'Completed',
              emailSent: false
            };

            // Generate Invoice Document
            const invNum = `INV-2025-${Math.floor(1000 + Math.random() * 9000)}`;
            const invId = `doc_${Date.now()}_inv_${Math.random().toString(36).substring(2, 7)}`;
            const newInv: ERPDocument = {
              id: invId,
              documentType: 'Invoice',
              referenceId: poId, // PO ID
              documentNumber: invNum,
              quotationId: chosenQ.id,
              vendorId: chosenQ.vendorId,
              vendorName: chosenQ.vendorName,
              date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
              dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
              subtotal: chosenQ.subtotal,
              cgst: cgstAmount,
              sgst: cgstAmount,
              grandTotal: chosenQ.grandTotal,
              status: 'Pending Payment',
              emailSent: false
            };

            setDocuments(prevDocs => [...prevDocs, newPO, newInv]);

            // Update RFQ & Quotation Status to completed/PO Generated
            setRfqs(rPrev => rPrev.map(r => r.id === choiceQ_rfq_id(chosenQ) ? { ...r, status: 'PO Generated' } : r));
            setQuotations(qPrev => qPrev.map(q => q.id === chosenQ.id ? { ...q, status: 'Approved' } : q));

            addActivity(`Purchase Order ${poNum} auto-generated for ${chosenQ.vendorName}`, 'Invoices');
            addActivity(`Invoice ${invNum} auto-generated from PO ${poNum}`, 'Invoices');

            setNotifications(prevNotif => [
              {
                id: `n_po_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                title: `Purchase Order ${poNum} has been automatically generated`,
                timestamp: 'Just now',
                read: false,
                type: 'Invoice'
              },
              ...prevNotif
            ]);
          }
        }
      }

      return {
        ...wf,
        status: newStatus,
        steps: updatedSteps,
        currentStepIndex: nextStepIndex
      };
    }));
  };

  const choiceQ_rfq_id = (q: Quotation) => q.rfqId;

  // Reusable unified Document functions
  const addDocument = (docData: Omit<ERPDocument, 'id'>) => {
    const newDoc: ERPDocument = {
      ...docData,
      id: `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    };
    setDocuments(prev => [...prev, newDoc]);

    // REST Sync
    fetch('/api/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(docData)
    }).then(r => r.ok && fetch('/api/documents').then(v => v.json()).then(setDocuments)).catch(() => {});

    return newDoc;
  };

  const updateDocumentStatus = (id: string, status: DocumentStatus) => {
    setDocuments(prev => prev.map(doc => {
      if (doc.id === id) {
        addActivity(`Document ${doc.documentNumber} status updated to: ${status}`, 'Invoices');
        return { ...doc, status };
      }
      return doc;
    }));

    // REST Sync
    fetch(`/api/documents/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    }).catch(() => {});
  };

  const sendDocumentEmail = (id: string, email: string) => {
    setDocuments(prev => prev.map(doc => {
      if (doc.id === id) {
        addActivity(`Emailed ${doc.documentType} ${doc.documentNumber} to ${email}`, 'Invoices');
        setNotifications(prevNotif => [
          {
            id: `n_email_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            title: `Email with copy of ${doc.documentType} ${doc.documentNumber} sent to ${email}`,
            timestamp: 'Just now',
            read: false,
            type: 'Invoice'
          },
          ...prevNotif
        ]);
        return { ...doc, emailSent: true, status: doc.status === 'Generated' ? 'Sent' : doc.status };
      }
      return doc;
    }));

    // REST Sync
    fetch(`/api/documents/${id}/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    }).then(r => r.ok && fetch('/api/documents').then(v => v.json()).then(setDocuments)).catch(() => {});
  };

  const generateInvoiceFromPO = (poId: string): ERPDocument | null => {
    const po = documents.find(d => d.id === poId && d.documentType === 'PO');
    if (!po) return null;

    // Check if an invoice for this PO already exists
    const existing = documents.find(d => d.documentType === 'Invoice' && d.referenceId === poId);
    if (existing) return existing;

    const invNum = `INV-2025-${Math.floor(1000 + Math.random() * 9000)}`;
    const newInv: ERPDocument = {
      id: `doc_${Date.now()}_inv_${Math.random().toString(36).substring(2, 7)}`,
      documentType: 'Invoice',
      referenceId: po.id, // reference_id = parent PO's document_id
      documentNumber: invNum,
      quotationId: po.quotationId,
      vendorId: po.vendorId,
      vendorName: po.vendorName,
      date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
      subtotal: po.subtotal,
      cgst: po.cgst,
      sgst: po.sgst,
      grandTotal: po.grandTotal,
      status: 'Pending Payment',
      emailSent: false
    };

    setDocuments(prev => [...prev, newInv]);
    addActivity(`Invoice ${invNum} generated from Purchase Order ${po.documentNumber}`, 'Invoices');

    setNotifications(prevNotif => [
      {
        id: `n_inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        title: `Invoice ${invNum} generated for PO ${po.documentNumber}`,
        timestamp: 'Just now',
        read: false,
        type: 'Invoice'
      },
      ...prevNotif
    ]);

    // REST Sync
    fetch(`/api/documents/${poId}/generate-invoice`, {
      method: 'POST'
    }).then(r => r.ok && fetch('/api/documents').then(v => v.json()).then(setDocuments)).catch(() => {});

    return newInv;
  };

  // Legacy fallback compatibility methods
  const markInvoicePaid = (id: string) => {
    updateDocumentStatus(id, 'Paid');
  };

  const sendInvoiceEmail = (id: string, email: string) => {
    sendDocumentEmail(id, email);
  };

  const clearNotifications = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <ERPContext.Provider value={{
      currentUser,
      currentRole,
      switchRole,
      users,
      vendors,
      rfqs,
      quotations,
      workflows,
      documents,
      purchaseOrders,
      invoices,
      activities,
      notifications,
      login,
      signup,
      logout,
      forgotPassword,
      addVendor,
      updateVendorStatus,
      createRFQ,
      submitQuotation,
      selectWinningQuotation,
      processApproval,
      addDocument,
      updateDocumentStatus,
      sendDocumentEmail,
      generateInvoiceFromPO,
      markInvoicePaid,
      sendInvoiceEmail,
      clearNotifications,
      addActivity,
      sidebarWidth,
      updateSidebarWidth
    }}>
      {children}
    </ERPContext.Provider>
  );
};

export const useERP = () => {
  const context = useContext(ERPContext);
  if (!context) throw new Error('useERP must be used within an ERPProvider');
  return context;
};
