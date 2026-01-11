import type { ApprovalRequest } from "../types";

type ApprovalsProps = {
  approvals: ApprovalRequest[];
  onDecision: (request: ApprovalRequest, decision: "accept" | "decline") => void;
};

export function Approvals({ approvals, onDecision }: ApprovalsProps) {
  if (!approvals.length) {
    return null;
  }

  return (
    <div className="approvals">
      <div className="approvals-title">Approvals</div>
      {approvals.map((request) => (
        <div key={request.request_id} className="approval-card">
          <div className="approval-method">{request.method}</div>
          <div className="approval-body">
            {JSON.stringify(request.params, null, 2)}
          </div>
          <div className="approval-actions">
            <button
              className="secondary"
              onClick={() => onDecision(request, "decline")}
            >
              Decline
            </button>
            <button
              className="primary"
              onClick={() => onDecision(request, "accept")}
            >
              Approve
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
