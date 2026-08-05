"use client";

import { motion } from "framer-motion";

export function About({ data, variant = "developer", isEditor = false, onUpdate }: { data: any, variant?: string, isEditor?: boolean, onUpdate?: (key: string, value: any) => void }) {
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

  if (variant === "finox") {
    return (
      <section className="w-full bg-white text-black px-6 md:px-10 py-20" style={dynamicStyles}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">

          {/* Left: heading + copy */}
          <div>
            {renderDraggable('heading', (
              <h2 className="text-4xl font-normal mb-6">{data?.heading || "About Me"}</h2>
            ))}
            {renderDraggable('description', (
              <p className="text-neutral-500 text-sm leading-relaxed max-w-md">
                {data?.description ||
                  "I'm specialize in turning complex problems into elegant solutions. My approach blends creativity with strategic thinking to deliver designs that not only look great but work seamlessly. Ready to start your next project?"}
              </p>
            ))}
          </div>

          {/* Right: stat card + avatar + bullets */}
          <div className="grid grid-cols-1 sm:grid-cols-[1.2fr_1fr] gap-6">
            <div className="border border-neutral-200 rounded-2xl p-6 flex flex-col justify-between">
              {renderDraggable('statIcon', (
                <div className="w-8 h-8 rounded-full border border-neutral-300 flex items-center justify-center text-xs mb-6">
                  ⏱
                </div>
              ))}
              {renderDraggable('statValue', (
                <div className="text-5xl font-medium mb-3">{data?.statValue || "120%"}</div>
              ))}
              {renderDraggable('statCaption', (
                <p className="text-xs text-neutral-500 leading-relaxed mb-6">
                  {data?.statCaption || "Average increase in client engagement in the first 6 months"}
                </p>
              ))}
              {renderDraggable('statImage', (
                <img
                  src={data?.statImage || "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=2070&auto=format&fit=crop"}
                  alt="Portrait"
                  className="w-full h-40 object-cover rounded-xl grayscale"
                />
              ))}
            </div>

            <div className="flex flex-col gap-4">
              {renderDraggable('smallAvatar', (
                <img
                  src={data?.smallAvatar || "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=2070&auto=format&fit=crop"}
                  alt="Detail"
                  className="w-full h-28 object-cover rounded-xl grayscale"
                />
              ))}
              {(data?.bullets || [
                "With 4+ years of experience, I specialize in creating intuitive, user-focused designs that solve real-world problems and deliver seamless digital experiences.",
                "I thrive on working closely with clients, blending creativity with strategy to bring their vision to life through thoughtful, impactful design solutions."
              ]).map((bullet: string, i: number) => (
                renderDraggable(`bullet-${i}`, (
                  <div key={i} className="flex gap-2 text-xs text-neutral-500 leading-relaxed">
                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-black shrink-0" />
                    <span>{bullet}</span>
                  </div>
                ))
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 px-6 container mx-auto text-center" style={dynamicStyles}>
      <h2 className="text-3xl font-bold mb-8">About Me</h2>
      <p className="text-xl max-w-2xl mx-auto opacity-70">
        {data?.description || "Default about section."}
      </p>
    </section>
  );
}
