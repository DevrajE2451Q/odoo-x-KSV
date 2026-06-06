import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";

// ----------------------------------------------------------------------------
// DB PERSISTENCE DEFAULTS & LOGICAL BACKEND DATA STRUCTURES
// ----------------------------------------------------------------------------
const DB_FILE = path.join(process.cwd(), "db.json");

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  phone?: string;
  country?: string;
  vendorId?: string;
  sidebar_width?: number;
}

interface Vendor {
  id: string;
  name: string;
  category: string;
  gstNo: string;
  contactNo: string;
  email: string;
  status: string;
  rating: number;
  paymentTerms?: string;
  address?: string;
  country?: string;
}

interface RFQLineItem {
  id: string;
  item: string;
  qty: number;
  unit: string;
}

interface RFQ {
  id: string;
  title: string;
  category: string;
  deadline: string;
  description: string;
  items: RFQLineItem[];
  assignedVendorIds: string[];
  status: string;
  createdAt: string;
}

interface QuotationLineItem extends RFQLineItem {
  unitPrice: number;
  total: number;
}

interface Quotation {
  id: string;
  rfqId: string;
  vendorId: string;
  vendorName: string;
  items: QuotationLineItem[];
  subtotal: number;
  gstPercent: number;
  gstAmount: number;
  grandTotal: number;
  deliveryDays: number;
  paymentTerms: string;
  notes: string;
  status: string;
  rating: number;
}

interface ApprovalChainStep {
  role: string;
  name: string;
  status: string;
  timestamp?: string;
  remarks?: string;
}

interface ApprovalWorkflow {
  id: string;
  rfqId: string;
  quotationId: string;
  vendorName: string;
  amount: number;
  status: string;
  steps: ApprovalChainStep[];
  currentStepIndex: number;
  remarks?: string;
}

interface ERPDocument {
  id: string;
  documentType: string; // 'PO' | 'Invoice'
  referenceId: string;   // quotationId for PO, PO documentId for Invoice
  documentNumber: string;
  quotationId: string;
  vendorId: string;
  vendorName: string;
  date: string;
  dueDate?: string;
  subtotal: number;
  cgst: number;
  sgst: number;
  grandTotal: number;
  status: string;
  pdfLink?: string;
  emailSent?: boolean;
}

interface ActivityLog {
  id: string;
  title: string;
  timestamp: string;
  category: string;
  userEmail: string;
  userName: string;
}

interface NotificationAlert {
  id: string;
  title: string;
  timestamp: string;
  read: boolean;
  type: string;
}

// Global state holding data
let db = {
  users: [
    { id: 'u1', email: 'officer@vendorbridge.com', firstName: 'Rahul', lastName: 'Mehta', role: 'Procurement Officer' },
    { id: 'u2', email: 'vendor@infra.com', firstName: 'Amit', lastName: 'Patel', role: 'Vendor', vendorId: 'v1' },
    { id: 'u3', email: 'manager@vendorbridge.com', firstName: 'Priya', lastName: 'Shah', role: 'Manager/Approver' },
    { id: 'u4', email: 'admin@vendorbridge.com', firstName: 'System', lastName: 'Admin', role: 'Admin' }
  ] as User[],
  vendors: [
    {
      id: 'v1',
      name: 'Infra Supplies Pvt Ltd',
      category: 'Furniture',
      gstNo: '24AAAAB1234C1Z0',
      contactNo: '+91 261 2234091',
      email: 'sales@infrasupplies.com',
      status: 'Active',
      rating: 4.8,
      paymentTerms: '30 days',
      address: '456 Industrial Estate, Surat, Gujarat',
      country: 'India'
    },
    {
      id: 'v2',
      name: 'Tech Core LTD',
      category: 'IT Hardware',
      gstNo: '27AABCT9876F2Z5',
      contactNo: '+91 22 45676899',
      email: 'bids@techcore.com',
      status: 'Active',
      rating: 4.5,
      paymentTerms: '20 days',
      address: 'B-102 Trade Center, Bandra Kurla, Mumbai',
      country: 'India'
    },
    {
      id: 'v3',
      name: 'FastLog Transport',
      category: 'Logistics',
      gstNo: '19AAECG2345A3Z1',
      contactNo: '+91 33 22890987',
      email: 'dispatch@fastlog.in',
      status: 'Blocked',
      rating: 4.2,
      paymentTerms: '15 days',
      address: '78 Sector V, Salt Lake City, Kolkata',
      country: 'India'
    },
    {
      id: 'v4',
      name: 'Office Need Co.',
      category: 'Furniture',
      gstNo: '29AAECS5582F2Z1',
      contactNo: '+91 80 41103020',
      email: 'info@officeneed.com',
      status: 'Pending',
      rating: 4.0,
      paymentTerms: '15 days',
      address: '101 Modern Workspace, Surat, Gujarat',
      country: 'India'
    }
  ] as Vendor[],
  rfqs: [
    {
      id: 'rfq1',
      title: 'Office Furniture Procurement Q2',
      category: 'Furniture',
      deadline: '2026-06-30',
      description: 'Ergonomic chairs and standing desks for 3rd floor office expansion.',
      items: [
        { id: 'item1', item: 'Ergonomic chair', qty: 25, unit: 'NOS' },
        { id: 'item2', item: 'Standing desks', qty: 10, unit: 'NOS' }
      ],
      assignedVendorIds: ['v1', 'v2', 'v4'],
      status: 'Bids Received',
      createdAt: '2026-06-05'
    },
    {
      id: 'rfq2',
      title: 'Server Room IT Infrastructure setup',
      category: 'IT Hardware',
      deadline: '2026-06-25',
      description: 'Procurement of premium dynamic workstation setups & switches.',
      items: [
        { id: 'item3', item: 'Rack Servers 2U', qty: 4, unit: 'NOS' },
        { id: 'item4', item: 'Managed Switch 48 Port', qty: 2, unit: 'NOS' }
      ],
      assignedVendorIds: ['v2'],
      status: 'Sent',
      createdAt: '2026-06-06'
    }
  ] as RFQ[],
  quotations: [
    {
      id: 'q1',
      rfqId: 'rfq1',
      vendorId: 'v1',
      vendorName: 'Infra Supplies Pvt Ltd',
      items: [
        { id: 'item1', item: 'Ergonomic chair', qty: 25, unit: 'NOS', unitPrice: 3500, total: 87500 },
        { id: 'item2', item: 'Standing desks', qty: 10, unit: 'NOS', unitPrice: 7000, total: 70000 }
      ],
      subtotal: 156780,
      gstPercent: 18,
      gstAmount: 28220,
      grandTotal: 185000,
      deliveryDays: 10,
      paymentTerms: '30 days',
      notes: 'Premium ergonomic mesh chair range with custom multi-tilt control. Includes a 3-year hydraulic cylinder warranty.',
      status: 'Submitted',
      rating: 4.8
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
      notes: 'Commercial range desks and high-back chairs. Immediate warehousing dispatch availability.',
      status: 'Submitted',
      rating: 4.5
    },
    {
      id: 'q3',
      rfqId: 'rfq1',
      vendorId: 'v4',
      vendorName: 'Office Need Co.',
      items: [
        { id: 'item1', item: 'Ergonomic chair', qty: 25, unit: 'NOS', unitPrice: 4200, total: 105000 },
        { id: 'item2', item: 'Standing desks', qty: 10, unit: 'NOS', unitPrice: 7480, total: 74800 }
      ],
      subtotal: 179800,
      gstPercent: 18,
      gstAmount: 35000,
      grandTotal: 214800,
      deliveryDays: 7,
      paymentTerms: '15 days',
      notes: 'Premium solid wood tabletop selections with integrated electric lift frames.',
      status: 'Submitted',
      rating: 4.0
    }
  ] as Quotation[],
  workflows: [
    {
      id: 'wf1',
      rfqId: 'rfq1',
      quotationId: 'q1',
      vendorName: 'Infra Supplies Pvt Ltd',
      amount: 185000,
      status: 'L2 Approval',
      steps: [
        { role: 'Procurement Head', name: 'Rahul Mehta', status: 'Approved', timestamp: '05 Jun 2026, 10:32 AM', remarks: 'Recommended: Best price to rating metrics.' },
        { role: 'Finance Manager', name: 'Priya Shah', status: 'Awaiting', timestamp: undefined, remarks: undefined },
        { role: 'Executive Sign-off', name: 'System Admin', status: 'Pending', timestamp: undefined, remarks: undefined }
      ],
      currentStepIndex: 1
    }
  ] as ApprovalWorkflow[],
  documents: [
    {
      id: 'po1',
      documentType: 'PO',
      referenceId: 'q1',
      documentNumber: 'PO-2026-0068',
      quotationId: 'q1',
      vendorId: 'v1',
      vendorName: 'Infra Supplies Pvt Ltd',
      date: '21 May, 2026',
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
      documentNumber: 'PO-2026-0069',
      quotationId: 'q2',
      vendorId: 'v2',
      vendorName: 'Tech Core LTD',
      date: '22 May, 2026',
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
      documentNumber: 'INV-2026-0068',
      quotationId: 'q1',
      vendorId: 'v1',
      vendorName: 'Infra Supplies Pvt Ltd',
      date: '22 May, 2026',
      dueDate: '21 June, 2026',
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
      documentNumber: 'INV-2026-0069',
      quotationId: 'q2',
      vendorId: 'v2',
      vendorName: 'Tech Core LTD',
      date: '23 May, 2026',
      dueDate: '22 June, 2026',
      subtotal: 169500,
      cgst: 15255,
      sgst: 15255,
      grandTotal: 200010,
      status: 'Paid',
      emailSent: false
    }
  ] as ERPDocument[],
  activities: [
    { id: 'act1', title: 'Quotation selected - Infra Supplies Pvt Ltd selected for office furniture procurement Q2', timestamp: '05 Jun 2026, 09:15 PM', category: 'Approvals', userEmail: 'officer@vendorbridge.com', userName: 'Rahul Mehta' },
    { id: 'act2', title: 'Approval pending - PO-2026 awaiting L2 approval by Priya Shah', timestamp: '05 Jun 2026, 09:15 AM', category: 'Approvals', userEmail: 'officer@vendorbridge.com', userName: 'Rahul Mehta' },
    { id: 'act3', title: 'RFQ published - Office Furniture Procurement Q2 sent to 3 vendors', timestamp: '04 Jun 2026, 11:00 AM', category: 'RFQ', userEmail: 'officer@vendorbridge.com', userName: 'Rahul Mehta' },
    { id: 'act4', title: 'Vendor added - FastLog Transport registered and pending verification', timestamp: '03 Jun 2026, 03:20 PM', category: 'Vendors', userEmail: 'admin@vendorbridge.com', userName: 'System Admin' }
  ] as ActivityLog[],
  notifications: [
    { id: 'n1', title: 'New Quotation received from Infra Supplies Pvt Ltd for Furniture', timestamp: '2 Hours ago', read: false, type: 'RFQ' },
    { id: 'n2', title: 'Quotation selected for office furniture procurement Q2 is awaiting L2 Approval', timestamp: '1 Day ago', read: false, type: 'Approval' },
    { id: 'n3', title: 'Invoice generated for PO-2026-0068 (Infra Supplies)', timestamp: '3 Days ago', read: false, type: 'Invoice' }
  ] as NotificationAlert[]
};

