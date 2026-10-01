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
  const { session, role: userRole } = useAuth();
  const token = session?.accessToken;

  const [activeTab, setActiveTab] = useState<'members' | 'invitations'>('members');
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Invite Modal
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<'Manager' | 'Supervisor'>('Manager');
  const [isInviting, setIsInviting] = useState(false);

  // Status Action Loading
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const isOwner = (userRole || '').toUpperCase() === 'OWNER' || (userRole || '').toUpperCase() === 'ADMIN';

  const fetchTeamData = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/team`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load team members');
      const data = await res.json();
      setMembers(data.members || []);
      setPendingInvitations(data.pendingInvitations || []);
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
        const err = await res.json();
        throw new Error(err.message || 'Failed to dispatch invitation');
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
          isOwner ? (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<UserPlus className="h-4 w-4" />}
              onClick={() => setIsInviteOpen(true)}
            >
              Invite Team Member
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
                      {isOwner && <th className="py-3 px-4 text-right">Actions</th>}
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
                          <td className="py-3 px-4 text-[#687086]">
                            {new Date(member.joinedAt).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>
                          {isOwner && (
                            <td className="py-3 px-4 text-right">
                              {!isMemberOwner ? (
                                <Button
                                  variant="outline"
                                  size="xs"
                                  isLoading={actionLoadingId === member.id}
                                  onClick={() => handleToggleStatus(member.id, member.status)}
                                >
                                  {member.status === 'active' ? 'Suspend' : 'Reactivate'}
                                </Button>
                              ) : (
                                <span className="text-[11px] text-gray-400 italic">Owner</span>
                              )}
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
                      {isOwner && <th className="py-3 px-4 text-right">Actions</th>}
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
                          <td className="py-3 px-4 text-amber-600 font-medium">
                            {hoursLeft > 0 ? `${hoursLeft} hours remaining` : 'Expired'}
                          </td>
                          <td className="py-3 px-4 text-[#687086]">
                            {new Date(inv.createdAt).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>
                          {isOwner && (
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

        {/* Invite Team Member Modal */}
        <Modal
          isOpen={isInviteOpen}
          onClose={() => setIsInviteOpen(false)}
          title="Invite Internal Team Member"
        >
          <form onSubmit={handleSendInvite} className="space-y-4">
            <p className="text-xs text-[#687086]">
              A cryptographic single-use invitation link will be dispatched via Brevo. The team member will
              create their own password upon opening the link.
            </p>

            <div className="space-y-1">
              <label className="text-xs font-medium text-[#687086]">Work Email Address</label>
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
              <label className="text-xs font-medium text-[#687086]">Designated Role</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as any)}
                className="w-full h-10 px-3 rounded-lg border border-[#E5E3F2] text-xs text-[#171A2B] focus:outline-none focus:border-[#6C5CE7] bg-white"
              >
                <option value="Manager">Manager (Full workforce & sites configuration)</option>
                <option value="Supervisor">Operator (Day-to-day rostering & attendance)</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#E5E3F2]">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsInviteOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isInviting}>
                Send Brevo Invitation
              </Button>
            </div>
          </form>
        </Modal>
      </PageContainer>
    </AppShell>
  );
}
