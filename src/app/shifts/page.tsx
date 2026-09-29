'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import {
  Calendar,
  Clock,
  Building2,
  UserCheck,
  AlertTriangle,
  Plus,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Shield,
  Loader2,
  Trash2,
  Edit2,
  UserPlus,
} from 'lucide-react';
import { Shift, ShiftStatus, EligibleEmployee } from '@/types/shift';
import { Site, SiteJob } from '@/types/site';
import {
  fetchShiftsApi,
  createShiftApi,
  updateShiftApi,
  deleteShiftApi,
  fetchEligibleEmployeesApi,
} from '@/lib/api/shifts';
import { fetchSites } from '@/lib/api/sites';

export default function ShiftsPage() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Navigation
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [selectedSiteId, setSelectedSiteId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedShiftForEdit, setSelectedShiftForEdit] = useState<Shift | null>(null);

  // Form State for Create Shift
  const [formData, setFormData] = useState({
    siteId: '',
    siteJobId: '',
    employeeId: '',
    shiftDate: new Date().toISOString().split('T')[0],
    startTime: '07:00',
    endTime: '19:00',
    breakMinutes: 30,
    notes: '',
  });

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Eligible Employees state for recommendation engine
  const [eligibleEmployees, setEligibleEmployees] = useState<EligibleEmployee[]>([]);
  const [loadingEligible, setLoadingEligible] = useState(false);

  // Fetch initial data
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [shiftsData, sitesData] = await Promise.all([
        fetchShiftsApi({
          siteId: selectedSiteId === 'all' ? undefined : selectedSiteId,
          startDate: viewMode === 'day' ? selectedDate : undefined,
          endDate: viewMode === 'day' ? selectedDate : undefined,
          status: statusFilter === 'all' ? undefined : statusFilter,
        }),
        fetchSites(),
      ]);
      setShifts(shiftsData);
      setSites(sitesData);
    } catch (err: any) {
      setError(err?.message || 'Failed to load shifts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDate, selectedSiteId, statusFilter, viewMode]);

  const selectedSiteJobs: SiteJob[] = useMemo(() => {
    if (!formData.siteId) return [];
    const site = sites.find((s) => s.id === formData.siteId);
    return site?.jobs || [];
  }, [formData.siteId, sites]);

  // Query eligible employees when site, role, date, times change
  useEffect(() => {
    if (formData.siteId && formData.siteJobId && formData.shiftDate && formData.startTime && formData.endTime) {
      if (formData.startTime < formData.endTime) {
        setLoadingEligible(true);
        fetchEligibleEmployeesApi({
          siteId: formData.siteId,
          siteJobId: formData.siteJobId,
          shiftDate: formData.shiftDate,
          startTime: formData.startTime,
          endTime: formData.endTime,
        })
          .then((data) => setEligibleEmployees(data))
          .catch(() => setEligibleEmployees([]))
          .finally(() => setLoadingEligible(false));
      }
    } else {
      setEligibleEmployees([]);
    }
  }, [formData.siteId, formData.siteJobId, formData.shiftDate, formData.startTime, formData.endTime]);

  // Date Navigation
  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  // Create Shift Submit
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);

    try {
      await createShiftApi({
        siteId: formData.siteId,
        siteJobId: formData.siteJobId,
        employeeId: formData.employeeId ? formData.employeeId : undefined,
        shiftDate: formData.shiftDate,
        startTime: formData.startTime,
        endTime: formData.endTime,
        breakMinutes: Number(formData.breakMinutes) || 0,
        notes: formData.notes.trim() || undefined,
      });

      setIsCreateOpen(false);
      setFormData({
        siteId: '',
        siteJobId: '',
        employeeId: '',
        shiftDate: selectedDate,
        startTime: '07:00',
        endTime: '19:00',
        breakMinutes: 30,
        notes: '',
      });
      await loadData();
    } catch (err: any) {
      setFormError(err?.message || 'Failed to create shift.');
    } finally {
      setFormLoading(false);
    }
  };

  // Status Update Handler
  const handleUpdateStatus = async (shiftId: string, newStatus: ShiftStatus) => {
    try {
      await updateShiftApi(shiftId, { status: newStatus });
      await loadData();
      if (selectedShiftForEdit?.id === shiftId) {
        setSelectedShiftForEdit((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to update shift status.');
    }
  };

  // Delete Shift Handler
  const handleDeleteShift = async (shiftId: string) => {
    if (!confirm('Are you sure you want to delete this shift?')) return;
    try {
      await deleteShiftApi(shiftId);
      setSelectedShiftForEdit(null);
      await loadData();
    } catch (err: any) {
      alert(err?.message || 'Failed to delete shift.');
    }
  };

  const getStatusBadge = (status: ShiftStatus) => {
    switch (status) {
      case 'scheduled':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">Scheduled</span>;
      case 'confirmed':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">Confirmed</span>;
      case 'in_progress':
        return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />In Progress</span>;
      case 'completed':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">Completed</span>;
      case 'cancelled':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">Cancelled</span>;
    }
  };

  return (
    <AppShell>
      <div className="space-y-5">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E2E8F0] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-[#0F172A]">Shift Rostering & Operations</h1>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-[#2563EB] border border-blue-200">
                Live Conflict Engine
              </span>
            </div>
            <p className="text-xs text-[#64748B] mt-0.5">
              Strict conflict detection, real-time guard eligibility matching, and open post management.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setFormData((prev) => ({ ...prev, shiftDate: selectedDate }));
                setIsCreateOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              Schedule Shift
            </button>
          </div>
        </div>

        {/* Date Navigator & Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-lg border border-[#E2E8F0] shadow-sm">
          {/* Date controls */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrevDay}
              className="p-1.5 rounded hover:bg-[#F1F5F9] text-[#64748B] transition-colors"
              title="Previous Day"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-2.5 py-1 rounded text-xs font-medium border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#0F172A]"
            >
              Today
            </button>
            <button
              onClick={handleNextDay}
              className="p-1.5 rounded hover:bg-[#F1F5F9] text-[#64748B] transition-colors"
              title="Next Day"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2 ml-2">
              <Calendar className="h-4 w-4 text-[#2563EB]" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-xs font-semibold text-[#0F172A] border border-[#E2E8F0] rounded px-2 py-1 outline-none focus:border-[#2563EB]"
              />
              <span className="text-xs text-[#64748B] hidden sm:inline">
                {new Date(selectedDate).toLocaleDateString('en-GB', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs text-[#64748B]">
              <Building2 className="h-3.5 w-3.5" />
              <select
                value={selectedSiteId}
                onChange={(e) => setSelectedSiteId(e.target.value)}
                className="text-xs border border-[#E2E8F0] rounded px-2 py-1 outline-none focus:border-[#2563EB] bg-white text-[#0F172A]"
              >
                <option value="all">All Sites</option>
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name} ({site.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1 text-xs text-[#64748B]">
              <Filter className="h-3.5 w-3.5" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs border border-[#E2E8F0] rounded px-2 py-1 outline-none focus:border-[#2563EB] bg-white text-[#0F172A]"
              >
                <option value="all">All Statuses</option>
                <option value="scheduled">Scheduled</option>
                <option value="confirmed">Confirmed</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white rounded-lg border border-[#E2E8F0]">
            <Loader2 className="h-6 w-6 text-[#2563EB] animate-spin mb-2" />
            <p className="text-xs text-[#64748B]">Loading shifts and roster entries...</p>
          </div>
        ) : error ? (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
            {error}
          </div>
        ) : shifts.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white rounded-lg border border-[#E2E8F0] text-center">
            <Calendar className="h-10 w-10 text-[#94A3B8] mb-3" />
            <h3 className="text-sm font-semibold text-[#0F172A]">No shifts scheduled for this date</h3>
            <p className="text-xs text-[#64748B] mt-1 max-w-sm">
              There are currently no operational shifts planned for the selected date and site filter.
            </p>
            <button
              onClick={() => {
                setFormData((prev) => ({ ...prev, shiftDate: selectedDate }));
                setIsCreateOpen(true);
              }}
              className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Schedule First Shift
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {shifts.map((shift) => {
              const isOpenPosition = !shift.employeeId;

              return (
                <div
                  key={shift.id}
                  className={`bg-white rounded-lg border transition-all p-4 flex flex-col justify-between ${
                    isOpenPosition
                      ? 'border-amber-300 bg-amber-50/20 shadow-sm'
                      : 'border-[#E2E8F0] hover:border-blue-300 shadow-sm'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header: Site & Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 text-[#2563EB]" />
                          <h4 className="text-xs font-bold text-[#0F172A] leading-tight">
                            {shift.site?.name || 'Unknown Site'}
                          </h4>
                        </div>
                        <p className="text-[11px] text-[#64748B] ml-5">
                          {shift.siteJob?.jobType?.name || 'Security Role'}
                        </p>
                      </div>
                      {getStatusBadge(shift.status)}
                    </div>

                    {/* Time Window */}
                    <div className="flex items-center justify-between bg-[#F8FAFC] px-2.5 py-1.5 rounded border border-[#E2E8F0] text-xs">
                      <div className="flex items-center gap-1.5 text-[#0F172A] font-semibold">
                        <Clock className="h-3.5 w-3.5 text-[#64748B]" />
                        <span>
                          {shift.startTime} – {shift.endTime}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#64748B]">
                        Break: {shift.breakMinutes}m
                      </span>
                    </div>

                    {/* Assigned Officer / Open Position */}
                    <div className="pt-1">
                      {isOpenPosition ? (
                        <div className="flex items-center justify-between p-2 rounded bg-amber-50 border border-amber-200">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-amber-600" />
                            <div>
                              <p className="text-xs font-bold text-amber-900 leading-tight">
                                Open Position
                              </p>
                              <p className="text-[10px] text-amber-700">No officer assigned</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setSelectedShiftForEdit(shift)}
                            className="px-2 py-0.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-[10px] font-semibold"
                          >
                            Assign Guard
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between p-2 rounded bg-[#F8FAFC] border border-[#E2E8F0]">
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-full bg-blue-100 text-[#2563EB] flex items-center justify-center font-bold text-xs">
                              {shift.employee?.firstName?.[0]}
                              {shift.employee?.lastName?.[0]}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-[#0F172A] leading-tight">
                                {shift.employee?.firstName} {shift.employee?.lastName}
                              </p>
                              <p className="text-[10px] text-[#64748B]">
                                {shift.employee?.employeeNumber}
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            Assigned
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Notes if any */}
                    {shift.notes && (
                      <p className="text-[11px] text-[#64748B] italic bg-slate-50 p-2 rounded border border-slate-100">
                        "{shift.notes}"
                      </p>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between border-t border-[#E2E8F0] pt-3 mt-3 text-xs">
                    <button
                      onClick={() => setSelectedShiftForEdit(shift)}
                      className="inline-flex items-center gap-1 text-[#2563EB] hover:text-blue-800 font-medium"
                    >
                      <Edit2 className="h-3 w-3" />
                      Manage
                    </button>

                    <div className="flex items-center gap-1.5">
                      {shift.status === 'scheduled' && (
                        <button
                          onClick={() => handleUpdateStatus(shift.id, 'confirmed')}
                          className="px-2 py-0.5 text-[10px] font-semibold rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200"
                        >
                          Confirm
                        </button>
                      )}
                      {shift.status === 'confirmed' && (
                        <button
                          onClick={() => handleUpdateStatus(shift.id, 'in_progress')}
                          className="px-2 py-0.5 text-[10px] font-semibold rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                        >
                          Start Shift
                        </button>
                      )}
                      {shift.status === 'in_progress' && (
                        <button
                          onClick={() => handleUpdateStatus(shift.id, 'completed')}
                          className="px-2 py-0.5 text-[10px] font-semibold rounded bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-300"
                        >
                          Complete
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteShift(shift.id)}
                        className="text-rose-600 hover:text-rose-800 p-1"
                        title="Delete Shift"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* CREATE SHIFT MODAL */}
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-[#E2E8F0]">
              <div className="flex items-center justify-between p-4 border-b border-[#E2E8F0]">
                <div>
                  <h3 className="text-sm font-bold text-[#0F172A]">Schedule Operational Shift</h3>
                  <p className="text-xs text-[#64748B]">
                    Strict conflict detection & intelligent guard recommendation engine.
                  </p>
                </div>
                <button
                  onClick={() => setIsCreateOpen(false)}
                  className="text-[#64748B] hover:text-[#0F172A]"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="p-4 space-y-4">
                {formError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded">
                    {formError}
                  </div>
                )}

                {/* Site Selection */}
                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Select Site *
                  </label>
                  <select
                    value={formData.siteId}
                    onChange={(e) =>
                      setFormData({ ...formData, siteId: e.target.value, siteJobId: '' })
                    }
                    required
                    className="w-full text-xs border border-[#CBD5E1] rounded px-2.5 py-1.5 outline-none focus:border-[#2563EB]"
                  >
                    <option value="">-- Choose Site --</option>
                    {sites.map((site) => (
                      <option key={site.id} value={site.id}>
                        {site.name} ({site.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Job Role Selection */}
                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Operational Role & Bill Rate *
                  </label>
                  <select
                    value={formData.siteJobId}
                    onChange={(e) => setFormData({ ...formData, siteJobId: e.target.value })}
                    required
                    disabled={!formData.siteId}
                    className="w-full text-xs border border-[#CBD5E1] rounded px-2.5 py-1.5 outline-none focus:border-[#2563EB] disabled:bg-slate-100"
                  >
                    <option value="">-- Choose Job Role --</option>
                    {selectedSiteJobs.map((sj: SiteJob) => (
                      <option key={sj.id} value={sj.id}>
                        {sj.jobType?.name || 'Role'} (£{sj.defaultPayRate}/hr pay • £
                        {sj.billingRate}/hr bill)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date & Time Range */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                      Shift Date *
                    </label>
                    <input
                      type="date"
                      value={formData.shiftDate}
                      onChange={(e) => setFormData({ ...formData, shiftDate: e.target.value })}
                      required
                      className="w-full text-xs border border-[#CBD5E1] rounded px-2.5 py-1.5 outline-none focus:border-[#2563EB]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                      Start Time *
                    </label>
                    <input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      required
                      className="w-full text-xs border border-[#CBD5E1] rounded px-2.5 py-1.5 outline-none focus:border-[#2563EB]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                      End Time *
                    </label>
                    <input
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      required
                      className="w-full text-xs border border-[#CBD5E1] rounded px-2.5 py-1.5 outline-none focus:border-[#2563EB]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Unpaid Break (Minutes)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="5"
                    value={formData.breakMinutes}
                    onChange={(e) =>
                      setFormData({ ...formData, breakMinutes: parseInt(e.target.value) || 0 })
                    }
                    className="w-full text-xs border border-[#CBD5E1] rounded px-2.5 py-1.5 outline-none focus:border-[#2563EB]"
                  />
                </div>

                {/* INTELLIGENT GUARD SUGGESTION SELECTOR */}
                <div className="border border-[#E2E8F0] rounded p-3 bg-[#F8FAFC]">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-[#0F172A]">
                      Guard Assignment & Conflict Engine
                    </label>
                    {loadingEligible && (
                      <span className="text-[10px] text-[#2563EB] flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Checking conflicts...
                      </span>
                    )}
                  </div>

                  {/* Option for Open Position */}
                  <label className="flex items-center gap-2 p-2 rounded border border-[#E2E8F0] bg-white cursor-pointer hover:bg-slate-50 mb-2">
                    <input
                      type="radio"
                      name="guardAssignment"
                      checked={formData.employeeId === ''}
                      onChange={() => setFormData({ ...formData, employeeId: '' })}
                    />
                    <div>
                      <span className="text-xs font-bold text-amber-800">
                        Leave as Open Position (Unassigned)
                      </span>
                      <p className="text-[10px] text-[#64748B]">
                        Post will appear in roster for dispatchers to assign later.
                      </p>
                    </div>
                  </label>

                  {/* Eligible Guards List */}
                  <div className="max-h-40 overflow-y-auto space-y-1.5">
                    {eligibleEmployees.map((rec) => {
                      const hasConflict = rec.hasConflict;

                      return (
                        <label
                          key={rec.employee.id}
                          className={`flex items-start gap-2 p-2 rounded border transition-colors ${
                            hasConflict
                              ? 'border-rose-200 bg-rose-50/50 cursor-not-allowed opacity-75'
                              : formData.employeeId === rec.employee.id
                              ? 'border-[#2563EB] bg-blue-50/50 cursor-pointer'
                              : 'border-[#E2E8F0] bg-white hover:bg-slate-50 cursor-pointer'
                          }`}
                        >
                          <input
                            type="radio"
                            name="guardAssignment"
                            disabled={hasConflict}
                            checked={formData.employeeId === rec.employee.id}
                            onChange={() => setFormData({ ...formData, employeeId: rec.employee.id })}
                            className="mt-0.5"
                          />
                          <div className="flex-1 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-[#0F172A]">
                                {rec.employee.firstName} {rec.employee.lastName}
                              </span>
                              <span className="text-[10px] text-[#64748B]">
                                {rec.employee.employeeNumber}
                              </span>
                            </div>

                            {hasConflict ? (
                              <div className="flex items-center gap-1 text-[10px] font-semibold text-rose-600 mt-0.5">
                                <AlertTriangle className="h-3 w-3 shrink-0" />
                                Conflict: Already booked ({rec.conflictDetails})
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-[10px] text-[#64748B] mt-0.5">
                                {rec.isAssignedToThisJob ? (
                                  <span className="text-emerald-700 font-medium">
                                    Assigned to this site role (£{rec.assignedPayRate}/hr)
                                  </span>
                                ) : (
                                  <span>Available (No conflicts)</span>
                                )}
                              </div>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Shift Notes */}
                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Shift Instructions & Briefing Notes
                  </label>
                  <textarea
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Specific patrol notes, key sign-out instructions, gate codes..."
                    className="w-full text-xs border border-[#CBD5E1] rounded px-2.5 py-1.5 outline-none focus:border-[#2563EB]"
                  />
                </div>

                {/* Modal Buttons */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="px-3 py-1.5 rounded border border-[#CBD5E1] text-xs font-medium text-[#475569] hover:bg-[#F1F5F9]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-medium transition-colors shadow-sm disabled:opacity-50"
                  >
                    {formLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Confirm & Schedule
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MANAGE SHIFT MODAL */}
        {selectedShiftForEdit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full border border-[#E2E8F0]">
              <div className="flex items-center justify-between p-4 border-b border-[#E2E8F0]">
                <div>
                  <h3 className="text-sm font-bold text-[#0F172A]">Manage Shift</h3>
                  <p className="text-xs text-[#64748B]">Update status or reassign officer.</p>
                </div>
                <button
                  onClick={() => setSelectedShiftForEdit(null)}
                  className="text-[#64748B] hover:text-[#0F172A]"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              </div>

              <div className="p-4 space-y-4 text-xs">
                {/* Shift summary */}
                <div className="bg-[#F8FAFC] p-3 rounded border border-[#E2E8F0] space-y-1.5">
                  <div className="flex items-center justify-between font-bold text-[#0F172A]">
                    <span>{selectedShiftForEdit.site?.name}</span>
                    {getStatusBadge(selectedShiftForEdit.status)}
                  </div>
                  <p className="text-[11px] text-[#64748B]">
                    {selectedShiftForEdit.siteJob?.jobType?.name} • Date: {selectedShiftForEdit.shiftDate}
                  </p>
                  <p className="text-[11px] text-[#64748B]">
                    Hours: {selectedShiftForEdit.startTime} - {selectedShiftForEdit.endTime} (Break: {selectedShiftForEdit.breakMinutes}m)
                  </p>
                  <div className="pt-1">
                    <span className="font-semibold text-[#0F172A]">Current Officer: </span>
                    {selectedShiftForEdit.employee ? (
                      <span className="text-[#2563EB] font-bold">
                        {selectedShiftForEdit.employee.firstName} {selectedShiftForEdit.employee.lastName} ({selectedShiftForEdit.employee.employeeNumber})
                      </span>
                    ) : (
                      <span className="text-amber-800 font-bold">Open Position (Unassigned)</span>
                    )}
                  </div>
                </div>

                {/* Status Changer */}
                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Change Shift Status
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled'] as ShiftStatus[]).map(
                      (st) => (
                        <button
                          key={st}
                          onClick={() => handleUpdateStatus(selectedShiftForEdit.id, st)}
                          className={`py-1.5 px-2 rounded text-xs font-medium border text-center capitalize transition-colors ${
                            selectedShiftForEdit.status === st
                              ? 'bg-[#2563EB] text-white border-[#2563EB]'
                              : 'bg-white text-[#475569] border-[#CBD5E1] hover:bg-slate-50'
                          }`}
                        >
                          {st.replace('_', ' ')}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between">
                  <button
                    onClick={() => handleDeleteShift(selectedShiftForEdit.id)}
                    className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-800 font-medium"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete Shift
                  </button>
                  <button
                    onClick={() => setSelectedShiftForEdit(null)}
                    className="px-3 py-1.5 rounded border border-[#CBD5E1] text-[#475569] hover:bg-slate-50 font-medium"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
