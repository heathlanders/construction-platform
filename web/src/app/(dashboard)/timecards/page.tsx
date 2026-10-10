import { RoleGate } from '@/components/auth/role-gate';
import ReviewClient from './review-client';

// Timecard approval queue = OWNER / PM only (mirrors API approve/reject guard).
// Other roles are bounced to their own timecard view.
export default function TimecardsPage() {
  return (
    <RoleGate allow={['owner', 'project_manager']}>
      <ReviewClient />
    </RoleGate>
  );
}
