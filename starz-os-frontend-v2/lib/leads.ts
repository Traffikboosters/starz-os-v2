export const DEFAULT_PAGE_SIZE = 25;

export interface Lead {
  id: string;
  name: string | null;
  company: string | null;
  score: number | null;
  status: string | null;
  assigned_rep_id: string | null;
  estimated_value: string | null;
  updated_at: string | null;
}
