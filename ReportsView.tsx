import React, { useState } from 'react';
import { useERP } from './ERPContext';
import { BarChart3, Download, Calendar, ArrowUpRight, Award, TrendingUp, Sparkles, Filter } from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { purchaseOrders, invoices, vendors } = useERP();
  const [activeDate, setActiveDate] = useState('May 2025');

  // Compute total dynamic spends
  const rawSum = purchaseOrders.reduce((sum, po) => sum + po.grandTotal, 0);
  const totalSpendVal = 1240000 + rawSum; // Base mock spend plus actual approved POs!
  
  const formattedTotalSpend = totalSpendVal >= 100000 
    ? `${(totalSpendVal / 100000).toFixed(1)} L` 
    : `${totalSpendVal.toLocaleString()}`;

  const handleExportDataChange = () => {
    alert('Preparing excel spreadsheet generation... Downloaded Procurement_Analysis_May_2025.csv.');
    
    const headers = 'Category,Total Spend (INR),Transaction Count,Status\n';
    const rows = `IT Hardware,480000,6,Settled\nFurniture,320000,4,Active\nStationery,210000,2,Settled\nLogistics,230000,3,Active`;
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', url);
    downloadAnchor.setAttribute('download', 'Procurement_Analysis_May_2025.csv');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div id="reports-view-wrapper" className="space-y-6 animate-in fade-in duration-200">
      
      {/* Title Header with Export control row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-5 border-b border-gray-100 gap-4">
        <div>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Screen 11 Analytics</span>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="text-slate-700 w-6 h-6" />
            Reports & analytics
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Procurement Insights - <span className="font-semibold text-gray-800">{activeDate}</span>
          </p>
        </div>

        {/* Export and Date Selector buttons (Matches Screen 11 right top) */}
        <div className="flex items-center gap-2">
          <select
            value={activeDate}
            onChange={(e) => setActiveDate(e.target.value)}
            className="text-xs font-bold text-gray-700 bg-white border border-gray-300 rounded-lg p-2.5 outline-none cursor-pointer shadow-xs font-sans"
          >
            <option value="May 2025">May 2025</option>
            <option value="April 2025">April 2025</option>
            <option value="March 2025">March 2025</option>
          </select>
          <button
            id="btn-export-records"
            onClick={handleExportDataChange}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs p-2.5 px-4 rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
        </div>
      </div>

      {/* Stat Cards Bento Row layout (Matches Screen 11 layout) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Spend */}
        <div className="bg-white border border-gray-150 p-5 rounded-xl shadow-xs text-center flex flex-col justify-center">
          <span className="text-[32px] font-black text-blue-600 block tracking-tight">₹ {formattedTotalSpend}</span>
          <span className="text-xs font-semibold text-gray-400 capitalize tracking-wider mt-1 block">total spend</span>
        </div>

        {/* Card 2: Active Vendors */}
        <div className="bg-white border border-gray-150 p-5 rounded-xl shadow-xs text-center flex flex-col justify-center">
          <span className="text-[32px] font-black text-emerald-600 block tracking-tight">28</span>
          <span className="text-xs font-semibold text-emerald-600/80 capitalize tracking-wider mt-1 block">Active vendors</span>
        </div>

        {/* Card 3: Fulfillment rate */}
        <div className="bg-white border border-gray-150 p-5 rounded-xl shadow-xs text-center flex flex-col justify-center">
          <span className="text-[32px] font-black text-amber-500 block tracking-tight">94%</span>
          <span className="text-xs font-semibold text-amber-600 capitalize tracking-wider mt-1 block">PO Fulfillment</span>
        </div>

        {/* Card 4: Overdue/Pending Invoices */}
        <div className="bg-white border border-gray-150 p-5 rounded-xl shadow-xs text-center flex flex-col justify-center">
          <span className="text-[32px] font-black text-red-500 block tracking-tight">3</span>
          <span className="text-xs font-semibold text-red-500/80 capitalize tracking-wider mt-1 block">overdue invoices</span>
        </div>
      </div>

      {/* Mid Split Layout (Spend categories vs Top vendors / monthly trends) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        
        {/* SPEND BY CATEGORY PROGRESS SLIDERS (Matches Screen 11 left) */}
        <div className="bg-white border border-gray-150 rounded-xl p-5 space-y-5 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest block">SPEND BY CATEGORY</span>
            <p className="text-[11px] text-gray-400 mt-1">Distribution of capital commitments across channels</p>
          </div>

          <div className="space-y-4 py-1">
            {/* IT Hardware (Blue) */}
            <div className="space-y-1.5 col-span-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-gray-700">IT Hardware</span>
                <span className="font-semibold text-gray-900">₹4.8L</span>
              </div>
              <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: '75%' }} />
              </div>
            </div>

            {/* Furniture (Green) */}
            <div className="space-y-1.5 col-span-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-gray-700">Furniture</span>
                <span className="font-semibold text-gray-900">₹3.2L</span>
              </div>
              <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '55%' }} />
              </div>
            </div>

            {/* Stationery (Yellow) */}
            <div className="space-y-1.5 col-span-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-gray-700">Stationery</span>
                <span className="font-semibold text-gray-900">₹2.1L</span>
              </div>
              <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full" style={{ width: '38%' }} />
              </div>
            </div>

            {/* Logistics (Red) */}
            <div className="space-y-1.5 col-span-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-gray-700">Logistics</span>
                <span className="font-semibold text-gray-900">₹2.3L</span>
              </div>
              <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-rose-500 rounded-full" style={{ width: '42%' }} />
              </div>
            </div>
          </div>

          <div className="text-[10px] text-gray-400 border-t border-gray-50 pt-3">
            <span>Aggregated from 15 high-volume purchasing records</span>
          </div>
        </div>

        {/* TOP VENDORS & HISTORIC TREND (Matches Screen 11 right) */}
        <div className="space-y-6">
          
          {/* Top Vendors Spend block */}
          <div className="bg-white border border-gray-150 rounded-xl p-5 shadow-xs">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest block mb-3">TOP VENDORS BY SPEND</span>
            <div className="overflow-hidden border border-gray-100 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="py-2.5 px-4 font-bold text-gray-500 uppercase tracking-wider">Vendor</th>
                    <th className="py-2.5 px-4 font-bold text-gray-500 uppercase tracking-wider text-right">Spend (₹)</th>
                    <th className="py-2.5 px-4 font-bold text-gray-500 uppercase tracking-wider text-center">POs</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr className="hover:bg-gray-50/50">
                    <td className="py-2.5 px-4 font-bold text-gray-800">TechCore Ltd</td>
                    <td className="py-2.5 px-4 text-right text-gray-700 font-semibold">4,20,000</td>
                    <td className="py-2.5 px-4 text-center font-bold text-gray-500">6</td>
                  </tr>
                  <tr className="hover:bg-gray-50/50">
                    <td className="py-2.5 px-4 font-bold text-gray-800">Infra Supplies</td>
                    <td className="py-2.5 px-4 text-right text-gray-700 font-semibold">3,10,000</td>
                    <td className="py-2.5 px-4 text-center font-bold text-gray-500">4</td>
                  </tr>
                  <tr className="hover:bg-gray-50/50">
                    <td className="py-2.5 px-4 font-bold text-gray-800">FastLog</td>
                    <td className="py-2.5 px-4 text-right text-gray-700 font-semibold">1,90,000</td>
                    <td className="py-2.5 px-4 text-center font-bold text-gray-500">3</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Monthly Trend Mini Column Chart card block */}
          <div className="bg-white border border-gray-150 rounded-xl p-5 shadow-xs">
            <span className="text-xs font-bold text-gray-405 uppercase tracking-widest block mb-4">MONTHLY TREND</span>
            
            <div className="h-28 flex items-end justify-between px-4 gap-4 relative">
              <div className="absolute inset-x-0 top-0 border-t border-dashed border-gray-100" />
              <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-gray-100" />
              
              {[
                { m: 'Dec', h: '30%' },
                { m: 'Jan', h: '55%' },
                { m: 'Feb', mHighlight: true, h: '42%' },
                { m: 'Mar', h: '80%' },
                { m: 'Apr', h: '70%' },
                { m: 'May', h: '95%' },
              ].map((mItem, index) => (
                <div key={index} className="flex-1 flex flex-col items-center justify-end h-full">
                  <div 
                    className="w-full bg-blue-400 hover:bg-blue-500 transition-all rounded-t" 
                    style={{ height: mItem.h }} 
                  />
                  <span className="text-[10px] text-gray-400 font-semibold mt-1.5 uppercase">{mItem.m}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
