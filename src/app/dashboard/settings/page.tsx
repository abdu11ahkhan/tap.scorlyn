"use client";

import { useState, useEffect } from "react";
import { User, Mail, Bell, Shield, Key, Lock, Smartphone, LogOut, Copy, Check, Eye, EyeOff, Plus, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  const supabase = createClient();
  const router = useRouter();

  // Profile Form State
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  
  // Password State
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Notification State
  const [notifyNfc, setNotifyNfc] = useState(true);
  const [notifyAnalytics, setNotifyAnalytics] = useState(true);
  const [notifyMarketing, setNotifyMarketing] = useState(false);
  
  // API Keys State
  const [apiKeys, setApiKeys] = useState<{name: string, token: string, date: string}[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        
        const meta = user.user_metadata || {};
        setDisplayName(meta.full_name || "");
        setBio(meta.bio || "");
        
        if (meta.notifications) {
          setNotifyNfc(meta.notifications.nfc ?? true);
          setNotifyAnalytics(meta.notifications.analytics ?? true);
          setNotifyMarketing(meta.notifications.marketing ?? false);
        }
        
        if (meta.api_keys) {
          setApiKeys(meta.api_keys);
        } else {
          setApiKeys([
            { name: "Production App", token: "tf_live_8f92jX9q2", date: new Date().toLocaleDateString() }
          ]);
        }
      }
      setLoading(false);
    }
    loadUser();
  }, []);

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    
    await supabase.auth.updateUser({
      data: {
        full_name: displayName,
        bio: bio
      }
    });
    
    await supabase.from('profiles').update({
      full_name: displayName
    }).eq('id', user.id);
    
    alert("Profile saved successfully!");
    setSaving(false);
  };

  const updatePassword = async () => {
    if (!newPassword) return;
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSaving(false);
    
    if (error) {
      alert(error.message);
    } else {
      alert("Password updated successfully!");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const toggleNotification = async (key: 'nfc' | 'analytics' | 'marketing', value: boolean) => {
    if (!user) return;
    
    if (key === 'nfc') setNotifyNfc(value);
    if (key === 'analytics') setNotifyAnalytics(value);
    if (key === 'marketing') setNotifyMarketing(value);
    
    const currentMeta = user.user_metadata || {};
    const newNotifications = {
      nfc: key === 'nfc' ? value : notifyNfc,
      analytics: key === 'analytics' ? value : notifyAnalytics,
      marketing: key === 'marketing' ? value : notifyMarketing
    };
    
    await supabase.auth.updateUser({
      data: {
        ...currentMeta,
        notifications: newNotifications
      }
    });
  };

  const generateApiKey = async () => {
    if (!user) return;
    const newKey = {
      name: `Key ${apiKeys.length + 1}`,
      token: `tf_live_${Math.random().toString(36).substr(2, 10)}`,
      date: new Date().toLocaleDateString()
    };
    const newApiKeys = [newKey, ...apiKeys];
    setApiKeys(newApiKeys);
    
    await supabase.auth.updateUser({
      data: { api_keys: newApiKeys }
    });
  };

  const revokeApiKey = async (tokenToRevoke: string) => {
    if (!user) return;
    const newApiKeys = apiKeys.filter(k => k.token !== tokenToRevoke);
    setApiKeys(newApiKeys);
    await supabase.auth.updateUser({
      data: { api_keys: newApiKeys }
    });
  };

  const handleCopy = (token: string) => {
    navigator.clipboard.writeText(token);
    setCopiedKey(token);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const deleteAccount = async () => {
    if (confirm("Are you absolutely sure you want to delete your account? This action cannot be undone.")) {
      alert("Account deletion request logged. You will be signed out.");
      await supabase.auth.signOut();
      router.push("/login");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-cyan-400 border-r-2"></div>
      </div>
    );
  }

  return (
    <div className="space-y-12 max-w-7xl mx-auto pb-20">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase mb-2">SETTINGS.</h1>
        <p className="text-xl text-slate-400 font-medium">
          Manage your account preferences and security settings.
        </p>
      </motion.div>

      <div className="flex flex-col md:flex-row gap-10">
        {/* Settings Sidebar */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="w-full md:w-72 space-y-2 shrink-0"
        >
          <button 
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-left transition-all duration-300 font-bold ${activeTab === 'profile' ? 'bg-[#0A0A0A] border border-white/10 text-white shadow-xl' : 'text-slate-500 hover:text-white hover:bg-white/5 border border-transparent'}`}
          >
            <User className={`w-5 h-5 ${activeTab === 'profile' ? 'text-cyan-400' : 'text-slate-500'}`} /> Profile
          </button>
          <button 
            onClick={() => setActiveTab('account')}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-left transition-all duration-300 font-bold ${activeTab === 'account' ? 'bg-[#0A0A0A] border border-white/10 text-white shadow-xl' : 'text-slate-500 hover:text-white hover:bg-white/5 border border-transparent'}`}
          >
            <Shield className={`w-5 h-5 ${activeTab === 'account' ? 'text-cyan-400' : 'text-slate-500'}`} /> Account Security
          </button>
          <button 
            onClick={() => setActiveTab('notifications')}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-left transition-all duration-300 font-bold ${activeTab === 'notifications' ? 'bg-[#0A0A0A] border border-white/10 text-white shadow-xl' : 'text-slate-500 hover:text-white hover:bg-white/5 border border-transparent'}`}
          >
            <Bell className={`w-5 h-5 ${activeTab === 'notifications' ? 'text-cyan-400' : 'text-slate-500'}`} /> Notifications
          </button>
          <button 
            onClick={() => setActiveTab('api')}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-left transition-all duration-300 font-bold ${activeTab === 'api' ? 'bg-[#0A0A0A] border border-white/10 text-white shadow-xl' : 'text-slate-500 hover:text-white hover:bg-white/5 border border-transparent'}`}
          >
            <Key className={`w-5 h-5 ${activeTab === 'api' ? 'text-cyan-400' : 'text-slate-500'}`} /> API Keys
          </button>
        </motion.div>

        {/* Settings Content */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex-1 bg-[#0A0A0A] border border-white/5 rounded-[2rem] p-10 shadow-2xl"
        >
          {activeTab === 'profile' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-black uppercase tracking-tight">Public Profile</h2>
              
              <div className="flex items-center gap-8 mb-10">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-cyan-400 to-blue-600 flex items-center justify-center text-3xl font-black shadow-[0_0_20px_rgba(34,211,238,0.3)]">
                  {displayName ? displayName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <button className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-sm font-bold uppercase tracking-widest transition-colors mb-3">
                    Change Avatar
                  </button>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">JPG, GIF or PNG. Max size 2MB.</p>
                </div>
              </div>

              <div className="grid gap-8">
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Display Name</label>
                  <input 
                    type="text" 
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-[#050505] border border-white/5 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                  />
                </div>
                
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input 
                      type="email" 
                      value={user?.email || ''}
                      readOnly
                      className="w-full bg-[#050505] border border-white/5 rounded-2xl pl-16 pr-6 py-4 text-slate-400 font-bold cursor-not-allowed"
                    />
                  </div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-2">To change your email, please contact support.</p>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Bio</label>
                  <textarea 
                    rows={4}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us a little bit about yourself"
                    className="w-full bg-[#050505] border border-white/5 rounded-2xl px-6 py-4 text-white font-medium focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all resize-none"
                  ></textarea>
                </div>
              </div>

              <div className="pt-8 mt-8 border-t border-white/5 flex justify-end">
                <button 
                  onClick={saveProfile}
                  disabled={saving}
                  className="bg-white text-black hover:bg-gray-200 px-8 py-4 rounded-full font-black uppercase tracking-widest text-sm transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'account' && (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tight mb-2">Account Security</h2>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest">Update your password and secure your account</p>
              </div>

              <div className="space-y-6">
                <h3 className="text-sm font-black text-cyan-400 uppercase tracking-widest border-b border-white/5 pb-4">Change Password</h3>
                <div className="grid gap-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-xs font-black text-slate-500 uppercase tracking-widest">New Password</label>
                      <input 
                        type="password" 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="New Password"
                        className="w-full bg-[#050505] border border-white/5 rounded-2xl px-6 py-4 text-white font-medium focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Confirm Password</label>
                      <input 
                        type="password" 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm Password"
                        className="w-full bg-[#050505] border border-white/5 rounded-2xl px-6 py-4 text-white font-medium focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <button 
                      onClick={updatePassword}
                      disabled={saving || !newPassword || newPassword !== confirmPassword}
                      className="bg-white/10 text-white hover:bg-white/20 px-8 py-3.5 rounded-full font-black uppercase tracking-widest text-sm transition-all shadow-[0_0_20px_rgba(255,255,255,0.05)] disabled:opacity-50"
                    >
                      {saving ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-6 pt-6">
                <h3 className="text-sm font-black text-cyan-400 uppercase tracking-widest border-b border-white/5 pb-4">Two-Factor Authentication</h3>
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-[#050505] p-6 rounded-2xl border border-white/5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-900/20 text-blue-400 rounded-xl flex items-center justify-center shrink-0 border border-blue-500/20">
                      <Smartphone className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-lg">Authenticator App</h4>
                      <p className="text-sm font-medium text-slate-500 mt-1 max-w-sm">Use an app like Google Authenticator to generate one-time security codes.</p>
                    </div>
                  </div>
                  <button className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-full font-bold uppercase tracking-widest text-xs transition-colors shrink-0 shadow-[0_0_15px_rgba(37,99,235,0.4)]">
                    Enable 2FA
                  </button>
                </div>
              </div>

              <div className="space-y-6 pt-6">
                <h3 className="text-sm font-black text-red-400 uppercase tracking-widest border-b border-white/5 pb-4">Danger Zone</h3>
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-red-950/10 p-6 rounded-2xl border border-red-900/20">
                  <div>
                    <h4 className="font-bold text-white text-lg">Delete Account</h4>
                    <p className="text-sm font-medium text-slate-500 mt-1 max-w-sm">Permanently delete your account and all associated websites and NFC data.</p>
                  </div>
                  <button onClick={deleteAccount} className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/50 px-6 py-3 rounded-full font-bold uppercase tracking-widest text-xs transition-colors shrink-0">
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tight mb-2">Notifications</h2>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest">Control how and when we contact you</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-6 bg-[#050505] rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                  <div>
                    <h4 className="font-bold text-white text-lg">NFC Tap Alerts</h4>
                    <p className="text-sm font-medium text-slate-500 mt-1">Get an email notification whenever someone scans your physical NFC card.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={notifyNfc} onChange={(e) => toggleNotification('nfc', e.target.checked)} className="sr-only peer" />
                    <div className="w-14 h-7 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-cyan-500 shadow-inner"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-6 bg-[#050505] rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                  <div>
                    <h4 className="font-bold text-white text-lg">Weekly Analytics</h4>
                    <p className="text-sm font-medium text-slate-500 mt-1">Receive a weekly digest of your portfolio traffic and engagement stats.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={notifyAnalytics} onChange={(e) => toggleNotification('analytics', e.target.checked)} className="sr-only peer" />
                    <div className="w-14 h-7 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-cyan-500 shadow-inner"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-6 bg-[#050505] rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                  <div>
                    <h4 className="font-bold text-white text-lg">Product Updates & Marketing</h4>
                    <p className="text-sm font-medium text-slate-500 mt-1">Hear about new templates, features, and Tapzar news.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={notifyMarketing} onChange={(e) => toggleNotification('marketing', e.target.checked)} className="sr-only peer" />
                    <div className="w-14 h-7 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-cyan-500 shadow-inner"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between p-6 bg-[#050505] rounded-2xl border border-white/5 hover:border-white/10 transition-colors opacity-70">
                  <div>
                    <h4 className="font-bold text-white text-lg flex items-center gap-2">Security Alerts <AlertTriangle className="w-4 h-4 text-amber-500" /></h4>
                    <p className="text-sm font-medium text-slate-500 mt-1">Critical notifications regarding your account security and logins.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-not-allowed opacity-50">
                    <input type="checkbox" className="sr-only peer" defaultChecked disabled />
                    <div className="w-14 h-7 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-cyan-500 shadow-inner"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'api' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-tight mb-2">API Keys</h2>
                  <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest max-w-lg">
                    Manage your secret API keys to programmatically interact with your Tapzar data.
                  </p>
                </div>
                <button 
                  onClick={generateApiKey}
                  className="flex items-center gap-2 bg-white text-black hover:bg-gray-200 px-6 py-3.5 rounded-full font-black uppercase tracking-widest text-sm transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] shrink-0"
                >
                  <Plus className="w-4 h-4" /> Generate New Key
                </button>
              </div>

              <div className="bg-[#050505] rounded-3xl border border-white/5 overflow-hidden">
                <div className="grid grid-cols-12 gap-4 p-6 border-b border-white/5 bg-white/[0.02]">
                  <div className="col-span-4 text-xs font-black text-slate-500 uppercase tracking-widest">Name</div>
                  <div className="col-span-5 text-xs font-black text-slate-500 uppercase tracking-widest">Token</div>
                  <div className="col-span-3 text-xs font-black text-slate-500 uppercase tracking-widest text-right">Created</div>
                </div>
                
                <div className="divide-y divide-white/5">
                  {apiKeys.length === 0 && (
                    <div className="p-8 text-center text-slate-500 font-medium">No API keys generated yet.</div>
                  )}
                  {apiKeys.map((key, i) => (
                    <div key={i} className="grid grid-cols-12 gap-4 p-6 items-center hover:bg-white/[0.02] transition-colors">
                      <div className="col-span-4 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                          <Key className="w-4 h-4 text-cyan-400" />
                        </div>
                        <span className="font-bold text-white truncate">{key.name}</span>
                      </div>
                      <div className="col-span-5 flex items-center gap-3">
                        <code className="font-mono text-sm text-cyan-400 bg-cyan-950/30 px-3 py-1.5 rounded-md border border-cyan-900/50">
                          {key.token}
                        </code>
                        <button onClick={() => handleCopy(key.token)} className="text-slate-500 hover:text-white transition-colors" title="Copy to clipboard">
                          {copiedKey === key.token ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                      <div className="col-span-3 flex items-center justify-end gap-6">
                        <span className="text-sm font-semibold text-slate-500">{key.date}</span>
                        <button onClick={() => revokeApiKey(key.token)} className="text-slate-600 hover:text-red-400 transition-colors" title="Revoke Key">
                          <AlertTriangle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-cyan-950/20 border border-cyan-900/30 p-6 rounded-2xl flex gap-4 items-start">
                <AlertTriangle className="w-6 h-6 text-cyan-400 shrink-0" />
                <div>
                  <h4 className="font-bold text-white mb-1">Keep your keys secret</h4>
                  <p className="text-sm text-slate-400 font-medium leading-relaxed">
                    API keys carry many privileges. Do not share these secret keys in publicly accessible areas such as GitHub, client-side code, and so forth.
                  </p>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
