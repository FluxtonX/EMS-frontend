'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  MapPin,
  Calendar,
  Banknote,
  CheckCircle2,
  ArrowRight,
  X,
  LayoutDashboard,
  LogIn,
  Check,
  ChevronDown,
  HelpCircle,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';

const faqs = [
  {
    q: 'How does automated SIA licence verification and expiry tracking work?',
    a: 'Workforce EMS cross-references UK SIA licence numbers directly against industry compliance standards. It provides real-time validation badges (100% Verified) and triggers automated alerts 60, 30, and 7 days prior to expiry, preventing uncertified officers from being assigned to regulated posts.',
  },
  {
    q: 'Does geofenced clock-in require officers to carry specialized hardware?',
    a: 'No hardware investment is required. Officers check in using their mobile smartphone via our responsive web portal or lightweight mobile app. The system calculates Haversine spherical coordinates against your site’s designated GPS radius (e.g. 50m – 200m) with strict anti-spoofing timestamps.',
  },
  {
    q: 'How do Owner, Manager, and Operator role permissions operate?',
    a: 'Workforce EMS features granular multi-tenant access control. Company Owners have complete authority over billing, compliance, and team member management (both automated email invites and manual account creation). Managers can schedule rotas, approve leave requests, and dispatch patrols. Operators and officers access only their assigned posts and shift communications.',
  },
  {
    q: 'Can we migrate our existing guard rosters, sites, and employee records?',
    a: 'Yes. You can bulk-import employee rosters, client sites, and past records via standard CSV / Excel templates in minutes. Our onboarding wizard validates data schemas automatically, or you can add team members manually with instant password and email setup.',
  },
  {
    q: 'How does timesheet export and payroll processing work?',
    a: 'All on-post hours, overtime, and approved leaves are automatically aggregated into HMRC-ready timesheets. You can export verified shift data with 1 click to CSV/Excel or sync directly with accounting software including Xero, Sage, and QuickBooks.',
  },
];

