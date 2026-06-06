-- ============================================================================
-- VENDORBRIDGE PROCUREMENT & VENDOR MANAGEMENT ERP DB SCHEMA
-- Product Name: VendorBridge ERP (Unified Document Optimization)
-- Dialect support: Standard SQL (ANSI-compliant), compatible with PostgreSQL,
--                  MySQL, and cloud systems like Google Cloud SQL.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- PART 1: SYSTEM REWRITING AND TEARDOWN
-- ----------------------------------------------------------------------------
-- Drop tables in reverse-dependency order to preserve referential integrity constraints.
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS approvals CASCADE;
DROP TABLE IF EXISTS quotations CASCADE;
DROP TABLE IF EXISTS rfqs CASCADE;
DROP TABLE IF EXISTS vendors CASCADE;
DROP TABLE IF EXISTS users CASCADE;


-- ----------------------------------------------------------------------------
-- PART 2: CORE RELATION TABLE DEFINITIONS
-- ----------------------------------------------------------------------------

-- A. USERS REGISTRY
-- Holds authentication attributes and structural roles ('Admin', 'ProcurementOfficer', 'Vendor', 'Manager/Approver')
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    phone VARCHAR(30),
    country VARCHAR(100) DEFAULT 'India',
    sidebar_width INT DEFAULT 250,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_user_role CHECK (role IN ('Admin', 'ProcurementOfficer', 'Vendor', 'Manager/Approver'))
);

-- B. VENDORS DIRECTORY 
-- Profiles of certified external suppliers and manufacturers registering bids under active tenders
CREATE TABLE vendors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    gstin VARCHAR(15) NOT NULL UNIQUE, -- 15-character GST identification format in India
    contact_email VARCHAR(150) NOT NULL,
    contact_phone VARCHAR(30),
    address TEXT,
    rating DECIMAL(3,2) DEFAULT 5.00,
    status VARCHAR(30) DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_vendor_rating CHECK (rating >= 1.00 AND rating <= 5.00),
    CONSTRAINT chk_vendor_status CHECK (status IN ('Active', 'On Hold', 'Suspended', 'Pending Evaluation'))
);

-- C. REQUESTS FOR QUOTATIONS (RFQs / REQUISITIONS)
-- Requisitions drafted and published by organizational Procurement Officers (e.g. Rahul Mehta)
CREATE TABLE rfqs (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    quantity INT NOT NULL,
    deadline DATE NOT NULL,
    created_by INT NOT NULL,
    status VARCHAR(30) DEFAULT 'Draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_rfq_qty CHECK (quantity > 0),
    CONSTRAINT chk_rfq_status CHECK (status IN ('Draft', 'Published', 'Under Review', 'Awarded', 'Closed')),
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
);

-- D. QUOTATIONS (PROPOSALS / BIDS)
-- Vendor quotations detailing unit prices, total amount, and delivery days responding to open RFQs
CREATE TABLE quotations (
    id SERIAL PRIMARY KEY,
    rfq_id INT NOT NULL,
    vendor_id INT NOT NULL,
    price DECIMAL(15,2) NOT NULL, -- Total or baseline price submitted
    delivery_days INT NOT NULL,   -- Lead delivery time in days
    notes TEXT,
    status VARCHAR(30) DEFAULT 'Submitted',
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_quote_price CHECK (price >= 0),
    CONSTRAINT chk_delivery_timeline CHECK (delivery_days > 0),
    CONSTRAINT chk_quote_status CHECK (status IN ('Submitted', 'Reviewed', 'Rejected', 'Selected')),
    FOREIGN KEY (rfq_id) REFERENCES rfqs(id) ON DELETE CASCADE,
    FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE
);

