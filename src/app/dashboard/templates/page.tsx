"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Eye, Plus } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

export const TEMPLATES = [
  {
    id: "theo",
    name: "Theo K.",
    description: "A minimalist typography-focused link-in-bio style card.",
    image: "/theo_preview.png",
    tags: ["Minimalist", "Typography", "Links"]
  },
  {
    id: "glass-portfolio",
    name: "Glass Portfolio",
    description: "A stunning 3-column glassmorphic card for creative professionals.",
    image: "/glass_portfolio_preview.png",
    tags: ["Glassmorphism", "Creative", "Card"]
  },
  {
    id: "finox",
    name: "Finox — Designer Portfolio",
    description: "Monochrome editorial portfolio with a bold hero and stat-driven about section.",
    image: "/finox_preview.png",
    tags: ["Portfolio", "Minimal", "Monochrome", "Designer"]
  },
  {
    id: "motion",
    name: "Motion Designer",
    description: "A sleek, dark-themed stacked layout with vibrant accents and smooth animations.",
    image: "/motion_preview.png",
    tags: ["Dark", "Motion", "Sleek"]
  },
  {
    id: "architect",
    name: "Architect Profile",
    description: "An elegant, gold-accented split layout designed for interior designers and architects.",
    image: "/architect_preview.png",
    tags: ["Elegant", "Split", "Architecture"]
  },
  {
    id: "business",
    name: "Business Profile",
    description: "Professional and trustworthy layout for consultants, agencies, and freelancers.",
    image: "/alexa_jackson.png",
    tags: ["Professional", "Corporate", "Clean"]
  },
  {
    id: "carrd-split",
    name: "Split Profile",
    description: "A classic Carrd-style split layout. Perfect for personal biolinks and profiles.",
    image: "/ahmad_sachyar.png",
    tags: ["Classic", "Split", "Biolink"]
  },
  {
    id: "carrd-links",
    name: "Linktree Profile",
    description: "A 3-column layout featuring bio, portrait, and a dedicated links section.",
    image: "/linktree_profile_preview.png",
    tags: ["Links", "Portrait", "Social"]
  }
];

