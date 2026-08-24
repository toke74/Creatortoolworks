export type ToolEventName =
  | "tool_view"
  | "tool_started"
  | "tool_completed"
  | "tool_error"
  | "copy_clicked"
  | "reset_clicked"
  | "related_tool_clicked";

export interface ToolEvent {
  name: ToolEventName;
  toolId: string;
}

export function trackToolEvent(_event: ToolEvent): void {
  // Intentionally no-op until analytics is explicitly enabled.
  // Never include raw user-entered text, uploaded file contents, or sensitive data.
}
