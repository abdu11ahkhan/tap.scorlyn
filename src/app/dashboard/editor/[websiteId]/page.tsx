"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useEditorStore } from "@/store/useEditorStore";
import { Hero, Skills, Projects, About, Gallery } from "@/components/sections/template-blocks";
import { motion, type Transition } from "framer-motion";
import { 
  Plus, Undo, Redo, Play, Smartphone, Save, MoreVertical, 
  Type, Paintbrush, Zap, Settings, X, Trash2, LayoutTemplate, Check,
  CopyPlus, Scissors, Copy, ClipboardPaste, ChevronsDown, GripVertical
} from "lucide-react";
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableBlockWrapper({ id, children, isSelected }: { id: string, children: React.ReactNode, isSelected: boolean }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    position: 'relative' as any
  };

  return (
    <div ref={setNodeRef} style={style} className={`relative group ${isDragging ? 'opacity-50' : ''}`}>
      {/* Drag handle */}
      <div 
        {...attributes} 
        {...listeners}
        title="Drag to reorder"
        className={`absolute top-4 left-4 p-1.5 bg-black/40 hover:bg-black/60 border border-white/20 text-white rounded cursor-grab active:cursor-grabbing backdrop-blur-md z-50 transition-all shadow-xl ${isSelected ? 'opacity-100 scale-100' : 'opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100'}`}
      >
        <GripVertical className="w-5 h-5" />
      </div>
      {children}
    </div>
  );
}

