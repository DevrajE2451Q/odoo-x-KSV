import React, { useState } from 'react';
import { useERP } from './ERPContext';
import { RFQLineItem, RFQ } from './types';
import { Plus, Trash2, Calendar, FileText, CheckCircle2, ShoppingBag, FolderOpen, ArrowRight, UserPlus, X, Paperclip } from 'lucide-react';

interface RFQsViewProps {
  createRfqMode: boolean;
  setCreateRfqMode: (mode: boolean) => void;
  onBidClick?: (rfqId: string) => void;
}

export const RFQsView: React.FC<RFQsViewProps> = ({ 
  createRfqMode, 
  setCreateRfqMode,
  onBidClick 
}) => {
  const { rfqs, vendors, createRFQ, currentRole } = useERP();
  
  // RFQ Creation States
  const [rfqTitle, setRfqTitle] = useState('office furniture procurement q2');
  const [category, setCategory] = useState('Furniture');
  const [deadline, setDeadline] = useState('2025-06-15');
  const [description, setDescription] = useState('Ergonomic chairs and standing desks for 3rd floor');
  const [currentStep, setCurrentStep] = useState(1);

  // Line items state (Prepopulated as per Screen 5 mockup)
  const [lineItems, setLineItems] = useState<Omit<RFQLineItem, 'id'>[]>([
    { item: 'Ergonomic chair', qty: 25, unit: 'NOS' },
    { item: 'Standing desks', qty: 10, unit: 'NOS' }
  ]);

  // Selected vendor states for RFQs assignment
  const [assignedVendorIds, setAssignedVendorIds] = useState<string[]>(['v1', 'v2']); // Infra, TechCore preselected
  const [vendorSelectOpen, setVendorSelectOpen] = useState(false);

  // Simulated attachments
  const [uploadedFiles, setUploadedFiles] = useState<string[]>(['room_layout_diagram.pdf']);

  const handleAddLineItem = () => {
    setLineItems([...lineItems, { item: '', qty: 1, unit: 'NOS' }]);
  };

  const handleRemoveLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleLineItemChange = (index: number, key: keyof Omit<RFQLineItem, 'id'>, value: any) => {
    const updated = [...lineItems];
    updated[index] = {
      ...updated[index],
      [key]: value
    };
    setLineItems(updated);
  };

  const handleToggleVendor = (id: string) => {
    if (assignedVendorIds.includes(id)) {
      setAssignedVendorIds(assignedVendorIds.filter(vid => vid !== id));
    } else {
      setAssignedVendorIds([...assignedVendorIds, id]);
    }
  };

  const handleSubmitRFQ = (status: 'Draft' | 'Sent') => {
    if (!rfqTitle) {
      alert('Please enter an RFQ title');
      return;
    }
    if (lineItems.length === 0 || lineItems.some(i => !i.item)) {
      alert('Please fill out all line item rows.');
      return;
    }
    if (assignedVendorIds.length === 0) {
      alert('Please assign at least one vendor.');
      return;
    }

    const itemsWithIds: RFQLineItem[] = lineItems.map((v, index) => ({
      ...v,
      id: `it_${index}_${Date.now()}`
    }));

    createRFQ({
      title: rfqTitle,
      category,
      deadline,
      description,
      items: itemsWithIds,
      assignedVendorIds,
      attachments: uploadedFiles
    });

    // Reset Creation form fields
    setRfqTitle('');
    setCategory('Furniture');
    setDeadline('2025-06-15');
    setDescription('');
    setLineItems([{ item: '', qty: 1, unit: 'NOS' }]);
    setAssignedVendorIds([]);
    setCreateRfqMode(false);
    setCurrentStep(1);
  };

  // Mock file drop handler
  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setUploadedFiles([...uploadedFiles, `document_${uploadedFiles.length + 1}.pdf`]);
  };

  const triggerFileUpload = () => {
    const customNames = ['price_cap_guideline.xlsx', 'tender_bidding_terms.docx', 'space_architectural_grid.pdf'];
    const randomName = customNames[Math.floor(Math.random() * customNames.length)];
    if (!uploadedFiles.includes(randomName)) {
      setUploadedFiles([...uploadedFiles, randomName]);
    }
  };

  return (
    <div id="rfq-view-wrapper" className="space-y-6 animate-in fade-in duration-200">
      
      {/* View Header bar */}
      <div id="rfq-header-container" className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-5 border-b border-gray-100 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <ShoppingBag className="text-slate-700 w-6 h-6" />
            Request For Quotations (RFQ's)
          </h1>
          <p className="text-xs text-gray-500 mt-1">Initiating bidding invitations & supplier quotation tenders</p>
        </div>
        
        {currentRole === 'Procurement Officer' || currentRole === 'Admin' ? (
          <button
            id="btn-rfq-toggle"
            onClick={() => setCreateRfqMode(!createRfqMode)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs py-2 px-4 rounded-lg shadow-xs hover:shadow-sm cursor-pointer transition-all duration-150 active:scale-98 font-semibold"
          >
            {createRfqMode ? 'View Existing RFQs' : '+ Create RFQ'}
          </button>
        ) : null}
      </div>

      {!createRfqMode ? (
        /* LIST OF ACTIVE RFQS */
        <div id="rfqs-list-section" className="space-y-4">
          <div className="bg-white border border-gray-150 rounded-xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="py-3.5 px-4 text-[10px] font-extrabold text-gray-400 uppercase tracking-widest pl-6">RFQ ID</th>
                    <th className="py-3.5 px-4 text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Title</th>
                    <th className="py-3.5 px-4 text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Category</th>
                    <th className="py-3.5 px-4 text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Response Deadline</th>
                    <th className="py-3.5 px-4 text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Invited Vendors</th>
                    <th className="py-3.5 px-4 text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Status</th>
                    <th className="py-3.5 px-4 text-[10px] font-extrabold text-gray-400 uppercase tracking-widest text-right pr-6">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rfqs.map((rfq) => (
                    <tr key={rfq.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 px-4 text-xs font-mono font-bold text-gray-650 pl-6">RFQ-{rfq.id.toUpperCase()}</td>
                      <td className="py-4 px-4 text-xs">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-850 capitalize">{rfq.title}</span>
                          <span className="text-[10px] text-gray-400 line-clamp-1 italic mt-0.5">{rfq.description}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-xs font-medium text-gray-600">{rfq.category}</td>
                      <td className="py-4 px-4 text-xs font-medium text-gray-600">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          {rfq.deadline}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-xs text-gray-500">
                        {rfq.assignedVendorIds.length} partners invited
                      </td>
                      <td className="py-4 px-4 text-xs">
                        <span className={`px-2 py-0.75 rounded-full text-[10px] font-bold tracking-wide uppercase inline-block ${
                          rfq.status === 'PO Generated'
                            ? 'bg-purple-50 text-purple-700 border border-purple-100'
                            : rfq.status === 'Approved'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            : rfq.status === 'Bids Received'
                            ? 'bg-blue-50 text-blue-700 border border-blue-100'
                            : 'bg-slate-55 text-slate-700 border border-slate-200'
                        }`}>
                          {rfq.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-xs text-right pr-6">
                        {currentRole === 'Vendor' ? (
                          <button
                            id={`btn-quote-vendor-submit-${rfq.id}`}
                            onClick={() => onBidClick && onBidClick(rfq.id)}
                            className="bg-emerald-500 hover:bg-emerald-650 text-white font-bold px-3 py-1.5 rounded-lg text-[11px] cursor-pointer shadow-xs transition-colors"
                          >
                            Bid Quotation
                          </button>
                        ) : (
                          <button
                            id={`btn-open-quote-details-${rfq.id}`}
                            onClick={() => onBidClick && onBidClick(rfq.id)}
                            className="bg-white hover:bg-slate-50 border border-gray-350 text-gray-700 font-bold px-3 py-1.5 rounded-lg text-[11px] cursor-pointer shadow-xs"
                          >
                            View Details
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* RFQ CREATOR WIZARD CARD (Matches Screen 5 Layout) */
        <div id="rfq-wizard-card" className="bg-white border border-gray-150 rounded-xl shadow-md p-6 max-w-4xl mx-auto space-y-6">
          <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Screen 5 Form</span>
              <h2 className="text-base font-bold text-gray-800">Create RFQ's</h2>
              <span className="text-xs text-gray-400 block mt-0.5">new request for quotation</span>
            </div>
            <button
              onClick={() => setCreateRfqMode(false)}
              className="p-1 px-2.5 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded"
            >
              Cancel
            </button>
          </div>

          {/* Stepper Wizard Circle Ring (Visually matches Screen 5 Stepper) */}
          <div id="rfq-stepper" className="flex items-center justify-center py-2 max-w-md mx-auto relative mb-6">
            <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-0.5 bg-gray-200 -z-10" />
            <div className="flex items-center justify-between w-full">
              {[
                { step: 1, label: 'RFQ Details' },
                { step: 2, label: 'Items Inventory' },
                { step: 3, label: 'Publish & Assign' }
              ].map((s) => (
                <div key={s.step} className="flex flex-col items-center gap-1.5 bg-white px-2">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(s.step)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      currentStep === s.step
                        ? 'bg-blue-600 text-white ring-4 ring-blue-100 shadow-sm'
                        : currentStep > s.step
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-100 text-gray-400 border border-gray-200'
                    }`}
                  >
                    {s.step}
                  </button>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div id="rfq-wizard-body" className="space-y-6">
            
            {/* Step 1: Core details */}
            {currentStep === 1 && (
              <div id="step-1-details" className="space-y-4 animate-in fade-in slide-in-from-right-3 duration-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-650 tracking-wide block mb-1">RFQ's title *</label>
                    <input
                      type="text"
                      value={rfqTitle}
                      onChange={(e) => setRfqTitle(e.target.value)}
                      placeholder="e.g. Office Furniture procurement Q2"
                      required
                      className="w-full text-xs font-medium border border-gray-300 rounded-lg p-2.5 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-650 tracking-wide block mb-1">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full text-xs font-medium border border-gray-300 bg-white rounded-lg p-2.5"
                    >
                      <option value="Furniture">Furniture</option>
                      <option value="IT Hardware">IT Hardware</option>
                      <option value="Constructions">Constructions</option>
                      <option value="Logistics">Logistics</option>
                      <option value="Stationery">Stationery</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-650 tracking-wide block mb-1">Deadline *</label>
                    <input
                      type="date"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      required
                      className="w-full text-xs font-medium border border-gray-300 rounded-lg p-2.5"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-650 tracking-wide block mb-1">Description</label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide specific technical instructions or terms..."
                    className="w-full text-xs font-medium border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer ml-auto"
                  >
                    Next Step: Items Inventory
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Line Items Inventory (Prepopulated item/qty from Screen 5) */}
            {currentStep === 2 && (
              <div id="step-2-items" className="space-y-4 animate-in fade-in slide-in-from-right-3 duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wider block">Line Items Specification</span>
                  <button
                    type="button"
                    id="btn-add-item-row"
                    onClick={handleAddLineItem}
                    className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 bg-blue-50 hover:bg-blue-100/60 px-3 py-1.5 rounded-lg"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    + add line item
                  </button>
                </div>

                <div className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50/20">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50/60 border-b border-gray-200">
                        <th className="py-2.5 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-6">item</th>
                        <th className="py-2.5 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest w-32">qty</th>
                        <th className="py-2.5 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest w-32">Unit</th>
                        <th className="py-2.5 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest w-[60px] text-center pr-6">Delete</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-150">
                      {lineItems.map((row, index) => (
                        <tr key={index} className="bg-white hover:bg-gray-50/40">
                          <td className="py-2.5 px-4 pl-6">
                            <input
                              type="text"
                              value={row.item}
                              required
                              onChange={(e) => handleLineItemChange(index, 'item', e.target.value)}
                              placeholder="e.g. Ergonomic chair"
                              className="w-full text-xs font-medium border border-gray-200 rounded p-1.5"
                            />
                          </td>
                          <td className="py-2.5 px-4 w-32">
                            <input
                              type="number"
                              min={1}
                              value={row.qty}
                              onChange={(e) => handleLineItemChange(index, 'qty', parseInt(e.target.value) || 1)}
                              className="w-full text-xs font-medium border border-gray-200 rounded p-1.5"
                            />
                          </td>
                          <td className="py-2.5 px-4 w-32">
                            <select
                              value={row.unit}
                              onChange={(e) => handleLineItemChange(index, 'unit', e.target.value)}
                              className="w-full text-xs font-semibold border border-gray-200 bg-white rounded p-1.5"
                            >
                              <option value="NOS">NOS</option>
                              <option value="BOX">BOX</option>
                              <option value="SET">SET</option>
                              <option value="KG">KG</option>
                            </select>
                          </td>
                          <td className="py-2.5 px-4 text-center pr-6 w-[60px]">
                            <button
                              type="button"
                              onClick={() => handleRemoveLineItem(index)}
                              className="p-1 px-1.5 rounded hover:bg-rose-50 text-rose-500 hover:text-rose-600 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="text-xs text-gray-500 font-bold hover:text-gray-700"
                  >
                    Back to Details
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer"
                  >
                    Next Step: Assign Vendors
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Publish, Assign suppliers and Attachments upload (Screen 5 right column) */}
            {currentStep === 3 && (
              <div id="step-3-publish" className="space-y-6 animate-in fade-in slide-in-from-right-3 duration-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* ASSIGN VENDORS PANEL (Visually mimics Screen 5) */}
                  <div className="bg-slate-50 border border-gray-200 rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider block">Assign Vendors</span>
                      <button
                        type="button"
                        onClick={() => setVendorSelectOpen(!vendorSelectOpen)}
                        className="text-[11px] text-blue-600 font-bold bg-white border border-gray-220 px-2.5 py-1 rounded"
                      >
                        + add vendor
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {assignedVendorIds.map((vid) => {
                        const vendor = vendors.find(v => v.id === vid);
                        return vendor ? (
                          <span
                            key={vid}
                            className="bg-white border border-gray-250 text-gray-700 font-semibold text-xs px-3 py-1.5 rounded-lg inline-flex items-center gap-2 shadow-xs"
                          >
                            {vendor.name}
                            <button
                              type="button"
                              onClick={() => handleToggleVendor(vid)}
                              className="hover:text-rose-500 p-0.5 rounded"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ) : null;
                      })}
                      {assignedVendorIds.length === 0 && (
                        <span className="text-xs text-gray-400 italic">No suppliers assigned yet. Please assign at least one.</span>
                      )}
                    </div>

                    {vendorSelectOpen && (
                      <div className="bg-white border border-gray-200 rounded-lg p-2 max-h-40 overflow-y-auto space-y-1">
                        {vendors
                          .filter(v => v.status === 'Active')
                          .map((vendor) => (
                            <label
                              key={vendor.id}
                              className="flex items-center gap-2 p-1.5 hover:bg-gray-50 rounded text-xs cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={assignedVendorIds.includes(vendor.id)}
                                onChange={() => handleToggleVendor(vendor.id)}
                              />
                              <div className="flex flex-col">
                                <span className="font-bold text-gray-700">{vendor.name}</span>
                                <span className="text-[10px] text-gray-400">{vendor.category} - ⭐ {vendor.rating.toFixed(1)}</span>
                              </div>
                            </label>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* Drag-and-drop Attachments section (Matches Screen 5 bottom visual) */}
                  <div className="space-y-4">
                    <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider block">Attachments</span>
                    
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handleFileDrop}
                      onClick={triggerFileUpload}
                      className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center bg-gray-50/50 hover:bg-gray-50 cursor-pointer hover:border-gray-450 transition-all"
                    >
                      <Paperclip className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <span className="text-xs font-medium text-slate-650 block">Drag & drop files or click to upload</span>
                      <span className="text-[10px] text-gray-400 block mt-1">Accepts PDF, XLS, Docx layout templates (max. 5MB)</span>
                    </div>

                    {uploadedFiles.length > 0 && (
                      <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg space-y-1.5">
                        <span className="text-[10px] font-bold text-gray-500 uppercase block">Selected layouts</span>
                        {uploadedFiles.map((f, i) => (
                          <div key={i} className="flex items-center justify-between text-xs text-gray-600 bg-white px-2 py-1.5 rounded border border-gray-150">
                            <span className="truncate max-w-xs">{f}</span>
                            <button
                              type="button"
                              onClick={() => setUploadedFiles(uploadedFiles.filter((_, idx) => idx !== i))}
                              className="text-rose-500 hover:text-rose-700"
                            >
                              Delete
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>

                <div className="flex items-center justify-between border-t border-gray-150 pt-5 mt-2">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="text-xs text-gray-500 font-bold hover:text-gray-700"
                  >
                    Back
                  </button>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      id="btn-rfq-save-draft"
                      onClick={() => handleSubmitRFQ('Draft')}
                      className="bg-white hover:bg-slate-50 border border-gray-300 text-gray-700 text-xs font-bold px-4 py-2 rounded-lg cursor-pointer flex items-center shadow-xs"
                    >
                      Save Draft
                    </button>
                    <button
                      type="button"
                      id="btn-rfq-save-send"
                      onClick={() => handleSubmitRFQ('Sent')}
                      className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-5 py-2.5 rounded-lg cursor-pointer flex items-center shadow-sm"
                    >
                      Save & Send to Vendors
                    </button>
                  </div>
                </div>

              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
};
