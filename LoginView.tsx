import React, { useState } from 'react';
import { useERP } from './ERPContext';
import { UserRole } from './types';
import { ShieldCheck, User, Lock, Mail, Users, Building, Globe } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login, signup, forgotPassword } = useERP();
  
  // Toggle between 'login', 'signup', and 'forgot'
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  
  // Login input states
  const [email, setEmail] = useState('officer@vendorbridge.com');
  const [password, setPassword] = useState('password123');
  const [selectedRole, setSelectedRole] = useState<UserRole>('Procurement Officer');

  // Register state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('Vendor');
  const [regCountry, setRegCountry] = useState('India');
  const [regAdditional, setRegAdditional] = useState('');

  // Password reset message state
  const [resetMsg, setResetMsg] = useState<string | null>(null);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      alert('Please enter simulated email');
      return;
    }
    const success = login(email, selectedRole);
    if (!success) {
      alert('Error details matched no predefined demo accounts.');
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !regEmail) {
      alert('Must populate required fields.');
      return;
    }
    signup({
      email: regEmail,
      firstName,
      lastName,
      role: regRole,
      phone: regPhone,
      country: regCountry,
      additionalInfo: regAdditional
    });
    alert('Mock Registration Complete! Logged into active portal session.');
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const resolved = forgotPassword(email);
    setResetMsg(resolved);
  };

  // Demo selector setup
  const demoProfiles: { email: string; role: UserRole; name: string }[] = [
    { email: 'officer@vendorbridge.com', role: 'Procurement Officer', name: 'Rahul Mehta' },
    { email: 'vendor@infra.com', role: 'Vendor', name: 'Amit Patel (Infra)' },
    { email: 'manager@vendorbridge.com', role: 'Manager/Approver', name: 'Priya Shah' },
    { email: 'admin@vendorbridge.com', role: 'Admin', name: 'System Admin' }
  ];

  return (
    <div id="login-layout-wrapper" className="min-h-screen bg-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
      
      {/* Visual background ambient circles */}
      <div className="absolute top-0 left-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl -translate-x-12 -translate-y-12" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl translate-x-12 translate-y-12" />

      {mode === 'login' && (
        /* SCREEN 1: LOGIN CARD SCREEN */
        <div id="login-card-screen1" className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-md w-full p-8 space-y-6 relative z-10 animate-in fade-in zoom-in-95 duration-200">
          
          {/* Logo brand */}
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight font-sans">VendorBridge</h1>
            <span className="text-[10px] text-gray-400 font-mono tracking-wider uppercase block">Procurement & Vendor ERP</span>
          </div>

          {/* Photo circle placeholder (Direct Excalidraw mockup visual replication) */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-20 h-20 rounded-full border-2 border-dashed border-gray-200 bg-gray-55/40 flex items-center justify-center select-none">
              <span className="text-[11px] font-bold text-gray-400 tracking-widest uppercase">Photo</span>
            </div>
            <span className="text-[10px] text-gray-400 italic">User Profile Avatar</span>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            
            {/* Username/Email Input */}
            <div>
              <label className="text-xs font-bold text-gray-650 block mb-1">Username / Email</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@vendorbridge.com"
                  required
                  className="w-full text-xs border border-gray-300 rounded-lg py-2.5 pl-10 pr-3 outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Password input */}
            <div>
              <label className="text-xs font-bold text-gray-650 block mb-1">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full text-xs border border-gray-300 rounded-lg py-2.5 pl-10 pr-3 outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Role select input */}
            <div>
              <label className="text-xs font-bold text-gray-650 block mb-1">Select Access Role</label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                className="w-full text-xs font-semibold border border-gray-300 bg-white rounded-lg py-2.5 px-3 outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="Procurement Officer">Procurement Officer</option>
                <option value="Vendor">Vendor</option>
                <option value="Manager/Approver">Manager/Approver</option>
                <option value="Admin">Admin</option>
              </select>
            </div>

            {/* Login button */}
            <button
              id="submit-login-button"
              type="submit"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-3 px-4 rounded-lg shadow-md transition-all active:scale-99 cursor-pointer"
            >
              Login Button
            </button>
          </form>

          {/* predefined demo quick profiles logins for easy test evaluation */}
          <div className="bg-gray-50 border border-gray-150 p-4 rounded-xl space-y-2.5">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block text-center">PRE-CONFIGURED TESTING LOGINS</span>
            <div className="grid grid-cols-2 gap-2">
              {demoProfiles.map((p) => (
                <button
                  key={p.role}
                  type="button"
                  onClick={() => {
                    setEmail(p.email);
                    setSelectedRole(p.role);
                  }}
                  className="bg-white border hover:bg-gray-50 border-gray-200 text-[10px] p-2 rounded-lg text-left truncate cursor-pointer transition-colors"
                >
                  <span className="font-bold text-gray-800 block truncate">{p.name}</span>
                  <span className="text-gray-400 block text-[9px] truncate">{p.role}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-400 font-semibold border-t border-gray-100 pt-4">
            <button onClick={() => setMode('forgot')} className="hover:text-gray-700">Forgot password</button>
            <button onClick={() => setMode('signup')} className="text-blue-500 hover:underline">Register Screen (Screen 2)</button>
          </div>

        </div>
      )}

      {mode === 'signup' && (
        /* SCREEN 2: REGISTRATION SCREEN */
        <div id="registration-card-screen2" className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-lg w-full p-8 space-y-6 relative z-10 animate-in fade-in zoom-in-95 duration-200">
          
          <div className="text-center space-y-1 border-b border-gray-100 pb-3">
            <h1 className="text-xl font-extrabold text-gray-900 tracking-tight font-sans">Registration Screen (Screen 2)</h1>
            <span className="text-xs text-gray-400 block">Create simulated role-based credentials</span>
          </div>

          {/* Photo circle placeholder matching Screen 2 mockup top design */}
          <div className="flex flex-col items-center gap-1.5">
            <div className="w-16 h-16 rounded-full border-2 border-dashed border-gray-200 bg-gray-55/40 flex items-center justify-center select-none">
              <span className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Photo</span>
            </div>
          </div>

          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold text-gray-650 block mb-1">First Name</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Rahul"
                  className="w-full text-xs border border-gray-300 rounded-lg p-2 bg-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-650 block mb-1">Last Name</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Mehta"
                  className="w-full text-xs border border-gray-300 rounded-lg p-2 bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold text-gray-650 block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="rehul@mehta.com"
                  className="w-full text-xs border border-gray-300 rounded-lg p-2 bg-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-650 block mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="9876543210"
                  className="w-full text-xs border border-gray-300 rounded-lg p-2 bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold text-gray-650 block mb-1">Role (Admin, officer, etc)</label>
                <select
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value as UserRole)}
                  className="w-full text-xs font-semibold border border-gray-300 bg-white rounded-lg p-2"
                >
                  <option value="Procurement Officer">Procurement Officer</option>
                  <option value="Vendor">Vendor ( অমিত )</option>
                  <option value="Manager/Approver">Manager/Approver</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-650 block mb-1">Country</label>
                <input
                  type="text"
                  value={regCountry}
                  onChange={(e) => setRegCountry(e.target.value)}
                  placeholder="India"
                  className="w-full text-xs border border-gray-300 rounded-lg p-2 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-650 block mb-1">Additional Information ....</label>
              <textarea
                rows={2}
                value={regAdditional}
                onChange={(e) => setRegAdditional(e.target.value)}
                placeholder="GST numbers, building addresses..."
                className="w-full text-xs border border-gray-300 rounded-lg p-2 outline-none focus:ring-1 focus:ring-blue-500 bg-white"
              />
            </div>

            <button
              id="submit-register-button"
              type="submit"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-3 px-4 rounded-lg shadow-md cursor-pointer transition-colors"
            >
              Register
            </button>
          </form>

          <div className="flex border-t border-gray-100 pt-4 items-center justify-center text-xs text-gray-400 font-semibold">
            <span>Already have an account? </span>
            <button onClick={() => setMode('login')} className="text-blue-500 ml-1.5 hover:underline">Log in here</button>
          </div>

        </div>
      )}

      {mode === 'forgot' && (
        /* FORGOT PASSWORD SCREEN representation */
        <div id="forgot-card" className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-md w-full p-8 space-y-6 relative z-10 animate-in fade-in zoom-in-95 duration-200">
          
          <div className="text-center space-y-1">
            <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">Forgot Password</h1>
            <p className="text-xs text-gray-400">Trigger simulated workspace reset linkages</p>
          </div>

          {resetMsg && (
            <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-xs font-semibold border border-blue-105">
              {resetMsg}
            </div>
          )}

          <form onSubmit={handleForgotSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-650 block mb-1">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setResetMsg(null);
                  }}
                  placeholder="officer@vendorbridge.com"
                  required
                  className="w-full text-xs border border-gray-300 rounded-lg py-2.5 pl-10 pr-3 outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              id="submit-forgot-pwd"
              type="submit"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 px-4 rounded-lg shadow-md cursor-pointer"
            >
              Reset Password
            </button>
          </form>

          <div className="flex border-t border-gray-100 pt-4 items-center justify-center text-xs text-gray-400 font-semibold">
            <button onClick={() => setMode('login')} className="text-blue-500 hover:underline">Return to Login</button>
          </div>

        </div>
      )}

    </div>
  );
};