-- E. APPROVALS WORKFLOW
-- Track chronological sign-offs required from Managers (e.g. Priya Shah) to finalize purchase contracts
CREATE TABLE approvals (
    id SERIAL PRIMARY KEY,
    quotation_id INT NOT NULL,
    approver_id INT NOT NULL,
    remarks TEXT,
    status VARCHAR(30) DEFAULT 'Awaiting',
    approved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_approval_status CHECK (status IN ('Awaiting', 'Approved', 'Rejected')),
    FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE,
    FOREIGN KEY (approver_id) REFERENCES users(id) ON DELETE RESTRICT
);

-- F. UNIFIED DOCUMENTS TABLE (POs & INVOICES)
-- Consolidates PO and Invoice registers with clear contextual types and standard parameters
CREATE TABLE documents (
    document_id SERIAL PRIMARY KEY,
    document_type VARCHAR(20) NOT NULL, -- 'PO' or 'Invoice'
    reference_id INT NOT NULL, -- quotation_id (for PO) or parent document_id / PO ID (for Invoice)
    document_number VARCHAR(100) NOT NULL UNIQUE,
    quotation_id INT NOT NULL, -- maintaining clean back-links
    vendor_id INT NOT NULL,
    totals DECIMAL(15,2) NOT NULL,
    tax_percent DECIMAL(5,2) DEFAULT 18.00,
    tax_amount DECIMAL(15,2) NOT NULL,
    grand_total DECIMAL(15,2) NOT NULL,
    status VARCHAR(30) DEFAULT 'Generated', -- 'Generated', 'Sent', 'Completed', 'Paid'
    pdf_link VARCHAR(255),
    email_sent BOOLEAN DEFAULT FALSE,
    document_date DATE DEFAULT CURRENT_DATE,
    due_date DATE NULL, -- Used primarily when document_type = 'Invoice'
    CONSTRAINT chk_doc_type CHECK (document_type IN ('PO', 'Invoice')),
    CONSTRAINT chk_doc_status CHECK (status IN ('Generated', 'Sent', 'Completed', 'Paid', 'Pending Payment')),
    CONSTRAINT chk_doc_totals CHECK (totals >= 0),
    CONSTRAINT chk_doc_tax_pct CHECK (tax_percent >= 0),
    CONSTRAINT chk_doc_tax_amt CHECK (tax_amount >= 0),
    CONSTRAINT chk_doc_grand CHECK (grand_total >= 0),
    FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE,
    FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE
);

-- G. AUDIT LOGS
-- Immutable write-only records tracking sensitive procurement workflows
CREATE TABLE activity_logs (
    id SERIAL PRIMARY KEY,
    user_id INT,
    action_type VARCHAR(100) NOT NULL,
    details TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);


-- ----------------------------------------------------------------------------
-- PART 3: SCHEMATIC RELATIONSHIP INDEXES (Frictionless Query Traversal)
-- ----------------------------------------------------------------------------
-- Accelerate foreign-key nested joins for analytical comparisons and approval chains
CREATE INDEX idx_quotations_rfq_id ON quotations(rfq_id);
CREATE INDEX idx_quotations_vendor_id ON quotations(vendor_id);
CREATE INDEX idx_approvals_quotation_id ON approvals(quotation_id);
CREATE INDEX idx_documents_type ON documents(document_type);
CREATE INDEX idx_documents_vendor_id ON documents(vendor_id);
CREATE INDEX idx_documents_reference_key ON documents(reference_id);


-- ----------------------------------------------------------------------------
-- PART 4: MOCK SEEDING & DATA INSERTIONS
-- ----------------------------------------------------------------------------

