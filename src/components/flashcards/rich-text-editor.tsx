"use client";

import { forwardRef, useEffect, useImperativeHandle } from "react";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import { TextStyle } from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
import {
  Baseline,
  Bold,
  Code,
  Highlighter,
  Italic,
  List,
  ListOrdered,
  RemoveFormatting,
  Strikethrough,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  Underline as UnderlineIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// Mid-tone swatches, chosen to stay legible on both this app's light and
// dark surface tokens without needing a per-theme palette -- the same
// tradeoff most rich-text toolbars make (a fixed palette, not a full color
// wheel). Highlights use a translucent fill (not flat/opaque) for the same
// reason: an opaque pastel reads fine in light mode but looks like a harsh
// patch in dark mode, while a tinted overlay works reasonably in both.
const TEXT_COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#14b8a6", "#3b82f6", "#8b5cf6", "#ec4899"];
const HIGHLIGHT_COLORS = [
  "rgba(239,68,68,0.35)",
  "rgba(249,115,22,0.35)",
  "rgba(234,179,8,0.35)",
  "rgba(34,197,94,0.35)",
  "rgba(20,184,166,0.35)",
  "rgba(59,130,246,0.35)",
  "rgba(139,92,246,0.35)",
  "rgba(236,72,153,0.35)",
];

/** A real toggle button (bold, italic, a list, ...): pressing it flips a
 * mark/node on or off, and `active` reflects whether the cursor is
 * currently inside one, so the toolbar itself shows what's applied at the
 * cursor -- not just recolored on click, but kept in sync with selection
 * changes too (see useEditorState below). The active style is a solid
 * brand-colored fill, deliberately not a subtle tint, since it needs to
 * read clearly against the toolbar's own muted background. */
const ToolbarButton = forwardRef<
  HTMLButtonElement,
  {
    active?: boolean;
    disabled?: boolean;
    label: string;
    onClick?: () => void;
    children: React.ReactNode;
  }
>(function ToolbarButton({ active, disabled, label, onClick, children }, ref) {
  return (
    <Button
      ref={ref}
      type="button"
      variant="ghost"
      size="icon-sm"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={cn(
        "size-7 rounded-md",
        active && "bg-brand-turquoise text-brand-turquoise-foreground hover:bg-brand-turquoise hover:text-brand-turquoise-foreground",
      )}
    >
      {children}
    </Button>
  );
});

function ColorSwatchGrid({
  colors,
  onPick,
  onClear,
  clearLabel,
}: {
  colors: string[];
  onPick: (color: string) => void;
  onClear: () => void;
  clearLabel: string;
}) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-4 gap-1.5">
        {colors.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onPick(color)}
            className="size-7 rounded-md border border-border transition-transform hover:scale-110"
            style={{ backgroundColor: color }}
            aria-label={color}
          />
        ))}
      </div>
      <Button type="button" variant="outline" size="sm" onClick={onClear} className="w-full">
        {clearLabel}
      </Button>
    </div>
  );
}

/**
 * Rich-text prompt/answer editing, matching the formatting Anki's own card
 * editor offers (bold/italic/underline/strikethrough, super/subscript,
 * inline code, bulleted/numbered lists, text/highlight color, clear
 * formatting) plus inline code specifically because that was asked for on
 * top of Anki parity. Deliberately no block-level structure (headings,
 * blockquotes, horizontal rules, code blocks) -- flashcard sides are short,
 * inline-styled text, not documents.
 *
 * Stores and emits HTML (`value`/`onChange`), the same thing Anki's own
 * note fields are under the hood -- see rich-text-content.tsx for how this
 * gets rendered safely everywhere a card is displayed.
 */
export type RichTextEditorHandle = {
  focus: () => void;
};

export const RichTextEditor = forwardRef<
  RichTextEditorHandle,
  {
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
    id?: string;
    minHeightClassName?: string;
    disabled?: boolean;
    /** Focuses the editor once, on mount -- Tiptap's own equivalent of a
     * native input's `autoFocus`, since a contentEditable doesn't support
     * that HTML attribute directly. */
    autoFocus?: boolean;
  }