const sqliteDbFile = path.join(process.cwd(), "vendorbridge.sqlite");
const sqlDb = new Database(sqliteDbFile);

// Create tables in SQLite if they do not exist
function initSqlDb() {
  sqlDb.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      first_name TEXT,
      last_name TEXT,
      role TEXT,
      phone TEXT,
      country TEXT,
      vendor_id TEXT,
      sidebar_width INTEGER DEFAULT 250
    );

    CREATE TABLE IF NOT EXISTS vendors (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      gst_no TEXT UNIQUE NOT NULL,
      contact_no TEXT,
      email TEXT NOT NULL,
      status TEXT DEFAULT 'Active',
      rating REAL DEFAULT 5.0,
      payment_terms TEXT DEFAULT '30 days',
      address TEXT,
      country TEXT
    );

    CREATE TABLE IF NOT EXISTS rfqs (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      deadline TEXT NOT NULL,
      description TEXT,
      items_json TEXT,
      assigned_vendor_ids_json TEXT,
      status TEXT DEFAULT 'Sent',
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS quotations (
      id TEXT PRIMARY KEY,
      rfq_id TEXT NOT NULL,
      vendor_id TEXT NOT NULL,
      vendor_name TEXT NOT NULL,
      items_json TEXT,
      subtotal REAL,
      gst_percent REAL,
      gst_amount REAL,
      grand_total REAL,
      delivery_days INTEGER,
      payment_terms TEXT,
      notes TEXT,
      status TEXT DEFAULT 'Submitted',
      rating REAL
    );

    CREATE TABLE IF NOT EXISTS workflows (
      id TEXT PRIMARY KEY,
      rfq_id TEXT NOT NULL,
      quotation_id TEXT NOT NULL,
      vendor_name TEXT NOT NULL,
      amount REAL,
      status TEXT,
      steps_json TEXT,
      current_step_index INTEGER,
      remarks TEXT
    );

    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      document_type TEXT NOT NULL,
      reference_id TEXT NOT NULL,
      document_number TEXT UNIQUE NOT NULL,
      quotation_id TEXT NOT NULL,
      vendor_id TEXT NOT NULL,
      vendor_name TEXT NOT NULL,
      date TEXT,
      due_date TEXT,
      subtotal REAL,
      cgst REAL,
      sgst REAL,
      grand_total REAL,
      status TEXT DEFAULT 'Generated',
      pdf_link TEXT,
      email_sent INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS activities (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      category TEXT NOT NULL,
      user_email TEXT,
      user_name TEXT
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      read INTEGER DEFAULT 0,
      type TEXT NOT NULL
    );
  `);

  // Count users to verify if seed is needed
  const userCount = sqlDb.prepare("SELECT count(*) as count FROM users").get() as any;
  if (!userCount || userCount.count === 0) {
    console.log("Empty SQLite database detected. Loading from JSON defaults or initial template data...");
    
    let initialData = db;
    if (fs.existsSync(DB_FILE)) {
      try {
        initialData = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
      } catch (e) {
        console.error("Could not read db.json seed", e);
      }
    }

    try {
      sqlDb.transaction(() => {
        // Users
        const insertUser = sqlDb.prepare(`
          INSERT INTO users (id, email, first_name, last_name, role, phone, country, vendor_id, sidebar_width)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const u of initialData.users || []) {
          insertUser.run(u.id, u.email, u.firstName, u.lastName, u.role, u.phone || null, u.country || null, u.vendorId || null, u.sidebar_width || 250);
        }

        // Vendors
        const insertVendor = sqlDb.prepare(`
          INSERT INTO vendors (id, name, category, gst_no, contact_no, email, status, rating, payment_terms, address, country)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const v of initialData.vendors || []) {
          insertVendor.run(v.id, v.name, v.category, v.gstNo, v.contactNo, v.email, v.status, v.rating, v.paymentTerms || null, v.address || null, v.country || null);
        }

        // RFQs
        const insertRfq = sqlDb.prepare(`
          INSERT INTO rfqs (id, title, category, deadline, description, items_json, assigned_vendor_ids_json, status, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const r of initialData.rfqs || []) {
          insertRfq.run(r.id, r.title, r.category, r.deadline, r.description, JSON.stringify(r.items), JSON.stringify(r.assignedVendorIds), r.status, r.createdAt);
        }

        // Quotations
        const insertQuotation = sqlDb.prepare(`
          INSERT INTO quotations (id, rfq_id, vendor_id, vendor_name, items_json, subtotal, gst_percent, gst_amount, grand_total, delivery_days, payment_terms, notes, status, rating)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const q of initialData.quotations || []) {
          insertQuotation.run(q.id, q.rfqId, q.vendorId, q.vendorName, JSON.stringify(q.items), q.subtotal, q.gstPercent, q.gstAmount, q.grandTotal, q.deliveryDays, q.paymentTerms, q.notes, q.status, q.rating);
        }

        // Workflows
        const insertWorkflow = sqlDb.prepare(`
          INSERT INTO workflows (id, rfq_id, quotation_id, vendor_name, amount, status, steps_json, current_step_index, remarks)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const w of initialData.workflows || []) {
          insertWorkflow.run(w.id, w.rfqId, w.quotationId, w.vendorName, w.amount, w.status, JSON.stringify(w.steps), w.currentStepIndex, w.remarks || null);
        }

        // Documents
        const insertDocument = sqlDb.prepare(`
          INSERT INTO documents (id, document_type, reference_id, document_number, quotation_id, vendor_id, vendor_name, date, due_date, subtotal, cgst, sgst, grand_total, status, pdf_link, email_sent)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const d of initialData.documents || []) {
          insertDocument.run(d.id, d.documentType, d.referenceId, d.documentNumber, d.quotationId, d.vendorId, d.vendorName, d.date, d.dueDate || null, d.subtotal, d.cgst, d.sgst, d.grandTotal, d.status, d.pdfLink || null, d.emailSent ? 1 : 0);
        }

        // Activities
        const insertActivity = sqlDb.prepare(`
          INSERT INTO activities (id, title, timestamp, category, user_email, user_name)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        for (const a of initialData.activities || []) {
          insertActivity.run(a.id, a.title, a.timestamp, a.category, a.userEmail, a.userName);
        }

        // Notifications
        const insertNotification = sqlDb.prepare(`
          INSERT INTO notifications (id, title, timestamp, read, type)
          VALUES (?, ?, ?, ?, ?)
        `);
        for (const n of initialData.notifications || []) {
          insertNotification.run(n.id, n.title, n.timestamp, n.read ? 1 : 0, n.type);
        }
      })();
      console.log("SQLite table seeding executed in a transactional block successfully.");
    } catch (e) {
      console.error("Failed table seeding transaction", e);
    }
  }
}

