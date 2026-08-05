"use client";

import { motion } from "framer-motion";

export function Gallery({ data, variant = "developer", isEditor = false, onUpdate }: { data: any, variant?: string, isEditor?: boolean, onUpdate?: (key: string, value: any) => void }) {
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
      <section className="w-full bg-white px-6 md:px-10 pb-6" style={dynamicStyles}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {(data?.images || [
            { src: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=2070&auto=format&fit=crop", alt: "Project 1" },
            { src: "https://images.unsplash.com/photo-1561070791-2526d30994b5?q=80&w=2000&auto=format&fit=crop", alt: "Project 2" },
            { src: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2015&auto=format&fit=crop", alt: "Project 3" }
          ]).map((img: any, i: number) => (
            renderDraggable(`galleryImage-${i}`, (
              <img
                key={i}
                src={img.src}
                alt={img.alt}
                className="w-full h-40 object-cover rounded-lg grayscale"
              />
            ))
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 px-6 container mx-auto" style={dynamicStyles}>
      <h2 className="text-3xl font-bold mb-8 text-center">Gallery</h2>
      <p className="text-center opacity-70">No gallery images</p>
    </section>
  );
}
