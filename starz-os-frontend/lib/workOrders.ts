import { createClient } from "@/lib/supabase/client";

export type WorkOrder = {
  id: string;
  client_name: string;
  business_name: string | null;
  contact_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  project_type: string | null;
  service: string | null;
  service_package: string | null;
  status: string | null;
  status_detail: string | null;
  payment_status: string | null;
  total_amount: number | null;
  deposit_amount: number | null;
  installment_amount: number | null;
  billing_cycle: string | null;
  assigned_to: string | null;
  proposal_id: string | null;
  deliverables: Record<string, unknown>;
  scope_of_work: Record<string, unknown> | null;
  start_date: string | null;
  due_date: string | null;
  submitted_at: string | null;
  deployed_at: string | null;
  fulfilled_at: string | null;
  finalized: boolean | null;
  contract_url: string | null;
  created_at: string | null;
  updated_at: string | null;
  tenant_id: string;
};

export async function getWorkOrders(): Promise<WorkOrder[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("work_orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching work orders:", error.message);
    return [];
  }
  return data as WorkOrder[];
}

export async function getWorkOrderById(id: string): Promise<WorkOrder | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("work_orders")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching work order:", error.message);
    return null;
  }
  return data as WorkOrder;
}

export async function getWorkOrdersByStatus(status: string): Promise<WorkOrder[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("work_orders")
    .select("*")
    .eq("status", status)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching work orders by status:", error.message);
    return [];
  }
  return data as WorkOrder[];
}

export async function getWorkOrdersByAssignee(assignedTo: string): Promise<WorkOrder[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("work_orders")
    .select("*")
    .eq("assigned_to", assignedTo)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching assigned work orders:", error.message);
    return [];
  }
  return data as WorkOrder[];
}

export async function updateWorkOrderStatus(
  id: string,
  status: string,
  statusDetail?: string
): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from("work_orders")
    .update({
      status,
      status_detail: statusDetail ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("Error updating work order status:", error.message);
    return false;
  }
  return true;
}

export async function assignWorkOrder(
  id: string,
  assignedTo: string
): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from("work_orders")
    .update({
      assigned_to: assignedTo,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("Error assigning work order:", error.message);
    return false;
  }
  return true;
}

export function getStatusColor(status: string | null): string {
  switch (status?.toLowerCase()) {
    case "probation":
      return "text-yellow-400 bg-yellow-400/10";
    case "active":
      return "text-green-400 bg-green-400/10";
    case "fulfilled":
      return "text-blue-400 bg-blue-400/10";
    case "cancelled":
      return "text-red-400 bg-red-400/10";
    case "paused":
      return "text-orange-400 bg-orange-400/10";
    default:
      return "text-gray-400 bg-gray-400/10";
  }
}

export function getPaymentStatusColor(status: string | null): string {
  switch (status?.toLowerCase()) {
    case "paid":
      return "text-green-400 bg-green-400/10";
    case "deposit_paid":
      return "text-yellow-400 bg-yellow-400/10";
    case "pending":
      return "text-orange-400 bg-orange-400/10";
    case "overdue":
      return "text-red-400 bg-red-400/10";
    default:
      return "text-gray-400 bg-gray-400/10";
  }
}