export default function TemplatesPage() {
  const supabase = createClient();
  const router = useRouter();
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleSelectTemplate = async (templateId: string) => {
    setIsCreating(true);
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      alert("Please log in to create a portfolio.");
      setIsCreating(false);
      return;
    }

    // Default template JSON Structure
    const initialContent = templateId === 'theo'
      ? {
          hero: {
            brand: "NFC Portfoli",
            status: "Open to work",
            title: "John Rams",
            role1: "Writer",
            role2: "Strategist",
            role3: "Tokyo",
            bio: "I write for brands that have something real to say. Long-form, short-form, brand voice, editorial—words that earn attention rather than beg for it.",
            linksLabel: "Links",
            ctaText: "Contact Me",
            ctaSubtitle: "Usually replies\nwithin 24 hours.",
            footerLeft: "CardLink · NFC Digital Card",
            footerRight: "© 2025"
          }
        }
      : templateId === 'glass-portfolio'
      ? {
          hero: {
            title: "Olivia Dunham",
            role: "Creative Product Designer",
            description1: "Passionate about crafting digital experiences that blend beautiful aesthetics with meaningful usability.",
            description2: "Specializing in UI/UX design, branding and interactive web experiences for startups and global companies. Every project focuses on simplicity, clarity and lasting impressions.",
            connectTitle: "Let's Connect",
            connectDescription: "Available for freelance projects, collaborations and creative partnerships.",
            btn1Text: "Portfolio",
            btn2Text: "Contact Me",
            imageUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=900"
          }
        }
      : templateId === 'finox' 
      ? {
          hero: {
            logo: "",
            navLinks: ["About Me", "Portfolio", "Services", "Blog", "Pages"],
            ctaText: "Book A Call",
            eyebrow: "Product Designer",
            stats: [
              { value: "", label: "Project completed" },
              { value: "", label: "Startup raised" }
            ],
            title: "Muhammad Awais",
            subtitle: "Web Developer",
            scrollText: "Scroll down",
            image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=2070&auto=format&fit=crop",
            imageAlt: "Portrait",
            links: [
              { label: "Instagram", url: "#", icon: "ig" },
              { label: "Facebook", url: "#", icon: "fb" },
              { label: "YouTube", url: "#", icon: "yt" },
              { label: "Website", url: "#", icon: "globe" },
              { label: "Email", url: "#", icon: "email" },
              { label: "LinkedIn", url: "#", icon: "in" }
            ]
          },
          about: {
            heading: "About Me",
            description: "I'm specialize in turning complex problems into elegant solutions. My approach blends creativity with strategic thinking to deliver designs that not only look great but work seamlessly. Ready to start your next project?",
            statValue: "120%",
            statCaption: "Average increase in client engagement in the first 6 months",
            statImage: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=2070&auto=format&fit=crop",
            smallAvatar: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=2070&auto=format&fit=crop",
            bullets: [
              "With 4+ years of experience, I specialize in creating intuitive, user-focused designs that solve real-world problems and deliver seamless digital experiences.",
              "I thrive on working closely with clients, blending creativity with strategy to bring their vision to life through thoughtful, impactful design solutions."
            ]
          },
          gallery: {
            images: [
              { src: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=2070&auto=format&fit=crop", alt: "Project 1" },
              { src: "https://images.unsplash.com/photo-1561070791-2526d30994b5?q=80&w=2000&auto=format&fit=crop", alt: "Project 2" },
              { src: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2015&auto=format&fit=crop", alt: "Project 3" }
            ]
          }
        }
      : templateId === 'carrd-links'
      ? {
          hero: {
            title: "Ahmad\nSachyar",
            subtitle: "SOFTWARE ENGINEER",
            description: "AI enginner Full Stack Developer",
            links: [
              { id: '1', label: 'Instagram', url: '#' },
              { id: '2', label: 'Facebook', url: '#' },
              { id: '3', label: 'YouTube', url: '#' },
              { id: '4', label: 'TikTok', url: '#' },
              { id: '5', label: 'Contact', url: '#' }
            ],
            imageUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=1287&auto=format&fit=crop"
          }
        }
      : templateId === 'carrd-split'
      ? {
          hero: {
            title: "Ahmad\nSachyar",
            subtitle: "SOFTWARE ENGINEER",
            description: "Video Editor",
            imageUrl: "/ahmad_sachyar.png",
            links: [
              { label: 'X', url: '#' },
              { label: 'Instagram', url: '#' },
              { label: 'LinkedIn', url: '#' }
            ]
          }
        }
      : templateId === 'business'
      ? {
          hero: {
            title: "Alexa Jackson",
            subtitle: "Business Analyst",
            description: "Im a business specialist providing expert financial services",
            imageUrl: "/alexa_jackson.png",
            links: [
              { label: 'Instagram', url: '#' },
              { label: 'X', url: '#' },
              { label: 'LinkedIn', url: '#' }
            ]
          }
        }
      : templateId === 'architect'
      ? {
          hero: {
            title: "Riya Sam",
            role: "ARCHITECT & INTERIOR DESIGNER",
            tag: "PORTFOLIO",
            heading: "Spaces that breathe. Designs that last.",
            bio: "Based in Dubai, I design residential and commercial spaces where function meets soul",
            imageUrl: "/riya_sam.png",
            ctaText: "Contact Me →",
            stats: [
              { num: "2", label: "YEARS" },
              { num: "80+", label: "PROJECTS" },
              { num: "4", label: "COUNTRIES" },
              { num: "★ 5.0", label: "RATING" }
            ],
            links: [
              { label: 'Instagram', url: '#' },
              { label: 'LinkedIn', url: '#' },
              { label: 'WhatsApp', url: '#' },
              { label: 'Email', url: '#' },
              { label: 'Portfolio', url: '#' }
            ]
          }
        }
      : templateId === 'motion'
      ? {
          hero: {
            title: "Zara Ali",
            initials: "ZO",
            role: "Motion Designer · Brand Animator · Creative Director",
            tag: "AVAILABLE FOR PROJECTS",
            ctaText: "Explore My Work ↓",
            links: [
              { label: 'Instagram', url: '#' },
              { label: 'LinkedIn', url: '#' },
              { label: 'WhatsApp', url: '#' },
              { label: 'Email', url: '#' },
              { label: 'Portfolio', url: '#' }
            ]
          }
        }
      : {
          hero: { title: "Your Name", subtitle: "Your Role" },
          skills: { items: ["Skill 1", "Skill 2", "Skill 3"] },
          projects: { items: [] }
        };

    // Insert into Supabase
    const { data, error } = await supabase
      .from('websites')
      .insert({
        user_id: user.id,
        template_name: templateId,
        content_json: initialContent,
        published: false
      })
      .select()
      .single();

    if (error) {
      console.error(error);
      alert("Error creating portfolio. Please try again.");
      setIsCreating(false);
    } else if (data) {
      // Redirect to the visual editor for this new website
      router.push(`/dashboard/editor/${data.id}`);
    }
  };

  return (
    <div className="space-y-12 max-w-7xl mx-auto pb-20">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-6"
      >
        <div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase mb-2">TEMPLATES.</h1>
          <p className="text-xl text-slate-400 font-medium">Select a stunning starting point for your digital identity.</p>
        </div>
      </motion.div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {TEMPLATES.map((template, i) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
            onMouseEnter={() => setHoveredTemplate(template.id)}
            onMouseLeave={() => setHoveredTemplate(null)}
          >
            <Card className="overflow-hidden bg-[#0A0A0A] border border-white/5 rounded-[2rem] hover:border-white/10 transition-all duration-300 flex flex-col h-full group hover:bg-[#111]">
              
              {/* Template Image Preview */}
              <div className="relative aspect-[4/3] bg-[#050505] overflow-hidden border-b border-white/5 p-4 pb-0">
                <div className="w-full h-full rounded-t-2xl overflow-hidden relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={template.image} 
                    alt={template.name}
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-transform duration-700 group-hover:scale-105"
                  />
                  
                  {/* Hover Overlay Actions */}
                  <div 
                    className={`absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4 transition-opacity duration-300 z-20 ${
                      hoveredTemplate === template.id ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    <Button 
                      className="w-48 bg-white text-black hover:bg-gray-200 shadow-[0_0_30px_rgba(255,255,255,0.3)] rounded-full h-12 font-bold uppercase tracking-widest text-xs transition-transform hover:scale-105"
                      onClick={() => handleSelectTemplate(template.id)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Use Template
                    </Button>
                    <Link href={`/preview/${template.id}`} target="_blank">
                      <Button variant="outline" className="w-48 border-white/20 bg-transparent hover:bg-white/10 text-white rounded-full h-12 font-bold uppercase tracking-widest text-xs transition-colors">
                        <Eye className="w-4 h-4 mr-2" />
                        Preview
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Template Details */}
              <div className="p-8 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-2xl font-black uppercase tracking-tight">{template.name}</h3>
                  {template.id === 'developer' && (
                    <span className="flex items-center text-[10px] font-black uppercase tracking-widest px-3 py-1.5 bg-cyan-950 border border-cyan-900 text-cyan-400 rounded-full">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Popular
                    </span>
                  )}
                </div>
                <p className="text-slate-400 text-sm font-medium mb-6 flex-1 leading-relaxed">
                  {template.description}
                </p>
                <div className="flex flex-wrap gap-2 mt-auto">
                  {template.tags.map(tag => (
                    <span key={tag} className="text-[10px] uppercase font-bold tracking-wider px-3 py-1 rounded-full bg-slate-900 border border-white/5 text-slate-400">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
