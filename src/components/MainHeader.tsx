import type { WorkspaceInfo } from "../types";

type MainHeaderProps = {
  workspace: WorkspaceInfo;
  onNewThread: () => void;
};

export function MainHeader({ workspace, onNewThread }: MainHeaderProps) {
  return (
    <header className="main-header" data-tauri-drag-region>
      <div>
        <div className="workspace-title">{workspace.name}</div>
        <div className="workspace-meta">{workspace.path}</div>
      </div>
      <div className="actions">
        <button
          className="secondary"
          onClick={onNewThread}
          data-tauri-drag-region="false"
        >
          New thread
        </button>
      </div>
    </header>
  );
}
