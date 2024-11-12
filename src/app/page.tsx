/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Analytics } from "@vercel/analytics/react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { AppSidebar } from "@/components/ui/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"; // Import Collapsible from shadcn
import { Editor } from "@/components/editor";

interface Note {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  tags: string[];
  is_archived: boolean;
}

export default function Component() {
  // const [notes, setNotes] = useState<any>([]);
  const [activeNote, setActiveNote] = useState<any>({
    id: "1",
    title: "Meeting Notes",
    content: "Discussed project timelines and tasks for the next sprint.",
    created_at: "2024-11-12T10:00:00Z",
    updated_at: "2024-11-12T12:00:00Z",
    tags: ["work", "project", "sprint"],
    is_archived: false,
  });
  const notedata: Note[] = [
    {
      id: "1",
      title: "Meeting Notes",
      content: "Discussed project timelines and tasks for the next sprint.",
      created_at: "2024-11-12T10:00:00Z",
      updated_at: "2024-11-12T12:00:00Z",
      tags: ["work", "project", "sprint"],
      is_archived: false,
    },
    {
      id: "2",
      title: "Shopping List",
      content: "Milk, Eggs, Bread, Butter, Apples",
      created_at: "2024-11-11T08:00:00Z",
      updated_at: "2024-11-11T09:00:00Z",
      tags: ["personal", "shopping"],
      is_archived: false,
    },
    {
      id: "3",
      title: "Grocery Store Ideas",
      content: "Find a new recipe to try for dinner.",
      created_at: "2024-11-10T15:00:00Z",
      updated_at: "2024-11-10T16:00:00Z",
      tags: ["personal", "ideas"],
      is_archived: true,
    },
    {
      id: "4",
      title: "Workout Plan",
      content: "Monday: Chest, Tuesday: Back, Wednesday: Legs, etc.",
      created_at: "2024-11-09T09:00:00Z",
      updated_at: "2024-11-09T10:00:00Z",
      tags: ["personal", "fitness"],
      is_archived: false,
    },
    {
      id: "5",
      title: "Travel Plans",
      content: "Flight to Paris booked for January, need to plan itinerary.",
      created_at: "2024-11-08T16:00:00Z",
      updated_at: "2024-11-08T17:00:00Z",
      tags: ["travel", "plans"],
      is_archived: false,
    },
    {
      id: "6",
      title: "Client Feedback",
      content:
        "The client is happy with the current UI design but wants changes to the dashboard layout.",
      created_at: "2024-11-07T14:00:00Z",
      updated_at: "2024-11-07T15:00:00Z",
      tags: ["work", "feedback"],
      is_archived: false,
    },
    {
      id: "7",
      title: "Book Recommendations",
      content:
        "The Silent Patient by Alex Michaelides, Educated by Tara Westover.",
      created_at: "2024-11-06T11:00:00Z",
      updated_at: "2024-11-06T12:00:00Z",
      tags: ["personal", "books"],
      is_archived: false,
    },
    {
      id: "8",
      title: "Weekly Goals",
      content:
        "Finish the client report by Thursday, exercise for 30 minutes every day.",
      created_at: "2024-11-05T10:00:00Z",
      updated_at: "2024-11-05T11:00:00Z",
      tags: ["work", "goals"],
      is_archived: false,
    },
    {
      id: "9",
      title: "Ideas for Blog Post",
      content: "Write about productivity tips for remote work.",
      created_at: "2024-11-04T09:00:00Z",
      updated_at: "2024-11-04T10:00:00Z",
      tags: ["work", "blog"],
      is_archived: false,
    },
    {
      id: "10",
      title: "Weekend Plans",
      content: "Visit the art gallery and meet friends for coffee.",
      created_at: "2024-11-03T08:00:00Z",
      updated_at: "2024-11-03T09:00:00Z",
      tags: ["personal", "weekend"],
      is_archived: false,
    },
    {
      id: "11",
      title: "Important Dates",
      content:
        "John's birthday on November 15, Meeting with Tom on November 18.",
      created_at: "2024-11-02T17:00:00Z",
      updated_at: "2024-11-02T18:00:00Z",
      tags: ["work", "personal"],
      is_archived: false,
    },
    {
      id: "12",
      title: "Project Ideas",
      content: "Create an app for recipe sharing with social features.",
      created_at: "2024-11-01T16:00:00Z",
      updated_at: "2024-11-01T17:00:00Z",
      tags: ["work", "ideas"],
      is_archived: false,
    },
    {
      id: "13",
      title: "Budget Plan",
      content: "Track monthly expenses, set savings goal of $500 each month.",
      created_at: "2024-10-31T14:00:00Z",
      updated_at: "2024-10-31T15:00:00Z",
      tags: ["personal", "finance"],
      is_archived: false,
    },
    {
      id: "14",
      title: "Dinner Party Menu",
      content:
        "Appetizers: Cheese board, Main Course: Spaghetti, Dessert: Chocolate Cake.",
      created_at: "2024-10-30T12:00:00Z",
      updated_at: "2024-10-30T13:00:00Z",
      tags: ["personal", "food"],
      is_archived: false,
    },
    {
      id: "15",
      title: "Tech News",
      content:
        "Apple releases new M3 chip, Tesla announces self-driving cars in major cities.",
      created_at: "2024-10-29T11:00:00Z",
      updated_at: "2024-10-29T12:00:00Z",
      tags: ["work", "tech"],
      is_archived: false,
    },
  ];
  console.log(notedata);

  return (
    <SidebarProvider>
      <AppSidebar
        notes={notedata}
        setActiveNote={setActiveNote}
        activeNote={activeNote}
      />

      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          File Name
        </header>
        <div className="flex w-full">
          <div className="flex-1 p-4">
            <Editor activeNote={activeNote} /* Your editor props here */ />
          </div>

          {/* Right Div */}
          <div className="w-1/3 p-4 bg-zinc-900"></div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

function BackgroundAnimation() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas: any = canvasRef.current as HTMLCanvasElement | null;
    const ctx = canvas?.getContext("2d"); // Optional chaining to simplify null check

    // Early return if canvas or ctx is null
    if (!canvas || !ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Particle[] = [];
    const particleCount = 50;
    const connectionDistance = 150;
    const linkLifespan = 800; // Increased by 4x (was 200)
    const linkChance = 0.005; // Reduced by 4x (was 0.02)

    class Particle {
      x: number;
      y: number;
      size: number;
      links: Link[];
      speedX: number;
      speedY: number;

      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 1;
        this.links = [];
        this.speedX = (Math.random() - 0.5) * 0.1; // Very slow movement
        this.speedY = (Math.random() - 0.5) * 0.1; // Very slow movement
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        // Wrap around the canvas
        if (this.x < 0) this.x = canvas.width;
        if (this.x > canvas.width) this.x = 0;
        if (this.y < 0) this.y = canvas.height;
        if (this.y > canvas.height) this.y = 0;
      }

      draw() {
        if (!ctx) return;
        ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    class Link {
      particle1: Particle;
      particle2: Particle;
      lifespan: number;

      constructor(p1: Particle, p2: Particle) {
        this.particle1 = p1;
        this.particle2 = p2;
        this.lifespan = linkLifespan;
      }

      update() {
        this.lifespan--;
      }

      draw() {
        if (!ctx) return;
        const alpha = this.lifespan / linkLifespan;
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.5})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(this.particle1.x, this.particle1.y);
        ctx.lineTo(this.particle2.x, this.particle2.y);
        ctx.stroke();
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    function createLinks() {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < connectionDistance && Math.random() < linkChance) {
            const link = new Link(particles[i], particles[j]);
            particles[i].links.push(link);
            particles[j].links.push(link);
          }
        }
      }
    }

    function animate() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      createLinks();

      for (const particle of particles) {
        particle.update(); // Update particle position
        particle.draw();
        particle.links = particle.links.filter((link) => {
          link.update();
          if (link.lifespan > 0) {
            link.draw();
            return true;
          }
          return false;
        });
      }

      requestAnimationFrame(animate);
    }

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full bg-[#151515]"
    />
  );
}
