import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import {
  Users,
  Search,
  Trash2,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Shield,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  Filter,
  Check,
  Copy,
  X,
  UserCheck,
  UserX,
  Sparkles
} from 'lucide-react';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalVerified: 0,
    totalStudents: 0,
    totalPending: 0
  });

  // Search & Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Pagination State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
    hasPrev: false,
    hasNext: false
  });

  // Delete Modal State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Copy Feedback State
  const [copiedId, setCopiedId] = useState(null);

  // Bulk Selection State
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  // Feedback State
  const [alertMsg, setAlertMsg] = useState(null);

  // Copy handle to clipboard
  const handleCopy = (text, id) => {
    if (!text) return;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Load Users from Backend Directory
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/users-directory', {
        params: {
          page,
          limit,
          search: search.trim() || undefined,
          role: roleFilter !== 'all' ? roleFilter : undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined
        }
      });

      if (res.data?.success) {
        setUsers(res.data.users || []);
        if (res.data.stats) {
          setStats(res.data.stats);
        }
        if (res.data.pagination) {
          setPagination(res.data.pagination);
        }
      }
    } catch (err) {
      console.error('Fetch users error:', err);
      setAlertMsg({
        type: 'error',
        text: err.response?.data?.error || 'Failed to load user directory.'
      });
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, roleFilter, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle Search Input Change
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  // Handle Filter Changes
  const handleRoleFilterChange = (e) => {
    setRoleFilter(e.target.value);
    setPage(1);
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setPage(1);
  };

  const handleLimitChange = (newLimit) => {
    setLimit(newLimit);
    setPage(1);
  };

  // Toggle Single User Selection
  const toggleSelectUser = (id) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Toggle Select All Users on Current Page
  const toggleSelectAll = () => {
    if (users.every((u) => selectedUserIds.includes(u.id))) {
      setSelectedUserIds((prev) => prev.filter((id) => !users.some((u) => u.id === id)));
    } else {
      const currentPageIds = users.map((u) => u.id);
      setSelectedUserIds((prev) => Array.from(new Set([...prev, ...currentPageIds])));
    }
  };

  // Delete a single user
  const handleDeleteSingle = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      const res = await api.delete(`/api/users-directory/${deleteTarget.id}`);
      if (res.data?.success) {
        setAlertMsg({
          type: 'success',
          text: `User "${deleteTarget.name || deleteTarget.email}" deleted successfully.`
        });
        setDeleteTarget(null);
        setSelectedUserIds((prev) => prev.filter((id) => id !== deleteTarget.id));
        fetchUsers();
      }
    } catch (err) {
      console.error('Delete user error:', err);
      setAlertMsg({
        type: 'error',
        text: err.response?.data?.error || 'Failed to delete user.'
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteUser = handleDeleteSingle;

  // Bulk delete selected users
  const handleBulkDelete = async () => {
    if (selectedUserIds.length === 0) return;
    try {
      setBulkDeleting(true);
      const res = await api.post('/api/users-directory/bulk-delete', {
        userIds: selectedUserIds
      });

      if (res.data?.success) {
        setAlertMsg({
          type: 'success',
          text: `Successfully deleted ${res.data.deletedCount} user(s).`
        });
        setShowBulkDeleteModal(false);
        setSelectedUserIds([]);
        fetchUsers();
      }
    } catch (err) {
      console.error('Bulk delete error:', err);
      setAlertMsg({
        type: 'error',
        text: err.response?.data?.error || 'Failed to perform bulk delete.'
      });
    } finally {
      setBulkDeleting(false);
    }
  };

  // Export Users as CSV
  const exportUsersCSV = () => {
    if (users.length === 0) {
      setAlertMsg({ type: 'error', text: 'No users available to export.' });
      return;
    }

    const headers = ['ID', 'Name', 'Email', 'College', 'Role', 'Status', 'PRN/Roll No', 'Created At'];
    const rows = users.map((u) => [
      `"${u.id || ''}"`,
      `"${(u.name || '').replace(/"/g, '""')}"`,
      `"${(u.email || '').replace(/"/g, '""')}"`,
      `"${(u.college || '').replace(/"/g, '""')}"`,
      `"${u.role || 'student'}"`,
      `"${u.is_verified ? 'Verified' : 'Pending'}"`,
      `"${u.roll_no || ''}"`,
      `"${u.createdAt ? new Date(u.createdAt).toISOString() : ''}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `msc_users_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const startRecord = (page - 1) * limit + (users.length > 0 ? 1 : 0);
  const endRecord = Math.min(page * limit, pagination.total);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 font-segoe text-slate-800 text-left">
        
        {/* Toast Alert Banner */}
        {alertMsg && (
          <div
            className={`fixed top-5 right-5 z-50 p-4 rounded-2xl shadow-xl flex items-center gap-3 border text-xs font-bold transition-all animate-fade-in ${
              alertMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-emerald-100'
                : 'bg-rose-50 text-rose-800 border-rose-200 shadow-rose-100'
            }`}
          >
            {alertMsg.type === 'success' ? (
              <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertTriangle size={18} className="text-rose-600 flex-shrink-0" />
            )}
            <span>{alertMsg.text}</span>
            <button
              onClick={() => setAlertMsg(null)}
              className="ml-2 hover:opacity-75 cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
                <Users size={20} />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  User Directory
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  Manage student profiles, verify accounts, search members, and oversee account permissions.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={exportUsersCSV}
              className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-2 shadow-2xs transition-all cursor-pointer"
              title="Download user directory as CSV"
            >
              <Download size={15} className="text-slate-500" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={fetchUsers}
              disabled={loading}
              className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs flex items-center justify-center shadow-2xs transition-all cursor-pointer"
              title="Refresh users list"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin text-blue-600' : 'text-slate-500'} />
            </button>

            {selectedUserIds.length > 0 && (
              <button
                onClick={() => setShowBulkDeleteModal(true)}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer animate-fade-in"
              >
                <Trash2 size={15} />
                <span>Delete Selected ({selectedUserIds.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* Metric Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Users</span>
              <p className="text-2xl font-black text-slate-900">{stats.totalUsers}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users size={20} />
            </div>
          </div>

          <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Verified</span>
              <p className="text-2xl font-black text-emerald-600">{stats.totalVerified}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck size={20} />
            </div>
          </div>

          <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Students</span>
              <p className="text-2xl font-black text-indigo-600">{stats.totalStudents}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <GraduationCap size={20} />
            </div>
          </div>

          <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Unverified / Pending</span>
              <p className="text-2xl font-black text-amber-600">{stats.totalPending}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <UserX size={20} />
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search users by name, @username, email address, college..."
                value={search}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-600 transition-all placeholder-slate-400"
              />
              {search && (
                <button
                  onClick={() => { setSearch(''); setPage(1); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Role Filter */}
            <div className="flex items-center gap-2">
              <select
                value={roleFilter}
                onChange={handleRoleFilterChange}
                className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-blue-600 cursor-pointer"
              >
                <option value="all">All Roles</option>
                <option value="student">Students Only</option>
                <option value="admin">Administrators Only</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={handleStatusFilterChange}
                className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-blue-600 cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="verified">Verified Only</option>
                <option value="pending">Pending Only</option>
              </select>

              {/* Items Per Page (Paginator Selector: 10 / 20 / 50 / 100) */}
              <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">Show:</span>
                <select
                  value={limit}
                  onChange={(e) => handleLimitChange(parseInt(e.target.value, 10))}
                  className="px-2.5 py-2.5 bg-blue-50 text-blue-700 font-black border border-blue-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Users Table Card */}
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden">
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <th className="p-3.5 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={users.length > 0 && users.every(u => selectedUserIds.includes(u.id))}
                      onChange={toggleSelectAll}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </th>
                  <th className="p-3.5">User</th>
                  <th className="p-3.5">Username Handle</th>
                  <th className="p-3.5">Email Address</th>
                  <th className="p-3.5">College / Institution</th>
                  <th className="p-3.5">Role</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Joined Date</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="p-12 text-center text-slate-400 font-bold">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <RefreshCw size={24} className="animate-spin text-blue-600" />
                        <span>Loading user directory...</span>
                      </div>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-12 text-center text-slate-400 font-bold">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <UserX size={32} className="text-slate-300" />
                        <p className="text-sm text-slate-600">No users match the search criteria.</p>
                        <p className="text-[11px] text-slate-400 font-normal">Try clearing filters or search terms.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const isSelected = selectedUserIds.includes(u.id);
                    const initials = (u.name || 'Student')
                      .split(' ')
                      .map(n => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2);

                    return (
                      <tr
                        key={u.id}
                        className={`hover:bg-slate-50/70 transition-colors ${
                          isSelected ? 'bg-blue-50/40' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="p-3.5 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectUser(u.id)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </td>

                        {/* Name & Initials */}
                        <td className="p-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-2xs flex-shrink-0">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <span className="font-extrabold text-slate-900 block truncate max-w-[170px]">
                                {u.name || 'Unnamed Student'}
                              </span>
                              {u.subject_id && (
                                <span className="text-[9px] font-mono text-slate-400 block">
                                  {u.subject_id}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Username Handle */}
                        <td className="p-3.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg text-xs font-bold border border-blue-100">
                              @{u.username || u.email?.split('@')[0]}
                            </span>
                            <button
                              onClick={() => handleCopy(`@${u.username || u.email?.split('@')[0]}`, u.id)}
                              className="text-slate-400 hover:text-slate-600 cursor-pointer"
                              title="Copy handle"
                            >
                              {copiedId === u.id ? (
                                <Check size={13} className="text-emerald-600" />
                              ) : (
                                <Copy size={13} />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="p-3.5">
                          <span className="text-slate-600 font-semibold">{u.email}</span>
                        </td>

                        {/* College */}
                        <td className="p-3.5">
                          <span className="text-slate-700 font-bold block truncate max-w-[180px]">
                            {u.college || 'PRPCEM Amravati'}
                          </span>
                        </td>

                        {/* Role */}
                        <td className="p-3.5">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              u.role === 'admin'
                                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {u.role || 'student'}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="p-3.5">
                          {u.is_verified ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full text-[10px] font-black border border-emerald-200">
                              <CheckCircle2 size={11} />
                              <span>Verified</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full text-[10px] font-black border border-amber-200">
                              <Clock size={11} />
                              <span>Pending</span>
                            </span>
                          )}
                        </td>

                        {/* Joined Date */}
                        <td className="p-3.5 text-slate-500 font-mono text-[11px]">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                        </td>

                        {/* Actions */}
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => setDeleteTarget(u)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                            title={`Delete user ${u.name}`}
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* ════════ PAGINATOR BAR (10 / 20 / 50 / 100) ════════ */}
          <div className="p-4 bg-slate-50/80 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            
            {/* Range text */}
            <div className="text-slate-500 font-bold">
              Showing <span className="text-slate-900 font-extrabold">{startRecord}</span> to{' '}
              <span className="text-slate-900 font-extrabold">{endRecord}</span> of{' '}
              <span className="text-slate-900 font-extrabold">{pagination.total}</span> users
            </div>

            {/* Paginator Controls */}
            <div className="flex items-center gap-2">
              
              {/* Previous Page */}
              <button
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                disabled={!pagination.hasPrev || loading}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-extrabold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
              >
                <ChevronLeft size={14} />
                <span>Prev</span>
              </button>

              {/* Page Numbers */}
              <div className="flex items-center gap-1 font-mono font-black">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                  .filter(pNum => {
                    // Show current page +/- 2, and first/last page
                    return (
                      pNum === 1 ||
                      pNum === pagination.totalPages ||
                      Math.abs(pNum - page) <= 1
                    );
                  })
                  .map((pNum, idx, arr) => {
                    const prevPNum = arr[idx - 1];
                    const showEllipsis = prevPNum && pNum - prevPNum > 1;

                    return (
                      <React.Fragment key={pNum}>
                        {showEllipsis && <span className="px-1 text-slate-400">...</span>}
                        <button
                          onClick={() => setPage(pNum)}
                          className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs transition-all cursor-pointer ${
                            page === pNum
                              ? 'bg-blue-600 text-white font-extrabold shadow-sm'
                              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {pNum}
                        </button>
                      </React.Fragment>
                    );
                  })}
              </div>

              {/* Next Page */}
              <button
                onClick={() => setPage(prev => Math.min(pagination.totalPages, prev + 1))}
                disabled={!pagination.hasNext || loading}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-extrabold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
              >
                <span>Next</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Single Delete Confirmation Modal */}
        {deleteTarget && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-slate-200 text-center space-y-5">
              
              <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                <Trash2 size={26} />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-lg font-black text-slate-900">Delete User Account?</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                  Are you sure you want to permanently delete{' '}
                  <strong className="text-slate-900">{deleteTarget.name}</strong> (
                  <span className="font-mono text-blue-600">@{deleteTarget.username || deleteTarget.email}</span>)?
                </p>
                <p className="text-[11px] text-rose-600 font-bold bg-rose-50 border border-rose-100 p-2.5 rounded-xl">
                  ⚠️ This action cannot be undone and will permanently remove this user's profile and quiz attempt logs.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleting}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteUser}
                  disabled={deleting}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {deleting ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <span>Confirm Delete</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Delete Confirmation Modal */}
        {showBulkDeleteModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-slate-200 text-center space-y-5">
              
              <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                <Trash2 size={26} />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-lg font-black text-slate-900">
                  Delete {selectedUserIds.length} Selected Users?
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                  You are about to permanently delete{' '}
                  <strong className="text-rose-600 font-black">{selectedUserIds.length} user account(s)</strong>.
                </p>
                <p className="text-[11px] text-rose-600 font-bold bg-rose-50 border border-rose-100 p-2.5 rounded-xl">
                  ⚠️ All selected accounts and their history will be permanently erased.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setShowBulkDeleteModal(false)}
                  disabled={bulkDeleting}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={bulkDeleting}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {bulkDeleting ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <span>Delete All Selected</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
  );
}