function getAllUsers(): User[] {
  const rows = sqlDb.prepare("SELECT * FROM users").all() as any[];
  return rows.map(r => ({
    id: r.id,
    email: r.email,
    firstName: r.first_name,
    lastName: r.last_name,
    role: r.role,
    phone: r.phone || undefined,
    country: r.country || undefined,
    vendorId: r.vendor_id || undefined,
    sidebar_width: r.sidebar_width ?? 250
  }));
}

function getAllVendors(): Vendor[] {
  const rows = sqlDb.prepare("SELECT * FROM vendors").all() as any[];
  return rows.map(r => ({
    id: r.id,
    name: r.name,
    category: r.category,
    gstNo: r.gst_no,
    contactNo: r.contact_no || "",
    email: r.email,
    status: r.status || "Active",
    rating: Number(r.rating) || 5.0,
    paymentTerms: r.payment_terms || "30 days",
    address: r.address || "",
    country: r.country || ""
  }));
}

function getAllRfqs(): RFQ[] {
  const rows = sqlDb.prepare("SELECT * FROM rfqs ORDER BY created_at DESC").all() as any[];
  return rows.map(r => ({
    id: r.id,
    title: r.title,
    category: r.category,
    deadline: r.deadline,
    description: r.description || "",
    items: JSON.parse(r.items_json || "[]"),
    assignedVendorIds: JSON.parse(r.assigned_vendor_ids_json || "[]"),
    status: r.status,
    createdAt: r.created_at
  }));
}

function getAllQuotations(): Quotation[] {
  const rows = sqlDb.prepare("SELECT * FROM quotations").all() as any[];
  return rows.map(r => ({
    id: r.id,
    rfqId: r.rfq_id,
    vendorId: r.vendor_id,
    vendorName: r.vendor_name,
    items: JSON.parse(r.items_json || "[]"),
    subtotal: Number(r.subtotal) || 0,
    gstPercent: Number(r.gst_percent) || 18,
    gstAmount: Number(r.gst_amount) || 0,
    grandTotal: Number(r.grand_total) || 0,
    deliveryDays: Number(r.delivery_days) || 0,
    paymentTerms: r.payment_terms || "",
    notes: r.notes || "",
    status: r.status || "Submitted",
    rating: Number(r.rating) || 0
  }));
}

function getAllWorkflows(): ApprovalWorkflow[] {
  const rows = sqlDb.prepare("SELECT * FROM workflows").all() as any[];
  return rows.map(r => ({
    id: r.id,
    rfqId: r.rfq_id,
    quotationId: r.quotation_id,
    vendorName: r.vendor_name,
    amount: Number(r.amount) || 0,
    status: r.status,
    steps: JSON.parse(r.steps_json || "[]"),
    currentStepIndex: Number(r.current_step_index) || 0,
    remarks: r.remarks || undefined
  }));
}

