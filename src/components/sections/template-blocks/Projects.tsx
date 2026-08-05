export function Projects({ data, variant = "developer", isEditor, onUpdate }: { data: any, variant?: string, isEditor?: boolean, onUpdate?: (k: string, v: any) => void }) {
  const defaultProjects = [
    { title: "Project One", description: "A complex web application built with modern tools." },
    { title: "Project Two", description: "An experimental design interface focusing on micro-interactions." },
    { title: "Project Three", description: "Open source contribution and library maintenance." }
  ];
  const projects = data?.items || defaultProjects;

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
        <h2 className="text-2xl font-serif mb-12 border-b border-gray-200 pb-4 transition-all" style={titleStyles}>Selected Works</h2>
        <div className="columns-1 md:columns-2 gap-8 space-y-8">
          {projects.map((project: any, i: number) => (
            <div key={i} className="break-inside-avoid group cursor-pointer">
              <div className="aspect-[3/4] bg-gray-100 mb-4 overflow-hidden relative">
                 {project.imageUrl ? (
                   // eslint-disable-next-line @next/next/no-img-element
                   <img src={project.imageUrl} alt={project.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                 ) : (
                   <div className="w-full h-full bg-gray-200 group-hover:scale-105 transition-transform duration-700 flex items-center justify-center text-gray-400 text-sm">No Image</div>
                 )}
              </div>
              <h3 className="text-xl font-medium" style={{ color: data?.textColor || 'black' }}>{project.title}</h3>
              <p className="text-sm mt-2 opacity-70">{project.description}</p>
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
          <span className="text-cyan-500 mr-2">&gt;</span> Research & Models
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          {projects.map((project: any, i: number) => (
            <div key={i} className="p-6 rounded-xl border border-cyan-500/20 bg-black/40 backdrop-blur-sm hover:border-cyan-500/50 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-white">{project.title}</h3>
                <span className="text-xs text-cyan-400 bg-cyan-900/30 px-2 py-1 rounded">Model</span>
              </div>
              <p className="text-gray-400 text-sm font-mono leading-relaxed">
                {project.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    );
  }

  // Default Developer Variant
  return (
    <section 
      className="py-20 px-6 container mx-auto transition-all duration-300 bg-cover"
      style={dynamicStyles}
    >
      <h2 className="text-3xl font-bold mb-12 transition-all" style={titleStyles}>Featured Projects</h2>
      <div className="grid md:grid-cols-2 gap-8">
        {projects.map((project: any, i: number) => (
          <div key={i} className="group relative rounded-2xl overflow-hidden border border-white/10 bg-white/5 hover:border-white/20 transition-colors">
            <div className="aspect-video bg-black/50 overflow-hidden flex items-center justify-center border-b border-white/5 relative">
              {project.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={project.imageUrl} alt={project.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              ) : (
                <span className="text-gray-500 font-medium">Project Preview</span>
              )}
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold mb-2 text-white">{project.title}</h3>
              <p className="text-gray-400 text-sm mb-4">
                {project.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
