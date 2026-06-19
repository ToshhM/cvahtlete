'use client'

import { useMemo, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { updateAccountStatus } from '@/app/actions/admin'

type AccountStatus = 'active' | 'suspended' | 'revoked'

export interface AdminUserRow {
  id: string
  email: string
  full_name: string
  plan: string
  account_status: string
  is_owner: boolean
  is_super_admin: boolean
  created_at: string
}

interface AdminUsersDashboardProps {
  currentEmail: string
  rows: AdminUserRow[]
}

function statusLabel(status: string): string {
  switch (status) {
    case 'active': return 'Actif'
    case 'suspended': return 'Suspendu'
    case 'revoked': return 'Révoqué'
    default: return status
  }
}

function statusTone(status: string): string {
  switch (status) {
    case 'active': return 'var(--accent-2)'
    case 'suspended': return 'var(--gold)'
    case 'revoked': return 'var(--red)'
    default: return 'var(--muted)'
  }
}

function ActionForm({ email, status, disabled }: { email: string; status: AccountStatus; disabled?: boolean }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      name="account_status"
      value={status}
      disabled={disabled || pending}
      className="btn btn-ghost"
      style={{ padding: '8px 12px', fontSize: '.7rem', letterSpacing: '.12em' }}
    >
      {statusLabel(status)}
    </button>
  )
}

function UserRow({ row, currentEmail }: { row: AdminUserRow; currentEmail: string }) {
  const isSelf = row.email.toLowerCase() === currentEmail.toLowerCase()
  const canManage = !isSelf

  return (
    <>
      <td>
        <div style={{ display: 'grid', gap: 3 }}>
          <strong>{row.full_name || 'Sans nom'}</strong>
          <span style={{ color: 'var(--muted-2)', fontSize: '.8rem' }}>{row.email}</span>
        </div>
      </td>
      <td>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {row.is_super_admin && <span className="tag">Super admin</span>}
          {row.is_owner && <span className="tag">Owner</span>}
        </div>
      </td>
      <td>{row.plan}</td>
      <td>
        <span style={{ color: statusTone(row.account_status), fontWeight: 700 }}>
          {statusLabel(row.account_status)}
        </span>
      </td>
      <td style={{ fontSize: '.82rem', color: 'var(--muted-2)' }}>
        {new Date(row.created_at).toLocaleDateString('fr-FR')}
      </td>
      <td>
        <form action={updateAccountStatus} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <input type="hidden" name="email" value={row.email} />
          <ActionForm email={row.email} status="active" disabled={!canManage || row.account_status === 'active'} />
          <ActionForm email={row.email} status="suspended" disabled={!canManage || row.account_status === 'suspended'} />
          <ActionForm email={row.email} status="revoked" disabled={!canManage || row.account_status === 'revoked'} />
        </form>
        {isSelf && <div style={{ color: 'var(--muted-2)', fontSize: '.75rem', marginTop: 8 }}>Tu ne peux pas te modifier depuis cette console.</div>}
      </td>
    </>
  )
}

export default function AdminUsersDashboard({ currentEmail, rows }: AdminUsersDashboardProps) {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | AccountStatus>('all')

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows.filter((row) => {
      const matchQuery = !q || [row.email, row.full_name, row.plan].some((v) => String(v).toLowerCase().includes(q))
      const matchStatus = statusFilter === 'all' || row.account_status === statusFilter
      return matchQuery && matchStatus
    })
  }, [rows, query, statusFilter])

  const stats = useMemo(() => ({
    total: rows.length,
    active: rows.filter((r) => r.account_status === 'active').length,
    suspended: rows.filter((r) => r.account_status === 'suspended').length,
    revoked: rows.filter((r) => r.account_status === 'revoked').length,
    superAdmins: rows.filter((r) => r.is_super_admin).length,
  }), [rows])

  return (
    <div className="admin-shell" style={{ display: 'grid', gap: 22 }}>
      <div className="grid cols-3">
        <div className="card">
          <span className="tag">Comptes</span>
          <h3>{stats.total}</h3>
          <p>Total des profils gérés.</p>
        </div>
        <div className="card">
          <span className="tag">Actifs</span>
          <h3>{stats.active}</h3>
          <p>Comptes utilisables aujourd’hui.</p>
        </div>
        <div className="card">
          <span className="tag">Super admins</span>
          <h3>{stats.superAdmins}</h3>
          <p>Comptes avec droits maximaux.</p>
        </div>
      </div>

      <div className="app-card" style={{ display: 'grid', gap: 18 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'grid', gap: 6 }}>
            <h2 style={{ fontSize: '1.3rem', fontFamily: 'var(--font-display)' }}>Utilisateurs</h2>
            <p style={{ color: 'var(--muted-2)', fontSize: '.88rem' }}>
              Recherche, filtrage par statut et action rapide sur chaque compte.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un e-mail, nom ou plan"
              style={{ minWidth: 260, background: 'var(--bg-2)', border: '1px solid var(--border-2)', color: 'var(--text)', borderRadius: 6, padding: '12px 14px', fontFamily: 'var(--font-body)' }}
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | AccountStatus)}
              style={{ background: 'var(--bg-2)', border: '1px solid var(--border-2)', color: 'var(--text)', borderRadius: 6, padding: '12px 14px', fontFamily: 'var(--font-body)' }}
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actif</option>
              <option value="suspended">Suspendu</option>
              <option value="revoked">Révoqué</option>
            </select>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--muted-2)', fontSize: '.78rem', textTransform: 'uppercase', letterSpacing: '.12em' }}>
                <th style={{ padding: '12px 10px' }}>Compte</th>
                <th style={{ padding: '12px 10px' }}>Rôle</th>
                <th style={{ padding: '12px 10px' }}>Plan</th>
                <th style={{ padding: '12px 10px' }}>Statut</th>
                <th style={{ padding: '12px 10px' }}>Créé le</th>
                <th style={{ padding: '12px 10px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr key={row.id} style={{ borderTop: '1px solid var(--border)' }}>
                  <UserRow row={row} currentEmail={currentEmail} />
                </tr>
              ))}
              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '28px 12px', color: 'var(--muted-2)' }}>
                    Aucun compte ne correspond au filtre.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ color: 'var(--muted-2)', fontSize: '.82rem', display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <span>{filteredRows.length} compte(s) affiché(s)</span>
          <span>{stats.suspended} suspendu(s) · {stats.revoked} révoqué(s)</span>
        </div>
      </div>
    </div>
  )
}
