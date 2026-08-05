"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Globe, SmartphoneNfc, CreditCard, Eye, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

export default function DashboardPage() {
  const [userName, setUserName] = useState<string>("User");
  const [websites, setWebsites] = useState<any[]>([]);
  const [nfcCards, setNfcCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadDashboardData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Extract name from user metadata or email
      const name = user.user_metadata?.full_name || user.email?.split('@')[0] || "User";
      setUserName(name);

      // Fetch websites
      const { data: websitesData } = await supabase
        .from('websites')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (websitesData) setWebsites(websitesData);

      // Fetch NFC cards
      const { data: nfcData } = await supabase
        .from('nfc_cards')
        .select('*')
        .eq('user_id', user.id);

      if (nfcData) setNfcCards(nfcData);

      setLoading(false);
    }

    loadDashboardData();
  }, []);

  // Compute stats
  const activeSites = websites.filter(w => w.published).length;
  const totalSites = websites.length;
  const totalNfcCards = nfcCards.length;

  const stats = [
    { title: "TOTAL VIEWS", value: "0", icon: Eye, trend: "N/A" }, // Placeholder until analytics is added
    { title: "ACTIVE SITES", value: `${activeSites} / 3`, icon: Globe, trend: "FREE" },
    { title: "NFC CARDS", value: `${totalNfcCards}`, icon: SmartphoneNfc, trend: "ACTIVE" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-cyan-400 border-r-2"></div>
      </div>
    );
  }

  return (
    <div className="space-y-12 max-w-7xl mx-auto">

      {/* Welcome Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-6"
      >
        <div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase mb-2">DASHBOARD.</h1>
          <p className="text-xl text-slate-400 font-medium">Welcome back, <span className="capitalize">{userName}</span>. Here is your overview.</p>
        </div>
        <Link href="/dashboard/templates">
          <Button className="bg-white text-black hover:bg-gray-200 rounded-full h-14 px-8 font-bold text-lg transition-transform hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.2)]">
            <Plus className="w-5 h-5 mr-2" />
            New Portfolio
          </Button>
        </Link>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              key={i}
            >
              <Card className="p-8 rounded-[2rem] bg-[#0A0A0A] border-white/5 hover:bg-[#111] hover:border-white/10 transition-all duration-300">
                <div className="flex items-center justify-between mb-8">
                  <div className="p-4 rounded-2xl bg-cyan-950 border border-cyan-900/50">
                    <Icon className="w-6 h-6 text-cyan-400" />
                  </div>
                  <span className="text-sm font-black text-cyan-400 bg-cyan-950 px-3 py-1.5 rounded-full uppercase tracking-wider">
                    {stat.trend}
                  </span>
                </div>
                <div>
                  <h3 className="text-slate-500 font-bold text-sm uppercase tracking-widest mb-2">{stat.title}</h3>
                  <p className="text-5xl font-black tracking-tighter">{stat.value}</p>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Recent Websites & Subscription Status */}
      <div className="grid md:grid-cols-3 gap-8">

        {/* Recent Websites */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="md:col-span-2 space-y-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black uppercase tracking-tight">Recent Portfolios</h2>
            <Link href="/dashboard/websites" className="text-sm font-bold text-cyan-400 hover:text-cyan-300 transition-colors flex items-center">
              VIEW ALL <ArrowUpRight className="w-4 h-4 ml-1" />
            </Link>
          </div>

          <div className="space-y-4">
            {websites.length === 0 ? (
              <div className="p-12 rounded-[2rem] bg-[#0A0A0A] border border-white/5 border-dashed text-center">
                 <Globe className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                 <h3 className="text-xl font-bold mb-2">No Portfolios Found</h3>
                 <p className="text-slate-500 font-medium">Create your first portfolio to see it here.</p>
              </div>
            ) : (
              websites.slice(0, 3).map((site, i) => (
                <Link href={`/dashboard/editor/${site.id}`} key={site.id}>
                  <Card className="p-6 rounded-[2rem] bg-[#0A0A0A] border-white/5 flex items-center justify-between hover:bg-[#111] hover:border-white/10 transition-all cursor-pointer group mt-4">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center">
                        <Globe className="w-8 h-8 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                      </div>
                      <div>
                        <h4 className="text-xl font-bold mb-1 truncate max-w-[200px] md:max-w-xs">{site.slug || "Draft Website"}</h4>
                        <p className="text-sm font-medium text-slate-500">
                          {site.published ? `tapzar.com/${site.slug}` : 'Not published'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right hidden sm:block">
                        <p className="text-sm font-bold text-white uppercase">{site.template_name}</p>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Template</p>
                      </div>
                      <span className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider ${site.published ? 'bg-cyan-950 text-cyan-400' : 'bg-slate-900 text-slate-400'}`}>
                        {site.published ? 'Published' : 'Draft'}
                      </span>
                      <Button variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity font-bold rounded-full">
                        EDIT
                      </Button>
                    </div>
                  </Card>
                </Link>
              ))
            )}
          </div>
        </motion.div>

        {/* Subscription Status */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-6"
        >
          <h2 className="text-2xl font-black uppercase tracking-tight">Plan Details</h2>
          
          <Card className="p-8 rounded-[2rem] bg-gradient-to-b from-[#0A0A0A] to-[#050505] border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 group-hover:bg-cyan-500/20 transition-colors duration-500" />

            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 rounded-2xl bg-cyan-950 text-cyan-400 border border-cyan-900/50">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-xl uppercase tracking-tight">Free Plan</h3>
                <p className="text-xs font-bold text-cyan-400 uppercase tracking-widest">Active</p>
              </div>
            </div>

            <div className="space-y-3 mb-8">
              <div className="flex justify-between text-sm font-bold uppercase tracking-wider">
                <span className="text-slate-500">Websites</span>
                <span className="text-white">{totalSites} / 3</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-cyan-400 to-blue-500 h-3 rounded-full shadow-[0_0_15px_rgba(34,211,238,0.5)] transition-all duration-1000" 
                  style={{ width: `${Math.min((totalSites / 3) * 100, 100)}%` }} 
                />
              </div>
            </div>

            <Link href="/dashboard/billing">
              <Button className="w-full bg-white text-black hover:bg-gray-200 h-14 rounded-full font-black uppercase tracking-widest text-sm transition-all hover:scale-105">
                Upgrade to Pro
              </Button>
            </Link>
          </Card>

          {/* NFC Status */}
          <Card className="p-8 rounded-[2rem] bg-[#0A0A0A] border-white/5 hover:border-white/10 transition-colors">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-2xl bg-blue-950 text-blue-400 border border-blue-900/50">
                <SmartphoneNfc className="w-6 h-6" />
              </div>
              <h3 className="font-black text-xl uppercase tracking-tight">NFC Cards</h3>
            </div>
            <p className="text-sm font-medium text-slate-500 mb-6 leading-relaxed">
              {totalNfcCards === 0 
                ? "You have no active NFC cards connected." 
                : `You have ${totalNfcCards} active NFC card${totalNfcCards > 1 ? 's' : ''} connected.`}
            </p>
            <Link href="/dashboard/nfc">
              <Button variant="outline" className="w-full border-white/10 hover:bg-white/5 h-12 rounded-full font-bold uppercase tracking-widest text-xs">
                Manage Cards
              </Button>
            </Link>
          </Card>
        </motion.div>

      </div>
    </div>
  );
}