-- 1. Insert Core Organizational Roles & Testing Profiles
INSERT INTO users (name, email, password_hash, role, phone, country) VALUES
('Rahul Mehta', 'officer@vendorbridge.com', '$2b$12$Kj959F0g9G82hS67n2s9s.34vS8m8S28j37s.G48vS12kKdf2', 'ProcurementOfficer', '9812345670', 'India'),
('Amit Patel', 'vendor@infra.com', '$2b$12$L7389F1h2H12hY56n3s4s.56vN8m8S93j82s.V89vX34oPdf5', 'Vendor', '9876543210', 'India'),
('Priya Shah', 'manager@vendorbridge.com', '$2b$12$P2134Y7b8K92hO12l9j3r.23m9g3J81n92b.P23hO12lPst4', 'Manager/Approver', '9912345678', 'India'),
('System Administrator', 'admin@vendorbridge.com', '$2b$12$A8901Z1a2B34c56d7e8f.90g1h2I34j56k78l90m1n2o3', 'Admin', '9000000001', 'India');

-- 2. Register Certified Vendors
INSERT INTO vendors (name, category, gstin, contact_email, contact_phone, address, rating, status) VALUES
('Infra Supplies Pvt Ltd', 'Furniture', '24AAAAB1234C1Z0', 'sales@infrasupplies.com', '+91 261 2234091', '456 Industrial Estate, Surat, Gujarat', 4.80, 'Active'),
('TechCore Solutions Ltd', 'IT Hardware', '27AABCT9876F2Z5', 'bids@techcore.com', '+91 22 45676899', 'B-102 Trade Center, Bandra Kurla, Mumbai', 4.50, 'Active'),
('FastLog Logistics', 'Logistics', '19AAECG2345A3Z1', 'dispatch@fastlog.in', '+91 33 22890987', '78 Sector V, Salt Lake City, Kolkata', 4.20, 'Active');

-- 3. Publish initial Requests for Quotations (RFQs)
INSERT INTO rfqs (title, description, category, quantity, deadline, created_by, status) VALUES
('Office Furniture Procurement Q2', 'Supply and assembly of 25 ergonomic mesh chairs and 10 motorized standing desks for office relocation.', 'Furniture', 35, '2026-06-30', 1, 'Published'),
('Laptop Deployment Core Dev Team', 'Acquisition of 15 premium workstations equipped with 32GB RAM and 1TB SSD configs.', 'IT Hardware', 15, '2026-06-25', 1, 'Under Review');

-- 4. Record Vendor Bid Bidding Proposals (Quotations responding to RFQs)
INSERT INTO quotations (rfq_id, vendor_id, price, delivery_days, notes, status) VALUES
(1, 1, 169500.00, 7, 'Premium ergonomic mesh chair range with custom multi-tilt control. Includes a 3-year hydraulic cylinder replacement warranty.', 'Submitted'),
(1, 2, 185000.00, 12, 'Commercial range desks and high-back chairs. Immediate warehousing dispatch availability.', 'Submitted'),
(2, 2, 1245000.00, 5, 'Bespoke corporate discount applies. Fast-tracked delivery via air-courier included.', 'Selected');


-- ----------------------------------------------------------------------------
-- PART 5: SYSTEM WORKFLOW QUERIES & LEDGER SCENARIOS
-- ----------------------------------------------------------------------------

-- Query 1: Comparative Bid Matrix 分析 (Dashboard View Integration)
SELECT 
    r.title AS rfq_title,
    r.category AS procurement_category,
    q.notes AS vendor_proposal,
    v.name AS vendor_name,
    v.rating AS vendor_score,
    q.price AS base_bid_price,
    q.delivery_days AS estimated_delivery_days,
    CASE 
        WHEN q.price = (SELECT MIN(price) FROM quotations WHERE rfq_id = r.id) THEN 'Lowest Bid (Recommended Target)'
        ELSE 'Alternative Proposal'
    END AS financial_flag
FROM quotations q
JOIN rfqs r ON q.rfq_id = r.id
JOIN vendors v ON q.vendor_id = v.id
WHERE q.rfq_id = 1
ORDER BY q.price ASC;


-- Query 2: Bid Evaluation, Selection and Manager Review Initialization
-- STEP A: Shift chosen quotation status
UPDATE quotations SET status = 'Selected' WHERE id = 1;

