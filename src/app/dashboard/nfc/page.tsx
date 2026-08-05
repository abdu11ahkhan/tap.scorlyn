"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { SmartphoneNfc, CreditCard, Link as LinkIcon, RefreshCw, CheckCircle2, Trash2 } from "lucide-react";
import { motion, useMotionValue, useTransform, useSpring, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import { X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function PhotorealisticHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const floatRef = useRef<HTMLDivElement>(null);

  // Mouse tilt physics
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x, { stiffness: 150, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 150, damping: 20 });
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], [6, -6]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], [-6, 6]);

  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    setIsHovered(false);
  };

  useEffect(() => {
    if (!floatRef.current) return;
    // GSAP Floating Animation
    const ctx = gsap.context(() => {
      gsap.to(floatRef.current, {
        y: -10,
        rotation: 0.5,
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: "power1.inOut"
      });
    }, floatRef);
    return () => ctx.revert();
  }, []);

  return (
    <div
      className="relative w-full max-w-[480px] h-[520px] mx-auto md:mx-0 group cursor-pointer"
      style={{ perspective: 1000 }}
      ref={containerRef}
      onMouseMove={(e) => { handleMouseMove(e); setIsHovered(true); }}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={() => setIsHovered(true)}
    >
      {/* Background radial glows behind container */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-cyan-500/20 rounded-full blur-[80px] pointer-events-none transition-opacity duration-700 opacity-50 group-hover:opacity-80" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-indigo-500/20 rounded-full blur-[80px] pointer-events-none transition-opacity duration-700 opacity-50 group-hover:opacity-80" />

      {/* Main 3D Container */}
      <motion.div
        ref={floatRef}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="w-full h-full rounded-[24px] border border-[#2A2F45] bg-[#0A0D14]/80 backdrop-blur-2xl shadow-2xl overflow-hidden relative flex items-center justify-center"
      >
        {/* Subtle Grid Texture */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none mix-blend-overlay"
          style={{ backgroundImage: 'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)', backgroundSize: '20px 20px' }}
        />

        {/* The Photorealistic Image */}
        <div ref={imageRef} className="absolute inset-0 w-full h-full z-0 transition-transform duration-700 ease-out scale-[1.01] group-hover:scale-[1.04]">
          <Image
            src="/nfc-hero.png"
            alt="NFC Smart Tap"
            fill
            className="object-cover"
            priority
            style={{
              filter: isHovered
                ? "contrast(1.1) brightness(1.1) saturate(1.1)"
                : "contrast(1.05) brightness(0.95) saturate(1.0)"
            }}
          />
          {/* Edge Vignette & Dark Gradient to blend white backgrounds naturally */}
          <div className="absolute inset-0 shadow-[inset_0_0_100px_50px_#0A0D14] pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0D14] via-transparent to-transparent pointer-events-none" />
        </div>

        {/* Animated Connection Line & Data Transfer Dot */}
        <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
          <svg className="w-full h-full absolute" viewBox="0 0 480 520">
            <path
              id="nfc-path"
              d="M 200 260 Q 240 220 280 260"
              fill="transparent"
              stroke="url(#glow-gradient)"
              strokeWidth="2"
              strokeDasharray="4 4"
              className={`transition-opacity duration-500 ${isHovered ? 'opacity-100' : 'opacity-40'}`}
            />
            <defs>
              <linearGradient id="glow-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#22D3EE" stopOpacity="0" />
                <stop offset="50%" stopColor="#22D3EE" stopOpacity="1" />
                <stop offset="100%" stopColor="#818CF8" stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* Animated Dot along the path */}
            {isHovered && (
              <circle r="3" fill="#22D3EE" filter="drop-shadow(0 0 4px #22D3EE)">
                <animateMotion dur="1.5s" repeatCount="indefinite">
                  <mpath href="#nfc-path" />
                </animateMotion>
              </circle>
            )}
          </svg>
        </div>

        {/* Cyan NFC Pulses (Simulated position near center) */}
        <div className="absolute z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 pointer-events-none" style={{ transform: "translate3d(-40px, -20px, 40px)" }}>
          <div className="absolute inset-0 rounded-full border-2 border-cyan-400 opacity-0 animate-[ping_2.5s_cubic-bezier(0,0,0.2,1)_infinite]" />
          <div className="absolute inset-0 rounded-full border-2 border-cyan-400 opacity-0 animate-[ping_2.5s_cubic-bezier(0,0,0.2,1)_infinite_0.4s]" />
          <div className="absolute inset-0 rounded-full border-2 border-cyan-400 opacity-0 animate-[ping_2.5s_cubic-bezier(0,0,0.2,1)_infinite_0.8s]" />
        </div>

        {/* Diagonal Glossy Shine */}
        <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden rounded-[24px]">
          <div className="w-[150%] h-[50%] bg-gradient-to-b from-transparent via-white/10 to-transparent -rotate-45 -translate-y-[200%] translate-x-[-50%] animate-[shine_5s_infinite_ease-in-out]" />
        </div>

        {/* Glass Card Overlay */}
        <motion.div
          className="absolute bottom-6 left-6 z-30 bg-white/[0.05] backdrop-blur-[20px] border border-white/10 rounded-2xl p-4 shadow-[0_8px_32px_rgba(0,0,0,0.4)] max-w-[220px]"
          style={{ transform: "translateZ(50px)" }}
        >
          <h4 className="font-semibold text-white text-sm tracking-wide mb-1">Nexus Smart Card</h4>
          <div className="flex items-center gap-1.5 text-xs text-cyan-400 mb-3 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            NFC Enabled
          </div>
          <p className="text-[11px] text-gray-300 leading-tight mb-3">
            Instant Portfolio Sharing.
          </p>
          <div className="w-full bg-white/10 hover:bg-white/20 transition-colors py-1.5 rounded-md text-[10px] text-center uppercase tracking-widest font-bold text-white border border-white/5 cursor-pointer">
            Tap & Connect
          </div>
        </motion.div>

        {/* Dynamic Blue cursor glow when hovering */}
        <motion.div
          className="absolute w-[300px] h-[300px] bg-cyan-500/20 rounded-full blur-[80px] pointer-events-none z-20"
          style={{
            x: useTransform(x, [-0.5, 0.5], [-150, 150]),
            y: useTransform(y, [-0.5, 0.5], [-150, 150]),
            opacity: isHovered ? 1 : 0
          }}
        />
      </motion.div>

      <style jsx>{`
        @keyframes shine {
          0%, 80% { transform: translateY(-200%) translateX(-50%) rotate(-45deg); }
          100% { transform: translateY(300%) translateX(50%) rotate(-45deg); }
        }
      `}</style>
    </div>
  );
}

