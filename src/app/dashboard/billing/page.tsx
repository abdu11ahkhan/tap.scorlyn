"use client";

import { Check, CreditCard, Zap } from "lucide-react";
import { motion } from "framer-motion";

export default function BillingPage() {
  return (
    <div className="space-y-12 max-w-7xl mx-auto pb-20">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-6"
      >
        <div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase mb-2">BILLING.</h1>
          <p className="text-xl text-slate-400 font-medium">Manage your subscription, billing details, and view invoices.</p>
        </div>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Current Plan */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="bg-[#0A0A0A] border border-white/5 rounded-[2rem] p-10 relative overflow-hidden group hover:bg-[#111] transition-colors"
        >
          <div className="absolute top-0 right-0 p-8 opacity-5 text-white transition-opacity group-hover:opacity-10">
            <Zap className="w-48 h-48 -mr-10 -mt-10" />
          </div>
          <div className="relative z-10">
            <h3 className="text-2xl font-black uppercase tracking-tight mb-2">Free Plan</h3>
            <p className="text-slate-400 mb-8 font-medium">You are currently on the basic free plan.</p>

            <div className="text-6xl font-black mb-8 tracking-tighter">$0 <span className="text-xl font-bold text-slate-500 uppercase tracking-widest">/ mo</span></div>

            <ul className="space-y-5 mb-10">
              <li className="flex items-center gap-4 font-bold text-white"><Check className="w-5 h-5 text-cyan-400" /> 1 Portfolio Website</li>
              <li className="flex items-center gap-4 font-bold text-white"><Check className="w-5 h-5 text-cyan-400" /> Standard Templates</li>
              <li className="flex items-center gap-4 font-bold text-white"><Check className="w-5 h-5 text-cyan-400" /> ScorlynTap Subdomain</li>
              <li className="flex items-center gap-4 font-bold text-slate-600"><Check className="w-5 h-5 text-slate-700" /> No Custom Domains</li>
              <li className="flex items-center gap-4 font-bold text-slate-600"><Check className="w-5 h-5 text-slate-700" /> No Advanced Analytics</li>
            </ul>
          </div>
        </motion.div>

        {/* Pro Plan Upgrade */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="bg-gradient-to-b from-[#0A0A0A] to-[#050505] border border-cyan-900/30 rounded-[2rem] p-10 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 bg-cyan-950 text-cyan-400 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-bl-2xl border-l border-b border-cyan-900/50 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
            RECOMMENDED
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none group-hover:bg-cyan-500/20 transition-colors" />

          <div className="relative z-10 flex flex-col h-full">
            <h3 className="text-2xl font-black uppercase tracking-tight mb-2 text-white">Pro Plan</h3>
            <p className="text-slate-400 mb-8 font-medium">Everything you need for a professional presence.</p>

            <div className="text-6xl font-black mb-8 tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">$12 <span className="text-xl font-bold text-slate-500 uppercase tracking-widest">/ mo</span></div>

            <ul className="space-y-5 mb-10 flex-1">
              <li className="flex items-center gap-4 font-bold text-white"><Check className="w-5 h-5 text-cyan-400" /> Unlimited Websites</li>
              <li className="flex items-center gap-4 font-bold text-white"><Check className="w-5 h-5 text-cyan-400" /> Premium 3D Templates</li>
              <li className="flex items-center gap-4 font-bold text-white"><Check className="w-5 h-5 text-cyan-400" /> Custom Domain Support</li>
              <li className="flex items-center gap-4 font-bold text-white"><Check className="w-5 h-5 text-cyan-400" /> Advanced Analytics</li>
              <li className="flex items-center gap-4 font-bold text-white"><Check className="w-5 h-5 text-cyan-400" /> Priority Support</li>
            </ul>

            <button className="w-full py-5 rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 text-black font-black uppercase tracking-widest text-sm transition-transform hover:scale-105 shadow-[0_0_30px_rgba(34,211,238,0.3)] mt-auto">
              Upgrade to Pro
            </button>
          </div>
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="bg-[#0A0A0A] border border-white/5 rounded-[2rem] p-8 mt-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:bg-[#111] transition-colors"
      >
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center border border-white/5">
            <CreditCard className="w-8 h-8 text-slate-500" />
          </div>
          <div>
            <h3 className="font-black text-xl uppercase tracking-tight mb-1">Payment Methods</h3>
            <p className="text-sm text-slate-500 font-medium">No payment methods added yet.</p>
          </div>
        </div>
        <button className="px-8 py-4 rounded-full border border-white/10 hover:bg-white/5 font-bold uppercase tracking-widest text-xs transition-colors shadow-sm">
          Add Card
        </button>
      </motion.div>
    </div>
  );
}
