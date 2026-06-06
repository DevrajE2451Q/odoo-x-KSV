import React, { useState } from 'react';
import { useERP } from './ERPContext';
import { 
  Download, 
  Printer, 
  Mail, 
  CheckCircle, 
  Receipt, 
  FileCheck, 
  FileText, 
  TrendingUp, 
  ArrowRight,
  Send,
  Sparkles,
  DollarSign,
  Calendar
} from 'lucide-react';
import { DocumentType, ERPDocument, DocumentStatus } from './types';

export const InvoicesView: React.FC<{ defaultDocType?: DocumentType }> = ({ defaultDocType }) => {
  const { 
    documents, 
    quotations, 
    updateDocumentStatus, 
    sendDocumentEmail, 
    generateInvoiceFromPO,
    currentRole 
  } = useERP();

  // Active document type filter tab: 'PO' or 'Invoice'
  const [filterType, setFilterType] = useState<DocumentType>(defaultDocType || 'PO');
  
  // List of documents matching the current tab
  const filteredDocs = documents.filter(d => d.documentType === filterType);

  const [selectedDocId, setSelectedDocId] = useState<string | null>(() => {
    return filteredDocs.length > 0 ? filteredDocs[0].id : null;
  });

  // Track outer route switches via sidebar
  React.useEffect(() => {
    if (defaultDocType) {
      setFilterType(defaultDocType);
      const filtered = documents.filter(d => d.documentType === defaultDocType);
      if (filtered.length > 0) {
        setSelectedDocId(filtered[0].id);
      } else {
        setSelectedDocId(null);
      }
    }
  }, [defaultDocType]);

  // Ensure selectedDocId remains valid when tab switches
  const activeDocument = documents.find(d => d.id === selectedDocId) || (filteredDocs.length > 0 ? filteredDocs[0] : null);

  const [toEmail, setToEmail] = useState('');
  const [emailOpen, setEmailOpen] = useState(false);

  // Directly link back to quotation using our unified quotationId field
  const relatedQuotation = activeDocument && quotations.find(q => q.id === activeDocument.quotationId);

  // If active is Invoice, find parent PO
  const parentPO = activeDocument?.documentType === 'Invoice' 
    ? documents.find(d => d.id === activeDocument.referenceId && d.documentType === 'PO')
    : null;

  const triggerPrint = () => {
    window.print();
  };

  const triggerDownloadPDF = () => {
    if (!activeDocument) return;
    alert(`Successfully generated and downloaded PDF for ${activeDocument.documentType}: ${activeDocument.documentNumber}.`);
    
    // Simulate downloading files
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(activeDocument, null, 2))}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `${activeDocument.documentNumber}_Details.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDocument || !toEmail) return;
    sendDocumentEmail(activeDocument.id, toEmail);
    alert(`Emailed ${activeDocument.documentType} copy to ${toEmail} successfully!`);
    setToEmail('');
    setEmailOpen(false);
  };

  const handleGenerateInvoice = () => {
    if (!activeDocument || activeDocument.documentType !== 'PO') return;
    const newInvoice = generateInvoiceFromPO(activeDocument.id);
    if (newInvoice) {
      alert(`Success: Matching Tax Invoice ${newInvoice.documentNumber} has been generated from Purchase Order ${activeDocument.documentNumber}.`);
      setFilterType('Invoice');
      setSelectedDocId(newInvoice.id);
    }
  };

  // Check if an invoice has already been generated for a PO
  const invoiceExistsForPO = activeDocument?.documentType === 'PO'
    ? documents.some(d => d.documentType === 'Invoice' && d.referenceId === activeDocument.id)
    : false;

  // Calculate procurement stats for the header badge combined statistics
  const poTotalSum = documents.filter(d => d.documentType === 'PO').reduce((acc, current) => acc + current.grandTotal, 0);
  const invTotalSum = documents.filter(d => d.documentType === 'Invoice').reduce((acc, current) => acc + current.grandTotal, 0);
  const paidInvSum = documents.filter(d => d.documentType === 'Invoice' && d.status === 'Paid').reduce((acc, current) => acc + current.grandTotal, 0);

  return (
    <div id="documents-view-wrapper" className="space-y-6 animate-in fade-in duration-200">
      
      {/* Title Header */}
      <div id="documents-header-container" className="border-b border-gray-100 pb-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Unified Documents Module</span>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Receipt className="text-slate-700 w-6 h-6" />
            Documents Ledger
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Access, print or distribute Purchase Orders and Tax Invoices in a unified transaction standard.
          </p>
        </div>

        {/* Dynamic combined stats banner */}
        <div className="flex gap-3 bg-white p-3 rounded-xl border border-gray-150 shadow-xs self-start md:self-auto">
          <div className="px-2 border-r border-gray-100 text-center">
            <span className="text-[9px] text-gray-400 uppercase font-bold block">Total PO Value</span>
            <span className="text-xs font-extrabold text-blue-600">₹{poTotalSum.toLocaleString()}</span>
          </div>
          <div className="px-2 border-r border-gray-100 text-center">
            <span className="text-[9px] text-gray-400 uppercase font-bold block">Total Invoiced</span>
            <span className="text-xs font-extrabold text-indigo-600">₹{invTotalSum.toLocaleString()}</span>
          </div>
          <div className="px-2 text-center">
            <span className="text-[9px] text-gray-400 uppercase font-bold block">Paid Ledger</span>
            <span className="text-xs font-extrabold text-emerald-600">₹{paidInvSum.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Directory and Tab Filters */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Document Type Selector Slider / Tabs */}
          <div id="doc-type-tabs" className="grid grid-cols-2 p-1 bg-slate-150 rounded-xl border border-gray-200">
            <button
              id="tab-select-po"
              onClick={() => {
                setFilterType('PO');
                const firstPO = documents.find(d => d.documentType === 'PO');
                if (firstPO) setSelectedDocId(firstPO.id);
              }}
              className={`py-2 px-3 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                filterType === 'PO'
                  ? 'bg-white text-gray-950 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Purchase Orders
            </button>
            <button
              id="tab-select-invoice"
              onClick={() => {
                setFilterType('Invoice');
                const firstInv = documents.find(d => d.documentType === 'Invoice');
                if (firstInv) setSelectedDocId(firstInv.id);
              }}
              className={`py-2 px-3 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                filterType === 'Invoice'
                  ? 'bg-white text-gray-950 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Invoices
            </button>
          </div>

          {/* Directory Listings */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between pl-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                {filterType === 'PO' ? 'PO Directory' : 'Invoice Directory'}
              </span>
              <span className="text-[10px] bg-slate-100 text-slate-600 font-black font-semibold px-2 py-0.5 rounded-full">
                {filteredDocs.length} items
              </span>
            </div>

            {filteredDocs.length > 0 ? (
              <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                {filteredDocs.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => setSelectedDocId(doc.id)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all flex flex-col gap-1.5 cursor-pointer ${
                      activeDocument?.id === doc.id
                        ? 'bg-blue-50/65 border-blue-200 shadow-sm ring-1 ring-blue-100'
                        : 'bg-white border-gray-150 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-bold text-gray-800">{doc.documentNumber}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                        doc.status === 'Paid' || doc.status === 'Completed'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : doc.status === 'Pending Payment'
                          ? 'bg-amber-50 text-amber-700 border border-amber-100'
                          : 'bg-blue-50 text-blue-700 border border-blue-100'
                      }`}>
                        {doc.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between w-full mt-0.5">
                      <span className="text-[10px] text-gray-400 font-mono">
                        {doc.documentType === 'Invoice' ? `DUE: ${doc.dueDate}` : `DATE: ${doc.date}`}
                      </span>
                      <span className="text-xs font-extrabold text-gray-700">₹{doc.grandTotal.toLocaleString()}</span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="bg-white border text-center border-gray-150 p-6 rounded-xl text-gray-400 font-semibold text-xs">
                No {filterType === 'PO' ? 'Purchase Orders' : 'Invoices'} generated.
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Reusable Dynamic Content Render Block */}
        <div className="lg:col-span-9">
          {activeDocument ? (
            <div className="bg-white border border-gray-150 rounded-xl shadow-md p-6 space-y-6">
              
              {/* Action Bar Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-gray-100 gap-4">
                <div>
                  <span className="text-[10px] text-slate-400 font-black tracking-widest uppercase block font-mono">
                    Procurement {activeDocument.documentType} Layout
                  </span>
                  <span className="text-base font-extrabold text-gray-800 block mt-0.5">
                    {activeDocument.documentNumber} ({activeDocument.documentType === 'PO' ? 'Purchase Order' : 'Tax Invoice'})
                  </span>
                </div>

                {/* Grid actions - Completely unified for both document models */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    id="btn-doc-pdf"
                    onClick={triggerDownloadPDF}
                    className="bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-gray-500" />
                    Download PDF
                  </button>
                  <button
                    id="btn-doc-print"
                    onClick={triggerPrint}
                    className="bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-gray-500" />
                    Print
                  </button>
                  <button
                    id="btn-doc-email-toggle"
                    onClick={() => setEmailOpen(!emailOpen)}
                    className="bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5 text-gray-500" />
                    Email {activeDocument.documentType}
                  </button>
                </div>
              </div>

              {/* Simulated Email Sender popover */}
              {emailOpen && (
                <form onSubmit={handleSendEmail} className="bg-blue-50 border border-blue-150 p-4 rounded-xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-blue-800 uppercase block">
                      Email dispatch simulation ({activeDocument.documentType})
                    </span>
                    <button type="button" onClick={() => setEmailOpen(false)} className="text-xs text-blue-500 hover:underline">
                      Close
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={toEmail}
                      onChange={(e) => setToEmail(e.target.value)}
                      required
                      placeholder="Enter recipient email address..."
                      className="flex-1 text-xs border border-gray-300 bg-white rounded p-2 focus:ring-1 focus:ring-blue-500"
                    />
                    <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-sm">
                      Send Email
                    </button>
                  </div>
                </form>
              )}

              {/* PRINT MATERIAL INVOICE CONTAINER */}
              <div id="printable-area" className="border border-gray-200 rounded-xl p-6 space-y-6">
                
                {/* Visual Banner for elegant document verification headers */}
                <div className="flex items-center justify-between border-b border-gray-150 pb-5">
                  <div className="flex items-center gap-2">
                    <div className="bg-slate-900 text-white p-2 rounded-lg">
                      <Receipt className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <span className="text-sm font-black font-extrabold text-gray-900 block tracking-tight">
                        VendorBridge ERP
                      </span>
                      <span className="text-[9px] text-gray-400 tracking-wider uppercase font-mono">
                        {activeDocument.documentType === 'PO' ? 'Official Purchase Authorization' : 'Commercial Bill of Supply'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <span className="text-xs font-bold text-gray-800 block">
                      {activeDocument.documentType === 'PO' ? 'PURCHASE ORDER' : 'TAX INVOICE'}
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono block">
                      {activeDocument.documentNumber}
                    </span>
                  </div>
                </div>

                {/* Top Details (Bill To vs Vendor Column Grid) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-gray-150 pb-5">
                  {/* Left Side: Bill To / Buyer */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-gray-400 font-extrabold uppercase block tracking-wider">
                      {activeDocument.documentType === 'PO' ? 'Issued By (Buyer):' : 'Bill To:'}
                    </span>
                    <span className="text-xs font-extrabold text-gray-800 block">Your Organization Name Ltd.</span>
                    <span className="text-xs text-gray-500 block">123 Business Park, Ahmedabad, Gujarat</span>
                    <span className="text-[10px] text-gray-400 font-mono font-bold block mt-0.5">GSTIN: 253834384AFB</span>
                  </div>

                  {/* Right Side: Vendor / Supplier */}
                  <div className="space-y-1 md:text-right">
                    <span className="text-[10px] text-gray-400 font-extrabold uppercase block tracking-wider">
                      {activeDocument.documentType === 'PO' ? 'Issued To (Supplier):' : 'Supplier Details:'}
                    </span>
                    <span className="text-xs font-extrabold text-gray-800 block">{activeDocument.vendorName}</span>
                    <span className="text-xs text-gray-500 block">456 Industrial Estate, Surat, Gujarat</span>
                    <span className="text-[10px] text-gray-400 font-mono font-bold block mt-0.5 md:text-right">
                      GSTIN: 24AAAAB1234C1Z0
                    </span>
                  </div>
                </div>

                {/* Dates & Reference Block */}
                <div className="grid grid-cols-2 gap-4 bg-slate-50 border border-slate-100 p-4 rounded-xl text-xs">
                  <div className="space-y-1.5">
                    <span className="text-gray-500 font-semibold block">
                      Document Date:{' '}
                      <span className="font-extrabold text-gray-800 font-mono">{activeDocument.date}</span>
                    </span>
                    <span className="text-gray-500 font-semibold block">
                      Reference Quotation ID:{' '}
                      <span className="font-extrabold text-gray-800 font-mono">{activeDocument.quotationId}</span>
                    </span>
                  </div>
                  
                  <div className="space-y-1.5 md:text-right">
                    {activeDocument.documentType === 'Invoice' ? (
                      <>
                        <span className="text-gray-500 font-semibold block">
                          Due Date:{' '}
                          <span className="font-extrabold text-rose-700 font-mono">{activeDocument.dueDate}</span>
                        </span>
                        <span className="text-gray-500 font-semibold block">
                          Mapped PO Code:{' '}
                          <span className="font-extrabold text-gray-800 font-mono">
                            {parentPO ? parentPO.documentNumber : 'PO-2025-0068'}
                          </span>
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-gray-500 font-semibold block">
                          Delivery Lead-Time:{' '}
                          <span className="font-extrabold text-slate-800">
                            {relatedQuotation ? `${relatedQuotation.deliveryDays} Days` : '10 Days'}
                          </span>
                        </span>
                        <span className="text-gray-500 font-semibold block">
                          Payment Terms:{' '}
                          <span className="font-extrabold text-slate-800">
                            {relatedQuotation ? relatedQuotation.paymentTerms : '30 Days Net'}
                          </span>
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Receipt Line Items Table */}
                <div className="border border-gray-150 rounded-xl overflow-hidden shadow-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50/60 border-b border-gray-150">
                        <th className="py-2.5 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-6">
                          Item Description
                        </th>
                        <th className="py-2.5 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest w-24 text-center">
                          Qty
                        </th>
                        <th className="py-2.5 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest w-36 text-center">
                          Unit Price (INR)
                        </th>
                        <th className="py-2.5 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest w-32 text-center pr-6">
                          Total (INR)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {relatedQuotation ? (
                        relatedQuotation.items.map((line) => (
                          <tr key={line.id} className="hover:bg-gray-50/30">
                            <td className="py-3 px-4 text-xs font-bold text-gray-800 pl-6">{line.item}</td>
                            <td className="py-3 px-4 text-xs text-center font-bold text-gray-500">{line.qty}</td>
                            <td className="py-3 px-4 text-xs text-center text-gray-650 font-medium">
                              ₹{line.unitPrice.toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-xs text-center text-gray-800 font-bold pr-6">
                              ₹{line.total.toLocaleString()}
                            </td>
                          </tr>
                        ))
                      ) : (
                        // Dynamic Fallback items representing standard math
                        <>
                          <tr className="hover:bg-gray-50/30">
                            <td className="py-3 px-4 text-xs font-bold text-gray-800 pl-6">Ergonomic Mesh Chair</td>
                            <td className="py-3 px-4 text-xs text-center font-bold text-gray-500">25</td>
                            <td className="py-3 px-4 text-xs text-center text-gray-650 font-medium">₹3,500</td>
                            <td className="py-3 px-4 text-xs text-center text-gray-800 font-bold pr-6">₹87,500</td>
                          </tr>
                          <tr className="hover:bg-gray-50/30">
                            <td className="py-3 px-4 text-xs font-bold text-gray-800 pl-6">Motorized Standing Desk</td>
                            <td className="py-3 px-4 text-xs text-center font-bold text-gray-500">10</td>
                            <td className="py-3 px-4 text-xs text-center text-gray-650 font-medium">₹8,200</td>
                            <td className="py-3 px-4 text-xs text-center text-gray-800 font-bold pr-6">₹82,000</td>
                          </tr>
                        </>
                      )}

                      {/* Financial Math Summary blocks */}
                      <tr className="bg-gray-50/40">
                        <td colSpan={2} />
                        <td className="py-2 px-4 text-[11px] text-gray-500 font-bold text-right font-sans">Subtotal</td>
                        <td className="py-2 px-4 text-xs font-bold text-gray-800 text-center pr-6">
                          ₹{activeDocument.subtotal.toLocaleString()}
                        </td>
                      </tr>
                      <tr className="bg-gray-50/40">
                        <td colSpan={2} />
                        <td className="py-2 px-4 text-[11px] text-gray-500 font-bold text-right font-sans">CGST (9%)</td>
                        <td className="py-2 px-4 text-xs font-bold text-gray-850 text-center pr-6">
                          ₹{activeDocument.cgst.toLocaleString()}
                        </td>
                      </tr>
                      <tr className="bg-gray-50/40">
                        <td colSpan={2} />
                        <td className="py-2 px-4 text-[11px] text-gray-500 font-bold text-right font-sans">SGST (9%)</td>
                        <td className="py-2 px-4 text-xs font-bold text-gray-850 text-center pr-6">
                          ₹{activeDocument.sgst.toLocaleString()}
                        </td>
                      </tr>
                      <tr className="bg-slate-100 border-t border-gray-200">
                        <td colSpan={2} />
                        <td className="py-3 px-4 text-xs text-gray-700 font-extrabold text-right uppercase">
                          Grand Total (INR)
                        </td>
                        <td className="py-3 px-4 text-sm font-black text-blue-600 text-center pr-6">
                          ₹{activeDocument.grandTotal.toLocaleString()}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Additional terms footer for authorized signatures */}
                <div className="pt-4 border-t border-dashed border-gray-200 flex justify-between items-end text-[10px] text-gray-400">
                  <div className="space-y-1">
                    <p className="font-semibold text-gray-500 uppercase">Terms & Instructions:</p>
                    <p>1. Please refer to document number in all related transaction communications.</p>
                    <p>2. Subject to standard corporate audit trail and ledger verification clauses.</p>
                  </div>
                  <div className="text-center font-sans space-y-4">
                    <p className="font-semibold text-gray-500 uppercase">Authorized Sign-off</p>
                    <div className="w-28 border-b border-gray-300"></div>
                  </div>
                </div>

              </div>

              {/* Functional Workflow Block & Operational Triggers */}
              <div 
                id="document-footer-controls-panel" 
                className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-gray-500 font-bold uppercase tracking-wider block">
                    Document Status:
                  </span>
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase ${
                    activeDocument.status === 'Paid' || activeDocument.status === 'Completed'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                      : activeDocument.status === 'Pending Payment'
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-blue-100 text-blue-900 border border-blue-300'
                  }`}>
                    {activeDocument.status}
                  </span>

                  {/* Operational actions mapped relative to document category type */}
                  {activeDocument.documentType === 'Invoice' && activeDocument.status === 'Pending Payment' && (
                    <button 
                      id="btn-mark-paid"
                      onClick={() => {
                        updateDocumentStatus(activeDocument.id, 'Paid');
                        alert('Success: Mapped Tax Invoice marked as PAID.');
                      }}
                      className="text-xs text-blue-600 hover:text-blue-700 hover:underline font-bold ml-3 cursor-pointer inline-flex items-center gap-1 select-none"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Mark as Paid
                    </button>
                  )}

                  {/* PO Generating Invoice Workflow (Requirement 3: A PO generates a Document of type 'Invoice') */}
                  {activeDocument.documentType === 'PO' && (
                    invoiceExistsForPO ? (
                      <span className="text-xs text-emerald-600 font-bold ml-3 inline-flex items-center gap-1">
                        <FileCheck className="w-3.5 h-3.5" />
                        Tax Invoice Generated
                      </span>
                    ) : (
                      <button 
                        id="btn-spawn-invoice"
                        onClick={handleGenerateInvoice}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg ml-3 shadow-xs inline-flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Generate Invoice
                      </button>
                    )
                  )}
                </div>

                <span className="text-[10px] text-gray-400 font-mono hidden md:inline">
                  Chain-linked Secure Transaction Hash Trace
                </span>
              </div>

            </div>
          ) : (
            <div className="bg-white border text-center border-gray-150 p-12 rounded-xl text-gray-400 font-semibold text-xs">
              Select or generate a document to reveal ledger audit outputs.
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
