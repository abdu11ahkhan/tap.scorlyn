"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Plus, Edit2, Globe, ExternalLink, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { TEMPLATES } from "../templates/page";

type Website = {
  id: string;
  template_name: string;
  slug: string | null;
  published: boolean;
  created_at: string;
};

export default function WebsitesPage() {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const supabase = createClient();

  useEffect(() => {
    async function loadWebsites() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('websites')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (data) {
        setWebsites(data);
      }
      setLoading(false);
    }

    loadWebsites();
  }, []);

  const deleteWebsite = async (id: string) => {
    if (!confirm("Are you sure you want to delete this website? This action cannot be undone.")) return;
    
    // Save current state for rollback
    const previousWebsites = [...websites];
    
    // Optimistic UI update
    setWebsites(websites.filter(w => w.id !== id));
    
    const { error } = await supabase.from('websites').delete().eq('id', id);
    
    if (error) {
      console.error("Failed to delete website:", error);
      alert("Failed to delete website: " + error.message);
      // Rollback
      setWebsites(previousWebsites);
    }
  };

  const deleteAllWebsites = async () => {
    if (!confirm("DANGER: Are you absolutely sure you want to delete ALL your websites? This action CANNOT be undone.")) return;
    
    const previousWebsites = [...websites];
    setWebsites([]);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('websites').delete().eq('user_id', user.id);
    
    if (error) {
      console.error("Failed to delete all websites:", error);
      alert("Failed to delete websites: " + error.message);
      setWebsites(previousWebsites);
    }
  };

  const handleRename = async (id: string) => {
    if (!editValue.trim()) {
      setEditingId(null);
      return;
    }
    
    // Create URL-friendly slug
    const newSlug = editValue.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
    
    const previousWebsites = [...websites];
    setWebsites(websites.map(w => w.id === id ? { ...w, slug: newSlug } : w));
    setEditingId(null);
    
    const { error } = await supabase.from('websites').update({ slug: newSlug }).eq('id', id);
    
    if (error) {
      console.error("Failed to rename website:", error);
      if (error.code === '23505') {
        alert("This name is already taken. Please choose another one.");
      } else {
        alert("Failed to rename website: " + error.message);
      }
      setWebsites(previousWebsites);
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
    <div className="space-y-12 max-w-7xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-6"
      >
        <div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase mb-2">MY WEBSITES.</h1>
          <p className="text-xl text-slate-400 font-medium">Manage your created portfolio websites and digital business cards.</p>
        </div>
        <div className="flex items-center gap-4">
          {websites.length > 0 && (
            <button 
              onClick={deleteAllWebsites}
              className="flex items-center gap-2 bg-red-950/30 text-red-400 hover:bg-red-900/50 border border-red-900/50 h-14 px-6 rounded-full font-bold text-sm transition-all"
            >
              <Trash2 className="w-4 h-4" />
              Delete All
            </button>
          )}
          <Link 
            href="/dashboard/templates" 
            className="flex items-center gap-2 bg-white text-black hover:bg-gray-200 h-14 px-8 rounded-full font-bold text-lg transition-transform hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
          >
            <Plus className="w-5 h-5" />
            Create New
          </Link>
        </div>
      </motion.div>

      {websites.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-2 border-white/5 border-dashed rounded-[3rem] p-20 text-center bg-[#0A0A0A] flex flex-col items-center justify-center"
        >
          <div className="w-24 h-24 bg-slate-900 rounded-full flex items-center justify-center mb-8 border border-white/5">
            <Globe className="w-10 h-10 text-slate-500" />
          </div>
          <h3 className="text-3xl font-black uppercase tracking-tight mb-4">No websites yet</h3>
          <p className="text-slate-400 text-lg mb-10 max-w-md font-medium">
            You haven't created any websites yet. Choose a template to get started with your new portfolio.
          </p>
          <Link 
            href="/dashboard/templates" 
            className="bg-white text-black hover:bg-gray-200 px-10 py-5 rounded-full font-bold uppercase tracking-widest text-sm transition-all hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
          >
            Browse Templates
          </Link>
        </motion.div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {websites.map((website, i) => (
            <motion.div 
              key={website.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="border border-white/5 rounded-[2rem] bg-[#0A0A0A] overflow-hidden flex flex-col transition-all hover:border-white/10 hover:bg-[#111] group shadow-xl"
            >
              <div className="aspect-[16/10] bg-[#050505] border-b border-white/5 flex items-center justify-center relative overflow-hidden group-hover:border-white/10 transition-colors">
                {(() => {
                  const templateInfo = TEMPLATES.find(t => t.id === website.template_name);
                  if (templateInfo?.image) {
                    return (
                      <>
                        <img 
                          src={templateInfo.image} 
                          alt={`${templateInfo.name} Template`}
                          className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] to-transparent opacity-80" />
                        <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 z-20">
                          <span className="text-[10px] font-bold text-white uppercase tracking-widest">{templateInfo.name}</span>
                        </div>
                      </>
                    );
                  }
                  return (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-tr from-cyan-900/10 to-blue-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="text-center z-10 relative transition-transform duration-500 group-hover:scale-95">
                        <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5 shadow-inner">
                          <Globe className="w-8 h-8 text-slate-500" />
                        </div>
                        <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">{website.template_name} Template</span>
                      </div>
                    </>
                  );
                })()}
                
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 gap-6 z-20">
                  <Link 
                    href={`/dashboard/editor/${website.id}`}
                    className="bg-cyan-500 text-black p-4 rounded-full hover:scale-110 hover:bg-cyan-400 transition-all shadow-[0_0_20px_rgba(34,211,238,0.4)]"
                    title="Edit Website"
                  >
                    <Edit2 className="w-6 h-6" />
                  </Link>
                  {website.published && website.slug && (
                    <a 
                      href={`/${website.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white text-black p-4 rounded-full hover:scale-110 transition-all shadow-[0_0_20px_rgba(255,255,255,0.4)]"
                      title="View Live Site"
                    >
                      <ExternalLink className="w-6 h-6" />
                    </a>
                  )}
                </div>
              </div>
              
              <div className="p-8 flex flex-col flex-1">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1 min-w-0 pr-4">
                    {editingId === website.id ? (
                      <input 
                        autoFocus
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleRename(website.id)}
                        onBlur={() => handleRename(website.id)}
                        className="bg-[#1A1A24] border border-cyan-500/50 rounded-md px-3 py-1 text-white font-black text-xl uppercase w-full outline-none focus:border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.2)]"
                        placeholder="Enter new name..."
                      />
                    ) : (
                      <div className="flex items-center gap-3 group/title">
                        <h3 className="font-black text-2xl truncate uppercase tracking-tight">
                          {website.slug ? website.slug : 'Draft Website'}
                        </h3>
                        <button 
                          onClick={() => { setEditingId(website.id); setEditValue(website.slug || ''); }}
                          className="opacity-0 group-hover/title:opacity-100 text-gray-500 hover:text-cyan-400 transition-opacity p-1.5 hover:bg-white/5 rounded-md"
                          title="Rename Website"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    <p className="text-sm font-bold text-cyan-400 uppercase tracking-widest mt-2">
                      {website.template_name}
                    </p>
                  </div>
                  <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shrink-0 ${website.published ? 'bg-cyan-950 text-cyan-400 border border-cyan-900' : 'bg-slate-900 text-slate-400 border border-slate-800'}`}>
                    {website.published ? 'Published' : 'Draft'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between pt-6 border-t border-white/5 mt-auto">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Updated {new Date(website.created_at).toLocaleDateString()}
                  </span>
                  <button 
                    onClick={() => deleteWebsite(website.id)}
                    className="text-slate-500 hover:text-red-400 transition-colors p-2 hover:bg-red-500/10 rounded-xl"
                    title="Delete Website"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
