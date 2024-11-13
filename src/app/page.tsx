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
import { Check } from "lucide-react";
import { addNote, getAllNotes, updateTitle } from "@/lib/firebase";
import Graph from "@/components/graph";

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
  const [notes, setNotes] = useState<any[]>([]);
  const [activeNote, setActiveNote] = useState<any>(null);
  const [updatingTitle, setUpdatingTitle] = useState(false)

  const handleUpdateContent = (noteId: string, newContent: string) => {
    const updatedNotes = notes.map(note =>
      note.id === noteId
        ? { ...note, content: newContent }
        : note
    );

    setNotes(updatedNotes);
  };

  const insertGraph = async (text: string) => {
    
  }

  const queryGraph = async (text: string) => {
    
  }

  // const noteParser = () => {
  //   let formatted
    
  // }

  const addNewNote = () => {
    const newNote: Note = { content: {}, title: "Untitled", created_at: new Date().toString(), id: uuid(), updated_at: new Date().toString()};
    const updatedNotes = [newNote, ...notes];
    setNotes(updatedNotes);
    setActiveNote(newNote);
    addNote(newNote);
  }

  useEffect(() => {
      initNotes();
  }, []);

  const initNotes = async () => {
    const notedata = await getAllNotes()
    console.log(notedata);
    
    if (notedata.length < 2) {
      console.log("no notes found");
      
      addNewNote()
      } else {
      setNotes(notedata)
      setActiveNote(notedata[0])
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar notes={notes} setActiveNote={setActiveNote} activeNote={activeNote} addNewNote={addNewNote} />

      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          {!updatingTitle ? <p onClick={() => setUpdatingTitle(true)}>{activeNote?.title}</p> : <div className="flex w-full max-w-sm items-center space-x-2">
            <Input onChange={(e) => {
              const updatedNotes = notes
              updatedNotes.forEach((note) => {
                if (note.id === activeNote?.id) {
                  note.title = e.target.value
                }
              })
              setNotes(updatedNotes)
              setActiveNote({ ...activeNote, title: e.target.value })
            }} value={activeNote?.title} type="text" placeholder="Update your title" />
            <Button onClick={() => {setUpdatingTitle(false); updateTitle(activeNote?.id, activeNote?.title)}}><Check /></Button>
          </div>}
        </header>
        <div className="flex w-full h-full align-middle justify-between">
          <div className="flex p-4 mr-15">
            {activeNote && <Editor key={activeNote?.id} activeNote={activeNote} onUpdateContent={handleUpdateContent} />}
          </div>
          <div>
          <Graph/>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
