import React, { useState } from 'react';
import { useERP } from './ERPContext';
import { Quotation, RFQ, RFQLineItem, QuotationLineItem } from './types';
import { FileText, Coins, Percent, Calendar, CheckSquare, Award, AlertCircle, Sparkles, Send, HardDrive } from 'lucide-react';

interface QuotationsViewProps {
  selectedRfqId: string | null;
  setSelectedRfqId: (id: string | null) => void;
  setActiveTab: (tab: string) => void;
}

export const QuotationsView: React.FC<QuotationsViewProps> = ({
  selectedRfqId,
  setSelectedRfqId,
  setActiveTab
}) => {
  const { 
    rfqs, 
    vendors, 
    quotations, 
    submitQuotation, 
    selectWinningQuotation, 
    currentRole, 
    currentUser 
  } = useERP();

  // Active RFQ context for either viewing bids or submitting a bid
  const activeRfqId = selectedRfqId || (rfqs.length > 0 ? rfqs[0].id : null);
  const activeRFQ = rfqs.find(r => r.id === activeRfqId);

  // Switch between comparative mode (officer/admin) and bid submission active mode (vendor)
  const [viewMode, setViewMode] = useState<'compare' | 'submit'>(
    currentRole === 'Vendor' ? 'submit' : 'compare'
  );

  // SUBMIT BID FORM STATES
  const [bidPrices, setBidPrices] = useState<Record<string, number>>({
    'item1': 3500,
    'item2': 8200
  });
  const [deliveryDays, setDeliveryDays] = useState<Record<string, number>>({
    'item1': 7,
    'item2': 14
  });
  const [gstPercent, setGstPercent] = useState(18);
  const [paymentTerms, setPaymentTerms] = useState('Payment terms: 20 days net...');
  const [biddingNotes, setBiddingNotes] = useState('Immediate stock clearance bid with hydraulic warranty.');

  const handleUnitPriceChange = (itId: string, val: string) => {
    const num = parseFloat(val) || 0;
    setBidPrices({
      ...bidPrices,
      [itId]: num
    });
  };

  const handleDeliveryChange = (itId: string, val: string) => {
    const num = parseInt(val) || 1;
    setDeliveryDays({
      ...deliveryDays,
      [itId]: num
    });
  };

  // Subtotal and GST calculations for Screen 6
  const computeSubmissionMath = () => {
    if (!activeRFQ) return { subtotal: 0, gstAmount: 0, grandTotal: 0 };
    
    let subtotal = 0;
    activeRFQ.items.forEach(it => {
      const price = bidPrices[it.id] !== undefined ? bidPrices[it.id] : 3500;
      subtotal += price * it.qty;
    });

    const gstAmount = Math.round((subtotal * (gstPercent / 100)) * 100) / 100;
    const grandTotal = subtotal + gstAmount;

    return { subtotal, gstAmount, grandTotal };
  };

  const { subtotal, gstAmount, grandTotal } = computeSubmissionMath();

  const handleBidSubmit = () => {
    if (!activeRFQ || !currentUser?.vendorId) {
      alert('Error: No active RFQ of valid Vendor profile found.');
      return;
    }

    const assignedVendor = vendors.find(v => v.id === currentUser.vendorId);
    if (!assignedVendor) return;

    // Convert line items to quotation format
    const quoteItems: QuotationLineItem[] = activeRFQ.items.map(it => {
      const price = bidPrices[it.id] !== undefined ? bidPrices[it.id] : 3500;
      return {
        ...it,
        unitPrice: price,
        total: price * it.qty
      };
    });

    const deliveryArray = Object.values(deliveryDays) as number[];
    const averageDelivery = deliveryArray.reduce((sum: number, d: number) => sum + d, 0) / (deliveryArray.length || 1);

    submitQuotation({
      rfqId: activeRFQ.id,
      vendorId: assignedVendor.id,
      vendorName: assignedVendor.name,
      items: quoteItems,
      subtotal,
      gstPercent,
      gstAmount,
      grandTotal,
      deliveryDays: Math.ceil(averageDelivery),
      paymentTerms,
      notes: biddingNotes,
      rating: assignedVendor.rating
    });

    alert(`Successfully submitted quotation of INR ${grandTotal.toLocaleString()}! Go to Comparison or Approvals tab to review status.`);
    setViewMode('compare');
  };

  // COMPARE SCREEN STATE (Screen 7 Matrix Data)
  const activeQuotations = quotations.filter(q => q.rfqId === activeRfqId);

  // Find lowest price to highlight green (Screen 7 Requirement)
  const getLowestPriceQuoteId = () => {
    if (activeQuotations.length === 0) return null;
    let lowestQuote = activeQuotations[0];
    activeQuotations.forEach(q => {
      if (q.grandTotal < lowestQuote.grandTotal) {
        lowestQuote = q;
      }
    });
    return lowestQuote.id;
  };

  const lowestPriceQuoteId = getLowestPriceQuoteId();

  return (
    <div id="quotations-view-wrapper" className="space-y-6 animate-in fade-in duration-200">
      
      {/* RFQ selector header dropdown */}
      <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">
          Active RFP Context Selection:
          <select
            value={activeRfqId || ''}
            onChange={(e) => {
              setSelectedRfqId(e.target.value || null);
            }}
            className="block w-full sm:w-80 mt-1 pb-1.5 focus:border-blue-500 outline-none text-xs font-bold text-gray-800 bg-white border border-gray-300 rounded p-1.5 cursor-pointer"
          >
            {rfqs.map(r => (
              <option key={r.id} value={r.id}>
                {r.title} ({r.category})
              </option>
            ))}
          </select>
        </label>

        {/* View Mode buttons depending on role */}
        <div className="flex gap-2.5">
          <button
            onClick={() => setViewMode('compare')}
            className={`text-xs px-3.5 py-2 font-bold rounded-lg border transition-all cursor-pointer ${
              viewMode === 'compare'
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-white text-gray-600 hover:bg-gray-50 border-gray-300'
            }`}
          >
            Comparative Matrix
          </button>
          {currentRole === 'Vendor' && (
            <button
              onClick={() => setViewMode('submit')}
              className={`text-xs px-3.5 py-2 font-bold rounded-lg border transition-all cursor-pointer ${
                viewMode === 'submit'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border-gray-300'
              }`}
            >
              Submit Bid Proposal
            </button>
          )}
        </div>
      </div>

      {viewMode === 'compare' ? (
        /* SCREEN 7: QUOTATION COMPARISON SCREEN */
        <div id="comparison-view-block" className="space-y-6">
          <div className="border-b border-gray-100 pb-3">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Screen 7 Ledger</span>
            <h2 className="text-lg font-bold text-gray-800">Quotation Comparison</h2>
            {activeRFQ && (
              <span className="text-xs text-gray-500 block mt-0.5">
                RFQ: <span className="font-semibold">{activeRFQ.title}</span> - {activeQuotations.length} quotations received
              </span>
            )}
          </div>

          {activeQuotations.length > 0 ? (
            <div className="space-y-4">
              
              {/* Green layout notice matching Mockup Screen 7 footer instruction */}
              <div className="bg-emerald-50 text-emerald-800 border border-emerald-100 p-3 rounded-lg flex items-center gap-2 text-xs font-semibold">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Green column indicator = lowest submitted price. Selecting a vendor initiates the managers approval chain.</span>
              </div>

              {/* Side by side grid visual (Replicates Screen 7 columns precisely!) */}
              <div className="bg-white border border-gray-150 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse table-fixed min-w-[700px]">
                    <thead>
                      <tr className="bg-gray-50/80 border-b border-gray-150 text-center">
                        <th className="py-4 px-4 text-xs font-bold text-gray-400 text-left uppercase tracking-wider w-[180px]">Criteria</th>
                        {activeQuotations.map((q) => {
                          const isLowest = q.id === lowestPriceQuoteId;
                          return (
                            <th 
                              key={q.id} 
                              className={`py-4 px-4 text-xs font-extrabold border-l border-gray-150 uppercase tracking-wide truncate ${
                                isLowest ? 'bg-emerald-50/50 text-emerald-800 font-black' : 'text-gray-750'
                              }`}
                            >
                              {q.vendorName} {isLowest && '(Lowest Price)'}
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-150">
                      {/* Row 1: Grand Total */}
                      <tr className="hover:bg-gray-50/30 transition-colors">
                        <td className="py-4 px-5 text-xs text-gray-500 font-bold">Grand Total</td>
                        {activeQuotations.map((q) => {
                          const isLowest = q.id === lowestPriceQuoteId;
                          return (
                            <td 
                              key={q.id} 
                              className={`py-4 px-6 text-center text-sm font-extrabold border-l border-gray-150 ${
                                isLowest ? 'bg-emerald-500/10 text-emerald-700 font-black' : 'text-gray-900'
                              }`}
                            >
                              ₹ {q.grandTotal.toLocaleString()}
                            </td>
                          );
                        })}
                      </tr>

                      {/* Row 2: GST % */}
                      <tr className="hover:bg-gray-50/30 transition-colors">
                        <td className="py-4 px-5 text-xs text-gray-500 font-bold">GST %</td>
                        {activeQuotations.map((q) => {
                          const isLowest = q.id === lowestPriceQuoteId;
                          return (
                            <td 
                              key={q.id} 
                              className={`py-4 px-6 text-center text-xs font-medium border-l border-gray-150 ${
                                isLowest ? 'bg-emerald-50/30 text-emerald-800' : 'text-gray-700'
                              }`}
                            >
                              {q.gstPercent}%
                            </td>
                          );
                        })}
                      </tr>

                      {/* Row 3: Delivery Days */}
                      <tr className="hover:bg-gray-50/30 transition-colors">
                        <td className="py-4 px-5 text-xs text-gray-500 font-bold">Delivery (days)</td>
                        {activeQuotations.map((q) => {
                          const isLowest = q.id === lowestPriceQuoteId;
                          return (
                            <td 
                              key={q.id} 
                              className={`py-4 px-6 text-center text-xs font-semibold border-l border-gray-150 ${
                                isLowest ? 'bg-emerald-50/30 text-emerald-800' : 'text-gray-700'
                              }`}
                            >
                              {q.deliveryDays} days
                            </td>
                          );
                        })}
                      </tr>

                      {/* Row 4: Vendor Rating */}
                      <tr className="hover:bg-gray-50/30 transition-colors">
                        <td className="py-4 px-5 text-xs text-gray-500 font-bold font-semibold">Vendor rating</td>
                        {activeQuotations.map((q) => {
                          const isLowest = q.id === lowestPriceQuoteId;
                          return (
                            <td 
                              key={q.id} 
                              className={`py-4 px-6 text-center text-xs font-bold border-l border-gray-150 ${
                                isLowest ? 'bg-emerald-50/30 text-emerald-700' : 'text-amber-500'
                              }`}
                            >
                              ⭐ {q.rating.toFixed(1)} / 5
                            </td>
                          );
                        })}
                      </tr>

                      {/* Row 5: Payment Terms */}
                      <tr className="hover:bg-gray-50/30 transition-colors col-span-1">
                        <td className="py-4 px-5 text-xs text-gray-500 font-bold">Payment terms</td>
                        {activeQuotations.map((q) => {
                          const isLowest = q.id === lowestPriceQuoteId;
                          return (
                            <td 
                              key={q.id} 
                              className={`py-4 px-6 text-center text-xs text-gray-650 italic font-medium border-l border-gray-150 ${
                                isLowest ? 'bg-emerald-50/35 text-emerald-800 font-semibold' : 'text-gray-600'
                              }`}
                            >
                              {q.paymentTerms}
                            </td>
                          );
                        })}
                      </tr>

                      {/* Row 6: Selection Actions (Matches Screen 7 Buttons) */}
                      <tr className="bg-gray-50/40 border-t border-gray-150">
                        <td className="py-4 px-5 text-xs text-gray-400 italic">Select Winner</td>
                        {activeQuotations.map((q) => {
                          const isLowest = q.id === lowestPriceQuoteId;
                          const isSelected = q.status === 'Reviewed' || q.status === 'Approved';
                          return (
                            <td 
                              key={q.id} 
                              className={`py-4 px-6 text-center border-l border-gray-150 ${
                                isLowest ? 'bg-emerald-50/30' : ''
                              }`}
                            >
                              <button
                                id={`btn-select-quotation-${q.id}`}
                                disabled={isSelected}
                                onClick={() => {
                                  selectWinningQuotation(q.id);
                                  alert(`Selected ${q.vendorName} as bid finalist! Moving process to the Approvals tab.`);
                                  setActiveTab('Approvals');
                                }}
                                className={`text-xs font-bold px-4 py-2 rounded-lg transition-all shadow-xs cursor-pointer ${
                                  isSelected 
                                    ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-default'
                                    : isLowest
                                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                                    : 'bg-indigo-650 hover:bg-indigo-700 text-white'
                                }`}
                              >
                                {isSelected ? 'In Approvals' : isLowest ? 'Select & Approve' : 'Select'}
                              </button>
                            </td>
                          );
                        })}
                      </tr>

                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border text-center border-gray-150 p-12 rounded-xl text-gray-400 font-semibold text-xs">
              No quotations submitted yet for this RFP. 
              {currentRole === 'Vendor' && " Switch back to 'Submit Bid Proposal' above to register the first pricing bid."}
            </div>
          )}
        </div>
      ) : (
        /* SCREEN 6: VENDOR QUOTATION SUBMISSION SCREEN */
        <div id="quotation-submission-form" className="bg-white border border-gray-150 rounded-xl shadow-md p-6 max-w-4xl mx-auto space-y-6">
          <div className="border-b border-gray-100 pb-3">
            <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block">Screen 6 Bidding Console</span>
            <h2 className="text-lg font-bold text-gray-800">Submit Quotations</h2>
            {activeRFQ && (
              <span className="text-xs text-gray-500 block mt-0.5">
                RFQ: <span className="font-bold">{activeRFQ.title}</span> - deadline {activeRFQ.deadline}
              </span>
            )}
          </div>

          {activeRFQ ? (
            <div className="space-y-6">
              
              {/* RFQ Summary row directly matching Screen 6 screenshot top banner */}
              <div className="bg-slate-50 border border-gray-220 rounded-xl p-4 text-xs font-bold text-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-black block mb-1 tracking-wider">RFQ SUMMARY REQUIREMENTS</span>
                {activeRFQ.items.map((it, i) => `${it.item} * ${it.qty}`).join(', ')} - category {activeRFQ.category}
              </div>

              {/* Price Entry Matrix (Matches Screen 6) */}
              <div className="border border-gray-150 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-55/60 border-b border-gray-150">
                      <th className="py-3 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-6">Item</th>
                      <th className="py-3 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest w-24 text-center">Qty</th>
                      <th className="py-3 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest w-40 text-center">Unit Price (INR)</th>
                      <th className="py-3 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest w-32 text-center">Total (INR)</th>
                      <th className="py-3 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest w-36 text-center pr-6">Delivery (days)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {activeRFQ.items.map((it) => {
                      const uPrice = bidPrices[it.id] !== undefined ? bidPrices[it.id] : 3500;
                      const dDays = deliveryDays[it.id] !== undefined ? deliveryDays[it.id] : 7;
                      const lineTotal = uPrice * it.qty;

                      return (
                        <tr key={it.id} className="bg-white hover:bg-gray-50/50">
                          <td className="py-3 px-4 text-xs font-bold text-gray-800 pl-6">{it.item}</td>
                          <td className="py-3 px-4 text-xs text-center font-semibold text-gray-500">{it.qty}</td>
                          <td className="py-3 px-4 w-40 text-center">
                            <div className="relative rounded-md shadow-xs max-w-[140px] mx-auto">
                              <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-gray-400 text-[11px] font-bold">₹</span>
                              <input
                                type="number"
                                min={1}
                                value={uPrice}
                                onChange={(e) => handleUnitPriceChange(it.id, e.target.value)}
                                className="w-full pl-6 pr-2 py-1.5 border border-gray-305 text-xs bg-white text-center rounded font-semibold focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                          </td>
                          <td className="py-3 px-4 text-xs text-center font-bold text-gray-800">
                            ₹ {lineTotal.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 w-36 text-center pr-6">
                            <input
                              type="number"
                              min={1}
                              value={dDays}
                              onChange={(e) => handleDeliveryChange(it.id, e.target.value)}
                              className="w-full max-w-[80px] mx-auto text-center border border-gray-300 rounded p-1 text-xs font-medium"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Bottom Taxes & Subtotal layout (Matches Screen 6) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="space-y-4">
                  {/* Tax Field input */}
                  <div>
                    <label className="text-xs font-bold text-gray-650 block mb-1">tax / GST %</label>
                    <div className="relative rounded-md max-w-[100px]">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={gstPercent}
                        onChange={(e) => setGstPercent(parseInt(e.target.value) || 0)}
                        className="w-full text-xs font-extrabold border border-gray-300 rounded-lg p-2 pr-6 text-center"
                      />
                      <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400 text-xs font-bold">%</span>
                    </div>
                  </div>

                  {/* Payment Terms and Notes text boxes */}
                  <div>
                    <label className="text-xs font-bold text-gray-650 block mb-1">Note / terms</label>
                    <textarea
                      rows={3}
                      value={paymentTerms}
                      onChange={(e) => setPaymentTerms(e.target.value)}
                      placeholder="e.g. Payment terms: 20 days net..."
                      className="w-full text-xs font-medium border border-gray-300 rounded-lg p-2.5 max-w-md outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-650 block mb-1">Bidding Comments / Note</label>
                    <textarea
                      rows={2}
                      value={biddingNotes}
                      onChange={(e) => setBiddingNotes(e.target.value)}
                      placeholder="Notes regarding shipping or assemblies..."
                      className="w-full text-xs font-medium border border-gray-300 rounded-lg p-2.5 max-w-md"
                    />
                  </div>
                </div>

                {/* Subtotal table matching Screen 6 bottom right precisely */}
                <div className="bg-gray-50/50 border border-gray-150 p-5 rounded-xl space-y-3.5 max-w-sm ml-auto w-full flex flex-col justify-center">
                  <div className="flex items-center justify-between text-xs text-gray-600 font-semibold">
                    <span>Subtotal</span>
                    <span>₹ {subtotal.toLocaleString()}</span>
                  </div>
                  <div id="quote-tax-row" className="flex items-center justify-between text-xs text-gray-600 font-semibold border-b border-gray-200 pb-3">
                    <span>GST ({gstPercent}%)</span>
                    <span>₹ {gstAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between font-black text-sm text-gray-900 pt-1">
                    <span>Grand total</span>
                    <span className="text-blue-600">₹ {grandTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Bottom buttons (Submit vs Save Draft) */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => alert('Quotation draft saved successfully.')}
                  className="bg-white hover:bg-slate-50 border border-gray-300 text-gray-700 text-xs font-bold px-4 py-2 hover:bg-gray-100 rounded-lg shadow-xs"
                >
                  Save Draft
                </button>
                <button
                  type="button"
                  id="btn-submit-quo"
                  onClick={handleBidSubmit}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-5 py-2.5 rounded-lg flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  Submit Quotation
                </button>
              </div>

            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
