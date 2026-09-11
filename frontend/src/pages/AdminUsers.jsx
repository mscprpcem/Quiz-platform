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
  Sparkles,
  Eye,
  ExternalLink,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ShieldCheck
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

  // Search, Filters & Sorting
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('DESC');

  // Pagination State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
    hasPrev: false,
    hasNext: false
  });

  // Modals State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [viewDetailUser, setViewDetailUser] = useState(null);

  // Copy Feedback State
  const [copiedId, setCopiedId] = useState(null);

  // Bulk Selection State
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [bulkVerifying, setBulkVerifying] = useState(false);

  // Feedback State
  const [alertMsg, setAlertMsg] = useState(null);

  // Auto-dismiss alert after 5 seconds
  useEffect(() => {
    if (alertMsg) {
      const timer = setTimeout(() => setAlertMsg(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [alertMsg]);

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
          status: statusFilter !== 'all' ? statusFilter : undefined,
          sortBy,
          sortOrder
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
  }, [page, limit, search, roleFilter, statusFilter, sortBy, sortOrder]);

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

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(prev => (prev === 'ASC' ? 'DESC' : 'ASC'));
    } else {
      setSortBy(field);
      setSortOrder('ASC');
    }
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

  // Toggle Single User Verification
  const handleToggleVerify = async (user) => {
    try {
      const res = await api.patch(`/api/users-directory/${user.id}/verify`, {
        is_verified: !user.is_verified
      });
      if (res.data?.success) {
        setAlertMsg({
          type: 'success',
          text: res.data.message || `User ${user.name} verification updated.`
        });
        fetchUsers();
        if (viewDetailUser && viewDetailUser.id === user.id) {
          setViewDetailUser((prev) => ({ ...prev, is_verified: !prev.is_verified }));
        }
      }
    } catch (err) {
      setAlertMsg({
        type: 'error',
        text: err.response?.data?.error || 'Failed to update verification status.'
      });
    }
  };

  // Bulk Verify or Unverify
  const handleBulkVerify = async (verifyStatus = true) => {
    if (selectedUserIds.length === 0) return;
    try {
      setBulkVerifying(true);
      const res = await api.post('/api/users-directory/bulk-verify', {
        userIds: selectedUserIds,
        verify: verifyStatus
      });
      if (res.data?.success) {
        setAlertMsg({
          type: 'success',
          text: res.data.message || `Successfully updated ${res.data.updatedCount} user(s).`
        });
        setSelectedUserIds([]);
        fetchUsers();
      }
    } catch (err) {
      setAlertMsg({
        type: 'error',
        text: err.response?.data?.error || 'Failed to bulk update verification status.'
      });
    } finally {
      setBulkVerifying(false);
    }
  };

  // Change User Role
  const handleChangeRole = async (user, newRole) => {
    try {
      const res = await api.patch(`/api/users-directory/${user.id}/role`, { role: newRole });
      if (res.data?.success) {
        setAlertMsg({
          type: 'success',
          text: res.data.message || `Role updated to ${newRole.toUpperCase()}.`
        });
        fetchUsers();
        if (viewDetailUser && viewDetailUser.id === user.id) {
          setViewDetailUser((prev) => ({ ...prev, role: newRole }));
        }
      }
    } catch (err) {
      setAlertMsg({
        type: 'error',
        text: err.response?.data?.error || 'Failed to update user role.'
      });
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
        if (viewDetailUser && viewDetailUser.id === deleteTarget.id) {
          setViewDetailUser(null);
        }
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

    const headers = ['ID', 'Subject ID', 'Name', 'Handle', 'Email', 'College', 'Role', 'Status', 'Created At'];
    const rows = users.map((u) => [
      `"${u.id || ''}"`,
      `"${u.subject_id || ''}"`,
      `"${(u.name || '').replace(/"/g, '""')}"`,
      `"@${u.username || u.email?.split('@')[0] || ''}"`,
      `"${(u.email || '').replace(/"/g, '""')}"`,
      `"${(u.college || 'PRPCEM Amravati').replace(/"/g, '""')}"`,
      `"${u.role || 'student'}"`,
      `"${u.is_verified ? 'Verified' : 'Pending'}"`,
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
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6 font-segoe text-slate-800 text-left">
      
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
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md flex-shrink-0">
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

        {/* Top Header Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
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
        </div>
      </div>

      {/* Metric Stats Cards (Clickable Quick Filters) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <button
          type="button"
          onClick={() => { setRoleFilter('all'); setStatusFilter('all'); setPage(1); }}
          className={`text-left p-4.5 rounded-2xl border transition-all cursor-pointer shadow-2xs flex items-center justify-between ${
            roleFilter === 'all' && statusFilter === 'all'
              ? 'bg-blue-50/50 border-blue-300 ring-2 ring-blue-500/20'
              : 'bg-white border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Users</span>
            <p className="text-2xl font-black text-slate-900">{stats.totalUsers}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <Users size={20} />
          </div>
        </button>

        {/* Verified */}
        <button
          type="button"
          onClick={() => { setStatusFilter(statusFilter === 'verified' ? 'all' : 'verified'); setPage(1); }}
          className={`text-left p-4.5 rounded-2xl border transition-all cursor-pointer shadow-2xs flex items-center justify-between ${
            statusFilter === 'verified'
              ? 'bg-emerald-50/50 border-emerald-300 ring-2 ring-emerald-500/20'
              : 'bg-white border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Verified</span>
            <p className="text-2xl font-black text-emerald-600">{stats.totalVerified}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <UserCheck size={20} />
          </div>
        </button>

        {/* Students */}
        <button
          type="button"
          onClick={() => { setRoleFilter(roleFilter === 'student' ? 'all' : 'student'); setPage(1); }}
          className={`text-left p-4.5 rounded-2xl border transition-all cursor-pointer shadow-2xs flex items-center justify-between ${
            roleFilter === 'student'
              ? 'bg-indigo-50/50 border-indigo-300 ring-2 ring-indigo-500/20'
              : 'bg-white border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Students</span>
            <p className="text-2xl font-black text-indigo-600">{stats.totalStudents}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
            <GraduationCap size={20} />
          </div>
        </button>

        {/* Unverified / Pending */}
        <button
          type="button"
          onClick={() => { setStatusFilter(statusFilter === 'pending' ? 'all' : 'pending'); setPage(1); }}
          className={`text-left p-4.5 rounded-2xl border transition-all cursor-pointer shadow-2xs flex items-center justify-between ${
            statusFilter === 'pending'
              ? 'bg-amber-50/50 border-amber-300 ring-2 ring-amber-500/20'
              : 'bg-white border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Unverified / Pending</span>
            <p className="text-2xl font-black text-amber-600">{stats.totalPending}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
            <UserX size={20} />
          </div>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search users by name, @username, email address, college..."
              value={search}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-600 transition-all placeholder-slate-400"
            />
            {search && (
              <button
                type="button"
                onClick={() => { setSearch(''); setPage(1); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Controls: Role, Status, Sorting, Items per page */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Role Filter */}
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

            {/* Items Per Page */}
            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">Show:</span>
              <select
                value={limit}
                onChange={(e) => handleLimitChange(parseInt(e.target.value, 10))}
                className="px-2.5 py-2 bg-blue-50 text-brand-blue font-black border border-blue-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
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

      {/* Floating Bulk Action Bar (When users are selected) */}
      {selectedUserIds.length > 0 && (
        <div className="p-3 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-black flex items-center justify-center">
              {selectedUserIds.length}
            </span>
            <span className="text-xs font-bold text-slate-200">
              user(s) selected
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handleBulkVerify(true)}
              disabled={bulkVerifying}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <CheckCircle2 size={13} />
              <span>Verify Selected</span>
            </button>

            <button
              onClick={() => handleBulkVerify(false)}
              disabled={bulkVerifying}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <Clock size={13} />
              <span>Unverify Selected</span>
            </button>

            <button
              onClick={() => setShowBulkDeleteModal(true)}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <Trash2 size={13} />
              <span>Delete Selected</span>
            </button>

            <button
              onClick={() => setSelectedUserIds([])}
              className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Users Table Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden">
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[1050px]">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200 select-none">
                <th className="p-3.5 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={users.length > 0 && users.every((u) => selectedUserIds.includes(u.id))}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <th
                  onClick={() => handleSort('name')}
                  className="p-3.5 cursor-pointer hover:text-slate-900 min-w-[200px]"
                >
                  <div className="flex items-center gap-1">
                    <span>User</span>
                    {sortBy === 'name' ? (
                      sortOrder === 'ASC' ? <ArrowUp size={12} className="text-blue-600" /> : <ArrowDown size={12} className="text-blue-600" />
                    ) : (
                      <ArrowUpDown size={12} className="text-slate-300" />
                    )}
                  </div>
                </th>
                <th className="p-3.5 min-w-[170px]">Username Handle</th>
                <th
                  onClick={() => handleSort('email')}
                  className="p-3.5 cursor-pointer hover:text-slate-900 min-w-[210px]"
                >
                  <div className="flex items-center gap-1">
                    <span>Email Address</span>
                    {sortBy === 'email' ? (
                      sortOrder === 'ASC' ? <ArrowUp size={12} className="text-blue-600" /> : <ArrowDown size={12} className="text-blue-600" />
                    ) : (
                      <ArrowUpDown size={12} className="text-slate-300" />
                    )}
                  </div>
                </th>
                <th className="p-3.5 min-w-[190px]">College / Institution</th>
                <th
                  onClick={() => handleSort('role')}
                  className="p-3.5 cursor-pointer hover:text-slate-900 min-w-[100px]"
                >
                  <div className="flex items-center gap-1">
                    <span>Role</span>
                    {sortBy === 'role' ? (
                      sortOrder === 'ASC' ? <ArrowUp size={12} className="text-blue-600" /> : <ArrowDown size={12} className="text-blue-600" />
                    ) : (
                      <ArrowUpDown size={12} className="text-slate-300" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('is_verified')}
                  className="p-3.5 cursor-pointer hover:text-slate-900 min-w-[120px]"
                >
                  <div className="flex items-center gap-1">
                    <span>Status</span>
                    {sortBy === 'is_verified' ? (
                      sortOrder === 'ASC' ? <ArrowUp size={12} className="text-blue-600" /> : <ArrowDown size={12} className="text-blue-600" />
                    ) : (
                      <ArrowUpDown size={12} className="text-slate-300" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('createdAt')}
                  className="p-3.5 cursor-pointer hover:text-slate-900 min-w-[120px]"
                >
                  <div className="flex items-center gap-1">
                    <span>Joined Date</span>
                    {sortBy === 'createdAt' ? (
                      sortOrder === 'ASC' ? <ArrowUp size={12} className="text-blue-600" /> : <ArrowDown size={12} className="text-blue-600" />
                    ) : (
                      <ArrowUpDown size={12} className="text-slate-300" />
                    )}
                  </div>
                </th>
                <th className="p-3.5 text-right min-w-[130px]">Actions</th>
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
                    .map((n) => n[0])
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
                            <span className="font-extrabold text-slate-900 block truncate max-w-[180px]">
                              {u.name || 'Unnamed Student'}
                            </span>
                            {u.subject_id && (
                              <span className="text-[9px] font-mono text-slate-400 block truncate">
                                {u.subject_id}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Username Handle */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg text-xs font-bold border border-blue-100 truncate max-w-[140px]">
                            @{u.username || u.email?.split('@')[0]}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(`@${u.username || u.email?.split('@')[0]}`, u.id)}
                            className="text-slate-400 hover:text-slate-600 cursor-pointer flex-shrink-0 p-0.5"
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

                      {/* Email Address */}
                      <td className="p-3.5">
                        <span className="text-slate-600 font-semibold block truncate max-w-[200px]" title={u.email}>
                          {u.email}
                        </span>
                      </td>

                      {/* College / Institution */}
                      <td className="p-3.5">
                        <span className="text-slate-700 font-bold block truncate max-w-[190px]" title={u.college || 'PRPCEM Amravati'}>
                          {u.college || 'PRPCEM Amravati'}
                        </span>
                      </td>

                      {/* Role Badge */}
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

                      {/* Status Badge */}
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
                      <td className="p-3.5 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                      </td>

                      {/* Actions Column */}
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Toggle Verification Quick Button */}
                          <button
                            type="button"
                            onClick={() => handleToggleVerify(u)}
                            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                              u.is_verified
                                ? 'text-emerald-600 hover:bg-emerald-50'
                                : 'text-amber-500 hover:bg-amber-50'
                            }`}
                            title={u.is_verified ? 'Revoke verification (Mark pending)' : 'Verify user account'}
                          >
                            {u.is_verified ? <CheckCircle2 size={15} /> : <UserCheck size={15} />}
                          </button>

                          {/* View Profile Details Modal */}
                          <button
                            type="button"
                            onClick={() => setViewDetailUser(u)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                            title="View user details"
                          >
                            <Eye size={15} />
                          </button>

                          {/* Delete User */}
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(u)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                            title={`Delete user ${u.name}`}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ════════ PAGINATOR BAR ════════ */}
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
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={!pagination.hasPrev || loading}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-extrabold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
            >
              <ChevronLeft size={14} />
              <span>Prev</span>
            </button>

            {/* Page Numbers */}
            <div className="flex items-center gap-1 font-mono font-black">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                .filter((pNum) => {
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
              onClick={() => setPage((prev) => Math.min(pagination.totalPages, prev + 1))}
              disabled={!pagination.hasNext || loading}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-extrabold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
            >
              <span>Next</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* User Details Modal */}
      {viewDetailUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-slate-200 text-left space-y-6">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-600 text-white font-black text-lg flex items-center justify-center shadow-sm">
                  {(viewDetailUser.name || 'S').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">{viewDetailUser.name}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-xs text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
                      @{viewDetailUser.username || viewDetailUser.email?.split('@')[0]}
                    </span>
                    {viewDetailUser.is_verified ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 size={10} />
                        <span>Verified</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        <Clock size={10} />
                        <span>Pending</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewDetailUser(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Profile Grid Details */}
            <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 space-y-3 text-xs font-semibold">
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Email Address</span>
                <span className="font-mono text-slate-800 font-bold">{viewDetailUser.email}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">College / Institution</span>
                <span className="text-slate-800 font-bold">{viewDetailUser.college || 'PRPCEM Amravati'}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Subject ID</span>
                <span className="font-mono text-slate-500">{viewDetailUser.subject_id || viewDetailUser.id}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">System Role</span>
                <div className="flex items-center gap-1.5">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                    viewDetailUser.role === 'admin'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-slate-200 text-slate-700'
                  }`}>
                    {viewDetailUser.role || 'student'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleChangeRole(viewDetailUser, viewDetailUser.role === 'admin' ? 'student' : 'admin')}
                    className="text-[10px] text-blue-600 hover:underline font-bold cursor-pointer"
                  >
                    Change to {viewDetailUser.role === 'admin' ? 'student' : 'admin'}
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Account Registered</span>
                <span className="font-mono text-slate-600">
                  {viewDetailUser.createdAt ? new Date(viewDetailUser.createdAt).toLocaleString() : '—'}
                </span>
              </div>
            </div>

            {/* Verification Portal Link */}
            <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl flex items-center justify-between text-xs">
              <span className="text-slate-600 font-bold">Verification Platform Profile:</span>
              <a
                href={`https://verify.mscprpcem.tech/u/${encodeURIComponent(viewDetailUser.username || viewDetailUser.email?.split('@')[0])}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 font-black inline-flex items-center gap-1"
              >
                <span>View Public Card</span>
                <ExternalLink size={12} />
              </a>
            </div>

            {/* Quick Actions in Modal */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleToggleVerify(viewDetailUser)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs ${
                  viewDetailUser.is_verified
                    ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200'
                }`}
              >
                {viewDetailUser.is_verified ? (
                  <>
                    <Clock size={14} />
                    <span>Revoke Verification</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} />
                    <span>Verify Account</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setDeleteTarget(viewDetailUser);
                }}
                className="py-2.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 size={14} />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

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
                onClick={handleDeleteSingle}
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
