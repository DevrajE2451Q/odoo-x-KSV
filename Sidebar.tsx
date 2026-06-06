import React, { useState } from 'react';
import { useERP } from './ERPContext';
import { 
  Building2, 
  LayoutDashboard, 
  Users2, 
  FileEdit, 
  FileText, 
  Activity, 
  ShieldCheck, 
  CheckSquare, 
  Receipt, 
  BarChart3,
  LogOut,
  X
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isMobileOpen?: boolean;
  setIsMobileOpen?: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab, 
  isMobileOpen = false, 
  setIsMobileOpen = (_open: boolean) => {} 
}) => {
  const { 
    currentRole, 
    logout, 
    currentUser, 
    workflows, 
    rfqs, 
    invoices,
    sidebarWidth,
    updateSidebarWidth 
  } = useERP();

  const [isDragging, setIsDragging] = useState(false);

  // Consider sidebar compact if width is below 120px
  const isCompact = sidebarWidth < 120;

  const pendingApprovalsCount = workflows.filter(w => w.status === 'L2 Approval' || w.status === 'Submitted').length;
  const activeRfqsCount = rfqs.filter(r => r.status === 'Sent' || r.status === 'Bids Received').length;
  const unpaidInvoicesCount = invoices.filter(i => i.status === 'Pending Payment').length;

  const menuItems = [
    { id: 'Dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'Vendors', label: 'Vendors', icon: Users2 },
    { id: 'RFQ\'s', label: "RFQ's", icon: FileEdit, badge: activeRfqsCount > 0 ? activeRfqsCount : undefined },
    { id: 'Quotations', label: 'Quotations', icon: FileText },
    { id: 'Approvals', label: 'Approvals', icon: CheckSquare, badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined },
    { id: 'Purchase orders', label: 'Purchase orders', icon: ShieldCheck },
    { id: 'Invoices', label: 'Invoices', icon: Receipt, badge: unpaidInvoicesCount > 0 ? unpaidInvoicesCount : undefined },
    { id: 'Reports', label: 'Reports', icon: BarChart3 },
    { id: 'Activity', label: 'Activity', icon: Activity }
  ];

  // Drag-and-resize handler logic
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    const startX = e.clientX;
    const startWidth = sidebarWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      // Clamp between 80px (Compact) and 450px (Expanded limits)
      const newWidth = Math.max(80, Math.min(450, startWidth + deltaX));
      updateSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Double click reset to default width
  const handleDoubleClick = () => {
    updateSidebarWidth(250);
  };

  // Keyboard navigation support - Arrow Left/Right to adjust width
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      updateSidebarWidth(Math.min(450, sidebarWidth + 15));
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      updateSidebarWidth(Math.max(80, sidebarWidth - 15));
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      // Toggle presets cycle
      if (sidebarWidth <= 120) {
        updateSidebarWidth(250);
      } else if (sidebarWidth > 120 && sidebarWidth <= 280) {
        updateSidebarWidth(320);
      } else {
        updateSidebarWidth(80);
      }
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay - closes sidebar on tap */}
      {isMobileOpen && (
        <div 
          id="sidebar-mobile-backdrop"
          className="fixed inset-0 bg-slate-950/60 z-40 md:hidden backdrop-blur-xs transition-opacity duration-300"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Main Sidebar Wrapper Container */}
      <div 
        id="erp-sidebar" 
        className={`
          bg-slate-900 text-slate-300 flex flex-col h-screen border-r border-slate-800 shrink-0 relative select-none
          fixed inset-y-0 left-0 z-50 md:sticky md:top-0
          ${isDragging ? '' : 'transition-[width] duration-300 ease-out'}
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
        style={{ width: isMobileOpen ? '280px' : `${sidebarWidth}px` }}
      >
        
        {/* Brand Header */}
        <div id="sidebar-logo-header" className={`p-5 border-b border-slate-800 flex items-center ${isCompact && !isMobileOpen ? 'justify-center' : 'gap-3'}`}>
          <div className="bg-gradient-to-tr from-purple-500 to-indigo-500 p-2 rounded-xl text-white shadow-md shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          {(!isCompact || isMobileOpen) && (
            <div className="min-w-0 flex-1">
              <span className="text-lg font-bold text-white tracking-tight font-sans block truncate text-left">VendorBridge</span>
              <span className="text-[10px] text-slate-400 font-mono tracking-wider block truncate text-left">ERP SYSTEM</span>
            </div>
          )}
          {/* Close menu button on Mobile only */}
          {isMobileOpen && (
            <button 
              id="close-sidebar-mobile-btn"
              onClick={() => setIsMobileOpen(false)}
              className="md:hidden p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              title="Close Navigation Menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Profile Summary */}
        {currentUser && (
          <div id="sidebar-profile" className={`px-5 py-4 bg-slate-950/40 border-b border-slate-800/40 flex ${isCompact && !isMobileOpen ? 'flex-col items-center gap-2 justify-center' : 'items-center justify-between gap-3 min-w-0'}`}>
            <div className="flex items-center gap-3 min-w-0 justify-center">
              <div 
                className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 font-bold flex items-center justify-center text-xs text-white uppercase shrink-0"
                title={`${currentUser.firstName} ${currentUser.lastName} (${currentRole})`}
              >
                {currentUser.firstName.charAt(0)}{currentUser.lastName.charAt(0)}
              </div>
              {(!isCompact || isMobileOpen) && (
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-semibold text-slate-100 block truncate text-left">{currentUser.firstName} {currentUser.lastName}</span>
                  <span className="text-[10px] text-slate-400 font-medium truncate block text-left">{currentRole}</span>
                </div>
              )}
            </div>
            
            {isCompact && !isMobileOpen ? (
              <button 
                id="sidebar-logout-btn"
                onClick={logout} 
                className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800/40 rounded transition-all duration-150 cursor-pointer text-center"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            ) : (
              <button 
                id="sidebar-logout-btn"
                onClick={logout} 
                className="p-1 px-2.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800/40 rounded transition-all duration-150 cursor-pointer shrink-0"
                title="Log Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Navigation Links */}
        <div id="sidebar-nav" className="flex-1 overflow-y-auto no-scrollbar px-3 py-4 space-y-1">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const isSelected = activeTab === item.id;
            return (
              <button
                id={`nav-link-${item.id.toLowerCase().replace("'", "").replace(' ', '-')}`}
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  if (isMobileOpen) setIsMobileOpen(false); // Auto close sidebar drawer on mobile after clicking
                }}
                title={isCompact && !isMobileOpen ? item.label : undefined}
                className={`
                  w-full flex items-center rounded-lg transition-all duration-150 cursor-pointer group hover:bg-slate-800 hover:text-white text-left relative
                  ${isCompact && !isMobileOpen ? 'justify-center p-3 my-1' : 'justify-between px-3 py-2.5'}
                  ${isSelected 
                    ? 'bg-slate-800 text-emerald-400 font-medium shadow-sm border-l-2 border-emerald-500' 
                    : 'text-slate-400'
                  }
                `}
              >
                <div className={`flex items-center ${isCompact && !isMobileOpen ? 'justify-center' : 'gap-3'} min-w-0`}>
                  <IconComponent className={`w-4 h-4 transition-colors shrink-0 ${isSelected ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-300'}`} />
                  {(!isCompact || isMobileOpen) && <span className="text-xs tracking-wide truncate">{item.label}</span>}
                </div>

                {item.badge && (!isCompact || isMobileOpen) && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                    isSelected ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 border border-slate-700 text-slate-300'
                  }`}>
                    {item.badge}
                  </span>
                )}

                {item.badge && isCompact && !isMobileOpen && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-slate-900" />
                )}
              </button>
            );
          })}
        </div>

        {/* Sizing Controls Presets Panel */}
        {(!isMobileOpen) && (
          <div id="sidebar-sizing-presets" className="px-3 py-2.5 border-t border-slate-800/40 bg-slate-950/10 flex flex-col gap-1.5 shrink-0">
            {!isCompact && (
              <div className="flex items-center justify-between px-0.5">
                <span className="text-[9px] font-bold text-slate-500 font-mono uppercase tracking-wider">Presets</span>
                <span className="text-[10px] text-slate-400 font-mono">{sidebarWidth}px</span>
              </div>
            )}
            <div className={`flex ${isCompact ? 'flex-col items-center gap-1.5' : 'flex-row gap-1'} bg-slate-950 p-1 rounded-lg border border-slate-800`}>
              <button 
                type="button"
                onClick={() => updateSidebarWidth(80)} 
                className={`w-full py-1 text-center rounded transition-colors text-[10px] font-semibold cursor-pointer ${
                  sidebarWidth <= 120 
                    ? 'bg-slate-800 text-emerald-400 font-bold shadow-sm' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
                title="Compact Preset (80px)"
              >
                {isCompact ? 'C' : 'Compact'}
              </button>
              <button 
                type="button"
                onClick={() => updateSidebarWidth(250)} 
                className={`w-full py-1 text-center rounded transition-colors text-[10px] font-semibold cursor-pointer ${
                  sidebarWidth > 120 && sidebarWidth <= 280 
                    ? 'bg-slate-800 text-emerald-400 font-bold shadow-sm' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
                title="Medium Preset (250px)"
              >
                {isCompact ? 'M' : 'Medium'}
              </button>
              <button 
                type="button"
                onClick={() => updateSidebarWidth(320)} 
                className={`w-full py-1 text-center rounded transition-colors text-[10px] font-semibold cursor-pointer ${
                  sidebarWidth > 280 
                    ? 'bg-slate-800 text-emerald-400 font-bold shadow-sm' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
                title="Expanded Preset (320px)"
              >
                {isCompact ? 'E' : 'Expanded'}
              </button>
            </div>
          </div>
        )}

        {/* Footnote */}
        <div id="sidebar-footer" className="p-4 border-t border-slate-800/60 bg-slate-950/20 text-center shrink-0">
          <span className="text-[9px] text-slate-500 font-mono uppercase tracking-widest block truncate">
            {isCompact && !isMobileOpen ? 'v1.2' : 'v1.2.0 production'}
          </span>
        </div>

        {/* Resizer edge drag handle (Desktop only) */}
        {!isMobileOpen && (
          <div
            id="sidebar-resize-handle"
            role="separator"
            tabIndex={0}
            onMouseDown={handleMouseDown}
            onDoubleClick={handleDoubleClick}
            onKeyDown={handleKeyDown}
            aria-valuenow={sidebarWidth}
            aria-valuemin={80}
            aria-valuemax={450}
            aria-label="Drag sidebar edge to resize"
            className={`
              absolute top-0 right-0 w-1.5 h-full cursor-col-resize z-50 transition-all duration-150 outline-none
              hover:bg-emerald-500/50 hover:w-[5px] focus:bg-emerald-500/70 focus:w-[5px]
              ${isDragging ? 'bg-emerald-500 w-[5px]' : ''}
            `}
            title="Drag to resize sidebar (Double click to reset)"
          />
        )}
      </div>
    </>
  );
};
