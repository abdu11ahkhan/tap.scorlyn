"use client";

import { motion } from "framer-motion";

export const getSocialIcon = (name: string, className: string = "w-5 h-5") => {
  const lower = (name || '').toLowerCase();
  if (lower.includes('instagram') || lower.includes('ig')) return <svg className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>;
  if (lower.includes('linkedin') || lower.includes('in')) return <svg className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>;
  if (lower.includes('twitter') || lower.includes('x')) return <svg className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>;
  if (lower.includes('facebook') || lower.includes('fb')) return <svg className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" /></svg>;
  if (lower.includes('whatsapp') || lower.includes('wa')) return <svg className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.89-4.443 9.893-9.892.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.738-.974zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.347-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.876 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" /></svg>;
  if (lower.includes('youtube') || lower.includes('yt')) return <svg className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>;
  if (lower.includes('behance')) return <svg className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M22 7h-7v-2h7v2zm1.726 10c-.442 1.297-2.029 3-5.101 3-3.074 0-5.564-1.729-5.564-5.675 0-3.91 2.325-5.92 5.466-5.92 3.082 0 4.964 1.782 5.375 4.426.078.506.109 1.188.095 2.14h-8.027c.13 3.211 3.483 3.312 4.588 2.029h3.168zm-7.686-4h4.965c-.105-1.547-1.136-2.219-2.477-2.219-1.466 0-2.277.768-2.488 2.219zm-9.574 6.988h-6.466v-14.967h6.953c5.476.081 5.58 5.444 2.72 6.906 3.461 1.26 3.577 8.061-3.207 8.061zm-3.466-8.988h3.584c2.508 0 2.906-3-.312-3h-3.272v3zm3.391 3h-3.391v3.016h3.341c3.055 0 2.868-3.016.05-3.016z" /></svg>;
  if (lower.includes('email') || lower.includes('mail') || lower.includes('contact')) return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>;

  // Default globe icon
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path></svg>;
};