-- STEP B: Spawn approvals milestone L1 review pending
INSERT INTO approvals (quotation_id, approver_id, remarks, status) VALUES
(1, 3, 'Pending managerial review of compliance specs.', 'Awaiting');


-- Query 3: Manager Sign-off Action transitioning workflow status
UPDATE approvals
SET status = 'Approved', 
    remarks = 'Approved with standard contractual delivery lead timeline clauses.', 
    approved_at = CURRENT_TIMESTAMP
WHERE id = 1;


-- Query 4: APPROVED QUOTATION AUTOMATICALLY GENERATES A DOCUMENT OF TYPE 'PO'
-- Creates a document record with document_type = 'PO', referencing the quotation_id.
INSERT INTO documents (document_type, reference_id, document_number, quotation_id, vendor_id, totals, tax_percent, tax_amount, grand_total, status)
SELECT 
    'PO' AS document_type,
    q.id AS reference_id,
    'PO-2026-00' || q.id AS document_number,
    q.id AS quotation_id,
    q.vendor_id AS vendor_id,
    q.price AS totals,
    18.00 AS tax_percent,
    q.price * 0.18 AS tax_amount,
    q.price * 1.18 AS grand_total,
    'Completed' AS status
FROM quotations q
JOIN approvals a ON a.quotation_id = q.id
WHERE q.id = 1 AND a.status = 'Approved';


-- Query 5: GENERATED PO GENERATES A DOCUMENT OF TYPE 'INVOICE'
-- Pulls the validated PO details to construct a matched Tax Invoice document.
INSERT INTO documents (document_type, reference_id, document_number, quotation_id, vendor_id, totals, tax_percent, tax_amount, grand_total, status, due_date)
SELECT 
    'Invoice' AS document_type,
    d.document_id AS reference_id, -- PO's document_id as parent/reference
    'INV-2026-00' || d.document_id AS document_number,
    d.quotation_id,
    d.vendor_id,
    d.totals,
    d.tax_percent,
    d.tax_amount,
    d.grand_total,
    'Pending Payment' AS status,
    CURRENT_DATE + INTERVAL '20 days' AS due_date
FROM documents d
WHERE d.document_type = 'PO' AND d.document_number = 'PO-2026-001';


-- Query 6: Retrieve Documents Filtered by Type ('PO' or 'Invoice')
SELECT * FROM documents WHERE document_type = 'PO';
SELECT * FROM documents WHERE document_type = 'Invoice';


-- Query 7: Complete Procure-to-Pay Sequential History Traversal
SELECT 
    r.title AS requisition_title,
    v.name AS vendor_name,
    q.price AS offer_price,
    po_doc.document_number AS po_ref_number,
    po_doc.status AS po_operational_status,
    inv_doc.document_number AS invoice_ref_number,
    inv_doc.grand_total AS invoice_due_sum,
    inv_doc.status AS invoice_accounting_status
FROM rfqs r
JOIN quotations q ON q.rfq_id = r.id
JOIN vendors v ON q.vendor_id = v.id
LEFT JOIN documents po_doc ON po_doc.quotation_id = q.id AND po_doc.document_type = 'PO'
LEFT JOIN documents inv_doc ON inv_doc.reference_id = po_doc.document_id AND inv_doc.document_type = 'Invoice'
WHERE r.id = 1;


-- Query 8: Unified Monthly Procurement Statistics (Export combining PO and Invoice aggregate spans)
SELECT 
    document_type,
    COUNT(document_id) AS total_documents,
    COALESCE(SUM(totals), 0.00) AS subtotal_overall,
    COALESCE(SUM(tax_amount), 0.00) AS overall_tax_levied,
    COALESCE(SUM(grand_total), 0.00) AS gross_value_span,
    COUNT(CASE WHEN status = 'Paid' THEN 1 END) AS settled_invoice_count,
    COUNT(CASE WHEN status = 'Completed' THEN 1 END) AS successful_fulfilled_orders
FROM documents
GROUP BY document_type;
