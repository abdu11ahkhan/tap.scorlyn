import DeveloperPortfolio from "@/templates/DeveloperPortfolio";
import DesignerPortfolio from "@/templates/DesignerPortfolio";
import AIEngineerPortfolio from "@/templates/AIEngineerPortfolio";
import BusinessPortfolio from "@/templates/BusinessPortfolio";
import MinimalPortfolio from "@/templates/MinimalPortfolio";
import CarrdSplitPortfolio from "@/templates/CarrdSplitPortfolio";
import CarrdLinksPortfolio from "@/templates/CarrdLinksPortfolio";
import FinoxPortfolio from "@/templates/FinoxPortfolio";
import GlassPortfolio from "@/templates/GlassPortfolio";
import TheoPortfolio from "@/templates/TheoPortfolio";
import ArchitectPortfolio from "@/templates/ArchitectPortfolio";
import MotionPortfolio from "@/templates/MotionPortfolio";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

// Mock data to hydrate the templates during preview
const mockData = {
  hero: {
    title: "Jane Doe",
    subtitle: "Creative Professional",
    description: "I build exceptional digital products that solve complex problems.",
  },
  skills: {
    items: ["React", "Figma", "Next.js", "Tailwind CSS", "Supabase", "UI/UX", "Motion Design"],
  },
  projects: {
    items: [
      { title: "Nexus SaaS", description: "A portfolio builder platform with NFC integration." },
      { title: "Eco Store", description: "An e-commerce platform for sustainable products." },
      { title: "AI Dashboard", description: "A data visualization tool for machine learning models." },
    ]
  }
};

const theoMockData = {
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
};

const glassPortfolioMockData = {
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
};

const finoxMockData = {
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
};

const carrdSplitMockData = {
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
};

const businessMockData = {
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
};

const motionMockData = {
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
};

export default async function TemplatePreviewPage({ params }: { params: Promise<{ templateId: string }> }) {
  const { templateId } = await params;

  const renderTemplate = () => {
    switch (templateId) {
      case "theo":
        return <TheoPortfolio data={theoMockData} />;
      case "glass-portfolio":
        return <GlassPortfolio data={glassPortfolioMockData} />;
      case "finox":
        return <FinoxPortfolio data={finoxMockData} />;
      case "developer":
        return <DeveloperPortfolio data={mockData} />;
      case "designer":
        return <DesignerPortfolio data={mockData} />;
      case "ai-engineer":
        return <AIEngineerPortfolio data={mockData} />;
      case "business":
        return <BusinessPortfolio data={businessMockData} />;
      case "architect":
        return <ArchitectPortfolio data={mockData} />;
      case "motion":
        return <MotionPortfolio data={motionMockData} />;
      case "minimal":
        return <MinimalPortfolio data={mockData} />;
      case "carrd-split":
        return <CarrdSplitPortfolio data={carrdSplitMockData} />;
      case "carrd-links":
        return <CarrdLinksPortfolio data={mockData} />;
      default:
        return null;
    }
  };

  const Template = renderTemplate();

  if (!Template) {
    notFound();
  }

  return (
    <div className="min-h-screen relative">
      {/* Preview Navigation Bar */}
      <div className="fixed top-0 left-0 w-full h-12 bg-black/90 backdrop-blur-md z-[100] border-b border-white/10 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/templates" className="text-gray-400 hover:text-white flex items-center text-sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Templates
          </Link>
          <span className="text-gray-600">|</span>
          <span className="text-sm font-medium text-white capitalize">{templateId.replace('-', ' ')} Template Preview</span>
        </div>
        <div className="flex items-center gap-4">
          <button className="px-4 py-1.5 text-sm bg-primary text-primary-foreground rounded-full hover:bg-primary/90 font-medium">
            Use this Template
          </button>
        </div>
      </div>

      {/* The Template Content (pushed down to avoid overlap with preview bar) */}
      <div className="pt-12">
        {Template}
      </div>
    </div>
  );
}
