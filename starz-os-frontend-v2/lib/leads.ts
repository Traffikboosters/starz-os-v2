export const DEFAULT_PAGE_SIZE = 20;

export interface Lead {
  id: number;
  name: string | null;
  company: string | null;
  score: number | null;
  status: string | null;
  estimated_value: number | null;
  assigned_rep_id: string | null;
  updated_at: string | null;
}
