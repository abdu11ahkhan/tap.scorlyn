export function Skills({ data, variant = "developer", isEditor, onUpdate }: { data: any, variant?: string, isEditor?: boolean, onUpdate?: (k: string, v: any) => void }) {
  const defaultSkills = ["React", "TypeScript", "Next.js", "Node.js", "Python", "AWS", "Docker"];
  const skills = data?.items || defaultSkills;

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
  
  // Title specific styles (size and weight)
  const titleStyles: React.CSSProperties = {
    color: data?.textColor || (variant === 'designer' ? 'black' : 'white'),
    fontWeight: data?.fontWeight,
    fontSize: data?.fontSize ? `${data.fontSize * 1.5}rem` : undefined,
  };

  if (variant === "designer") {
    return (
      <section 
        className="py-20 px-6 container mx-auto transition-all duration-300 bg-cover"
        style={dynamicStyles}
      >
        <h2 className="text-2xl font-serif mb-12 border-b border-gray-200 pb-4 transition-all" style={titleStyles}>Toolkit & Capabilities</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {skills.map((skill: string) => (
            <div key={skill} className="opacity-70 font-light text-lg">
              {skill}
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (variant === "ai-engineer") {
    return (
      <section 
        className="py-20 px-6 container mx-auto relative z-10 transition-all duration-300 bg-cover"
        style={dynamicStyles}
      >
        <h2 className="text-3xl font-bold mb-12 font-mono flex items-center transition-all" style={titleStyles}>
          <span className="text-purple-500 mr-2">&gt;</span> Technical Stack
        </h2>
        <div className="flex flex-wrap gap-4">
          {skills.map((skill: string) => (
            <span key={skill} className="px-5 py-2 rounded-lg border border-purple-500/30 bg-purple-900/20 text-purple-200 text-sm font-mono backdrop-blur-md">
              {skill}
            </span>
          ))}
        </div>
      </section>
    );
  }
  if (variant === "personal-portfolio") {
    return (
      <section 
        className="w-full min-h-[50vh] flex justify-center p-8 transition-all duration-300 relative overflow-hidden"
        style={{ ...dynamicStyles, backgroundColor: data?.backgroundColor || '#F3F4F6' }}
      >
        <div className="w-full max-w-7xl relative z-10 flex flex-col md:flex-row items-start justify-between gap-12">
          
          {/* About Me */}
          <div className="flex-1 max-w-sm mt-10">
            <h2 className="text-4xl text-black mb-6" style={titleStyles}>About Me</h2>
            <p className="text-gray-500 font-light leading-relaxed mb-12">
              {data?.description || "I'm specialize in turning complex problems into elegant solutions. My approach blends creativity with strategic thinking to deliver designs that not only look great but work seamlessly. Ready to start your next project?"}
            </p>
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-gray-300 transform scale-x-[-1] -rotate-45 ml-10">
               <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          {/* Center Box */}
          <div className="flex-1 max-w-md bg-white rounded-2xl p-8 shadow-xl z-20 -mt-10">
             <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                <span className="text-xl">🌎</span>
             </div>
             <h3 className="text-5xl font-light text-black mb-4 tracking-tighter">120%</h3>
             <p className="text-gray-500 text-sm mb-12 pr-10">
                Average increase in client engagement in the first 6 months
             </p>
             <div className="h-64 w-full rounded-xl overflow-hidden bg-gray-200">
               {data?.imageUrl ? (
                 // eslint-disable-next-line @next/next/no-img-element
                 <img src={data.imageUrl} className="w-full h-full object-cover grayscale" alt="Profile Box" />
               ) : (
                 <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">Image</div>
               )}
             </div>
          </div>

          {/* Right Text */}
          <div className="flex-1 flex flex-col gap-10 mt-10 max-w-md">
            <div className="w-40 h-40 rounded-xl bg-gray-800 overflow-hidden relative ml-auto mb-4 border-4 border-white shadow-lg">
              {data?.imageUrl ? (
                 // eslint-disable-next-line @next/next/no-img-element
                 <img src={data.imageUrl} className="w-full h-full object-cover grayscale" alt="Profile Small" />
              ) : (
                 <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs bg-gray-700 text-white relative">
                   <div className="absolute inset-0 opacity-20 bg-black"></div>
                 </div>
              )}
               <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                 <span className="p-3 bg-white text-black rounded-full shadow-lg pointer-events-auto cursor-pointer hover:scale-110 transition-transform">↗</span>
               </div>
            </div>

            <div className="flex gap-4 items-start">
               <div className="w-6 h-6 bg-gray-800 rounded-full text-white flex items-center justify-center text-xs mt-1 shrink-0">✦</div>
               <p className="text-gray-500 text-sm leading-relaxed">
                  With 4+ years of experience, I specialize in creating intuitive, user-focused designs that solve real-world problems and deliver seamless digital experiences.
               </p>
            </div>
            
            <div className="flex gap-4 items-start">
               <div className="w-6 h-6 bg-gray-800 rounded-full text-white flex items-center justify-center text-xs mt-1 shrink-0">❖</div>
               <p className="text-gray-500 text-sm leading-relaxed">
                  I thrive on working closely with clients, blending creativity with strategy to bring their vision to life through thoughtful, impactful design solutions.
               </p>
            </div>
          </div>

        </div>
      </section>
    );
  }

  // Default Developer Variant
  return (
    <section 
      className="py-20 px-6 bg-white/[0.02] border-y border-white/5 transition-all duration-300 bg-cover"
      style={dynamicStyles}
    >
      <div className="container mx-auto">
        <h2 className="text-3xl font-bold mb-12 transition-all" style={titleStyles}>Technical Arsenal</h2>
        <div className="flex flex-wrap gap-3">
          {skills.map((skill: string) => (
            <span key={skill} className="px-4 py-2 rounded-full border border-white/10 bg-white/5 text-sm opacity-80">
              {skill}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
