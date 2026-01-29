'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Code2,
  Users,
  Play,
  Shield,
  Zap,
  GitBranch,
  ArrowRight,
  CheckCircle
} from 'lucide-react';

const features = [
  {
    icon: Code2,
    title: 'Real-Time Collaborative Editor',
    description: 'Monaco-powered editor with live sync, syntax highlighting, and multi-cursor support across 5+ languages.',
  },
  {
    icon: Play,
    title: 'Secure Code Execution',
    description: 'Docker-sandboxed execution environment with resource limits, timeout controls, and test case validation.',
  },
  {
    icon: Users,
    title: 'Video Communication',
    description: 'Built-in WebRTC video/audio chat with screen sharing for seamless interviewer-candidate interaction.',
  },
  {
    icon: Zap,
    title: 'AI-Powered Insights',
    description: 'Automatic code analysis, complexity estimation, and personalized feedback suggestions.',
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'JWT authentication, role-based access, rate limiting, and encrypted data transmission.',
  },
  {
    icon: GitBranch,
    title: 'Question Bank',
    description: 'Curated library of coding problems with difficulty levels, categories, and customizable test cases.',
  },
];

const stats = [
  { value: '10K+', label: 'Interviews Conducted' },
  { value: '99.9%', label: 'Uptime SLA' },
  { value: '<50ms', label: 'Sync Latency' },
  { value: '5+', label: 'Languages Supported' },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Code2 className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl">CodeView</span>
            </Link>

            <div className="flex items-center gap-4">
              <Link href="/auth/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/auth/register">
                <Button className="glow">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
            <Zap className="w-4 h-4" />
            Built for serious engineering teams
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
            <span className="gradient-text">Real-Time</span> Code<br />
            Interview Platform
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Conduct live coding interviews with collaborative editing,
            secure code execution, video chat, and AI-powered insights.
            Built for scale.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth/register">
              <Button size="lg" className="glow pulse-glow">
                Start Free Trial
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="outline">
                View Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y border-border">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold gradient-text">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Everything You Need for<br />
              <span className="gradient-text">Technical Interviews</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A comprehensive platform designed for engineering teams who take
              technical hiring seriously.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="relative p-8 sm:p-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
            <div className="absolute inset-0 bg-grid-pattern opacity-5 rounded-2xl" />
            <div className="relative text-center">
              <h2 className="text-3xl font-bold mb-4">
                Ready to Transform Your Hiring?
              </h2>
              <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                Join hundreds of companies using CodeView to conduct better technical interviews.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/auth/register">
                  <Button size="lg" className="glow">
                    Get Started Free
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>

              <div className="mt-8 flex items-center justify-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  No credit card required
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  14-day free trial
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <Code2 className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold">CodeView</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 CodeView. Built with ❤️ for engineering teams.
          </p>
        </div>
      </footer>
    </div>
  );
}
