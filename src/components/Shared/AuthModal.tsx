import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { X, ShieldCheck } from 'lucide-react';

export const AuthModal = () => {
  const { showLoginModal, setShowLoginModal, login } = useAuth();
  const [email, setEmail] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isRobotVerified, setIsRobotVerified] = useState(false);
  const [error, setError] = useState('');

  if (!showLoginModal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isRobotVerified) {
      setError("Tolong verifikasi I'm not a robot.");
      return;
    }

    if (!email || !email.includes('@')) {
      setError("Masukkan email yang valid.");
      return;
    }

    if (isRegistering && localStorage.getItem('geoai_registered_device') === 'true') {
      setError("Perangkat ini sudah didaftarkan sebelumnya. Silakan gunakan menu Login.");
      return;
    }

    const endpoint = isRegistering ? '/api/auth/register' : '/api/auth/login';
    
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      let data;
      try {
        data = await res.json();
      } catch (e) {
        console.error("Failed to parse JSON response:", e);
        const text = await res.text();
        setError(`Server returned non-JSON: ${text.substring(0, 50)}`);
        return;
      }

      if (data.success) {
        if (isRegistering) {
          localStorage.setItem('geoai_registered_device', 'true');
        }
        login(email);
      } else {
        setError(data.error || "Terjadi kesalahan.");
      }
    } catch (err: any) {
      console.error("Fetch error:", err);
      setError("Gagal terhubung ke server.");
    }
  };

  return (
    <div className="fixed inset-0 z-[999999] bg-black/80 flex items-center justify-center p-4">
      <div className="bg-[#111] border border-cyan-500/30 rounded-xl p-6 w-full max-w-sm relative shadow-2xl shadow-cyan-900/20">
        <button 
          onClick={() => setShowLoginModal(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <ShieldCheck className="w-12 h-12 text-cyan-400 mx-auto mb-2" />
          <h2 className="text-xl font-bold text-white uppercase tracking-wider">
            {isRegistering ? 'Register Access' : 'Login Required'}
          </h2>
          <p className="text-xs text-gray-400 mt-1">Sistem Keamanan GEOAI Pro V4</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 text-xs p-2 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-cyan-500 uppercase tracking-wider mb-1">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#1A1A1A] border border-gray-700 text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
              placeholder="operator@geoai.com"
            />
          </div>

          <div className="flex items-center gap-2 border border-gray-700 p-3 rounded bg-[#1A1A1A]">
            <input 
              type="checkbox" 
              id="robot-check"
              checked={isRobotVerified}
              onChange={(e) => setIsRobotVerified(e.target.checked)}
              className="w-4 h-4 cursor-pointer accent-cyan-500"
            />
            <label htmlFor="robot-check" className="text-sm text-gray-300 cursor-pointer select-none flex-1">
              I'm not a robot
            </label>
            <div className="flex flex-col items-center justify-center gap-1">
              <img src="https://www.gstatic.com/recaptcha/api2/logo_48.png" className="w-6 opacity-70" alt="reCaptcha" />
              <span className="text-[8px] text-gray-500">reCAPTCHA</span>
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 rounded text-sm transition-colors uppercase tracking-widest"
          >
            {isRegistering ? 'Daftar & Akses' : 'Login'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button 
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-xs text-gray-400 hover:text-cyan-400"
          >
            {isRegistering ? 'Sudah punya akun? Login di sini' : 'Belum punya akun? Daftar di sini'}
          </button>
        </div>
      </div>
    </div>
  );
};
