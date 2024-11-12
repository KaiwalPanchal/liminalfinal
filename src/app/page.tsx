/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Analytics } from "@vercel/analytics/react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { AppSidebar } from "@/components/ui/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"; // Import Collapsible from shadcn
import Editor from "@/components/editor";
import sampleNotes from "../sample-notes.json" 
import { uuid } from 'uuidv4';

interface Note {
  id?: string;
  title: string;
  content: object | string;
  created_at: string;
  updated_at?: string;
  tags?: string[];
  is_archived?: boolean;
}


export default function Component() {
  const noteData = sampleNotes.length ? sampleNotes.reverse() : [{ content: {}, title: "Untitled", created_at: new Date().toString() , id: uuid() }];
  const [notes, setNotes] = useState<Note[]>(noteData);
  const [activeNote, setActiveNote] = useState<Note>(noteData[0]);

  const handleUpdateContent = (noteId: string, newContent: string) => {
    const updatedNotes = notes.map(note => 
      note.id === noteId 
        ? { ...note, content: newContent }
        : note
    );
    
    setNotes(updatedNotes);
    
    // Save to local storage as backup
    localStorage.setItem('notes', JSON.stringify(updatedNotes));
  };

  const addNewNote = () => {
    const newNote : Note = { content: {}, title: "Untitled", created_at: new Date().toString() , id: uuid() }
    const updatedNotes = [newNote,...notes];

    setNotes(updatedNotes);
    setActiveNote(newNote);
  }

  return (
    <SidebarProvider>
      <AppSidebar notes={notes} setActiveNote={setActiveNote} activeNote={activeNote} addNewNote={addNewNote} />

      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          {activeNote?.title}
        </header>
        <div className="flex w-full h-full">
          <div className="flex-1 p-4">
            <Editor key={activeNote?.id} activeNote={activeNote} onUpdateContent={handleUpdateContent} />
          </div>

          {/* Right Div */}
          <div className="w-1/3 p-4 bg-zinc-900">

          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
