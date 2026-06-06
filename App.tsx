import React, { useState, useEffect } from 'react';
import { ERPProvider, useERP } from './ERPContext';
import { Sidebar } from './Sidebar';
import { RoleSwitcher } from './RoleSwitcher';
import { DashboardView } from './DashboardView';
import { VendorsView } from './VendorsView';
import { RFQsView } from './RFQsView';
import { QuotationsView } from './QuotationsView';
import { ApprovalsView } from './ApprovalsView';
import { InvoicesView } from './InvoicesView';
import { ReportsView } from './ReportsView';
import { ActivityView } from './ActivityView';
import { LoginView } from './LoginView';
import { Bell, ShieldCheck, Mail, CheckCircle, HelpCircle, Sun, Moon, Menu } from 'lucide-react';

function ERPLayout() {
  const { currentUser, notifications, clearNotifications } = useERP();
  const [activeTab, setActiveTab] = useState<string>('Dashboard');
  const [notifOpen, setNotifOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  // Creation modes accessed via quick actions
  const [createRfqMode, setCreateRfqMode] = useState(false);
  const [addVendorMode, setAddVendorMode] = useState(false);

  // Bridging active RFQ from list to bids
  const [selectedRfqBidId, setSelectedRfqBidId] = useState<string | null>(null);

  // Dark mode state persistence
  const [isDark, setIsDark] = useState<boolean>(() => localStorage.getItem('vb_theme') === 'dark');

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('vb_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('vb_theme', 'light');
    }
  }, [isDark]);

  // If there's no logged in user, render login screen
  if (!currentUser) {
    return <LoginView />;
  }

  const unreadNotifs = notifications.filter(n => !n.read);

  const handleActiveBidSubmission = (rfqId: string) => {
    setSelectedRfqBidId(rfqId);
    setActiveTab('Quotations');
  };

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'Dashboard':
        return (
          <DashboardView 
            setActiveTab={setActiveTab} 
            setCreateRfqMode={setCreateRfqMode}
            setAddVendorMode={setAddVendorMode}
          />
        );
      case 'Vendors':
        return (
          <VendorsView 
            addVendorMode={addVendorMode} 
            setAddVendorMode={setAddVendorMode} 
          />
        );
      case "RFQ's":
        return (
          <RFQsView 
            createRfqMode={createRfqMode} 
            setCreateRfqMode={setCreateRfqMode} 
            onBidClick={handleActiveBidSubmission}
          />
        );
      case 'Quotations':
        return (
          <QuotationsView 
            selectedRfqId={selectedRfqBidId} 
            setSelectedRfqId={setSelectedRfqBidId}
            setActiveTab={setActiveTab}
          />
        );
      case 'Approvals':
        return <ApprovalsView setActiveTab={setActiveTab} />;
      case 'Purchase orders':
        return <InvoicesView defaultDocType="PO" />;
      case 'Invoices':
        return <InvoicesView defaultDocType="Invoice" />;
      case 'Reports':
        return <ReportsView />;
      case 'Activity':
        return <ActivityView />;
      default:
        return <DashboardView setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div id="erp-workspace-root" className="flex h-screen bg-slate-100 dark:bg-slate-950 overflow-hidden text-slate-700 dark:text-slate-300 font-sans">
      
      {/* Dynamic Left Menu Bar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main Panel Area */}
      <div id="erp-main-panel" className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Navbar */}
        <header id="erp-top-nav" className="h-16 bg-white dark:bg-slate-900 border-b border-gray-150 dark:border-slate-800 flex items-center justify-between px-6 shrink-0 z-40 shadow-xs">
          
          {/* Active section title indicator */}
          <div className="flex items-center gap-1.5 font-bold text-gray-800 dark:text-slate-200">
            <button 
              id="sidebar-mobile-toggle"
              onClick={() => setIsMobileOpen(true)}
              className="md:hidden p-2 -ml-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg mr-2"
              title="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-sm uppercase tracking-wider font-mono text-gray-450 dark:text-slate-500 hidden sm:inline">Active view:</span>
            <span className="text-sm font-sans font-extrabold capitalize text-slate-800 dark:text-slate-250 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-100 dark:border-slate-700">
              {activeTab}
            </span>
          </div>

          {/* Interactive controls */}
          <div id="top-nav-controls" className="flex items-center gap-4">
            
            {/* Interactive role switcher bar */}
            <RoleSwitcher />

            {/* Dark Mode Toggle Button */}
            <button
              id="dark-mode-toggle"
              onClick={() => setIsDark(!isDark)}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? (
                <Sun className="w-5 h-5 text-amber-500 animate-pulse" />
              ) : (
                <Moon className="w-5 h-5 text-slate-700" />
              )}
            </button>

            {/* Notifications panel bell widget */}
            <div id="notif-bell-container" className="relative">
              <button
                onClick={() => {
                  setNotifOpen(!notifOpen);
                  if (!notifOpen && unreadNotifs.length > 0) {
                    // clear on open
                    setTimeout(clearNotifications, 1000);
                  }
                }}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors relative cursor-pointer"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadNotifs.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900 animate-pulse" />
                )}
              </button>

              {notifOpen && (
                <div 
                  id="notif-dropdown-drawer"
                  className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-xl rounded-xl ring-1 ring-black/5 dark:ring-white/10 p-2 animate-in fade-in duration-100"
                >
                  <div className="px-3 py-2 border-b border-gray-50 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest block">Notification Alerts</span>
                    {unreadNotifs.length > 0 && (
                      <span className="text-[9px] bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold px-1.5 py-0.5 rounded-full">
                        {unreadNotifs.length} New
                      </span>
                    )}
                  </div>
                  <div className="space-y-1 py-1 max-h-60 overflow-y-auto">
                    {notifications.map((n) => (
                      <div key={n.id} className="p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800/60 flex items-start gap-2.5 transition-colors">
                        <span className={`p-1 rounded-full mt-0.5 inline-block shrink-0 ${
                          n.type === 'RFQ' ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400' : n.type === 'Approval' ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400' : 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400'
                        }`}>
                          <CheckCircle className="w-3 h-3" />
                        </span>
                        <div>
                          <p className="text-[11px] text-gray-700 dark:text-slate-300 leading-snug font-medium">{n.title}</p>
                          <span className="text-[9px] text-gray-400 dark:text-slate-500 block mt-0.5 font-mono">{n.timestamp}</span>
                        </div>
                      </div>
                    ))}
                    {notifications.length === 0 && (
                      <div className="py-6 text-center text-xs text-gray-400 dark:text-slate-500 font-medium">No new notifications.</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Quick help manual tooltip */}
            <button
              onClick={() => {
                alert(
                  "VendorBridge Procurement ERP Flow Guide:\n\n" +
                  "1. Login/Switch to 'Procurement Officer' (Rahul Mehta)\n" +
                  "   - Go to 'RFQ's', click '+ Create RFQ' to publish a new requisition tender.\n\n" +
                  "2. Switch mode/Role to 'Vendor' (Amit Patel)\n" +
                  "   - Go to 'Quotations' bid console tab, adjust pricing rows table details, click 'Submit Quotation' for RFQ.\n\n" +
                  "3. Switch back to 'Procurement Officer'\n" +
                  "   - Go to 'Quotations' comparative matrix tab, review side-by-side specs, click 'Select & Approve' on the winner.\n\n" +
                  "4. Switch to 'Manager/Approver' (Priya Shah)\n" +
                  "   - Go to 'Approvals' workflow, write any remarks conditions, and click 'Approve'. This immediately spawns PO + printable invoice records!\n\n" +
                  "5. Go inspect reports metrics inside 'Reports' or immutable ledger trail logs inside 'Activity'!"
                );
              }}
              className="p-2 text-gray-400 dark:text-slate-500 hover:text-slate-650 dark:hover:text-slate-300 rounded-full hover:bg-gray-105 dark:hover:bg-slate-800 transition-colors"
              title="Interactive Flow Manuel User Guide"
            >
              <HelpCircle className="w-5 h-5" />
            </button>

          </div>
        </header>

        {/* Dynamic Center Panel Work Area */}
        <main id="erp-main-container-viewport" className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-950">
          <div className="max-w-7xl mx-auto h-full">
            {renderActiveScreen()}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ERPProvider>
      <ERPLayout />
    </ERPProvider>
  );
}
