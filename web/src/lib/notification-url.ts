interface NotificationLike {
  category: string;
  data: Record<string, unknown> | null;
}

export function resolveNotificationUrl(n: NotificationLike): string {
  const d = (n.data ?? {}) as Record<string, string>;

  // Asset events
  if (d.asset_id) return `/assets/${d.asset_id}`;
  if (d.policy_id && !d.warranty_id) return `/assets/insurance`;

  // Warranty events
  if (d.warranty_id) return `/builder-warranties/${d.warranty_id}`;

  // Cross-tenant bridge events — before the project checks: a shared-event ref may carry
  // the COUNTERPARTY's project_id, which is not routable in this tenant. The connection
  // detail page is always the right landing surface.
  if (d.connection_id) return `/connections/${d.connection_id}`;

  // Design Studio client requests (new request, proposal accepted / changes requested)
  if (d.design_request_id) return `/client-requests/${d.design_request_id}`;

  // Blueprint / project events
  if (d.analysis_id && d.project_id) return `/projects/${d.project_id}/blueprints/${d.analysis_id}/review`;
  if (d.project_id) return `/projects/${d.project_id}`;

  // Category fallbacks
  switch (n.category) {
    case 'financial':    return '/settings/billing';
    case 'safety':       return '/safety';
    case 'system':       return '/settings';
    case 'cross_tenant': return '/projects';
    default:             return '/notifications';
  }
}
