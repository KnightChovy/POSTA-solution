import React, { useCallback } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { Bold, Italic, LinkIcon, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TiptapEditorProps {
  value: string;
  onChange: (value: string) => void;
  onImageUpload?: (file: File) => Promise<string>;
}

export default function TiptapEditor({
  value,
  onChange,
  onImageUpload,
}: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit, Image, Link],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  const addImage = useCallback(async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0] as File;
      if (file && onImageUpload) {
        const url = await onImageUpload(file);
        editor?.chain().focus().setImage({ src: url }).run();
      }
    };
    input.click();
  }, [editor, onImageUpload]);

  if (!editor) return null;

  return (
    <div className="border rounded-lg p-2">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 border-b pb-2 mb-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive("bold") ? "bg-gray-200" : ""}
        >
          <Bold className="w-4 h-4" />
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive("italic") ? "bg-gray-200" : ""}
        >
          <Italic className="w-4 h-4" />
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            const url = prompt("Nhập URL liên kết:");
            if (url) editor.chain().focus().setLink({ href: url }).run();
          }}
        >
          <LinkIcon className="w-4 h-4" />
        </Button>

        <Button type="button" variant="outline" size="sm" onClick={addImage}>
          <ImageIcon className="w-4 h-4" />
        </Button>
      </div>

      {/* Editor content */}
      <EditorContent
        editor={editor}
        className="min-h-[300px] p-2 prose max-w-none"
      />
    </div>
  );
}
