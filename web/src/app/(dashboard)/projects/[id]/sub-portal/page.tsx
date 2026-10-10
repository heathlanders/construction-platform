'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

interface Member { id: string; email: string; first_name: string; last_name: string; status: string }

export default function ProjectSubPortalPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation('connections');
  const [members, setMembers] = useState<Member[]>([]);
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function loadMembers() {
    // sub_portal users assigned to this project (via general members endpoint — filtered client-side).
    const res = await fetch(`/api/v1/projects/${id}/members`).catch(() => null);
    if (res?.ok) {
      const d = await res.json();
      setMembers((d.members ?? []).filter((m: any) => m.role === 'sub_portal'));
    }
  }
  useEffect(() => { loadMembers(); }, [id]);

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setBusy(true);
    try {
      const res = await fetch('/api/v1/sub-portal/invite', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, first_name: firstName, last_name: lastName, project_id: id }),
      });
      if (res.ok) {
        setMsg({ kind: 'ok', text: t('sub_portal.success') });
        setEmail(''); setFirstName(''); setLastName('');
        loadMembers();
      } else {
        const d = await res.json().catch(() => ({}));
        const code = d?.error?.code;
        const text = code === 'EMAIL_ALREADY_EXISTS' ? t('sub_portal.error_exists')
          : code === 'USER_LIMIT_REACHED' ? t('sub_portal.error_limit')
          : t('sub_portal.error_generic');
        setMsg({ kind: 'err', text });
      }
    } catch {
      setMsg({ kind: 'err', text: t('sub_portal.error_generic') });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <Link href={`/projects/${id}`} className="text-xs text-gray-500 hover:text-gray-800">← Project</Link>
      <h1 className="text-xl font-semibold text-gray-900 mt-2">{t('sub_portal.title')}</h1>
      <p className="text-sm text-gray-500 mt-1 mb-6">{t('sub_portal.subtitle')}</p>

      <form onSubmit={invite} className="bg-white border border-gray-200 rounded-lg p-5 space-y-4 mb-8">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">{t('sub_portal.first_name_label')}</label>
            <input value={firstName} onChange={(e) => setFirstName(e.target.value)} required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">{t('sub_portal.last_name_label')}</label>
            <input value={lastName} onChange={(e) => setLastName(e.target.value)} required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">{t('sub_portal.email_label')}</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
        </div>
        {msg && <p className={`text-sm ${msg.kind === 'ok' ? 'text-green-600' : 'text-red-600'}`}>{msg.text}</p>}
        <button type="submit" disabled={busy}
          className="bg-blue-600 text-white text-sm font-medium rounded-md px-4 py-2 hover:bg-blue-700 disabled:opacity-50">
          {busy ? t('sub_portal.sending') : t('sub_portal.invite_btn')}
        </button>
      </form>

      <h2 className="text-sm font-semibold text-gray-800 mb-3">{t('sub_portal.members_title')}</h2>
      {members.length === 0 ? (
        <p className="text-sm text-gray-400">{t('sub_portal.no_members')}</p>
      ) : (
        <div className="space-y-2">
          {members.map((m) => (
            <div key={m.id} className="bg-white border border-gray-200 rounded-md px-3 py-2 flex items-center justify-between text-sm">
              <span className="text-gray-900">{m.first_name} {m.last_name} · {m.email}</span>
              <span className="text-xs text-gray-500">
                {m.status === 'active' ? t('sub_portal.status_active') : t('sub_portal.status_invited')}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
