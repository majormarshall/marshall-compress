'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Link as LinkIcon,
  Undo2,
  Redo2,
  CheckCircle2,
  Loader2,
  Pin,
  Sparkles,
} from 'lucide-react';
import type { Note } from '@marshall/shared';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export interface NoteEditorProps {
  note: Note | null;
  onChange: (updated: {
    title: string;
    contentHtml: string;
    contentJson?: Record<string, unknown>;
    contentText?: string;
  }) => void;
  saving?: boolean;
  className?: string;
}

export function NoteEditor({ note, onChange, saving = false, className }: NoteEditorProps) {
  const [title, setTitle] = useState(note?.title || '');
  const [contentHtml, setContentHtml] = useState(note?.contentHtml || '');
  const [tiptapLoaded, setTiptapLoaded] = useState(false);
  const editorRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync internal state when active note changes
  useEffect(() => {
    if (note) {
      setTitle(note.title || '');
      setContentHtml(note.contentHtml || '');
      if (editorRef.current && typeof editorRef.current.commands?.setContent === 'function') {
        editorRef.current.commands.setContent(note.contentHtml || '');
      }
    }
  }, [note?.id]);

  // Dynamic Tiptap loader with safe graceful fallback
  useEffect(() => {
    let mounted = true;
    async function loadTiptap() {
      try {
        const { Editor } = await import('@tiptap/core');
        const StarterKit = (await import('@tiptap/starter-kit')).default;

        let extensions: any[] = [StarterKit];

        try {
          const Underline = (await import('@tiptap/extension-underline')).default;
          extensions.push(Underline);
        } catch {
          // Underline extension optional
        }

        try {
          const Link = (await import('@tiptap/extension-link')).default;
          extensions.push(Link.configure({ openOnClick: false }));
        } catch {
          // Link extension optional
        }

        const editorElement = document.getElementById('tiptap-container');
        if (editorElement && mounted) {
          const editor = new Editor({
            element: editorElement,
            extensions,
            content: note?.contentHtml || '',
            editorProps: {
              attributes: {
                class:
                  'prose prose-invert max-w-none focus:outline-none min-h-[350px] text-slate-200 leading-relaxed text-sm',
              },
            },
            onUpdate: ({ editor: ed }) => {
              const html = ed.getHTML();
              const text = ed.getText();
              const json = ed.getJSON();
              setContentHtml(html);
              onChange({
                title,
                contentHtml: html,
                contentJson: json,
                contentText: text,
              });
            },
          });

          editorRef.current = editor;
          setTiptapLoaded(true);
        }
      } catch (err) {
        // Fallback to rich markdown textarea if tiptap is unavailable
        setTiptapLoaded(false);
      }
    }

    loadTiptap();

    return () => {
      mounted = false;
      if (editorRef.current) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
    };
  }, [note?.id]);

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    onChange({
      title: newTitle,
      contentHtml,
      contentText: contentHtml.replace(/<[^>]*>?/gm, ''),
    });
  };

  const handleFallbackContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContentHtml(val);
    onChange({
      title,
      contentHtml: val,
      contentText: val,
    });
  };

  // Toolbar action executor (supports both Tiptap & Textarea fallback)
  const execCommand = (action: string, param?: any) => {
    if (editorRef.current && tiptapLoaded) {
      const chain = editorRef.current.chain().focus();
      switch (action) {
        case 'bold':
          chain.toggleBold().run();
          break;
        case 'italic':
          chain.toggleItalic().run();
          break;
        case 'underline':
          if (chain.toggleUnderline) chain.toggleUnderline().run();
          break;
        case 'strike':
          chain.toggleStrike().run();
          break;
        case 'h1':
          chain.toggleHeading({ level: 1 }).run();
          break;
        case 'h2':
          chain.toggleHeading({ level: 2 }).run();
          break;
        case 'h3':
          chain.toggleHeading({ level: 3 }).run();
          break;
        case 'bulletList':
          chain.toggleBulletList().run();
          break;
        case 'orderedList':
          chain.toggleOrderedList().run();
          break;
        case 'blockquote':
          chain.toggleBlockquote().run();
          break;
        case 'code':
          chain.toggleCodeBlock ? chain.toggleCodeBlock().run() : chain.toggleCode().run();
          break;
        case 'undo':
          chain.undo().run();
          break;
        case 'redo':
          chain.redo().run();
          break;
        case 'link':
          const url = prompt('Enter URL:');
          if (url && chain.setLink) chain.setLink({ href: url }).run();
          break;
      }
    } else if (textareaRef.current) {
      // Fallback markdown insertion
      const el = textareaRef.current;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const selected = el.value.substring(start, end);

      let insert = selected;
      switch (action) {
        case 'bold':
          insert = `**${selected || 'bold text'}**`;
          break;
        case 'italic':
          insert = `*${selected || 'italic text'}*`;
          break;
        case 'strike':
          insert = `~~${selected || 'strikethrough'}~~`;
          break;
        case 'h1':
          insert = `\n# ${selected || 'Heading 1'}\n`;
          break;
        case 'h2':
          insert = `\n## ${selected || 'Heading 2'}\n`;
          break;
        case 'h3':
          insert = `\n### ${selected || 'Heading 3'}\n`;
          break;
        case 'bulletList':
          insert = `\n- ${selected || 'List item'}\n`;
          break;
        case 'orderedList':
          insert = `\n1. ${selected || 'List item'}\n`;
          break;
        case 'blockquote':
          insert = `\n> ${selected || 'Quote'}\n`;
          break;
        case 'code':
          insert = `\`\`\`\n${selected || 'code block'}\n\`\`\``;
          break;
      }

      const nextVal = el.value.substring(0, start) + insert + el.value.substring(end);
      setContentHtml(nextVal);
      onChange({ title, contentHtml: nextVal, contentText: nextVal });
    }
  };

  if (!note) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-12 text-center rounded-2xl border border-white/5 bg-slate-900/30 backdrop-blur-xl">
        <Sparkles className="w-10 h-10 text-slate-600 mb-3" />
        <h3 className="text-base font-semibold text-slate-300">No Note Selected</h3>
        <p className="text-xs text-slate-500 max-w-xs mt-1">
          Select a note from the left sidebar or create a new note to start writing.
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex flex-col h-full rounded-2xl border border-white/8 bg-slate-900/60 backdrop-blur-xl overflow-hidden shadow-2xl',
        className
      )}
    >
      {/* Top Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-2 px-4 py-2.5 border-b border-white/5 bg-slate-950/40">
        <div className="flex items-center gap-1 flex-wrap">
          <button
            type="button"
            onClick={() => execCommand('bold')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-white/5 transition-colors"
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => execCommand('italic')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-white/5 transition-colors"
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => execCommand('underline')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-white/5 transition-colors"
            title="Underline"
          >
            <UnderlineIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => execCommand('strike')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-white/5 transition-colors"
            title="Strikethrough"
          >
            <Strikethrough className="w-4 h-4" />
          </button>

          <span className="h-4 w-px bg-white/10 mx-1" />

          <button
            type="button"
            onClick={() => execCommand('h1')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-white/5 transition-colors"
            title="Heading 1"
          >
            <Heading1 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => execCommand('h2')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-white/5 transition-colors"
            title="Heading 2"
          >
            <Heading2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => execCommand('h3')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-white/5 transition-colors"
            title="Heading 3"
          >
            <Heading3 className="w-4 h-4" />
          </button>

          <span className="h-4 w-px bg-white/10 mx-1" />

          <button
            type="button"
            onClick={() => execCommand('bulletList')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-white/5 transition-colors"
            title="Bullet List"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => execCommand('orderedList')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-white/5 transition-colors"
            title="Numbered List"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => execCommand('blockquote')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-white/5 transition-colors"
            title="Quote"
          >
            <Quote className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => execCommand('code')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-white/5 transition-colors"
            title="Code Block"
          >
            <Code className="w-4 h-4" />
          </button>

          <span className="h-4 w-px bg-white/10 mx-1" />

          <button
            type="button"
            onClick={() => execCommand('undo')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-white/5 transition-colors"
            title="Undo"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => execCommand('redo')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-white/5 transition-colors"
            title="Redo"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        {/* Auto-save Status Indicator */}
        <div className="flex items-center gap-1.5 text-xs">
          {saving ? (
            <span className="inline-flex items-center gap-1 text-blue-400 font-medium">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> Synced to cloud
            </span>
          )}
        </div>
      </div>

      {/* Editor Content Area */}
      <div className="flex-1 flex flex-col p-6 overflow-y-auto">
        <input
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Note Title..."
          className="w-full bg-transparent text-2xl font-bold text-slate-100 placeholder:text-slate-600 focus:outline-none mb-4 pb-2 border-b border-white/5"
        />

        {/* Tiptap Container or Fallback Textarea */}
        <div id="tiptap-container" className={cn('flex-1', !tiptapLoaded && 'hidden')} />

        {!tiptapLoaded && (
          <textarea
            ref={textareaRef}
            value={contentHtml}
            onChange={handleFallbackContentChange}
            placeholder="Start typing your note here... (Markdown supported)"
            className="w-full flex-1 min-h-[400px] bg-transparent text-slate-200 placeholder:text-slate-600 resize-none focus:outline-none font-sans text-sm leading-relaxed"
          />
        )}
      </div>
    </div>
  );
}
