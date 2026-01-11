import { useCallback, useMemo, useReducer } from "react";
import type { ApprovalRequest, Message, WorkspaceInfo } from "../types";
import {
  respondToServerRequest,
  sendUserMessage as sendUserMessageService,
  startThread as startThreadService,
} from "../services/tauri";
import { useAppServerEvents } from "./useAppServerEvents";

const emptyMessages: Record<string, Message[]> = {};

type ThreadState = {
  activeThreadId: string | null;
  messagesByThread: Record<string, Message[]>;
  approvals: ApprovalRequest[];
};

type ThreadAction =
  | { type: "setActiveThreadId"; threadId: string | null }
  | { type: "addUserMessage"; threadId: string; message: Message }
  | { type: "appendAgentDelta"; threadId: string; itemId: string; delta: string }
  | { type: "completeAgentMessage"; threadId: string; itemId: string; text: string }
  | { type: "addApproval"; approval: ApprovalRequest }
  | { type: "removeApproval"; requestId: number };

const initialState: ThreadState = {
  activeThreadId: null,
  messagesByThread: emptyMessages,
  approvals: [],
};

function threadReducer(state: ThreadState, action: ThreadAction): ThreadState {
  switch (action.type) {
    case "setActiveThreadId":
      return { ...state, activeThreadId: action.threadId };
    case "addUserMessage": {
      const list = state.messagesByThread[action.threadId] ?? [];
      return {
        ...state,
        messagesByThread: {
          ...state.messagesByThread,
          [action.threadId]: [...list, action.message],
        },
      };
    }
    case "appendAgentDelta": {
      const list = [...(state.messagesByThread[action.threadId] ?? [])];
      const existing = list.find((msg) => msg.id === action.itemId);
      if (existing) {
        existing.text += action.delta;
      } else {
        list.push({ id: action.itemId, role: "assistant", text: action.delta });
      }
      return {
        ...state,
        messagesByThread: { ...state.messagesByThread, [action.threadId]: list },
      };
    }
    case "completeAgentMessage": {
      const list = [...(state.messagesByThread[action.threadId] ?? [])];
      const existing = list.find((msg) => msg.id === action.itemId);
      if (existing) {
        existing.text = action.text || existing.text;
      } else {
        list.push({ id: action.itemId, role: "assistant", text: action.text });
      }
      return {
        ...state,
        messagesByThread: { ...state.messagesByThread, [action.threadId]: list },
      };
    }
    case "addApproval":
      return { ...state, approvals: [...state.approvals, action.approval] };
    case "removeApproval":
      return {
        ...state,
        approvals: state.approvals.filter(
          (item) => item.request_id !== action.requestId,
        ),
      };
    default:
      return state;
  }
}

type UseThreadsOptions = {
  activeWorkspace: WorkspaceInfo | null;
  onWorkspaceConnected: (id: string) => void;
};

export function useThreads({ activeWorkspace, onWorkspaceConnected }: UseThreadsOptions) {
  const [state, dispatch] = useReducer(threadReducer, initialState);

  const activeMessages = useMemo(
    () => (state.activeThreadId ? state.messagesByThread[state.activeThreadId] ?? [] : []),
    [state.activeThreadId, state.messagesByThread],
  );

  const handleWorkspaceConnected = useCallback(
    (workspaceId: string) => {
      onWorkspaceConnected(workspaceId);
    },
    [onWorkspaceConnected],
  );

  const handlers = useMemo(
    () => ({
      onWorkspaceConnected: handleWorkspaceConnected,
      onApprovalRequest: (approval: ApprovalRequest) => {
        dispatch({ type: "addApproval", approval });
      },
      onAgentMessageDelta: ({
        threadId,
        itemId,
        delta,
      }: {
        threadId: string;
        itemId: string;
        delta: string;
      }) => {
        dispatch({ type: "appendAgentDelta", threadId, itemId, delta });
      },
      onAgentMessageCompleted: ({
        threadId,
        itemId,
        text,
      }: {
        threadId: string;
        itemId: string;
        text: string;
      }) => {
        dispatch({ type: "completeAgentMessage", threadId, itemId, text });
      },
    }),
    [handleWorkspaceConnected],
  );

  useAppServerEvents(handlers);

  const startThread = useCallback(async () => {
    if (!activeWorkspace) {
      return null;
    }
    const response = await startThreadService(activeWorkspace.id);
    const thread = response.result?.thread ?? response.thread;
    const threadId = String(thread?.id ?? "");
    if (threadId) {
      dispatch({ type: "setActiveThreadId", threadId });
      return threadId;
    }
    return null;
  }, [activeWorkspace]);

  const sendUserMessage = useCallback(
    async (text: string) => {
      if (!activeWorkspace || !text.trim()) {
        return;
      }
      let threadId = state.activeThreadId;
      if (!threadId) {
        threadId = await startThread();
        if (!threadId) {
          return;
        }
      }

      const message: Message = {
        id: `${Date.now()}-user`,
        role: "user",
        text: text.trim(),
      };
      dispatch({ type: "addUserMessage", threadId, message });
      await sendUserMessageService(activeWorkspace.id, threadId, message.text);
    },
    [activeWorkspace, startThread, state.activeThreadId],
  );

  const handleApprovalDecision = useCallback(
    async (request: ApprovalRequest, decision: "accept" | "decline") => {
      await respondToServerRequest(
        request.workspace_id,
        request.request_id,
        decision,
      );
      dispatch({ type: "removeApproval", requestId: request.request_id });
    },
    [],
  );

  const setActiveThreadId = useCallback((threadId: string | null) => {
    dispatch({ type: "setActiveThreadId", threadId });
  }, []);

  return {
    activeThreadId: state.activeThreadId,
    setActiveThreadId,
    activeMessages,
    approvals: state.approvals,
    startThread,
    sendUserMessage,
    handleApprovalDecision,
  };
}