export function Hero({ data, variant = "developer", isEditor = false, onUpdate }: { data: any, variant?: string, isEditor?: boolean, onUpdate?: (key: string, value: any) => void }) {
  // Helper to construct dynamic inline styles from editor data
  const getDynamicStyles = () => {
    let styles: React.CSSProperties = {
      backgroundColor: data?.backgroundColor,
      color: data?.textColor,
      lineHeight: data?.lineHeight,
      letterSpacing: data?.letterSpacing ? `${data.letterSpacing}px` : undefined,
    };

    if (data?.fontFamily && data.fontFamily !== 'default') {
      if (data.fontFamily === 'sans') styles.fontFamily = 'ui-sans-serif, system-ui, sans-serif';
      if (data.fontFamily === 'serif') styles.fontFamily = 'ui-serif, Georgia, serif';
      if (data.fontFamily === 'mono') styles.fontFamily = 'ui-monospace, SFMono-Regular, monospace';
    }

    if (data?.dropShadow && data.dropShadow !== 'none') {
      if (data.dropShadow === 'sm') styles.filter = 'drop-shadow(0 4px 6px rgba(0,0,0,0.5))';
      if (data.dropShadow === 'md') styles.filter = 'drop-shadow(0 10px 15px rgba(0,0,0,0.5))';
      if (data.dropShadow === 'xl') styles.filter = 'drop-shadow(0 25px 25px rgba(0,0,0,0.5))';
    }

    if (data?.gradient && data.gradient !== 'none') {
      if (data.gradient === 'linear-cyan') styles.backgroundImage = 'linear-gradient(to right, #0891b2, #000000)';
      if (data.gradient === 'radial-purple') styles.backgroundImage = 'radial-gradient(circle at center, #581c87, #000000)';
    }

    return styles;
  };

  const dynamicStyles = getDynamicStyles();

  const renderDraggable = (id: string, children: React.ReactNode, className?: string, style?: any) => {
    const position = data?.positions?.[id] || { x: 0, y: 0 };
    if (!isEditor) {
      return (
        <motion.div initial={{ x: position.x, y: position.y }} animate={{ x: position.x, y: position.y }} className={className} style={style}>
          {children}
        </motion.div>
      );
    }

    return (
      <motion.div
        drag
        dragMomentum={false}
        initial={{ x: position.x, y: position.y }}
        animate={{ x: position.x, y: position.y }}
        onDragEnd={(e, info) => {
          if (onUpdate) {
            const newPositions = { ...(data?.positions || {}) };
            newPositions[id] = {
              x: (newPositions[id]?.x || 0) + info.offset.x,
              y: (newPositions[id]?.y || 0) + info.offset.y
            };
            onUpdate('positions', newPositions);
          }
        }}
        className={`relative hover:outline hover:outline-teal-400/50 hover:outline-dashed hover:outline-1 cursor-grab active:cursor-grabbing z-50 ${className || ''}`}
        style={{ ...style, pointerEvents: 'auto' }}
      >
        {children}
      </motion.div>
    );
  };

  // Title specific styles (size and weight)
  const titleStyles: React.CSSProperties = {
    color: data?.textColor || (variant === 'designer' ? 'black' : 'white'),
    fontWeight: data?.fontWeight,
    fontSize: data?.fontSize ? `${data.fontSize * (variant === 'designer' ? 4 : 3)}rem` : undefined,
  };

  if (variant === "designer") {
    return (
      <section
        className="py-32 px-6 container mx-auto text-center flex flex-col items-center justify-center min-h-[80vh] transition-all duration-300 bg-cover"
        style={dynamicStyles}
      >
        {renderDraggable('image', (
          <div className="w-32 h-32 md:w-48 md:h-48 rounded-full mb-8 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-[6px] border-white ring-1 ring-black/5 bg-gray-50 flex items-center justify-center overflow-hidden cursor-pointer hover:shadow-[0_12px_40px_rgb(0,0,0,0.16)] transition-all">
            {data?.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={data.imageUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            )}
          </div>
        ))}
        {renderDraggable('subtitle', (
          <div className="text-sm uppercase tracking-widest mb-6 opacity-60 font-semibold">
            {data?.subtitle || "UI/UX Designer"}
          </div>
        ))}
        {renderDraggable('title', (
          <h1 className="text-6xl md:text-8xl font-serif tracking-tight mb-8 leading-tight max-w-4xl transition-all" style={titleStyles}>
            {data?.title || "Crafting digital experiences."}
          </h1>
        ))}
        {renderDraggable('description', (
          <p className="text-xl opacity-70 mb-12 max-w-2xl font-light mx-auto">
            {data?.description || "Risus letanie feugiat posuere urna tincidunt present. Interdum varius vincit lorem spiro aliquam melior."}
          </p>
        ))}
        {renderDraggable('button', (
          <button className="rounded-none bg-black text-white hover:bg-black/80 px-8 h-14 text-lg">
            View Selected Work
          </button>
        ))}
        {renderDraggable('socials', (
          <div className="flex flex-wrap items-center justify-center gap-6 mt-12 text-gray-500">
            {(data?.links || [
              { label: "Instagram", url: "#", icon: "ig" },
              { label: "X", url: "#", icon: "x" },
              { label: "LinkedIn", url: "#", icon: "in" }
            ]).map((link: any, i: number) => (
              <a key={i} href={link.url || '#'} className="hover:text-black transition-colors flex items-center gap-2 no-underline">
                {getSocialIcon(link.label || link.text || link.icon, "w-5 h-5")}
                <span className="text-sm font-medium">{link.label || link.text}</span>
              </a>
            ))}
          </div>
        ))}
      </section>
    );
  }

  if (variant === "ai-engineer") {
    return (
      <section
        className="relative py-32 px-6 container mx-auto min-h-[80vh] flex items-center justify-center overflow-hidden transition-all duration-300 bg-cover"
        style={dynamicStyles}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-600/20 blur-[120px] rounded-full pointer-events-none" />
        <div className="relative z-10 text-center max-w-4xl mx-auto flex flex-col items-center">
          {renderDraggable('subtitle', (
            <div className="inline-block px-4 py-1 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-400 font-mono text-sm mb-8">
              {data?.subtitle || "Machine Learning Researcher"}
            </div>
          ))}
          {data?.imageUrl && renderDraggable('image', (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.imageUrl} alt="Profile" className="w-24 h-24 rounded-2xl mx-auto object-cover mb-8 border-2 border-purple-500/50" />
          ))}
          {renderDraggable('title', (
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 transition-all" style={titleStyles}>
              {data?.title || "Building the Future of AI"}
            </h1>
          ))}
          {renderDraggable('description', (
            <p className="text-xl opacity-70 mb-10 max-w-2xl mx-auto">
              {data?.description || "Specializing in large language models, computer vision, and neural network architectures."}
            </p>
          ))}
          {renderDraggable('button', (
            <button className="rounded-lg bg-white text-black hover:bg-gray-200 px-8 h-12">
              Explore Models
            </button>
          ))}
          {renderDraggable('socials', (
            <div className="flex flex-wrap items-center justify-center gap-4 mt-10 text-gray-400">
              {(data?.links || [
                { label: "Instagram", url: "#", icon: "ig" },
                { label: "X", url: "#", icon: "x" },
                { label: "LinkedIn", url: "#", icon: "in" }
              ]).map((link: any, i: number) => (
                <a key={i} href={link.url || '#'} className="hover:text-white transition-colors flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10 hover:border-purple-500/50 no-underline">
                  {getSocialIcon(link.label || link.text || link.icon, "w-4 h-4")}
                  <span className="text-xs font-mono">{link.label || link.text}</span>
                </a>
              ))}
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (variant === "carrd-split") {
    return (
      <section
        className="w-full min-h-[80vh] flex items-center justify-center p-6 transition-all duration-300"
        style={{ ...dynamicStyles, backgroundColor: data?.backgroundColor || 'transparent' }}
      >
        <div className="w-full max-w-5xl rounded-3xl overflow-hidden relative flex flex-col md:flex-row bg-[#2A2A35]/80 backdrop-blur-xl border border-white/5 shadow-2xl">

          {/* Left Text Side */}
          <div className="flex-1 p-12 md:p-16 flex flex-col justify-center text-left items-start">
            {renderDraggable('subtitle', (
              <div className="text-teal-400 font-mono text-sm uppercase tracking-wider mb-4">
                {data?.subtitle || "Creative Professional"}
              </div>
            ))}
            {renderDraggable('title', (
              <h1 className="text-5xl md:text-7xl font-bold mb-6 transition-all leading-none tracking-tight" style={titleStyles}>
                {data?.title || "John Anderson"}
              </h1>
            ))}
            {renderDraggable('description', (
              <p className="text-lg md:text-xl text-gray-300 mb-10 leading-relaxed font-light">
                {data?.description || "Risus letanie feugiat posuere urna tincidunt present. Interdum varius vincit lorem spiro aliquam melior."}
              </p>
            ))}

            {renderDraggable('socials', (
              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-400 font-medium mt-4">
                {(data?.links || [
                  { label: "X", url: "#" },
                  { label: "Instagram", url: "#" },
                  { label: "LinkedIn", url: "#" }
                ]).map((link: any, i: number) => (
                  <a key={i} href={link.url || '#'} className="hover:text-white transition-colors flex items-center gap-2 no-underline">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-500" /> {link.label || link.text || `Link ${i + 1}`}
                  </a>
                ))}
              </div>
            ))}
          </div>

          {/* Right Image Side */}
          <div className="flex-1 min-h-[400px] bg-white/5 relative border-l border-white/5 p-8">
            <div className="w-full h-full border border-teal-500/30 rounded-xl overflow-hidden relative flex items-center justify-center bg-black/20">
              {data?.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={data.imageUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  {/* Placeholder X pattern like the screenshot */}
                  <svg className="absolute inset-0 w-full h-full stroke-gray-600/30 stroke-1" preserveAspectRatio="none">
                    <line x1="0" y1="0" x2="100%" y2="100%" />
                    <line x1="100%" y1="0" x2="0" y2="100%" />
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* Floating Action Button */}
          {renderDraggable('button', (
            <a href={data?.ctaUrl || '#'} className="absolute bottom-8 right-8 bg-[#FCD34D] hover:bg-[#FBBF24] text-black font-semibold px-6 py-3 rounded-full flex items-center gap-3 shadow-xl transition-transform hover:scale-105 no-underline cursor-pointer">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
              {data?.ctaText || "Get in touch"}
            </a>
          ))}
        </div>
      </section>
    );
  }

  if (variant === "carrd-links") {
    const defaultLinks = [
      { id: '1', label: 'Instagram', url: '#' },
      { id: '2', label: 'Facebook', url: '#' },
      { id: '3', label: 'YouTube', url: '#' },
      { id: '4', label: 'TikTok', url: '#' },
      { id: '5', label: 'Contact', url: '#' }
    ];
    const links = Array.isArray(data?.links) && data.links.length > 0 ? data.links : defaultLinks;

    return (
      <section
        className="w-full min-h-[80vh] flex items-center justify-center p-8 transition-all duration-300 relative overflow-hidden"
        style={{ ...dynamicStyles, backgroundColor: data?.backgroundColor || '#23222A' }}
      >
        {/* Floating dust particles background (mock) */}
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <div className="absolute top-1/4 left-1/4 w-1.5 h-1.5 bg-[#f87171] rounded-full shadow-[0_0_8px_#f87171] animate-pulse" />
          <div className="absolute top-1/2 right-1/4 w-2 h-2 bg-[#fb923c] rounded-full shadow-[0_0_8px_#fb923c] animate-pulse delay-700" />
          <div className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-[#f87171] rounded-full shadow-[0_0_8px_#f87171] animate-pulse delay-1000" />
          <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-[#fb923c] rounded-full shadow-[0_0_8px_#fb923c] animate-pulse delay-500" />
        </div>

        <div className="w-full max-w-6xl relative z-10 flex flex-col md:flex-row gap-12 items-center justify-between">

          {/* Left Text Box */}
          <div className="flex-1 max-w-md text-left space-y-6 items-start flex flex-col">
            {renderDraggable('subtitle', (
              <h3 className="text-[#f87171] uppercase tracking-[0.3em] text-[10px] font-bold font-mono">
                {data?.subtitle || "Hi, I'm"}
              </h3>
            ))}
            {renderDraggable('title', (
              <h1 className="text-5xl md:text-7xl font-serif text-white leading-tight transition-all" style={titleStyles}>
                {data?.title || "Samantha Carter"}
              </h1>
            ))}
            {renderDraggable('description', (
              <p className="text-gray-400 font-serif leading-relaxed text-lg mb-8">
                {data?.description || "Risus letanie feugiat posuere urna tincidunt present. Interdum varius vincit lorem spiro aliquam melior."}
              </p>
            ))}
            {renderDraggable('button', (
              <button className="bg-white/5 hover:bg-white/10 border border-white/10 text-white uppercase tracking-widest text-[10px] font-bold px-8 py-4 transition-colors">
                Gravida →
              </button>
            ))}
          </div>

          {/* Middle Image Frame */}
          <div className="w-full md:w-[350px] aspect-[2/3] bg-black/20 border-[12px] border-white/5 relative overflow-hidden shadow-2xl flex-shrink-0">
            {data?.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={data.imageUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <svg className="absolute inset-0 w-full h-full stroke-gray-600/30 stroke-1" preserveAspectRatio="none">
                  <line x1="0" y1="0" x2="100%" y2="100%" />
                  <line x1="100%" y1="0" x2="0" y2="100%" />
                </svg>
              </div>
            )}
          </div>

          {/* Right Links */}
          <div className="flex-1 max-w-sm w-full text-left pt-8 md:pt-0 flex flex-col items-start">
            {renderDraggable('links-title', (
              <h3 className="text-gray-400 uppercase tracking-[0.3em] text-[10px] font-bold font-mono mb-8">
                Find Me
              </h3>
            ))}
            {renderDraggable('links-list', (
              <div className="flex flex-col border border-white/10 border-b-0 group w-full">
                {links.map((link: any, i: number) => {
                  const label = typeof link === 'string' ? link : link.label;
                  const url = typeof link === 'string' ? '#' : link.url;
                  return (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="px-6 py-5 border-b border-white/10 text-white font-serif text-xl hover:bg-white/5 transition-colors group-hover:border-teal-500/50 block">
                      {label}
                    </a>
                  );
                })}
              </div>
            ), "w-full")}
          </div>
        </div>
      </section>
    );
  }
  if (variant === "finox") {
    return (
      <section className="relative w-full bg-white text-black px-6 md:px-10 pt-6 pb-16" style={dynamicStyles}>

        {/* Nav */}
        <nav className="flex items-center justify-between mb-20 md:mb-28">
          {renderDraggable('logo', (
            <span className="text-lg font-medium tracking-tight">{data?.logo || "Finox"}</span>
          ))}
          <div className="hidden md:flex items-center gap-8 text-sm text-neutral-600">
            {(data?.navLinks || ["About Me", "Portfolio", "Services", "Blog", "Pages"]).map((link: string, i: number) => (
              renderDraggable(`navLink-${i}`, (
                <span key={i} className="cursor-pointer hover:text-black transition-colors">{link}</span>
              ))
            ))}
          </div>
          {renderDraggable('ctaButton', (
            <a href="#" className="text-sm font-medium underline underline-offset-4 flex items-center gap-1">
              {data?.ctaText || "Book A Call"} ↗
            </a>
          ))}
        </nav>

        {/* Vertical label */}
        <div className="hidden md:block absolute left-4 top-1/3 -rotate-90 origin-left text-xs tracking-widest text-neutral-400">
          {renderDraggable('eyebrow', <span>{data?.eyebrow || "Product Designer"}</span>)}
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div>
            {/* Stats */}
            <div className="flex gap-12 mb-10">
              {(data?.stats || [
                { value: "+200", label: "Project completed" },
                { value: "+50", label: "Startup raised" }
              ]).map((stat: any, i: number) => (
                <div key={i}>
                  {renderDraggable(`statValue-${i}`, (
                    <div className="text-2xl font-semibold">{stat.value}</div>
                  ))}
                  {renderDraggable(`statLabel-${i}`, (
                    <div className="text-xs text-neutral-500 mt-1">{stat.label}</div>
                  ))}
                </div>
              ))}
            </div>

            {renderDraggable('title', (
              <h1 className="text-7xl md:text-8xl font-normal leading-none tracking-tight mb-6">
                {data?.title || "Hello"}
              </h1>
            ))}

            {renderDraggable('subtitle', (
              <p className="text-neutral-500 text-sm mb-16">
                — {data?.subtitle || "it's Finox a design wizard"}
              </p>
            ))}

            {renderDraggable('scrollLabel', (
              <div className="text-xs text-neutral-400 flex items-center gap-2">
                {data?.scrollText || "Scroll down"} ↓
              </div>
            ))}

            {renderDraggable('socials', (
              <div className="flex flex-wrap items-center gap-5 mt-12 text-neutral-500">
                {(data?.links || [
                  { label: "Instagram", url: "#", icon: "ig" },
                  { label: "X", url: "#", icon: "x" },
                  { label: "LinkedIn", url: "#", icon: "in" }
                ]).map((link: any, i: number) => (
                  <a key={i} href={link.url || '#'} className="hover:text-black transition-colors" title={link.label || link.text}>
                    {getSocialIcon(link.label || link.text || link.icon, "w-5 h-5")}
                  </a>
                ))}
              </div>
            ))}
          </div>

          {/* Portrait */}
          <div className="relative">
            {renderDraggable('heroImage', (
              <img
                src={data?.imageUrl || data?.image || "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=2070&auto=format&fit=crop"}
                alt={data?.imageAlt || "Portrait"}
                className="w-full h-[420px] md:h-[520px] object-cover grayscale contrast-110"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (variant === "glass-portfolio") {
    return (
      <section
        className="w-full min-h-[90vh] flex items-center justify-center p-4 md:p-8 transition-all duration-300 relative overflow-hidden"
        style={{
          background: data?.backgroundColor || "radial-gradient(circle at top left, #ffd9b4, transparent 45%), radial-gradient(circle at bottom right, #d9d4ff, transparent 45%), #f6f5fa",
          ...dynamicStyles,
        }}
      >
        <div className="w-full max-w-[1350px] bg-white/70 backdrop-blur-3xl rounded-[28px] overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.08)] flex flex-wrap">

          {/* Left: Image */}
          <div className="p-2.5 border-black/5 h-[400px] md:h-[500px] lg:h-auto border-b flex-1 min-w-[280px] md:min-w-[320px] basis-full lg:basis-[30%] lg:border-b-0 lg:border-r">
            {renderDraggable('image', (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={data?.imageUrl || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=900"}
                alt="Profile"
                className="w-full h-full object-cover rounded-[18px] block flex-1 min-h-[350px]"
              />
            ), "w-full h-full flex-1 flex")}
          </div>

          {/* Middle: Content */}
          <div className="p-8 lg:p-14 flex flex-col justify-center flex-[1.5] min-w-[280px] basis-full lg:basis-[40%]">
            {renderDraggable('title', (
              <h1 className="text-5xl lg:text-[74px] font-light leading-none text-[#43414d] mb-6 break-words" style={titleStyles}>
                {data?.title || (
                  <>Olivia<br />Dunham</>
                )}
              </h1>
            ))}

            {renderDraggable('role', (
              <div className="text-xl lg:text-[22px] text-[#7f7bff] mb-6 lg:mb-8">
                {data?.role || "Creative Product Designer"}
              </div>
            ))}

            {renderDraggable('description1', (
              <p className="text-base lg:text-[18px] leading-[1.9] text-[#7c7b88] mb-6">
                {data?.description1 || "Passionate about crafting digital experiences that blend beautiful aesthetics with meaningful usability."}
              </p>
            ))}

            {renderDraggable('description2', (
              <p className="text-base lg:text-[18px] leading-[1.9] text-[#7c7b88] mb-6">
                {data?.description2 || "Specializing in UI/UX design, branding and interactive web experiences for startups and global companies. Every project focuses on simplicity, clarity and lasting impressions."}
              </p>
            ))}
          </div>

          {/* Right: Connect */}
          <div className="flex flex-col border-black/5 flex-1 min-w-[280px] md:min-w-[320px] basis-full lg:basis-[30%] border-t lg:border-t-0 lg:border-l">
            <div className="p-8 lg:p-12 border-b border-black/5 flex-1 flex flex-col justify-center">
              {renderDraggable('connectTitle', (
                <h2 className="text-4xl lg:text-[44px] font-light text-[#474552] mb-5">
                  {data?.connectTitle || "Let's Connect"}
                </h2>
              ))}

              {renderDraggable('connectDescription', (
                <p className="text-base lg:text-[18px] leading-[1.8] text-[#8f8f9d] mb-8">
                  {data?.connectDescription || "Available for freelance projects, collaborations and creative partnerships."}
                </p>
              ))}

              <div className="space-y-4">
                {renderDraggable('btn1', (
                  <a href="#" className="flex justify-between items-center px-5 py-4 lg:px-6 lg:py-4 rounded-xl lg:rounded-[15px] no-underline bg-gradient-to-br from-[#76b7ff] to-[#8a82ff] text-white text-base lg:text-[18px] font-semibold transition-all hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(120,110,255,0.3)] w-full block">
                    <span>{data?.btn1Text || "Portfolio"}</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path></svg>
                  </a>
                ), "w-full block")}
                {renderDraggable('btn2', (
                  <a href="#" className="flex justify-between items-center px-5 py-4 lg:px-6 lg:py-4 rounded-xl lg:rounded-[15px] no-underline bg-gradient-to-br from-[#76b7ff] to-[#8a82ff] text-white text-base lg:text-[18px] font-semibold transition-all hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(120,110,255,0.3)] w-full block">
                    <span>{data?.btn2Text || "Contact Me"}</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                  </a>
                ), "w-full block")}
              </div>
            </div>

            <div className="flex flex-wrap justify-center items-center gap-3 lg:gap-4 xl:gap-5 p-6 lg:p-10">
              {(data?.links || [
                { text: 'Behance', url: '#', icon: 'Bē' },
                { text: 'LinkedIn', url: '#', icon: 'in' },
                { text: 'Instagram', url: '#', icon: 'ig' },
                { text: 'Twitter', url: '#', icon: '𝕏' },
                { text: 'Facebook', url: '#', icon: 'f' }
              ]).map((link: any, i: number) => (
                renderDraggable(`social-${i}`, (
                  <a key={i} href={link.url || '#'} title={link.label || link.text} className="w-12 h-12 xl:w-[58px] xl:h-[58px] shrink-0 flex items-center justify-center rounded-full bg-gradient-to-br from-[#7db5ff] to-[#8b82ff] text-white transition-all no-underline hover:-translate-y-[6px] hover:scale-110 font-bold" style={{ fontFamily: 'sans-serif' }}>
                    {getSocialIcon(link.label || link.text || link.icon, "w-5 h-5 xl:w-6 xl:h-6")}
                  </a>
                ))
              ))}
            </div>
          </div>

        </div>
      </section>
    );
  }

  if (variant === "theo") {
    return (
      <section
        className="w-full min-h-screen flex justify-center transition-all duration-300 relative"
        style={{
          background: data?.backgroundColor || "#0a0a0f",
          color: data?.textColor || "#ffffff",
          fontFamily: data?.fontFamily === 'default' ? 'Geist, Arial, sans-serif' : undefined,
          ...dynamicStyles,
        }}
      >
        <div className="w-full max-w-[560px] py-16 px-6">

          {/* Topline */}
          <div className="flex justify-between border-b border-white/10 pb-8 mb-12 text-[#888] text-xs">
            {renderDraggable('brand', <span>{data?.brand || "NFC Portfolio"}</span>)}
            {renderDraggable('status', (
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block"></span>
                {data?.status || "Open to work"}
              </span>
            ))}
          </div>

          {/* Title */}
          {renderDraggable('title', (
            <h1 className="text-[4rem] leading-[0.95] mb-6" style={{ fontFamily: "'Libre Baskerville', serif", ...titleStyles }}>
              {data?.title || (
                <>Theo<br /><span className="italic font-normal">Kawamoto</span></>
              )}
            </h1>
          ))}

          {/* Roles */}
          <div className="flex flex-wrap gap-4 items-center mb-8 text-[#777] uppercase text-[0.8rem] tracking-wide">
            {renderDraggable('role1', <span>{data?.role1 || "Writer"}</span>)}
            <span className="w-[18px] h-[1px] bg-white/20"></span>
            {renderDraggable('role2', <span>{data?.role2 || "Strategist"}</span>)}
            <span className="w-[18px] h-[1px] bg-white/20"></span>
            {renderDraggable('role3', <span>{data?.role3 || "Tokyo"}</span>)}
          </div>

          {/* Bio */}
          {renderDraggable('bio', (
            <p className="leading-[1.9] text-[#999] border-b border-white/10 pb-8 mb-8">
              {data?.bio || "I write for brands that have something real to say. Long-form, short-form, brand voice, editorial—words that earn attention rather than beg for it."}
            </p>
          ))}

          {/* Links */}
          {renderDraggable('linksLabel', (
            <p className="tracking-[0.2em] uppercase mb-4 text-[#888] text-xs">
              {data?.linksLabel || "Links"}
            </p>
          ))}

          <div className="border-t border-white/10">
            {(data?.links || [
              { text: "Instagram", url: "#", color: "text-[#E4405F]", icon: "ig" },
              { text: "LinkedIn", url: "#", color: "text-[#0A66C2]", icon: "in" },
              { text: "WhatsApp", url: "#", color: "text-[#25D366]", icon: "wa" },
              { text: "Email", url: "#", color: "text-[#8B5CF6]", icon: "em" },
              { text: "Portfolio", url: "#", color: "text-[#3B82F6]", icon: "wb" }
            ]).map((link: any, i: number) => (
              renderDraggable(`link-${i}`, (
                <a href={link.url || '#'} key={i} className="group flex justify-between items-center py-[18px] border-b border-white/10 text-inherit no-underline transition-all hover:pl-2">
                  <span className="flex items-center gap-4">
                    <span className={`w-[22px] text-center text-[20px] flex justify-center items-center ${link.color || 'text-gray-400'} font-bold`} style={{ fontFamily: 'sans-serif' }}>
                      {getSocialIcon(link.label || link.text || link.icon, "w-5 h-5")}
                    </span>
                    <span className="font-medium text-[15px]">{link.label || link.text}</span>
                  </span>
                  <span className="text-[#999] transition-transform group-hover:translate-x-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                  </span>
                </a>
              ))
            ))}
          </div>

          {/* CTA */}
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4 mt-8 items-center">
            {renderDraggable('ctaBtn', (
              <a href={data?.ctaUrl || "#"} className="bg-white text-black border-none py-3.5 px-6 rounded-lg cursor-pointer font-medium w-full sm:w-auto hover:bg-gray-200 transition-colors block text-center no-underline">
                {data?.ctaText || "Contact Me"}
              </a>
            ), "w-full")}
            {renderDraggable('ctaText', (
              <div className="text-[#888] text-xs leading-relaxed text-center sm:text-left">
                {data?.ctaSubtitle || <>Usually replies<br />within 24 hours.</>}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="flex justify-between border-t border-white/10 mt-12 pt-8 text-[#888] text-xs">
            {renderDraggable('footerLeft', <span>{data?.footerLeft || "CardLink · NFC Digital Card"}</span>)}
            {renderDraggable('footerRight', <span>{data?.footerRight || "© 2025"}</span>)}
          </div>

        </div>
      </section>
    );
  }

  if (variant === "motion") {
    return (
      <section
        className="w-full font-sans antialiased bg-[#09090b] text-[#fafafa] flex flex-col items-center justify-start min-h-screen relative overflow-x-hidden"
        style={dynamicStyles}
      >
        {/* HERO SECTION */}
        <div className="w-full flex flex-col items-center justify-center py-24 px-6 relative text-center min-h-[90vh]">
          {/* Animated gradient blob */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full pointer-events-none opacity-30 bg-[radial-gradient(ellipse,rgba(245,158,11,0.15)_0%,transparent_65%)] animate-[pulse_6s_ease-in-out_infinite]" />

          <div className="relative z-10 max-w-xl w-full flex flex-col items-center">
            {renderDraggable('tag', (
              <div className="inline-flex items-center gap-2 text-[0.7rem] tracking-[0.15em] uppercase text-[#f59e0b] font-semibold mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] animate-[pulse_1.5s_ease-in-out_infinite]"></span>
                {data?.tag || "Available for projects"}
              </div>
            ))}

            {/* Avatar */}
            {renderDraggable('image', (
              <div className="w-[110px] h-[110px] rounded-full bg-gradient-to-br from-[#1f1f21] to-[#2d2d30] border-2 border-[#f59e0b]/30 shadow-[0_0_40px_rgba(245,158,11,0.15)] flex items-center justify-center font-serif text-[2.2rem] text-[#f59e0b] mb-6 relative z-10 overflow-hidden cursor-pointer hover:scale-105 transition-transform mx-auto">
                {data?.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={data.imageUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span style={{ fontFamily: "'DM Serif Display', serif" }}>{data?.initials || "ZO"}</span>
                )}
              </div>
            ))}

            {renderDraggable('title', (
              <h1 className="text-4xl md:text-6xl font-serif font-bold tracking-tight mb-3 text-[#fafafa]" style={{ fontFamily: "'DM Serif Display', serif", ...titleStyles }}>
                {data?.title || "Zara Osei"}
              </h1>
            ))}

            {renderDraggable('role', (
              <p className="text-[0.85rem] text-[#a1a1aa] mb-8 font-light tracking-[0.03em]">
                {data?.role || "Motion Designer · Brand Animator · Creative Director"}
              </p>
            ))}

            {renderDraggable('cta', (
              <a href={data?.ctaUrl || "#"} className="inline-block px-8 py-3.5 rounded-full bg-[#f59e0b] text-black font-bold text-[0.875rem] shadow-[0_4px_24px_rgba(245,158,11,0.35)] hover:shadow-[0_8px_32px_rgba(245,158,11,0.5)] hover:-translate-y-0.5 transition-all cursor-pointer no-underline tracking-[0.02em]">
                {data?.ctaText || "Explore My Work ↓"}
              </a>
            ))}
          </div>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-[0.65rem] text-[#a1a1aa] tracking-[0.12em] uppercase">
            <div className="w-px h-[30px] bg-gradient-to-b from-[#a1a1aa] to-transparent"></div>
            scroll
          </div>
        </div>

        {/* LINKS SECTION */}
        <div className="w-full bg-[#111113] border-t border-white/5 py-16 px-6">
          <div className="max-w-[460px] mx-auto w-full">
            {renderDraggable('linksLabel', (
              <p className="text-[0.68rem] tracking-[0.15em] uppercase text-[#f59e0b] font-semibold mb-6 text-center">
                {data?.linksLabel || "Connect with me"}
              </p>
            ))}

            {renderDraggable('socials', (
              <div className="flex flex-col gap-3 mb-6">
                {(data?.links || [
                  { label: "Instagram", url: "#", icon: "ig" },
                  { label: "LinkedIn", url: "#", icon: "in" },
                  { label: "WhatsApp", url: "#", icon: "wa" },
                  { label: "Email", url: "#", icon: "em" },
                  { label: "Portfolio", url: "#", icon: "wb" }
                ]).map((link: any, i: number) => (
                  <a key={i} href={link.url || '#'} className="group flex items-center gap-4 p-4 rounded-[14px] border border-white/5 bg-white/[0.03] text-[#fafafa] no-underline transition-all hover:border-[#f59e0b]/35 hover:bg-[#f59e0b]/10 hover:translate-x-1">
                    <span className="w-[38px] h-[38px] rounded-[10px] bg-white/5 flex items-center justify-center shrink-0 text-[#fafafa] group-hover:bg-[#f59e0b]/20 group-hover:text-[#f59e0b] transition-colors">
                      {getSocialIcon(link.icon || link.text || link.label, "w-5 h-5")}
                    </span>
                    <span className="flex-1 flex flex-col overflow-hidden">
                      <span className="font-semibold text-[0.85rem] truncate">{link.label || link.text}</span>
                      <span className="text-[0.7rem] text-[#a1a1aa] mt-px truncate w-full pr-4">{link.url || link.handle || "Link"}</span>
                    </span>
                    <span className="text-[#a1a1aa] transition-transform group-hover:translate-x-[3px] group-hover:text-[#f59e0b]">→</span>
                  </a>
                ))}
              </div>
            ), "w-full")}
          </div>
        </div>

        {/* BIO SECTION */}
        <div className="w-full py-16 px-6 border-t border-white/5">
          <div className="max-w-[460px] mx-auto w-full text-center">
            {renderDraggable('bioQuote', (
              <p className="font-serif text-[1.25rem] italic text-[#fafafa] leading-[1.6] mb-5" style={{ fontFamily: "'DM Serif Display', serif" }}>
                {data?.bioQuote || '"Motion is the punctuation of great design."'}
              </p>
            ))}

            {renderDraggable('bio', (
              <p className="text-[0.85rem] text-[#a1a1aa] leading-[1.75] mb-6">
                {data?.bio || "Lagos-born, Berlin-based. I make brands move — literally. 7 years creating title sequences, brand films, and UI animations for clients across Europe and West Africa."}
              </p>
            ))}

            {renderDraggable('tags', (
              <div className="flex flex-wrap justify-center gap-2 mt-2">
                {(data?.tags || ["After Effects", "Cinema 4D", "Brand Films", "UI Animation", "Figma"]).map((tag: string, i: number) => (
                  <span key={i} className="text-[0.7rem] px-3.5 py-1.5 rounded-full border border-white/10 text-[#a1a1aa] bg-white/5">
                    {tag}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* CONTACT SECTION */}
        <div className="w-full bg-[#111113] border-t border-white/5 py-16 px-6 mb-4">
          <div className="max-w-[460px] mx-auto w-full text-center flex flex-col items-center">
            {renderDraggable('contactHeading', (
              <h3 className="font-serif text-[1.6rem] mb-2 text-[#fafafa]" style={{ fontFamily: "'DM Serif Display', serif" }}>
                {data?.contactHeading || "Let's make something."}
              </h3>
            ))}
            {renderDraggable('contactText', (
              <p className="text-[0.85rem] text-[#a1a1aa] mb-8">
                {data?.contactText || "A new project, a collab, or just a hello — my inbox is open."}
              </p>
            ))}

            {renderDraggable('contactBtn', (
              <a href={data?.contactUrl || "#"} className="w-full p-4 rounded-[14px] bg-[#f59e0b] text-black font-bold text-[0.9rem] tracking-[0.02em] shadow-[0_4px_20px_rgba(245,158,11,0.3)] hover:shadow-[0_8px_28px_rgba(245,158,11,0.45)] hover:-translate-y-0.5 transition-all text-center no-underline cursor-pointer block">
                {data?.contactBtnText || "Contact Me"}
              </a>
            ), "w-full")}
          </div>
        </div>

        <div className="w-full text-center pb-8 pt-4">
          {renderDraggable('footer', (
            <p className="text-[0.65rem] text-[#444] tracking-[0.1em] uppercase">
              {data?.footer || "CardLink · NFC Digital Portfolio"}
            </p>
          ))}
        </div>

      </section>
    );
  }

  if (variant === "architect") {
    return (
      <section
        className="w-full min-h-screen font-sans flex flex-col md:flex-row antialiased bg-[#fafaf8]"
        style={dynamicStyles}
      >
        {/* LEFT PANEL */}
        <div className="flex-1 bg-[#1c1c1e] text-white p-12 md:p-10 flex flex-col items-center justify-center relative overflow-hidden">
          {/* geometric accents */}
          <div className="absolute -bottom-20 -right-20 w-[220px] h-[220px] rounded-full border-[40px] border-[#c9a96e]/10 pointer-events-none" />
          <div className="absolute -top-10 -left-10 w-[140px] h-[140px] rounded-full border-[25px] border-[#c9a96e]/10 pointer-events-none" />

          {/* Avatar */}
          {renderDraggable('image', (
            <div className="w-[120px] h-[120px] md:w-[140px] md:h-[140px] rounded-full bg-gradient-to-br from-[#3a3a3c] to-[#2c2c2e] border-[3px] border-[#c9a96e] flex items-center justify-center font-serif text-[2.8rem] font-bold text-[#c9a96e] mb-7 shadow-[0_0_0_8px_rgba(201,169,110,0.08)] relative z-10 overflow-hidden cursor-pointer hover:scale-105 transition-transform">
              {data?.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={data.imageUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span style={{ fontFamily: "'Playfair Display', serif" }}>{data?.initials || "PN"}</span>
              )}
            </div>
          ))}

          {renderDraggable('title', (
            <h1 className="text-2xl font-bold text-center mb-1.5 leading-tight text-white" style={{ fontFamily: "'Playfair Display', serif", ...titleStyles }}>
              {data?.title || "Priya Nair"}
            </h1>
          ))}

          {renderDraggable('role', (
            <p className="text-xs text-[#c9a96e] tracking-[0.15em] uppercase text-center mb-6 font-medium">
              {data?.role || "Architect & Interior Designer"}
            </p>
          ))}

          {renderDraggable('stats', (
            <div className="grid grid-cols-2 gap-px bg-white/5 border border-white/5 rounded-xl overflow-hidden w-full max-w-xs relative z-10">
              {(data?.stats || [
                { num: "12+", label: "Years" },
                { num: "80+", label: "Projects" },
                { num: "4", label: "Countries" },
                { num: "★ 5.0", label: "Rating" }
              ]).map((stat: any, i: number) => (
                <div key={i} className="p-3.5 bg-white/[0.03] text-center">
                  <span className="text-[1.4rem] text-[#c9a96e] font-bold block leading-none mb-1.5" style={{ fontFamily: "'Playfair Display', serif" }}>{stat.num}</span>
                  <span className="text-[0.65rem] text-[#9a9a9a] tracking-[0.1em] uppercase">{stat.label}</span>
                </div>
              ))}
            </div>
          ), "w-full max-w-xs")}
        </div>

        {/* RIGHT PANEL */}
        <div className="flex-1 bg-[#fafaf8] p-12 md:p-16 flex flex-col justify-center text-[#1c1c1e]">
          {renderDraggable('tag', (
            <div className="text-[0.68rem] text-[#c9a96e] tracking-[0.15em] uppercase font-semibold mb-4 flex items-center gap-2">
              <span className="w-5 h-[2px] bg-[#c9a96e]"></span> {data?.tag || "Portfolio"}
            </div>
          ))}

          {renderDraggable('heading', (
            <h2 className="text-[1.6rem] text-[#1c1c1e] mb-4 leading-snug font-bold max-w-lg" style={{ fontFamily: "'Playfair Display', serif" }}>
              {data?.heading || "Spaces that breathe. Designs that last."}
            </h2>
          ))}

          {renderDraggable('bio', (
            <p className="text-[0.875rem] leading-[1.75] text-[#666] mb-7 max-w-lg">
              {data?.bio || "Based in Dubai, I design residential and commercial spaces where function meets soul. Every project begins with one question: how should this space make you feel?"}
            </p>
          ))}

          {renderDraggable('socials', (
            <div className="flex flex-col gap-2.5 mb-8 max-w-md">
              {(data?.links || [
                { text: "Instagram", url: "#", icon: "ig" },
                { text: "LinkedIn", url: "#", icon: "in" },
                { text: "WhatsApp", url: "#", icon: "wa" },
                { text: "Email", url: "#", icon: "em" },
                { text: "Portfolio", url: "#", icon: "wb" }
              ]).map((link: any, i: number) => (
                <a key={i} href={link.url || '#'} className="group flex items-center gap-3 p-3 rounded-xl border-[1.5px] border-[#eeebe6] bg-white text-[#1c1c1e] no-underline text-[0.82rem] font-medium transition-all hover:border-[#c9a96e] hover:bg-[#c9a96e]/10 hover:translate-x-1">
                  <span className="w-8 h-8 rounded-lg bg-[#eeebe6] flex items-center justify-center group-hover:bg-[#c9a96e]/20 transition-colors shrink-0 text-[#1c1c1e] group-hover:text-[#c9a96e]">
                    {getSocialIcon(link.label || link.text || link.icon, "w-4 h-4")}
                  </span>
                  <span className="flex-1">{link.label || link.text}</span>
                  <span className="text-[0.75rem] text-[#9a9a9a] transition-transform group-hover:translate-x-[3px] group-hover:text-[#c9a96e]">→</span>
                </a>
              ))}
            </div>
          ), "w-full max-w-md")}

          {renderDraggable('cta', (
            <a href={data?.ctaUrl || "#"} className="self-start px-7 py-3.5 rounded-xl bg-[#1c1c1e] text-white text-[0.875rem] font-semibold border-none cursor-pointer transition-all hover:bg-[#c9a96e] hover:-translate-y-px no-underline inline-block shadow-lg shadow-black/10">
              {data?.ctaText || "Contact Me →"}
            </a>
          ))}

          {renderDraggable('footer', (
            <p className="mt-8 text-[0.65rem] text-[#9a9a9a] tracking-[0.08em] uppercase">
              {data?.footer || "CardLink · NFC Digital Portfolio"}
            </p>
          ))}
        </div>
      </section>
    );
  }

  // Default Developer Variant
  return (
    <section
      className="pt-32 pb-20 px-6 transition-all duration-300 bg-cover"
      style={dynamicStyles}
    >
      <div className="container mx-auto max-w-3xl flex flex-col items-start md:items-center">
        {renderDraggable('image', (
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-full mb-8 border border-white/10 bg-white/5 flex items-center justify-center overflow-hidden cursor-pointer hover:bg-white/10 transition-all hover:scale-105 shadow-xl shadow-black/20">
            {data?.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={data.imageUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <svg className="w-10 h-10 md:w-12 md:h-12 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            )}
          </div>
        ))}
        {renderDraggable('subtitle', (
          <p className="text-emerald-400 font-mono mb-4 tracking-wide text-sm">
            {data?.subtitle || "Software Engineer"}
          </p>
        ))}
        {renderDraggable('title', (
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight transition-all" style={titleStyles}>
            {data?.title || "Building digital experiences that matter."}
          </h1>
        ))}
        {renderDraggable('description', (
          <p className="text-xl opacity-70 mb-8 max-w-2xl leading-relaxed">
            {data?.description || "I'm a software engineer specializing in building exceptional digital experiences."}
          </p>
        ))}
        {renderDraggable('button', (
          <div className="flex gap-4">
            <button className="bg-white text-black hover:bg-gray-200 rounded-full px-8 h-12 font-medium">
              View Work
            </button>
          </div>
        ))}

        {renderDraggable('socials', (
          <div className="flex flex-wrap items-center gap-4 mt-12">
            {(data?.links || [
              { label: "Instagram", url: "#", icon: "ig" },
              { label: "X", url: "#", icon: "x" },
              { label: "LinkedIn", url: "#", icon: "in" }
            ]).map((link: any, i: number) => (
              <a key={i} href={link.url || '#'} className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 bg-white/5 p-3 rounded-full hover:bg-white/10" title={link.label || link.text}>
                {getSocialIcon(link.label || link.text || link.icon, "w-5 h-5")}
              </a>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