export default function NFCCardsPage() {
  const [activeCards, setActiveCards] = useState<{ id: string; name: string; date: string; websiteName?: string }[]>([]);
  const [availableWebsites, setAvailableWebsites] = useState<{ id: string, name: string }[]>([]);
  const [showWebsiteSelector, setShowWebsiteSelector] = useState(false);
  const [selectedWebsiteId, setSelectedWebsiteId] = useState<string>("");
  const [isLinking, setIsLinking] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    // Fetch user's existing NFC cards
    const fetchCards = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('nfc_cards')
        .select(`
          *,
          websites (
            template_name,
            slug
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (data && !error) {
        setActiveCards(data.map((card: any) => ({
          id: card.card_url,
          name: "Nexus Smart Card",
          date: new Date(card.created_at).toLocaleDateString(),
          websiteName: card.websites?.slug || card.websites?.template_name ? `${card.websites?.slug || card.websites?.template_name}` : "Unassigned"
        })));
      }
    };

    fetchCards();

    gsap.fromTo(".gsap-animate",
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.8, stagger: 0.1, ease: "power3.out" }
    );
  }, []);

  const handleStartLinking = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("Please log in to link a card.");
      return;
    }

    // Check if the user has any websites before allowing them to link a card
    const { data: websites } = await supabase
      .from('websites')
      .select('id, template_name, slug')
      .eq('user_id', user.id);

    if (!websites || websites.length === 0) {
      alert("Please create a portfolio website first before linking an NFC card!");
      return;
    }

    // Show selection modal
    setAvailableWebsites(websites.map(w => ({
      id: w.id,
      name: w.slug || `${w.template_name} Template`
    })));
    setSelectedWebsiteId(websites[0].id);
    setShowWebsiteSelector(true);
  };

  const confirmLinking = async () => {
    setShowWebsiteSelector(false);
    if (isLinking || !selectedWebsiteId) return;
    setIsLinking(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Simulate the physical tap delay
    setTimeout(async () => {
      const newCardUrl = `card-${Math.floor(Math.random() * 900000) + 100000}`;

      const { data, error } = await supabase
        .from('nfc_cards')
        .insert({
          user_id: user.id,
          website_id: selectedWebsiteId,
          card_url: newCardUrl
        })
        .select()
        .single();

      if (data && !error) {
        const selectedWebsite = availableWebsites.find(w => w.id === selectedWebsiteId);
        setActiveCards(prev => [
          {
            id: data.card_url,
            name: "Nexus Smart Card",
            date: new Date(data.created_at).toLocaleDateString(),
            websiteName: selectedWebsite?.name || "Unassigned"
          },
          ...prev
        ]);
      } else {
        alert("Failed to link card. It may already be in use.");
      }
      setIsLinking(false);
    }, 2500);
  };

  const handleRemoveCard = async (cardId: string) => {
    // Optimistic UI update
    const previousCards = [...activeCards];
    setActiveCards(prev => prev.filter(c => c.id !== cardId));

    const { error } = await supabase
      .from('nfc_cards')
      .delete()
      .eq('card_url', cardId);

    if (error) {
      alert("Failed to remove card.");
      setActiveCards(previousCards); // Revert on failure
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 overflow-hidden">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mb-12"
      >
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase mb-2 text-white">NFC CARDS.</h1>
        <p className="text-xl text-slate-400 font-medium">
          Bridge the physical and digital world. Instantly share your portfolio with a single tap.
        </p>
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-10 lg:gap-12 items-center lg:items-start mt-8">
        {/* Left Side: Photorealistic Hero */}
        <div className="gsap-animate w-full lg:w-1/2 flex justify-center lg:justify-start shrink-0">
          <PhotorealisticHero />
        </div>

        {/* Right Side: Action Panel Cards */}
        <div className="w-full lg:w-1/2 space-y-5">
          <motion.div
            className="gsap-animate bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 hover:bg-white/[0.06] transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-cyan-900/20 cursor-pointer group relative overflow-hidden"
            whileTap={{ scale: 0.98 }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/5 to-cyan-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            <div className="flex items-start md:items-center gap-5 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(34,211,238,0.2)]">
                <LinkIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-xl text-white">Link your NFC Card</h3>
                <p className="text-sm text-gray-400 mt-1">Activate a new physical card to connect with this portfolio.</p>
              </div>
            </div>
            <button
              onClick={handleStartLinking}
              disabled={isLinking}
              className="w-full py-3.5 rounded-xl bg-white text-black hover:bg-gray-200 font-semibold transition-colors flex items-center justify-center gap-2 group-hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] disabled:opacity-80 disabled:cursor-not-allowed">
              {isLinking ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Waiting for Tap...
                </>
              ) : (
                "Start Linking Process"
              )}
            </button>
          </motion.div>

          <motion.div
            className="gsap-animate bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 hover:bg-white/[0.06] transition-all hover:-translate-y-1 hover:shadow-2xl cursor-pointer group"
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-start md:items-center gap-5 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-xl text-white">Order Custom Cards</h3>
                <p className="text-sm text-gray-400 mt-1">Get premium engraved metal, wood, or matte PVC cards.</p>
              </div>
            </div>
            <button className="w-full py-3.5 rounded-xl border border-white/20 text-white hover:bg-white/10 font-semibold transition-colors">
              Explore Card Shop
            </button>
          </motion.div>

          <div className="gsap-animate bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-3xl p-6 md:p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-semibold text-lg text-white">Active Cards</h3>
              <button className="text-gray-500 hover:text-white transition-colors hover:rotate-180 duration-500 p-2 rounded-full hover:bg-white/10">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
            <div className={`p-4 bg-black/40 rounded-[2rem] border border-white/5 shadow-inner ${activeCards.length === 0 ? 'text-center py-12' : ''}`}>
              {activeCards.length === 0 ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-5">
                    <SmartphoneNfc className="w-8 h-8 text-slate-600" />
                  </div>
                  <p className="text-gray-400 font-medium text-lg">No active cards linked yet.</p>
                  <p className="text-sm text-gray-500 mt-2">Tap a card to get started.</p>
                </>
              ) : (
                <div className="flex flex-col gap-4 max-h-[360px] overflow-y-auto overflow-x-hidden custom-scrollbar pr-2">
                  {activeCards.map(card => (
                    <div key={card.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/[0.03] border border-white/5 p-5 rounded-2xl hover:bg-white/[0.06] hover:border-cyan-500/30 hover:shadow-[0_0_20px_rgba(34,211,238,0.1)] transition-all duration-300 group/card relative">
                      <a href={`/api/nfc/${card.id}`} target="_blank" rel="noopener noreferrer" className="absolute inset-0 z-0 rounded-2xl"></a>
                      <div className="flex items-center gap-4 relative z-10 pointer-events-none flex-1 min-w-0">
                        <div className="w-12 h-12 shrink-0 rounded-xl bg-gradient-to-br from-cyan-950 to-black flex items-center justify-center border border-cyan-500/20 shadow-inner hidden sm:flex">
                          <SmartphoneNfc className="w-6 h-6 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-white text-base group-hover/card:text-cyan-400 transition-colors tracking-tight truncate">{card.name}</p>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <span className="text-[11px] font-mono text-gray-400 bg-black/60 px-2 py-1 rounded-md border border-white/5 shrink-0 tracking-wider">ID:{card.id}</span>
                            {card.websiteName && (
                              <span className="text-[11px] font-bold text-cyan-400 capitalize bg-cyan-950/40 px-2 py-1 rounded-md border border-cyan-900/50 truncate max-w-[200px] shadow-sm">
                                {card.websiteName.replace('-', ' ')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 relative z-10 shrink-0 w-full sm:w-auto justify-between sm:justify-end mt-3 sm:mt-0 border-t border-white/5 sm:border-t-0 pt-3 sm:pt-0">
                        <div className="text-[10px] text-gray-400 font-bold px-3 py-1.5 bg-black/40 rounded-full border border-white/5 shrink-0 uppercase tracking-widest pointer-events-none">
                          Linked: {card.date}
                        </div>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleRemoveCard(card.id);
                          }}
                          className="p-2.5 text-gray-500 hover:text-red-400 hover:bg-red-950/50 rounded-xl transition-all sm:opacity-0 group-hover/card:opacity-100 focus:opacity-100 bg-black/40 sm:bg-transparent border border-transparent hover:border-red-900/50"
                          title="Unlink Card"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Website Selection Modal */}
      <AnimatePresence>
        {showWebsiteSelector && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-[#0A0D14] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">Select Website</h3>
                <button onClick={() => setShowWebsiteSelector(false)} className="text-gray-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-sm text-gray-400">Choose which portfolio website you want to assign to this new physical NFC card.</p>

                <div className="space-y-2 mt-4 max-h-[40vh] overflow-y-auto custom-scrollbar pr-2">
                  {availableWebsites.map(website => (
                    <button
                      key={website.id}
                      onClick={() => setSelectedWebsiteId(website.id)}
                      className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${selectedWebsiteId === website.id
                          ? 'bg-cyan-500/10 border-cyan-500/50 shadow-[0_0_15px_rgba(34,211,238,0.15)]'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}
                    >
                      <span className={`font-medium capitalize ${selectedWebsiteId === website.id ? 'text-cyan-400' : 'text-white'}`}>
                        {website.name.replace('-', ' ')}
                      </span>
                      {selectedWebsiteId === website.id && (
                        <CheckCircle2 className="w-5 h-5 text-cyan-400" />
                      )}
                    </button>
                  ))}
                </div>

                <button
                  onClick={confirmLinking}
                  className="w-full mt-6 py-3.5 rounded-xl bg-white text-black hover:bg-gray-200 font-semibold transition-colors"
                >
                  Confirm & Link Card
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
