// src/components/admin/AdminContactQueries.js
//
// Read-only list of Contact Us submissions (GET /adminhub/contact-queries).
// No edit/delete. Search by name/email/phone/message, subject filter,
// pagination driven by `total`.

import React, { useCallback, useEffect, useState } from 'react';
import adminApi from './adminApi';
import '../../assets/css/pages/admin.css';

const LIMIT = 20;
const SUBJECTS = [
  'Registration / Profile Help',
  'Membership / Payment',
  'Report a Profile',
  'Technical Issue',
  'Feedback / Suggestion',
  'Other',
];

const fmt = (v) => (v ? new Date(v).toLocaleString() : '—');

const AdminContactQueries = () => {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState('');
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await adminApi.get('/adminhub/contact-queries', {
        params: { page, limit: LIMIT, search, subject },
      });
      if (data.status === 'Success') {
        setRows(data.data.rows || []);
        setTotal(data.data.total || 0);
      } else {
        setError(data.result || 'Failed to load contact queries.');
      }
    } catch (err) {
      setError('Failed to load contact queries.');
    } finally {
      setLoading(false);
    }
  }, [page, search, subject]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const toggle = (id) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div>
      <h1 className="adm-page-title">Contact Queries</h1>

      <form onSubmit={handleSearch} className="adm-toolbar">
        <div className="adm-search">
          <i className="fa-solid fa-magnifying-glass adm-search__icon" aria-hidden="true" />
          <input
            type="text"
            placeholder="Search name, email, phone or message"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="adm-input adm-input--search"
          />
        </div>
        <select
          value={subject}
          onChange={(e) => { setSubject(e.target.value); setPage(1); }}
          className="adm-select"
          aria-label="Filter by subject"
        >
          <option value="">All subjects</option>
          {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
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
              <th>Date</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Subject</th>
              <th>Message</th>
              <th>Submitted by</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="adm-table__state" colSpan={7}>Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td className="adm-table__state" colSpan={7}>No contact queries found.</td></tr>
            ) : (
              rows.map((r) => {
                const long = (r.message || '').length > 80;
                const open = !!expanded[r.id];
                return (
                  <tr key={r.id}>
                    <td>{fmt(r.created_at)}</td>
                    <td>{r.name}</td>
                    <td><a href={`mailto:${r.email}`}>{r.email}</a></td>
                    <td><a href={`tel:${r.phone}`}>{r.phone}</a></td>
                    <td><span className="adm-pill adm-pill--info">{r.subject}</span></td>
                    <td style={{ maxWidth: 320, whiteSpace: open ? 'pre-wrap' : 'normal', wordBreak: 'break-word' }}>
                      {long && !open ? `${r.message.slice(0, 80)}…` : r.message}
                      {long && (
                        <>
                          {' '}
                          <button type="button" className="adm-link-btn" onClick={() => toggle(r.id)}>
                            {open ? 'Hide' : 'View'}
                          </button>
                        </>
                      )}
                    </td>
                    <td>{r.matId || 'Guest'}</td>
                  </tr>
                );
              })
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

export default AdminContactQueries;
