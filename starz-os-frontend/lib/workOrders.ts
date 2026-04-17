import { createClient } from "@/lib/supabase/client";

export type WorkOrder = {
  id: string;
  client_name: string | null;
  business_name: string | null;
  email: string | null;
  phone: string | null;
  package: string | null;
  service_type: string | null;
  status: string | null;
  payment_status: string | null;
  fulfillment_status: string | null;
  total_amount: string | null;
  deposit_amount: string | null;
  monthly_amount: string | null;
  assigned_to: string | null;
  proposal_id: string | null;
  proposal_status: string | null;
  start_date: string | null;
  due_date: string | null;
  production_released_at: string | null;
  clearance_ends_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  tenant_id: string | null;
};

export async function getWorkOrders(): Promise<WorkOrder[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .schema("deals")
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
    .schema("deals")
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

export async function updateWorkOrderStatus(
  id: string,
  status: string
): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .schema("deals")
    .from("work_orders")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("Error updating work order status:", error.message);
    return false;
  }
  return true;
}

export function getStatusColor(status: string | null): string {
  switch (status?.toLowerCase()) {
    case "probation": return "text-yellow-400 bg-yellow-400/10";
    case "active": return "text-green-400 bg-green-400/10";
    case "fulfilled": return "text-blue-400 bg-blue-400/10";
    case "cancelled": return "text-red-400 bg-red-400/10";
    case "paused": return "text-orange-400 bg-orange-400/10";
    case "pending": return "text-orange-400 bg-orange-400/10";
    default: return "text-gray-400 bg-gray-400/10";
  }
}

export function getPaymentStatusColor(status: string | null): string {
  switch (status?.toLowerCase()) {
    case "paid": return "text-green-400 bg-green-400/10";
    case "deposit_paid": return "text-yellow-400 bg-yellow-400/10";
    case "pending": return "text-orange-400 bg-orange-400/10";
    case "overdue": return "text-red-400 bg-red-400/10";
    default: return "text-gray-400 bg-gray-400/10";
  }
}