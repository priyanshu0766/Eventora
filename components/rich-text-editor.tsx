"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Toggle } from "@/components/ui/toggle";
import { Bold, Italic, List, ListOrdered, Heading2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
}

export function RichTextEditor({ value, onChange }: RichTextEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [2],
                },
            }),
        ],
        content: value,
        immediatelyRender: false,
        editorProps: {
            attributes: {
                class: "min-h-[150px] w-full rounded-md border border-border/40 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-h2:my-2 prose-h2:text-xl",
            },
        },
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
    });

    if (!editor) {
        return null;
    }

    return (
        <div className="flex flex-col gap-2 relative">
            <div className="flex flex-wrap items-center gap-1 p-1 absolute top-2 right-2 z-10 bg-background/80 backdrop-blur-sm border border-border/40 rounded-md shadow-sm">
                <Toggle
                    size="sm"
                    pressed={editor.isActive('heading', { level: 2 })}
                    onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    className="h-8 w-8 p-0 data-[state=on]:bg-muted"
                >
                    <Heading2 className="h-4 w-4" />
                </Toggle>

                <Toggle
                    size="sm"
                    pressed={editor.isActive('bold')}
                    onPressedChange={() => editor.chain().focus().toggleBold().run()}
                    className="h-8 w-8 p-0 data-[state=on]:bg-muted"
                >
                    <Bold className="h-4 w-4" />
                </Toggle>

                <Toggle
                    size="sm"
                    pressed={editor.isActive('italic')}
                    onPressedChange={() => editor.chain().focus().toggleItalic().run()}
                    className="h-8 w-8 p-0 data-[state=on]:bg-muted"
                >
                    <Italic className="h-4 w-4" />
                </Toggle>

                <div className="w-[1px] h-4 bg-border/50 mx-1" />

                <Toggle
                    size="sm"
                    pressed={editor.isActive('bulletList')}
                    onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
                    className="h-8 w-8 p-0 data-[state=on]:bg-muted"
                >
                    <List className="h-4 w-4" />
                </Toggle>

                <Toggle
                    size="sm"
                    pressed={editor.isActive('orderedList')}
                    onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
                    className="h-8 w-8 p-0 data-[state=on]:bg-muted"
                >
                    <ListOrdered className="h-4 w-4" />
                </Toggle>
            </div>
            <EditorContent editor={editor} />
        </div>
    );
}
