// src/components/admin/AdminUsers.js
//
// Users management table. Columns: MAT ID (button -> shadow login), Name, Email,
// Phone, Photos link, Account Status dropdown + Update, Profile Approval
// dropdown + Update, Delete (confirm). Search by MAT id or name; pagination
// driven by `total`.
//
// Shadow login: POST /adminhub/impersonate {uid} -> {token}; open a new tab to
// /impersonate?token=<token>, which exchanges the one-time token for a real user
// session and lands on /profiles.
//
// Response shape (from FEAT-001): data:{rows,total,page,limit}; each row has
// matId, uid, name, uemail, uphone, status, profileStatus, photos_count.

import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import adminApi from './adminApi';
import { useAdminAuth } from './AdminAuthContext';
import { useToast } from '../hooks/ToastContext';
import '../../assets/css/pages/admin.css';

const ACCOUNT_STATUSES = ['Pending', 'Active', 'Closed', 'Blocked'];
const PROFILE_STATUSES = ['pending', 'approved', 'rejected'];
const PAYMENT_STATUSES = ['Pending', 'Paid', 'Unpaid'];
const MEMBERSHIP_TYPES = ['Gold', 'Premium', 'Diamond'];
const MARRIAGE_STATUSES = ['Active', 'Marriage Settled'];
const FEATURED_OPTIONS = ['No', 'Yes'];
const LIMIT = 20;

// Admin-editable fields (payment, membership, marriage, featured): row key, request endpoint, label, options.
const STATUS_FIELDS = [
  { field: 'payment_status', path: '/adminhub/users/payment-status', label: 'Payment status', options: PAYMENT_STATUSES, fallback: 'Pending' },
  { field: 'membership_type', path: '/adminhub/users/membership-type', label: 'Membership type', options: MEMBERSHIP_TYPES, fallback: 'Gold' },
  { field: 'marriage_status', path: '/adminhub/users/marriage-status', label: 'Marriage status', options: MARRIAGE_STATUSES, fallback: 'Active' },
  { field: 'featured', path: '/adminhub/users/featured', label: 'Featured', options: FEATURED_OPTIONS, fallback: 'No' },
];

