/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Analytics } from "@vercel/analytics/react";
import { addToWaitList } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { redirect } from "next/navigation";
// import { toast } from "@/hooks/use-toast";

export default function Component() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
    //   window.location.href = "/";
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log(e, email, password);
    
    try {
     if (email === "YCombinator" && password === "Admin@123") {
        localStorage.setItem("user", email);
        window.location.href = "/";
     }
     else{
        alert("Wrong email or password");
     }

    } catch (error) {
      console.error("Error loggin:", error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden font-handwritten dark">
      <BackgroundAnimation />

      <div className="absolute inset-0 bg-gradient-to-b from-[#151515]/80 to-[#151515]/20 backdrop-blur-sm z-10"></div>

      <header className="container mx-auto px-10 py-6 flex justify-between items-center relative z-20">
        <div className="flex items-center space-x-2">
          <h1
            id="liminal-title"
            className="text-4xl font-normal text-white title tracking-[1px]"
          >
            Liminal
          </h1>
        </div>
        <nav>
          <ul className="flex space-x-10">
            <li>
              <a href="/about" className="text-sm hover:underline text-white">
                About
              </a>
            </li>
            <li>
              <a href="/info" className="text-sm hover:underline text-white">
                Info
              </a>
            </li>
          </ul>
        </nav>
      </header>

      <main className="flex-grow flex items-center relative z-20">
        <div className="container mx-auto px-4 py-20 text-center">
        <h1
            id="liminal-title"
            className="text-4xl font-normal text-white title tracking-[1px] my-5"
          >
            Login
          </h1>
          <motion.form
            onSubmit={handleSubmit}
            className="flex flex-col items-center space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
              <>
                <Input
                  type="text"
                  placeholder="Enter your ID"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="max-w-sm bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder-white/50"
                  required
                />
                <Input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="max-w-sm bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder-white/50"
                  required
                />
                <Button
                  type="submit"
                  className="bg-white text-[#151515] hover:bg-white/90"
                >→ Submit
                </Button>
              </>
            
          </motion.form>
        </div>
        <Analytics />
      </main>

      <footer className="py-8 relative z-20">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center">
            <span className="text-sm text-white/80"> </span>
          </div>
        </div>
      </footer>
    </div>
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
