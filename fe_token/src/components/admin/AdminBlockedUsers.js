// src/components/admin/AdminBlockedUsers.js
//
// Read-only list of users who have been blocked by other users
// (GET /adminhub/blocked-users). Shows, per blocked user, how many users blocked
// them and the blocker IDs. No edit/delete. Search by name, MAT id or user id.

import React, { useCallback, useEffect, useState } from 'react';
import adminApi from './adminApi';
import '../../assets/css/pages/admin.css';

const LIMIT = 20;

const fmt = (v) => (v ? new Date(v).toLocaleString() : '—');

const AdminBlockedUsers = () => {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await adminApi.get('/adminhub/blocked-users', {
        params: { page, limit: LIMIT, search },
      });
      if (data.status === 'Success') {
        setRows(data.data.rows || []);
        setTotal(data.data.total || 0);
      } else {
        setError(data.result || 'Failed to load blocked users.');
      }
    } catch (err) {
      setError('Failed to load blocked users.');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  return (
    <div>
      <h1 className="adm-page-title">Blocked Users</h1>

      <form onSubmit={handleSearch} className="adm-toolbar">
        <div className="adm-search">
          <i className="fa-solid fa-magnifying-glass adm-search__icon" aria-hidden="true" />
          <input
            type="text"
            placeholder="Search name, MAT ID or user ID"
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
        <button type="button" className="adm-btn adm-btn--ghost" onClick={load}>
          <i className="fa-solid fa-rotate" aria-hidden="true" /> Refresh
        </button>
      </form>

      {error && <div className="adm-alert">{error}</div>}

      <div className="adm-table-wrap">
        <table className="adm-table adm-table--wide">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Block Count</th>
              <th>Blocked By IDs</th>
              <th>Last Blocked</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="adm-table__state" colSpan={5}>Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td className="adm-table__state" colSpan={5}>No blocked users found.</td></tr>
            ) : (
              rows.map((r) => (
                <tr key={r.uid}>
                  <td>{r.name} ({r.matId})</td>
                  <td>{r.uemail}</td>
                  <td>Block Count: {r.block_count}</td>
                  <td style={{ wordBreak: 'break-word' }}>Blocked By IDs: {r.blocked_by_ids}</td>
                  <td>{fmt(r.latest_blocked_at)}</td>
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

export default AdminBlockedUsers;