function getAllDocuments(): ERPDocument[] {
  const rows = sqlDb.prepare("SELECT * FROM documents").all() as any[];
  return rows.map(r => ({
    id: r.id,
    documentType: r.document_type,
    referenceId: r.reference_id,
    documentNumber: r.document_number,
    quotationId: r.quotation_id,
    vendorId: r.vendor_id,
    vendorName: r.vendor_name,
    date: r.date,
    dueDate: r.due_date || undefined,
    subtotal: Number(r.subtotal) || 0,
    cgst: Number(r.cgst) || 0,
    sgst: Number(r.sgst) || 0,
    grandTotal: Number(r.grand_total) || 0,
    status: r.status,
    pdfLink: r.pdf_link || undefined,
    emailSent: r.email_sent === 1
  }));
}

function getAllActivities(): ActivityLog[] {
  const rows = sqlDb.prepare("SELECT * FROM activities ORDER BY id DESC").all() as any[];
  return rows.map(r => ({
    id: r.id,
    title: r.title,
    timestamp: r.timestamp,
    category: r.category,
    userEmail: r.user_email || "system@vendorbridge.com",
    userName: r.user_name || "System Engine"
  }));
}

function getAllNotifications(): NotificationAlert[] {
  const rows = sqlDb.prepare("SELECT * FROM notifications ORDER BY timestamp DESC, id DESC").all() as any[];
  return rows.map(r => ({
    id: r.id,
    title: r.title,
    timestamp: r.timestamp,
    read: r.read === 1,
    type: r.type
  }));
}

function syncSqlDbToBackupJson() {
  try {
    const userRows = sqlDb.prepare("SELECT * FROM users").all() as any[];
    const vendorRows = sqlDb.prepare("SELECT * FROM vendors").all() as any[];
    const rfqRows = sqlDb.prepare("SELECT * FROM rfqs").all() as any[];
    const quoteRows = sqlDb.prepare("SELECT * FROM quotations").all() as any[];
    const workflowRows = sqlDb.prepare("SELECT * FROM workflows").all() as any[];
    const docRows = sqlDb.prepare("SELECT * FROM documents").all() as any[];
    const activityRows = sqlDb.prepare("SELECT * FROM activities").all() as any[];
    const notificationRows = sqlDb.prepare("SELECT * FROM notifications").all() as any[];

    const usersMapped = userRows.map(row => ({
      id: row.id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      role: row.role,
      phone: row.phone || undefined,
      country: row.country || undefined,
      vendorId: row.vendor_id || undefined,
      sidebar_width: row.sidebar_width
    }));

    const vendorsMapped = vendorRows.map(row => ({
      id: row.id,
      name: row.name,
      category: row.category,
      gstNo: row.gst_no,
      contactNo: row.contact_no,
      email: row.email,
      status: row.status,
      rating: row.rating,
      paymentTerms: row.payment_terms,
      address: row.address,
      country: row.country
    }));

    const rfqsMapped = rfqRows.map(row => ({
      id: row.id,
      title: row.title,
      category: row.category,
      deadline: row.deadline,
      description: row.description,
      items: JSON.parse(row.items_json || "[]"),
      assignedVendorIds: JSON.parse(row.assigned_vendor_ids_json || "[]"),
      status: row.status,
      createdAt: row.created_at
    }));

    const quotesMapped = quoteRows.map(row => ({
      id: row.id,
      rfqId: row.rfq_id,
      vendorId: row.vendor_id,
      vendorName: row.vendor_name,
      items: JSON.parse(row.items_json || "[]"),
      subtotal: row.subtotal,
      gstPercent: row.gst_percent,
      gstAmount: row.gst_amount,
      grandTotal: row.grand_total,
      deliveryDays: row.delivery_days,
      paymentTerms: row.payment_terms,
      notes: row.notes,
      status: row.status,
      rating: row.rating
    }));

    const workflowsMapped = workflowRows.map(row => ({
      id: row.id,
      rfqId: row.rfq_id,
      quotationId: row.quotation_id,
      vendorName: row.vendor_name,
      amount: row.amount,
      status: row.status,
      steps: JSON.parse(row.steps_json || "[]"),
      currentStepIndex: row.current_step_index,
      remarks: row.remarks
    }));

    const docsMapped = docRows.map(row => ({
      id: row.id,
      documentType: row.document_type,
      referenceId: row.reference_id,
      documentNumber: row.document_number,
      quotationId: row.quotation_id,
      vendorId: row.vendor_id,
      vendorName: row.vendor_name,
      date: row.date,
      dueDate: row.due_date,
      subtotal: row.subtotal,
      cgst: row.cgst,
      sgst: row.sgst,
      grandTotal: row.grand_total,
      status: row.status,
      pdfLink: row.pdf_link,
      emailSent: row.email_sent === 1
    }));

    const activitiesMapped = activityRows.map(row => ({
      id: row.id,
      title: row.title,
      timestamp: row.timestamp,
      category: row.category,
      userEmail: row.user_email,
      userName: row.user_name
    }));

    const notificationsMapped = notificationRows.map(row => ({
      id: row.id,
      title: row.title,
      timestamp: row.timestamp,
      read: row.read === 1,
      type: row.type
    }));

    const backupObj = {
      users: usersMapped,
      vendors: vendorsMapped,
      rfqs: rfqsMapped,
      quotations: quotesMapped,
      workflows: workflowsMapped,
      documents: docsMapped,
      activities: activitiesMapped,
      notifications: notificationsMapped
    };

    fs.writeFileSync(DB_FILE, JSON.stringify(backupObj, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing db.json backup", error);
  }
}

initSqlDb();

function logActivity(text: string, category: string, userEmail = "system@vendorbridge.com", userName = "System Engine") {
  const id = `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const timestamp = new Date().toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }) + ", " + new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit"
  });

  try {
    sqlDb.prepare(`
      INSERT INTO activities (id, title, timestamp, category, user_email, user_name)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, text, timestamp, category, userEmail, userName);
    syncSqlDbToBackupJson();
  } catch (error) {
    console.error("Error logging activity", error);
  }
}

