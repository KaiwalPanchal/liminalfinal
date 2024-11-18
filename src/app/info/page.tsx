/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Analytics } from "@vercel/analytics/react";
import { addToWaitList } from "@/lib/firebase";
import { Brain, Network, Lightbulb, Briefcase, Users, Laptop, Lock, Plug } from 'lucide-react'
import { Space_Mono, Nunito_Sans, Raleway } from 'next/font/google'
import  localFont  from 'next/font/local'


const spacemono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
})

const raleway = Raleway({
  subsets: ['latin'],
  weight: ['400', '700'],
})

const nunito = Nunito_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
})

// const helvetica = localFont({
//   src: '../fonts/helveticaNow.ttf',
//   weight: '400',
//   variable: '--font-helvetica'
// })


export default function Component() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await addToWaitList(email);
      setEmail("");
      setIsSubmitted(true);
      console.log("Email successfully added to waitlist");

      // Optional: Reset the success message after 5 seconds
      // setTimeout(() => setIsSubmitted(false), 5000);
    } catch (error) {
      console.error("Error adding email to waitlist:", error);
      setIsSubmitted(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  function FeatureItem({ icon, title, features, alignment }: { icon: React.ReactNode, title: string, features: string[], alignment: 'left' | 'right' }) {
    return (
      <motion.div 
        className={`flex items-start ${alignment === 'left' ? 'flex-row' : 'flex-row-reverse'} gap-8`}
        initial={{ opacity: 0, x: alignment === 'left' ? -50 : 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1 }}
      >
        <div className="flex-shrink-0 mt-2">
          {icon}
        </div>
        <div className={`flex-grow ${alignment === 'left' ? 'text-left' : 'text-right'}`}>
          <h3 className="text-2xl font-semibold text-white mb-4">{title}</h3>
          <ul className={`space-y-2 ${alignment === 'left' ? 'list-disc pl-5' : 'list-disc-reverse pr-5'}`}>
            {features.map((feature, index) => (
              <li key={index} className="text-white/80">{feature}</li>
            ))}
          </ul>
        </div>
      </motion.div>
    )
  }

  return (
    <div className={"min-h-screen flex flex-col relative overflow-hidden dark" + " " + nunito.className}>
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
              <a href="/login" className="text-sm hover:underline text-white">
                Login
              </a>
            </li>
          </ul>
        </nav>
      </header>
      <BackgroundAnimation />
      <main className={"flex-grow flex flex-col items-center relative z-20" + " " + raleway.className}>
        <div className="container mx-auto px-4 py-20 text-center">
          <motion.h1
            className="text-5xl md:text-7xl font-bold mb-8 text-white leading-tight"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Your brain on its best day,
            <br />
            every day
          </motion.h1>
          <motion.div
            className="space-y-6 mb-12"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <p className="text-2xl md:text-3xl text-white/80 font-normal">
              Your thoughts, but better organized than your sock drawer
            </p>
          </motion.div>
          <motion.form
            onSubmit={handleSubmit}
            className="flex flex-col items-center space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            {!isSubmitted ? (
              <>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="max-w-sm bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder-white/50"
                  required
                  disabled={isSubmitting}
                />
                <Button
                  type="submit"
                  className="bg-white text-[#151515] hover:bg-white/90"
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? "Joining..."
                    : "→ Join the waitlist for early access"}
                </Button>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center space-y-4"
              >
                <div className="text-2xl text-white font-medium">
                  Thanks for joining! 🎉
                </div>
                <p className="text-white/80">
                  We&apos;ll keep you updated on our progress.
                </p>
              </motion.div>
            )}
          </motion.form>
        </div>
        <section className="w-full py-12 md:py-24 lg:py-32 relative">
          <div className="container px-4 md:px-6 relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-12">Key Features</h2>
            <div className="space-y-24">
              <FeatureItem
                icon={<Brain className="h-16 w-16 text-white" />}
                title="Knowledge Management"
                features={[
                  "Powerful search capabilities",
                  "Custom templates for different note types",
                  "Export options in multiple formats",
                  "Version history and backups",
                  "File attachments and media support"
                ]}
                alignment="left"
              />
              <FeatureItem
                icon={<Network className="h-16 w-16 text-white" />}
                title="Graph-Based Note Organization"
                features={[
                  "Discover hidden connections between your ideas automatically",
                  "Visualize your knowledge network as it grows",
                  "Find related notes instantly with smart linking",
                  "Never lose context with bi-directional references"
                ]}
                alignment="right"
              />
              <FeatureItem
                icon={<Lightbulb className="h-16 w-16 text-white" />}
                title="Enhanced Creativity Tools"
                features={[
                  "Mind mapping and brainstorming templates",
                  "Capture ideas quickly with quick-entry mode",
                  "Tag and categorize ideas for better organization",
                  "Convert rough ideas into structured notes",
                  "Set reminders to revisit and develop ideas"
                ]}
                alignment="left"
              />
              <FeatureItem
                icon={<Briefcase className="h-16 w-16 text-white" />}
                title="Project-Focused Workspaces"
                features={[
                  "Organize notes by projects and sub-projects",
                  "Create custom workflows for different project types",
                  "Set project milestones and deadlines",
                  "Track project progress visually",
                  "Switch contexts easily between different projects"
                ]}
                alignment="right"
              />
              <FeatureItem
                icon={<Users className="h-16 w-16 text-white" />}
                title="Seamless Team Collaboration"
                features={[
                  "Real-time collaborative editing and brainstorming",
                  "Share specific note collections with team members",
                  "Track changes and contributions",
                  "Leave contextual comments and feedback",
                  "Control access levels for different team members"
                ]}
                alignment="left"
              />
              {/* <FeatureItem
                icon={<Laptop className="h-16 w-16 text-white" />}
                title="Cross-Platform Accessibility"
                features={[
                  "Sync across desktop and mobile devices",
                  "Work offline with automatic syncing",
                  "Web-based access from anywhere",
                  "Native apps for major platforms"
                ]}
                alignment="right"
              /> */}
              {/* <FeatureItem
                icon={<Lock className="h-16 w-16 text-white" />}
                title="Privacy & Security"
                features={[
                  "End-to-end encryption",
                  "Self-hosting options",
                  "Regular automated backups",
                  "Custom privacy settings per note/project"
                ]}
                alignment="left"
              /> */}
              <FeatureItem
                icon={<Plug className="h-16 w-16 text-white" />}
                title="Integration Capabilities"
                features={[
                  "Connect with popular productivity tools",
                  "Import from other note-taking apps",
                  "API access for custom integrations",
                  "Calendar integration for project timelines"
                ]}
                alignment="right"
              />
            </div>
          </div>
        </section>
        <Analytics />
      </main>

      <footer className="py-8 relative z-10">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center">
            <span className="text-sm text-white/80">&copy; 2024 Curios. All rights reserved.</span>
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
      const dpr = window.devicePixelRatio || 1; // Handle high DPI screens
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.scale(dpr, dpr); // Match canvas scaling
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
