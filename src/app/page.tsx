'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  MapPin,
  Calendar,
  Clock,
  Banknote,
  Building2,
  FileCheck2,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Lock,
  X,
  LayoutDashboard,
  LogIn,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';

export default function LandingPage() {
  const { session } = useAuth();
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [activeWorkflowTab, setActiveWorkflowTab] = useState<number>(0);
  const [simulatedClockIn, setSimulatedClockIn] = useState(false);
  const [demoSubmitted, setDemoSubmitted] = useState(false);
  const [demoForm, setDemoForm] = useState({
    name: '',
    email: '',
    company: '',
    guardsCount: '25-50',
  });

  const workflowSteps = [
    {
      title: '1. Client & Site Contract',
      subtitle: 'Agreed hourly bill rate (£24.50/hr)',
      tag: 'Phase 14',
      detail: 'Canary Wharf Financial Towers Ltd • 24/7 Manned Guarding • SIA Door Supervision Rate Matrix',
    },
    {
      title: '2. Guard Assignment',
      subtitle: 'Immutable wage snapshot (£16.00/hr)',
      tag: 'Phase 4',
      detail: 'Officer Marcus Sterling • Active SIA Licence verified • Automatic rate lock prevents retroactive changes',
    },
    {
      title: '3. Shift Scheduling',
      subtitle: 'Automated conflict detection',
      tag: 'Phase 5',
      detail: '08:00 – 20:00 Night Shift • Double-booking guard check passed • Rest period policy enforced',
    },
    {
      title: '4. GPS Geofenced Attendance',
      subtitle: 'Haversine distance verification',
      tag: 'Phase 6',
      detail: 'Lat 51.5054, Lng -0.0208 • Inside 100m site perimeter • Automatic unpaid meal break subtraction',
    },
    {
      title: '5. Automated Invoicing & Margin',
      subtitle: 'HMRC 20% VAT + Gross Margin %',
      tag: 'Phase 13 & 14',
      detail: 'Billable Revenue: £294.00 • Guard Wage Cost: £192.00 • Net Gross Margin: 34.7% reconciled',
    },
  ];

  const [mounted, setMounted] = useState(false);
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
    <div className="min-h-screen bg-[#FAF8FF] text-[#1E1B4B] flex flex-col selection:bg-[#6C5CE7]/20 selection:text-[#6C5CE7]">
      {/* Top Ambient Glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-[#6C5CE7]/10 via-[#6C5CE7]/5 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* --- Minimalist Navbar --- */}
      <header className="sticky top-0 z-40 bg-[#FAF8FF]/85 backdrop-blur-md border-b border-[#E9E4FC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-[#6C5CE7] flex items-center justify-center text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_2px_4px_rgba(108,92,231,0.3)] transition-all group-hover:scale-105">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg text-gray-900 tracking-tight block leading-tight">
                Workforce<span className="text-[#6C5CE7]">EMS</span>
              </span>
              <span className="text-[10px] text-gray-500 font-semibold tracking-wider uppercase block">
                Security Operations
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-gray-600">
            <a href="#features" className="hover:text-[#6C5CE7] transition-colors">Platform</a>
            <a href="#workflow" className="hover:text-[#6C5CE7] transition-colors">Operations Flow</a>
            <a href="#compliance" className="hover:text-[#6C5CE7] transition-colors">SIA Compliance</a>
            <a href="#security" className="hover:text-[#6C5CE7] transition-colors">Security</a>
          </nav>

          <div className="flex items-center gap-3">
            {mounted && session ? (
              <Link
                href="/dashboard"
                className="px-4.5 py-2.2 bg-[#6C5CE7] hover:bg-[#5B4BC4] text-white font-semibold text-xs rounded-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_2px_4px_rgba(108,92,231,0.25)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_4px_12px_rgba(108,92,231,0.35)] transition-all flex items-center gap-2"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                Launch Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-[#6C5CE7] transition-colors flex items-center gap-1.5"
                >
                  <LogIn className="w-4 h-4 text-[#6C5CE7]" />
                  Sign In
                </Link>
                <button
                  onClick={() => setIsDemoModalOpen(true)}
                  className="px-4.5 py-2.2 bg-[#6C5CE7] hover:bg-[#5B4BC4] text-white font-semibold text-xs rounded-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_2px_4px_rgba(108,92,231,0.25)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_4px_12px_rgba(108,92,231,0.35)] transition-all"
                >
                  Book a Demo
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* --- Main Content --- */}
      <main className="flex-1">
        {/* --- Hero Section --- */}
        <section className="pt-16 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#EDE9FE] text-[#6C5CE7] border border-[#D5D0FA] mb-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_1px_2px_rgba(108,92,231,0.08)]">
            <Sparkles className="w-3.5 h-3.5 text-[#6C5CE7]" />
            Enterprise Security Operations Platform
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight max-w-4xl mx-auto leading-[1.12]">
            Workforce Management, <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6C5CE7] via-[#5B4BC4] to-[#4834D4]">
              Built for Modern Security Teams.
            </span>
          </h1>

          <p className="mt-5 text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            One connected platform for SIA guards, client sites, shift scheduling, GPS geofenced attendance, and HMRC PAYE payroll.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            {mounted && session ? (
              <Link
                href="/dashboard"
                className="w-full sm:w-auto px-6 py-3.5 bg-[#6C5CE7] hover:bg-[#5B4BC4] text-white font-semibold text-sm rounded-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_2px_4px_rgba(108,92,231,0.25)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_4px_14px_rgba(108,92,231,0.4)] transition-all flex items-center justify-center gap-2"
              >
                Go to Command Dashboard
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <button
                  onClick={() => setIsDemoModalOpen(true)}
                  className="w-full sm:w-auto px-6 py-3.5 bg-[#6C5CE7] hover:bg-[#5B4BC4] text-white font-semibold text-sm rounded-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_2px_4px_rgba(108,92,231,0.25)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_4px_14px_rgba(108,92,231,0.4)] transition-all flex items-center justify-center gap-2"
                >
                  Book a 15-Minute Demo
                  <ArrowRight className="w-4 h-4" />
                </button>
                <Link
                  href="/register"
                  className="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-[#F5F3FF] text-gray-800 font-semibold text-sm rounded-xl border border-[#D5D0FA] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,1),0_4px_12px_rgba(108,92,231,0.1)] transition-all"
                >
                  Create Company Account
                </Link>
              </>
            )}
            <a
              href="#workflow"
              className="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-[#F5F3FF] text-gray-800 font-semibold text-sm rounded-xl border border-[#D5D0FA] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,1),0_4px_12px_rgba(108,92,231,0.1)] transition-all"
            >
              Explore Operations Flow
            </a>
          </div>

          {/* --- Live Interactive Product Telemetry Mockup --- */}
          <div className="mt-14 max-w-5xl mx-auto bg-white rounded-3xl p-6 sm:p-8 border border-[#E4DEF8] shadow-[inset_0_1px_0_rgba(255,255,255,1),0_12px_36px_rgba(108,92,231,0.08)] transition-all text-left">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                <div>
                  <div className="font-bold text-gray-900 text-sm">Live Operations Telemetry</div>
                  <div className="text-xs text-gray-500">London Central Security Command • Real-time</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-[#6C5CE7]/10 text-[#6C5CE7] border border-[#6C5CE7]/20">
                  42 Active Guards On Post
                </span>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                  100% SIA Compliant
                </span>
              </div>
            </div>

            {/* 3 Interactive Cards in Mockup */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 my-6">
              {/* Card 1: GPS Geofence */}
              <div className="p-4.5 rounded-2xl bg-[#FAF9FE] border border-purple-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(0,0,0,0.03)] hover:border-[#6C5CE7]/40 transition-all">
                <div className="flex items-center justify-between text-xs text-gray-500 font-semibold mb-2">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#6C5CE7]" />
                    GPS Site Geofence
                  </span>
                  <span className="text-emerald-600 font-bold">INSIDE (18m)</span>
                </div>
                <div className="text-sm font-bold text-gray-900">Canary Wharf Tower 1</div>
                <div className="text-xs text-gray-500 mt-1">Haversine GPS Verified • 100m radius</div>
                <div className="mt-3 pt-3 border-t border-purple-100/60 flex items-center justify-between">
                  <span className="text-[11px] text-gray-400">Officer M. Sterling</span>
                  <span className="text-[11px] font-bold text-[#6C5CE7]">Clocked In 07:58</span>
                </div>
              </div>

              {/* Card 2: SIA Licence Verification */}
              <div className="p-4.5 rounded-2xl bg-[#FAF9FE] border border-purple-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(0,0,0,0.03)] hover:border-[#6C5CE7]/40 transition-all">
                <div className="flex items-center justify-between text-xs text-gray-500 font-semibold mb-2">
                  <span className="flex items-center gap-1.5">
                    <FileCheck2 className="w-3.5 h-3.5 text-[#6C5CE7]" />
                    SIA Licence Status
                  </span>
                  <span className="text-emerald-600 font-bold">VALID</span>
                </div>
                <div className="text-sm font-bold text-gray-900">Door Supervision + CCTV</div>
                <div className="text-xs text-gray-500 mt-1">Badge: 1002-8849-0192-3841</div>
                <div className="mt-3 pt-3 border-t border-purple-100/60 flex items-center justify-between">
                  <span className="text-[11px] text-gray-400">Expires: 24 Mar 2027</span>
                  <span className="text-[11px] font-bold text-emerald-600">Auto-Alerts: Active</span>
                </div>
              </div>

              {/* Card 3: Live Payroll Reconciliation */}
              <div className="p-4.5 rounded-2xl bg-[#FAF9FE] border border-purple-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(0,0,0,0.03)] hover:border-[#6C5CE7]/40 transition-all">
                <div className="flex items-center justify-between text-xs text-gray-500 font-semibold mb-2">
                  <span className="flex items-center gap-1.5">
                    <Banknote className="w-3.5 h-3.5 text-[#6C5CE7]" />
                    HMRC PAYE & Profitability
                  </span>
                  <span className="text-[#6C5CE7] font-bold">36.7% MARGIN</span>
                </div>
                <div className="text-sm font-bold text-gray-900">£24.50/hr Bill • £15.50/hr Wage</div>
                <div className="text-xs text-gray-500 mt-1">Class 1 NI & Income Tax Deducted</div>
                <div className="mt-3 pt-3 border-t border-purple-100/60 flex items-center justify-between">
                  <span className="text-[11px] text-gray-400">BACS Batch Ready</span>
                  <span className="text-[11px] font-bold text-purple-700">1-Click Export</span>
                </div>
              </div>
            </div>

            {/* Interactive Simulation Bar */}
            <div className="p-4 bg-[#EDE9FE]/50 rounded-2xl border border-[#D5D0FA] flex flex-col sm:flex-row items-center justify-between gap-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-[#6C5CE7] shadow-sm">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-900">Try Live Clock-In Simulation:</div>
                  <div className="text-[11px] text-gray-500">Tests device GPS accuracy against venue boundary</div>
                </div>
              </div>

              <button
                onClick={() => setSimulatedClockIn(!simulatedClockIn)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  simulatedClockIn
                    ? 'bg-emerald-600 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]'
                    : 'bg-[#6C5CE7] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_2px_4px_rgba(108,92,231,0.25)] hover:bg-[#5B4BC4]'
                }`}
              >
                {simulatedClockIn ? '✓ Clock-In Verified (0.012 km away)' : 'Simulate Guard Clock-In'}
              </button>
            </div>
          </div>
        </section>

        {/* --- Trust Strip --- */}
        <section className="py-12 bg-white border-y border-[#E9E4FC]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            <div className="p-4 rounded-2xl bg-[#FAF8FF] border border-[#E9E4FC] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(0,0,0,0.03)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,1),0_4px_12px_rgba(108,92,231,0.08)] transition-all">
              <div className="text-3xl font-extrabold text-[#6C5CE7]">99.98%</div>
              <div className="text-xs font-bold text-gray-800 mt-1">Geofence Accuracy</div>
              <div className="text-[11px] text-gray-500 mt-0.5">Haversine GPS validation</div>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF8FF] border border-[#E9E4FC] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(0,0,0,0.03)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,1),0_4px_12px_rgba(108,92,231,0.08)] transition-all">
              <div className="text-3xl font-extrabold text-[#6C5CE7]">0</div>
              <div className="text-xs font-bold text-gray-800 mt-1">Double Booking Conflicts</div>
              <div className="text-[11px] text-gray-500 mt-0.5">Automated overlap engine</div>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF8FF] border border-[#E9E4FC] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(0,0,0,0.03)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,1),0_4px_12px_rgba(108,92,231,0.08)] transition-all">
              <div className="text-3xl font-extrabold text-[#6C5CE7]">100%</div>
              <div className="text-xs font-bold text-gray-800 mt-1">SIA Badge Tracking</div>
              <div className="text-[11px] text-gray-500 mt-0.5">Daily automated expiry scans</div>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF8FF] border border-[#E9E4FC] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(0,0,0,0.03)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,1),0_4px_12px_rgba(108,92,231,0.08)] transition-all">
              <div className="text-3xl font-extrabold text-[#6C5CE7]">1-Click</div>
              <div className="text-xs font-bold text-gray-800 mt-1">HMRC Payroll & BACS</div>
              <div className="text-[11px] text-gray-500 mt-0.5">PAYE, NI & Direct Credit</div>
            </div>
          </div>
        </section>

        {/* --- Section: Visual Operations Pipeline --- */}
        <section id="workflow" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-[#6C5CE7]">Complete Operations Flow</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mt-1">
              From Client Contract to Net Payroll.
            </h2>
            <p className="text-sm text-gray-600 mt-2">
              Every operation links seamlessly with rate immutability, automated attendance, and real-time margin tracking.
            </p>
          </div>

          {/* Interactive Steps */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {workflowSteps.map((step, idx) => (
              <button
                key={idx}
                onClick={() => setActiveWorkflowTab(idx)}
                className={`p-4 rounded-2xl text-left transition-all ${
                  activeWorkflowTab === idx
                    ? 'bg-[#6C5CE7] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_4px_12px_rgba(108,92,231,0.3)] scale-[1.02]'
                    : 'bg-white text-gray-700 border border-[#E9E4FC] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(0,0,0,0.03)] hover:border-[#6C5CE7]/40'
                }`}
              >
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mb-2 ${
                  activeWorkflowTab === idx ? 'bg-white/20 text-white' : 'bg-[#EDE9FE] text-[#6C5CE7]'
                }`}>
                  {step.tag}
                </span>
                <div className="font-bold text-sm leading-snug">{step.title}</div>
                <div className={`text-xs mt-1 ${activeWorkflowTab === idx ? 'text-white/80' : 'text-gray-500'}`}>
                  {step.subtitle}
                </div>
              </button>
            ))}
          </div>

          {/* Active Step Visual Showcase */}
          <div className="mt-6 p-6 sm:p-8 bg-white rounded-3xl border border-[#E4DEF8] shadow-[inset_0_1px_0_rgba(255,255,255,1),0_8px_24px_rgba(108,92,231,0.06)] flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="text-xs font-bold text-[#6C5CE7] uppercase tracking-wider">
                Step {activeWorkflowTab + 1} Details
              </span>
              <h3 className="text-xl font-bold text-gray-900">{workflowSteps[activeWorkflowTab].title}</h3>
              <p className="text-sm text-gray-600 max-w-xl">
                {workflowSteps[activeWorkflowTab].detail}
              </p>
            </div>

            <div className="px-5 py-3 rounded-xl bg-[#FAF8FF] border border-[#D5D0FA] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] text-xs font-semibold text-gray-700 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Immutable Ledger Verified</span>
            </div>
          </div>
        </section>

        {/* --- Bento Grid Features Section --- */}
        <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-[#6C5CE7]">Purpose-Built Capabilities</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mt-1">
              Zero Fluff. Complete Operational Control.
            </h2>
            <p className="text-sm text-gray-600 mt-2">
              Minimalist micro-tools engineered specifically for security workforce operations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1: Smart Shifts */}
            <div className="p-6 rounded-3xl bg-white border border-[#E4DEF8] shadow-[inset_0_1px_0_rgba(255,255,255,1),0_2px_6px_rgba(0,0,0,0.03)] hover:border-[#6C5CE7]/30 transition-all">
              <div className="w-10 h-10 rounded-xl bg-[#EDE9FE] text-[#6C5CE7] flex items-center justify-center mb-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-gray-900 text-lg">Conflict-Free Scheduling</h3>
              <p className="text-xs text-gray-600 mt-1 mb-4">
                Automatic overlap detection flags double bookings and validates 11h statutory rest intervals.
              </p>
              <div className="p-3 bg-[#FAF8FF] rounded-xl border border-purple-100 text-xs text-gray-700 flex items-center justify-between">
                <span>Overlap Check:</span>
                <span className="font-bold text-emerald-600">PASSED (0 Conflicts)</span>
              </div>
            </div>

            {/* Card 2: GPS Attendance */}
            <div className="p-6 rounded-3xl bg-white border border-[#E4DEF8] shadow-[inset_0_1px_0_rgba(255,255,255,1),0_2px_6px_rgba(0,0,0,0.03)] hover:border-[#6C5CE7]/30 transition-all">
              <div className="w-10 h-10 rounded-xl bg-[#EDE9FE] text-[#6C5CE7] flex items-center justify-center mb-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-gray-900 text-lg">Haversine GPS Clock-In</h3>
              <p className="text-xs text-gray-600 mt-1 mb-4">
                Calculates real spherical distance between mobile device and venue coordinates within ±50m.
              </p>
              <div className="p-3 bg-[#FAF8FF] rounded-xl border border-purple-100 text-xs text-gray-700 flex items-center justify-between">
                <span>Site Perimeter:</span>
                <span className="font-bold text-purple-700">100m Active Radius</span>
              </div>
            </div>

            {/* Card 3: SIA Badge Tracking */}
            <div id="compliance" className="p-6 rounded-3xl bg-white border border-[#E4DEF8] shadow-[inset_0_1px_0_rgba(255,255,255,1),0_2px_6px_rgba(0,0,0,0.03)] hover:border-[#6C5CE7]/30 transition-all">
              <div className="w-10 h-10 rounded-xl bg-[#EDE9FE] text-[#6C5CE7] flex items-center justify-center mb-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-gray-900 text-lg">Automated SIA Licences</h3>
              <p className="text-xs text-gray-600 mt-1 mb-4">
                Daily background cron scanners alert 30, 14, and 7 days prior to SIA badge expirations.
              </p>
              <div className="p-3 bg-[#FAF8FF] rounded-xl border border-purple-100 text-xs text-gray-700 flex items-center justify-between">
                <span>Daily Scanner:</span>
                <span className="font-bold text-emerald-600">Active (06:00 UTC)</span>
              </div>
            </div>

            {/* Card 4: HMRC Payroll */}
            <div className="p-6 rounded-3xl bg-white border border-[#E4DEF8] shadow-[inset_0_1px_0_rgba(255,255,255,1),0_2px_6px_rgba(0,0,0,0.03)] hover:border-[#6C5CE7]/30 transition-all">
              <div className="w-10 h-10 rounded-xl bg-[#EDE9FE] text-[#6C5CE7] flex items-center justify-center mb-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                <Banknote className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-gray-900 text-lg">HMRC Compliant Payroll</h3>
              <p className="text-xs text-gray-600 mt-1 mb-4">
                UK PAYE income tax brackets, Class 1 Employee NI, net pay, and BACS Direct Credit export.
              </p>
              <div className="p-3 bg-[#FAF8FF] rounded-xl border border-purple-100 text-xs text-gray-700 flex items-center justify-between">
                <span>Export Format:</span>
                <span className="font-bold text-indigo-700">BACS 18-Char CSV</span>
              </div>
            </div>

            {/* Card 5: Contract Billing */}
            <div className="p-6 rounded-3xl bg-white border border-[#E4DEF8] shadow-[inset_0_1px_0_rgba(255,255,255,1),0_2px_6px_rgba(0,0,0,0.03)] hover:border-[#6C5CE7]/30 transition-all">
              <div className="w-10 h-10 rounded-xl bg-[#EDE9FE] text-[#6C5CE7] flex items-center justify-center mb-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-gray-900 text-lg">Client Billing & VAT</h3>
              <p className="text-xs text-gray-600 mt-1 mb-4">
                Site-specific billing rate cards with holiday multipliers and automated 20% UK VAT invoices.
              </p>
              <div className="p-3 bg-[#FAF8FF] rounded-xl border border-purple-100 text-xs text-gray-700 flex items-center justify-between">
                <span>VAT Calculation:</span>
                <span className="font-bold text-gray-900">Standard 20% Tax</span>
              </div>
            </div>

            {/* Card 6: Enterprise Audit Trail */}
            <div id="security" className="p-6 rounded-3xl bg-white border border-[#E4DEF8] shadow-[inset_0_1px_0_rgba(255,255,255,1),0_2px_6px_rgba(0,0,0,0.03)] hover:border-[#6C5CE7]/30 transition-all">
              <div className="w-10 h-10 rounded-xl bg-[#EDE9FE] text-[#6C5CE7] flex items-center justify-center mb-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-gray-900 text-lg">Immutable Security Ledger</h3>
              <p className="text-xs text-gray-600 mt-1 mb-4">
                Forensic audit trail recording actor IDs, client IP addresses, and state mutation payloads.
              </p>
              <div className="p-3 bg-[#FAF8FF] rounded-xl border border-purple-100 text-xs text-gray-700 flex items-center justify-between">
                <span>Tamper Protection:</span>
                <span className="font-bold text-emerald-600">SHA-256 Scoped</span>
              </div>
            </div>
          </div>
        </section>

        {/* --- Minimalist CTA Section --- */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-white to-[#F5F3FF] border border-[#D5D0FA] shadow-[inset_0_1px_0_rgba(255,255,255,1),0_12px_36px_rgba(108,92,231,0.08)]">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
              Ready to Streamline Your Guarding Operations?
            </h2>
            <p className="mt-3 text-sm text-gray-600 max-w-xl mx-auto">
              Schedule a personalized walkthrough of the complete scheduling, attendance, and payroll engine.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => setIsDemoModalOpen(true)}
                className="w-full sm:w-auto px-6 py-3.5 bg-[#6C5CE7] hover:bg-[#5B4BC4] text-white font-semibold text-sm rounded-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_2px_4px_rgba(108,92,231,0.25)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_4px_14px_rgba(108,92,231,0.4)] transition-all flex items-center justify-center gap-2"
              >
                Book a Demo
                <ArrowRight className="w-4 h-4" />
              </button>
              <Link
                href="/register"
                className="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-[#FAF8FF] text-[#6C5CE7] font-semibold text-sm rounded-xl border border-[#D5D0FA] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(0,0,0,0.04)] transition-all"
              >
                Create Company Account
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* --- Minimalist Footer --- */}
      <footer className="py-8 bg-white border-t border-[#E9E4FC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#6C5CE7]" />
            <span className="font-bold text-gray-900">Workforce EMS</span>
            <span>• © 2026 Workforce Security Ltd</span>
          </div>

          <div className="flex items-center gap-6 font-medium">
            <Link href="/login" className="hover:text-[#6C5CE7] transition-colors">
              Portal Login
            </Link>
            <button onClick={() => setIsDemoModalOpen(true)} className="hover:text-[#6C5CE7] transition-colors">
              Request Demo
            </button>
            <span className="text-emerald-600 font-semibold">● Systems Operational</span>
          </div>
        </div>
      </footer>

      {/* --- Book a Demo Modal --- */}
      {isDemoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#D5D0FA] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in duration-200">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-[#FAF8FF] to-white">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Book a Product Demo</h3>
                <p className="text-xs text-gray-500">See Workforce EMS live with your site data</p>
              </div>
              <button
                onClick={() => setIsDemoModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {demoSubmitted ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-gray-900 text-lg">Demo Request Received</h4>
                <p className="text-xs text-gray-500">
                  Our operations specialist will contact {demoForm.email} within 2 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleDemoSubmit} className="p-6 space-y-4 text-left">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Your Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Marcus Sterling"
                    value={demoForm.name}
                    onChange={e => setDemoForm({ ...demoForm, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#FAF8FF] border border-[#D5D0FA] rounded-xl text-sm focus:ring-2 focus:ring-[#6C5CE7] focus:bg-white transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Work Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="m.sterling@securityops.co.uk"
                    value={demoForm.email}
                    onChange={e => setDemoForm({ ...demoForm, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#FAF8FF] border border-[#D5D0FA] rounded-xl text-sm focus:ring-2 focus:ring-[#6C5CE7] focus:bg-white transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Company</label>
                    <input
                      type="text"
                      placeholder="Canary Security Ltd"
                      value={demoForm.company}
                      onChange={e => setDemoForm({ ...demoForm, company: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-[#FAF8FF] border border-[#D5D0FA] rounded-xl text-sm focus:ring-2 focus:ring-[#6C5CE7] focus:bg-white transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Active Guards</label>
                    <select
                      value={demoForm.guardsCount}
                      onChange={e => setDemoForm({ ...demoForm, guardsCount: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-[#FAF8FF] border border-[#D5D0FA] rounded-xl text-sm focus:ring-2 focus:ring-[#6C5CE7] focus:bg-white transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)]"
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
                    className="w-full py-3 bg-[#6C5CE7] hover:bg-[#5B4BC4] text-white font-semibold text-sm rounded-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_2px_4px_rgba(108,92,231,0.25)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_4px_12px_rgba(108,92,231,0.35)] transition-all"
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
