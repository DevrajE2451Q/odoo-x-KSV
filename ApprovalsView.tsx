import React, { useState } from 'react';
import { useERP } from './ERPContext';
import { Check, Clock, X, AlertTriangle, FileCheck, ThumbsUp, Layers } from 'lucide-react';

interface ApprovalsViewProps {
  setActiveTab: (tab: string) => void;
}

export const ApprovalsView: React.FC<ApprovalsViewProps> = ({ setActiveTab }) => {
  const { workflows, processApproval, quotations, rfqs, currentRole, users } = useERP();
  const [selectedWfId, setSelectedWfId] = useState<string | null>(
    workflows.length > 0 ? workflows[0].id : null
  );
  
  const [remarks, setRemarks] = useState('');

  const activeWorkflow = workflows.find(w => w.id === selectedWfId) || (workflows.length > 0 ? workflows[0] : null);
  
  const relatedQuotation = activeWorkflow && quotations.find(q => q.id === activeWorkflow.quotationId);
  const relatedRfq = activeWorkflow && rfqs.find(r => r.id === activeWorkflow.rfqId);

  const handleAction = (action: 'Approved' | 'Rejected') => {
    if (!activeWorkflow) return;
    
    // Find current awaiting step
    const stepIndex = activeWorkflow.steps.findIndex(s => s.status === 'Awaiting');
    if (stepIndex === -1) {
      alert('This workflow has already been fully processed.');
      return;
    }

    processApproval(activeWorkflow.id, stepIndex, action, remarks || 'Approved with standard supplier delivery clauses.');
    setRemarks('');
    
    if (action === 'Approved') {
      if (stepIndex === 1) {
        alert('L1 Review approved! Advanced to L2 approval check.');
      } else {
        alert('Executive sign-off complete! Purchase Order and Invoice have been auto-generated with tax configurations. Navigating to Invoices ledger.');
        setActiveTab('Invoices');
      }
    } else {
      alert('Workflow rejected. Bidding selection released back to RFP directory.');
    }
  };

  return (
    <div id="approvals-view-wrapper" className="space-y-6 animate-in fade-in duration-200">
      
      {/* Title Header */}
      <div id="approvals-view-header" className="border-b border-gray-100 pb-5">
        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Screen 8 Workspace</span>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
          <Layers className="text-slate-700 w-6 h-6" />
          Approval Workflows
        </h1>
        <p className="text-xs text-gray-500 mt-1">Multi-authority financial checks and supply order authorizations</p>
      </div>

      {activeWorkflow ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Left panel: List of active pending workflows to toggle between */}
          <div className="lg:col-span-3 space-y-3">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block pl-1">Approval queue</span>
            {workflows.map((wf) => (
              <button
                key={wf.id}
                onClick={() => setSelectedWfId(wf.id)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all flex flex-col gap-1.5 cursor-pointer ${
                  selectedWfId === wf.id
                    ? 'bg-blue-50/65 border-blue-200 shadow-sm'
                    : 'bg-white border-gray-150 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-bold text-gray-800">{wf.vendorName}</span>
                  <span className="text-[10px] bg-amber-150 text-amber-900 px-1.5 py-0.5 rounded font-black font-semibold">
                    {wf.status}
                  </span>
                </div>
                <div className="flex items-center justify-between w-full mt-0.5">
                  <span className="text-[10px] text-gray-400 font-semibold font-mono uppercase">ID: {wf.id.split('_')[0].toUpperCase()}</span>
                  <span className="text-[11px] font-extrabold text-blue-600">₹ {wf.amount.toLocaleString()}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Right panel: Active Workflow Detail Workspace (Screen 8 Layout) */}
          <div className="lg:col-span-9 bg-white border border-gray-150 rounded-xl shadow-md p-6 space-y-6">
            
            <div className="border-b border-gray-50 pb-4">
              <h2 className="text-sm font-black text-gray-800 uppercase tracking-wide">Approval Workflow Status</h2>
              <p className="text-xs text-gray-600 mt-1 font-semibold uppercase font-mono text-slate-500">
                RFQ: {relatedRfq ? relatedRfq.title : 'office furniture Q2'} - Vendor: {activeWorkflow.vendorName} - amount: ₹ {activeWorkflow.amount.toLocaleString()}
              </p>
            </div>

            {/* Stepper Timeline circles (Directly replicas Screen 8 line steps) */}
            <div id="po-timeline" className="flex items-center justify-between py-2 max-w-2xl mx-auto relative mb-6">
              <div className="absolute inset-x-12 top-11 -translate-y-1/2 h-0.5 bg-gray-200 -z-10" />
              {[
                { step: 1, label: 'Submitted', key: 'Submitted' },
                { step: 2, label: 'L1 Review', key: 'L1 Review' },
                { step: 3, label: 'L2 approval', key: 'L2 Approval' },
                { step: 4, label: 'Generate PO', key: 'Approved' }
              ].map((timelineStep) => {
                const isStepFinished = 
                  activeWorkflow.status === 'Approved' ||
                  (timelineStep.step === 1 && activeWorkflow.status !== 'Submitted') ||
                  (timelineStep.step === 2 && (activeWorkflow.status === 'L2 Approval' || activeWorkflow.status === 'Approved')) ||
                  (timelineStep.step === 3 && activeWorkflow.status === 'Approved');

                const isStepActive = 
                  activeWorkflow.status === timelineStep.key ||
                  (timelineStep.step === 1 && activeWorkflow.status === 'Submitted') ||
                  (timelineStep.step === 2 && activeWorkflow.status === 'L1 Review') ||
                  (timelineStep.step === 3 && activeWorkflow.status === 'L2 Approval');

                return (
                  <div key={timelineStep.step} className="flex flex-col items-center gap-1.5 bg-white px-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all border ${
                      isStepFinished
                        ? 'bg-emerald-500 text-white border-emerald-55'
                        : isStepActive
                        ? 'bg-amber-400 text-white border-amber-300 ring-4 ring-amber-50'
                        : 'bg-gray-50 text-gray-400 border-gray-200'
                    }`}>
                      {isStepFinished ? <Check className="w-4 h-4" /> : timelineStep.step}
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${
                      isStepActive ? 'text-amber-600' : isStepFinished ? 'text-emerald-600' : 'text-gray-400'
                    }`}>
                      {timelineStep.label}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              
              {/* Left Column: APPROVAL CHAIN LIST (Matches Screen 8 left) */}
              <div className="space-y-4">
                <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block pl-0.5">Approval Chain</span>
                
                <div className="space-y-4 relative pl-3 border-l-2 border-dashed border-gray-150">
                  {activeWorkflow.steps.map((chainStep, index) => {
                    const isDone = chainStep.status === 'Approved';
                    const isAwaiting = chainStep.status === 'Awaiting';
                    const isPending = chainStep.status === 'Pending';

                    return (
                      <div key={index} className="relative flex items-start gap-3 pl-3">
                        {/* Status Icon */}
                        <div className="absolute -left-6 top-0 mt-0.5">
                          {isDone ? (
                            <span className="w-5 h-5 rounded-full bg-emerald-500 border border-emerald-400 text-white flex items-center justify-center">
                              <Check className="w-3.5 h-3.5" />
                            </span>
                          ) : isAwaiting ? (
                            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 border border-blue-200 flex items-center justify-center animate-pulse">
                              <Clock className="w-3.5 h-3.5" />
                            </span>
                          ) : (
                            <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-400 border border-gray-200 flex items-center justify-center">
                              <Clock className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>

                        <div>
                          <span className="text-xs font-bold text-gray-800 block">
                            {chainStep.name} <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">({chainStep.role})</span>
                          </span>
                          {isDone ? (
                            <div className="mt-0.5">
                              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded">Approved</span>
                              {chainStep.timestamp && (
                                <span className="text-[9px] text-gray-400 font-semibold font-mono block mt-1">on {chainStep.timestamp}</span>
                              )}
                              {chainStep.remarks && (
                                <span className="text-[10px] text-gray-500 mt-1 italic block">"{chainStep.remarks}"</span>
                              )}
                            </div>
                          ) : isAwaiting ? (
                            <div className="mt-0.5">
                              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1 py-0.5 rounded">Awaiting signoff</span>
                              <span className="text-[9px] text-gray-400 font-semibold font-mono block mt-1">Assigned - today's ledger dispatch</span>
                            </div>
                          ) : (
                            <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-1 py-0.5 rounded inline-block mt-0.5">Pending L1 authority Approval</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Remarks comment box (Matches Screen 8) */}
                <div className="pt-4 border-t border-gray-100 space-y-2">
                  <label className="text-xs font-bold text-gray-650 block pl-0.5">Approval Remarks</label>
                  <textarea
                    rows={3}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Add your comments or conditions...."
                    className="w-full text-xs font-medium border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  />
                </div>
              </div>

              {/* Right Column: QUOTATIONS SUMMARY CARD (Matches Screen 8 right) */}
              <div id="quotation-summary-card-block" className="space-y-4">
                <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block pl-0.5">Quotations Summary</span>
                
                <div className="bg-slate-50 border border-gray-225 rounded-xl p-5 space-y-4">
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between text-xs pb-2.5 border-b border-gray-200">
                      <span className="text-gray-500 font-bold">Vendor:</span>
                      <span className="font-extrabold text-gray-800">{activeWorkflow.vendorName}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs pb-2.5 border-b border-gray-200">
                      <span className="text-gray-500 font-bold">Total金額:</span>
                      <span className="font-black text-sm text-blue-600">₹ {activeWorkflow.amount.toLocaleString()}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs pb-2.5 border-b border-gray-200">
                      <span className="text-gray-500 font-bold">Delivery timeline:</span>
                      <span className="font-semibold text-gray-830">
                        {relatedQuotation ? relatedQuotation.deliveryDays : 10} days
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pb-2.5">
                      <span className="text-gray-500 font-bold">Rating quality:</span>
                      <span className="font-bold text-amber-500">
                        ⭐ {relatedQuotation ? relatedQuotation.rating.toFixed(1) : '4.5'} / 5.0
                      </span>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  {activeWorkflow.status !== 'Approved' && activeWorkflow.status !== 'Rejected' ? (
                    <div className="flex items-center gap-3 pt-2">
                      <button
                        type="button"
                        id="btn-wf-reject"
                        onClick={() => handleAction('Rejected')}
                        className="flex-1 bg-white hover:bg-slate-50 border border-gray-300 text-gray-700 text-xs font-bold py-2.5 rounded-lg shadow-xs cursor-pointer text-center"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        id="btn-wf-approve"
                        onClick={() => handleAction('Approved')}
                        className="flex-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 rounded-lg shadow-sm cursor-pointer text-center"
                      >
                        Approve
                      </button>
                    </div>
                  ) : (
                    <div className="pt-2 bg-white/40 p-3.5 rounded text-center border border-dashed border-gray-250">
                      <span className="text-xs font-bold text-slate-800 flex items-center justify-center gap-1.5">
                        <ThumbsUp className="w-4 h-4 text-emerald-500" />
                        This chain is fully complete!
                      </span>
                    </div>
                  )}
                </div>
              </div>

            </div>

          </div>
        </div>
      ) : (
        <div className="bg-white border text-center border-gray-150 p-12 rounded-xl text-gray-400 font-semibold text-xs">
          No approvals pending in the authorization queue.
        </div>
      )}
    </div>
  );
};