export default function EditorPage() {
  const { websiteId } = useParams();
  const router = useRouter();
  const supabase = createClient();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Sidebar State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarMode, setSidebarMode] = useState<'add' | 'edit'>('add');
  const [activeTab, setActiveTab] = useState<'content' | 'appearance' | 'animation' | 'settings'>('content');
  const [isMobileView, setIsMobileView] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [clipboard, setClipboard] = useState<any>(null);

  const { 
    websiteId: storeWebsiteId, 
    templateName, 
    blocks, 
    selectedBlockId,
    initializeEditor,
    addBlock,
    selectBlock,
    removeBlock,
    updateBlockContent,
    duplicateBlock,
    reorderBlocks,
    undo,
    redo,
    historyIndex,
    history
  } = useEditorStore();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = blocks.findIndex((block) => block.id === active.id);
      const newIndex = blocks.findIndex((block) => block.id === over.id);
      reorderBlocks(arrayMove(blocks, oldIndex, newIndex));
    }
  };

  useEffect(() => {
    async function loadWebsite() {
      const { data, error } = await supabase
        .from('websites')
        .select('*')
        .eq('id', websiteId)
        .single();
      
      if (data) {
        const defaultBlocks = data.template_name === 'finox' 
          ? [
              { id: 'hero-1', type: 'hero', content: data.content_json?.hero || {} },
              { id: 'about-1', type: 'about', content: data.content_json?.about || {} },
              { id: 'gallery-1', type: 'gallery', content: data.content_json?.gallery || {} }
            ]
          : (data.template_name === 'glass-portfolio' || data.template_name === 'theo')
          ? [
              { id: 'hero-1', type: 'hero', content: data.content_json?.hero || {} }
            ]
          : [
              { id: 'hero-1', type: 'hero', content: data.content_json?.hero || {} },
              { id: 'skills-1', type: 'skills', content: data.content_json?.skills || {} },
              { id: 'projects-1', type: 'projects', content: data.content_json?.projects || {} }
            ];
        const initialBlocks = data.content_json?.blocks || defaultBlocks;
        initializeEditor(data.id, data.template_name, initialBlocks);
      }
      setLoading(false);
    }
    if (websiteId) loadWebsite();
  }, [websiteId, supabase, initializeEditor]);

  // Open sidebar in edit mode when a block is selected
  useEffect(() => {
    if (selectedBlockId) {
      setSidebarMode('edit');
      setIsSidebarOpen(true);
    }
  }, [selectedBlockId]);

  const handleSave = async () => {
    setSaving(true);
    await supabase.from('websites').update({ content_json: { blocks } }).eq('id', websiteId);
    setTimeout(() => setSaving(false), 800);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
    selectBlock(null);
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-[#2B2B36] text-white">Loading Editor...</div>;
  if (!storeWebsiteId) return <div className="h-screen flex items-center justify-center bg-[#2B2B36] text-red-400">Website not found.</div>;

  const renderEditableBlock = (block: any) => {
    const isSelected = selectedBlockId === block.id;
    
    // Animation Engine Logic
    const animationType = block.content.animation || 'none';
    const animationVariants = {
      none: { opacity: 1, y: 0, x: 0, scale: 1, rotate: 0, rotateX: 0, rotateY: 0, filter: 'blur(0px)' },
      fadeIn: { opacity: 0, y: 0, x: 0, scale: 1, rotate: 0, rotateX: 0, rotateY: 0, filter: 'blur(0px)' },
      fadeUp: { opacity: 0, y: 50, x: 0, scale: 1, rotate: 0, rotateX: 0, rotateY: 0, filter: 'blur(0px)' },
      fadeDown: { opacity: 0, y: -50, x: 0, scale: 1, rotate: 0, rotateX: 0, rotateY: 0, filter: 'blur(0px)' },
      fadeLeft: { opacity: 0, y: 0, x: 50, scale: 1, rotate: 0, rotateX: 0, rotateY: 0, filter: 'blur(0px)' },
      fadeRight: { opacity: 0, y: 0, x: -50, scale: 1, rotate: 0, rotateX: 0, rotateY: 0, filter: 'blur(0px)' },
      blurIn: { opacity: 0, y: 0, x: 0, scale: 1, rotate: 0, rotateX: 0, rotateY: 0, filter: 'blur(10px)' },
      bounceUp: { opacity: 0, y: 100, x: 0, scale: 1, rotate: 0, rotateX: 0, rotateY: 0, filter: 'blur(0px)' },
      bounceDown: { opacity: 0, y: -100, x: 0, scale: 1, rotate: 0, rotateX: 0, rotateY: 0, filter: 'blur(0px)' },
      bounceLeft: { opacity: 0, y: 0, x: 100, scale: 1, rotate: 0, rotateX: 0, rotateY: 0, filter: 'blur(0px)' },
      bounceRight: { opacity: 0, y: 0, x: -100, scale: 1, rotate: 0, rotateX: 0, rotateY: 0, filter: 'blur(0px)' },
      tiltLeft: { opacity: 0, y: 0, x: 0, scale: 0.9, rotate: -15, rotateX: 0, rotateY: 0, filter: 'blur(0px)' },
      tiltRight: { opacity: 0, y: 0, x: 0, scale: 0.9, rotate: 15, rotateX: 0, rotateY: 0, filter: 'blur(0px)' },
      flipForward: { opacity: 0, y: 0, x: 0, scale: 1, rotate: 0, rotateX: -90, rotateY: 0, filter: 'blur(0px)' },
      flipBackward: { opacity: 0, y: 0, x: 0, scale: 1, rotate: 0, rotateX: 90, rotateY: 0, filter: 'blur(0px)' },
      flipLeft: { opacity: 0, y: 0, x: 0, scale: 1, rotate: 0, rotateX: 0, rotateY: -90, filter: 'blur(0px)' },
      flipRight: { opacity: 0, y: 0, x: 0, scale: 1, rotate: 0, rotateX: 0, rotateY: 90, filter: 'blur(0px)' },
      popIn: { opacity: 0, y: 0, x: 0, scale: 0.5, rotate: 0, rotateX: 0, rotateY: 0, filter: 'blur(0px)' },
      slideLeft: { opacity: 0, y: 0, x: 100, scale: 1, rotate: 0, rotateX: 0, rotateY: 0, filter: 'blur(0px)' },
      slideRight: { opacity: 0, y: 0, x: -100, scale: 1, rotate: 0, rotateX: 0, rotateY: 0, filter: 'blur(0px)' }
    };
    
    const animateTo = { opacity: 1, y: 0, x: 0, scale: 1, rotate: 0, rotateX: 0, rotateY: 0, filter: 'blur(0px)' };
    
    const isSpring = animationType.startsWith('bounce') || animationType === 'popIn';
    
    // Support custom duration and delay, falling back to sensible defaults
    const duration = block.content.animationDuration || (isSpring ? 0.8 : 0.6);
    const delay = block.content.animationDelay || 0;
    
    // Annotated: without it `type: 'spring'` widens to `string`, which does not
    // satisfy framer-motion's AnimationGeneratorType union.
    const transitionOptions: Transition = isSpring
      ? { type: 'spring', bounce: 0.5, duration, delay }
      : { duration, ease: "easeOut", delay };

    return (
      <SortableBlockWrapper key={block.id} id={block.id} isSelected={isSelected}>
        <motion.div 
          id={block.id}
          key={`${block.id}-${animationType}-${duration}-${delay}-${block.content.replayKey || 0}`} // Force re-render/re-animate when animation changes
          initial={animationVariants[animationType as keyof typeof animationVariants]}
          animate={animateTo}
          transition={transitionOptions}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            selectBlock(block.id);
          }}
          className={`relative cursor-pointer border-2 transition-all duration-200 ${
            isSelected ? 'border-teal-400 shadow-[0_0_0_4px_rgba(45,212,191,0.2)] z-10' : 'border-transparent hover:border-teal-400/50'
          }`}
        >
          <div className={`${templateName === 'designer' ? 'bg-[#F9F9F7] text-black' : templateName === 'ai-engineer' ? 'bg-[#05050A] text-gray-300' : 'bg-[#0a0a0f] text-white'}`}>
            {block.type === 'hero' && <Hero data={block.content} variant={templateName} isEditor={true} onUpdate={(k, v) => updateBlockContent(block.id, { [k]: v })} />}
            {block.type === 'skills' && <Skills data={block.content} variant={templateName} isEditor={true} onUpdate={(k, v) => updateBlockContent(block.id, { [k]: v })} />}
            {block.type === 'projects' && <Projects data={block.content} variant={templateName} isEditor={true} onUpdate={(k, v) => updateBlockContent(block.id, { [k]: v })} />}
            {block.type === 'about' && <About data={block.content} variant={templateName} isEditor={true} onUpdate={(k, v) => updateBlockContent(block.id, { [k]: v })} />}
            {block.type === 'gallery' && <Gallery data={block.content} variant={templateName} isEditor={true} onUpdate={(k, v) => updateBlockContent(block.id, { [k]: v })} />}
          </div>
        </motion.div>
      </SortableBlockWrapper>
    );
  };

  const renderSidebarContent = () => {
    if (sidebarMode === 'add') {
      return (
        <div className="p-6 space-y-6">
          <h2 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">Add Element</h2>
          <div className="grid grid-cols-2 gap-3">
            {['hero', 'about', 'skills', 'projects', 'gallery', 'contact'].map((type) => (
              <button 
                key={type}
                onClick={() => { addBlock(type as any); closeSidebar(); }}
                className="aspect-square bg-white/5 border border-white/10 rounded-xl flex flex-col items-center justify-center text-gray-300 hover:bg-teal-500/10 hover:border-teal-500/50 hover:text-teal-400 transition-all"
              >
                <LayoutTemplate className="w-6 h-6 mb-2 opacity-50" />
                <span className="text-xs font-medium capitalize">{type}</span>
              </button>
            ))}
          </div>
        </div>
      );
    }

    // Edit Mode
    const block = blocks.find(b => b.id === selectedBlockId);
    if (!block) return null;

    const handleUpdate = (key: string, value: any) => updateBlockContent(block.id, { [key]: value });

    return (
      <div className="flex flex-col h-full">
        {/* Editor Tabs */}
        <div className="flex items-center border-b border-white/10 px-2 pt-2">
          <button onClick={() => setActiveTab('content')} className={`p-3 border-b-2 transition-colors ${activeTab === 'content' ? 'border-teal-400 text-teal-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}><Type className="w-5 h-5" /></button>
          <button onClick={() => setActiveTab('appearance')} className={`p-3 border-b-2 transition-colors ${activeTab === 'appearance' ? 'border-teal-400 text-teal-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}><Paintbrush className="w-5 h-5" /></button>
          <button onClick={() => setActiveTab('animation')} className={`p-3 border-b-2 transition-colors ${activeTab === 'animation' ? 'border-teal-400 text-teal-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}><Zap className="w-5 h-5" /></button>
          <button onClick={() => setActiveTab('settings')} className={`p-3 border-b-2 transition-colors ${activeTab === 'settings' ? 'border-teal-400 text-teal-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}><Settings className="w-5 h-5" /></button>
        </div>

        {/* Editor Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{block.type} Element</span>
            <button onClick={() => { removeBlock(block.id); closeSidebar(); }} className="text-red-400 hover:text-red-300 p-1"><Trash2 className="w-4 h-4" /></button>
          </div>

          {activeTab === 'content' && block.type === 'hero' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Hero Image</label>
                <div className="flex items-center gap-4">
                  {block.content.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={block.content.imageUrl} alt="Hero" className="w-12 h-12 object-cover rounded bg-white/10" />
                  )}
                  <label className="cursor-pointer px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs rounded border border-white/10 transition-colors">
                    Upload Photo
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        
                        try {
                          const fileExt = file.name.split('.').pop();
                          const fileName = `${Math.random()}.${fileExt}`;
                          const filePath = `${storeWebsiteId}/${fileName}`;
                          await supabase.storage.from('portfolio-assets').upload(filePath, file);
                          const { data: { publicUrl } } = supabase.storage.from('portfolio-assets').getPublicUrl(filePath);
                          handleUpdate('imageUrl', publicUrl);
                        } catch (err) {
                          console.error(err);
                          handleUpdate('imageUrl', URL.createObjectURL(file));
                        }
                      }} 
                    />
                  </label>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Title</label>
                <textarea 
                  value={block.content.title || ''} onChange={(e) => handleUpdate('title', e.target.value)}
                  className="w-full bg-[#1A1A24] border border-white/10 rounded-lg p-3 text-sm text-white focus:border-teal-400 outline-none resize-none min-h-[80px]"
                />
              </div>
              {templateName !== 'architect' && templateName !== 'glass-portfolio' && templateName !== 'theo' && (
                <>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Subtitle</label>
                    <input 
                      value={block.content.subtitle || ''} onChange={(e) => handleUpdate('subtitle', e.target.value)}
                      className="w-full bg-[#1A1A24] border border-white/10 rounded-lg p-3 text-sm text-white focus:border-teal-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Description / Markdown Supported</label>
                    <textarea 
                      value={block.content.description || ''} onChange={(e) => handleUpdate('description', e.target.value)}
                      className="w-full bg-[#1A1A24] border border-white/10 rounded-lg p-3 text-sm text-white focus:border-teal-400 outline-none resize-none min-h-[100px]"
                    />
                  </div>
                </>
              )}
              
              {templateName === 'theo' && (
                <div className="space-y-4 pt-4 border-t border-white/10">
                  <label className="text-xs text-teal-400 font-bold uppercase tracking-wider block">Theo Specific Fields</label>
                  <div className="flex gap-4">
                    <div className="w-1/2">
                      <label className="text-xs text-gray-500 mb-1 block">Brand Name</label>
                      <input value={block.content.brand || 'NFC Portfolio'} onChange={(e) => handleUpdate('brand', e.target.value)} className="w-full bg-[#1A1A24] border border-white/10 rounded-lg p-3 text-sm text-white focus:border-teal-400 outline-none" />
                    </div>
                    <div className="w-1/2">
                      <label className="text-xs text-gray-500 mb-1 block">Status</label>
                      <input value={block.content.status || 'Open to work'} onChange={(e) => handleUpdate('status', e.target.value)} className="w-full bg-[#1A1A24] border border-white/10 rounded-lg p-3 text-sm text-white focus:border-teal-400 outline-none" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-1/3">
                      <label className="text-xs text-gray-500 mb-1 block">Role 1</label>
                      <input value={block.content.role1 || 'Writer'} onChange={(e) => handleUpdate('role1', e.target.value)} className="w-full bg-[#1A1A24] border border-white/10 rounded-lg p-3 text-sm text-white focus:border-teal-400 outline-none" />
                    </div>
                    <div className="w-1/3">
                      <label className="text-xs text-gray-500 mb-1 block">Role 2</label>
                      <input value={block.content.role2 || 'Strategist'} onChange={(e) => handleUpdate('role2', e.target.value)} className="w-full bg-[#1A1A24] border border-white/10 rounded-lg p-3 text-sm text-white focus:border-teal-400 outline-none" />
                    </div>
                    <div className="w-1/3">
                      <label className="text-xs text-gray-500 mb-1 block">Role 3 (Location)</label>
                      <input value={block.content.role3 || 'Tokyo'} onChange={(e) => handleUpdate('role3', e.target.value)} className="w-full bg-[#1A1A24] border border-white/10 rounded-lg p-3 text-sm text-white focus:border-teal-400 outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Bio Paragraph</label>
                    <textarea value={block.content.bio || ''} onChange={(e) => handleUpdate('bio', e.target.value)} className="w-full bg-[#1A1A24] border border-white/10 rounded-lg p-3 text-sm text-white focus:border-teal-400 outline-none resize-none min-h-[100px]" />
                  </div>
                  <div className="flex gap-4">
                    <div className="w-1/2">
                      <label className="text-xs text-gray-500 mb-1 block">CTA Button Text</label>
                      <input value={block.content.ctaText || 'Contact Me'} onChange={(e) => handleUpdate('ctaText', e.target.value)} className="w-full bg-[#1A1A24] border border-white/10 rounded-lg p-3 text-sm text-white focus:border-teal-400 outline-none" />
                    </div>
                    <div className="w-1/2">
                      <label className="text-xs text-gray-500 mb-1 block">CTA Button URL</label>
                      <input value={block.content.ctaUrl || '#'} onChange={(e) => handleUpdate('ctaUrl', e.target.value)} className="w-full bg-[#1A1A24] border border-white/10 rounded-lg p-3 text-sm text-white focus:border-teal-400 outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">CTA Subtitle</label>
                    <textarea value={block.content.ctaSubtitle || ''} onChange={(e) => handleUpdate('ctaSubtitle', e.target.value)} className="w-full bg-[#1A1A24] border border-white/10 rounded-lg p-3 text-sm text-white focus:border-teal-400 outline-none resize-none min-h-[60px]" />
                  </div>
                  <div className="flex gap-4">
                    <div className="w-1/2">
                      <label className="text-xs text-gray-500 mb-1 block">Footer Left</label>
                      <input value={block.content.footerLeft || 'CardLink'} onChange={(e) => handleUpdate('footerLeft', e.target.value)} className="w-full bg-[#1A1A24] border border-white/10 rounded-lg p-3 text-sm text-white focus:border-teal-400 outline-none" />
                    </div>
                    <div className="w-1/2">
                      <label className="text-xs text-gray-500 mb-1 block">Footer Right</label>
                      <input value={block.content.footerRight || '© 2025'} onChange={(e) => handleUpdate('footerRight', e.target.value)} className="w-full bg-[#1A1A24] border border-white/10 rounded-lg p-3 text-sm text-white focus:border-teal-400 outline-none" />
                    </div>
                  </div>
                </div>
              )}

              {templateName === 'glass-portfolio' && (
                <div className="space-y-4 pt-4 border-t border-white/10">
                  <label className="text-xs text-teal-400 font-bold uppercase tracking-wider block">Glass Portfolio Fields</label>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Role</label>
                    <input value={block.content.role || 'Creative Product Designer'} onChange={(e) => handleUpdate('role', e.target.value)} className="w-full bg-[#1A1A24] border border-white/10 rounded-lg p-3 text-sm text-white focus:border-teal-400 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Description Paragraph 1</label>
                    <textarea value={block.content.description1 || ''} onChange={(e) => handleUpdate('description1', e.target.value)} className="w-full bg-[#1A1A24] border border-white/10 rounded-lg p-3 text-sm text-white focus:border-teal-400 outline-none resize-none min-h-[80px]" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Description Paragraph 2</label>
                    <textarea value={block.content.description2 || ''} onChange={(e) => handleUpdate('description2', e.target.value)} className="w-full bg-[#1A1A24] border border-white/10 rounded-lg p-3 text-sm text-white focus:border-teal-400 outline-none resize-none min-h-[80px]" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Connect Title</label>
                    <input value={block.content.connectTitle || "Let's Connect"} onChange={(e) => handleUpdate('connectTitle', e.target.value)} className="w-full bg-[#1A1A24] border border-white/10 rounded-lg p-3 text-sm text-white focus:border-teal-400 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Connect Description</label>
                    <textarea value={block.content.connectDescription || ''} onChange={(e) => handleUpdate('connectDescription', e.target.value)} className="w-full bg-[#1A1A24] border border-white/10 rounded-lg p-3 text-sm text-white focus:border-teal-400 outline-none resize-none min-h-[80px]" />
                  </div>
                  <div className="flex gap-4">
                    <div className="w-1/2">
                      <label className="text-xs text-gray-500 mb-1 block">Button 1 Text</label>
                      <input value={block.content.btn1Text || 'Portfolio'} onChange={(e) => handleUpdate('btn1Text', e.target.value)} className="w-full bg-[#1A1A24] border border-white/10 rounded-lg p-3 text-sm text-white focus:border-teal-400 outline-none" />
                    </div>
                    <div className="w-1/2">
                      <label className="text-xs text-gray-500 mb-1 block">Button 2 Text</label>
                      <input value={block.content.btn2Text || 'Contact Me'} onChange={(e) => handleUpdate('btn2Text', e.target.value)} className="w-full bg-[#1A1A24] border border-white/10 rounded-lg p-3 text-sm text-white focus:border-teal-400 outline-none" />
                    </div>
                  </div>
                </div>
              )}

              {templateName === 'architect' && (
                <div className="space-y-4 pt-4 border-t border-white/10">
                  <label className="text-xs text-teal-400 font-bold uppercase tracking-wider block">Architect Specific Fields</label>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Initials (if no image)</label>
                    <input value={block.content.initials || 'PN'} onChange={(e) => handleUpdate('initials', e.target.value)} className="w-full bg-[#1A1A24] border border-white/10 rounded-lg p-3 text-sm text-white focus:border-teal-400 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Role</label>
                    <input value={block.content.role || 'Architect & Interior Designer'} onChange={(e) => handleUpdate('role', e.target.value)} className="w-full bg-[#1A1A24] border border-white/10 rounded-lg p-3 text-sm text-white focus:border-teal-400 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Tag (e.g. Portfolio)</label>
                    <input value={block.content.tag || 'Portfolio'} onChange={(e) => handleUpdate('tag', e.target.value)} className="w-full bg-[#1A1A24] border border-white/10 rounded-lg p-3 text-sm text-white focus:border-teal-400 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Heading</label>
                    <textarea value={block.content.heading || 'Spaces that breathe. Designs that last.'} onChange={(e) => handleUpdate('heading', e.target.value)} className="w-full bg-[#1A1A24] border border-white/10 rounded-lg p-3 text-sm text-white focus:border-teal-400 outline-none resize-none" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Bio</label>
                    <textarea value={block.content.bio || 'Based in Dubai, I design residential and commercial spaces where function meets soul. Every project begins with one question: how should this space make you feel?'} onChange={(e) => handleUpdate('bio', e.target.value)} className="w-full bg-[#1A1A24] border border-white/10 rounded-lg p-3 text-sm text-white focus:border-teal-400 outline-none resize-none min-h-[100px]" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Footer Text</label>
                    <input value={block.content.footer || 'CardLink · NFC Digital Portfolio'} onChange={(e) => handleUpdate('footer', e.target.value)} className="w-full bg-[#1A1A24] border border-white/10 rounded-lg p-3 text-sm text-white focus:border-teal-400 outline-none" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs text-gray-500 font-bold uppercase tracking-wider block">Stats (Max 4)</label>
                    {(block.content.stats || [
                      { num: "12+", label: "Years" },
                      { num: "80+", label: "Projects" },
                      { num: "4", label: "Countries" },
                      { num: "★ 5.0", label: "Rating" }
                    ]).map((stat: any, index: number) => (
                      <div key={index} className="flex gap-2">
                        <input value={stat.num} onChange={(e) => {
                          const newStats = [...(block.content.stats || [{ num: "12+", label: "Years" }, { num: "80+", label: "Projects" }, { num: "4", label: "Countries" }, { num: "★ 5.0", label: "Rating" }])];
                          newStats[index] = { ...newStats[index], num: e.target.value };
                          handleUpdate('stats', newStats);
                        }} className="w-1/2 bg-[#1A1A24] border border-white/10 rounded-lg p-2 text-sm text-white focus:border-teal-400 outline-none" placeholder="Value (e.g. 12+)" />
                        <input value={stat.label} onChange={(e) => {
                          const newStats = [...(block.content.stats || [{ num: "12+", label: "Years" }, { num: "80+", label: "Projects" }, { num: "4", label: "Countries" }, { num: "★ 5.0", label: "Rating" }])];
                          newStats[index] = { ...newStats[index], label: e.target.value };
                          handleUpdate('stats', newStats);
                        }} className="w-1/2 bg-[#1A1A24] border border-white/10 rounded-lg p-2 text-sm text-white focus:border-teal-400 outline-none" placeholder="Label (e.g. Years)" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {templateName === 'finox' && (
                <div className="space-y-4 pt-4 border-t border-white/10">
                  <label className="text-xs text-teal-400 font-bold uppercase tracking-wider block">Finox Specific Fields</label>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Logo Text</label>
                    <input value={block.content.logo || 'Finox'} onChange={(e) => handleUpdate('logo', e.target.value)} className="w-full bg-[#1A1A24] border border-white/10 rounded-lg p-3 text-sm text-white focus:border-teal-400 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Eyebrow (Vertical Text)</label>
                    <input value={block.content.eyebrow || 'Product Designer'} onChange={(e) => handleUpdate('eyebrow', e.target.value)} className="w-full bg-[#1A1A24] border border-white/10 rounded-lg p-3 text-sm text-white focus:border-teal-400 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Scroll Text</label>
                    <input value={block.content.scrollText || 'Scroll down'} onChange={(e) => handleUpdate('scrollText', e.target.value)} className="w-full bg-[#1A1A24] border border-white/10 rounded-lg p-3 text-sm text-white focus:border-teal-400 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Nav Links (comma separated)</label>
                    <input value={(block.content.navLinks || ["About Me", "Portfolio", "Services", "Blog", "Pages"]).join(', ')} onChange={(e) => handleUpdate('navLinks', e.target.value.split(',').map((s: string) => s.trim()))} className="w-full bg-[#1A1A24] border border-white/10 rounded-lg p-3 text-sm text-white focus:border-teal-400 outline-none" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs text-gray-500 font-bold uppercase tracking-wider block">Stats (Max 2)</label>
                    {(block.content.stats || [
                      { value: "+200", label: "Project completed" },
                      { value: "+50", label: "Startup raised" }
                    ]).map((stat: any, index: number) => (
                      <div key={index} className="flex gap-2">
                        <input value={stat.value} onChange={(e) => {
                          const newStats = [...(block.content.stats || [{ value: "+200", label: "Project completed" }, { value: "+50", label: "Startup raised" }])];
                          newStats[index] = { ...newStats[index], value: e.target.value };
                          handleUpdate('stats', newStats);
                        }} className="w-1/3 bg-[#1A1A24] border border-white/10 rounded-lg p-2 text-sm text-white focus:border-teal-400 outline-none" placeholder="Value" />
                        <input value={stat.label} onChange={(e) => {
                          const newStats = [...(block.content.stats || [{ value: "+200", label: "Project completed" }, { value: "+50", label: "Startup raised" }])];
                          newStats[index] = { ...newStats[index], label: e.target.value };
                          handleUpdate('stats', newStats);
                        }} className="w-2/3 bg-[#1A1A24] border border-white/10 rounded-lg p-2 text-sm text-white focus:border-teal-400 outline-none" placeholder="Label" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3 pt-4 border-t border-white/10">
                  <label className="text-xs text-gray-500 font-bold uppercase tracking-wider block">Links</label>
                  {(Array.isArray(block.content.links) ? block.content.links : [
                    { id: '1', label: 'Instagram', url: '#' },
                    { id: '2', label: 'Facebook', url: '#' },
                    { id: '3', label: 'YouTube', url: '#' },
                    { id: '4', label: 'TikTok', url: '#' },
                    { id: '5', label: 'Contact', url: '#' }
                  ]).map((link: any, index: number) => {
                    // Handle legacy string items safely
                    const linkObj = typeof link === 'string' ? { id: Math.random().toString(), label: link, url: '#' } : link;
                    return (
                      <div key={linkObj.id || index} className="bg-[#1A1A24] border border-white/10 rounded-lg p-3 space-y-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-semibold text-gray-400">Link {index + 1}</span>
                          <button 
                            onClick={() => {
                              const newLinks = [...(block.content.links || [])];
                              newLinks.splice(index, 1);
                              handleUpdate('links', newLinks);
                            }}
                            className="text-red-400/50 hover:text-red-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <input 
                          type="text" 
                          placeholder="Label (e.g. Instagram)"
                          value={linkObj.label} 
                          onChange={(e) => {
                            const currentLinks = Array.isArray(block.content.links) ? block.content.links : [
                              { id: '1', label: 'Instagram', url: '#' }, { id: '2', label: 'Facebook', url: '#' }, { id: '3', label: 'YouTube', url: '#' }, { id: '4', label: 'TikTok', url: '#' }, { id: '5', label: 'Contact', url: '#' }
                            ];
                            const newLinks = [...currentLinks];
                            if (typeof newLinks[index] === 'string') newLinks[index] = { id: Math.random().toString(), label: e.target.value, url: '#' };
                            else newLinks[index] = { ...newLinks[index], label: e.target.value };
                            handleUpdate('links', newLinks);
                          }}
                          className="w-full bg-black/20 border border-white/5 rounded p-2 text-xs text-white focus:border-teal-400 outline-none"
                        />
                        <input 
                          type="text" 
                          placeholder="URL (e.g. https://instagram.com/)"
                          value={linkObj.url} 
                          onChange={(e) => {
                            const currentLinks = Array.isArray(block.content.links) ? block.content.links : [
                              { id: '1', label: 'Instagram', url: '#' }, { id: '2', label: 'Facebook', url: '#' }, { id: '3', label: 'YouTube', url: '#' }, { id: '4', label: 'TikTok', url: '#' }, { id: '5', label: 'Contact', url: '#' }
                            ];
                            const newLinks = [...currentLinks];
                            if (typeof newLinks[index] === 'string') newLinks[index] = { id: Math.random().toString(), label: newLinks[index], url: e.target.value };
                            else newLinks[index] = { ...newLinks[index], url: e.target.value };
                            handleUpdate('links', newLinks);
                          }}
                          className="w-full bg-black/20 border border-white/5 rounded p-2 text-xs text-white focus:border-teal-400 outline-none"
                        />
                      </div>
                    )
                  })}
                  <button 
                    onClick={() => {
                      const currentLinks = Array.isArray(block.content.links) ? block.content.links : [
                        { id: '1', label: 'Instagram', url: '#' },
                        { id: '2', label: 'Facebook', url: '#' },
                        { id: '3', label: 'YouTube', url: '#' },
                        { id: '4', label: 'TikTok', url: '#' },
                        { id: '5', label: 'Contact', url: '#' }
                      ];
                      handleUpdate('links', [...currentLinks, { id: Math.random().toString(), label: 'New Link', url: '#' }]);
                    }}
                    className="w-full py-2 bg-white/5 hover:bg-white/10 text-xs text-white font-semibold rounded-lg border border-white/10 transition-colors"
                  >
                    + Add Link
                  </button>
                </div>
              <div className="text-xs text-gray-500 space-y-1 mt-4 p-4 bg-white/5 rounded-lg border border-white/5">
                <p>Supports Markdown formatting:</p>
                <p><code className="text-teal-400 bg-teal-400/10 px-1 rounded">**Bold**</code></p>
                <p><code className="text-teal-400 bg-teal-400/10 px-1 rounded">*Italic*</code></p>
                <p><code className="text-teal-400 bg-teal-400/10 px-1 rounded">[Link text](URL)</code></p>
              </div>

              {/* Template Specific Link Fields */}
              {(templateName === 'theo' || templateName === 'glass-portfolio' || templateName === 'finox' || templateName === 'carrd-split' || templateName === 'architect' || templateName === 'motion') && (
                <div className="space-y-4 pt-4 border-t border-white/10">
                  <label className="text-xs text-gray-500 font-bold uppercase tracking-wider block">Action Buttons & Links</label>
                  
                  {(templateName === 'theo' || templateName === 'carrd-split' || templateName === 'architect' || templateName === 'motion') && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] text-gray-500 mb-1 block uppercase">CTA Button Text</label>
                        <input value={block.content.ctaText || (templateName === 'carrd-split' ? 'Get in touch' : 'Contact Me')} onChange={(e) => handleUpdate('ctaText', e.target.value)} className="w-full bg-[#1A1A24] border border-white/10 rounded-lg p-2 text-xs text-white outline-none focus:border-teal-400" />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-500 mb-1 block uppercase">CTA Button URL</label>
                        <input value={block.content.ctaUrl || '#'} onChange={(e) => handleUpdate('ctaUrl', e.target.value)} className="w-full bg-[#1A1A24] border border-white/10 rounded-lg p-2 text-xs text-white outline-none focus:border-teal-400" placeholder="https://" />
                      </div>
                    </div>
                  )}

                  {templateName === 'glass-portfolio' && (
                    <div className="space-y-4">
                      <div className="space-y-2 p-3 bg-white/5 rounded border border-white/5">
                        <label className="text-[10px] text-teal-400 font-bold block uppercase">Primary Button</label>
                        <input value={block.content.btn1Text || 'Portfolio'} onChange={(e) => handleUpdate('btn1Text', e.target.value)} className="w-full bg-black/20 border border-white/10 rounded p-2 text-xs text-white outline-none focus:border-teal-400" placeholder="Button Text" />
                        <input value={block.content.btn1Url || '#'} onChange={(e) => handleUpdate('btn1Url', e.target.value)} className="w-full bg-black/20 border border-white/10 rounded p-2 text-xs text-white outline-none focus:border-teal-400" placeholder="URL (https://)" />
                      </div>
                      <div className="space-y-2 p-3 bg-white/5 rounded border border-white/5">
                        <label className="text-[10px] text-teal-400 font-bold block uppercase">Secondary Button</label>
                        <input value={block.content.btn2Text || 'Contact Me'} onChange={(e) => handleUpdate('btn2Text', e.target.value)} className="w-full bg-black/20 border border-white/10 rounded p-2 text-xs text-white outline-none focus:border-teal-400" placeholder="Button Text" />
                        <input value={block.content.btn2Url || '#'} onChange={(e) => handleUpdate('btn2Url', e.target.value)} className="w-full bg-black/20 border border-white/10 rounded p-2 text-xs text-white outline-none focus:border-teal-400" placeholder="URL (https://)" />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-8">
              {/* Basic Colors */}
              <div className="space-y-6">
                <div>
                  <label className="text-xs text-gray-500 mb-2 block font-medium uppercase tracking-wider">Background Color</label>
                  <div className="flex items-center gap-3 bg-[#1A1A24] border border-white/10 rounded-lg p-2">
                    <input 
                      type="color" 
                      value={block.content.backgroundColor || '#000000'} 
                      onChange={(e) => handleUpdate('backgroundColor', e.target.value)}
                      className="w-10 h-10 rounded cursor-pointer bg-transparent border-0 p-0"
                    />
                    <input 
                      type="text" 
                      value={block.content.backgroundColor || ''} 
                      onChange={(e) => handleUpdate('backgroundColor', e.target.value)}
                      placeholder="#000000"
                      className="flex-1 bg-transparent border-none text-sm text-white focus:outline-none uppercase font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-2 block font-medium uppercase tracking-wider">Text Color</label>
                  <div className="flex items-center gap-3 bg-[#1A1A24] border border-white/10 rounded-lg p-2">
                    <input 
                      type="color" 
                      value={block.content.textColor || '#ffffff'} 
                      onChange={(e) => handleUpdate('textColor', e.target.value)}
                      className="w-10 h-10 rounded cursor-pointer bg-transparent border-0 p-0"
                    />
                    <input 
                      type="text" 
                      value={block.content.textColor || ''} 
                      onChange={(e) => handleUpdate('textColor', e.target.value)}
                      placeholder="#FFFFFF"
                      className="flex-1 bg-transparent border-none text-sm text-white focus:outline-none uppercase font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="h-px bg-white/10 w-full" />

              {/* Typography */}
              <div className="space-y-6">
                <div>
                  <label className="text-xs text-gray-500 mb-2 block font-medium uppercase tracking-wider">Font</label>
                  <select 
                    value={block.content.fontFamily || 'default'} 
                    onChange={(e) => handleUpdate('fontFamily', e.target.value)}
                    className="w-full bg-[#1A1A24] border border-white/10 rounded-lg p-3 text-sm text-white focus:border-teal-400 outline-none appearance-none cursor-pointer"
                  >
                    <option value="default">Default</option>
                    <option value="sans">Sans-Serif</option>
                    <option value="serif">Serif</option>
                    <option value="mono">Monospace</option>
                  </select>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs text-gray-500 font-medium uppercase tracking-wider">Size</label>
                    <span className="text-xs text-gray-400">{block.content.fontSize || 1}x</span>
                  </div>
                  <input 
                    type="range" min="0.5" max="3" step="0.1"
                    value={block.content.fontSize || 1} 
                    onChange={(e) => handleUpdate('fontSize', parseFloat(e.target.value))}
                    className="w-full accent-teal-400"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs text-gray-500 font-medium uppercase tracking-wider">Weight</label>
                    <span className="text-xs text-gray-400">{block.content.fontWeight || 400}</span>
                  </div>
                  <input 
                    type="range" min="100" max="900" step="100"
                    value={block.content.fontWeight || 400} 
                    onChange={(e) => handleUpdate('fontWeight', parseInt(e.target.value))}
                    className="w-full accent-teal-400"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs text-gray-500 font-medium uppercase tracking-wider">Line Spacing</label>
                    <span className="text-xs text-gray-400">{block.content.lineHeight || 1.5}</span>
                  </div>
                  <input 
                    type="range" min="1" max="2.5" step="0.1"
                    value={block.content.lineHeight || 1.5} 
                    onChange={(e) => handleUpdate('lineHeight', parseFloat(e.target.value))}
                    className="w-full accent-teal-400"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs text-gray-500 font-medium uppercase tracking-wider">Letter Spacing</label>
                    <span className="text-xs text-gray-400">{block.content.letterSpacing || 0}px</span>
                  </div>
                  <input 
                    type="range" min="-5" max="15" step="1"
                    value={block.content.letterSpacing || 0} 
                    onChange={(e) => handleUpdate('letterSpacing', parseInt(e.target.value))}
                    className="w-full accent-teal-400"
                  />
                </div>
              </div>

              <div className="h-px bg-white/10 w-full" />

              {/* Layout & Effects */}
              <div className="space-y-6">
                <div>
                  <label className="text-xs text-gray-500 mb-2 block font-medium uppercase tracking-wider">Gradient</label>
                  <select 
                    value={block.content.gradient || 'none'} 
                    onChange={(e) => handleUpdate('gradient', e.target.value)}
                    className="w-full bg-[#1A1A24] border border-white/10 rounded-lg p-3 text-sm text-gray-400 focus:border-teal-400 outline-none appearance-none cursor-pointer"
                  >
                    <option value="none">(none)</option>
                    <option value="linear-cyan">Linear Cyan</option>
                    <option value="radial-purple">Radial Purple</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-2 block font-medium uppercase tracking-wider">Drop Shadow</label>
                  <select 
                    value={block.content.dropShadow || 'none'} 
                    onChange={(e) => handleUpdate('dropShadow', e.target.value)}
                    className="w-full bg-[#1A1A24] border border-white/10 rounded-lg p-3 text-sm text-gray-400 focus:border-teal-400 outline-none appearance-none cursor-pointer"
                  >
                    <option value="none">(none)</option>
                    <option value="sm">Small</option>
                    <option value="md">Medium</option>
                    <option value="xl">Extra Large</option>
                  </select>
                </div>
                <div className="pt-4 border-t border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs text-gray-300 font-bold uppercase tracking-wider">Mobile</label>
                    <div className="flex bg-[#1A1A24] border border-white/10 rounded text-[10px] uppercase font-bold overflow-hidden">
                      <button 
                        onClick={() => handleUpdate('mobileOptimization', 'auto')}
                        className={`px-3 py-1.5 transition-colors ${block.content.mobileOptimization !== 'manual' ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}
                      >
                        Auto
                      </button>
                      <button 
                        onClick={() => handleUpdate('mobileOptimization', 'manual')}
                        className={`px-3 py-1.5 transition-colors ${block.content.mobileOptimization === 'manual' ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}
                      >
                        Manual
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">Automatically optimize this element for viewing on mobile screens (recommended).</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'animation' && (
            <div className="space-y-6">
              <div>
                <label className="text-xs text-gray-500 mb-2 block font-medium">Entrance Animation</label>
                <p className="text-sm text-gray-400 mb-4 leading-relaxed">
                  Performed when this element first becomes visible or scrolls into view.
                </p>
                
                <div className="flex items-center gap-2">
                  <select 
                    value={block.content.animation || 'none'} 
                    onChange={(e) => handleUpdate('animation', e.target.value)}
                    className="flex-1 bg-[#1A1A24] border border-white/10 rounded-lg p-3 text-sm text-white focus:border-teal-400 outline-none appearance-none cursor-pointer"
                  >
                    <option value="none">None</option>
                    <option value="fadeIn">Fade In</option>
                    <option value="fadeUp">Fade Up</option>
                    <option value="fadeDown">Fade Down</option>
                    <option value="fadeLeft">Fade Left</option>
                    <option value="fadeRight">Fade Right</option>
                    <option value="blurIn">Blur In</option>
                    <option value="bounceUp">Bounce Up</option>
                    <option value="bounceDown">Bounce Down</option>
                    <option value="bounceLeft">Bounce Left</option>
                    <option value="bounceRight">Bounce Right</option>
                    <option value="tiltLeft">Tilt Left</option>
                    <option value="tiltRight">Tilt Right</option>
                    <option value="flipForward">Flip Forward</option>
                    <option value="flipBackward">Flip Backward</option>
                    <option value="flipLeft">Flip Left</option>
                    <option value="flipRight">Flip Right</option>
                    <option value="popIn">Pop In</option>
                    <option value="slideLeft">Slide Left</option>
                    <option value="slideRight">Slide Right</option>
                  </select>
                  
                  <button 
                    onClick={() => handleUpdate('replayKey', (block.content.replayKey || 0) + 1)}
                    className="p-3 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 text-sm font-medium transition-colors"
                  >
                    Replay
                  </button>
                </div>
              </div>

              {block.content.animation && block.content.animation !== 'none' && (
                <div className="pt-4 border-t border-white/5 space-y-4">
                  <div className="flex justify-between items-center text-xs text-gray-400 font-medium">
                    <span>Duration</span>
                    <span>{block.content.animationDuration ? `${block.content.animationDuration}s` : 'Normal'}</span>
                  </div>
                  <input 
                    type="range" min="0.2" max="2" step="0.1" 
                    value={block.content.animationDuration || 0.6}
                    onChange={(e) => handleUpdate('animationDuration', parseFloat(e.target.value))}
                    className="w-full accent-teal-400" 
                  />
                  
                  <div className="flex justify-between items-center text-xs text-gray-400 font-medium">
                    <span>Delay</span>
                    <span>{block.content.animationDelay || 0}s</span>
                  </div>
                  <input 
                    type="range" min="0" max="2" step="0.1" 
                    value={block.content.animationDelay || 0}
                    onChange={(e) => handleUpdate('animationDelay', parseFloat(e.target.value))}
                    className="w-full accent-teal-400" 
                  />
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-4">
               <div>
                <label className="text-xs text-gray-500 mb-1 block">Block ID (for linking)</label>
                <input 
                  type="text" 
                  value={block.id} 
                  readOnly
                  className="w-full bg-[#1A1A24]/50 border border-white/10 rounded-lg p-3 text-sm text-gray-500 outline-none cursor-not-allowed"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Element Type</label>
                <input 
                  type="text" 
                  value={block.type.toUpperCase()} 
                  readOnly
                  className="w-full bg-[#1A1A24]/50 border border-white/10 rounded-lg p-3 text-sm text-gray-500 outline-none cursor-not-allowed"
                />
              </div>
            </div>
          )}

          {/* Add basic content editing for other blocks to keep MVP functional */}
          {activeTab === 'content' && block.type === 'skills' && (
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Skills (comma separated)</label>
              <textarea 
                value={(block.content.items || []).join(', ')} 
                onChange={(e) => handleUpdate('items', e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean))}
                className="w-full bg-[#1A1A24] border border-white/10 rounded-lg p-3 text-sm text-white focus:border-teal-400 outline-none resize-none min-h-[120px]"
              />
            </div>
          )}

          {activeTab === 'content' && block.type === 'about' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Heading</label>
                <input value={block.content.heading || 'About Me'} onChange={(e) => handleUpdate('heading', e.target.value)} className="w-full bg-[#1A1A24] border border-white/10 rounded-lg p-3 text-sm text-white focus:border-teal-400 outline-none" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Description</label>
                <textarea value={block.content.description || ''} onChange={(e) => handleUpdate('description', e.target.value)} className="w-full bg-[#1A1A24] border border-white/10 rounded-lg p-3 text-sm text-white focus:border-teal-400 outline-none resize-none min-h-[100px]" />
              </div>
              {templateName === 'finox' && (
                <>
                  <div className="h-px bg-white/10 w-full my-4" />
                  <label className="text-xs text-teal-400 font-bold uppercase tracking-wider block mb-2">Finox About Fields</label>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Stat Value (e.g. 120%)</label>
                    <input value={block.content.statValue || '120%'} onChange={(e) => handleUpdate('statValue', e.target.value)} className="w-full bg-[#1A1A24] border border-white/10 rounded-lg p-3 text-sm text-white focus:border-teal-400 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Stat Caption</label>
                    <input value={block.content.statCaption || 'Average increase...'} onChange={(e) => handleUpdate('statCaption', e.target.value)} className="w-full bg-[#1A1A24] border border-white/10 rounded-lg p-3 text-sm text-white focus:border-teal-400 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Stat Image URL</label>
                    <input value={block.content.statImage || ''} onChange={(e) => handleUpdate('statImage', e.target.value)} className="w-full bg-[#1A1A24] border border-white/10 rounded-lg p-3 text-sm text-white focus:border-teal-400 outline-none" placeholder="https://" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Small Avatar URL</label>
                    <input value={block.content.smallAvatar || ''} onChange={(e) => handleUpdate('smallAvatar', e.target.value)} className="w-full bg-[#1A1A24] border border-white/10 rounded-lg p-3 text-sm text-white focus:border-teal-400 outline-none" placeholder="https://" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Bullets (One per line)</label>
                    <textarea 
                      value={(block.content.bullets || ["With 4+ years of experience, I specialize in creating intuitive, user-focused designs that solve real-world problems and deliver seamless digital experiences.", "I thrive on working closely with clients, blending creativity with strategy to bring their vision to life through thoughtful, impactful design solutions."]).join('\n')} 
                      onChange={(e) => handleUpdate('bullets', e.target.value.split('\n').filter(Boolean))} 
                      className="w-full bg-[#1A1A24] border border-white/10 rounded-lg p-3 text-sm text-white focus:border-teal-400 outline-none resize-none min-h-[100px]" 
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'content' && block.type === 'gallery' && (
             <div className="space-y-4">
               <label className="text-xs text-gray-500 mb-1 block">Gallery Images</label>
               {(block.content.images || [
                  { src: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=2070&auto=format&fit=crop", alt: "Project 1" },
                  { src: "https://images.unsplash.com/photo-1561070791-2526d30994b5?q=80&w=2000&auto=format&fit=crop", alt: "Project 2" },
                  { src: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2015&auto=format&fit=crop", alt: "Project 3" }
               ]).map((img: any, i: number) => (
                 <div key={i} className="space-y-2 p-3 border border-white/10 rounded bg-white/5">
                   <div className="flex justify-between">
                     <span className="text-xs text-gray-400">Image {i + 1}</span>
                     <button onClick={() => {
                       const newImages = [...(block.content.images || [])];
                       newImages.splice(i, 1);
                       handleUpdate('images', newImages);
                     }} className="text-red-400 hover:text-red-300 text-xs">Remove</button>
                   </div>
                   <input value={img.src} onChange={(e) => {
                     const newImages = [...(block.content.images || [])];
                     newImages[i] = { ...newImages[i], src: e.target.value };
                     handleUpdate('images', newImages);
                   }} placeholder="Image URL" className="w-full bg-black/20 border border-white/5 rounded p-2 text-xs text-white focus:border-teal-400 outline-none" />
                   <input value={img.alt} onChange={(e) => {
                     const newImages = [...(block.content.images || [])];
                     newImages[i] = { ...newImages[i], alt: e.target.value };
                     handleUpdate('images', newImages);
                   }} placeholder="Alt Text" className="w-full bg-black/20 border border-white/5 rounded p-2 text-xs text-white focus:border-teal-400 outline-none" />
                 </div>
               ))}
               <button onClick={() => {
                 const newImages = [...(block.content.images || [])];
                 newImages.push({ src: "", alt: "New Project" });
                 handleUpdate('images', newImages);
               }} className="w-full py-2 bg-white/5 hover:bg-white/10 text-xs text-white font-semibold rounded-lg border border-white/10 transition-colors">
                 + Add Image
               </button>
             </div>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-white/10 bg-[#23232F] flex items-center justify-between gap-2 relative">
          <div className="flex items-center gap-1">
            <button onClick={() => duplicateBlock(block.id)} className="p-2 text-gray-500 hover:text-white rounded hover:bg-white/10 transition-colors" title="Duplicate"><CopyPlus className="w-5 h-5" /></button>
            <button onClick={() => { removeBlock(block.id); closeSidebar(); }} className="p-2 text-gray-500 hover:text-red-400 rounded hover:bg-white/10 transition-colors" title="Delete"><Trash2 className="w-5 h-5" /></button>
            
            {/* More Options Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setShowMoreMenu(!showMoreMenu)} 
                className={`p-2 rounded transition-colors ${showMoreMenu ? 'text-white bg-white/10' : 'text-gray-500 hover:text-white hover:bg-white/10'}`} 
                title="More Actions"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
              
              {showMoreMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMoreMenu(false)} />
                  <div className="absolute bottom-full left-0 mb-2 w-48 bg-[#2B2B36] border border-white/10 rounded-lg shadow-2xl overflow-hidden z-50 text-sm font-medium">
                    <button 
                      onClick={() => { setClipboard(block); removeBlock(block.id); setShowMoreMenu(false); closeSidebar(); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-white/5 transition-colors text-left"
                    >
                      <Scissors className="w-4 h-4 opacity-50" /> Cut
                    </button>
                    <button 
                      onClick={() => { setClipboard(block); setShowMoreMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-white/5 transition-colors text-left"
                    >
                      <Copy className="w-4 h-4 opacity-50" /> Copy
                    </button>
                    <button 
                      disabled={!clipboard}
                      onClick={() => { 
                        if (clipboard) {
                           addBlock(clipboard.type); 
                           // Slight hack for MVP: addBlock creates an empty block. We would want a specific paste method in the store for exact replication.
                           // For now, it will add a default block of the same type below it.
                           setShowMoreMenu(false);
                        }
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${clipboard ? 'text-gray-300 hover:bg-white/5' : 'text-gray-600 cursor-not-allowed'}`}
                    >
                      <ClipboardPaste className="w-4 h-4 opacity-50" /> Paste after
                    </button>
                    <div className="h-px bg-white/10 w-full" />
                    <button 
                      onClick={() => {
                        const el = document.getElementById(block.id);
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        setShowMoreMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-white/5 transition-colors text-left"
                    >
                      <ChevronsDown className="w-4 h-4 opacity-50" /> Scroll into view
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
          
          <button onClick={closeSidebar} className="px-6 py-2.5 bg-teal-500 hover:bg-teal-400 text-teal-950 font-bold rounded-lg transition-colors shadow-lg shadow-teal-500/20">
            Done
          </button>
        </div>
      </div>
    );
  };

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  return (
    <div className="flex h-screen bg-[#2B2B36] font-sans overflow-hidden fixed inset-0 z-[100]" onClick={closeSidebar}>
      
      {/* Sliding Sidebar */}
      <aside 
        onClick={(e) => e.stopPropagation()}
        className={`absolute top-0 left-0 h-full w-[340px] bg-[#23232F] border-r border-black/20 shadow-2xl transition-transform duration-300 z-50 flex flex-col ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-14 flex items-center justify-between px-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2 text-white font-serif italic font-medium">
            <span className="w-6 h-6 bg-white text-black rounded flex items-center justify-center not-italic font-sans font-bold text-xs">N</span>
            Tapzar
          </div>
          <button onClick={closeSidebar} className="text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 overflow-hidden">
          {renderSidebarContent()}
        </div>
      </aside>

      {/* Main Canvas Area */}
      <main className="flex-1 relative overflow-y-auto overflow-x-hidden">
        {/* Floating Toolbar (Carrd Style) */}
        <div 
          onClick={(e) => e.stopPropagation()}
          className="fixed top-6 right-6 z-40 bg-[#1A1A24]/90 backdrop-blur-md border border-white/10 p-1.5 rounded-xl shadow-2xl flex items-center gap-1"
        >
          <button onClick={() => { setSidebarMode('add'); setIsSidebarOpen(true); }} className="p-2.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="Add Element"><Plus className="w-5 h-5" /></button>
          <div className="w-px h-6 bg-white/10 mx-1" />
          <button onClick={undo} disabled={!canUndo} className={`p-2.5 rounded-lg transition-colors ${canUndo ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-gray-600 cursor-not-allowed'}`} title="Undo"><Undo className="w-4 h-4" /></button>
          <button onClick={redo} disabled={!canRedo} className={`p-2.5 rounded-lg transition-colors ${canRedo ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-gray-600 cursor-not-allowed'}`} title="Redo"><Redo className="w-4 h-4" /></button>
          <div className="w-px h-6 bg-white/10 mx-1" />
          <button onClick={() => window.open(`/preview/${templateName}`, '_blank')} className="p-2.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="Preview"><Play className="w-4 h-4" /></button>
          <button onClick={() => setIsMobileView(!isMobileView)} className={`p-2.5 rounded-lg transition-colors ${isMobileView ? 'text-teal-400 bg-teal-400/10' : 'text-gray-400 hover:text-white hover:bg-white/10'}`} title="Mobile View"><Smartphone className="w-4 h-4" /></button>
          <button onClick={handleSave} className="p-2.5 text-gray-400 hover:text-teal-400 hover:bg-teal-400/10 rounded-lg transition-colors" title="Save">
            {saving ? <Check className="w-4 h-4 text-teal-400" /> : <Save className="w-4 h-4" />}
          </button>
          <div className="w-px h-6 bg-white/10 mx-1" />
          <button onClick={() => router.push('/dashboard/templates')} className="p-2.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="Change Theme"><LayoutTemplate className="w-4 h-4" /></button>
        </div>

        {/* Canvas Page Wrapper */}
        <div className="min-h-[120%] py-24 px-8 flex justify-center transition-all duration-500">
          <div className={`w-full bg-black shadow-2xl shadow-black/50 overflow-hidden ring-1 ring-white/10 rounded-sm transition-all duration-500 ${isMobileView ? 'max-w-[390px] rounded-[40px] ring-4 ring-gray-800' : 'max-w-[1200px]'}`}>
            {blocks.length === 0 ? (
              <div className="h-[800px] flex flex-col items-center justify-center text-gray-500">
                <LayoutTemplate className="w-12 h-12 mb-4 opacity-20" />
                <p>Click the + icon in the top right to add elements</p>
              </div>
            ) : (
              <DndContext 
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext 
                  items={blocks.map(b => b.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {blocks.map(block => renderEditableBlock(block))}
                </SortableContext>
              </DndContext>
            )}
          </div>
        </div>
      </main>

    </div>
  );
}
