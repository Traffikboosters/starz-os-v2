export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          avatar: string | null
          role: 'user' | 'admin' | 'sales' | 'developer' | 'bge'
          department: 'sales' | 'fulfillment' | 'management' | 'none'
          phone: string | null
          is_active: boolean
          created_at: string
          updated_at: string
          last_sign_in_at: string
        }
        Insert: {
          id?: string
          email: string
          name?: string | null
          avatar?: string | null
          role?: 'user' | 'admin' | 'sales' | 'developer' | 'bge'
          department?: 'sales' | 'fulfillment' | 'management' | 'none'
          phone?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
          last_sign_in_at?: string
        }
        Update: Partial<Database['public']['Tables']['users']['Insert']>
      }
      prospects: {
        Row: {
          id: string
          business_name: string
          phone: string | null
          email: string | null
          website: string | null
          address: string | null
          city: string | null
          state: string | null
          zip_code: string | null
          industry: string | null
          vendor_source: 'google_maps' | 'linkedin' | 'yelp' | 'craigslist' | 'facebook' | 'yellow_pages' | 'web_form' | 'referral' | 'cold_outreach' | 'ad_campaign'
          google_rating: number | null
          review_count: number
          seo_score: number
          estimated_revenue: number | null
          lead_score: number
          status: 'hot' | 'warm' | 'cold' | 'dead'
          priority: 'critical' | 'high' | 'medium' | 'low'
          assigned_rep_id: string | null
          notes: string | null
          tags: string | null
          scraped_at: string
          updated_at: string
          converted_to_lead: boolean
        }
        Insert: Omit<Database['public']['Tables']['prospects']['Row'], 'id' | 'scraped_at' | 'updated_at'> & { id?: string; scraped_at?: string; updated_at?: string }
        Update: Partial<Database['public']['Tables']['prospects']['Insert']>
      }
      leads: {
        Row: {
          id: string
          prospect_id: string | null
          business_name: string
          contact_name: string | null
          phone: string | null
          email: string | null
          website: string | null
          city: string | null
          state: string | null
          industry: string | null
          vendor_source: 'google_maps' | 'linkedin' | 'yelp' | 'craigslist' | 'facebook' | 'yellow_pages' | 'web_form' | 'referral' | 'cold_outreach' | 'ad_campaign'
          lead_score: number
          status: 'hot' | 'warm' | 'cold' | 'dead'
          stage: 'new' | 'contacted' | 'interested' | 'proposal_sent' | 'negotiation' | 'closed_won' | 'closed_lost'
          estimated_value: number | null
          assigned_rep_id: string | null
          source: string | null
          notes: string | null
          tags: string | null
          last_contacted_at: string | null
          created_at: string
          updated_at: string
          closed_at: string | null
          closed_by: string | null
        }
        Insert: Omit<Database['public']['Tables']['leads']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string }
        Update: Partial<Database['public']['Tables']['leads']['Insert']>
      }
      calls: {
        Row: {
          id: string
          lead_id: string | null
          prospect_id: string | null
          rep_id: string | null
          phone_number: string
          business_name: string | null
          contact_name: string | null
          duration: number
          outcome: 'interested' | 'callback' | 'no_answer' | 'voicemail' | 'not_interested' | 'qualified' | 'proposal_sent' | 'transferred' | 'closed' | 'hangup'
          notes: string | null
          recording_url: string | null
          transcript: string | null
          ai_suggestions: string | null
          steve_whisper: string | null
          started_at: string
          ended_at: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['calls']['Row'], 'id' | 'started_at' | 'created_at'> & { id?: string; started_at?: string; created_at?: string }
        Update: Partial<Database['public']['Tables']['calls']['Insert']>
      }
      call_queue: {
        Row: {
          id: string
          lead_id: string | null
          prospect_id: string | null
          rep_id: string | null
          priority: 'critical' | 'high' | 'medium' | 'low'
          status: 'pending' | 'in_progress' | 'completed' | 'skipped'
          scheduled_for: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['call_queue']['Row'], 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Database['public']['Tables']['call_queue']['Insert']>
      }
      proposals: {
        Row: {
          id: string
          lead_id: string
          client_name: string
          client_email: string | null
          services: string
          subtotal: number
          discount_percent: number
          discount_amount: number
          tax: number
          total: number
          status: 'draft' | 'sent' | 'viewed' | 'signed' | 'paid' | 'cancelled' | 'refunded'
          signature: string | null
          signed_at: string | null
          signed_by: string | null
          stripe_checkout_id: string | null
          stripe_payment_intent: string | null
          pdf_url: string | null
          view_count: number
          last_viewed_at: string | null
          created_by: string | null
          created_at: string
          updated_at: string
          expires_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['proposals']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string }
        Update: Partial<Database['public']['Tables']['proposals']['Insert']>
      }
      payments: {
        Row: {
          id: string
          proposal_id: string | null
          lead_id: string | null
          client_name: string
          amount: number
          currency: string
          status: 'pending' | 'completed' | 'failed' | 'refunded' | 'disputed'
          stripe_payment_intent_id: string | null
          stripe_charge_id: string | null
          stripe_customer_id: string | null
          payment_method: 'card' | 'ach' | 'wire' | 'check' | 'cash'
          description: string | null
          metadata: string | null
          refunded_amount: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['payments']['Row'], 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Database['public']['Tables']['payments']['Insert']>
      }
      work_orders: {
        Row: {
          id: string
          proposal_id: string | null
          lead_id: string | null
          payment_id: string | null
          client_name: string
          service_type: 'seo' | 'ppc' | 'web_design' | 'social_media' | 'content' | 'reputation' | 'local_seo' | 'full_stack' | 'automation'
          title: string
          description: string | null
          priority: 'urgent' | 'high' | 'normal' | 'low'
          status: 'pending_validation' | 'hold_3day' | 'ready' | 'in_progress' | 'awaiting_client' | 'completed' | 'paused' | 'escalated' | 'cancelled'
          assigned_team: 'seo' | 'dev' | 'ads' | 'outreach' | 'ai_dev' | 'social'
          assigned_dev_id: string | null
          amount: number
          progress: number
          sla_hours: number
          due_date: string | null
          started_at: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['work_orders']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string }
        Update: Partial<Database['public']['Tables']['work_orders']['Insert']>
      }
      tasks: {
        Row: {
          id: string
          work_order_id: string
          title: string
          description: string | null
          assigned_to: string | null
          status: 'todo' | 'in_progress' | 'review' | 'done'
          priority: 'urgent' | 'high' | 'normal' | 'low'
          due_date: string | null
          completed_at: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['tasks']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string }
        Update: Partial<Database['public']['Tables']['tasks']['Insert']>
      }
      deliverables: {
        Row: {
          id: string
          work_order_id: string
          task_id: string | null
          title: string
          type: 'pdf' | 'image' | 'video' | 'spreadsheet' | 'document' | 'link' | 'code' | 'report'
          file_url: string | null
          file_size: number | null
          description: string | null
          uploaded_by: string | null
          client_status: 'pending_review' | 'approved' | 'rejected' | 'revision_requested'
          client_feedback: string | null
          version: number
          previous_version_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['deliverables']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string }
        Update: Partial<Database['public']['Tables']['deliverables']['Insert']>
      }
      campaigns: {
        Row: {
          id: string
          name: string
          type: 'cold_outreach' | 'follow_up' | 'missed_call' | 'proposal_reminder' | 'nurture'
          status: 'draft' | 'scheduled' | 'running' | 'paused' | 'completed'
          template_id: string | null
          subject: string | null
          body: string | null
          from_name: string | null
          from_email: string | null
          recipient_count: number
          sent_count: number
          open_count: number
          reply_count: number
          positive_reply_count: number
          daily_limit: number
          scheduled_for: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['campaigns']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string }
        Update: Partial<Database['public']['Tables']['campaigns']['Insert']>
      }
      email_templates: {
        Row: {
          id: string
          name: string
          type: 'cold_outreach' | 'follow_up' | 'missed_call' | 'proposal_reminder' | 'nurture'
          subject: string
          body: string
          variables: string | null
          is_default: boolean
          created_by: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['email_templates']['Row'], 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Database['public']['Tables']['email_templates']['Insert']>
      }
      seo_keywords: {
        Row: {
          id: string
          work_order_id: string | null
          client_id: string | null
          keyword: string
          target_url: string | null
          current_rank: number | null
          previous_rank: number | null
          search_volume: number | null
          difficulty: number | null
          change: number
          last_checked: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['seo_keywords']['Row'], 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Database['public']['Tables']['seo_keywords']['Insert']>
      }
      backlinks: {
        Row: {
          id: string
          work_order_id: string | null
          client_id: string | null
          source_url: string
          target_url: string
          anchor_text: string | null
          domain_authority: number | null
          status: 'prospect' | 'outreach_sent' | 'negotiating' | 'live' | 'lost' | 'rejected'
          acquired_at: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['backlinks']['Row'], 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Database['public']['Tables']['backlinks']['Insert']>
      }
      reports: {
        Row: {
          id: string
          work_order_id: string | null
          client_id: string | null
          title: string
          type: 'seo' | 'ads' | 'authority' | 'performance' | 'summary'
          period: 'weekly' | 'monthly' | 'quarterly' | 'custom'
          data: string | null
          pdf_url: string | null
          generated_by: string | null
          sent_to_client: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['reports']['Row'], 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Database['public']['Tables']['reports']['Insert']>
      }
      activity_log: {
        Row: {
          id: string
          user_id: string | null
          type: 'call' | 'deal_closed' | 'payment_received' | 'work_order_created' | 'task_completed' | 'seo_growth' | 'lead_assigned' | 'proposal_sent' | 'proposal_signed'
          entity_type: string | null
          entity_id: string | null
          description: string
          metadata: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['activity_log']['Row'], 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Database['public']['Tables']['activity_log']['Insert']>
      }
      automation_rules: {
        Row: {
          id: string
          name: string
          trigger: 'lead_created' | 'score_changed' | 'call_ended' | 'proposal_viewed' | 'payment_received' | 'status_changed' | 'no_activity'
          condition: string | null
          action: 'send_email' | 'send_sms' | 'assign_rep' | 'create_task' | 'alert_manager' | 'move_stage' | 'score_adjust'
          action_config: string | null
          is_active: boolean
          run_count: number
          last_run_at: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['automation_rules']['Row'], 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Database['public']['Tables']['automation_rules']['Insert']>
      }
      payouts: {
        Row: {
          id: string
          contractor_id: string
          deal_id: string | null
          payment_id: string | null
          deal_amount: number
          commission_rate: number
          commission_amount: number
          status: 'pending' | 'approved' | 'paid' | 'disputed'
          paid_at: string | null
          payment_method: string | null
          notes: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['payouts']['Row'], 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Database['public']['Tables']['payouts']['Insert']>
      }
      sales_victory_feed: {
        Row: {
          id: string
          rep_name: string
          rep_role: string
          rep_avatar: string | null
          sale_amount: number
          client_name: string
          city: string
          state: string
          service: string
          tier: 'small' | 'medium' | 'enterprise'
          org_id: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['sales_victory_feed']['Row'], 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Database['public']['Tables']['sales_victory_feed']['Insert']>
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
