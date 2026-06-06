export type UserRole = 'Admin' | 'Procurement Officer' | 'Vendor' | 'Manager/Approver';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone?: string;
  country?: string;
  additionalInfo?: string;
  vendorId?: string; // Associated vendor profile if role is 'Vendor'
  sidebar_width?: number;
}

export type VendorStatus = 'Active' | 'Pending' | 'Blocked';

export interface Vendor {
  id: string;
  name: string;
  category: string;
  gstNo: string;
  contactNo: string;
  email: string;
  status: VendorStatus;
  rating: number; // e.g. 4.5
  paymentTerms?: string; // e.g. "30 days"
  address?: string;
  country?: string;
}

export interface RFQLineItem {
  id: string;
  item: string;
  qty: number;
  unit: string;
}

export type RFQStatus = 'Draft' | 'Sent' | 'Bids Received' | 'Under Review' | 'Approved' | 'PO Generated';

export interface RFQ {
  id: string;
  title: string;
  category: string;
  deadline: string;
  description: string;
  items: RFQLineItem[];
  assignedVendorIds: string[];
  status: RFQStatus;
  createdAt: string;
  attachments?: string[];
}

export interface QuotationLineItem extends RFQLineItem {
  unitPrice: number;
  total: number;
}

export type QuotationStatus = 'Draft' | 'Submitted' | 'Reviewed' | 'Approved' | 'Rejected';

export interface Quotation {
  id: string;
  rfqId: string;
  vendorId: string;
  vendorName: string;
  items: QuotationLineItem[];
  subtotal: number;
  gstPercent: number; // e.g. 18%
  gstAmount: number;
  grandTotal: number;
  deliveryDays: number;
  paymentTerms: string;
  notes: string;
  status: QuotationStatus;
  rating: number; // copy from vendor
}

export type ApprovalWorkflowStatus = 'Submitted' | 'L1 Review' | 'L2 Approval' | 'Approved' | 'Rejected';

export interface ApprovalChainStep {
  role: string;
  name: string;
  status: 'Approved' | 'Awaiting' | 'Rejected' | 'Pending';
  timestamp?: string;
  remarks?: string;
}

export interface ApprovalWorkflow {
  id: string;
  rfqId: string;
  quotationId: string;
  vendorName: string;
  amount: number;
  status: ApprovalWorkflowStatus;
  steps: ApprovalChainStep[];
  currentStepIndex: number;
  remarks?: string;
}

export type DocumentType = 'PO' | 'Invoice';
export type DocumentStatus = 'Generated' | 'Sent' | 'Completed' | 'Paid' | 'Pending Payment';

export interface ERPDocument {
  id: string;
  documentType: DocumentType;
  referenceId: string; // quotationId (for PO) or PO ID (for Invoice)
  documentNumber: string;
  quotationId: string;
  vendorId: string;
  vendorName: string;
  date: string;
  dueDate?: string; // only for Invoice
  subtotal: number;
  cgst: number; // 9% cgst
  sgst: number; // 9% sgst
  grandTotal: number;
  status: DocumentStatus;
  pdfLink?: string;
  emailSent?: boolean;
}

// Standard aliases to maintain single unified schema
export type PurchaseOrder = ERPDocument;
export type Invoice = ERPDocument;

export type ActivityLogCategory = 'RFQ' | 'Approvals' | 'Invoices' | 'Vendors' | 'System';

export interface ActivityLog {
  id: string;
  title: string;
  timestamp: string;
  category: ActivityLogCategory;
  userEmail: string;
  userName: string;
}

export interface NotificationAlert {
  id: string;
  title: string;
  timestamp: string;
  read: boolean;
  type: 'RFQ' | 'Approval' | 'Invoice' | 'Vendor';
}
