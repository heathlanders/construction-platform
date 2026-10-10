-- 0047_design_studio_proposal
--
-- Design Studio P4: the client answers the contractor's proposal inside the portal.
-- The proposal itself is the existing estimate proposal PDF (estimates.proposal_path, 0029). A response
-- is tied to the proposal it answered: when the contractor re-sends (estimates.proposal_generated_at
-- moves past proposal_responded_at) the response is treated as stale and the client answers again.

ALTER TABLE design_requests
  ADD COLUMN proposal_response TEXT CHECK (proposal_response IN ('accepted','changes_requested')),
  ADD COLUMN proposal_responded_at TIMESTAMPTZ,
  ADD COLUMN proposal_note TEXT;