const AdminUsers = () => {
  const navigate = useNavigate();
  const { can } = useAdminAuth();
  const canDelete = can('users.delete');
  const canImpersonate = can('users.impersonate');
  const columnCount = canDelete ? 13 : 12;
  const { showToast } = useToast();
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // per-row pending dropdown selections
  const [statusDraft, setStatusDraft] = useState({});
  const [profileDraft, setProfileDraft] = useState({});
  const [fieldDraft, setFieldDraft] = useState({});   // keyed `${uid}:${field}`
  const [saving, setSaving] = useState({});            // keyed `${uid}:${field}`
  const [filters, setFilters] = useState({ payment_status: '', membership_type: '', marriage_status: '', featured: '' });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await adminApi.get('/adminhub/users', {
        params: {
          page,
          limit: LIMIT,
          search,
          ...(filters.payment_status && { payment_status: filters.payment_status }),
          ...(filters.membership_type && { membership_type: filters.membership_type }),
          ...(filters.marriage_status && { marriage_status: filters.marriage_status }),
          ...(filters.featured && { featured: filters.featured }),
        },
      });
      if (data.status === 'Success') {
        setRows(data.data.rows || []);
        setTotal(data.data.total || 0);
      } else {
        setError(data.result || 'Failed to load users.');
      }
    } catch (err) {
      setError('Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, [page, search, filters]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const handleShadowLogin = async (uid) => {
    try {
      const { data } = await adminApi.post('/adminhub/impersonate', { uid });
      if (data.status === 'Success' && data.data?.token) {
        window.open(`${window.location.origin}/impersonate?token=${data.data.token}`, '_blank');
      } else {
        alert(data.result || 'Could not start shadow login.');
      }
    } catch (err) {
      alert('Could not start shadow login.');
    }
  };

  const handleStatusUpdate = async (uid) => {
    const status = statusDraft[uid];
    if (!status) return;
    try {
      const { data } = await adminApi.post('/adminhub/users/status', { uid, status });
      if (data.status === 'Success') {
        load();
      } else {
        alert(data.result || 'Status update failed.');
      }
    } catch (err) {
      alert('Status update failed.');
    }
  };

  const handleProfileUpdate = async (uid) => {
    const profile_status = profileDraft[uid];
    if (!profile_status) return;
    try {
      const { data } = await adminApi.post('/adminhub/users/profilestatus', { uid, profile_status });
      if (data.status === 'Success') {
        load();
      } else {
        alert(data.result || 'Profile approval update failed.');
      }
    } catch (err) {
      alert('Profile approval update failed.');
    }
  };

  const handleFilterChange = (field, value) => {
    setPage(1);
    setFilters((f) => ({ ...f, [field]: value }));
  };

  const handleFieldUpdate = async (uid, cfg) => {
    const key = `${uid}:${cfg.field}`;
    const value = fieldDraft[key];
    if (!value || saving[key]) return;
    setSaving((s) => ({ ...s, [key]: true }));
    try {
      const { data } = await adminApi.post(cfg.path, { uid, [cfg.field]: value });
      if (data.status === 'Success') {
        showToast({ title: 'Updated', description: `${cfg.label} set to ${value}.`, type: 'success' });
        setFieldDraft((d) => { const n = { ...d }; delete n[key]; return n; });
        load();
      } else {
        showToast({ title: 'Update failed', description: data.result || `${cfg.label} update failed.`, type: 'error' });
      }
    } catch (err) {
      showToast({ title: 'Update failed', description: `${cfg.label} update failed.`, type: 'error' });
    } finally {
      setSaving((s) => { const n = { ...s }; delete n[key]; return n; });
    }
  };

  const handleDelete = async (uid, matId) => {
    if (!window.confirm(`Delete ${matId || 'MAT' + uid}? This removes the user and ALL their photos, conversations and data. This cannot be undone.`)) {
      return;
    }
    try {
      const { data } = await adminApi.delete(`/adminhub/users/${uid}`);
      if (data.status === 'Success') {
        load();
      } else {
        alert(data.result || 'Delete failed.');
      }
    } catch (err) {
      alert('Delete failed.');
    }
  };

  const goToPhotos = (uid) => {
    navigate(`/adminhub/matrimony/photos?search=MAT${uid}`);
  };

  return (
    <div>
      <h1 className="adm-page-title">Users</h1>

      <form onSubmit={handleSearch} className="adm-toolbar">
        <div className="adm-search">
          <i className="fa-solid fa-magnifying-glass adm-search__icon" aria-hidden="true" />
          <input
            type="text"
            placeholder="Search by MAT id or name"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="adm-input adm-input--search"
          />
        </div>
        <button type="submit" className="adm-btn adm-btn--dark">Search</button>
        {search && (
          <button
            type="button"
            className="adm-btn adm-btn--ghost"
            onClick={() => { setSearchInput(''); setSearch(''); setPage(1); }}
          >
            Clear
          </button>
        )}
        {STATUS_FIELDS.map((cfg) => (
          <select
            key={cfg.field}
            aria-label={`Filter by ${cfg.label.toLowerCase()}`}
            value={filters[cfg.field]}
            onChange={(e) => handleFilterChange(cfg.field, e.target.value)}
            className="adm-select"
          >
            <option value="">{cfg.label}: All</option>
            {cfg.options.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        ))}
      </form>

      {error && <div className="adm-alert">{error}</div>}

      <div className="adm-table-wrap">
        <table className="adm-table adm-table--wide">
          <thead>
            <tr>
              <th>MAT ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Photos</th>
              <th>Account Status</th>
              <th>Profile Approval</th>
              <th>Payment</th>
              <th>Membership</th>
              <th>Marriage</th>
              <th>Featured</th>
              <th>Blocks</th>
              {canDelete && <th>Delete</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="adm-table__state" colSpan={columnCount}>Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td className="adm-table__state" colSpan={columnCount}>No users found.</td></tr>
            ) : (
              rows.map((u) => (
                <tr key={u.uid}>
                  <td>
                    {canImpersonate ? (
                      <button
                        type="button"
                        title="Shadow login as this user (opens a new tab)"
                        onClick={() => handleShadowLogin(u.uid)}
                        className="adm-link-btn adm-link-btn--mono"
                      >
                        {u.matId || `MAT${u.uid}`}
                      </button>
                    ) : (
                      <span>{u.matId || `MAT${u.uid}`}</span>
                    )}
                  </td>
                  <td>{u.name}</td>
                  <td>{u.uemail}</td>
                  <td>{u.uphone}</td>
                  <td>
                    <button
                      type="button"
                      onClick={() => goToPhotos(u.uid)}
                      className="adm-link-btn"
                    >
                      {u.photos_count ?? 0} photos
                    </button>
                  </td>
                  <td>
                    <div className="adm-inline-controls">
                      <select
                        value={statusDraft[u.uid] ?? u.status ?? 'Active'}
                        onChange={(e) => setStatusDraft((d) => ({ ...d, [u.uid]: e.target.value }))}
                        className="adm-select"
                      >
                        {ACCOUNT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <button type="button" onClick={() => handleStatusUpdate(u.uid)} className="adm-btn adm-btn--dark adm-btn--sm">Update</button>
                    </div>
                  </td>
                  <td>
                    <div className="adm-inline-controls">
                      <select
                        value={profileDraft[u.uid] ?? u.profileStatus ?? 'pending'}
                        onChange={(e) => setProfileDraft((d) => ({ ...d, [u.uid]: e.target.value }))}
                        className="adm-select"
                      >
                        {PROFILE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <button type="button" onClick={() => handleProfileUpdate(u.uid)} className="adm-btn adm-btn--dark adm-btn--sm">Update</button>
                    </div>
                  </td>
                  {STATUS_FIELDS.map((cfg) => {
                    const key = `${u.uid}:${cfg.field}`;
                    const busy = !!saving[key];
                    return (
                      <td key={cfg.field}>
                        <div className="adm-inline-controls">
                          <select
                            value={fieldDraft[key] ?? u[cfg.field] ?? cfg.fallback}
                            onChange={(e) => setFieldDraft((d) => ({ ...d, [key]: e.target.value }))}
                            disabled={busy}
                            aria-label={cfg.label}
                            className="adm-select"
                          >
                            {cfg.options.map((o) => <option key={o} value={o}>{o}</option>)}
                          </select>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => handleFieldUpdate(u.uid, cfg)}
                            className="adm-btn adm-btn--dark adm-btn--sm"
                          >
                            {busy ? 'Saving…' : 'Update'}
                          </button>
                        </div>
                      </td>
                    );
                  })}
                  <td>{u.block_count ?? 0}</td>
                  {canDelete && (
                    <td>
                      <button type="button" onClick={() => handleDelete(u.uid, u.matId)} className="adm-btn adm-btn--danger adm-btn--sm">
                        <i className="fa-solid fa-trash-can" aria-hidden="true" />
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="adm-pager">
        <button type="button" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="adm-btn adm-btn--dark">Prev</button>
        <span className="adm-pager__info">Page {page} of {totalPages} ({total} total)</span>
        <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="adm-btn adm-btn--dark">Next</button>
      </div>
    </div>
  );
};

export default AdminUsers;
