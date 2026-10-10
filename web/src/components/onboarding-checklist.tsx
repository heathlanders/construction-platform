'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';

interface Step {
  key: string;
  done: boolean;
  href: string | null;
}

export function OnboardingChecklist() {
  const { t } = useTranslation('common');
  const [steps, setSteps] = useState<Step[]>([]);
  const [dismissed, setDismissed] = useState(false);
  const [ready, setReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/users/me')
      .then((r) => r.json())
      .then((data) => {
        const user = data.user;
        if (!user || user.role?.toLowerCase() !== 'owner') {
          setReady(true);
          return;
        }

        const uid = user.id as string;
        setUserId(uid);

        if (localStorage.getItem(`onboarding_dismissed_${uid}`)) {
          setDismissed(true);
          setReady(true);
          return;
        }

        Promise.allSettled([
          fetch('/api/projects?limit=1').then((r) => r.json()),
          fetch('/api/users?limit=10').then((r) => r.json()),
          fetch('/api/cost-codes?limit=1').then((r) => r.json()),
          fetch('/api/time-entries?limit=1').then((r) => r.json()),
        ]).then(([projectsRes, usersRes, costCodesRes, timeEntriesRes]) => {
          const projects: unknown[] =
            projectsRes.status === 'fulfilled' ? (projectsRes.value.projects ?? []) : [];
          const users: unknown[] =
            usersRes.status === 'fulfilled' ? (usersRes.value.users ?? []) : [];
          const costCodes: unknown[] =
            costCodesRes.status === 'fulfilled' ? (costCodesRes.value.cost_codes ?? []) : [];
          const timeEntries: unknown[] =
            timeEntriesRes.status === 'fulfilled' ? (timeEntriesRes.value.time_entries ?? []) : [];

          const hasProject = projects.length > 0;
          const hasTeamMember = users.length > 1;
          const hasCostCode = costCodes.length > 0;
          const hasTimeEntry = timeEntries.length > 0;
          const firstProjectId =
            hasProject && projects[0] && typeof projects[0] === 'object' && projects[0] !== null
              ? (projects[0] as { id?: string }).id ?? null
              : null;

          setSteps([
            { key: 'account', done: true, href: null },
            { key: 'project', done: hasProject, href: hasProject ? null : '/projects/new' },
            {
              key: 'team_member',
              done: hasTeamMember,
              href: hasTeamMember ? null : '/users/new',
            },
            {
              key: 'cost_code',
              done: hasCostCode,
              href: hasCostCode
                ? null
                : firstProjectId
                  ? `/projects/${firstProjectId}/budget`
                  : '/projects',
            },
            {
              key: 'time_entry',
              done: hasTimeEntry,
              href: hasTimeEntry
                ? null
                : firstProjectId
                  ? `/projects/${firstProjectId}/time-entries/new`
                  : '/projects',
            },
          ]);
          setReady(true);
        });
      })
      .catch(() => setReady(true));
  }, []);

  if (!ready || dismissed || steps.length === 0) return null;

  const completedCount = steps.filter((s) => s.done).length;
  const allComplete = completedCount === steps.length;
  const progressPct = Math.round((completedCount / steps.length) * 100);

  const handleDismiss = () => {
    if (userId) localStorage.setItem(`onboarding_dismissed_${userId}`, '1');
    setDismissed(true);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-900">
          🏗 {t('onboarding.title')}
        </h2>
        {allComplete && (
          <button
            onClick={handleDismiss}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            {t('onboarding.dismiss')}
          </button>
        )}
      </div>

      <ul className="space-y-3 mb-4">
        {steps.map((step) => (
          <li key={step.key} className="flex items-center gap-3">
            {step.done ? (
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-3 h-3 text-green-600" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M2 6l3 3 5-5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            ) : (
              <span className="flex-shrink-0 w-5 h-5 rounded-full border-2 border-gray-300" />
            )}
            {step.href ? (
              <Link
                href={step.href}
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
              >
                {t(`onboarding.steps.${step.key}`)}
              </Link>
            ) : (
              <span className={`text-sm ${step.done ? 'text-gray-500 line-through' : 'text-gray-700'}`}>
                {t(`onboarding.steps.${step.key}`)}
              </span>
            )}
          </li>
        ))}
      </ul>

      <div className="space-y-1">
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="text-xs text-gray-500">
          {t('onboarding.progress', { completed: completedCount, total: steps.length })}
        </p>
      </div>
    </div>
  );
}
