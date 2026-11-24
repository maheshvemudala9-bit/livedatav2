// src/components/admin/AdminEmailOtps.js
//
// Read-only list of email OTPs (GET /adminhub/email-otps). No edit/delete.
// Search by email, status filter (all|active|expired|verified), pagination
// driven by `total`.

import React, { useCallback, useEffect, useState } from 'react';
import adminApi from './adminApi';
import '../../assets/css/pages/admin.css';

const LIMIT = 20;
const PILL = { active: 'adm-pill--ok', verified: 'adm-pill--info', expired: '' };

const fmt = (v) => (v ? new Date(v).toLocaleString() : '—');

const AdminEmailOtps = () => {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await adminApi.get('/adminhub/email-otps', {
        params: { page, limit: LIMIT, search, status },
      });
      if (data.status === 'Success') {
        setRows(data.data.rows || []);
        setTotal(data.data.total || 0);
      } else {
        setError(data.result || 'Failed to load email OTPs.');
      }
    } catch (err) {
      setError('Failed to load email OTPs.');
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  return (
    <div>
      <h1 className="adm-page-title">Email OTPs</h1>

      <form onSubmit={handleSearch} className="adm-toolbar">
        <div className="adm-search">
          <i className="fa-solid fa-magnifying-glass adm-search__icon" aria-hidden="true" />
          <input
            type="text"
            placeholder="Search by email"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="adm-input adm-input--search"
          />
        </div>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="adm-select"
          aria-label="Filter by status"
        >
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
          <option value="verified">Verified</option>
        </select>
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
        <button type="button" className="adm-btn adm-btn--ghost" onClick={load}>
          <i className="fa-solid fa-rotate" aria-hidden="true" /> Refresh
        </button>
      </form>

      {error && <div className="adm-alert">{error}</div>}

      <div className="adm-table-wrap">
        <table className="adm-table adm-table--wide">
          <thead>
            <tr>
              <th>Email</th>
              <th>OTP</th>
              <th>Status</th>
              <th>Expires At</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="adm-table__state" colSpan={5}>Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td className="adm-table__state" colSpan={5}>No email OTPs found.</td></tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.email}</td>
                  <td>{r.otp}</td>
                  <td>
                    <span className={`adm-pill ${PILL[r.status] || ''}`}>
                      {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                    </span>
                  </td>
                  <td>{fmt(r.expires_at)}</td>
                  <td>{fmt(r.created_at)}</td>
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

export default AdminEmailOtps;
