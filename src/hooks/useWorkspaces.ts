import { useEffect, useMemo, useState } from "react";
import type { WorkspaceInfo } from "../types";
import {
  addWorkspace as addWorkspaceService,
  connectWorkspace as connectWorkspaceService,
  listWorkspaces,
  pickWorkspacePath,
} from "../services/tauri";

export function useWorkspaces() {
  const [workspaces, setWorkspaces] = useState<WorkspaceInfo[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);

  useEffect(() => {
    listWorkspaces()
      .then((entries) => {
        setWorkspaces(entries);
        setActiveWorkspaceId(null);
      })
      .catch((err) => console.error("Failed to load workspaces", err));
  }, []);

  const activeWorkspace = useMemo(
    () => workspaces.find((entry) => entry.id === activeWorkspaceId) ?? null,
    [activeWorkspaceId, workspaces],
  );

  async function addWorkspace() {
    const selection = await pickWorkspacePath();
    if (!selection) {
      return null;
    }
    const workspace = await addWorkspaceService(selection, null);
    setWorkspaces((prev) => [...prev, workspace]);
    setActiveWorkspaceId(workspace.id);
    return workspace;
  }

  async function connectWorkspace(entry: WorkspaceInfo) {
    await connectWorkspaceService(entry.id);
  }

  function markWorkspaceConnected(id: string) {
    setWorkspaces((prev) =>
      prev.map((entry) => (entry.id === id ? { ...entry, connected: true } : entry)),
    );
  }

  return {
    workspaces,
    activeWorkspace,
    activeWorkspaceId,
    setActiveWorkspaceId,
    addWorkspace,
    connectWorkspace,
    markWorkspaceConnected,
  };
}
