import type { WorkspaceInfo } from "../types";

type SidebarProps = {
  workspaces: WorkspaceInfo[];
  activeWorkspaceId: string | null;
  onAddWorkspace: () => void;
  onSelectWorkspace: (id: string) => void;
  onConnectWorkspace: (workspace: WorkspaceInfo) => void;
  onAddAgent: (workspace: WorkspaceInfo) => void;
};

export function Sidebar({
  workspaces,
  activeWorkspaceId,
  onAddWorkspace,
  onSelectWorkspace,
  onConnectWorkspace,
  onAddAgent,
}: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div>
          <div className="subtitle">Workspaces</div>
        </div>
        <button
          className="ghost"
          onClick={onAddWorkspace}
          data-tauri-drag-region="false"
        >
          Add
        </button>
      </div>
      <div className="workspace-list">
        {workspaces.map((entry) => (
          <div key={entry.id} className="workspace-card">
            <button
              className={`workspace-row ${
                entry.id === activeWorkspaceId ? "active" : ""
              }`}
              onClick={() => onSelectWorkspace(entry.id)}
            >
              <span className={`status-dot ${entry.connected ? "on" : "off"}`} />
              <div>
                <div className="workspace-name">{entry.name}</div>
              </div>
              {!entry.connected && (
                <span
                  className="connect"
                  onClick={(event) => {
                    event.stopPropagation();
                    onConnectWorkspace(entry);
                  }}
                >
                  connect
                </span>
              )}
            </button>
            <button
              className="agent-add"
              onClick={() => onAddAgent(entry)}
              title="Add agent"
            >
              + Agent
            </button>
          </div>
        ))}
        {!workspaces.length && (
          <div className="empty">Add a workspace to start.</div>
        )}
      </div>
    </aside>
  );
}
