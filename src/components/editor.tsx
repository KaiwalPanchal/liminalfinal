'use client';

import { useEffect, useState } from "react";

/* Lexical Design System */
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";
import { ListItemNode, ListNode } from "@lexical/list";
import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { TRANSFORMERS } from "@lexical/markdown";

/* Lexical Plugins Local */
import TreeViewPlugin from "@/plugins/TreeViewPlugin";
import ToolbarPlugin from "@/plugins/ToolbarPlugin";
import AutoLinkPlugin from "@/plugins/AutoLinkPlugin";
import CodeHighlightPlugin from "@/plugins/CodeHighlightPlugin";

/* Lexical Plugins Remote */
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { TabIndentationPlugin } from "@lexical/react/LexicalTabIndentationPlugin";

/* Lexical Others */
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";
import ExampleTheme from "@/themes/theme";

/* Lexical Texts */
import { textDailyStandup } from "./text-daily-standup";
import { $createParagraphNode, $createTextNode, $getRoot, $getSelection, EditorState, LexicalEditor } from "lexical";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

function Placeholder() {
    return <div className="editor-placeholder">Enter some rich text...</div>;
}

function ContentUpdatePlugin({ content }: { content: string }) {
    const [editor] = useLexicalComposerContext();
  
    useEffect(() => {
      if (!content) return;
  
      editor.update(() => {
        const root = $getRoot();
        // Clear existing content
        root.clear();
        // Create new paragraph with content
        const paragraph = $createParagraphNode();
        const text = $createTextNode(content);
        paragraph.append(text);
        root.append(paragraph);
      });
    }, [content, editor]);
  
    return null;
  }

const editorConfig = {
    // The editor theme
    theme: ExampleTheme,
    namespace: "liminal-editor",
    // Handling of errors during update
    onError(error: unknown) {
        throw error;
    },
    // Any custom nodes go here
    nodes: [
        HeadingNode,
        ListNode,
        ListItemNode,
        QuoteNode,
        CodeNode,
        CodeHighlightNode,
        TableNode,
        TableCellNode,
        TableRowNode,
        AutoLinkNode,
        LinkNode
    ],
};

export function Editor({...props}: any): JSX.Element | null | any {

    const [isMounted, setIsMounted] = useState(false)

  
    useEffect(() => {
        setIsMounted(true);
    }, [])

    if (!isMounted) return null
    console.log(props.activeNote.content);

    const updatedConfig = {
        ...editorConfig,
        editorState: (editor: LexicalEditor) => {
          editor.update(() => {
            const root = $getRoot();
            const paragraph = $createParagraphNode();
            const text = $createTextNode(props.activeNote.content);
            paragraph.append(text);
            root.append(paragraph);
          });
        }
      };
    
      console.log(props);
      
    return (
        <LexicalComposer initialConfig={updatedConfig}>
            <div className="editor-container">
                <ToolbarPlugin />
                <div className="editor-inner">
                    <RichTextPlugin
                        contentEditable={<ContentEditable className="editor-input" />}
                        ErrorBoundary={LexicalErrorBoundary}
                    />
                    <ListPlugin />
                    <HistoryPlugin />
                    <AutoFocusPlugin />
                    <CodeHighlightPlugin />
                    <LinkPlugin />
                    <TabIndentationPlugin />
                    <AutoLinkPlugin />
                    <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
                    <ContentUpdatePlugin content={props.activeNote?.content || ''} />
                    {/* <TreeViewPlugin /> */}
                </div>
            </div>
        </LexicalComposer>
    );
}
