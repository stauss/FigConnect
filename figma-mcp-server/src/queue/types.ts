import { BaseCommand, CommandResponse } from "../commands/types.js";

export type CommandStatus =
  | "pending"
  | "posted"
  | "completed"
  | "failed"
  | "timeout";

export interface QueuedCommand {
  command: BaseCommand;
  fileKey: string;
  status: CommandStatus;
  commentId?: string;
  response?: CommandResponse;
  createdAt: number;
  updatedAt: number;
  timeoutAt: number;
}

export interface QueueStats {
  pending: number;
  posted: number;
  completed: number;
  failed: number;
  timeout: number;
  total: number;
}