>(function RichTextEditor(
  { value, onChange, placeholder, id, minHeightClassName = "min-h-20", disabled, autoFocus },
  ref,
) {
  const t = useTranslations("flashcards.richText");

  const editor = useEditor({
    // Next.js renders this on the server first; Tiptap's own docs recommend
    // this flag for SSR frameworks to avoid a hydration mismatch.
    immediatelyRender: false,
    autofocus: autoFocus ? "end" : false,
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        horizontalRule: false,
        codeBlock: false,
      }),
      Underline,
      Superscript,
      Subscript,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Placeholder.configure({ placeholder: placeholder ?? "" }),
    ],
    content: value,
    editable: !disabled,
    onUpdate: ({ editor: current }) => onChange(current.getHTML()),
    editorProps: {
      attributes: {
        id: id ?? "",
        // resize-y + overflow-y-auto (CSS resize needs overflow != visible
        // to show its drag handle at all) go on this element specifically,
        // not on EditorContent's own className below -- that prop lands on
        // Tiptap's outer wrapper div, a plain shrink-to-fit box with no
        // height of its own, so resize/min-height there wouldn't actually
        // constrain or grow the visible, scrollable editing surface.
        class: cn(
          "prose-sm max-w-none resize-y overflow-y-auto outline-none",
          "[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5",
          "[&_code]:rounded [&_code]:bg-surface-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.85em]",
          "[&_p]:my-0",
          "px-2.5 py-2 text-sm",
          minHeightClassName,
        ),
      },
    },
  });

  // Keeps the editor in sync when `value` changes from outside (e.g. the
  // form resetting after save, or switching which flashcard is being
  // edited) without fighting the user's own typing -- only pushed when the
  // incoming value actually differs from what the editor already holds.
  useEffect(() => {
    if (!editor) return;
    if (value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [value, editor]);

  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [disabled, editor]);

  useImperativeHandle(ref, () => ({
    focus: () => editor?.commands.focus("end"),
  }), [editor]);

  const activeState = useEditorState({
    editor,
    selector: (ctx) =>
      ctx.editor
        ? {
            bold: ctx.editor.isActive("bold"),
            italic: ctx.editor.isActive("italic"),
            underline: ctx.editor.isActive("underline"),
            strike: ctx.editor.isActive("strike"),
            code: ctx.editor.isActive("code"),
            superscript: ctx.editor.isActive("superscript"),
            subscript: ctx.editor.isActive("subscript"),
            bulletList: ctx.editor.isActive("bulletList"),
            orderedList: ctx.editor.isActive("orderedList"),
            // Any color/highlight, not one specific swatch -- these back the
            // popover trigger buttons themselves, which just need to show
            // "something is applied here", not which exact color it is.
            color: Boolean(ctx.editor.getAttributes("textStyle").color),
            highlight: ctx.editor.isActive("highlight"),
          }
        : null,
  });

  if (!editor || !activeState) {
    // Same visual footprint as the real editor so the form doesn't jump
    // once Tiptap mounts client-side.
    return <div className={cn("w-full rounded-lg border border-input bg-transparent", minHeightClassName)} />;
  }

  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-lg border border-input bg-transparent transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30",
        disabled && "pointer-events-none opacity-50",
      )}
    >
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border/70 bg-surface-muted/40 p-1">
        <ToolbarButton
          label={t("bold")}
          active={activeState.bold}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold />
        </ToolbarButton>
        <ToolbarButton
          label={t("italic")}
          active={activeState.italic}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic />
        </ToolbarButton>
        <ToolbarButton
          label={t("underline")}
          active={activeState.underline}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon />
        </ToolbarButton>
        <ToolbarButton
          label={t("strikethrough")}
          active={activeState.strike}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough />
        </ToolbarButton>
        <ToolbarButton
          label={t("code")}
          active={activeState.code}
          onClick={() => editor.chain().focus().toggleCode().run()}
        >
          <Code />
        </ToolbarButton>

        <span className="mx-0.5 h-5 w-px shrink-0 bg-border" aria-hidden="true" />

        <ToolbarButton
          label={t("superscript")}
          active={activeState.superscript}
          onClick={() => editor.chain().focus().toggleSuperscript().run()}
        >
          <SuperscriptIcon />
        </ToolbarButton>
        <ToolbarButton
          label={t("subscript")}
          active={activeState.subscript}
          onClick={() => editor.chain().focus().toggleSubscript().run()}
        >
          <SubscriptIcon />
        </ToolbarButton>

        <span className="mx-0.5 h-5 w-px shrink-0 bg-border" aria-hidden="true" />

        <ToolbarButton
          label={t("bulletList")}
          active={activeState.bulletList}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List />
        </ToolbarButton>
        <ToolbarButton
          label={t("orderedList")}
          active={activeState.orderedList}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered />
        </ToolbarButton>

        <span className="mx-0.5 h-5 w-px shrink-0 bg-border" aria-hidden="true" />

        <Popover>
          <PopoverTrigger asChild>
            <ToolbarButton label={t("textColor")} active={activeState.color}>
              <Baseline />
            </ToolbarButton>
          </PopoverTrigger>
          <PopoverContent className="w-auto">
            <ColorSwatchGrid
              colors={TEXT_COLORS}
              onPick={(color) => editor.chain().focus().setColor(color).run()}
              onClear={() => editor.chain().focus().unsetColor().run()}
              clearLabel={t("clearColor")}
            />
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <ToolbarButton label={t("highlight")} active={activeState.highlight}>
              <Highlighter />
            </ToolbarButton>
          </PopoverTrigger>
          <PopoverContent className="w-auto">
            <ColorSwatchGrid
              colors={HIGHLIGHT_COLORS}
              onPick={(color) => editor.chain().focus().toggleHighlight({ color }).run()}
              onClear={() => editor.chain().focus().unsetHighlight().run()}
              clearLabel={t("clearHighlight")}
            />
          </PopoverContent>
        </Popover>

        <span className="mx-0.5 h-5 w-px shrink-0 bg-border" aria-hidden="true" />

        <ToolbarButton
          label={t("clearFormatting")}
          onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
        >
          <RemoveFormatting />
        </ToolbarButton>
      </div>

      {/* Sizing/resize classes live on editorProps.attributes.class above,
          not here -- see its comment for why. This wrapper just needs to
          not add its own visual box (border/background already live on the
          outer container). */}
      <EditorContent editor={editor} />
    </div>
  );
});