export default function LandingPage() {
  const { session } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [demoSubmitted, setDemoSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [demoForm, setDemoForm] = useState({
    name: '',
    email: '',
    company: '',
    guardsCount: '25-50',
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDemoSubmitted(true);
    setTimeout(() => {
      setIsDemoModalOpen(false);
      setDemoSubmitted(false);
      setDemoForm({ name: '', email: '', company: '', guardsCount: '25-50' });
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-transparent text-[#171A2B] flex flex-col selection:bg-[#6C5CE7]/20 selection:text-[#6C5CE7] overflow-x-hidden">
      {/* Dynamic Multi-Color Ambient Glow Overlay (Exact matching Dashboard atmospheric depth) */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        {/* Top-Right Luminous Electric Cyan & Emerald Glow */}
        <div className="absolute -top-24 right-0 w-[550px] h-[550px] bg-gradient-to-br from-emerald-400/25 via-teal-400/20 to-cyan-400/10 rounded-full blur-[130px]" />
        {/* Right-Edge Warm Peach / Apricot Shimmer */}
        <div className="absolute top-1/3 -right-20 w-[500px] h-[500px] bg-gradient-to-l from-orange-200/40 via-rose-200/30 to-transparent rounded-full blur-[140px]" />
        {/* Center-Left Royal Purple & Lavender Glow */}
        <div className="absolute top-12 left-1/4 -translate-x-1/2 w-[650px] h-[550px] bg-gradient-to-tr from-[#6C5CE7]/18 via-[#8B5CF6]/12 to-transparent rounded-full blur-[140px]" />
        {/* Subtle Bottom Ambient Violet Tint */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-t from-[#EDE9FE]/40 to-transparent blur-3xl" />
      </div>

      {/* --- Sleek Glassmorphism Navbar --- */}
      <header className="sticky top-0 z-40 bg-white/70 backdrop-blur-xl border-b border-white/60 shadow-[0_2px_15px_rgba(108,92,231,0.03)] transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7C6CEE] via-[#6C5CE7] to-[#4D3CB5] flex items-center justify-center text-white shadow-[0_4px_12px_rgba(108,92,231,0.35),inset_0_1px_0_rgba(255,255,255,0.4)] transition-all duration-300 group-hover:scale-105">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-base sm:text-lg text-[#171A2B] tracking-tight block leading-tight">
                Workforce<span className="text-[#6C5CE7]">EMS</span>
              </span>
              <span className="text-[10px] text-[#687086] font-bold tracking-wider uppercase block">
                Security Operations
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-xs font-bold text-[#687086] tracking-wide">
            <a href="#features" className="hover:text-[#6C5CE7] transition-colors">
              Platform
            </a>
            <a href="#compliance" className="hover:text-[#6C5CE7] transition-colors">
              SIA Compliance
            </a>
            <a href="#metrics" className="hover:text-[#6C5CE7] transition-colors">
              Live Metrics
            </a>
            <a href="#faq" className="hover:text-[#6C5CE7] transition-colors">
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-3">
            {mounted && session ? (
              <Link
                href="/dashboard"
                className="px-4 py-2 bg-[#6C5CE7] hover:bg-[#5A4ACD] text-white font-bold text-xs rounded-xl shadow-[0_4px_12px_rgba(108,92,231,0.3),inset_0_1px_0_rgba(255,255,255,0.4)] hover:shadow-[0_6px_16px_rgba(108,92,231,0.4)] transition-all flex items-center gap-2 hover:-translate-y-0.5"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                Launch Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden sm:flex px-3.5 py-2 text-xs font-bold text-[#687086] hover:text-[#6C5CE7] transition-colors items-center gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5 text-[#6C5CE7]" />
                  Sign In
                </Link>
                <button
                  onClick={() => setIsDemoModalOpen(true)}
                  className="px-4 py-2 bg-[#6C5CE7] hover:bg-[#5A4ACD] text-white font-bold text-xs rounded-xl shadow-[0_4px_12px_rgba(108,92,231,0.3),inset_0_1px_0_rgba(255,255,255,0.4)] hover:shadow-[0_6px_16px_rgba(108,92,231,0.4)] transition-all hover:-translate-y-0.5 cursor-pointer"
                >
                  Book Demo
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* --- Main Content --- */}
      <main className="flex-1">
        {/* --- Hero Section: 2 Columns (Left: Text & CTAs & Real Avatars, Right: emshero.png) --- */}
        <section className="pt-10 sm:pt-16 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Column (7 cols on desktop) */}
            <div className="lg:col-span-7 text-left space-y-6">
              {/* Subtle Pill Tag */}
              
              {/* Bold, Minimalist Typography */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#171A2B] tracking-tight leading-[1.08]">
                Workforce Management, <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6C5CE7] via-[#8B5CF6] to-[#00B4D8]">
                  Built for Modern Teams.
                </span>
              </h1>

              {/* Minimalist Subheadline */}
              <p className="text-sm sm:text-base lg:text-lg text-[#687086] max-w-xl font-medium leading-relaxed">
                Smart officer rostering, verified GPS geofencing, and automated UK compliance — beautifully unified into one high-performance command platform.
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
                {mounted && session ? (
                  <Link
                    href="/dashboard"
                    className="px-7 py-3.5 bg-[#6C5CE7] hover:bg-[#5A4ACD] text-white font-bold text-sm rounded-xl shadow-[0_8px_20px_rgba(108,92,231,0.35),inset_0_1px_0_rgba(255,255,255,0.4)] hover:shadow-[0_12px_28px_rgba(108,92,231,0.45)] transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5"
                  >
                    Go to Command Dashboard
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/register"
                      className="px-7 py-3.5 bg-[#6C5CE7] hover:bg-[#5A4ACD] text-white font-bold text-sm rounded-xl shadow-[0_8px_20px_rgba(108,92,231,0.35),inset_0_1px_0_rgba(255,255,255,0.4)] hover:shadow-[0_12px_28px_rgba(108,92,231,0.45)] transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5"
                    >
                      Start Free Trial
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => setIsDemoModalOpen(true)}
                      className="px-7 py-3.5 bg-white/90 hover:bg-white text-[#171A2B] hover:text-[#6C5CE7] font-bold text-sm rounded-xl border border-[#D5D0FA] shadow-[0_2px_6px_rgba(0,0,0,0.03),inset_0_1px_0_rgba(255,255,255,0.9)] hover:shadow-[0_8px_20px_rgba(108,92,231,0.1)] transition-all backdrop-blur-md hover:-translate-y-0.5 cursor-pointer"
                    >
                      Book 15-Min Demo
                    </button>
                  </>
                )}
              </div>

              {/* Social Proof with REAL Profile Images */}
              <div className="pt-3 flex flex-wrap items-center gap-4 text-xs text-[#687086] font-medium">
                <div className="flex -space-x-2.5 overflow-hidden">
                  <img
                    className="inline-block h-9 w-9 rounded-full ring-2 ring-white object-cover shadow-sm"
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=faces"
                    alt="Team Director Sarah Jenkins"
                  />
                  <img
                    className="inline-block h-9 w-9 rounded-full ring-2 ring-white object-cover shadow-sm"
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=faces"
                    alt="Operations Manager Marcus Sterling"
                  />
                  <img
                    className="inline-block h-9 w-9 rounded-full ring-2 ring-white object-cover shadow-sm"
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop&crop=faces"
                    alt="HR Controller Emily Watson"
                  />
                  <img
                    className="inline-block h-9 w-9 rounded-full ring-2 ring-white object-cover shadow-sm"
                    src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop&crop=faces"
                    alt="Site Supervisor David Ross"
                  />
                  <img
                    className="inline-block h-9 w-9 rounded-full ring-2 ring-white object-cover shadow-sm"
                    src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&h=120&fit=crop&crop=faces"
                    alt="Compliance Officer Priya Sharma"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1 text-amber-500 font-bold">
                    {'★★★★★'}
                    <span className="text-[#171A2B] ml-1">4.9/5</span>
                  </div>
                  <p className="text-[11px] text-[#687086]">
                    Trusted by <strong>120+</strong> Security & Facilities teams in the UK
                  </p>
                </div>
              </div>

              {/* 3 Quick Value Badges */}
              <div className="pt-2 flex flex-wrap items-center gap-4 text-[11px] font-semibold text-[#687086]">
                <span className="flex items-center gap-1.5 text-emerald-600">
                  <Check className="w-3.5 h-3.5" /> No credit card required
                </span>
                <span className="flex items-center gap-1.5 text-[#6C5CE7]">
                  <Check className="w-3.5 h-3.5" /> 100% SIA compliant
                </span>
                <span className="flex items-center gap-1.5 text-teal-600">
                  <Check className="w-3.5 h-3.5" /> 14-day free workspace
                </span>
              </div>
            </div>

            {/* Right Column (5 cols on desktop): High-Resolution emshero.png Showcase */}
            <div className="lg:col-span-5 relative flex items-center justify-center">
              {/* Backlight Ambient Glow Matching Dashboard Theme */}
              <div className="absolute inset-0 bg-gradient-to-tr from-[#6C5CE7]/30 via-teal-400/25 to-cyan-400/25 rounded-3xl blur-2xl transform scale-95 opacity-80" />

              {/* Image Container with Floating Badges */}
              <div className="relative group">
                <img
                  src="/emshero.png"
                  alt="Workforce Management Team"
                  className="relative z-10 w-full max-w-lg lg:max-w-none h-auto object-contain drop-shadow-[0_20px_40px_rgba(108,92,231,0.22)] transition-transform duration-500 group-hover:scale-[1.02]"
                />

                {/* Floating Glass Pill 1: Top-Left */}
                <div className="absolute -top-3 -left-3 sm:-left-6 z-20 flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white/90 backdrop-blur-xl border border-white/80 shadow-[0_12px_24px_rgba(22,34,66,0.08),inset_0_1px_0_rgba(255,255,255,1)]">
                  <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <div className="text-left">
                    <p className="text-[10px] font-bold text-[#687086] uppercase tracking-wider">Attendance Live</p>
                    <p className="text-xs font-black text-[#171A2B]">98.4% On-Post</p>
                  </div>
                </div>

                {/* Floating Glass Pill 2: Bottom-Right */}
                <div className="absolute -bottom-3 -right-3 sm:-right-4 z-20 flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white/90 backdrop-blur-xl border border-white/80 shadow-[0_12px_24px_rgba(22,34,66,0.08),inset_0_1px_0_rgba(255,255,255,1)]">
                  <div className="h-7 w-7 rounded-xl bg-[#EDE9FE] text-[#6C5CE7] flex items-center justify-center font-bold">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-bold text-[#687086] uppercase tracking-wider">SIA Licence</p>
                    <p className="text-xs font-black text-[#171A2B]">100% Verified</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- Minimalist Impact Metrics Bar --- */}
        <section id="metrics" className="py-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="p-6 rounded-2xl bg-white/80 backdrop-blur-xl border border-white/90 shadow-[0_4px_16px_rgba(22,34,66,0.03),inset_0_1px_0_rgba(255,255,255,1)] hover:-translate-y-0.5 transition-all text-center">
              <p className="text-3xl sm:text-4xl font-black text-[#6C5CE7]">99.98%</p>
              <p className="text-xs font-bold text-[#171A2B] mt-1">Geofence Accuracy</p>
              <p className="text-[11px] text-[#687086] mt-0.5">Haversine GPS validation</p>
            </div>

            <div className="p-6 rounded-2xl bg-white/80 backdrop-blur-xl border border-white/90 shadow-[0_4px_16px_rgba(22,34,66,0.03),inset_0_1px_0_rgba(255,255,255,1)] hover:-translate-y-0.5 transition-all text-center">
              <p className="text-3xl sm:text-4xl font-black text-[#6C5CE7]">0</p>
              <p className="text-xs font-bold text-[#171A2B] mt-1">Double Bookings</p>
              <p className="text-[11px] text-[#687086] mt-0.5">Automated conflict engine</p>
            </div>

            <div className="p-6 rounded-2xl bg-white/80 backdrop-blur-xl border border-white/90 shadow-[0_4px_16px_rgba(22,34,66,0.03),inset_0_1px_0_rgba(255,255,255,1)] hover:-translate-y-0.5 transition-all text-center">
              <p className="text-3xl sm:text-4xl font-black text-[#6C5CE7]">100%</p>
              <p className="text-xs font-bold text-[#171A2B] mt-1">SIA Badge Tracking</p>
              <p className="text-[11px] text-[#687086] mt-0.5">Proactive expiry scanners</p>
            </div>

            <div className="p-6 rounded-2xl bg-white/80 backdrop-blur-xl border border-white/90 shadow-[0_4px_16px_rgba(22,34,66,0.03),inset_0_1px_0_rgba(255,255,255,1)] hover:-translate-y-0.5 transition-all text-center">
              <p className="text-3xl sm:text-4xl font-black text-[#6C5CE7]">1-Click</p>
              <p className="text-xs font-bold text-[#171A2B] mt-1">BACS & HMRC PAYE</p>
              <p className="text-[11px] text-[#687086] mt-0.5">Automated payroll export</p>
            </div>
          </div>
        </section>

        {/* --- Minimalist Bento Visual Feature Grid --- */}
        <section id="features" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#6C5CE7]">
              Purpose-Built Capabilities
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#171A2B] tracking-tight mt-1.5">
              Engineered for Real-World Control.
            </h2>
            <p className="text-sm text-[#687086] mt-2 font-medium">
              Every tool is tailored to the exact requirements of UK security and workforce providers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1: Scheduling */}
            <div className="p-6 rounded-3xl bg-white/85 backdrop-blur-xl border border-white/90 shadow-[0_8px_24px_rgba(22,34,66,0.04),inset_0_1px_0_rgba(255,255,255,1)] hover:border-[#6C5CE7]/30 transition-all hover:-translate-y-1">
              <div className="w-10 h-10 rounded-2xl bg-[#EDE9FE] text-[#6C5CE7] flex items-center justify-center mb-5 shadow-2xs">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-[#171A2B] text-lg">Intelligent Scheduling</h3>
              <p className="text-xs text-[#687086] mt-1.5 leading-relaxed font-medium">
                Drag-and-drop rosters with instant conflict detection and automated 11-hour statutory rest interval checks.
              </p>
              <div className="mt-5 p-3 rounded-xl bg-[#FAF9FE] border border-[#E5E3F2] flex items-center justify-between text-xs">
                <span className="text-[#687086] font-medium">Overlap Engine:</span>
                <span className="font-bold text-emerald-600 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> 0 Conflicts Detected
                </span>
              </div>
            </div>

            {/* Feature 2: Geofencing */}
            <div className="p-6 rounded-3xl bg-white/85 backdrop-blur-xl border border-white/90 shadow-[0_8px_24px_rgba(22,34,66,0.04),inset_0_1px_0_rgba(255,255,255,1)] hover:border-[#6C5CE7]/30 transition-all hover:-translate-y-1">
              <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mb-5 shadow-2xs">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-[#171A2B] text-lg">Precision Geofenced Attendance</h3>
              <p className="text-xs text-[#687086] mt-1.5 leading-relaxed font-medium">
                Haversine spherical distance coordinates ensure officers can only clock in within the authorized site radius.
              </p>
              <div className="mt-5 p-3 rounded-xl bg-[#FAF9FE] border border-[#E5E3F2] flex items-center justify-between text-xs">
                <span className="text-[#687086] font-medium">Site Perimeter:</span>
                <span className="font-bold text-[#6C5CE7]">100m Active Radar</span>
              </div>
            </div>

            {/* Feature 3: Payroll & Compliance */}
            <div
              id="compliance"
              className="p-6 rounded-3xl bg-white/85 backdrop-blur-xl border border-white/90 shadow-[0_8px_24px_rgba(22,34,66,0.04),inset_0_1px_0_rgba(255,255,255,1)] hover:border-[#6C5CE7]/30 transition-all hover:-translate-y-1"
            >
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-[#6C5CE7] flex items-center justify-center mb-5 shadow-2xs">
                <Banknote className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-[#171A2B] text-lg">HMRC Payroll & SIA Alerts</h3>
              <p className="text-xs text-[#687086] mt-1.5 leading-relaxed font-medium">
                Automatic PAYE brackets, National Insurance, and 30-day proactive SIA licence expiry alerts.
              </p>
              <div className="mt-5 p-3 rounded-xl bg-[#FAF9FE] border border-[#E5E3F2] flex items-center justify-between text-xs">
                <span className="text-[#687086] font-medium">BACS Processing:</span>
                <span className="font-bold text-indigo-600">Direct Credit Ready</span>
              </div>
            </div>
          </div>
        </section>

        {/* --- FAQ Section --- */}
        <section id="faq" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#D5D0FA] shadow-xs text-[11px] font-bold text-[#6C5CE7] mb-3">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Knowledge Base & Common Questions</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-[#171A2B] tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-[#687086] font-medium leading-relaxed">
              Everything you need to know about SIA compliance, GPS shifts, and multi-tenant management.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Column (5 cols): Authentic faq.png & Contact Box */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <div className="relative w-full max-w-md group">
                <img
                  src="/faq.png"
                  alt="Frequently Asked Questions"
                  className="w-full h-auto object-contain drop-shadow-[0_12px_24px_rgba(22,34,66,0.08)] transition-transform duration-500 group-hover:scale-[1.02]"
                />
              </div>

              {/* Clean Support Callout Card */}
              <div className="mt-6 w-full max-w-md p-5 rounded-2xl bg-white border border-slate-200/90 shadow-[0_4px_16px_rgba(22,34,66,0.03)] flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#6C5CE7] flex items-center justify-center shrink-0 border border-purple-100 shadow-2xs">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div className="text-left flex-1">
                  <h4 className="text-xs font-bold text-[#171A2B]">Have a specific operational question?</h4>
                  <p className="text-[11px] text-[#687086] mt-0.5 leading-relaxed font-medium">
                    Our UK team is available to assist with custom tender specifications and multi-site deployment.
                  </p>
                  <button
                    onClick={() => setIsDemoModalOpen(true)}
                    className="mt-2 text-[11px] font-bold text-[#6C5CE7] hover:text-[#5A4ACD] flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    Speak with an Expert <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column (7 cols): Buttery Smooth Accordion with Clean White Cards */}
            <div className="lg:col-span-7 space-y-3.5">
              {faqs.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={idx}
                    className={`rounded-2xl transition-all duration-300 border overflow-hidden ${
                      isOpen
                        ? 'bg-white border-[#6C5CE7] ring-1 ring-[#6C5CE7]/20 shadow-[0_10px_25px_rgba(108,92,231,0.07)]'
                        : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-[0_2px_8px_rgba(22,34,66,0.03)]'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full p-4 sm:p-5 flex items-center justify-between text-left gap-4 cursor-pointer focus:outline-none transition-colors"
                      aria-expanded={isOpen}
                    >
                      <div className="flex items-center gap-3.5 flex-1 pr-2">
                        <span
                          className={`text-[11px] font-bold font-mono px-2 py-0.5 rounded-md transition-colors ${
                            isOpen
                              ? 'bg-[#6C5CE7]/10 text-[#6C5CE7]'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        <span className="font-bold text-xs sm:text-sm text-[#171A2B] leading-snug">
                          {faq.q}
                        </span>
                      </div>

                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                          isOpen
                            ? 'bg-[#6C5CE7] text-white shadow-xs'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        <ChevronDown
                          className={`w-4 h-4 transition-transform duration-300 ${
                            isOpen ? 'rotate-180 text-white' : 'rotate-0 text-slate-500'
                          }`}
                        />
                      </div>
                    </button>

                    {/* Smooth CSS Grid Accordion Transition */}
                    <div
                      className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
                        isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                      }`}
                    >
                      <div className="overflow-hidden">
                        <div className="px-5 pb-5 pt-2 text-xs sm:text-sm text-[#555E6D] font-medium leading-relaxed border-t border-slate-100">
                          {faq.a}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* --- Minimalist CTA Section --- */}
        <section className="py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="p-8 sm:p-12 rounded-[2.5rem] bg-gradient-to-b from-white/95 to-[#F5F3FF]/90 border border-white/80 shadow-[0_20px_50px_rgba(108,92,231,0.12),inset_0_1px_0_rgba(255,255,255,1)] backdrop-blur-xl">
            <h2 className="text-3xl sm:text-4xl font-black text-[#171A2B] tracking-tight">
              Ready to Upgrade Your Operations?
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-[#687086] max-w-lg mx-auto font-medium leading-relaxed">
              Join leading UK security operators and facilities providers running on Workforce EMS.
            </p>
            <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <button
                onClick={() => setIsDemoModalOpen(true)}
                className="w-full sm:w-auto px-7 py-3.5 bg-[#6C5CE7] hover:bg-[#5A4ACD] text-white font-bold text-xs sm:text-sm rounded-xl shadow-[0_6px_20px_rgba(108,92,231,0.35),inset_0_1px_0_rgba(255,255,255,0.4)] hover:shadow-[0_10px_25px_rgba(108,92,231,0.45)] transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5 cursor-pointer"
              >
                Schedule Private Walkthrough
                <ArrowRight className="w-4 h-4" />
              </button>
              <Link
                href="/register"
                className="w-full sm:w-auto px-7 py-3.5 bg-white text-[#171A2B] hover:text-[#6C5CE7] font-bold text-xs sm:text-sm rounded-xl border border-[#D5D0FA] shadow-xs hover:shadow-md transition-all hover:-translate-y-0.5"
              >
                Create Company Workspace
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* --- Minimalist Footer --- */}
      <footer className="py-8 bg-white/60 backdrop-blur-md border-t border-[#E5E3F2]/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#687086]">
          <div className="flex items-center gap-2 font-medium">
            <ShieldCheck className="w-4 h-4 text-[#6C5CE7]" />
            <span className="font-bold text-[#171A2B]">Workforce EMS</span>
            <span>• © 2026 Workforce Security Ltd</span>
          </div>

          <div className="flex items-center gap-6 font-semibold">
            <Link href="/login" className="hover:text-[#6C5CE7] transition-colors">
              Portal Login
            </Link>
            <button onClick={() => setIsDemoModalOpen(true)} className="hover:text-[#6C5CE7] transition-colors cursor-pointer">
              Request Demo
            </button>
            <span className="text-emerald-600 font-bold flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              All Systems Operational
            </span>
          </div>
        </div>
      </footer>

      {/* --- Book a Demo Modal --- */}
      {isDemoModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-[#D5D0FA] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-[#F0EEF8] flex items-center justify-between bg-gradient-to-r from-[#FAF8FF] to-white">
              <div>
                <h3 className="font-black text-[#171A2B] text-lg">Book a Product Demo</h3>
                <p className="text-xs text-[#687086] mt-0.5">Explore Workforce EMS live with your site data</p>
              </div>
              <button
                onClick={() => setIsDemoModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {demoSubmitted ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-[#171A2B] text-lg">Demo Request Received</h4>
                <p className="text-xs text-[#687086]">
                  Our operations specialist will contact <strong>{demoForm.email}</strong> within 2 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleDemoSubmit} className="p-6 space-y-4 text-left">
                <div>
                  <label className="block text-xs font-bold text-[#687086] mb-1">Your Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Marcus Sterling"
                    value={demoForm.name}
                    onChange={(e) => setDemoForm({ ...demoForm, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#FAF8FF] border border-[#D5D0FA] rounded-xl text-xs text-[#171A2B] focus:outline-none focus:border-[#6C5CE7] focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#687086] mb-1">Work Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="m.sterling@securityops.co.uk"
                    value={demoForm.email}
                    onChange={(e) => setDemoForm({ ...demoForm, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#FAF8FF] border border-[#D5D0FA] rounded-xl text-xs text-[#171A2B] focus:outline-none focus:border-[#6C5CE7] focus:bg-white transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#687086] mb-1">Company</label>
                    <input
                      type="text"
                      placeholder="Canary Security Ltd"
                      value={demoForm.company}
                      onChange={(e) => setDemoForm({ ...demoForm, company: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-[#FAF8FF] border border-[#D5D0FA] rounded-xl text-xs text-[#171A2B] focus:outline-none focus:border-[#6C5CE7] focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#687086] mb-1">Active Guards</label>
                    <select
                      value={demoForm.guardsCount}
                      onChange={(e) => setDemoForm({ ...demoForm, guardsCount: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-[#FAF8FF] border border-[#D5D0FA] rounded-xl text-xs text-[#171A2B] focus:outline-none focus:border-[#6C5CE7] bg-white transition-all"
                    >
                      <option value="10-25">10 – 25 guards</option>
                      <option value="25-50">25 – 50 guards</option>
                      <option value="50-150">50 – 150 guards</option>
                      <option value="150+">150+ guards</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 bg-[#6C5CE7] hover:bg-[#5A4ACD] text-white font-bold text-xs rounded-xl shadow-[0_4px_12px_rgba(108,92,231,0.3),inset_0_1px_0_rgba(255,255,255,0.4)] hover:shadow-[0_6px_16px_rgba(108,92,231,0.4)] transition-all cursor-pointer"
                  >
                    Confirm Demo Booking
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