// ----------------------------------------------------------------------------
// EXPRESS APP CONFIG
// ----------------------------------------------------------------------------
async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // 1. HEALTH / SYSTEM METADATA API
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", appName: "VendorBridge ERP Server", localTime: new Date().toISOString() });
  });

  // 2. AUTHENTICATION ROUTING API
  app.post("/api/auth/login", (req, res) => {
    const { email, role } = req.body;
    if (!email || !role) {
      return res.status(400).json({ error: "Missing email or role parameters" });
    }

    const found = sqlDb.prepare("SELECT * FROM users WHERE LOWER(email) = LOWER(?) AND role = ?").get(email, role) as any;
    if (found) {
      const userObj: User = {
        id: found.id,
        email: found.email,
        firstName: found.first_name,
        lastName: found.last_name,
        role: found.role,
        phone: found.phone || undefined,
        country: found.country || undefined,
        vendorId: found.vendor_id || undefined,
        sidebar_width: found.sidebar_width ?? 250
      };
      logActivity(`User logged in as ${userObj.firstName} ${userObj.lastName} (${userObj.role})`, "System", userObj.email, `${userObj.firstName} ${userObj.lastName}`);
      return res.json({ success: true, user: userObj });
    }

    // Lazy simulated signup user
    const names = email.split("@")[0].split(".");
    const firstName = names[0] ? names[0].charAt(0).toUpperCase() + names[0].slice(1) : "Simulated";
    const lastName = names[1] ? names[1].charAt(0).toUpperCase() + names[1].slice(1) : "User";

    let vendorAssoc: string | undefined;
    if (role === "Vendor") {
      const vendors = getAllVendors();
      const parentVendor = vendors.find(v => email.includes(v.id) || email.includes(v.name.toLowerCase().split(" ")[0]));
      vendorAssoc = parentVendor ? parentVendor.id : (vendors[0] ? vendors[0].id : "v1");
    }

    const newUser: User = {
      id: `u_${Date.now()}`,
      email,
      firstName,
      lastName,
      role,
      vendorId: vendorAssoc,
      sidebar_width: 250
    };

    sqlDb.prepare(`
      INSERT INTO users (id, email, first_name, last_name, role, phone, country, vendor_id, sidebar_width)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(newUser.id, newUser.email, newUser.firstName, newUser.lastName, newUser.role, null, null, newUser.vendorId || null, newUser.sidebar_width || 250);

    logActivity(`New simulated user logged in: ${firstName} ${lastName} (${role})`, "System", email, `${firstName} ${lastName}`);
    syncSqlDbToBackupJson();
    res.json({ success: true, user: newUser });
  });

  app.post("/api/auth/signup", (req, res) => {
    const { email, firstName, lastName, role, phone, country } = req.body;
    if (!email || !firstName || !lastName || !role) {
      return res.status(400).json({ error: "Missing required registration parameters" });
    }

    const exists = sqlDb.prepare("SELECT * FROM users WHERE LOWER(email) = LOWER(?)").get(email);
    if (exists) {
      return res.status(400).json({ error: "User already exists with this email" });
    }

    const newUser: User = {
      id: `u_${Date.now()}`,
      email,
      firstName,
      lastName,
      role,
      phone,
      country,
      sidebar_width: 250
    };

    sqlDb.prepare(`
      INSERT INTO users (id, email, first_name, last_name, role, phone, country, vendor_id, sidebar_width)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(newUser.id, newUser.email, newUser.firstName, newUser.lastName, newUser.role, phone || null, country || null, null, 250);

    logActivity(`New user registered: ${firstName} ${lastName}`, "System", email, `${firstName} ${lastName}`);
    syncSqlDbToBackupJson();
    res.status(201).json({ success: true, user: newUser });
  });

  // 3. VENDOR API
  app.get("/api/vendors", (req, res) => {
    res.json(getAllVendors());
  });

  app.post("/api/vendors", (req, res) => {
    const { name, category, gstNo, contactNo, email, paymentTerms, address, country } = req.body;
    if (!name || !category || !gstNo || !email) {
      return res.status(400).json({ error: "Missing required vendor properties" });
    }

    const newVendor: Vendor = {
      id: `v_${Date.now()}`,
      name,
      category,
      gstNo,
      contactNo: contactNo || "",
      email,
      status: "Active",
      rating: 5.0,
      paymentTerms: paymentTerms || "30 days",
      address: address || "",
      country: country || "India"
    };

    sqlDb.prepare(`
      INSERT INTO vendors (id, name, category, gst_no, contact_no, email, status, rating, payment_terms, address, country)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      newVendor.id,
      newVendor.name,
      newVendor.category,
      newVendor.gstNo,
      newVendor.contactNo,
      newVendor.email,
      newVendor.status,
      newVendor.rating,
      newVendor.paymentTerms || null,
      newVendor.address || null,
      newVendor.country || null
    );

    logActivity(`Registered new vendor supplier profile: ${name}`, "Vendors");
    syncSqlDbToBackupJson();
    res.status(201).json(newVendor);
  });

  app.patch("/api/vendors/:id", (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const vendor = sqlDb.prepare("SELECT * FROM vendors WHERE id = ?").get(id) as any;
    if (!vendor) {
      return res.status(404).json({ error: "Vendor not found" });
    }

    if (status) {
      sqlDb.prepare("UPDATE vendors SET status = ? WHERE id = ?").run(status, id);
      logActivity(`Supplier ${vendor.name} status updated to: ${status}`, "Vendors");
    }

    syncSqlDbToBackupJson();
    const updated = sqlDb.prepare("SELECT * FROM vendors WHERE id = ?").get(id) as any;
    const mapped = {
      id: updated.id,
      name: updated.name,
      category: updated.category,
      gstNo: updated.gst_no,
      contactNo: updated.contact_no || "",
      email: updated.email,
      status: updated.status,
      rating: updated.rating,
      paymentTerms: updated.payment_terms || "",
      address: updated.address || "",
      country: updated.country || ""
    };
    res.json(mapped);
  });

  // 4. RFQ SYSTEM API
  app.get("/api/rfqs", (req, res) => {
    res.json(getAllRfqs());
  });

  app.post("/api/rfqs", (req, res) => {
    const { title, category, deadline, description, items, assignedVendorIds } = req.body;
    if (!title || !category || !deadline || !items || !Array.isArray(items)) {
      return res.status(400).json({ error: "Missing required RFQ parameters" });
    }

    const newRFQ: RFQ = {
      id: `rfq_${Date.now()}`,
      title,
      category,
      deadline,
      description: description || "",
      items: items.map((it: any, idx: number) => ({
        id: it.id || `item_${idx}_${Date.now()}`,
        item: it.item,
        qty: Number(it.qty) || 1,
        unit: it.unit || "NOS"
      })),
      assignedVendorIds: assignedVendorIds || [],
      status: "Sent",
      createdAt: new Date().toISOString().split("T")[0]
    };

    sqlDb.prepare(`
      INSERT INTO rfqs (id, title, category, deadline, description, items_json, assigned_vendor_ids_json, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      newRFQ.id,
      newRFQ.title,
      newRFQ.category,
      newRFQ.deadline,
      newRFQ.description,
      JSON.stringify(newRFQ.items),
      JSON.stringify(newRFQ.assignedVendorIds),
      newRFQ.status,
      newRFQ.createdAt
    );

    logActivity(`Published Request for Quotation: ${title}`, "RFQ");
    syncSqlDbToBackupJson();
    res.status(201).json(newRFQ);
  });

  // 5. QUOTATIONS API
  app.get("/api/quotations", (req, res) => {
    res.json(getAllQuotations());
  });

  app.post("/api/quotations", (req, res) => {
    const { rfqId, vendorId, vendorName, items, subtotal, gstPercent, gstAmount, grandTotal, deliveryDays, paymentTerms, notes } = req.body;
    if (!rfqId || !vendorId || !items || !Array.isArray(items)) {
      return res.status(400).json({ error: "Missing required quotation properties" });
    }

    const vendorRow = sqlDb.prepare("SELECT rating FROM vendors WHERE id = ?").get(vendorId) as any;
    const rate = vendorRow ? (vendorRow.rating || 4.2) : 4.2;

    const newQuotation: Quotation = {
      id: `q_${Date.now()}`,
      rfqId,
      vendorId,
      vendorName: vendorName || "Unknown Vendor",
      items: items.map((it: any, idx: number) => ({
        id: it.id || `qit_${idx}_${Date.now()}`,
        item: it.item,
        qty: Number(it.qty) || 1,
        unit: it.unit || "NOS",
        unitPrice: Number(it.unitPrice) || 0,
        total: Number(it.total) || 1
      })),
      subtotal: Number(subtotal) || 0,
      gstPercent: Number(gstPercent) || 18,
      gstAmount: Number(gstAmount) || 0,
      grandTotal: Number(grandTotal) || 0,
      deliveryDays: Number(deliveryDays) || 7,
      paymentTerms: paymentTerms || "30 days",
      notes: notes || "",
      status: "Submitted",
      rating: rate
    };

    sqlDb.prepare(`
      INSERT INTO quotations (id, rfq_id, vendor_id, vendor_name, items_json, subtotal, gst_percent, gst_amount, grand_total, delivery_days, payment_terms, notes, status, rating)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      newQuotation.id,
      newQuotation.rfqId,
      newQuotation.vendorId,
      newQuotation.vendorName,
      JSON.stringify(newQuotation.items),
      newQuotation.subtotal,
      newQuotation.gstPercent,
      newQuotation.gstAmount,
      newQuotation.grandTotal,
      newQuotation.deliveryDays,
      newQuotation.paymentTerms,
      newQuotation.notes,
      newQuotation.status,
      newQuotation.rating
    );

    // Update RFQ status to 'Bids Received'
    sqlDb.prepare("UPDATE rfqs SET status = 'Bids Received' WHERE id = ? AND status = 'Sent'").run(rfqId);

    logActivity(`Vendor Quotation submitted by ${newQuotation.vendorName} for RFQ ID: ${rfqId}`, "RFQ");
    syncSqlDbToBackupJson();
    res.status(201).json(newQuotation);
  });

  // Quotation recommendation/winning selection API (starts approval flow)
  app.post("/api/quotations/:id/select", (req, res) => {
    const { id } = req.params;
    const q = sqlDb.prepare("SELECT * FROM quotations WHERE id = ?").get(id) as any;
    if (!q) {
      return res.status(404).json({ error: "Quotation target not found" });
    }

    // Set matching quotations to approved or rejected
    sqlDb.prepare("UPDATE quotations SET status = 'Rejected' WHERE rfq_id = ?").run(q.rfq_id);
    sqlDb.prepare("UPDATE quotations SET status = 'Approved' WHERE id = ?").run(id);

    // Update RFQ status
    sqlDb.prepare("UPDATE rfqs SET status = 'Under Review' WHERE id = ?").run(q.rfq_id);

    // Spawn an approval chain workflow!
    const workflowId = `wf_${Date.now()}`;
    const steps = [
      { role: "Procurement Head", name: "Rahul Mehta", status: "Approved", timestamp: new Date().toLocaleDateString() + ", " + new Date().toLocaleTimeString(), remarks: "Recommended for highest composite price-performance rating score indices." },
      { role: "Finance Manager", name: "Priya Shah", status: "Awaiting" },
      { role: "Executive Sign-off", name: "System Admin", status: "Pending" }
    ];

    const newWorkflow: ApprovalWorkflow = {
      id: workflowId,
      rfqId: q.rfq_id,
      quotationId: q.id,
      vendorName: q.vendor_name,
      amount: q.grand_total,
      status: "L1 Review",
      steps,
      currentStepIndex: 1
    };

    sqlDb.prepare(`
      INSERT INTO workflows (id, rfq_id, quotation_id, vendor_name, amount, status, steps_json, current_step_index, remarks)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      newWorkflow.id,
      newWorkflow.rfqId,
      newWorkflow.quotationId,
      newWorkflow.vendorName,
      newWorkflow.amount,
      newWorkflow.status,
      JSON.stringify(newWorkflow.steps),
      newWorkflow.currentStepIndex,
      null
    );

    logActivity(`Quotation selected from ${q.vendor_name} triggers multi-stage approval chain ID: ${workflowId}`, "Approvals");
    syncSqlDbToBackupJson();
    res.json({ success: true, workflow: newWorkflow });
  });

  // 6. APPROVALS WORKFLOW API
  app.get("/api/workflows", (req, res) => {
    res.json(getAllWorkflows());
  });

  app.post("/api/workflows/:id/approve", (req, res) => {
    const { id } = req.params;
    const { action, remarks, stepIndex } = req.body; // 'Approved' | 'Rejected'
    
    const row = sqlDb.prepare("SELECT * FROM workflows WHERE id = ?").get(id) as any;
    if (!row) {
      return res.status(404).json({ error: "Workflow process not found" });
    }

    const steps = JSON.parse(row.steps_json || "[]") as ApprovalChainStep[];
    const currentStepIndex = Number(row.current_step_index) || 0;
    let status = row.status;

    const currentStep = steps[stepIndex];
    if (currentStep) {
      currentStep.status = action;
      currentStep.remarks = remarks || "";
      currentStep.timestamp = new Date().toLocaleDateString() + ", " + new Date().toLocaleTimeString();
    }

    if (action === "Rejected") {
      status = "Rejected";
      sqlDb.prepare("UPDATE workflows SET status = ?, steps_json = ? WHERE id = ?").run(status, JSON.stringify(steps), id);
      logActivity(`Approval process ${id} REJECTED at step index ${stepIndex}`, "Approvals");
    } else {
      // Find next step
      const nextIndex = stepIndex + 1;
      if (nextIndex < steps.length) {
        steps[nextIndex].status = "Awaiting";
        status = "L2 Approval";
        sqlDb.prepare("UPDATE workflows SET status = ?, current_step_index = ?, steps_json = ? WHERE id = ?").run(status, nextIndex, JSON.stringify(steps), id);
        logActivity(`Approval workflow ${id} L1 Review signed off, advancing to L2.`, "Approvals");
      } else {
        // Complete workflow approval!
        status = "Approved";
        sqlDb.prepare("UPDATE workflows SET status = ?, steps_json = ? WHERE id = ?").run(status, JSON.stringify(steps), id);
        logActivity(`Approval workflow ${id} fully completed and signed off!`, "Approvals");

        // AUTOMATICALLY GENERATE PO & INVOICE unified ERPDocuments!
        const rfqItem = sqlDb.prepare("SELECT * FROM rfqs WHERE id = ?").get(row.rfq_id) as any;
        const chosenQ = sqlDb.prepare("SELECT * FROM quotations WHERE id = ?").get(row.quotation_id) as any;
        if (chosenQ) {
          const poNum = `PO-2026-${Math.floor(1000 + Math.random() * 9000)}`;
          const poId = `doc_${Date.now()}_po_${Math.random().toString(36).substring(2, 7)}`;
          const cgstAmount = Math.round((chosenQ.subtotal * 0.09) * 100) / 100;
          const sgstAmount = cgstAmount;

          const newPO: ERPDocument = {
            id: poId,
            documentType: 'PO',
            referenceId: chosenQ.id, // Quotation ID
            documentNumber: poNum,
            quotationId: chosenQ.id,
            vendorId: chosenQ.vendor_id,
            vendorName: chosenQ.vendor_name,
            date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
            subtotal: chosenQ.subtotal,
            cgst: cgstAmount,
            sgst: sgstAmount,
            grandTotal: chosenQ.grand_total,
            status: 'Completed',
            emailSent: false
          };

          const invNum = `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`;
          const invId = `doc_${Date.now()}_inv_${Math.random().toString(36).substring(2, 7)}`;
          const newInv: ERPDocument = {
            id: invId,
            documentType: 'Invoice',
            referenceId: poId, // Mapped PO ID
            documentNumber: invNum,
            quotationId: chosenQ.id,
            vendorId: chosenQ.vendor_id,
            vendorName: chosenQ.vendor_name,
            date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
            subtotal: chosenQ.subtotal,
            cgst: cgstAmount,
            sgst: sgstAmount,
            grandTotal: chosenQ.grand_total,
            status: 'Pending Payment',
            emailSent: false
          };

          sqlDb.prepare(`
            INSERT INTO documents (id, document_type, reference_id, document_number, quotation_id, vendor_id, vendor_name, date, due_date, subtotal, cgst, sgst, grand_total, status, pdf_link, email_sent)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(newPO.id, newPO.documentType, newPO.referenceId, newPO.documentNumber, newPO.quotationId, newPO.vendorId, newPO.vendorName, newPO.date, null, newPO.subtotal, newPO.cgst, newPO.sgst, newPO.grandTotal, newPO.status, null, 0);

          sqlDb.prepare(`
            INSERT INTO documents (id, document_type, reference_id, document_number, quotation_id, vendor_id, vendor_name, date, due_date, subtotal, cgst, sgst, grand_total, status, pdf_link, email_sent)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(newInv.id, newInv.documentType, newInv.referenceId, newInv.documentNumber, newInv.quotationId, newInv.vendorId, newInv.vendorName, newInv.date, newInv.dueDate, newInv.subtotal, newInv.cgst, newInv.sgst, newInv.grandTotal, newInv.status, null, 0);

          // Update RFQ status
          if (rfqItem) {
            sqlDb.prepare("UPDATE rfqs SET status = 'PO Generated' WHERE id = ?").run(row.rfq_id);
          }

          logActivity(`Purchase Order ${poNum} auto-generated for ${chosenQ.vendor_name}`, "Invoices");
          logActivity(`Invoice ${invNum} auto-generated from PO ${poNum}`, "Invoices");

          // Push Notifications
          sqlDb.prepare(`
            INSERT INTO notifications (id, title, timestamp, read, type)
            VALUES (?, ?, ?, ?, ?)
          `).run(`n_powf_${Date.now()}`, `Purchase Order ${poNum} auto-generated for ${chosenQ.vendor_name}`, "Just now", 0, "Invoice");
        }
      }
    }

    syncSqlDbToBackupJson();
    const updatedWf = getAllWorkflows().find(w => w.id === id);
    res.json(updatedWf);
  });

  // 7. UNIFIED DOCUMENTS PO/INVOICE API
  app.get("/api/documents", (req, res) => {
    const { type } = req.query;
    const documents = getAllDocuments();
    if (type) {
      return res.json(documents.filter(d => d.documentType === type));
    }
    res.json(documents);
  });

  app.post("/api/documents", (req, res) => {
    const { documentType, referenceId, documentNumber, quotationId, vendorId, vendorName, subtotal, cgst, sgst, grandTotal, status, dueDate } = req.body;
    if (!documentType || !documentNumber || !quotationId || !vendorId) {
      return res.status(400).json({ error: "Missing required document properties" });
    }

    const newDoc: ERPDocument = {
      id: `doc_${Date.now()}`,
      documentType,
      referenceId: referenceId || quotationId,
      documentNumber,
      quotationId,
      vendorId,
      vendorName: vendorName || "Supplier",
      date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
      dueDate,
      subtotal: Number(subtotal) || 0,
      cgst: Number(cgst) || 0,
      sgst: Number(sgst) || 0,
      grandTotal: Number(grandTotal) || 0,
      status: status || "Generated",
      emailSent: false
    };

    sqlDb.prepare(`
      INSERT INTO documents (id, document_type, reference_id, document_number, quotation_id, vendor_id, vendor_name, date, due_date, subtotal, cgst, sgst, grand_total, status, pdf_link, email_sent)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      newDoc.id,
      newDoc.documentType,
      newDoc.referenceId,
      newDoc.documentNumber,
      newDoc.quotationId,
      newDoc.vendorId,
      newDoc.vendorName,
      newDoc.date,
      newDoc.dueDate || null,
      newDoc.subtotal,
      newDoc.cgst,
      newDoc.sgst,
      newDoc.grandTotal,
      newDoc.status,
      null,
      0
    );

    logActivity(`New Unified Document record ${documentNumber} (${documentType}) registered.`, "Invoices");
    syncSqlDbToBackupJson();
    res.status(201).json(newDoc);
  });

  app.patch("/api/documents/:id/status", (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const doc = sqlDb.prepare("SELECT * FROM documents WHERE id = ?").get(id) as any;
    if (!doc) {
      return res.status(404).json({ error: "Document not found" });
    }

    sqlDb.prepare("UPDATE documents SET status = ? WHERE id = ?").run(status, id);
    logActivity(`Document ${doc.document_number} status updated to: ${status}`, "Invoices");
    
    syncSqlDbToBackupJson();
    const updated = getAllDocuments().find(d => d.id === id);
    res.json(updated);
  });

  app.post("/api/documents/:id/email", (req, res) => {
    const { id } = req.params;
    const { email } = req.body;
    const doc = sqlDb.prepare("SELECT * FROM documents WHERE id = ?").get(id) as any;
    if (!doc) {
      return res.status(404).json({ error: "Document match not found" });
    }

    const newStatus = doc.status === "Generated" ? "Sent" : doc.status;
    sqlDb.prepare("UPDATE documents SET email_sent = 1, status = ? WHERE id = ?").run(newStatus, id);

    sqlDb.prepare(`
      INSERT INTO notifications (id, title, timestamp, read, type)
      VALUES (?, ?, ?, ?, ?)
    `).run(`n_email_${Date.now()}`, `Emailed copy of ${doc.document_type} ${doc.document_number} sent to ${email}`, "Just now", 0, "Invoice");

    logActivity(`Emailed ${doc.document_type} copy of ${doc.document_number} to recipient: ${email}`, "Invoices");
    
    syncSqlDbToBackupJson();
    const updated = getAllDocuments().find(d => d.id === id);
    res.json({ success: true, document: updated });
  });

  app.post("/api/documents/:id/generate-invoice", (req, res) => {
    const { id } = req.params;
    const po = sqlDb.prepare("SELECT * FROM documents WHERE id = ? AND document_type = 'PO'").get(id) as any;
    if (!po) {
      return res.status(404).json({ error: "Purchase Order document not found" });
    }

    const existing = sqlDb.prepare("SELECT * FROM documents WHERE document_type = 'Invoice' AND reference_id = ?").get(po.id) as any;
    if (existing) {
      const existingMapped = getAllDocuments().find(d => d.id === existing.id);
      return res.json(existingMapped);
    }

    const invNum = `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newInv: ERPDocument = {
      id: `doc_${Date.now()}_inv_${Math.random().toString(36).substring(2, 7)}`,
      documentType: 'Invoice',
      referenceId: po.id,
      documentNumber: invNum,
      quotationId: po.quotation_id,
      vendorId: po.vendor_id,
      vendorName: po.vendor_name,
      date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
      subtotal: po.subtotal,
      cgst: po.cgst,
      sgst: po.sgst,
      grandTotal: po.grand_total,
      status: 'Pending Payment',
      emailSent: false
    };

    sqlDb.prepare(`
      INSERT INTO documents (id, document_type, reference_id, document_number, quotation_id, vendor_id, vendor_name, date, due_date, subtotal, cgst, sgst, grand_total, status, pdf_link, email_sent)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      newInv.id,
      newInv.documentType,
      newInv.referenceId,
      newInv.documentNumber,
      newInv.quotationId,
      newInv.vendorId,
      newInv.vendorName,
      newInv.date,
      newInv.dueDate,
      newInv.subtotal,
      newInv.cgst,
      newInv.sgst,
      newInv.grandTotal,
      newInv.status,
      null,
      0
    );

    sqlDb.prepare(`
      INSERT INTO notifications (id, title, timestamp, read, type)
      VALUES (?, ?, ?, ?, ?)
    `).run(`n_inv_${Date.now()}`, `Invoice ${invNum} generated for PO ${po.document_number}`, "Just now", 0, "Invoice");

    logActivity(`Invoice ${invNum} manually spawned from Purchase Order ${po.document_number}`, "Invoices");
    syncSqlDbToBackupJson();
    res.status(201).json(newInv);
  });

  // 8. SYSTEM STATS REPORT TRAVERSAL API
  app.get("/api/reports/statistics", (req, res) => {
    const documentsList = getAllDocuments();
    const rfqsList = getAllRfqs();
    
    const countPO = documentsList.filter(d => d.documentType === "PO").length;
    const countInvoice = documentsList.filter(d => d.documentType === "Invoice").length;
    
    const sumPO = documentsList.filter(d => d.documentType === "PO").reduce((acc, d) => acc + d.grandTotal, 0);
    const sumInvoice = documentsList.filter(d => d.documentType === "Invoice").reduce((acc, d) => acc + d.grandTotal, 0);
    const sumPaid = documentsList.filter(d => d.documentType === "Invoice" && d.status === "Paid").reduce((acc, d) => acc + d.grandTotal, 0);

    res.json({
      totals: {
        poCount: countPO,
        invoiceCount: countInvoice,
        poValue: sumPO,
        invoiceValue: sumInvoice,
        paidInvoiceValue: sumPaid,
        totalItemsCount: documentsList.length,
        averagePurchaseOrderAmount: countPO > 0 ? sumPO / countPO : 0,
        averageInvoiceAmount: countInvoice > 0 ? sumInvoice / countInvoice : 0
      },
      categoryAggregation: [
        { name: "Furniture", value: 185000 + (rfqsList.some(r => r.category === "Furniture") ? 25000 : 0) },
        { name: "IT Hardware", value: 200000 + (rfqsList.some(r => r.category === "IT Hardware") ? 15000 : 0) },
        { name: "Logistics", value: 45000 },
        { name: "Office Supplies", value: 12000 }
      ],
      timeSeriesSeries: [
        { name: "Q1 Spends", POs: 480000, Invoices: 450000 },
        { name: "Q2 Spends", POs: sumPO, Invoices: sumInvoice }
      ]
    });
  });

  // 8.5. USER PREFERENCES API (Resizable sidebar persistence)
  app.get("/api/user/preferences", (req, res) => {
    const { userId, email } = req.query;
    let foundUser;
    
    if (userId) {
      foundUser = sqlDb.prepare("SELECT * FROM users WHERE id = ?").get(userId) as any;
    } else if (email) {
      foundUser = sqlDb.prepare("SELECT * FROM users WHERE LOWER(email) = LOWER(?)").get(email) as any;
    }
    
    if (!foundUser) {
      foundUser = sqlDb.prepare("SELECT * FROM users").get() as any;
    }
    
    res.json({ sidebar_width: foundUser?.sidebar_width ?? 250 });
  });

  app.post("/api/user/preferences", (req, res) => {
    const { userId, email, sidebar_width } = req.body;
    
    if (sidebar_width === undefined) {
      return res.status(400).json({ error: "Missing sidebar_width parameter" });
    }
    
    let foundUser;
    if (userId) {
      foundUser = sqlDb.prepare("SELECT * FROM users WHERE id = ?").get(userId) as any;
    } else if (email) {
      foundUser = sqlDb.prepare("SELECT * FROM users WHERE LOWER(email) = LOWER(?)").get(email) as any;
    }
    
    if (!foundUser) {
      foundUser = sqlDb.prepare("SELECT * FROM users").get() as any;
    }
    
    if (foundUser) {
      sqlDb.prepare("UPDATE users SET sidebar_width = ? WHERE id = ?").run(Number(sidebar_width), foundUser.id);
      syncSqlDbToBackupJson();
      return res.json({ success: true, userId: foundUser.id, sidebar_width: Number(sidebar_width) });
    }
    
    res.status(404).json({ error: "User profile not found to save preference" });
  });

  // 9. LOGS & NOTIFICATIONS API
  app.get("/api/activities", (req, res) => {
    res.json(getAllActivities());
  });

  app.get("/api/notifications", (req, res) => {
    res.json(getAllNotifications());
  });

  app.patch("/api/notifications/:id/read", (req, res) => {
    const { id } = req.params;
    sqlDb.prepare("UPDATE notifications SET read = 1 WHERE id = ?").run(id);
    syncSqlDbToBackupJson();
    res.json(getAllNotifications());
  });

  app.delete("/api/notifications", (req, res) => {
    sqlDb.prepare("UPDATE notifications SET read = 1").run();
    syncSqlDbToBackupJson();
    res.json(getAllNotifications());
  });


  // ----------------------------------------------------------------------------
  // MODULE RENDER SYSTEM: VITE OR STATIC BUILD
  // ----------------------------------------------------------------------------
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`=======================================================`);
    console.log(`VendorBridge ERP Server running on http://localhost:${PORT}`);
    console.log(`Local Time: ${new Date().toISOString()}`);
    console.log(`Ready for developer traversal queries.`);
    console.log(`=======================================================`);
  });
}

startServer();
