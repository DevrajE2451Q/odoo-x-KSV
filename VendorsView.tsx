import React, { useState } from 'react';
import { useERP } from './ERPContext';
import { Vendor, VendorStatus } from './types';
import { Search, UserPlus, Filter, X, ShieldAlert, BadgeCheck, Phone, Mail, Building, Globe } from 'lucide-react';

interface VendorsViewProps {
  addVendorMode: boolean;
  setAddVendorMode: (mode: boolean) => void;
}

export const VendorsView: React.FC<VendorsViewProps> = ({ 
  addVendorMode, 
  setAddVendorMode 
}) => {
  const { vendors, addVendor, updateVendorStatus, currentRole } = useERP();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

  // Form Fields for Register Vendor (inspired by Screen 2 Registration design)
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [category, setCategory] = useState('');
  const [gstNo, setGstNo] = useState('');
  const [country, setCountry] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');

  // Handle new vendor creation
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName || !emailAddress || !category) {
      alert('Please fill out critical supplier fields.');
      return;
    }

    addVendor({
      name: companyName,
      category: category,
      gstNo: gstNo || 'Pending GST',
      contactNo: phoneNumber || 'N/A',
      email: emailAddress,
      status: 'Pending', // pending verification
      paymentTerms: '30 days',
      address: additionalInfo || 'N/A',
      country: country || 'India'
    });

    // Reset Form
    setCompanyName('');
    setFirstName('');
    setLastName('');
    setEmailAddress('');
    setPhoneNumber('');
    setCategory('');
    setGstNo('');
    setCountry('');
    setAdditionalInfo('');
    setAddVendorMode(false);
  };

  // Filter calculations
  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = 
      vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.gstNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === 'All') return matchesSearch;
    return matchesSearch && vendor.status.toLowerCase() === statusFilter.toLowerCase();
  });

  const getStatusCounts = () => {
    return {
      All: vendors.length,
      Active: vendors.filter(v => v.status === 'Active').length,
      Pending: vendors.filter(v => v.status === 'Pending').length,
      Blocked: vendors.filter(v => v.status === 'Blocked').length
    };
  };

  const counts = getStatusCounts();

  return (
    <div id="vendors-view-wrapper" className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Header Section */}
      <div id="vendors-header-container" className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-5 border-b border-gray-100 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Building className="text-slate-700 w-6 h-6" />
            Vendors
          </h1>
          <p className="text-xs text-gray-500 mt-1">Supplier profiles and active ERP system registrations</p>
        </div>
        <button
          id="btn-add-vendor-toggle"
          onClick={() => setAddVendorMode(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs py-2 px-4 rounded-lg shadow-xs hover:shadow-sm cursor-pointer transition-all active:scale-98"
        >
          <UserPlus className="w-4 h-4" />
          + Add Vendor
        </button>
      </div>

      {/* Main Vendor register view */}
      {!addVendorMode ? (
        <div id="vendor-directory-block" className="space-y-4">
          
          {/* Controls bar: Search + Status filter caps (Matches Layout Screen 4) */}
          <div className="flex flex-col gap-4">
            {/* Search Box inputs */}
            <div id="vendor-search-input-box" className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Search className="w-4.5 h-4.5" />
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search bar ...... search by name, gst number, category..."
                className="w-full text-xs font-medium border border-gray-250 rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-blue-105 outline-none transition-all placeholder:text-gray-400/90 text-gray-700 bg-white"
              />
            </div>

            {/* Quick Status Pill Capacities */}
            <div id="status-pill-list" className="flex flex-wrap gap-2.5 items-center">
              {[
                { key: 'All', label: `All (${counts.All})` },
                { key: 'Active', label: `Active (${counts.Active})` },
                { key: 'Pending', label: `Pending (${counts.Pending})` },
                { key: 'Blocked', label: `Blocked (${counts.Blocked})` }
              ].map(tab => (
                <button
                  id={`vendor-status-pill-${tab.key.toLowerCase()}`}
                  key={tab.key}
                  onClick={() => setStatusFilter(tab.key)}
                  className={`text-[11px] px-3.5 py-1.5 font-bold rounded-lg border transition-all duration-150 cursor-pointer ${
                    statusFilter === tab.key
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Vendors roster table (Matches Screen 4 column and data format) */}
          <div id="vendors-table" className="bg-white border border-gray-150 rounded-xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 font-sans">
                    <th className="py-3.5 px-4 text-[10px] font-extrabold text-gray-400 uppercase tracking-widest pl-6">Vendor Name</th>
                    <th className="py-3.5 px-4 text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Category</th>
                    <th className="py-3.5 px-4 text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">GST no.</th>
                    <th className="py-3.5 px-4 text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">contact no.</th>
                    <th className="py-3.5 px-4 text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Status</th>
                    <th className="py-3.5 px-4 text-[10px] font-extrabold text-gray-400 uppercase tracking-widest text-right pr-6">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredVendors.length > 0 ? (
                    filteredVendors.map((vendor) => (
                      <tr key={vendor.id} className="hover:bg-gray-50/50 transition-colors">
                        {/* Name and Rating */}
                        <td className="py-4 px-4 text-xs pl-6">
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-800">{vendor.name}</span>
                            <span className="text-[10px] text-amber-500 font-medium mt-0.5">
                              ⭐ {vendor.rating.toFixed(1)} / 5.0
                            </span>
                          </div>
                        </td>
                        {/* Category */}
                        <td className="py-4 px-4 text-xs font-medium text-gray-650">{vendor.category}</td>
                        {/* GST */}
                        <td className="py-4 px-4 text-xs font-mono text-gray-500">{vendor.gstNo}</td>
                        {/* Phone */}
                        <td className="py-4 px-4 text-xs text-gray-600 font-medium">{vendor.contactNo}</td>
                        {/* Status Badge */}
                        <td className="py-4 px-4 text-xs">
                          <span className={`px-2 py-0.75 rounded-full text-[10px] font-extrabold inline-block tracking-wide uppercase ${
                            vendor.status === 'Active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                              : vendor.status === 'Blocked'
                              ? 'bg-rose-50 text-rose-700 border border-rose-100'
                              : 'bg-amber-50 text-amber-700 border border-amber-100'
                          }`}>
                            {vendor.status}
                          </span>
                        </td>
                        {/* Actions */}
                        <td className="py-4 px-4 text-xs text-right pr-6">
                          <button
                            id={`btn-view-vendor-${vendor.id}`}
                            onClick={() => setSelectedVendor(vendor)}
                            className="bg-white hover:bg-slate-50 border border-gray-350 text-gray-700 font-bold px-3 py-1.5 rounded-lg text-[11px] cursor-pointer shadow-xs"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-xs text-gray-400 font-medium">
                        No registered vendors match these criteria filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* registration Screen mockup (Screen 2 details merged) */
        <div id="supplier-registration-card" className="bg-white border border-gray-200 rounded-xl shadow-md p-6 max-w-3xl mx-auto">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">2</span>
              <h2 className="text-base font-bold text-gray-800">Registration Screen (Screen 2 Mockup)</h2>
            </div>
            <button 
              onClick={() => setAddVendorMode(false)}
              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded"
              title="Cancel Registration"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleRegister} className="space-y-6">
            {/* Round photo placeholder (Direct visual match with Screen 2 mockup) */}
            <div className="flex flex-col items-center gap-2">
              <div className="w-24 h-24 rounded-full border-2 border-dashed border-gray-300 flex flex-col items-center justify-center bg-gray-50/50 select-none">
                <span className="text-[10px] font-bold tracking-widest text-gray-450 uppercase">Photo</span>
              </div>
              <span className="text-[10px] text-gray-400">Upload profile image placeholder</span>
            </div>

            {/* Registration Input Fields Container */}
            <div className="bg-gray-50/30 border border-gray-100 p-5 rounded-xl space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div>
                  <label className="text-xs font-bold text-gray-650 tracking-wide block mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="e.g. John"
                    className="w-full text-xs font-medium border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-650 tracking-wide block mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="e.g. Doe"
                    className="w-full text-xs font-medium border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-650 tracking-wide block mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    placeholder="e.g. supplies@infra.com"
                    className="w-full text-xs font-medium border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-650 tracking-wide block mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="e.g. +91 99999 88888"
                    className="w-full text-xs font-medium border border-gray-300 rounded-lg p-2.5 bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-650 tracking-wide block mb-1">Company / Vendor Name *</label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Fast Supplies LLC"
                    className="w-full text-xs font-medium border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-650 tracking-wide block mb-1">Category (Admin / Officer selection value)</label>
                  <select
                    value={category}
                    required
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full text-xs font-medium border border-gray-300 rounded-lg p-2.5 bg-white"
                  >
                    <option value="">Select Categories...</option>
                    <option value="Furniture">Furniture & Wood works</option>
                    <option value="IT Hardware">IT Hardware & Rack installations</option>
                    <option value="Constructions">Construction & General Contracting</option>
                    <option value="Logistics">Logistics & Supply chain delivery</option>
                    <option value="Stationery">Office Stationery supplies</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-650 tracking-wide block mb-1">GST Registration No.</label>
                  <input
                    type="text"
                    value={gstNo}
                    onChange={(e) => setGstNo(e.target.value)}
                    placeholder="e.g. 27AABCS1429BzO"
                    className="w-full text-xs font-mono border border-gray-300 rounded-lg p-2.5 bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-650 tracking-wide block mb-1">Country</label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="e.g. India"
                    className="w-full text-xs font-medium border border-gray-300 rounded-lg p-2.5 bg-white"
                  />
                </div>

              </div>

              <div>
                <label className="text-xs font-bold text-gray-650 tracking-wide block mb-1 font-semibold">Additional Information ....</label>
                <textarea
                  rows={3}
                  value={additionalInfo}
                  onChange={(e) => setAdditionalInfo(e.target.value)}
                  placeholder="Street and Number, City of Residence, registration notes..."
                  className="w-full text-xs font-medium border border-gray-300 rounded-lg p-2.5 bg-white outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setAddVendorMode(false)}
                className="text-xs font-bold text-gray-500 hover:text-gray-700 px-4 py-2 hover:bg-gray-50 rounded"
              >
                Discard
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 px-5 rounded-lg shadow-xs cursor-pointer"
              >
                Register
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Details Side-Drawer/Modal when viewing a specific vendor info */}
      {selectedVendor && (
        <div id="vendor-details-modal" className="fixed inset-0 z-50 overflow-y-auto bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-gray-150 p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-1.5">
                <Building className="text-blue-505 w-4.5 h-4.5" />
                <h3 className="font-bold text-gray-800 text-sm">Vendor Ledger</h3>
              </div>
              <button 
                onClick={() => setSelectedVendor(null)}
                className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Company Name</span>
                <span className="text-base font-bold text-gray-800">{selectedVendor.name}</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Category</span>
                  <span className="text-xs font-semibold text-gray-700">{selectedVendor.category}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">User Rating</span>
                  <span className="text-xs font-bold text-amber-500">⭐ {selectedVendor.rating.toFixed(1)} / 5</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">GSTIN</span>
                  <span className="text-xs font-mono font-medium text-gray-700">{selectedVendor.gstNo}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Contact Phone</span>
                  <span className="text-xs font-semibold text-gray-700">{selectedVendor.contactNo}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Company Email</span>
                <span className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" />
                  {selectedVendor.email}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Address</span>
                <span className="text-xs text-gray-600 block">{selectedVendor.address}, {selectedVendor.country}</span>
              </div>

              <div className="bg-slate-55 rounded-xl p-3 border border-gray-100">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1">Verify Operational Status</span>
                {currentRole === 'Admin' || currentRole === 'Procurement Officer' ? (
                  <div className="flex gap-2 mt-2">
                    {['Active', 'Pending', 'Blocked'].map((st) => (
                      <button
                        key={st}
                        onClick={() => {
                          updateVendorStatus(selectedVendor.id, st as VendorStatus);
                          setSelectedVendor({ ...selectedVendor, status: st as VendorStatus });
                        }}
                        className={`text-[10px] font-bold px-3 py-1 rounded transition-colors cursor-pointer ${
                          selectedVendor.status === st
                            ? st === 'Active' ? 'bg-emerald-500 text-white' : st === 'Blocked' ? 'bg-rose-500 text-white' : 'bg-amber-500 text-white'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs font-medium text-gray-600 italic block mt-1">
                    Contact admin accounts to override the status.
                  </span>
                )}
              </div>
            </div>

            <div className="flex border-t border-gray-100 pt-4 items-center justify-end">
              <button
                onClick={() => setSelectedVendor(null)}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer shadow-sm"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
