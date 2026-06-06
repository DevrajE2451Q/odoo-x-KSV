import React from 'react';
import { useERP } from './ERPContext';
import { FileEdit, UserPlus, FileCheck2, AlertCircle, ArrowUpRight, TrendingUp } from 'lucide-react';

interface DashboardViewProps {
  setActiveTab: (tab: string) => void;
  setCreateRfqMode?: (mode: boolean) => void;
  setAddVendorMode?: (mode: boolean) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ 
  setActiveTab, 
  setCreateRfqMode,
  setAddVendorMode
}) => {
  const { 
    currentRole, 
    currentUser, 
    rfqs, 
    workflows, 
    purchaseOrders, 
    invoices, 
    vendors 
  } = useERP();

  // Compute stats based on true state
  const activeRfqsCount = rfqs.filter(r => r.status === 'Sent' || r.status === 'Bids Received').length;
  const pendingApprovalsCount = workflows.filter(w => w.status === 'L2 Approval' || w.status === 'Submitted').length;
  
  const totalPoAmount = purchaseOrders.reduce((sum, po) => sum + po.grandTotal, 0);
  const formattedPoAmount = totalPoAmount >= 100000 
    ? `₹ ${(totalPoAmount / 100000).toFixed(1)}L` 
    : `₹ ${totalPoAmount.toLocaleString()}`;

  const overdueInvoicesCount = invoices.filter(i => i.status === 'Pending Payment').length;

  // Formatting helper
  const formatCurrency = (val: number) => {
    return val >= 100000 
      ? `₹ ${(val / 100000).toFixed(2)}L` 
      : `₹ ${val.toLocaleString()}`;
  };

  return (
    <div id="dashboard-view-wrapper" className="space-y-6 animate-in fade-in duration-250">
      {/* Header section with Welcome text */}
      <div id="dashboard-header" className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <h1 className="text-2xl font-bold font-sans tracking-tight text-gray-900 block">
            Welcome back, {currentUser?.firstName || 'User'}
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Role: <span className="font-semibold text-gray-700">{currentRole}</span> - Here is today's overview of your procurement system.
          </p>
        </div>
      </div>

      {/* Analytics KPI Bento Grid */}
      <div id="kpi-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Active RFQs */}
        <div id="kpi-card-rfq" className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Active RFQs</span>
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-500">
              <FileEdit className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-bold text-gray-900 leading-none block">{activeRfqsCount}</span>
            <span className="text-[10px] text-blue-500 font-medium mt-1 inline-flex items-center gap-0.5">
              Refers to active bidding stages
            </span>
          </div>
        </div>

        {/* KPI 2: Pending Approvals */}
        <div id="kpi-card-approvals" className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Pending Approvals</span>
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-500">
              <FileCheck2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-bold text-gray-900 leading-none block">{pendingApprovalsCount}</span>
            <span className="text-[10px] text-amber-600 font-medium mt-1 inline-flex items-center gap-0.5">
              Requires review & signatures
            </span>
          </div>
        </div>

        {/* KPI 3: Total PO spend */}
        <div id="kpi-card-spend" className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">PO's This Month</span>
            <span className="p-1.5 rounded-lg bg-purple-50 text-purple-500">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-gray-900 leading-none block">{formattedPoAmount}</span>
            <span className="text-[10px] text-emerald-600 font-medium mt-1 inline-flex items-center gap-0.5">
              Total committed capital
            </span>
          </div>
        </div>

        {/* KPI 4: Overdue/Pending Invoices */}
        <div id="kpi-card-invoices" className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Pending Invoices</span>
            <span className="p-1.5 rounded-lg bg-rose-50 text-rose-500">
              <AlertCircle className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-bold text-gray-900 leading-none block">{overdueInvoicesCount}</span>
            <span className="text-[10px] text-rose-500 font-medium mt-1 inline-flex items-center gap-0.5">
              Awaiting checkout payments
            </span>
          </div>
        </div>
      </div>

      {/* Main Stats Row: Tables & Trend Chart (Dashboard Screen 3 Layout) */}
      <div id="dashboard-mid-layout" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Recent Orders segment */}
        <div id="recent-pos-section" className="lg:col-span-7 bg-white border border-gray-100 rounded-xl shadow-xs overflow-hidden flex flex-col justify-between">
          <div className="p-5 border-b border-gray-50 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-800 tracking-tight">Recent Purchase Orders</h2>
              <p className="text-[11px] text-gray-400 mt-0.5">Current month tracking records</p>
            </div>
            <button 
              onClick={() => setActiveTab('Purchase orders')}
              className="text-xs text-blue-500 font-medium hover:underline flex items-center gap-0.5"
            >
              See all
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-55/60 border-b border-gray-50">
                  <th className="py-3 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">PO #</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Vendor</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Amount</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {purchaseOrders.slice(-4).reverse().map((po) => (
                  <tr key={po.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5 px-4 text-xs font-mono font-medium text-gray-800">{po.documentNumber}</td>
                    <td className="py-3.5 px-4 text-xs text-gray-600 font-medium">{po.vendorName}</td>
                    <td className="py-3.5 px-4 text-xs font-semibold text-gray-800">{formatCurrency(po.grandTotal)}</td>
                    <td className="py-3.5 px-4 text-[11px]">
                      <span className={`px-2 py-0.5 rounded-full font-bold inline-block ${
                        po.status === 'Completed' 
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                          : 'bg-blue-50 text-blue-600 border border-blue-100'
                      }`}>
                        {po.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-3 bg-gray-50/40 text-center border-t border-gray-50">
            <span className="text-[10px] text-gray-400 lowercase">All details are synced with central DB</span>
          </div>
        </div>

        {/* Dynamic spend trends simulation visualizer (Screen 3) */}
        <div id="spend-trends-section" className="lg:col-span-5 bg-white border border-gray-100 rounded-xl shadow-xs p-5 flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Spending trends last 6 months</span>
            <p className="text-[11px] text-gray-400 mt-1">Breakdown of procurement volume by month</p>
          </div>

          {/* SVG Spend Line Graphs and Bars */}
          <div className="my-5 h-40 flex items-end justify-between gap-2.5 px-2 relative">
            {/* Grid Line lines */}
            <div className="absolute inset-x-0 top-0 border-t border-dashed border-gray-100" />
            <div className="absolute inset-x-0 top-1/3 border-t border-dashed border-gray-100" />
            <div className="absolute inset-x-0 top-2/3 border-t border-dashed border-gray-100" />

            {/* Monthly mini charts */}
            {[
              { month: 'Dec', value: 3.5, label: '3.5L' },
              { month: 'Jan', value: 5.2, label: '5.2L' },
              { month: 'Feb', value: 4.0, label: '4.0L' },
              { month: 'Mar', value: 7.8, label: '7.8L' },
              { month: 'Apr', value: 6.5, label: '6.5L' },
              { month: 'May', value: 9.2, label: '9.2L' },
            ].map((d, index) => (
              <div key={d.month} className="flex-1 flex flex-col items-center h-full justify-end z-10 group">
                <div className="relative w-full flex flex-col items-center justify-end h-[80%]">
                  {/* Tooltip */}
                  <span className="absolute -top-6 text-[9px] font-bold bg-slate-800 text-white px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-sm font-mono">
                    {d.label}
                  </span>
                  {/* Active Month Bar */}
                  <div 
                    className="w-full bg-blue-400 hover:bg-blue-500 rounded-t-md transition-all duration-300 shadow-xs" 
                    style={{ height: `${(d.value / 10) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mt-2 block">{d.month}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-50 pt-3 flex items-center justify-between text-xs text-gray-500">
            <span className="flex items-center gap-1.5 font-medium text-emerald-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
              Realtime monthly indexing
            </span>
            <span className="font-mono text-[10px]">Peak spend: May</span>
          </div>
        </div>

      </div>

      {/* Bottom Horizontal Border Line and Quick Action Buttons */}
      <hr className="border-gray-100 my-2" />

      <div id="quick-action-section" className="bg-slate-50 border border-slate-100/60 p-5 rounded-xl flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 shadow-inner">
        {/* Button 1: new RFQ */}
        <button
          id="btn-quick-new-rfq"
          onClick={() => {
            if (setCreateRfqMode) setCreateRfqMode(true);
            setActiveTab("RFQ's");
          }}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-lg shadow-sm font-semibold text-xs hover:bg-slate-800 active:scale-98 transition-all cursor-pointer"
        >
          <FileEdit className="w-4 h-4" />
          + new RFQ
        </button>

        {/* Button 2: Add Vendor */}
        <button
          id="btn-quick-add-vendor"
          onClick={() => {
            if (setAddVendorMode) setAddVendorMode(true);
            setActiveTab("Vendors");
          }}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-300 px-5 py-2.5 rounded-lg shadow-xs font-semibold text-xs hover:bg-gray-50 active:scale-98 transition-all cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          Add Vendor
        </button>

        {/* Button 3: View Invoices */}
        <button
          id="btn-quick-view-invoices"
          onClick={() => setActiveTab('Invoices')}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-300 px-5 py-2.5 rounded-lg shadow-xs font-semibold text-xs hover:bg-gray-50 active:scale-98 transition-all cursor-pointer"
        >
          <TrendingUp className="w-4 h-4" />
          view Invoices
        </button>
      </div>
    </div>
  );
};
