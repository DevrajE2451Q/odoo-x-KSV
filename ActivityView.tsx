import React, { useState } from 'react';
import { useERP } from './ERPContext';
import { ActivityLogCategory } from './types';
import { CheckCircle2, Clock, Mail, Users2, FileText, Globe, AlertTriangle } from 'lucide-react';

export const ActivityView: React.FC = () => {
  const { activities, currentRole } = useERP();
  const [activeFilter, setActiveFilter] = useState<string>('All');

  // Filter logs categories
  const filteredActivities = activities.filter(act => {
    if (activeFilter === 'All') return true;
    
    // Fuzzy matching mapping tab names to categories
    if (activeFilter === 'RFQ') return act.category === 'RFQ';
    if (activeFilter === 'Approvals') return act.category === 'Approvals';
    if (activeFilter === 'Invoices') return act.category === 'Invoices';
    if (activeFilter === 'Vendors') return act.category === 'Vendors';
    return true;
  });

  const getIcon = (category: string) => {
    switch (category) {
      case 'Approvals':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'RFQ':
        return <FileText className="w-5 h-5 text-blue-500" />;
      case 'Invoices':
        return <Mail className="w-5 h-5 text-purple-500" />;
      case 'Vendors':
        return <Users2 className="w-5 h-5 text-amber-500" />;
      default:
        return <Globe className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div id="activity-view-wrapper" className="space-y-6 animate-in fade-in duration-200">
      
      {/* Title Header */}
      <div id="activity-view-header" className="border-b border-gray-100 pb-5">
        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Screen 10 Audit</span>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
          <CheckCircle2 className="text-slate-700 w-6 h-6" />
          Activity & Logs
        </h1>
        <p className="text-xs text-gray-500 mt-1">Procurement audit trail and immutability controls</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Side: Core List of Entries (Screen 10 Layout) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Filters (Matches Screen 10 Blue Tab All, and normal buttons) */}
          <div className="flex flex-wrap gap-2.5 items-center">
            {['All', 'RFQ', 'Approvals', 'Invoices', 'Vendors'].map((category) => (
              <button
                id={`activity-filter-${category.toLowerCase()}`}
                key={category}
                onClick={() => setActiveFilter(category)}
                className={`text-[11px] px-3.5 py-1.5 font-bold rounded-lg border transition-all duration-150 cursor-pointer ${
                  activeFilter === category
                    ? 'bg-blue-400 text-white border-blue-400 shadow-sm font-extrabold'
                    : 'bg-white text-gray-650 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* List items (Matches Screen 10 Visual precisely) */}
          <div className="space-y-4 border-l border-gray-200 pl-4 ml-3">
            {filteredActivities.length > 0 ? (
              filteredActivities.map((act) => (
                <div key={act.id} className="relative flex items-start gap-4 pb-2 group">
                  {/* Styled Icon Circles (Matches Screen 10) */}
                  <div className="absolute -left-7 top-1 bg-white border border-gray-150 p-1.5 rounded-full shadow-xs">
                    {getIcon(act.category)}
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs font-bold text-gray-800 block hover:text-gray-900 leading-snug">
                      {act.title}
                    </span>
                    <span className="text-[10px] text-gray-450 font-mono font-bold block">
                      {act.timestamp} 
                      {act.userName && <span className="text-gray-400 italic font-semibold ml-1.5">by {act.userName}</span>}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <span className="text-xs text-gray-400 italic block py-4 pl-2 font-medium">No actions recorded for this log sequence.</span>
            )}
          </div>
        </div>

        {/* Right Side: Regulatory Note card (Direct visual clone of Screen 10 note block) */}
        <div className="lg:col-span-4">
          <div className="bg-white border border-gray-225 rounded-xl p-5 space-y-4">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="text-amber-500 w-5 h-5 mt-0.5 shrink-0" />
              <div>
                <span className="text-xs font-extrabold text-gray-800 uppercase block tracking-wider font-mono">REGULATORY COMPLIANCE</span>
                <p className="text-[11px] text-gray-500 leading-relaxed mt-1">
                  Audit logs must be immutable. These entries must be write-once, no edit or delete. Make sure your DB schema reflects this (no soft-delete on log records).
                </p>
              </div>
            </div>

            <div className="text-[10px] text-gray-400 font-mono border-t border-gray-100 pt-3 flex items-center justify-between">
              <span>LEDGER COMPLIANT</span>
              <span className="text-emerald-600 font-bold">● ONLINE</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
