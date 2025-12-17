export interface DataPoint {
  inc: number;
  score: number;
  c?: number; // Class: 0=Approve, 1=Review, 2=Deny
}

export interface Node {
  leaf: boolean;
  cls?: number;
  feat?: string;
  thr?: number;
  left?: Node;
  right?: Node;
}

export interface VoteResult {
  class: number;
  votes: Record<number, number>;
}

export interface Forest {
  trees: Node[];
}

export interface GridPoint {
  inc: number;
  score: number;
  class: number;
}

export enum LoanClass {
  Approve = 0,
  Review = 1,
  Deny = 2,
}

export const CLASS_COLORS = {
  [LoanClass.Approve]: '#10b981', // emerald-500
  [LoanClass.Review]: '#f59e0b', // amber-500
  [LoanClass.Deny]: '#ef4444',   // red-500
};

export const CLASS_BG_COLORS = {
  [LoanClass.Approve]: 'rgba(16, 185, 129, 0.2)',
  [LoanClass.Review]: 'rgba(245, 158, 11, 0.2)',
  [LoanClass.Deny]: 'rgba(239, 68, 68, 0.2)',
};

export const CLASS_NAMES = ['Approve', 'Review', 'Deny'];
