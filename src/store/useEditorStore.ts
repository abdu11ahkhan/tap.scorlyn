import { create } from 'zustand';

/** 'about' and 'gallery' are rendered by the editor, so they belong here —
 *  without them those branches were comparisons against an impossible type. */
export type BlockType = 'hero' | 'about' | 'skills' | 'projects' | 'gallery' | 'contact';

export type BlockData = {
  id: string;
  type: BlockType;
  content: any;
};

interface EditorState {
  websiteId: string | null;
  templateName: string;
  blocks: BlockData[];
  selectedBlockId: string | null;

  /** Undo stack. Every mutation pushes the resulting block list. */
  history: BlockData[][];
  historyIndex: number;

  initializeEditor: (websiteId: string, templateName: string, initialBlocks: BlockData[]) => void;
  addBlock: (type: BlockType) => void;
  removeBlock: (id: string) => void;
  selectBlock: (id: string | null) => void;
  updateBlockContent: (id: string, newContent: any) => void;
  duplicateBlock: (id: string) => void;
  reorderBlocks: (newBlocks: BlockData[]) => void;
  undo: () => void;
  redo: () => void;
}

const getDefaultContent = (type: string) => {
  switch (type) {
    case 'hero': return { title: "New Hero Title", subtitle: "Your Role", description: "A brief description here." };
    case 'skills': return { items: ["Skill 1", "Skill 2", "Skill 3"] };
    case 'projects': return { items: [{ title: "New Project", description: "Project description." }] };
    case 'about': return { heading: "About me", body: "A short paragraph about your work." };
    case 'gallery': return { items: [] as { url: string; caption?: string }[] };
    case 'contact': return { email: "hello@example.com", message: "Let's work together!" };
    default: return {};
  }
};

export const useEditorStore = create<EditorState>((set) => ({
  websiteId: null,
  templateName: 'developer',
  blocks: [],
  selectedBlockId: null,
  history: [],
  historyIndex: -1,

  initializeEditor: (websiteId, templateName, initialBlocks) => 
    set({ 
      websiteId, 
      templateName, 
      blocks: initialBlocks, 
      selectedBlockId: null,
      history: [initialBlocks],
      historyIndex: 0
    }),

  addBlock: (type) => set((state) => {
    const newBlock: BlockData = {
      id: `${type}-${Date.now()}`,
      type,
      content: getDefaultContent(type),
    };
    const newBlocks = [...state.blocks, newBlock];
    const newHistory = [...state.history.slice(0, state.historyIndex + 1), newBlocks];
    return { 
      blocks: newBlocks,
      history: newHistory,
      historyIndex: newHistory.length - 1
    };
  }),

  removeBlock: (id) => set((state) => {
    const newBlocks = state.blocks.filter(b => b.id !== id);
    const newHistory = [...state.history.slice(0, state.historyIndex + 1), newBlocks];
    return { 
      blocks: newBlocks,
      selectedBlockId: state.selectedBlockId === id ? null : state.selectedBlockId,
      history: newHistory,
      historyIndex: newHistory.length - 1
    };
  }),

  selectBlock: (id) => set({ selectedBlockId: id }),

  updateBlockContent: (id, newContent) => set((state) => {
    const newBlocks = state.blocks.map((b) => 
      b.id === id ? { ...b, content: { ...b.content, ...newContent } } : b
    );
    const newHistory = [...state.history.slice(0, state.historyIndex + 1), newBlocks];
    return {
      blocks: newBlocks,
      history: newHistory,
      historyIndex: newHistory.length - 1
    };
  }),

  duplicateBlock: (id) => set((state) => {
    const blockToDuplicate = state.blocks.find((b) => b.id === id);
    if (!blockToDuplicate) return state;
    
    const newBlock = {
      ...blockToDuplicate,
      id: `${blockToDuplicate.type}-${Date.now()}`
    };
    
    const blockIndex = state.blocks.findIndex((b) => b.id === id);
    const newBlocks = [...state.blocks];
    newBlocks.splice(blockIndex + 1, 0, newBlock);
    
    const newHistory = [...state.history.slice(0, state.historyIndex + 1), newBlocks];
    return {
      blocks: newBlocks,
      history: newHistory,
      historyIndex: newHistory.length - 1,
      selectedBlockId: newBlock.id
    };
  }),

  reorderBlocks: (newBlocks) => set((state) => {
    const newHistory = [...state.history.slice(0, state.historyIndex + 1), newBlocks];
    return { 
      blocks: newBlocks,
      history: newHistory,
      historyIndex: newHistory.length - 1
    };
  }),

  undo: () => set((state) => {
    if (state.historyIndex > 0) {
      const newIndex = state.historyIndex - 1;
      return { blocks: state.history[newIndex], historyIndex: newIndex };
    }
    return state;
  }),

  redo: () => set((state) => {
    if (state.historyIndex < state.history.length - 1) {
      const newIndex = state.historyIndex + 1;
      return { blocks: state.history[newIndex], historyIndex: newIndex };
    }
    return state;
  })
}));
