'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PageContainer } from '@/components/layout/PageContainer';
import { useAuth } from '@/lib/auth/AuthContext';
import { Button, Modal, TableSkeleton } from '@/components/ui';
import {
  Users,
  UserPlus,
  Mail,
  Shield,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Trash2,
  Lock,
  Search,
  Filter,
  MoreVertical,
  Eye,
  EyeOff,
  Copy,
  Check,
  KeyRound,
} from 'lucide-react';
import { toast } from '@/lib/toastStore';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

interface TeamMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  status: 'active' | 'suspended';
  joinedAt: string;
}

interface PendingInvitation {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: string;
  createdAt: string;
}

export default function TeamPage() {
  const [mounted, setMounted] = useState(false);
  const { session, role: userRole } = useAuth();
  const token = session?.accessToken;

  const [activeTab, setActiveTab] = useState<'members' | 'invitations'>('members');
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal & Mode State
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'manual' | 'invite'>('manual');

  // Email Invite Form
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<'Manager' | 'Supervisor'>('Manager');
  const [isInviting, setIsInviting] = useState(false);

  // Manual Add Form State
  const [manualFirstName, setManualFirstName] = useState('');
  const [manualLastName, setManualLastName] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualRole, setManualRole] = useState<'Manager' | 'Supervisor'>('Manager');
  const [manualPassword, setManualPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isCreatingManual, setIsCreatingManual] = useState(false);

  // Success Credential Handover
  const [createdCredentials, setCreatedCredentials] = useState<{
    name: string;
    email: string;
    role: string;
    password: string;
  } | null>(null);
  const [hasCopiedCredentials, setHasCopiedCredentials] = useState(false);
  const [hasCopiedPassword, setHasCopiedPassword] = useState(false);

  // Status Action Loading
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [selectedViewMember, setSelectedViewMember] = useState<TeamMember | null>(null);

  const isOwner = (userRole || '').toUpperCase() === 'OWNER' || (userRole || '').toUpperCase() === 'ADMIN';

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchTeamData = async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/team`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Your login session has expired. Please log out and sign in again.');
        }
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error?.message || errJson.message || 'Failed to load team members');
      }
      const data = await res.json();
      const payload = data.data !== undefined ? data.data : data;
      setMembers(payload.members || []);
      setPendingInvitations(payload.pendingInvitations || []);
    } catch (err: any) {
      toast.error(err.message || 'Error fetching team data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setIsInviting(true);

    try {
      const res = await fetch(`${API_BASE_URL}/team/invite`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: inviteEmail,
          name: inviteName || undefined,
          role: inviteRole,
        }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Your login session has expired. Please log out and sign in again.');
        }
        const err = await res.json();
        const errorMsg =
          (Array.isArray(err.error?.details) ? err.error.details.join(', ') : null) ||
          err.error?.message ||
          err.message ||
          'Failed to dispatch invitation';
        throw new Error(errorMsg);
      }

      toast.success(`Invitation dispatched to ${inviteEmail} via Brevo.`);
      setIsInviteOpen(false);
      setInviteEmail('');
      setInviteName('');
      setInviteRole('Manager');
      fetchTeamData();
    } catch (err: any) {
      toast.error(err.message || 'Invitation failed');
    } finally {
      setIsInviting(false);
    }
  };

  const handleCloseModal = () => {
    setIsInviteOpen(false);
    setCreatedCredentials(null);
    setShowPassword(false);
    setHasCopiedCredentials(false);
    setHasCopiedPassword(false);
  };

  const handleGeneratePassword = () => {
    const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lowercase = 'abcdefghijkmnpqrstuvwxyz';
    const digits = '23456789';
    const symbols = '!@#$%&*';
    const all = uppercase + lowercase + digits + symbols;
    let pwd = '';
    pwd += uppercase[Math.floor(Math.random() * uppercase.length)];
    pwd += lowercase[Math.floor(Math.random() * lowercase.length)];
    pwd += digits[Math.floor(Math.random() * digits.length)];
    pwd += symbols[Math.floor(Math.random() * symbols.length)];
    for (let i = 4; i < 12; i++) {
      pwd += all[Math.floor(Math.random() * all.length)];
    }
    const shuffled = pwd.split('').sort(() => 0.5 - Math.random()).join('');
    setManualPassword(shuffled);
    setShowPassword(true);
    toast.success('Generated a secure password!');
  };

  const handleCreateManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (!manualFirstName.trim() || !manualLastName.trim() || !manualEmail.trim()) {
      toast.error('Please enter first name, last name, and work email.');
      return;
    }

    if (manualPassword.length < 8) {
      toast.error('Password must be at least 8 characters long.');
      return;
    }

    setIsCreatingManual(true);
    try {
      const res = await fetch(`${API_BASE_URL}/team/manual`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: manualFirstName.trim(),
          lastName: manualLastName.trim(),
          email: manualEmail.trim(),
          phone: manualPhone.trim() || undefined,
          role: manualRole,
          password: manualPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Your login session has expired. Please log out and sign in again.');
        }
        const errorMsg =
          (Array.isArray(data.error?.details) ? data.error.details.join(', ') : null) ||
          data.error?.message ||
          data.message ||
          'Failed to create team member';
        throw new Error(errorMsg);
      }

      toast.success(`Team member ${manualFirstName} ${manualLastName} created successfully!`);

      // Store created credentials for direct handover view
      setCreatedCredentials({
        name: `${manualFirstName.trim()} ${manualLastName.trim()}`,
        email: manualEmail.trim().toLowerCase(),
        role: manualRole === 'Supervisor' ? 'Operator' : manualRole,
        password: manualPassword,
      });

      // Clear input fields
      setManualFirstName('');
      setManualLastName('');
      setManualEmail('');
      setManualPhone('');
      setManualPassword('');
      setManualRole('Manager');

      fetchTeamData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create team member');
    } finally {
      setIsCreatingManual(false);
    }
  };

  const handleResendInvite = async (invitationId: string) => {
    if (!token) return;
    setActionLoadingId(invitationId);
    try {
      const res = await fetch(`${API_BASE_URL}/team/invitations/${invitationId}/resend`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to resend invitation');
      toast.success('Invitation resent successfully.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to resend invitation');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRevokeInvite = async (invitationId: string) => {
    if (!token || !confirm('Are you sure you want to revoke this invitation?')) return;
    setActionLoadingId(invitationId);
    try {
      const res = await fetch(`${API_BASE_URL}/team/invitations/${invitationId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to revoke invitation');
      toast.info('Invitation revoked.');
      fetchTeamData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to revoke');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleStatus = async (memberId: string, currentStatus: string) => {
    if (!token) return;
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    setActionLoadingId(memberId);
    try {
      const res = await fetch(`${API_BASE_URL}/team/members/${memberId}/status`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to update member status');
      }
      toast.success(`Member status updated to ${newStatus}.`);
      fetchTeamData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status');
    } finally {
      setActionLoadingId(null);
    }
  };

  // KPI Calculations
  const totalCount = members.length;
  const managersCount = members.filter((m) => (m.role || '').toLowerCase() === 'manager').length;
  const operatorsCount = members.filter(
    (m) => (m.role || '').toLowerCase() === 'supervisor' || (m.role || '').toLowerCase() === 'operator'
  ).length;
  const pendingCount = pendingInvitations.length;

  const filteredMembers = members.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredInvitations = pendingInvitations.filter(
    (inv) =>
      inv.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppShell>
      <PageContainer
        title="Team Members"
        subtitle="Manage internal management users, role permissions, and access invitations."
        primaryAction={
          mounted && isOwner ? (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<UserPlus className="h-4 w-4" />}
              onClick={() => {
                setModalMode('manual');
                setCreatedCredentials(null);
                setIsInviteOpen(true);
              }}
            >
              Add Team Member
            </Button>
          ) : undefined
        }
      >
        {/* KPI Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-6">
          <div className="bg-white p-5 rounded-2xl border border-[#E5E3F2] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_3px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between text-[#687086] mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Team</span>
              <Users className="h-4 w-4 text-[#6C5CE7]" />
            </div>
            <div className="text-2xl font-bold text-[#171A2B]">{totalCount}</div>
            <div className="text-xs text-[#687086] mt-1">Internal portal staff</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E5E3F2] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_3px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between text-[#687086] mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Managers</span>
              <Shield className="h-4 w-4 text-[#6C5CE7]" />
            </div>
            <div className="text-2xl font-bold text-[#171A2B]">{managersCount}</div>
            <div className="text-xs text-[#687086] mt-1">Workforce operations control</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E5E3F2] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_3px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between text-[#687086] mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Operators</span>
              <Users className="h-4 w-4 text-[#6C5CE7]" />
            </div>
            <div className="text-2xl font-bold text-[#171A2B]">{operatorsCount}</div>
            <div className="text-xs text-[#687086] mt-1">Rostering & attendance</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E5E3F2] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_3px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between text-[#687086] mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Pending Invites</span>
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-amber-600">{pendingCount}</div>
            <div className="text-xs text-[#687086] mt-1">Awaiting user activation</div>
          </div>
        </div>

        {/* Tab & Search Filter Bar */}
        <div className="bg-white rounded-2xl border border-[#E5E3F2] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_3px_rgba(0,0,0,0.05)] mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 p-1 bg-[#F5F3FF] rounded-xl border border-[#E5E3F2]">
              <button
                onClick={() => setActiveTab('members')}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'members'
                    ? 'bg-[#6C5CE7] text-white shadow-sm'
                    : 'text-[#687086] hover:text-[#171A2B]'
                }`}
              >
                Active Members ({members.length})
              </button>
              <button
                onClick={() => setActiveTab('invitations')}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'invitations'
                    ? 'bg-[#6C5CE7] text-white shadow-sm'
                    : 'text-[#687086] hover:text-[#171A2B]'
                }`}
              >
                Pending Invitations ({pendingInvitations.length})
              </button>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-3 rounded-lg border border-[#E5E3F2] text-xs text-[#171A2B] focus:outline-none focus:border-[#6C5CE7]"
              />
            </div>
          </div>

          {/* Members Table */}
          {activeTab === 'members' && (
            <div className="overflow-x-auto">
              {isLoading ? (
                <TableSkeleton cols={5} rows={4} />
              ) : filteredMembers.length === 0 ? (
                <div className="text-center py-12 text-[#687086] text-xs">
                  No internal team members found matching your search.
                </div>
              ) : (
                <table className="w-full text-left text-xs text-[#171A2B]">
                  <thead className="bg-[#FAF9FF] text-[#687086] font-semibold border-b border-[#E5E3F2]">
                    <tr>
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Joined Date</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E3F2]">
                    {filteredMembers.map((member) => {
                      const isMemberOwner = (member.role || '').toLowerCase() === 'owner';
                      return (
                        <tr key={member.id} className="hover:bg-[#FAF9FF] transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-semibold text-[#171A2B]">{member.name}</div>
                            <div className="text-[11px] text-[#687086] flex items-center gap-1.5 mt-0.5">
                              <Mail className="h-3 w-3" />
                              {member.email}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#EDE9FE] text-[#6C5CE7]">
                              {member.role === 'Supervisor' ? 'Operator' : member.role}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                                member.status === 'active'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-red-50 text-red-600'
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  member.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'
                                }`}
                              />
                              {member.status === 'active' ? 'Active' : 'Suspended'}
                            </span>
                          </td>
                          <td suppressHydrationWarning className="py-3 px-4 text-[#687086]">
                            {new Date(member.joinedAt).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="xs"
                                leftIcon={<Eye className="h-3.5 w-3.5 text-slate-500" />}
                                onClick={() => setSelectedViewMember(member)}
                              >
                                View
                              </Button>
                              {mounted && isOwner && !isMemberOwner && (
                                <Button
                                  variant="outline"
                                  size="xs"
                                  isLoading={actionLoadingId === member.id}
                                  onClick={() => handleToggleStatus(member.id, member.status)}
                                >
                                  {member.status === 'active' ? 'Suspend' : 'Reactivate'}
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Pending Invitations Table */}
          {activeTab === 'invitations' && (
            <div className="overflow-x-auto">
              {isLoading ? (
                <TableSkeleton cols={5} rows={3} />
              ) : filteredInvitations.length === 0 ? (
                <div className="text-center py-12 text-[#687086] text-xs">
                  No pending invitations found. Click &quot;Invite Team Member&quot; to send an invite.
                </div>
              ) : (
                <table className="w-full text-left text-xs text-[#171A2B]">
                  <thead className="bg-[#FAF9FF] text-[#687086] font-semibold border-b border-[#E5E3F2]">
                    <tr>
                      <th className="py-3 px-4">Invited Email</th>
                      <th className="py-3 px-4">Designated Role</th>
                      <th className="py-3 px-4">Expires In</th>
                      <th className="py-3 px-4">Sent Date</th>
                      {mounted && isOwner && <th className="py-3 px-4 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E3F2]">
                    {filteredInvitations.map((inv) => {
                      const hoursLeft = Math.max(
                        0,
                        Math.round((new Date(inv.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60))
                      );
                      return (
                        <tr key={inv.id} className="hover:bg-[#FAF9FF] transition-colors">
                          <td className="py-3 px-4 font-medium text-[#171A2B]">{inv.email}</td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#EDE9FE] text-[#6C5CE7]">
                              {inv.role === 'Supervisor' ? 'Operator' : inv.role}
                            </span>
                          </td>
                          <td suppressHydrationWarning className="py-3 px-4 text-amber-600 font-medium">
                            {hoursLeft > 0 ? `${hoursLeft} hours remaining` : 'Expired'}
                          </td>
                          <td suppressHydrationWarning className="py-3 px-4 text-[#687086]">
                            {new Date(inv.createdAt).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>
                          {mounted && isOwner && (
                            <td className="py-3 px-4 text-right space-x-2">
                              <Button
                                variant="outline"
                                size="xs"
                                leftIcon={<RefreshCw className="h-3 w-3" />}
                                isLoading={actionLoadingId === inv.id}
                                onClick={() => handleResendInvite(inv.id)}
                              >
                                Resend
                              </Button>
                              <Button
                                variant="outline"
                                size="xs"
                                className="text-red-600 hover:bg-red-50 hover:border-red-200"
                                leftIcon={<Trash2 className="h-3 w-3" />}
                                isLoading={actionLoadingId === inv.id}
                                onClick={() => handleRevokeInvite(inv.id)}
                              >
                                Revoke
                              </Button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>

        {/* Add / Invite Team Member Modal */}
        <Modal
          isOpen={isInviteOpen}
          onClose={handleCloseModal}
          maxWidth="lg"
          title={
            createdCredentials
              ? 'Account Credentials Ready'
              : modalMode === 'manual'
              ? 'Add Internal Team Member'
              : 'Invite Team Member via Email'
          }
        >
          {createdCredentials ? (
            /* Direct Credential Handover Screen */
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3.5 bg-[#FAF9FF] border border-[#D5D0FA] rounded-xl">
                <div className="h-10 w-10 rounded-full bg-[#EDE9FE] flex items-center justify-center text-[#6C5CE7] shrink-0">
                  <CheckCircle className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[#171A2B]">Account Ready for Handover</h4>
                  <p className="text-xs text-[#687086]">
                    This account is activated immediately. Securely provide these login credentials to the team member.
                  </p>
                </div>
              </div>

              <div className="bg-[#FAF9FF] border border-[#E5E3F2] rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#E5E3F2]">
                  <span className="text-xs font-medium text-[#687086]">Member Name</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#171A2B]">{createdCredentials.name}</span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                        createdCredentials.role === 'Manager'
                          ? 'bg-[#EDE9FE] text-[#6C5CE7] border border-[#D5D0FA]'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {createdCredentials.role}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="text-xs font-medium text-[#687086]">Login Email</span>
                  <div className="flex items-center gap-1.5">
                    <code className="text-xs font-mono font-medium text-[#171A2B] bg-white px-2 py-1 rounded border border-[#E5E3F2]">
                      {createdCredentials.email}
                    </code>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(createdCredentials.email);
                        toast.success('Email copied to clipboard');
                      }}
                      className="p-1 text-[#687086] hover:text-[#6C5CE7] transition-colors rounded"
                      title="Copy Email"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-medium text-[#687086]">Assigned Password</span>
                  <div className="flex items-center gap-1.5">
                    <code className="text-xs font-mono font-semibold text-[#6C5CE7] bg-white px-2 py-1 rounded border border-[#D5D0FA]">
                      {createdCredentials.password}
                    </code>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(createdCredentials.password);
                        setHasCopiedPassword(true);
                        toast.success('Password copied to clipboard');
                        setTimeout(() => setHasCopiedPassword(false), 2000);
                      }}
                      className="p-1 text-[#687086] hover:text-[#6C5CE7] transition-colors rounded"
                      title="Copy Password"
                    >
                      {hasCopiedPassword ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#E5E3F2]">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  leftIcon={
                    hasCopiedCredentials ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )
                  }
                  onClick={() => {
                    const origin = typeof window !== 'undefined' ? window.location.origin : '';
                    const creds = `Apex Workforce Team Access:\nName: ${createdCredentials.name}\nRole: ${createdCredentials.role}\nEmail: ${createdCredentials.email}\nPassword: ${createdCredentials.password}\nLogin URL: ${origin}/login`;
                    navigator.clipboard.writeText(creds);
                    setHasCopiedCredentials(true);
                    toast.success('All credentials copied to clipboard!');
                    setTimeout(() => setHasCopiedCredentials(false), 2500);
                  }}
                >
                  {hasCopiedCredentials ? 'Credentials Copied!' : 'Copy All Credentials'}
                </Button>

                <Button type="button" variant="primary" size="sm" onClick={handleCloseModal}>
                  Done
                </Button>
              </div>
            </div>
          ) : (
            <div>
              {/* Segmented Mode Switcher */}
              <div className="flex p-1 bg-[#F5F3FF] border border-[#D5D0FA] rounded-xl mb-4">
                <button
                  type="button"
                  onClick={() => setModalMode('manual')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
                    modalMode === 'manual'
                      ? 'bg-[#6C5CE7] text-white shadow-sm'
                      : 'text-[#687086] hover:text-[#171A2B]'
                  }`}
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  Manual Add
                </button>
                <button
                  type="button"
                  onClick={() => setModalMode('invite')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
                    modalMode === 'invite'
                      ? 'bg-[#6C5CE7] text-white shadow-sm'
                      : 'text-[#687086] hover:text-[#171A2B]'
                  }`}
                >
                  <Mail className="h-3.5 w-3.5" />
                  Send Email Invite
                </button>
              </div>

              {modalMode === 'manual' ? (
                /* Manual Creation Form with Direct Password Assignment */
                <form onSubmit={handleCreateManual} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-[#687086]">First Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. John"
                        value={manualFirstName}
                        onChange={(e) => setManualFirstName(e.target.value)}
                        className="w-full h-10 px-3 rounded-lg border border-[#E5E3F2] text-xs text-[#171A2B] focus:outline-none focus:border-[#6C5CE7]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-[#687086]">Last Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Doe"
                        value={manualLastName}
                        onChange={(e) => setManualLastName(e.target.value)}
                        className="w-full h-10 px-3 rounded-lg border border-[#E5E3F2] text-xs text-[#171A2B] focus:outline-none focus:border-[#6C5CE7]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-[#687086]">Work Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="john.doe@company.co.uk"
                      value={manualEmail}
                      onChange={(e) => setManualEmail(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-[#E5E3F2] text-xs text-[#171A2B] focus:outline-none focus:border-[#6C5CE7]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-[#687086]">Phone Number (Optional)</label>
                      <input
                        type="tel"
                        placeholder="+44 7700 900077"
                        value={manualPhone}
                        onChange={(e) => setManualPhone(e.target.value)}
                        className="w-full h-10 px-3 rounded-lg border border-[#E5E3F2] text-xs text-[#171A2B] focus:outline-none focus:border-[#6C5CE7]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-[#687086]">Designated Role *</label>
                      <select
                        value={manualRole}
                        onChange={(e) => setManualRole(e.target.value as any)}
                        className="w-full h-10 px-3 rounded-lg border border-[#E5E3F2] text-xs text-[#171A2B] focus:outline-none focus:border-[#6C5CE7] bg-white font-medium"
                      >
                        <option value="Manager">Manager (Operations Control)</option>
                        <option value="Supervisor">Operator (Rosters & Attendance)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-[#687086]">Initial Password *</label>
                      <button
                        type="button"
                        onClick={handleGeneratePassword}
                        className="text-xs font-semibold text-[#6C5CE7] hover:text-[#5A4ACD] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <KeyRound className="h-3 w-3" />
                        Generate Strong Password
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={8}
                        placeholder="Enter secure password (min. 8 characters)"
                        value={manualPassword}
                        onChange={(e) => setManualPassword(e.target.value)}
                        className="w-full h-10 pl-3 pr-10 rounded-lg border border-[#E5E3F2] text-xs font-mono text-[#171A2B] focus:outline-none focus:border-[#6C5CE7]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#687086] hover:text-[#171A2B] transition-colors"
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="text-[11px] text-[#687086]">
                      Minimum 8 characters. You will provide this password directly to the member.
                    </p>
                  </div>


                  <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#E5E3F2]">
                    <Button type="button" variant="outline" size="sm" onClick={handleCloseModal}>
                      Cancel
                    </Button>
                    <Button type="submit" variant="primary" size="sm" isLoading={isCreatingManual}>
                      Create Team Member
                    </Button>
                  </div>
                </form>
              ) : (
                /* Standard Email Invite Form via Brevo */
                <form onSubmit={handleSendInvite} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-[#687086]">Work Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="colleague@company.co.uk"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-[#E5E3F2] text-xs text-[#171A2B] focus:outline-none focus:border-[#6C5CE7]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-[#687086]">Full Name (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Jane Smith"
                      value={inviteName}
                      onChange={(e) => setInviteName(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-[#E5E3F2] text-xs text-[#171A2B] focus:outline-none focus:border-[#6C5CE7]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-[#687086]">Designated Role *</label>
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as any)}
                      className="w-full h-10 px-3 rounded-lg border border-[#E5E3F2] text-xs text-[#171A2B] focus:outline-none focus:border-[#6C5CE7] bg-white font-medium"
                    >
                      <option value="Manager">Manager (Operations Control)</option>
                      <option value="Supervisor">Operator (Rosters & Attendance)</option>
                    </select>
                  </div>

                  <div className="p-3 bg-[#FAF9FF] border border-[#D5D0FA] rounded-xl flex items-start gap-2.5 text-xs text-[#5A4ACD]">
                    <Mail className="h-4 w-4 shrink-0 mt-0.5 text-[#6C5CE7]" />
                    <span>
                      An activation email containing a secure 72-hour one-time link will be sent via Brevo transactional pipeline.
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#E5E3F2]">
                    <Button type="button" variant="outline" size="sm" onClick={handleCloseModal}>
                      Cancel
                    </Button>
                    <Button type="submit" variant="primary" size="sm" isLoading={isInviting}>
                      Send Invitation
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}
        </Modal>

        {/* View Team Member Profile Modal */}
        {selectedViewMember && (
          <Modal
            isOpen={!!selectedViewMember}
            onClose={() => setSelectedViewMember(null)}
            title="Team Member Profile"
          >
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EDE9FE] text-[#6C5CE7] font-bold text-lg">
                  {selectedViewMember.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-slate-900">{selectedViewMember.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#EDE9FE] text-[#6C5CE7]">
                      {selectedViewMember.role === 'Supervisor' ? 'Operator' : selectedViewMember.role}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                        selectedViewMember.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-red-50 text-red-600'
                      }`}
                    >
                      {selectedViewMember.status === 'active' ? 'Active' : 'Suspended'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 text-xs text-slate-700">
                <div className="flex items-center justify-between p-3 bg-white border border-slate-200/80 rounded-xl">
                  <span className="text-slate-500 flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-slate-400" /> Email:</span>
                  <span className="font-semibold text-slate-900">{selectedViewMember.email}</span>
                </div>
                {selectedViewMember.phone && (
                  <div className="flex items-center justify-between p-3 bg-white border border-slate-200/80 rounded-xl">
                    <span className="text-slate-500 flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-slate-400" /> Phone:</span>
                    <span className="font-semibold text-slate-900">{selectedViewMember.phone}</span>
                  </div>
                )}
                <div className="flex items-center justify-between p-3 bg-white border border-slate-200/80 rounded-xl">
                  <span className="text-slate-500 flex items-center gap-1.5"><Shield className="h-3.5 w-3.5 text-slate-400" /> Access Level:</span>
                  <span className="font-semibold text-slate-900">Internal Management ({selectedViewMember.role})</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white border border-slate-200/80 rounded-xl">
                  <span className="text-slate-500 flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-slate-400" /> Joined Date:</span>
                  <span className="font-semibold text-slate-900">
                    {new Date(selectedViewMember.joinedAt).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-200">
                <Button variant="outline" size="sm" onClick={() => setSelectedViewMember(null)}>
                  Close
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  className="bg-[#6C5CE7] text-white"
                  onClick={() => {
                    const mId = selectedViewMember.id;
                    setSelectedViewMember(null);
                    window.location.href = `/chat?employeeId=${mId}`;
                  }}
                >
                  Message Team Member
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </PageContainer>
    </AppShell>
  );
}
