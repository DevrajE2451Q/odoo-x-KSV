import React, { useState } from 'react';
import { useERP } from './ERPContext';
import { UserRole } from './types';
import { Users, ShieldCheck, ChevronDown } from 'lucide-react';

export const RoleSwitcher: React.FC = () => {
  const { currentRole, switchRole, currentUser } = useERP();
  const [isOpen, setIsOpen] = useState(false);

  const roles: { role: UserRole; name: string; desc: string }[] = [
    { role: 'Procurement Officer', name: 'Rahul Mehta', desc: 'Can publish RFQs, compare bids & initiate approvals' },
    { role: 'Vendor', name: 'Amit Patel (Infra Corp)', desc: 'Can view assigned RFQs & submit quotation bids' },
    { role: 'Manager/Approver', name: 'Priya Shah', desc: 'Can review details, put remarks & approve/reject' },
    { role: 'Admin', name: 'System Admin', desc: 'Configure system settings, verify vendors & track logs' }
  ];

  return (
    <div id="role-switcher-container" className="relative z-50">
      <div 
        id="role-indicator-badge"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 border border-emerald-400 text-white px-3 py-1.5 rounded-lg shadow-sm cursor-pointer transition-all duration-200"
      >
        <ShieldCheck className="w-4 h-4" />
        <span className="text-xs font-semibold tracking-wider uppercase">Testing Simulator:</span>
        <div className="flex items-center gap-1">
          <span className="text-xs bg-emerald-700/80 px-2 py-0.5 rounded font-bold">
            {currentRole}
          </span>
          {currentUser && (
            <span className="text-[10px] hidden sm:inline text-emerald-100 italic">
              ({currentUser.firstName})
            </span>
          )}
        </div>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div 
          id="role-dropdown-card"
          className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl shadow-xl ring-1 ring-black/5 dark:ring-white/10 p-2 animate-in fade-in slide-in-from-top-2 duration-150"
        >
          <div className="px-3 py-2 border-b border-gray-50 dark:border-slate-800 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500 block">
              Simulation Control Center
            </span>
            <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">
              Switch roles on-the-fly to test the entire multi-role procurement workflow.
            </p>
          </div>
          <div className="space-y-1">
            {roles.map((item) => (
              <button
                id={`role-btn-${item.role.replace(' ', '-').toLowerCase()}`}
                key={item.role}
                onClick={() => {
                  switchRole(item.role);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex flex-col ${
                  currentRole === item.role 
                    ? 'bg-blue-50/70 dark:bg-blue-955/40 border-l-4 border-blue-500' 
                    : 'hover:bg-gray-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-semibold text-gray-800 dark:text-slate-200">{item.role}</span>
                  {currentRole === item.role && (
                    <span className="text-[10px] bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-350 px-1.5 py-0.5 rounded font-bold">Active</span>
                  )}
                </div>
                <span className="text-[10px] text-gray-400 mt-0.5 mt-0 font-medium italic block">{item.name}</span>
                <span className="text-[10px] text-gray-500 dark:text-slate-400 leading-snug mt-1">{item.desc}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
