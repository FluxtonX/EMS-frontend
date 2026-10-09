'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchMyLicences, createMyLicence } from '@/lib/api/me';
import {
  ShieldCheck,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  FileCheck,
  Shield,
  Plus,
  Upload,
  Image as ImageIcon,
  Clock,
  XCircle,
  Eye,
  X,
  AlertCircle,
} from 'lucide-react';
import { Button, Input, Badge, Modal, TableSkeleton, EmptyState } from '@/components/ui';
import { toast } from '@/lib/toastStore';

export default function EmployeeLicencesPage() {
  const queryClient = useQueryClient();
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // Form State
  const [licenceType, setLicenceType] = useState('SIA Door Supervisor');
  const [licenceNumber, setLicenceNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');

  const { data: licences = [], isLoading } = useQuery({
    queryKey: ['my-licences'],
    queryFn: fetchMyLicences,
  });

  const submitMutation = useMutation({
    mutationFn: () =>
      createMyLicence({
        licenceType,
        licenceNumber: licenceNumber.trim(),
        expiryDate,
        documentUrl: documentUrl || undefined,
      }),
    onSuccess: () => {
      toast.success('SIA Licence submitted successfully for company verification.');
      setIsSubmitModalOpen(false);
      setLicenceType('SIA Door Supervisor');
      setLicenceNumber('');
      setExpiryDate('');
      setDocumentUrl('');
      queryClient.invalidateQueries({ queryKey: ['my-licences'] });
      queryClient.invalidateQueries({ queryKey: ['my-overview'] });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to submit SIA licence.');
    },
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds 5MB limit.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setDocumentUrl(reader.result);
        toast.success('Licence photo attached.');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanLicenceNumber = licenceNumber.replace(/\D/g, '');
    if (!cleanLicenceNumber) {
      toast.error('Please enter your 16-digit SIA licence number.');
      return;
    }
    if (cleanLicenceNumber.length !== 16) {
      toast.error(`SIA Licence Number must be exactly 16 digits (currently ${cleanLicenceNumber.length} digits).`);
      return;
    }
    if (!expiryDate) {
      toast.error('Please select your licence expiry date.');
      return;
    }
    submitMutation.mutate();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-lg bg-purple-50 text-[#6C5CE7] border border-purple-100">
            <ShieldCheck className="w-5 h-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Licences & Compliance</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Active Security Industry Authority (SIA) licences and statutory qualifications on file.
            </p>
          </div>
        </div>

        <Button
          onClick={() => setIsSubmitModalOpen(true)}
          className="bg-[#6C5CE7] hover:bg-[#5b4bc4] text-white shadow-sm flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Submit SIA Licence
        </Button>
      </div>

      {isLoading ? (
        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <TableSkeleton rows={3} cols={3} />
        </div>
      ) : licences.length === 0 ? (
        <div className="bg-white rounded-xl p-8 border border-slate-200 text-center">
          <EmptyState
            icon={<Shield className="h-8 w-8 text-[#6C5CE7]" />}
            title="No SIA licences submitted"
            description="Your company profile currently has no verified SIA licence on file. Upload your SIA licence photo & badge number to enable shift assignments."
            action={
              <Button
                onClick={() => setIsSubmitModalOpen(true)}
                className="bg-[#6C5CE7] hover:bg-[#5b4bc4] text-white shadow-sm flex items-center gap-2 mt-4"
              >
                <Plus className="w-4 h-4" />
                Upload SIA Licence Photo
              </Button>
            }
          />
        </div>
      ) : (
        <div className="space-y-4">
          {licences.map((lic: any) => {
            const expiry = new Date(lic.expiryDate);
            const now = new Date();
            const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 3600 * 24));
            const isExpiringSoon = daysLeft <= 30 && daysLeft > 0;
            const isExpired = daysLeft <= 0;

            return (
              <div
                key={lic.id || lic.licenceNumber}
                className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_3px_rgba(0,0,0,0.05)]"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex items-start gap-4">
                    {/* Badge Image Thumbnail or Fallback Icon */}
                    {lic.documentUrl ? (
                      <div
                        onClick={() => setPreviewImageUrl(lic.documentUrl)}
                        className="relative group w-16 h-16 rounded-xl overflow-hidden border-2 border-purple-200 bg-slate-100 shrink-0 cursor-pointer shadow-sm hover:ring-2 hover:ring-[#6C5CE7]"
                        title="Click to view full licence photo"
                      >
                        <img
                          src={lic.documentUrl}
                          alt="SIA Badge"
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <Eye className="w-5 h-5" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-purple-50 text-[#6C5CE7] border border-purple-100 flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-6 h-6" />
                      </div>
                    )}

                    <div>
                      <div className="font-bold text-slate-900 text-base flex items-center gap-2">
                        {lic.licenceType}
                      </div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">
                        Badge Number: <span className="font-bold text-slate-800 tracking-wider">{lic.licenceNumber}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          Expiry: {expiry.toLocaleDateString('en-GB')}
                        </span>
                        <span className="text-slate-300">·</span>
                        {isExpired ? (
                          <span className="text-rose-600 font-semibold">Expired</span>
                        ) : isExpiringSoon ? (
                          <span className="text-amber-600 font-semibold">{daysLeft} days remaining</span>
                        ) : (
                          <span className="text-emerald-600 font-medium">{daysLeft} days remaining</span>
                        )}
                        {lic.documentUrl && (
                          <>
                            <span className="text-slate-300">·</span>
                            <button
                              onClick={() => setPreviewImageUrl(lic.documentUrl)}
                              className="text-[#6C5CE7] hover:underline font-semibold text-[11px] flex items-center gap-1"
                            >
                              <ImageIcon className="w-3 h-3" /> View Photo
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="self-start sm:self-auto flex items-center gap-2">
                    {lic.status === 'valid' ? (
                      <Badge variant="success" className="capitalize text-xs font-semibold px-2.5 py-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Verified Compliant
                      </Badge>
                    ) : lic.status === 'pending_verification' ? (
                      <Badge variant="warning" className="capitalize text-xs font-semibold px-2.5 py-1 flex items-center gap-1 bg-purple-50 text-[#6C5CE7] border-purple-200">
                        <Clock className="w-3.5 h-3.5 text-[#6C5CE7]" />
                        Awaiting Verification
                      </Badge>
                    ) : lic.status === 'rejected' ? (
                      <Badge variant="danger" className="capitalize text-xs font-semibold px-2.5 py-1 flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                        Rejected
                      </Badge>
                    ) : (
                      <Badge variant="warning" className="capitalize text-xs font-semibold px-2.5 py-1">
                        {lic.status?.replace('_', ' ')}
                      </Badge>
                    )}
                  </div>
                </div>

                {isExpiringSoon && (
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      Your licence is expiring soon. Please upload your renewed SIA licence photo to prevent shift assignment hold.
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Submit SIA Licence Modal */}
      <Modal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        title="Submit SIA Licence & Photo"
        description="Upload your official Security Industry Authority (SIA) licence details for manager verification."
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Licence Category <span className="text-rose-500">*</span>
            </label>
            <select
              value={licenceType}
              onChange={(e) => setLicenceType(e.target.value)}
              className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/20 focus:border-[#6C5CE7]"
            >
              <option value="SIA Door Supervisor">SIA Door Supervisor</option>
              <option value="SIA Security Guard">SIA Security Guard</option>
              <option value="SIA CCTV Surveillance">SIA CCTV Surveillance</option>
              <option value="SIA Close Protection">SIA Close Protection</option>
              <option value="SIA Cash & Valuables in Transit">SIA Cash & Valuables in Transit</option>
              <option value="Other Security Licence">Other Security Licence</option>
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                16-Digit SIA Licence Number <span className="text-rose-500">*</span>
              </label>
              <span
                className={`text-[11px] font-mono font-bold ${
                  licenceNumber.length === 16 ? 'text-emerald-600' : 'text-slate-400'
                }`}
              >
                {licenceNumber.length}/16 digits
              </span>
            </div>
            <Input
              value={licenceNumber}
              onChange={(e) => setLicenceNumber(e.target.value.replace(/\D/g, '').slice(0, 16))}
              placeholder="e.g. 1002938475610293"
              maxLength={16}
              className={`text-sm font-mono tracking-wider ${
                licenceNumber.length > 0 && licenceNumber.length < 16
                  ? 'border-amber-300 focus:border-amber-500'
                  : licenceNumber.length === 16
                  ? 'border-emerald-400 focus:border-emerald-500'
                  : ''
              }`}
              required
            />
            {licenceNumber.length > 0 && licenceNumber.length < 16 && (
              <p className="text-[11px] text-amber-600 mt-1 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                Must be exactly 16 digits ({16 - licenceNumber.length} more needed)
              </p>
            )}
            {licenceNumber.length === 16 && (
              <p className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Valid 16-digit SIA badge format
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Expiry Date <span className="text-rose-500">*</span>
            </label>
            <Input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="text-sm"
              required
            />
          </div>

          {/* SIA Licence Badge Image Upload */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Upload SIA Badge Image / Photo <span className="text-slate-400 font-normal">(Recommended)</span>
            </label>
            <div className="border-2 border-dashed border-slate-200 hover:border-[#6C5CE7] rounded-xl p-4 bg-slate-50/50 text-center transition-colors">
              {documentUrl ? (
                <div className="flex items-center justify-between gap-3 bg-white p-2.5 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-3">
                    <img src={documentUrl} alt="Preview" className="w-12 h-12 object-cover rounded-md border" />
                    <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Photo Attached
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDocumentUrl('')}
                    className="p-1 rounded-md text-slate-400 hover:text-rose-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label htmlFor="licence-photo-upload" className="cursor-pointer space-y-2 block">
                  <div className="w-10 h-10 rounded-full bg-purple-50 text-[#6C5CE7] flex items-center justify-center mx-auto">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div className="text-xs text-slate-600">
                    <span className="font-bold text-[#6C5CE7]">Click to upload</span> front of SIA licence badge photo
                  </div>
                  <div className="text-[10px] text-slate-400">PNG, JPG or WEBP (Max 5MB)</div>
                </label>
              )}
              <input
                id="licence-photo-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsSubmitModalOpen(false)}
              disabled={submitMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitMutation.isPending}
              className="bg-[#6C5CE7] hover:bg-[#5b4bc4] text-white shadow-sm"
            >
              {submitMutation.isPending ? 'Submitting...' : 'Submit for Verification'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Full Photo Modal Preview */}
      {previewImageUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="relative bg-white rounded-2xl max-w-xl w-full p-4 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#6C5CE7]" />
                SIA Licence Badge Photo
              </h3>
              <button
                onClick={() => setPreviewImageUrl(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center max-h-[70vh]">
              <img src={previewImageUrl} alt="SIA Licence Full Preview" className="max-h-[70vh] w-auto object-contain" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
