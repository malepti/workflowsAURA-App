import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Mail, Lock, User, ArrowRight, Loader2, Zap } from 'lucide-react';

export const AuthView: React.FC = () => {
  const { login, addToast } = useApp();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const rawApiBase = import.meta.env.VITE_API_URL || '';
      const apiBase = (!rawApiBase || rawApiBase.includes('workflowsaura-backend.onrender.com'))
        ? 'https://workflowsaura-app.onrender.com'
        : rawApiBase.replace(/\/+$/, '');
      const endpoint = `${apiBase}${isLogin ? '/api/v1/auth/login' : '/api/v1/auth/signup'}`;
      const body = isLogin 
        ? { email: formData.email, password: formData.password }
        : { email: formData.email, password: formData.password, full_name: formData.full_name || 'New User' };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      let data;
      try {
        data = await response.json();
      } catch (e) {
        data = { detail: 'Server is unreachable or returned invalid response.' };
      }

      if (!response.ok) {
        throw new Error(data.detail || 'Authentication failed');
      }

      if (isLogin) {
        login(data.access_token, { email: formData.email, name: formData.email.split('@')[0] });
        addToast('Welcome back!', 'success');
      } else {
        addToast('Account created successfully! Please log in.', 'success');
        setIsLogin(true);
      }
    } catch (err: any) {
      addToast(err.message || 'Network error', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-[#F8FAFF] relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/20 rounded-full blur-[120px]" />
      
      <div className="w-full max-w-md p-8 bg-white/80 backdrop-blur-xl rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.04)] border border-white/40 relative z-10 mx-4">
        <div className="flex flex-col items-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/30 mb-4">
            <Zap className="w-7 h-7 text-white fill-white/20" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isLogin ? 'Welcome to AuraAI' : 'Create your account'}
          </h1>
          <p className="text-gray-500 mt-2 text-sm text-center">
            {isLogin 
              ? 'Sign in to access your multi-model AI dashboard and credit ledger.' 
              : 'Join today and get 250 free credits to test premium AI models.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                required
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                required
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors mt-6 shadow-md shadow-gray-900/10 disabled:opacity-70"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <>
                {isLogin ? 'Sign In' : 'Create Account'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-500">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-600 font-medium hover:text-blue-700 underline underline-offset-2"
          >
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </div>
      </div>
    </div>
  );
};
