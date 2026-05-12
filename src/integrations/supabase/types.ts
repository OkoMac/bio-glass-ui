export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      acquisition_vouchers: {
        Row: {
          bion_fee_rand: string
          claimed_at: string
          claimed_by: string
          created_at: string
          expires_at: string
          face_value_rand: string
          id: string
          max_distance_km: string
          provider_id: string
          provider_payout_rand: string
          redeemed_at: string
          redeemed_booking_id: string
          status: string
        }
        Insert: {
          bion_fee_rand?: string
          claimed_at?: string
          claimed_by?: string
          created_at?: string
          expires_at: string
          face_value_rand: string
          id: string
          max_distance_km: string
          provider_id: string
          provider_payout_rand?: string
          redeemed_at?: string
          redeemed_booking_id?: string
          status: string
        }
        Update: {
          bion_fee_rand?: string
          claimed_at?: string
          claimed_by?: string
          created_at?: string
          expires_at?: string
          face_value_rand?: string
          id?: string
          max_distance_km?: string
          provider_id?: string
          provider_payout_rand?: string
          redeemed_at?: string
          redeemed_booking_id?: string
          status?: string
        }
        Relationships: []
      }
      ad_revenue_log: {
        Row: {
          clicks: string
          created_at: string
          date: string
          id: string
          impressions: string
          page_views: string
          revenue_cents: string
          source: string
          unique_visitors: string
        }
        Insert: {
          clicks?: string
          created_at?: string
          date: string
          id: string
          impressions?: string
          page_views?: string
          revenue_cents?: string
          source: string
          unique_visitors?: string
        }
        Update: {
          clicks?: string
          created_at?: string
          date?: string
          id?: string
          impressions?: string
          page_views?: string
          revenue_cents?: string
          source?: string
          unique_visitors?: string
        }
        Relationships: []
      }
      admin_audit_log: {
        Row: {
          action: string
          admin_email: string
          admin_user_id: string
          created_at: string
          details: string
          id: string
          ip_address: string
          target_id: string
          target_type: string
        }
        Insert: {
          action: string
          admin_email?: string
          admin_user_id?: string
          created_at?: string
          details?: string
          id: string
          ip_address?: string
          target_id?: string
          target_type?: string
        }
        Update: {
          action?: string
          admin_email?: string
          admin_user_id?: string
          created_at?: string
          details?: string
          id?: string
          ip_address?: string
          target_id?: string
          target_type?: string
        }
        Relationships: []
      }
      admin_mfa_challenges: {
        Row: {
          attempts: string
          channel: string
          client_ip: string
          code_hash: string
          created_at: string
          expires_at: string
          id: string
          used: string
          user_agent: string
          user_id: string
          verified_at: string
        }
        Insert: {
          attempts: string
          channel: string
          client_ip?: string
          code_hash: string
          created_at: string
          expires_at: string
          id: string
          used: string
          user_agent?: string
          user_id: string
          verified_at?: string
        }
        Update: {
          attempts?: string
          channel?: string
          client_ip?: string
          code_hash?: string
          created_at?: string
          expires_at?: string
          id?: string
          used?: string
          user_agent?: string
          user_id?: string
          verified_at?: string
        }
        Relationships: []
      }
      admin_super_pending_actions: {
        Row: {
          action_payload: string
          action_type: string
          approved_at: string
          approver_id: string
          approver_role: string
          created_at: string
          endpoint: string
          executed_at: string
          execution_error: string
          execution_result: string
          expires_at: string
          id: string
          initiator_id: string
          initiator_role: string
          rationale: string
          rejected_at: string
          rejection_reason: string
          status: string
        }
        Insert: {
          action_payload: string
          action_type: string
          approved_at?: string
          approver_id?: string
          approver_role?: string
          created_at: string
          endpoint: string
          executed_at?: string
          execution_error?: string
          execution_result?: string
          expires_at: string
          id: string
          initiator_id: string
          initiator_role: string
          rationale: string
          rejected_at?: string
          rejection_reason?: string
          status: string
        }
        Update: {
          action_payload?: string
          action_type?: string
          approved_at?: string
          approver_id?: string
          approver_role?: string
          created_at?: string
          endpoint?: string
          executed_at?: string
          execution_error?: string
          execution_result?: string
          expires_at?: string
          id?: string
          initiator_id?: string
          initiator_role?: string
          rationale?: string
          rejected_at?: string
          rejection_reason?: string
          status?: string
        }
        Relationships: []
      }
      affiliates: {
        Row: {
          affiliate_code: string
          created_at: string
          id: string
          pending_payout_rand: string
          profile_id: string
          tier: string
          total_earned_rand: string
          total_referrals: string
        }
        Insert: {
          affiliate_code: string
          created_at?: string
          id: string
          pending_payout_rand?: string
          profile_id: string
          tier?: string
          total_earned_rand?: string
          total_referrals?: string
        }
        Update: {
          affiliate_code?: string
          created_at?: string
          id?: string
          pending_payout_rand?: string
          profile_id?: string
          tier?: string
          total_earned_rand?: string
          total_referrals?: string
        }
        Relationships: []
      }
      agent_action_log: {
        Row: {
          confirmation_token: string
          created_at: string
          error_message: string
          id: string
          ip: string
          params: string
          profile_id: string
          result: string
          status: string
          surface: string
          tool_name: string
          user_agent: string
        }
        Insert: {
          confirmation_token?: string
          created_at: string
          error_message?: string
          id: string
          ip?: string
          params: string
          profile_id: string
          result?: string
          status: string
          surface: string
          tool_name: string
          user_agent?: string
        }
        Update: {
          confirmation_token?: string
          created_at?: string
          error_message?: string
          id?: string
          ip?: string
          params?: string
          profile_id?: string
          result?: string
          status?: string
          surface?: string
          tool_name?: string
          user_agent?: string
        }
        Relationships: []
      }
      assessment_questions: {
        Row: {
          course_id: string
          created_at: string
          explanation: string
          id: string
          options: string
          points: string
          question_number: string
          question_text: string
          question_type: string
        }
        Insert: {
          course_id: string
          created_at?: string
          explanation?: string
          id: string
          options: string
          points?: string
          question_number: string
          question_text: string
          question_type?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          explanation?: string
          id?: string
          options?: string
          points?: string
          question_number?: string
          question_text?: string
          question_type?: string
        }
        Relationships: []
      }
      b1_0_phase6_backfill_summary: {
        Row: {
          earliest_grant: string
          granted_via: string
          grants: string
          latest_grant: string
          unique_clients: string
          unique_providers: string
        }
        Insert: {
          earliest_grant?: string
          granted_via?: string
          grants?: string
          latest_grant?: string
          unique_clients?: string
          unique_providers?: string
        }
        Update: {
          earliest_grant?: string
          granted_via?: string
          grants?: string
          latest_grant?: string
          unique_clients?: string
          unique_providers?: string
        }
        Relationships: []
      }
      b1_9_phase_1_summary: {
        Row: {
          blocklist_entries: string
          blocklist_pending_native_review: string
          profiles_with_bion_id: string
          total_profiles: string
        }
        Insert: {
          blocklist_entries?: string
          blocklist_pending_native_review?: string
          profiles_with_bion_id?: string
          total_profiles?: string
        }
        Update: {
          blocklist_entries?: string
          blocklist_pending_native_review?: string
          profiles_with_bion_id?: string
          total_profiles?: string
        }
        Relationships: []
      }
      b_reviews: {
        Row: {
          created_at: string
          decision: string
          entity_id: string
          entity_type: string
          flagged_concerns: string
          id: string
          reasoning: string
          risk_score: string
        }
        Insert: {
          created_at?: string
          decision: string
          entity_id: string
          entity_type: string
          flagged_concerns?: string
          id: string
          reasoning: string
          risk_score?: string
        }
        Update: {
          created_at?: string
          decision?: string
          entity_id?: string
          entity_type?: string
          flagged_concerns?: string
          id?: string
          reasoning?: string
          risk_score?: string
        }
        Relationships: []
      }
      bicademy_course_completion: {
        Row: {
          assessment_passed: string
          assessment_score: string
          completed: string
          course_id: string
          first_lesson_at: string
          last_lesson_at: string
          lessons_done: string
          lessons_total: string
          profile_id: string
          required_for_role: string
          slug: string
          target_role: string
          title: string
        }
        Insert: {
          assessment_passed?: string
          assessment_score?: string
          completed?: string
          course_id?: string
          first_lesson_at?: string
          last_lesson_at?: string
          lessons_done?: string
          lessons_total?: string
          profile_id?: string
          required_for_role?: string
          slug?: string
          target_role?: string
          title?: string
        }
        Update: {
          assessment_passed?: string
          assessment_score?: string
          completed?: string
          course_id?: string
          first_lesson_at?: string
          last_lesson_at?: string
          lessons_done?: string
          lessons_total?: string
          profile_id?: string
          required_for_role?: string
          slug?: string
          target_role?: string
          title?: string
        }
        Relationships: []
      }
      bion_id_blocklist: {
        Row: {
          added_by: string
          created_at: string
          id: string
          language: string
          pattern: string
          pattern_kind: string
          pending_review: string
          reason: string
        }
        Insert: {
          added_by?: string
          created_at: string
          id: string
          language?: string
          pattern: string
          pattern_kind: string
          pending_review: string
          reason?: string
        }
        Update: {
          added_by?: string
          created_at?: string
          id?: string
          language?: string
          pattern?: string
          pattern_kind?: string
          pending_review?: string
          reason?: string
        }
        Relationships: []
      }
      bion_voucher_fee_revenue: {
        Row: {
          lifetime_fee_rand: string
          mtd_fee_rand: string
          redemption_count: string
        }
        Insert: {
          lifetime_fee_rand?: string
          mtd_fee_rand?: string
          redemption_count?: string
        }
        Update: {
          lifetime_fee_rand?: string
          mtd_fee_rand?: string
          redemption_count?: string
        }
        Relationships: []
      }
      bionpoints: {
        Row: {
          class: string
          created_at: string
          id: string
          points: string
          provider_id: string
          reason: string
          reconciled_at: string
          source_id: string
          source_type: string
          user_id: string
        }
        Insert: {
          class: string
          created_at: string
          id: string
          points: string
          provider_id?: string
          reason: string
          reconciled_at?: string
          source_id?: string
          source_type?: string
          user_id: string
        }
        Update: {
          class?: string
          created_at?: string
          id?: string
          points?: string
          provider_id?: string
          reason?: string
          reconciled_at?: string
          source_id?: string
          source_type?: string
          user_id?: string
        }
        Relationships: []
      }
      bmi_log: {
        Row: {
          bmi: string
          category: string
          created_at: string
          height_cm: string
          id: string
          source: string
          user_id: string
          weight_kg: string
        }
        Insert: {
          bmi: string
          category: string
          created_at: string
          height_cm: string
          id: string
          source: string
          user_id: string
          weight_kg: string
        }
        Update: {
          bmi?: string
          category?: string
          created_at?: string
          height_cm?: string
          id?: string
          source?: string
          user_id?: string
          weight_kg?: string
        }
        Relationships: []
      }
      booking_requests: {
        Row: {
          client_email: string
          client_name: string
          client_phone: string
          created_at: string
          id: string
          notes: string
          preferred_date: string
          preferred_time: string
          provider_email: string
          provider_name: string
          provider_phone: string
          service_description: string
          status: string
          updated_at: string
        }
        Insert: {
          client_email: string
          client_name: string
          client_phone?: string
          created_at: string
          id: string
          notes?: string
          preferred_date?: string
          preferred_time?: string
          provider_email?: string
          provider_name: string
          provider_phone?: string
          service_description: string
          status: string
          updated_at: string
        }
        Update: {
          client_email?: string
          client_name?: string
          client_phone?: string
          created_at?: string
          id?: string
          notes?: string
          preferred_date?: string
          preferred_time?: string
          provider_email?: string
          provider_name?: string
          provider_phone?: string
          service_description?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          booking_date: string
          booking_time: string
          client_id: string
          created_at: string
          delivery_mode: string
          duration_minutes: string
          group_booking_id: string
          health_consent_granted: string
          health_consent_granted_at: string
          id: string
          last_rescheduled_at: string
          notes: string
          payment_completed_at: string
          payment_status: string
          paystack_checkout_url: string
          paystack_reference: string
          provider_id: string
          receipt_emailed_at: string
          reminder_1h_sent_at: string
          reminder_24h_sent_at: string
          reschedule_count: string
          service_id: string
          status: string
          telehealth_url: string
          total_price: string
          updated_at: string
        }
        Insert: {
          booking_date: string
          booking_time: string
          client_id: string
          created_at: string
          delivery_mode?: string
          duration_minutes: string
          group_booking_id?: string
          health_consent_granted?: string
          health_consent_granted_at?: string
          id: string
          last_rescheduled_at?: string
          notes?: string
          payment_completed_at?: string
          payment_status: string
          paystack_checkout_url?: string
          paystack_reference?: string
          provider_id: string
          receipt_emailed_at?: string
          reminder_1h_sent_at?: string
          reminder_24h_sent_at?: string
          reschedule_count: string
          service_id?: string
          status: string
          telehealth_url?: string
          total_price?: string
          updated_at: string
        }
        Update: {
          booking_date?: string
          booking_time?: string
          client_id?: string
          created_at?: string
          delivery_mode?: string
          duration_minutes?: string
          group_booking_id?: string
          health_consent_granted?: string
          health_consent_granted_at?: string
          id?: string
          last_rescheduled_at?: string
          notes?: string
          payment_completed_at?: string
          payment_status?: string
          paystack_checkout_url?: string
          paystack_reference?: string
          provider_id?: string
          receipt_emailed_at?: string
          reminder_1h_sent_at?: string
          reminder_24h_sent_at?: string
          reschedule_count?: string
          service_id?: string
          status?: string
          telehealth_url?: string
          total_price?: string
          updated_at?: string
        }
        Relationships: []
      }
      bot_conversations: {
        Row: {
          history: string
          last_updated: string
          phone: string
          session_closed: string
        }
        Insert: {
          history?: string
          last_updated?: string
          phone: string
          session_closed?: string
        }
        Update: {
          history?: string
          last_updated?: string
          phone?: string
          session_closed?: string
        }
        Relationships: []
      }
      broadcasts: {
        Row: {
          created_at: string
          delivered: string
          id: string
          message: string
          read_count: string
          scheduled_at: string
          sender_id: string
          sent_at: string
          status: string
          target_audience: string
          target_category: string
          target_city: string
          total_recipients: string
        }
        Insert: {
          created_at?: string
          delivered?: string
          id: string
          message: string
          read_count?: string
          scheduled_at?: string
          sender_id?: string
          sent_at?: string
          status?: string
          target_audience: string
          target_category?: string
          target_city?: string
          total_recipients?: string
        }
        Update: {
          created_at?: string
          delivered?: string
          id?: string
          message?: string
          read_count?: string
          scheduled_at?: string
          sender_id?: string
          sent_at?: string
          status?: string
          target_audience?: string
          target_category?: string
          target_city?: string
          total_recipients?: string
        }
        Relationships: []
      }
      calendar_events: {
        Row: {
          category: string
          completed: string
          created_at: string
          date: string
          duration: string
          id: string
          location: string
          notes: string
          provider: string
          recurring: string
          time: string
          title: string
          user_id: string
        }
        Insert: {
          category: string
          completed: string
          created_at?: string
          date: string
          duration?: string
          id: string
          location?: string
          notes?: string
          provider?: string
          recurring?: string
          time?: string
          title: string
          user_id: string
        }
        Update: {
          category?: string
          completed?: string
          created_at?: string
          date?: string
          duration?: string
          id?: string
          location?: string
          notes?: string
          provider?: string
          recurring?: string
          time?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          active: string
          banner_image_url: string
          created_at: string
          cta_text: string
          cta_url: string
          description: string
          discount_fixed: string
          discount_pct: string
          end_date: string
          id: string
          start_date: string
          target_categories: string
          target_cities: string
          title: string
          type: string
        }
        Insert: {
          active?: string
          banner_image_url?: string
          created_at?: string
          cta_text?: string
          cta_url?: string
          description?: string
          discount_fixed?: string
          discount_pct?: string
          end_date: string
          id: string
          start_date: string
          target_categories?: string
          target_cities?: string
          title: string
          type?: string
        }
        Update: {
          active?: string
          banner_image_url?: string
          created_at?: string
          cta_text?: string
          cta_url?: string
          description?: string
          discount_fixed?: string
          discount_pct?: string
          end_date?: string
          id?: string
          start_date?: string
          target_categories?: string
          target_cities?: string
          title?: string
          type?: string
        }
        Relationships: []
      }
      catalog_pages: {
        Row: {
          background_color: string
          body: string
          catalog_id: string
          created_at: string
          cta_link: string
          cta_text: string
          gallery_images: string
          id: string
          image_url: string
          layout: string
          linked_product_id: string
          page_number: string
          page_type: string
          subtitle: string
          title: string
        }
        Insert: {
          background_color?: string
          body?: string
          catalog_id: string
          created_at?: string
          cta_link?: string
          cta_text?: string
          gallery_images?: string
          id: string
          image_url?: string
          layout?: string
          linked_product_id?: string
          page_number: string
          page_type: string
          subtitle?: string
          title?: string
        }
        Update: {
          background_color?: string
          body?: string
          catalog_id?: string
          created_at?: string
          cta_link?: string
          cta_text?: string
          gallery_images?: string
          id?: string
          image_url?: string
          layout?: string
          linked_product_id?: string
          page_number?: string
          page_type?: string
          subtitle?: string
          title?: string
        }
        Relationships: []
      }
      catalogs: {
        Row: {
          cover_image_url: string
          created_at: string
          description: string
          id: string
          owner_id: string
          owner_type: string
          published: string
          published_at: string
          share_count: string
          short_url: string
          theme: string
          title: string
          updated_at: string
          view_count: string
          visibility: string
        }
        Insert: {
          cover_image_url?: string
          created_at?: string
          description?: string
          id: string
          owner_id?: string
          owner_type: string
          published?: string
          published_at?: string
          share_count?: string
          short_url?: string
          theme?: string
          title: string
          updated_at?: string
          view_count?: string
          visibility?: string
        }
        Update: {
          cover_image_url?: string
          created_at?: string
          description?: string
          id?: string
          owner_id?: string
          owner_type?: string
          published?: string
          published_at?: string
          share_count?: string
          short_url?: string
          theme?: string
          title?: string
          updated_at?: string
          view_count?: string
          visibility?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          color: string
          created_at: string
          description: string
          icon: string
          id: string
          is_active: string
          name: string
          sort_order: string
        }
        Insert: {
          color?: string
          created_at: string
          description?: string
          icon?: string
          id: string
          is_active?: string
          name: string
          sort_order?: string
        }
        Update: {
          color?: string
          created_at?: string
          description?: string
          icon?: string
          id?: string
          is_active?: string
          name?: string
          sort_order?: string
        }
        Relationships: []
      }
      category_scope_defaults: {
        Row: {
          category: string
          default_scopes: string
          notes: string
        }
        Insert: {
          category: string
          default_scopes: string
          notes?: string
        }
        Update: {
          category?: string
          default_scopes?: string
          notes?: string
        }
        Relationships: []
      }
      challenge_participants: {
        Row: {
          challenge_id: string
          completed_at: string
          id: string
          joined_at: string
          task_progress: string
          user_id: string
        }
        Insert: {
          challenge_id: string
          completed_at?: string
          id: string
          joined_at?: string
          task_progress?: string
          user_id: string
        }
        Update: {
          challenge_id?: string
          completed_at?: string
          id?: string
          joined_at?: string
          task_progress?: string
          user_id?: string
        }
        Relationships: []
      }
      challenges: {
        Row: {
          badge: string
          category: string
          created_at: string
          created_by_id: string
          created_by_label: string
          days_total: string
          description: string
          difficulty: string
          ends_at: string
          id: string
          location: string
          participant_count: string
          published: string
          reward_points: string
          reward_text: string
          starts_at: string
          tasks: string
          title: string
        }
        Insert: {
          badge?: string
          category: string
          created_at?: string
          created_by_id?: string
          created_by_label: string
          days_total: string
          description: string
          difficulty: string
          ends_at?: string
          id: string
          location?: string
          participant_count?: string
          published?: string
          reward_points: string
          reward_text: string
          starts_at?: string
          tasks: string
          title: string
        }
        Update: {
          badge?: string
          category?: string
          created_at?: string
          created_by_id?: string
          created_by_label?: string
          days_total?: string
          description?: string
          difficulty?: string
          ends_at?: string
          id?: string
          location?: string
          participant_count?: string
          published?: string
          reward_points?: string
          reward_text?: string
          starts_at?: string
          tasks?: string
          title?: string
        }
        Relationships: []
      }
      chat_usage_daily: {
        Row: {
          count: string
          day: string
          updated_at: string
          user_id: string
        }
        Insert: {
          count: string
          day: string
          updated_at: string
          user_id: string
        }
        Update: {
          count?: string
          day?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      client_profiles: {
        Row: {
          city: string
          created_at: string
          emergency_contact: string
          goals: string
          language: string
          onboarding_completed: string
          popia_consented_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          city?: string
          created_at: string
          emergency_contact?: string
          goals?: string
          language?: string
          onboarding_completed: string
          popia_consented_at?: string
          updated_at: string
          user_id: string
        }
        Update: {
          city?: string
          created_at?: string
          emergency_contact?: string
          goals?: string
          language?: string
          onboarding_completed?: string
          popia_consented_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      client_ratings: {
        Row: {
          booking_id: string
          client_id: string
          comment: string
          created_at: string
          id: string
          provider_id: string
          rating: string
          tags: string
        }
        Insert: {
          booking_id: string
          client_id: string
          comment?: string
          created_at?: string
          id: string
          provider_id: string
          rating: string
          tags?: string
        }
        Update: {
          booking_id?: string
          client_id?: string
          comment?: string
          created_at?: string
          id?: string
          provider_id?: string
          rating?: string
          tags?: string
        }
        Relationships: []
      }
      client_referral_accruals: {
        Row: {
          accrual_month: string
          amount_rand: string
          cap_block_reason: string
          cap_blocked: string
          created_at: string
          id: string
          referee_id: string
          referrer_id: string
          source_subscription_invoice_id: string
        }
        Insert: {
          accrual_month: string
          amount_rand: string
          cap_block_reason?: string
          cap_blocked: string
          created_at: string
          id: string
          referee_id: string
          referrer_id: string
          source_subscription_invoice_id?: string
        }
        Update: {
          accrual_month?: string
          amount_rand?: string
          cap_block_reason?: string
          cap_blocked?: string
          created_at?: string
          id?: string
          referee_id?: string
          referrer_id?: string
          source_subscription_invoice_id?: string
        }
        Relationships: []
      }
      client_referral_clicks: {
        Row: {
          converted_at: string
          converted_profile_id: string
          first_premium_at: string
          id: string
          ip_hash: string
          landed_at: string
          referrer_code: string
          referrer_profile_id: string
          user_agent: string
          utm_source: string
        }
        Insert: {
          converted_at?: string
          converted_profile_id?: string
          first_premium_at?: string
          id: string
          ip_hash?: string
          landed_at: string
          referrer_code: string
          referrer_profile_id?: string
          user_agent?: string
          utm_source?: string
        }
        Update: {
          converted_at?: string
          converted_profile_id?: string
          first_premium_at?: string
          id?: string
          ip_hash?: string
          landed_at?: string
          referrer_code?: string
          referrer_profile_id?: string
          user_agent?: string
          utm_source?: string
        }
        Relationships: []
      }
      client_referral_summary: {
        Row: {
          active_premium_referrals: string
          last_referral_at: string
          referrer_id: string
          total_referrals: string
        }
        Insert: {
          active_premium_referrals?: string
          last_referral_at?: string
          referrer_id?: string
          total_referrals?: string
        }
        Update: {
          active_premium_referrals?: string
          last_referral_at?: string
          referrer_id?: string
          total_referrals?: string
        }
        Relationships: []
      }
      commission_earnings: {
        Row: {
          amount_rand: string
          created_at: string
          id: string
          month: string
          paid_at: string
          referral_id: string
          status: string
          user_id: string
        }
        Insert: {
          amount_rand: string
          created_at?: string
          id: string
          month: string
          paid_at?: string
          referral_id: string
          status: string
          user_id: string
        }
        Update: {
          amount_rand?: string
          created_at?: string
          id?: string
          month?: string
          paid_at?: string
          referral_id?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      comms_schedules: {
        Row: {
          audience_filter: string
          cadence: string
          cadence_offset_d: string
          channels_enabled: string
          created_at: string
          description: string
          enabled: string
          last_run_at: string
          last_run_errors: string
          last_run_sent: string
          template_key: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          audience_filter: string
          cadence: string
          cadence_offset_d?: string
          channels_enabled: string
          created_at: string
          description?: string
          enabled: string
          last_run_at?: string
          last_run_errors?: string
          last_run_sent?: string
          template_key: string
          updated_at: string
          updated_by?: string
        }
        Update: {
          audience_filter?: string
          cadence?: string
          cadence_offset_d?: string
          channels_enabled?: string
          created_at?: string
          description?: string
          enabled?: string
          last_run_at?: string
          last_run_errors?: string
          last_run_sent?: string
          template_key?: string
          updated_at?: string
          updated_by?: string
        }
        Relationships: []
      }
      comms_send_log: {
        Row: {
          channel: string
          error_message: string
          id: string
          idempotency_key: string
          profile_id: string
          sent_at: string
          status: string
          template_key: string
        }
        Insert: {
          channel: string
          error_message?: string
          id: string
          idempotency_key: string
          profile_id: string
          sent_at: string
          status: string
          template_key: string
        }
        Update: {
          channel?: string
          error_message?: string
          id?: string
          idempotency_key?: string
          profile_id?: string
          sent_at?: string
          status?: string
          template_key?: string
        }
        Relationships: []
      }
      comms_templates: {
        Row: {
          body_template: string
          channel: string
          created_at: string
          description: string
          enabled: string
          preview_text: string
          subject: string
          template_key: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          body_template: string
          channel: string
          created_at: string
          description?: string
          enabled: string
          preview_text?: string
          subject?: string
          template_key: string
          updated_at: string
          updated_by?: string
        }
        Update: {
          body_template?: string
          channel?: string
          created_at?: string
          description?: string
          enabled?: string
          preview_text?: string
          subject?: string
          template_key?: string
          updated_at?: string
          updated_by?: string
        }
        Relationships: []
      }
      content_calendar: {
        Row: {
          author: string
          category: string
          content: string
          created_at: string
          excerpt: string
          id: string
          media_urls: string
          published_at: string
          read_time_min: string
          scheduled_at: string
          seo_score: string
          slug: string
          social_posts: string
          status: string
          tags: string
          title: string
          updated_at: string
          word_count: string
        }
        Insert: {
          author?: string
          category: string
          content: string
          created_at?: string
          excerpt?: string
          id: string
          media_urls?: string
          published_at?: string
          read_time_min?: string
          scheduled_at?: string
          seo_score?: string
          slug: string
          social_posts?: string
          status: string
          tags?: string
          title: string
          updated_at?: string
          word_count?: string
        }
        Update: {
          author?: string
          category?: string
          content?: string
          created_at?: string
          excerpt?: string
          id?: string
          media_urls?: string
          published_at?: string
          read_time_min?: string
          scheduled_at?: string
          seo_score?: string
          slug?: string
          social_posts?: string
          status?: string
          tags?: string
          title?: string
          updated_at?: string
          word_count?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string
          last_message_preview: string
          participant_a: string
          participant_b: string
        }
        Insert: {
          created_at: string
          id: string
          last_message_at?: string
          last_message_preview?: string
          participant_a: string
          participant_b: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string
          last_message_preview?: string
          participant_a?: string
          participant_b?: string
        }
        Relationships: []
      }
      corporate_accounts: {
        Row: {
          bo_reject_reason: string
          company_name: string
          contact_email: string
          contact_phone: string
          created_at: string
          id: string
          industry: string
          monthly_budget_per_employee: string
          rep_profile_id: string
          rep_referral_code: string
          size_band: string
          user_id: string
        }
        Insert: {
          bo_reject_reason?: string
          company_name: string
          contact_email?: string
          contact_phone?: string
          created_at?: string
          id: string
          industry?: string
          monthly_budget_per_employee?: string
          rep_profile_id?: string
          rep_referral_code?: string
          size_band?: string
          user_id: string
        }
        Update: {
          bo_reject_reason?: string
          company_name?: string
          contact_email?: string
          contact_phone?: string
          created_at?: string
          id?: string
          industry?: string
          monthly_budget_per_employee?: string
          rep_profile_id?: string
          rep_referral_code?: string
          size_band?: string
          user_id?: string
        }
        Relationships: []
      }
      corporate_analytics: {
        Row: {
          active_providers: string
          company_name: string
          corporate_user_id: string
          mtd_spend: string
          sessions_mtd: string
          spend_30d: string
          spend_90d: string
          total_budget: string
          total_employees: string
        }
        Insert: {
          active_providers?: string
          company_name?: string
          corporate_user_id?: string
          mtd_spend?: string
          sessions_mtd?: string
          spend_30d?: string
          spend_90d?: string
          total_budget?: string
          total_employees?: string
        }
        Update: {
          active_providers?: string
          company_name?: string
          corporate_user_id?: string
          mtd_spend?: string
          sessions_mtd?: string
          spend_30d?: string
          spend_90d?: string
          total_budget?: string
          total_employees?: string
        }
        Relationships: []
      }
      corporate_employees: {
        Row: {
          corporate_user_id: string
          created_at: string
          email: string
          employee_profile_id: string
          employee_user_id: string
          id: string
          invited_at: string
          joined_at: string
          monthly_budget: string
          name: string
          sessions_used: string
          spent: string
          status: string
        }
        Insert: {
          corporate_user_id: string
          created_at?: string
          email: string
          employee_profile_id?: string
          employee_user_id?: string
          id: string
          invited_at?: string
          joined_at?: string
          monthly_budget: string
          name: string
          sessions_used: string
          spent: string
          status: string
        }
        Update: {
          corporate_user_id?: string
          created_at?: string
          email?: string
          employee_profile_id?: string
          employee_user_id?: string
          id?: string
          invited_at?: string
          joined_at?: string
          monthly_budget?: string
          name?: string
          sessions_used?: string
          spent?: string
          status?: string
        }
        Relationships: []
      }
      corporate_profiles: {
        Row: {
          company_name: string
          created_at: string
          onboarding_completed: string
          popia_consented_at: string
          team_size: string
          updated_at: string
          user_id: string
          wellness_tier: string
        }
        Insert: {
          company_name?: string
          created_at: string
          onboarding_completed: string
          popia_consented_at?: string
          team_size?: string
          updated_at: string
          user_id: string
          wellness_tier?: string
        }
        Update: {
          company_name?: string
          created_at?: string
          onboarding_completed?: string
          popia_consented_at?: string
          team_size?: string
          updated_at?: string
          user_id?: string
          wellness_tier?: string
        }
        Relationships: []
      }
      corporate_providers: {
        Row: {
          added_at: string
          corporate_user_id: string
          id: string
          provider_id: string
        }
        Insert: {
          added_at?: string
          corporate_user_id: string
          id: string
          provider_id: string
        }
        Update: {
          added_at?: string
          corporate_user_id?: string
          id?: string
          provider_id?: string
        }
        Relationships: []
      }
      courses: {
        Row: {
          course_code: string
          created_at: string
          description: string
          difficulty: string
          estimated_minutes: string
          id: string
          order_index: string
          passing_score: string
          published: string
          required_for_accreditation: string
          target_role: string
          title: string
        }
        Insert: {
          course_code: string
          created_at?: string
          description?: string
          difficulty?: string
          estimated_minutes?: string
          id: string
          order_index?: string
          passing_score?: string
          published?: string
          required_for_accreditation?: string
          target_role: string
          title: string
        }
        Update: {
          course_code?: string
          created_at?: string
          description?: string
          difficulty?: string
          estimated_minutes?: string
          id?: string
          order_index?: string
          passing_score?: string
          published?: string
          required_for_accreditation?: string
          target_role?: string
          title?: string
        }
        Relationships: []
      }
      daily_goals: {
        Row: {
          calories: string
          carbs: string
          fat: string
          id: string
          protein: string
          updated_at: string
          user_id: string
          water: string
        }
        Insert: {
          calories: string
          carbs: string
          fat: string
          id: string
          protein: string
          updated_at?: string
          user_id: string
          water: string
        }
        Update: {
          calories?: string
          carbs?: string
          fat?: string
          id?: string
          protein?: string
          updated_at?: string
          user_id?: string
          water?: string
        }
        Relationships: []
      }
      deletion_feedback: {
        Row: {
          id: string
          other_reason: string
          reason: string
          requested_at: string
          user_metadata: string
        }
        Insert: {
          id: string
          other_reason?: string
          reason: string
          requested_at: string
          user_metadata?: string
        }
        Update: {
          id?: string
          other_reason?: string
          reason?: string
          requested_at?: string
          user_metadata?: string
        }
        Relationships: []
      }
      delivery_zones: {
        Row: {
          active: string
          base_rate_rand: string
          bion_markup_percent: string
          display_name: string
          estimated_days_max: string
          estimated_days_min: string
          id: string
          oversize_flat_fee: string
          per_kg_over_2: string
          zone: string
        }
        Insert: {
          active?: string
          base_rate_rand: string
          bion_markup_percent?: string
          display_name: string
          estimated_days_max?: string
          estimated_days_min?: string
          id: string
          oversize_flat_fee: string
          per_kg_over_2: string
          zone: string
        }
        Update: {
          active?: string
          base_rate_rand?: string
          bion_markup_percent?: string
          display_name?: string
          estimated_days_max?: string
          estimated_days_min?: string
          id?: string
          oversize_flat_fee?: string
          per_kg_over_2?: string
          zone?: string
        }
        Relationships: []
      }
      dismissed_reminders: {
        Row: {
          date: string
          id: string
          reminder_id: string
          user_id: string
        }
        Insert: {
          date: string
          id: string
          reminder_id: string
          user_id: string
        }
        Update: {
          date?: string
          id?: string
          reminder_id?: string
          user_id?: string
        }
        Relationships: []
      }
      disputes: {
        Row: {
          admin_note: string
          admin_partial_pct: string
          admin_resolution: string
          amount_rand: string
          b_partial_pct: string
          b_reasoning: string
          b_recommendation: string
          booking_id: string
          client_id: string
          created_at: string
          evidence: string
          id: string
          provider_id: string
          provider_responded_at: string
          provider_response: string
          provider_response_due_at: string
          reason: string
          resolution: string
          resolved_at: string
          resolved_by: string
          status: string
          updated_at: string
        }
        Insert: {
          admin_note?: string
          admin_partial_pct?: string
          admin_resolution?: string
          amount_rand: string
          b_partial_pct?: string
          b_reasoning?: string
          b_recommendation?: string
          booking_id: string
          client_id: string
          created_at?: string
          evidence?: string
          id: string
          provider_id: string
          provider_responded_at?: string
          provider_response?: string
          provider_response_due_at?: string
          reason: string
          resolution?: string
          resolved_at?: string
          resolved_by?: string
          status: string
          updated_at?: string
        }
        Update: {
          admin_note?: string
          admin_partial_pct?: string
          admin_resolution?: string
          amount_rand?: string
          b_partial_pct?: string
          b_reasoning?: string
          b_recommendation?: string
          booking_id?: string
          client_id?: string
          created_at?: string
          evidence?: string
          id?: string
          provider_id?: string
          provider_responded_at?: string
          provider_response?: string
          provider_response_due_at?: string
          reason?: string
          resolution?: string
          resolved_at?: string
          resolved_by?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      disputes_awaiting_admin: {
        Row: {
          b_confidence: string
          b_reasoning: string
          b_recommendation: string
          buyer_evidence: string
          buyer_id: string
          buyer_statement: string
          created_at: string
          id: string
          order_id: string
          provider_evidence: string
          provider_id: string
          provider_statement: string
          raised_by: string
          reason: string
          resolution: string
          resolved_at: string
          resolved_by_admin_id: string
          total_charged_rand: string
        }
        Insert: {
          b_confidence?: string
          b_reasoning?: string
          b_recommendation?: string
          buyer_evidence?: string
          buyer_id?: string
          buyer_statement?: string
          created_at?: string
          id?: string
          order_id?: string
          provider_evidence?: string
          provider_id?: string
          provider_statement?: string
          raised_by?: string
          reason?: string
          resolution?: string
          resolved_at?: string
          resolved_by_admin_id?: string
          total_charged_rand?: string
        }
        Update: {
          b_confidence?: string
          b_reasoning?: string
          b_recommendation?: string
          buyer_evidence?: string
          buyer_id?: string
          buyer_statement?: string
          created_at?: string
          id?: string
          order_id?: string
          provider_evidence?: string
          provider_id?: string
          provider_statement?: string
          raised_by?: string
          reason?: string
          resolution?: string
          resolved_at?: string
          resolved_by_admin_id?: string
          total_charged_rand?: string
        }
        Relationships: []
      }
      drip_email_log: {
        Row: {
          drip_day: string
          id: string
          profile_id: string
          sent_at: string
        }
        Insert: {
          drip_day: string
          id: string
          profile_id: string
          sent_at?: string
        }
        Update: {
          drip_day?: string
          id?: string
          profile_id?: string
          sent_at?: string
        }
        Relationships: []
      }
      earnings_transactions: {
        Row: {
          amount_rand: string
          balance_after: string
          created_at: string
          description: string
          id: string
          reference_id: string
          source_user_id: string
          type: string
          user_id: string
        }
        Insert: {
          amount_rand: string
          balance_after?: string
          created_at?: string
          description?: string
          id: string
          reference_id?: string
          source_user_id?: string
          type: string
          user_id: string
        }
        Update: {
          amount_rand?: string
          balance_after?: string
          created_at?: string
          description?: string
          id?: string
          reference_id?: string
          source_user_id?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      email_dlq: {
        Row: {
          attempts: string
          channel: string
          created_at: string
          html: string
          id: string
          last_attempted_at: string
          last_error: string
          next_attempt_at: string
          recipient: string
          status: string
          subject: string
        }
        Insert: {
          attempts: string
          channel: string
          created_at: string
          html: string
          id: string
          last_attempted_at?: string
          last_error?: string
          next_attempt_at: string
          recipient: string
          status: string
          subject: string
        }
        Update: {
          attempts?: string
          channel?: string
          created_at?: string
          html?: string
          id?: string
          last_attempted_at?: string
          last_error?: string
          next_attempt_at?: string
          recipient?: string
          status?: string
          subject?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          channel: string
          email: string
          error: string
          id: string
          sent_at: string
          subject: string
          success: string
        }
        Insert: {
          channel?: string
          email: string
          error?: string
          id: string
          sent_at?: string
          subject?: string
          success?: string
        }
        Update: {
          channel?: string
          email?: string
          error?: string
          id?: string
          sent_at?: string
          subject?: string
          success?: string
        }
        Relationships: []
      }
      email_verifications: {
        Row: {
          code: string
          created_at: string
          email: string
          expires_at: string
          id: string
          user_id: string
          verified: string
        }
        Insert: {
          code: string
          created_at?: string
          email: string
          expires_at: string
          id: string
          user_id: string
          verified?: string
        }
        Update: {
          code?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          user_id?: string
          verified?: string
        }
        Relationships: []
      }
      enrollments: {
        Row: {
          assessment_answers: string
          assessment_attempts: string
          assessment_passed: string
          assessment_score: string
          completed_at: string
          course_id: string
          id: string
          last_lesson_id: string
          lessons_completed: string
          started_at: string
          user_id: string
        }
        Insert: {
          assessment_answers?: string
          assessment_attempts?: string
          assessment_passed?: string
          assessment_score?: string
          completed_at?: string
          course_id: string
          id: string
          last_lesson_id?: string
          lessons_completed?: string
          started_at?: string
          user_id: string
        }
        Update: {
          assessment_answers?: string
          assessment_attempts?: string
          assessment_passed?: string
          assessment_score?: string
          completed_at?: string
          course_id?: string
          id?: string
          last_lesson_id?: string
          lessons_completed?: string
          started_at?: string
          user_id?: string
        }
        Relationships: []
      }
      external_providers: {
        Row: {
          category: string
          city: string
          created_at: string
          id: string
          name: string
          notes: string
          phone: string
          service: string
          slug: string
          source: string
          status: string
          suburb: string
          suggested_for: string
          times_suggested: string
          updated_at: string
        }
        Insert: {
          category?: string
          city?: string
          created_at: string
          id: string
          name: string
          notes?: string
          phone?: string
          service?: string
          slug: string
          source: string
          status: string
          suburb?: string
          suggested_for?: string
          times_suggested: string
          updated_at: string
        }
        Update: {
          category?: string
          city?: string
          created_at?: string
          id?: string
          name?: string
          notes?: string
          phone?: string
          service?: string
          slug?: string
          source?: string
          status?: string
          suburb?: string
          suggested_for?: string
          times_suggested?: string
          updated_at?: string
        }
        Relationships: []
      }
      favourites: {
        Row: {
          created_at: string
          id: string
          profile_id: string
          provider_id: string
        }
        Insert: {
          created_at?: string
          id: string
          profile_id: string
          provider_id: string
        }
        Update: {
          created_at?: string
          id?: string
          profile_id?: string
          provider_id?: string
        }
        Relationships: []
      }
      food_entries: {
        Row: {
          calories: string
          carbs: string
          created_at: string
          date: string
          fat: string
          id: string
          meal: string
          name: string
          photo_url: string
          protein: string
          time: string
          user_id: string
        }
        Insert: {
          calories: string
          carbs?: string
          created_at?: string
          date: string
          fat?: string
          id: string
          meal: string
          name: string
          photo_url?: string
          protein?: string
          time?: string
          user_id: string
        }
        Update: {
          calories?: string
          carbs?: string
          created_at?: string
          date?: string
          fat?: string
          id?: string
          meal?: string
          name?: string
          photo_url?: string
          protein?: string
          time?: string
          user_id?: string
        }
        Relationships: []
      }
      food_entries_monthly: {
        Row: {
          days_logged: string
          entry_count: string
          month_start: string
          total_calories: string
          total_carbs: string
          total_fat: string
          total_protein: string
          user_id: string
        }
        Insert: {
          days_logged?: string
          entry_count?: string
          month_start?: string
          total_calories?: string
          total_carbs?: string
          total_fat?: string
          total_protein?: string
          user_id?: string
        }
        Update: {
          days_logged?: string
          entry_count?: string
          month_start?: string
          total_calories?: string
          total_carbs?: string
          total_fat?: string
          total_protein?: string
          user_id?: string
        }
        Relationships: []
      }
      food_entries_yearly: {
        Row: {
          days_logged: string
          entry_count: string
          total_calories: string
          total_carbs: string
          total_fat: string
          total_protein: string
          user_id: string
          year_start: string
        }
        Insert: {
          days_logged?: string
          entry_count?: string
          total_calories?: string
          total_carbs?: string
          total_fat?: string
          total_protein?: string
          user_id?: string
          year_start?: string
        }
        Update: {
          days_logged?: string
          entry_count?: string
          total_calories?: string
          total_carbs?: string
          total_fat?: string
          total_protein?: string
          user_id?: string
          year_start?: string
        }
        Relationships: []
      }
      food_log: {
        Row: {
          calories: string
          carbs_g: string
          created_at: string
          description: string
          fat_g: string
          id: string
          meal_type: string
          protein_g: string
          source: string
          user_id: string
        }
        Insert: {
          calories?: string
          carbs_g?: string
          created_at?: string
          description?: string
          fat_g?: string
          id: string
          meal_type?: string
          protein_g?: string
          source?: string
          user_id: string
        }
        Update: {
          calories?: string
          carbs_g?: string
          created_at?: string
          description?: string
          fat_g?: string
          id?: string
          meal_type?: string
          protein_g?: string
          source?: string
          user_id?: string
        }
        Relationships: []
      }
      gift_voucher_redemptions: {
        Row: {
          amount_rand: string
          booking_id: string
          id: string
          redeemed_at: string
          voucher_id: string
        }
        Insert: {
          amount_rand: string
          booking_id?: string
          id: string
          redeemed_at?: string
          voucher_id?: string
        }
        Update: {
          amount_rand?: string
          booking_id?: string
          id?: string
          redeemed_at?: string
          voucher_id?: string
        }
        Relationships: []
      }
      gift_vouchers: {
        Row: {
          amount_rand: string
          code: string
          expires_at: string
          id: string
          message: string
          paystack_reference: string
          purchased_at: string
          recipient_email: string
          recipient_id: string
          recipient_name: string
          recipient_phone: string
          redeemed_at: string
          remaining_rand: string
          sender_id: string
          sender_name: string
          status: string
        }
        Insert: {
          amount_rand: string
          code: string
          expires_at?: string
          id: string
          message?: string
          paystack_reference?: string
          purchased_at?: string
          recipient_email?: string
          recipient_id?: string
          recipient_name?: string
          recipient_phone?: string
          redeemed_at?: string
          remaining_rand: string
          sender_id?: string
          sender_name?: string
          status?: string
        }
        Update: {
          amount_rand?: string
          code?: string
          expires_at?: string
          id?: string
          message?: string
          paystack_reference?: string
          purchased_at?: string
          recipient_email?: string
          recipient_id?: string
          recipient_name?: string
          recipient_phone?: string
          redeemed_at?: string
          remaining_rand?: string
          sender_id?: string
          sender_name?: string
          status?: string
        }
        Relationships: []
      }
      group_bookings: {
        Row: {
          booking_date: string
          booking_time: string
          created_at: string
          current_participants: string
          description: string
          duration_minutes: string
          id: string
          max_participants: string
          price_per_person: string
          provider_id: string
          service_id: string
          status: string
          title: string
        }
        Insert: {
          booking_date: string
          booking_time?: string
          created_at?: string
          current_participants?: string
          description?: string
          duration_minutes?: string
          id: string
          max_participants: string
          price_per_person: string
          provider_id?: string
          service_id?: string
          status?: string
          title: string
        }
        Update: {
          booking_date?: string
          booking_time?: string
          created_at?: string
          current_participants?: string
          description?: string
          duration_minutes?: string
          id?: string
          max_participants?: string
          price_per_person?: string
          provider_id?: string
          service_id?: string
          status?: string
          title?: string
        }
        Relationships: []
      }
      health_logs: {
        Row: {
          body_fat_pct: string
          created_at: string
          id: string
          lean_mass_kg: string
          log_date: string
          notes: string
          resting_hr: string
          sleep_hours: string
          steps: string
          user_id: string
          weight_kg: string
        }
        Insert: {
          body_fat_pct?: string
          created_at?: string
          id: string
          lean_mass_kg?: string
          log_date: string
          notes?: string
          resting_hr?: string
          sleep_hours?: string
          steps?: string
          user_id: string
          weight_kg?: string
        }
        Update: {
          body_fat_pct?: string
          created_at?: string
          id?: string
          lean_mass_kg?: string
          log_date?: string
          notes?: string
          resting_hr?: string
          sleep_hours?: string
          steps?: string
          user_id?: string
          weight_kg?: string
        }
        Relationships: []
      }
      health_metrics: {
        Row: {
          body_fat: string
          created_at: string
          date: string
          id: string
          lean_mass: string
          notes: string
          resting_hr: string
          sleep_hours: string
          spo2: string
          steps: string
          stress_score: string
          user_id: string
          weight: string
        }
        Insert: {
          body_fat?: string
          created_at?: string
          date: string
          id: string
          lean_mass?: string
          notes?: string
          resting_hr?: string
          sleep_hours?: string
          spo2?: string
          steps?: string
          stress_score?: string
          user_id: string
          weight?: string
        }
        Update: {
          body_fat?: string
          created_at?: string
          date?: string
          id?: string
          lean_mass?: string
          notes?: string
          resting_hr?: string
          sleep_hours?: string
          spo2?: string
          steps?: string
          stress_score?: string
          user_id?: string
          weight?: string
        }
        Relationships: []
      }
      health_profiles: {
        Row: {
          allergies: string
          blood_type: string
          conditions: string
          date_of_birth: string
          emergency_contact_name: string
          emergency_contact_phone: string
          goals: string
          height_cm: string
          id: string
          insurance_member_id: string
          insurance_provider: string
          medications: string
          notes: string
          updated_at: string
          user_id: string
        }
        Insert: {
          allergies?: string
          blood_type?: string
          conditions?: string
          date_of_birth?: string
          emergency_contact_name?: string
          emergency_contact_phone?: string
          goals?: string
          height_cm?: string
          id: string
          insurance_member_id?: string
          insurance_provider?: string
          medications?: string
          notes?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          allergies?: string
          blood_type?: string
          conditions?: string
          date_of_birth?: string
          emergency_contact_name?: string
          emergency_contact_phone?: string
          goals?: string
          height_cm?: string
          id?: string
          insurance_member_id?: string
          insurance_provider?: string
          medications?: string
          notes?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      intake_form_fields: {
        Row: {
          created_at: string
          field_type: string
          form_id: string
          id: string
          label: string
          options: string
          required: string
          sort_order: string
        }
        Insert: {
          created_at: string
          field_type: string
          form_id: string
          id: string
          label: string
          options?: string
          required: string
          sort_order: string
        }
        Update: {
          created_at?: string
          field_type?: string
          form_id?: string
          id?: string
          label?: string
          options?: string
          required?: string
          sort_order?: string
        }
        Relationships: []
      }
      intake_form_submissions: {
        Row: {
          booking_id: string
          client_id: string
          created_at: string
          form_id: string
          id: string
          responses: string
        }
        Insert: {
          booking_id?: string
          client_id: string
          created_at: string
          form_id: string
          id: string
          responses: string
        }
        Update: {
          booking_id?: string
          client_id?: string
          created_at?: string
          form_id?: string
          id?: string
          responses?: string
        }
        Relationships: []
      }
      intake_forms: {
        Row: {
          active: string
          created_at: string
          description: string
          id: string
          provider_id: string
          title: string
          updated_at: string
        }
        Insert: {
          active: string
          created_at: string
          description?: string
          id: string
          provider_id: string
          title: string
          updated_at: string
        }
        Update: {
          active?: string
          created_at?: string
          description?: string
          id?: string
          provider_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      lessons: {
        Row: {
          content: string
          content_type: string
          course_id: string
          created_at: string
          duration_minutes: string
          id: string
          key_takeaways: string
          lesson_number: string
          title: string
          video_url: string
        }
        Insert: {
          content?: string
          content_type: string
          course_id: string
          created_at?: string
          duration_minutes?: string
          id: string
          key_takeaways?: string
          lesson_number: string
          title: string
          video_url?: string
        }
        Update: {
          content?: string
          content_type?: string
          course_id?: string
          created_at?: string
          duration_minutes?: string
          id?: string
          key_takeaways?: string
          lesson_number?: string
          title?: string
          video_url?: string
        }
        Relationships: []
      }
      marketing_constants: {
        Row: {
          current_value: string
          description: string
          key: string
          updated_at: string
        }
        Insert: {
          current_value: string
          description?: string
          key: string
          updated_at: string
        }
        Update: {
          current_value?: string
          description?: string
          key?: string
          updated_at?: string
        }
        Relationships: []
      }
      marketing_scheduled: {
        Row: {
          channel: string
          created_at: string
          error: string
          html: string
          id: string
          message: string
          recipient: string
          scheduled_at: string
          sent_at: string
          status: string
          subject: string
          type: string
        }
        Insert: {
          channel?: string
          created_at?: string
          error?: string
          html?: string
          id: string
          message?: string
          recipient: string
          scheduled_at: string
          sent_at?: string
          status: string
          subject?: string
          type: string
        }
        Update: {
          channel?: string
          created_at?: string
          error?: string
          html?: string
          id?: string
          message?: string
          recipient?: string
          scheduled_at?: string
          sent_at?: string
          status?: string
          subject?: string
          type?: string
        }
        Relationships: []
      }
      marketing_wallet_credits: {
        Row: {
          amount_rand: string
          credited_at: string
          expires_at: string
          id: string
          provider_id: string
          reverted_at: string
          reverted_to: string
          source_booking: string
        }
        Insert: {
          amount_rand: string
          credited_at: string
          expires_at: string
          id: string
          provider_id: string
          reverted_at?: string
          reverted_to?: string
          source_booking?: string
        }
        Update: {
          amount_rand?: string
          credited_at?: string
          expires_at?: string
          id?: string
          provider_id?: string
          reverted_at?: string
          reverted_to?: string
          source_booking?: string
        }
        Relationships: []
      }
      marketing_wallet_reconciliation_log: {
        Row: {
          amount_rand: string
          bionpoint_id: string
          earning_provider_id: string
          id: string
          redemption_provider_id: string
          run_at: string
        }
        Insert: {
          amount_rand: string
          bionpoint_id: string
          earning_provider_id: string
          id: string
          redemption_provider_id: string
          run_at: string
        }
        Update: {
          amount_rand?: string
          bionpoint_id?: string
          earning_provider_id?: string
          id?: string
          redemption_provider_id?: string
          run_at?: string
        }
        Relationships: []
      }
      media: {
        Row: {
          bucket: string
          context_id: string
          context_type: string
          created_at: string
          deleted_at: string
          filename: string
          folder: string
          id: string
          legacy_storage_path: string
          mime_type: string
          owner_profile_id: string
          size_bytes: string
          storage_path: string
          uploaded_at: string
        }
        Insert: {
          bucket: string
          context_id?: string
          context_type?: string
          created_at: string
          deleted_at?: string
          filename: string
          folder: string
          id: string
          legacy_storage_path?: string
          mime_type?: string
          owner_profile_id: string
          size_bytes?: string
          storage_path: string
          uploaded_at?: string
        }
        Update: {
          bucket?: string
          context_id?: string
          context_type?: string
          created_at?: string
          deleted_at?: string
          filename?: string
          folder?: string
          id?: string
          legacy_storage_path?: string
          mime_type?: string
          owner_profile_id?: string
          size_bytes?: string
          storage_path?: string
          uploaded_at?: string
        }
        Relationships: []
      }
      medical_aid_info: {
        Row: {
          created_at: string
          dependant_code: string
          id: string
          member_number: string
          plan_name: string
          profile_id: string
          scheme: string
          show_to_provider: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          dependant_code?: string
          id: string
          member_number?: string
          plan_name?: string
          profile_id: string
          scheme: string
          show_to_provider?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          dependant_code?: string
          id?: string
          member_number?: string
          plan_name?: string
          profile_id?: string
          scheme?: string
          show_to_provider?: string
          updated_at?: string
        }
        Relationships: []
      }
      medical_journal_entries: {
        Row: {
          b_observation: string
          created_at: string
          feeling: string
          id: string
          log_date: string
          profile_id: string
          updated_at: string
        }
        Insert: {
          b_observation?: string
          created_at: string
          feeling: string
          id: string
          log_date: string
          profile_id: string
          updated_at: string
        }
        Update: {
          b_observation?: string
          created_at?: string
          feeling?: string
          id?: string
          log_date?: string
          profile_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      meeting_requests: {
        Row: {
          assigned_rep: string
          business_name: string
          contact_email: string
          contact_phone: string
          created_at: string
          id: string
          notes: string
          preferred_time: string
          provider_listing_id: string
          status: string
        }
        Insert: {
          assigned_rep?: string
          business_name: string
          contact_email: string
          contact_phone?: string
          created_at?: string
          id: string
          notes?: string
          preferred_time?: string
          provider_listing_id?: string
          status?: string
        }
        Update: {
          assigned_rep?: string
          business_name?: string
          contact_email?: string
          contact_phone?: string
          created_at?: string
          id?: string
          notes?: string
          preferred_time?: string
          provider_listing_id?: string
          status?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_read: string
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id?: string
          created_at: string
          id: string
          is_read?: string
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: string
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      monthly_spend: {
        Row: {
          id: string
          month: string
          total_spent_rand: string
          updated_at: string
          user_id: string
          vouchers_earned_rand: string
        }
        Insert: {
          id: string
          month: string
          total_spent_rand: string
          updated_at?: string
          user_id: string
          vouchers_earned_rand: string
        }
        Update: {
          id?: string
          month?: string
          total_spent_rand?: string
          updated_at?: string
          user_id?: string
          vouchers_earned_rand?: string
        }
        Relationships: []
      }
      notification_audit: {
        Row: {
          category: string
          channel: string
          created_at: string
          delivery_id: string
          detail: string
          event_type: string
          id: string
          notification_id: string
          user_id: string
        }
        Insert: {
          category?: string
          channel?: string
          created_at?: string
          delivery_id?: string
          detail?: string
          event_type: string
          id: string
          notification_id?: string
          user_id?: string
        }
        Update: {
          category?: string
          channel?: string
          created_at?: string
          delivery_id?: string
          detail?: string
          event_type?: string
          id?: string
          notification_id?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_deliveries: {
        Row: {
          attempts: string
          channel: string
          completed_at: string
          created_at: string
          error: string
          id: string
          max_attempts: string
          metadata: string
          notification_id: string
          processing_at: string
          scheduled_at: string
          status: string
        }
        Insert: {
          attempts?: string
          channel: string
          completed_at?: string
          created_at?: string
          error?: string
          id: string
          max_attempts?: string
          metadata?: string
          notification_id: string
          processing_at?: string
          scheduled_at?: string
          status: string
        }
        Update: {
          attempts?: string
          channel?: string
          completed_at?: string
          created_at?: string
          error?: string
          id?: string
          max_attempts?: string
          metadata?: string
          notification_id?: string
          processing_at?: string
          scheduled_at?: string
          status?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          cat_business: string
          cat_critical: string
          cat_engagement: string
          cat_marketing: string
          cat_transactional: string
          cat_wellness: string
          channel_email: string
          channel_in_app: string
          channel_push: string
          channel_whatsapp: string
          created_at: string
          daily_cap: string
          id: string
          quiet_enabled: string
          quiet_end: string
          quiet_start: string
          show_name_on_artefacts: string
          updated_at: string
          user_id: string
          wellness_food: string
          wellness_mood: string
          wellness_sleep: string
          wellness_water: string
        }
        Insert: {
          cat_business?: string
          cat_critical?: string
          cat_engagement?: string
          cat_marketing?: string
          cat_transactional?: string
          cat_wellness?: string
          channel_email?: string
          channel_in_app?: string
          channel_push?: string
          channel_whatsapp?: string
          created_at?: string
          daily_cap?: string
          id: string
          quiet_enabled?: string
          quiet_end?: string
          quiet_start?: string
          show_name_on_artefacts: string
          updated_at?: string
          user_id: string
          wellness_food: string
          wellness_mood: string
          wellness_sleep: string
          wellness_water: string
        }
        Update: {
          cat_business?: string
          cat_critical?: string
          cat_engagement?: string
          cat_marketing?: string
          cat_transactional?: string
          cat_wellness?: string
          channel_email?: string
          channel_in_app?: string
          channel_push?: string
          channel_whatsapp?: string
          created_at?: string
          daily_cap?: string
          id?: string
          quiet_enabled?: string
          quiet_end?: string
          quiet_start?: string
          show_name_on_artefacts?: string
          updated_at?: string
          user_id?: string
          wellness_food?: string
          wellness_mood?: string
          wellness_sleep?: string
          wellness_water?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string
          body: string
          category: string
          created_at: string
          dismissed_at: string
          id: string
          idempotency_key: string
          metadata: string
          priority: string
          read: string
          reference_id: string
          reference_type: string
          scheduled_for: string
          source: string
          source_role: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string
          body?: string
          category?: string
          created_at?: string
          dismissed_at?: string
          id: string
          idempotency_key?: string
          metadata?: string
          priority?: string
          read?: string
          reference_id?: string
          reference_type?: string
          scheduled_for?: string
          source?: string
          source_role?: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          action_url?: string
          body?: string
          category?: string
          created_at?: string
          dismissed_at?: string
          id?: string
          idempotency_key?: string
          metadata?: string
          priority?: string
          read?: string
          reference_id?: string
          reference_type?: string
          scheduled_for?: string
          source?: string
          source_role?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      order_disputes: {
        Row: {
          b_confidence: string
          b_reasoning: string
          b_recommendation: string
          buyer_evidence: string
          buyer_statement: string
          created_at: string
          id: string
          order_id: string
          provider_evidence: string
          provider_statement: string
          raised_by: string
          reason: string
          resolution: string
          resolved_at: string
          resolved_by_admin_id: string
        }
        Insert: {
          b_confidence?: string
          b_reasoning?: string
          b_recommendation?: string
          buyer_evidence?: string
          buyer_statement?: string
          created_at?: string
          id: string
          order_id: string
          provider_evidence?: string
          provider_statement?: string
          raised_by: string
          reason: string
          resolution?: string
          resolved_at?: string
          resolved_by_admin_id?: string
        }
        Update: {
          b_confidence?: string
          b_reasoning?: string
          b_recommendation?: string
          buyer_evidence?: string
          buyer_statement?: string
          created_at?: string
          id?: string
          order_id?: string
          provider_evidence?: string
          provider_statement?: string
          raised_by?: string
          reason?: string
          resolution?: string
          resolved_at?: string
          resolved_by_admin_id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          line_total_rand: string
          order_id: string
          product_id: string
          product_photo_snapshot: string
          product_title_snapshot: string
          quantity: string
          unit_price_rand: string
        }
        Insert: {
          created_at?: string
          id: string
          line_total_rand: string
          order_id: string
          product_id: string
          product_photo_snapshot?: string
          product_title_snapshot: string
          quantity: string
          unit_price_rand: string
        }
        Update: {
          created_at?: string
          id?: string
          line_total_rand?: string
          order_id?: string
          product_id?: string
          product_photo_snapshot?: string
          product_title_snapshot?: string
          quantity?: string
          unit_price_rand?: string
        }
        Relationships: []
      }
      outreach_log: {
        Row: {
          campaign: string
          created_at: string
          email: string
          id: string
          opened_at: string
          provider_id: string
          provider_name: string
          replied_at: string
          status: string
        }
        Insert: {
          campaign?: string
          created_at?: string
          email?: string
          id: string
          opened_at?: string
          provider_id: string
          provider_name: string
          replied_at?: string
          status?: string
        }
        Update: {
          campaign?: string
          created_at?: string
          email?: string
          id?: string
          opened_at?: string
          provider_id?: string
          provider_name?: string
          replied_at?: string
          status?: string
        }
        Relationships: []
      }
      package_purchases: {
        Row: {
          client_id: string
          expires_at: string
          id: string
          package_id: string
          paystack_reference: string
          purchased_at: string
          remaining_sessions: string
          status: string
          total_sessions: string
        }
        Insert: {
          client_id?: string
          expires_at: string
          id: string
          package_id?: string
          paystack_reference?: string
          purchased_at?: string
          remaining_sessions: string
          status?: string
          total_sessions: string
        }
        Update: {
          client_id?: string
          expires_at?: string
          id?: string
          package_id?: string
          paystack_reference?: string
          purchased_at?: string
          remaining_sessions?: string
          status?: string
          total_sessions?: string
        }
        Relationships: []
      }
      packages: {
        Row: {
          active: string
          bonus_sessions: string
          created_at: string
          description: string
          id: string
          price_rand: string
          provider_id: string
          service_id: string
          title: string
          total_sessions: string
          valid_days: string
        }
        Insert: {
          active?: string
          bonus_sessions?: string
          created_at?: string
          description?: string
          id: string
          price_rand: string
          provider_id?: string
          service_id?: string
          title: string
          total_sessions: string
          valid_days?: string
        }
        Update: {
          active?: string
          bonus_sessions?: string
          created_at?: string
          description?: string
          id?: string
          price_rand?: string
          provider_id?: string
          service_id?: string
          title?: string
          total_sessions?: string
          valid_days?: string
        }
        Relationships: []
      }
      page_views: {
        Row: {
          category: string
          city: string
          created_at: string
          device_type: string
          id: string
          ip: string
          path: string
          provider_name: string
          referrer: string
          search_query: string
          suburb: string
          user_agent: string
          visitor_id: string
        }
        Insert: {
          category?: string
          city?: string
          created_at?: string
          device_type?: string
          id: string
          ip?: string
          path: string
          provider_name?: string
          referrer?: string
          search_query?: string
          suburb?: string
          user_agent?: string
          visitor_id?: string
        }
        Update: {
          category?: string
          city?: string
          created_at?: string
          device_type?: string
          id?: string
          ip?: string
          path?: string
          provider_name?: string
          referrer?: string
          search_query?: string
          suburb?: string
          user_agent?: string
          visitor_id?: string
        }
        Relationships: []
      }
      phone_otps: {
        Row: {
          attempts: string
          client_ip: string
          code: string
          consumed_at: string
          created_at: string
          expires_at: string
          id: string
          phone: string
          purpose: string
          user_agent: string
        }
        Insert: {
          attempts: string
          client_ip?: string
          code: string
          consumed_at?: string
          created_at: string
          expires_at: string
          id: string
          phone: string
          purpose: string
          user_agent?: string
        }
        Update: {
          attempts?: string
          client_ip?: string
          code?: string
          consumed_at?: string
          created_at?: string
          expires_at?: string
          id?: string
          phone?: string
          purpose?: string
          user_agent?: string
        }
        Relationships: []
      }
      places_api_daily: {
        Row: {
          count: string
          day: string
          updated_at: string
        }
        Insert: {
          count: string
          day: string
          updated_at: string
        }
        Update: {
          count?: string
          day?: string
          updated_at?: string
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          description: string
          id: string
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          description?: string
          id: string
          key: string
          updated_at: string
          value: string
        }
        Update: {
          description?: string
          id?: string
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      popia_requests: {
        Row: {
          completed_at: string
          export_file_url: string
          id: string
          ip_address: string
          notes: string
          profile_id: string
          request_type: string
          requested_at: string
          status: string
          user_agent: string
        }
        Insert: {
          completed_at?: string
          export_file_url?: string
          id: string
          ip_address?: string
          notes?: string
          profile_id: string
          request_type: string
          requested_at: string
          status: string
          user_agent?: string
        }
        Update: {
          completed_at?: string
          export_file_url?: string
          id?: string
          ip_address?: string
          notes?: string
          profile_id?: string
          request_type?: string
          requested_at?: string
          status?: string
          user_agent?: string
        }
        Relationships: []
      }
      product_orders: {
        Row: {
          bion_total_revenue_rand: string
          buyer_id: string
          client_fee_rand: string
          created_at: string
          delivered_at: string
          delivery_address: string
          delivery_charged_rand: string
          delivery_cost_rand: string
          delivery_zone: string
          id: string
          notes: string
          paid_at: string
          paystack_ref: string
          pickup_at_provider: string
          provider_fee_rand: string
          provider_id: string
          provider_payout_rand: string
          shipped_at: string
          status: string
          subtotal_rand: string
          total_charged_rand: string
          tracking_number: string
        }
        Insert: {
          bion_total_revenue_rand: string
          buyer_id: string
          client_fee_rand: string
          created_at?: string
          delivered_at?: string
          delivery_address?: string
          delivery_charged_rand: string
          delivery_cost_rand: string
          delivery_zone: string
          id: string
          notes?: string
          paid_at?: string
          paystack_ref?: string
          pickup_at_provider?: string
          provider_fee_rand: string
          provider_id: string
          provider_payout_rand: string
          shipped_at?: string
          status: string
          subtotal_rand: string
          total_charged_rand: string
          tracking_number?: string
        }
        Update: {
          bion_total_revenue_rand?: string
          buyer_id?: string
          client_fee_rand?: string
          created_at?: string
          delivered_at?: string
          delivery_address?: string
          delivery_charged_rand?: string
          delivery_cost_rand?: string
          delivery_zone?: string
          id?: string
          notes?: string
          paid_at?: string
          paystack_ref?: string
          pickup_at_provider?: string
          provider_fee_rand?: string
          provider_id?: string
          provider_payout_rand?: string
          shipped_at?: string
          status?: string
          subtotal_rand?: string
          total_charged_rand?: string
          tracking_number?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          admin_review_notes: string
          b_review_notes: string
          b_review_status: string
          b_reviewed_at: string
          b_risk_score: string
          category: string
          created_at: string
          description: string
          digital: string
          id: string
          largest_side_cm: string
          photos: string
          price_rand: string
          provider_id: string
          status: string
          stock_qty: string
          stock_remaining: string
          title: string
          total_sold: string
          updated_at: string
          weight_grams: string
        }
        Insert: {
          admin_review_notes?: string
          b_review_notes?: string
          b_review_status?: string
          b_reviewed_at?: string
          b_risk_score?: string
          category?: string
          created_at?: string
          description?: string
          digital?: string
          id: string
          largest_side_cm?: string
          photos?: string
          price_rand: string
          provider_id: string
          status: string
          stock_qty: string
          stock_remaining: string
          title: string
          total_sold?: string
          updated_at?: string
          weight_grams?: string
        }
        Update: {
          admin_review_notes?: string
          b_review_notes?: string
          b_review_status?: string
          b_reviewed_at?: string
          b_risk_score?: string
          category?: string
          created_at?: string
          description?: string
          digital?: string
          id?: string
          largest_side_cm?: string
          photos?: string
          price_rand?: string
          provider_id?: string
          status?: string
          stock_qty?: string
          stock_remaining?: string
          title?: string
          total_sold?: string
          updated_at?: string
          weight_grams?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          active_subscription_id: string
          age_verified: string
          avatar_url: string
          bion_id: string
          booking_buffer_minutes: string
          cancellation_policy_min_notice_hours: string
          city: string
          country: string
          cover_image_url: string
          created_at: string
          date_of_birth: string
          deletion_requested_at: string
          device_fingerprint_signup: string
          email: string
          email_verified: string
          email_verified_at: string
          email_verify_code: string
          email_verify_expires: string
          full_name: string
          ical_token: string
          id: string
          identity_verified: string
          identity_verified_at: string
          incomplete_login_grace: string
          invite_code_used: string
          is_active: string
          kyc_id_hash: string
          last_login_at: string
          lat: string
          layer1_complete: string
          layer2_complete: string
          layer3_complete: string
          lng: string
          location: string
          login_count: string
          max_advance_days: string
          max_bookings_per_day: string
          min_notice_hours: string
          nudges_seen: string
          payment_instrument_hash: string
          paystack_customer_code: string
          paystack_recipient_code: string
          paystack_subaccount_code: string
          phone: string
          phone_verified: string
          phone_verified_at: string
          primary_role: string
          pro_terms_confirmed: string
          profile_complete: string
          profile_completed_at: string
          ranger_id: string
          referral_locked_at: string
          referred_at: string
          referred_by_client: string
          referred_by_client_at: string
          referred_by_client_code_used: string
          referred_by_ranger: string
          referred_code_used: string
          regulator_body: string
          regulator_number: string
          regulator_verified_at: string
          service_radius_km: string
          subscription_tier: string
          suburb: string
          updated_at: string
          user_id: string
          verification_submitted: string
          wa_engagement_state: string
          wa_last_check_in_at: string
          wa_last_inbound_at: string
          wa_opt_out_at: string
          wa_opt_out_reason: string
        }
        Insert: {
          active_subscription_id?: string
          age_verified: string
          avatar_url?: string
          bion_id: string
          booking_buffer_minutes: string
          cancellation_policy_min_notice_hours?: string
          city?: string
          country?: string
          cover_image_url?: string
          created_at: string
          date_of_birth?: string
          deletion_requested_at?: string
          device_fingerprint_signup?: string
          email?: string
          email_verified?: string
          email_verified_at?: string
          email_verify_code?: string
          email_verify_expires?: string
          full_name: string
          ical_token?: string
          id: string
          identity_verified: string
          identity_verified_at?: string
          incomplete_login_grace: string
          invite_code_used?: string
          is_active?: string
          kyc_id_hash?: string
          last_login_at?: string
          lat?: string
          layer1_complete?: string
          layer2_complete?: string
          layer3_complete?: string
          lng?: string
          location?: string
          login_count?: string
          max_advance_days: string
          max_bookings_per_day?: string
          min_notice_hours: string
          nudges_seen?: string
          payment_instrument_hash?: string
          paystack_customer_code?: string
          paystack_recipient_code?: string
          paystack_subaccount_code?: string
          phone?: string
          phone_verified: string
          phone_verified_at?: string
          primary_role?: string
          pro_terms_confirmed?: string
          profile_complete?: string
          profile_completed_at?: string
          ranger_id?: string
          referral_locked_at?: string
          referred_at?: string
          referred_by_client?: string
          referred_by_client_at?: string
          referred_by_client_code_used?: string
          referred_by_ranger?: string
          referred_code_used?: string
          regulator_body?: string
          regulator_number?: string
          regulator_verified_at?: string
          service_radius_km?: string
          subscription_tier?: string
          suburb?: string
          updated_at: string
          user_id: string
          verification_submitted?: string
          wa_engagement_state: string
          wa_last_check_in_at?: string
          wa_last_inbound_at?: string
          wa_opt_out_at?: string
          wa_opt_out_reason?: string
        }
        Update: {
          active_subscription_id?: string
          age_verified?: string
          avatar_url?: string
          bion_id?: string
          booking_buffer_minutes?: string
          cancellation_policy_min_notice_hours?: string
          city?: string
          country?: string
          cover_image_url?: string
          created_at?: string
          date_of_birth?: string
          deletion_requested_at?: string
          device_fingerprint_signup?: string
          email?: string
          email_verified?: string
          email_verified_at?: string
          email_verify_code?: string
          email_verify_expires?: string
          full_name?: string
          ical_token?: string
          id?: string
          identity_verified?: string
          identity_verified_at?: string
          incomplete_login_grace?: string
          invite_code_used?: string
          is_active?: string
          kyc_id_hash?: string
          last_login_at?: string
          lat?: string
          layer1_complete?: string
          layer2_complete?: string
          layer3_complete?: string
          lng?: string
          location?: string
          login_count?: string
          max_advance_days?: string
          max_bookings_per_day?: string
          min_notice_hours?: string
          nudges_seen?: string
          payment_instrument_hash?: string
          paystack_customer_code?: string
          paystack_recipient_code?: string
          paystack_subaccount_code?: string
          phone?: string
          phone_verified?: string
          phone_verified_at?: string
          primary_role?: string
          pro_terms_confirmed?: string
          profile_complete?: string
          profile_completed_at?: string
          ranger_id?: string
          referral_locked_at?: string
          referred_at?: string
          referred_by_client?: string
          referred_by_client_at?: string
          referred_by_client_code_used?: string
          referred_by_ranger?: string
          referred_code_used?: string
          regulator_body?: string
          regulator_number?: string
          regulator_verified_at?: string
          service_radius_km?: string
          subscription_tier?: string
          suburb?: string
          updated_at?: string
          user_id?: string
          verification_submitted?: string
          wa_engagement_state?: string
          wa_last_check_in_at?: string
          wa_last_inbound_at?: string
          wa_opt_out_at?: string
          wa_opt_out_reason?: string
        }
        Relationships: []
      }
      program_checkins: {
        Row: {
          completed_at: string
          day_number: string
          enrollment_id: string
          id: string
          note: string
        }
        Insert: {
          completed_at: string
          day_number: string
          enrollment_id: string
          id: string
          note?: string
        }
        Update: {
          completed_at?: string
          day_number?: string
          enrollment_id?: string
          id?: string
          note?: string
        }
        Relationships: []
      }
      program_days: {
        Row: {
          body_markdown: string
          day_number: string
          id: string
          media_urls: string
          program_id: string
          title: string
        }
        Insert: {
          body_markdown: string
          day_number: string
          id: string
          media_urls?: string
          program_id: string
          title: string
        }
        Update: {
          body_markdown?: string
          day_number?: string
          id?: string
          media_urls?: string
          program_id?: string
          title?: string
        }
        Relationships: []
      }
      program_enrollments: {
        Row: {
          client_id: string
          created_at: string
          id: string
          paystack_reference: string
          price_paid_rand: string
          program_id: string
          provider_id: string
          start_date: string
          status: string
        }
        Insert: {
          client_id: string
          created_at: string
          id: string
          paystack_reference?: string
          price_paid_rand: string
          program_id: string
          provider_id: string
          start_date: string
          status: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          paystack_reference?: string
          price_paid_rand?: string
          program_id?: string
          provider_id?: string
          start_date?: string
          status?: string
        }
        Relationships: []
      }
      programs: {
        Row: {
          active: string
          cover_image_url: string
          created_at: string
          description: string
          duration_days: string
          id: string
          price_rand: string
          provider_id: string
          published_at: string
          slug: string
          title: string
          updated_at: string
          vertical: string
        }
        Insert: {
          active: string
          cover_image_url?: string
          created_at: string
          description?: string
          duration_days: string
          id: string
          price_rand: string
          provider_id: string
          published_at?: string
          slug: string
          title: string
          updated_at: string
          vertical: string
        }
        Update: {
          active?: string
          cover_image_url?: string
          created_at?: string
          description?: string
          duration_days?: string
          id?: string
          price_rand?: string
          provider_id?: string
          published_at?: string
          slug?: string
          title?: string
          updated_at?: string
          vertical?: string
        }
        Relationships: []
      }
      provider_availabilities: {
        Row: {
          active: string
          created_at: string
          day_of_week: string
          end_time: string
          id: string
          provider_id: string
          start_time: string
        }
        Insert: {
          active?: string
          created_at?: string
          day_of_week: string
          end_time: string
          id: string
          provider_id: string
          start_time: string
        }
        Update: {
          active?: string
          created_at?: string
          day_of_week?: string
          end_time?: string
          id?: string
          provider_id?: string
          start_time?: string
        }
        Relationships: []
      }
      provider_availability: {
        Row: {
          active: string
          created_at: string
          day_of_week: string
          end_time: string
          id: string
          provider_id: string
          start_time: string
          timezone: string
          updated_at: string
        }
        Insert: {
          active: string
          created_at: string
          day_of_week: string
          end_time: string
          id: string
          provider_id: string
          start_time: string
          timezone: string
          updated_at: string
        }
        Update: {
          active?: string
          created_at?: string
          day_of_week?: string
          end_time?: string
          id?: string
          provider_id?: string
          start_time?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      provider_availability_override: {
        Row: {
          created_at: string
          date: string
          end_time: string
          id: string
          provider_id: string
          reason: string
          start_time: string
        }
        Insert: {
          created_at: string
          date: string
          end_time?: string
          id: string
          provider_id: string
          reason?: string
          start_time?: string
        }
        Update: {
          created_at?: string
          date?: string
          end_time?: string
          id?: string
          provider_id?: string
          reason?: string
          start_time?: string
        }
        Relationships: []
      }
      provider_claims: {
        Row: {
          admin_note: string
          claimant_email: string
          claimant_name: string
          claimant_phone: string
          created_at: string
          external_provider_name: string
          external_provider_slug: string
          id: string
          linked_profile_id: string
          proof_of_ownership: string
          reviewed_at: string
          reviewed_by: string
          status: string
        }
        Insert: {
          admin_note?: string
          claimant_email: string
          claimant_name: string
          claimant_phone?: string
          created_at: string
          external_provider_name: string
          external_provider_slug: string
          id: string
          linked_profile_id?: string
          proof_of_ownership?: string
          reviewed_at?: string
          reviewed_by?: string
          status: string
        }
        Update: {
          admin_note?: string
          claimant_email?: string
          claimant_name?: string
          claimant_phone?: string
          created_at?: string
          external_provider_name?: string
          external_provider_slug?: string
          id?: string
          linked_profile_id?: string
          proof_of_ownership?: string
          reviewed_at?: string
          reviewed_by?: string
          status?: string
        }
        Relationships: []
      }
      provider_data_grants: {
        Row: {
          auto_converts_on_booking: string
          booking_id: string
          client_id: string
          expires_at: string
          grant_type: string
          granted_at: string
          granted_via: string
          id: string
          notes: string
          provider_id: string
          revoked_at: string
          scope: string
        }
        Insert: {
          auto_converts_on_booking: string
          booking_id?: string
          client_id: string
          expires_at?: string
          grant_type: string
          granted_at: string
          granted_via: string
          id: string
          notes?: string
          provider_id: string
          revoked_at?: string
          scope: string
        }
        Update: {
          auto_converts_on_booking?: string
          booking_id?: string
          client_id?: string
          expires_at?: string
          grant_type?: string
          granted_at?: string
          granted_via?: string
          id?: string
          notes?: string
          provider_id?: string
          revoked_at?: string
          scope?: string
        }
        Relationships: []
      }
      provider_data_reads: {
        Row: {
          client_id: string
          compliance_case_id: string
          dispute_id: string
          endpoint: string
          id: string
          ip: string
          is_emergency: string
          justification: string
          notified_at: string
          notify_attempts: string
          notify_last_error: string
          peer_review_notes: string
          peer_review_status: string
          peer_reviewed_at: string
          peer_reviewed_by_id: string
          read_at: string
          reader_profile_id: string
          reader_role: string
          scope: string
          ticket_id: string
          user_agent: string
        }
        Insert: {
          client_id: string
          compliance_case_id?: string
          dispute_id?: string
          endpoint: string
          id: string
          ip?: string
          is_emergency: string
          justification?: string
          notified_at?: string
          notify_attempts: string
          notify_last_error?: string
          peer_review_notes?: string
          peer_review_status?: string
          peer_reviewed_at?: string
          peer_reviewed_by_id?: string
          read_at: string
          reader_profile_id: string
          reader_role: string
          scope: string
          ticket_id?: string
          user_agent?: string
        }
        Update: {
          client_id?: string
          compliance_case_id?: string
          dispute_id?: string
          endpoint?: string
          id?: string
          ip?: string
          is_emergency?: string
          justification?: string
          notified_at?: string
          notify_attempts?: string
          notify_last_error?: string
          peer_review_notes?: string
          peer_review_status?: string
          peer_reviewed_at?: string
          peer_reviewed_by_id?: string
          read_at?: string
          reader_profile_id?: string
          reader_role?: string
          scope?: string
          ticket_id?: string
          user_agent?: string
        }
        Relationships: []
      }
      provider_documents: {
        Row: {
          admin_notes: string
          doc_type: string
          file_name: string
          file_url: string
          id: string
          notes: string
          ocr_result: string
          ocr_result_enc: string
          provider_id: string
          reviewed_at: string
          reviewed_by: string
          status: string
          storage_path: string
          uploaded_at: string
        }
        Insert: {
          admin_notes?: string
          doc_type: string
          file_name: string
          file_url?: string
          id: string
          notes?: string
          ocr_result?: string
          ocr_result_enc?: string
          provider_id: string
          reviewed_at?: string
          reviewed_by?: string
          status: string
          storage_path?: string
          uploaded_at?: string
        }
        Update: {
          admin_notes?: string
          doc_type?: string
          file_name?: string
          file_url?: string
          id?: string
          notes?: string
          ocr_result?: string
          ocr_result_enc?: string
          provider_id?: string
          reviewed_at?: string
          reviewed_by?: string
          status?: string
          storage_path?: string
          uploaded_at?: string
        }
        Relationships: []
      }
      provider_documents_ocr_migration_status: {
        Row: {
          encrypted: string
          no_ocr: string
          plaintext_only: string
        }
        Insert: {
          encrypted?: string
          no_ocr?: string
          plaintext_only?: string
        }
        Update: {
          encrypted?: string
          no_ocr?: string
          plaintext_only?: string
        }
        Relationships: []
      }
      provider_locations: {
        Row: {
          address: string
          city: string
          created_at: string
          id: string
          is_primary: string
          lat: string
          lng: string
          name: string
          operating_hours: string
          phone: string
          provider_id: string
          suburb: string
          updated_at: string
        }
        Insert: {
          address?: string
          city?: string
          created_at?: string
          id: string
          is_primary?: string
          lat?: string
          lng?: string
          name: string
          operating_hours?: string
          phone?: string
          provider_id: string
          suburb?: string
          updated_at?: string
        }
        Update: {
          address?: string
          city?: string
          created_at?: string
          id?: string
          is_primary?: string
          lat?: string
          lng?: string
          name?: string
          operating_hours?: string
          phone?: string
          provider_id?: string
          suburb?: string
          updated_at?: string
        }
        Relationships: []
      }
      provider_marketing_levy: {
        Row: {
          booking_id: string
          created_at: string
          id: string
          levy_rand: string
          levy_type: string
          minted_voucher_id: string
          provider_id: string
          source_amount_rand: string
        }
        Insert: {
          booking_id?: string
          created_at?: string
          id: string
          levy_rand: string
          levy_type: string
          minted_voucher_id?: string
          provider_id: string
          source_amount_rand: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          id?: string
          levy_rand?: string
          levy_type?: string
          minted_voucher_id?: string
          provider_id?: string
          source_amount_rand?: string
        }
        Relationships: []
      }
      provider_marketing_stats: {
        Row: {
          attributed_acquisition_rand: string
          lifetime_levy_rand: string
          mtd_levy_rand: string
          provider_id: string
          redeemed_bion_fee_rand: string
          redeemed_payout_rand: string
          vouchers_available: string
          vouchers_claimed: string
          vouchers_minted: string
          vouchers_redeemed: string
        }
        Insert: {
          attributed_acquisition_rand?: string
          lifetime_levy_rand?: string
          mtd_levy_rand?: string
          provider_id?: string
          redeemed_bion_fee_rand?: string
          redeemed_payout_rand?: string
          vouchers_available?: string
          vouchers_claimed?: string
          vouchers_minted?: string
          vouchers_redeemed?: string
        }
        Update: {
          attributed_acquisition_rand?: string
          lifetime_levy_rand?: string
          mtd_levy_rand?: string
          provider_id?: string
          redeemed_bion_fee_rand?: string
          redeemed_payout_rand?: string
          vouchers_available?: string
          vouchers_claimed?: string
          vouchers_minted?: string
          vouchers_redeemed?: string
        }
        Relationships: []
      }
      provider_marketing_wallets: {
        Row: {
          balance_rand: string
          created_at: string
          deactivated_at: string
          lifetime_credited: string
          lifetime_redeemed: string
          lifetime_reverted: string
          provider_id: string
          updated_at: string
        }
        Insert: {
          balance_rand: string
          created_at: string
          deactivated_at?: string
          lifetime_credited: string
          lifetime_redeemed: string
          lifetime_reverted: string
          provider_id: string
          updated_at: string
        }
        Update: {
          balance_rand?: string
          created_at?: string
          deactivated_at?: string
          lifetime_credited?: string
          lifetime_redeemed?: string
          lifetime_reverted?: string
          provider_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      provider_profiles: {
        Row: {
          bio: string
          business_name: string
          created_at: string
          experience_years: string
          is_active: string
          is_featured: string
          location: string
          onboarding_completed: string
          popia_consented_at: string
          provider_status: string
          qualifications: string
          search_vector: string
          specialty: string
          updated_at: string
          user_id: string
          vertical: string
          vertical_color: string
        }
        Insert: {
          bio?: string
          business_name?: string
          created_at: string
          experience_years?: string
          is_active: string
          is_featured: string
          location?: string
          onboarding_completed: string
          popia_consented_at?: string
          provider_status: string
          qualifications?: string
          search_vector?: string
          specialty?: string
          updated_at: string
          user_id: string
          vertical?: string
          vertical_color?: string
        }
        Update: {
          bio?: string
          business_name?: string
          created_at?: string
          experience_years?: string
          is_active?: string
          is_featured?: string
          location?: string
          onboarding_completed?: string
          popia_consented_at?: string
          provider_status?: string
          qualifications?: string
          search_vector?: string
          specialty?: string
          updated_at?: string
          user_id?: string
          vertical?: string
          vertical_color?: string
        }
        Relationships: []
      }
      provider_rating_summary: {
        Row: {
          avg_rating: string
          five_star: string
          four_star: string
          low_star: string
          one_star: string
          provider_id: string
          review_count: string
          three_star: string
          two_star: string
        }
        Insert: {
          avg_rating?: string
          five_star?: string
          four_star?: string
          low_star?: string
          one_star?: string
          provider_id?: string
          review_count?: string
          three_star?: string
          two_star?: string
        }
        Update: {
          avg_rating?: string
          five_star?: string
          four_star?: string
          low_star?: string
          one_star?: string
          provider_id?: string
          review_count?: string
          three_star?: string
          two_star?: string
        }
        Relationships: []
      }
      provider_referrals: {
        Row: {
          client_id: string
          created_at: string
          id: string
          notes: string
          reason: string
          referred_to_provider_id: string
          referring_provider_id: string
          status: string
          updated_at: string
          urgency: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id: string
          notes?: string
          reason: string
          referred_to_provider_id: string
          referring_provider_id: string
          status: string
          updated_at?: string
          urgency: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          notes?: string
          reason?: string
          referred_to_provider_id?: string
          referring_provider_id?: string
          status?: string
          updated_at?: string
          urgency?: string
        }
        Relationships: []
      }
      provider_storefronts: {
        Row: {
          created_at: string
          enabled: string
          id: string
          pickup_address: string
          pickup_instructions: string
          pickup_lat: string
          pickup_lng: string
          provider_id: string
          return_policy: string
          shipping_policy: string
          storefront_description: string
          storefront_name: string
          total_revenue_rand: string
          total_sales_count: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          enabled?: string
          id: string
          pickup_address?: string
          pickup_instructions?: string
          pickup_lat?: string
          pickup_lng?: string
          provider_id: string
          return_policy?: string
          shipping_policy?: string
          storefront_description?: string
          storefront_name?: string
          total_revenue_rand?: string
          total_sales_count?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          enabled?: string
          id?: string
          pickup_address?: string
          pickup_instructions?: string
          pickup_lat?: string
          pickup_lng?: string
          provider_id?: string
          return_policy?: string
          shipping_policy?: string
          storefront_description?: string
          storefront_name?: string
          total_revenue_rand?: string
          total_sales_count?: string
          updated_at?: string
        }
        Relationships: []
      }
      provider_strikes: {
        Row: {
          booking_id: string
          created_at: string
          id: string
          provider_id: string
          reason: string
          strike_type: string
        }
        Insert: {
          booking_id?: string
          created_at?: string
          id: string
          provider_id: string
          reason?: string
          strike_type?: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          id?: string
          provider_id?: string
          reason?: string
          strike_type?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          active: string
          auth: string
          created_at: string
          endpoint: string
          id: string
          kind: string
          last_used_at: string
          native_token: string
          p256dh: string
          profile_id: string
          user_agent: string
        }
        Insert: {
          active?: string
          auth?: string
          created_at?: string
          endpoint?: string
          id: string
          kind: string
          last_used_at?: string
          native_token?: string
          p256dh?: string
          profile_id: string
          user_agent?: string
        }
        Update: {
          active?: string
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          kind?: string
          last_used_at?: string
          native_token?: string
          p256dh?: string
          profile_id?: string
          user_agent?: string
        }
        Relationships: []
      }
      queue_entries: {
        Row: {
          client_id: string
          completed_at: string
          created_at: string
          estimated_wait_minutes: string
          id: string
          joined_at: string
          location_id: string
          position: string
          provider_id: string
          service_id: string
          started_at: string
          status: string
          updated_at: string
        }
        Insert: {
          client_id: string
          completed_at?: string
          created_at?: string
          estimated_wait_minutes?: string
          id: string
          joined_at?: string
          location_id?: string
          position: string
          provider_id: string
          service_id?: string
          started_at?: string
          status: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          completed_at?: string
          created_at?: string
          estimated_wait_minutes?: string
          id?: string
          joined_at?: string
          location_id?: string
          position?: string
          provider_id?: string
          service_id?: string
          started_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      ranger_accreditations: {
        Row: {
          accredited: string
          accredited_at: string
          average_score: string
          certificate_code: string
          courses_completed: string
          created_at: string
          expires_at: string
          id: string
          support_tier: string
          user_id: string
        }
        Insert: {
          accredited?: string
          accredited_at?: string
          average_score?: string
          certificate_code?: string
          courses_completed?: string
          created_at?: string
          expires_at?: string
          id: string
          support_tier?: string
          user_id: string
        }
        Update: {
          accredited?: string
          accredited_at?: string
          average_score?: string
          certificate_code?: string
          courses_completed?: string
          created_at?: string
          expires_at?: string
          id?: string
          support_tier?: string
          user_id?: string
        }
        Relationships: []
      }
      ranger_attribution_summary: {
        Row: {
          clients_referred: string
          last_referral_at: string
          providers_referred: string
          ranger_id: string
          total_referred: string
        }
        Insert: {
          clients_referred?: string
          last_referral_at?: string
          providers_referred?: string
          ranger_id?: string
          total_referred?: string
        }
        Update: {
          clients_referred?: string
          last_referral_at?: string
          providers_referred?: string
          ranger_id?: string
          total_referred?: string
        }
        Relationships: []
      }
      ranger_attributions: {
        Row: {
          created_at: string
          first_signup_at: string
          id: string
          last_active_at: string
          last_reactivation_at: string
          provider_id: string
          ranger_id: string
          reactivation_count: string
          updated_at: string
          windfall_clawed_back: string
          windfall_clawed_back_at: string
          windfall_months_credited: string
          windfall_total_rand: string
        }
        Insert: {
          created_at: string
          first_signup_at: string
          id: string
          last_active_at: string
          last_reactivation_at?: string
          provider_id: string
          ranger_id: string
          reactivation_count: string
          updated_at: string
          windfall_clawed_back: string
          windfall_clawed_back_at?: string
          windfall_months_credited: string
          windfall_total_rand: string
        }
        Update: {
          created_at?: string
          first_signup_at?: string
          id?: string
          last_active_at?: string
          last_reactivation_at?: string
          provider_id?: string
          ranger_id?: string
          reactivation_count?: string
          updated_at?: string
          windfall_clawed_back?: string
          windfall_clawed_back_at?: string
          windfall_months_credited?: string
          windfall_total_rand?: string
        }
        Relationships: []
      }
      ranger_clawbacks: {
        Row: {
          amount_rand: string
          applied_at: string
          applied_to_payout_id: string
          attribution_id: string
          created_at: string
          id: string
          provider_id: string
          ranger_id: string
          reason: string
          triggered_by_event: string
          waived_at: string
          waived_by_admin_id: string
          waived_reason: string
        }
        Insert: {
          amount_rand: string
          applied_at?: string
          applied_to_payout_id?: string
          attribution_id: string
          created_at: string
          id: string
          provider_id: string
          ranger_id: string
          reason: string
          triggered_by_event?: string
          waived_at?: string
          waived_by_admin_id?: string
          waived_reason?: string
        }
        Update: {
          amount_rand?: string
          applied_at?: string
          applied_to_payout_id?: string
          attribution_id?: string
          created_at?: string
          id?: string
          provider_id?: string
          ranger_id?: string
          reason?: string
          triggered_by_event?: string
          waived_at?: string
          waived_by_admin_id?: string
          waived_reason?: string
        }
        Relationships: []
      }
      ranger_commissions: {
        Row: {
          amount: string
          commission_type: string
          created_at: string
          id: string
          paid_at: string
          provider_id: string
          ranger_id: string
          reference_month: string
          status: string
        }
        Insert: {
          amount?: string
          commission_type?: string
          created_at?: string
          id: string
          paid_at?: string
          provider_id?: string
          ranger_id: string
          reference_month?: string
          status?: string
        }
        Update: {
          amount?: string
          commission_type?: string
          created_at?: string
          id?: string
          paid_at?: string
          provider_id?: string
          ranger_id?: string
          reference_month?: string
          status?: string
        }
        Relationships: []
      }
      ranger_invite_codes: {
        Row: {
          code: string
          created_by: string
          expires_at: string
          id: string
          type: string
          used_at: string
          used_by: string
        }
        Insert: {
          code: string
          created_by?: string
          expires_at?: string
          id: string
          type?: string
          used_at?: string
          used_by?: string
        }
        Update: {
          code?: string
          created_by?: string
          expires_at?: string
          id?: string
          type?: string
          used_at?: string
          used_by?: string
        }
        Relationships: []
      }
      ranger_lead_activities: {
        Row: {
          created_at: string
          id: string
          lead_id: string
          notes: string
          outcome: string
          ranger_profile_id: string
          type: string
        }
        Insert: {
          created_at: string
          id: string
          lead_id: string
          notes?: string
          outcome?: string
          ranger_profile_id: string
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          lead_id?: string
          notes?: string
          outcome?: string
          ranger_profile_id?: string
          type?: string
        }
        Relationships: []
      }
      ranger_leads: {
        Row: {
          business_name: string
          category: string
          city: string
          contact_name: string
          created_at: string
          email: string
          id: string
          last_contacted: string
          location: string
          next_follow_up: string
          notes: string
          phone: string
          provider_profile_id: string
          ranger_profile_id: string
          source: string
          stage: string
          suburb: string
          updated_at: string
        }
        Insert: {
          business_name: string
          category: string
          city?: string
          contact_name: string
          created_at: string
          email?: string
          id: string
          last_contacted?: string
          location?: string
          next_follow_up?: string
          notes?: string
          phone?: string
          provider_profile_id?: string
          ranger_profile_id: string
          source: string
          stage: string
          suburb?: string
          updated_at: string
        }
        Update: {
          business_name?: string
          category?: string
          city?: string
          contact_name?: string
          created_at?: string
          email?: string
          id?: string
          last_contacted?: string
          location?: string
          next_follow_up?: string
          notes?: string
          phone?: string
          provider_profile_id?: string
          ranger_profile_id?: string
          source?: string
          stage?: string
          suburb?: string
          updated_at?: string
        }
        Relationships: []
      }
      ranger_pipeline: {
        Row: {
          contact_email: string
          contact_phone: string
          created_at: string
          deal_value: string
          id: string
          lead_name: string
          lead_type: string
          notes: string
          ranger_id: string
          stage: string
          updated_at: string
        }
        Insert: {
          contact_email?: string
          contact_phone?: string
          created_at?: string
          deal_value?: string
          id: string
          lead_name: string
          lead_type?: string
          notes?: string
          ranger_id: string
          stage?: string
          updated_at?: string
        }
        Update: {
          contact_email?: string
          contact_phone?: string
          created_at?: string
          deal_value?: string
          id?: string
          lead_name?: string
          lead_type?: string
          notes?: string
          ranger_id?: string
          stage?: string
          updated_at?: string
        }
        Relationships: []
      }
      referral_attribution_attempts: {
        Row: {
          attempted_at: string
          denial_detail: string
          id: string
          ip: string
          outcome: string
          referee_profile_id: string
          referrer_code: string
          referrer_profile_id: string
          user_agent: string
        }
        Insert: {
          attempted_at: string
          denial_detail?: string
          id: string
          ip?: string
          outcome: string
          referee_profile_id?: string
          referrer_code: string
          referrer_profile_id?: string
          user_agent?: string
        }
        Update: {
          attempted_at?: string
          denial_detail?: string
          id?: string
          ip?: string
          outcome?: string
          referee_profile_id?: string
          referrer_code?: string
          referrer_profile_id?: string
          user_agent?: string
        }
        Relationships: []
      }
      referral_clicks: {
        Row: {
          converted_at: string
          converted_profile_id: string
          id: string
          ip_hash: string
          landed_at: string
          ranger_code: string
          ranger_profile_id: string
          user_agent: string
          utm_source: string
        }
        Insert: {
          converted_at?: string
          converted_profile_id?: string
          id: string
          ip_hash?: string
          landed_at: string
          ranger_code: string
          ranger_profile_id?: string
          user_agent?: string
          utm_source?: string
        }
        Update: {
          converted_at?: string
          converted_profile_id?: string
          id?: string
          ip_hash?: string
          landed_at?: string
          ranger_code?: string
          ranger_profile_id?: string
          user_agent?: string
          utm_source?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          premium_ended_at: string
          premium_started_at: string
          referral_code: string
          referred_id: string
          referrer_id: string
          signup_bonus_awarded: string
          subscription_active: string
        }
        Insert: {
          created_at?: string
          id: string
          premium_ended_at?: string
          premium_started_at?: string
          referral_code: string
          referred_id: string
          referrer_id: string
          signup_bonus_awarded?: string
          subscription_active?: string
        }
        Update: {
          created_at?: string
          id?: string
          premium_ended_at?: string
          premium_started_at?: string
          referral_code?: string
          referred_id?: string
          referrer_id?: string
          signup_bonus_awarded?: string
          subscription_active?: string
        }
        Relationships: []
      }
      rep_agreement_acceptances: {
        Row: {
          accepted_at: string
          id: string
          ip_address: string
          terms_hash: string
          user_agent: string
          user_id: string
          version: string
        }
        Insert: {
          accepted_at: string
          id: string
          ip_address?: string
          terms_hash?: string
          user_agent?: string
          user_id: string
          version: string
        }
        Update: {
          accepted_at?: string
          id?: string
          ip_address?: string
          terms_hash?: string
          user_agent?: string
          user_id?: string
          version?: string
        }
        Relationships: []
      }
      rep_profiles: {
        Row: {
          commission_rate: string
          created_at: string
          managed_provider_ids: string
          onboarding_completed: string
          popia_consented_at: string
          ranger_tier: string
          region: string
          updated_at: string
          user_id: string
        }
        Insert: {
          commission_rate?: string
          created_at: string
          managed_provider_ids?: string
          onboarding_completed: string
          popia_consented_at?: string
          ranger_tier?: string
          region?: string
          updated_at: string
          user_id: string
        }
        Update: {
          commission_rate?: string
          created_at?: string
          managed_provider_ids?: string
          onboarding_completed?: string
          popia_consented_at?: string
          ranger_tier?: string
          region?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          booking_id: string
          client_id: string
          comment: string
          created_at: string
          id: string
          is_public: string
          provider_id: string
          rating: string
          tags: string
        }
        Insert: {
          booking_id: string
          client_id: string
          comment?: string
          created_at: string
          id: string
          is_public: string
          provider_id: string
          rating: string
          tags?: string
        }
        Update: {
          booking_id?: string
          client_id?: string
          comment?: string
          created_at?: string
          id?: string
          is_public?: string
          provider_id?: string
          rating?: string
          tags?: string
        }
        Relationships: []
      }
      reward_redemptions: {
        Row: {
          claimed_at: string
          delivered_at: string
          id: string
          points_spent: string
          reward_id: string
          shipped_at: string
          shipping_address: string
          status: string
          tracking_number: string
          user_id: string
        }
        Insert: {
          claimed_at?: string
          delivered_at?: string
          id: string
          points_spent?: string
          reward_id: string
          shipped_at?: string
          shipping_address?: string
          status: string
          tracking_number?: string
          user_id: string
        }
        Update: {
          claimed_at?: string
          delivered_at?: string
          id?: string
          points_spent?: string
          reward_id?: string
          shipped_at?: string
          shipping_address?: string
          status?: string
          tracking_number?: string
          user_id?: string
        }
        Relationships: []
      }
      routine_progress: {
        Row: {
          created_at: string
          date: string
          exercises_done: string
          id: string
          routine_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          exercises_done: string
          id: string
          routine_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          exercises_done?: string
          id?: string
          routine_id?: string
          user_id?: string
        }
        Relationships: []
      }
      routines: {
        Row: {
          created_at: string
          created_by: string
          days_completed: string
          exercises: string
          id: string
          provider_id: string
          provider_name: string
          schedule: string
          shared_with: string
          title: string
          total_days: string
          type: string
          updated_at: string
          user_id: string
          vertical: string
        }
        Insert: {
          created_at?: string
          created_by: string
          days_completed: string
          exercises: string
          id: string
          provider_id?: string
          provider_name?: string
          schedule?: string
          shared_with?: string
          title: string
          total_days: string
          type: string
          updated_at?: string
          user_id: string
          vertical: string
        }
        Update: {
          created_at?: string
          created_by?: string
          days_completed?: string
          exercises?: string
          id?: string
          provider_id?: string
          provider_name?: string
          schedule?: string
          shared_with?: string
          title?: string
          total_days?: string
          type?: string
          updated_at?: string
          user_id?: string
          vertical?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          active: string
          cancellation_policy_min_notice_hours: string
          category: string
          category_id: string
          created_at: string
          delivery_mode: string
          description: string
          duration_minutes: string
          id: string
          is_free_intro: string
          is_published: string
          price: string
          price_rand: string
          provider_id: string
          title: string
          updated_at: string
        }
        Insert: {
          active?: string
          cancellation_policy_min_notice_hours?: string
          category?: string
          category_id?: string
          created_at: string
          delivery_mode?: string
          description?: string
          duration_minutes: string
          id: string
          is_free_intro?: string
          is_published?: string
          price: string
          price_rand?: string
          provider_id: string
          title: string
          updated_at: string
        }
        Update: {
          active?: string
          cancellation_policy_min_notice_hours?: string
          category?: string
          category_id?: string
          created_at?: string
          delivery_mode?: string
          description?: string
          duration_minutes?: string
          id?: string
          is_free_intro?: string
          is_published?: string
          price?: string
          price_rand?: string
          provider_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      signup_attempts: {
        Row: {
          client_ip: string
          created_at: string
          email: string
          id: string
          outcome: string
          phone: string
          reason: string
          user_agent: string
        }
        Insert: {
          client_ip?: string
          created_at: string
          email?: string
          id: string
          outcome: string
          phone?: string
          reason?: string
          user_agent?: string
        }
        Update: {
          client_ip?: string
          created_at?: string
          email?: string
          id?: string
          outcome?: string
          phone?: string
          reason?: string
          user_agent?: string
        }
        Relationships: []
      }
      sleep_log: {
        Row: {
          bed_time: string
          created_at: string
          date: string
          hours: string
          id: string
          notes: string
          quality: string
          user_id: string
          wake_time: string
        }
        Insert: {
          bed_time?: string
          created_at?: string
          date: string
          hours?: string
          id: string
          notes?: string
          quality?: string
          user_id: string
          wake_time?: string
        }
        Update: {
          bed_time?: string
          created_at?: string
          date?: string
          hours?: string
          id?: string
          notes?: string
          quality?: string
          user_id?: string
          wake_time?: string
        }
        Relationships: []
      }
      sleep_schedules: {
        Row: {
          alarm_enabled: string
          channels: string
          created_at: string
          enabled: string
          last_bedtime_nudge_at: string
          last_wake_nudge_at: string
          reminder_lead_min: string
          updated_at: string
          user_id: string
          weekday_bedtime: string
          weekday_wake: string
          weekend_bedtime: string
          weekend_wake: string
        }
        Insert: {
          alarm_enabled: string
          channels: string
          created_at: string
          enabled: string
          last_bedtime_nudge_at?: string
          last_wake_nudge_at?: string
          reminder_lead_min: string
          updated_at: string
          user_id: string
          weekday_bedtime: string
          weekday_wake: string
          weekend_bedtime: string
          weekend_wake: string
        }
        Update: {
          alarm_enabled?: string
          channels?: string
          created_at?: string
          enabled?: string
          last_bedtime_nudge_at?: string
          last_wake_nudge_at?: string
          reminder_lead_min?: string
          updated_at?: string
          user_id?: string
          weekday_bedtime?: string
          weekday_wake?: string
          weekend_bedtime?: string
          weekend_wake?: string
        }
        Relationships: []
      }
      social_accounts: {
        Row: {
          access_token: string
          created_at: string
          handle: string
          id: string
          is_active: string
          last_posted_at: string
          platform: string
          refresh_token: string
          token_expires_at: string
        }
        Insert: {
          access_token?: string
          created_at?: string
          handle: string
          id: string
          is_active?: string
          last_posted_at?: string
          platform: string
          refresh_token?: string
          token_expires_at?: string
        }
        Update: {
          access_token?: string
          created_at?: string
          handle?: string
          id?: string
          is_active?: string
          last_posted_at?: string
          platform?: string
          refresh_token?: string
          token_expires_at?: string
        }
        Relationships: []
      }
      specialty_scope_defaults: {
        Row: {
          category: string
          default_scopes: string
          notes: string
          specialty_code: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          category: string
          default_scopes?: string
          notes?: string
          specialty_code: string
          updated_at: string
          updated_by?: string
        }
        Update: {
          category?: string
          default_scopes?: string
          notes?: string
          specialty_code?: string
          updated_at?: string
          updated_by?: string
        }
        Relationships: []
      }
      sponsored_rewards: {
        Row: {
          admin_review_notes: string
          admin_reviewed_at: string
          b_review_notes: string
          b_review_status: string
          b_reviewed_at: string
          b_risk_score: string
          created_at: string
          description: string
          digital_code: string
          id: string
          image_url: string
          milestone_tier: string
          points_cost: string
          published: string
          requires_streak_days: string
          reward_type: string
          shipping_required: string
          sponsor_id: string
          stock_qty: string
          stock_remaining: string
          title: string
        }
        Insert: {
          admin_review_notes?: string
          admin_reviewed_at?: string
          b_review_notes?: string
          b_review_status?: string
          b_reviewed_at?: string
          b_risk_score?: string
          created_at?: string
          description?: string
          digital_code?: string
          id: string
          image_url?: string
          milestone_tier?: string
          points_cost?: string
          published?: string
          requires_streak_days?: string
          reward_type: string
          shipping_required?: string
          sponsor_id: string
          stock_qty: string
          stock_remaining: string
          title: string
        }
        Update: {
          admin_review_notes?: string
          admin_reviewed_at?: string
          b_review_notes?: string
          b_review_status?: string
          b_reviewed_at?: string
          b_risk_score?: string
          created_at?: string
          description?: string
          digital_code?: string
          id?: string
          image_url?: string
          milestone_tier?: string
          points_cost?: string
          published?: string
          requires_streak_days?: string
          reward_type?: string
          shipping_required?: string
          sponsor_id?: string
          stock_qty?: string
          stock_remaining?: string
          title?: string
        }
        Relationships: []
      }
      sponsors: {
        Row: {
          active_from: string
          active_until: string
          admin_review_notes: string
          admin_reviewed_at: string
          admin_reviewed_by: string
          b_review_notes: string
          b_review_status: string
          b_reviewed_at: string
          b_risk_score: string
          company_name: string
          contact_email: string
          contact_phone: string
          created_at: string
          id: string
          logo_url: string
          monthly_spend_rand: string
          status: string
          tier: string
        }
        Insert: {
          active_from?: string
          active_until?: string
          admin_review_notes?: string
          admin_reviewed_at?: string
          admin_reviewed_by?: string
          b_review_notes?: string
          b_review_status?: string
          b_reviewed_at?: string
          b_risk_score?: string
          company_name: string
          contact_email: string
          contact_phone?: string
          created_at?: string
          id: string
          logo_url?: string
          monthly_spend_rand: string
          status: string
          tier: string
        }
        Update: {
          active_from?: string
          active_until?: string
          admin_review_notes?: string
          admin_reviewed_at?: string
          admin_reviewed_by?: string
          b_review_notes?: string
          b_review_status?: string
          b_reviewed_at?: string
          b_risk_score?: string
          company_name?: string
          contact_email?: string
          contact_phone?: string
          created_at?: string
          id?: string
          logo_url?: string
          monthly_spend_rand?: string
          status?: string
          tier?: string
        }
        Relationships: []
      }
      spotlight_purchases: {
        Row: {
          created_at: string
          duration: string
          ends_at: string
          id: string
          payment_status: string
          position: string
          price_rand: string
          provider_id: string
          starts_at: string
        }
        Insert: {
          created_at?: string
          duration: string
          ends_at: string
          id: string
          payment_status?: string
          position?: string
          price_rand: string
          provider_id: string
          starts_at?: string
        }
        Update: {
          created_at?: string
          duration?: string
          ends_at?: string
          id?: string
          payment_status?: string
          position?: string
          price_rand?: string
          provider_id?: string
          starts_at?: string
        }
        Relationships: []
      }
      subscription_invoices: {
        Row: {
          amount_rand: string
          client_referral_commission_rand: string
          client_referral_credited: string
          created_at: string
          failed_at: string
          id: string
          paid_at: string
          paystack_reference: string
          period_end: string
          period_start: string
          profile_id: string
          ranger_commission_credited: string
          ranger_commission_rand: string
          status: string
          subscription_id: string
        }
        Insert: {
          amount_rand: string
          client_referral_commission_rand?: string
          client_referral_credited: string
          created_at: string
          failed_at?: string
          id: string
          paid_at?: string
          paystack_reference?: string
          period_end?: string
          period_start?: string
          profile_id: string
          ranger_commission_credited: string
          ranger_commission_rand?: string
          status: string
          subscription_id: string
        }
        Update: {
          amount_rand?: string
          client_referral_commission_rand?: string
          client_referral_credited?: string
          created_at?: string
          failed_at?: string
          id?: string
          paid_at?: string
          paystack_reference?: string
          period_end?: string
          period_start?: string
          profile_id?: string
          ranger_commission_credited?: string
          ranger_commission_rand?: string
          status?: string
          subscription_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          amount_rand: string
          billing_interval: string
          cancelled_at: string
          created_at: string
          current_period_end: string
          current_period_start: string
          id: string
          next_billing_at: string
          paystack_customer_code: string
          paystack_email_token: string
          paystack_plan_code: string
          paystack_subscription_code: string
          profile_id: string
          renewal_notice_sent_at: string
          role_at_signup: string
          status: string
          tier: string
          updated_at: string
        }
        Insert: {
          amount_rand: string
          billing_interval: string
          cancelled_at?: string
          created_at: string
          current_period_end?: string
          current_period_start?: string
          id: string
          next_billing_at?: string
          paystack_customer_code?: string
          paystack_email_token?: string
          paystack_plan_code: string
          paystack_subscription_code?: string
          profile_id: string
          renewal_notice_sent_at?: string
          role_at_signup: string
          status: string
          tier: string
          updated_at: string
        }
        Update: {
          amount_rand?: string
          billing_interval?: string
          cancelled_at?: string
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          id?: string
          next_billing_at?: string
          paystack_customer_code?: string
          paystack_email_token?: string
          paystack_plan_code?: string
          paystack_subscription_code?: string
          profile_id?: string
          renewal_notice_sent_at?: string
          role_at_signup?: string
          status?: string
          tier?: string
          updated_at?: string
        }
        Relationships: []
      }
      support_ticket_replies: {
        Row: {
          attachments: string
          author_kind: string
          author_profile_id: string
          body: string
          created_at: string
          id: string
          ticket_id: string
        }
        Insert: {
          attachments: string
          author_kind: string
          author_profile_id?: string
          body: string
          created_at: string
          id: string
          ticket_id: string
        }
        Update: {
          attachments?: string
          author_kind?: string
          author_profile_id?: string
          body?: string
          created_at?: string
          id?: string
          ticket_id?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          assigned_to: string
          attachments: string
          body: string
          category: string
          created_at: string
          first_response_at: string
          id: string
          priority: string
          resolution_note: string
          resolved_at: string
          status: string
          subject: string
          submitter_email: string
          submitter_name: string
          submitter_phone: string
          submitter_profile_id: string
          ticket_number: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string
          attachments: string
          body: string
          category: string
          created_at: string
          first_response_at?: string
          id: string
          priority: string
          resolution_note?: string
          resolved_at?: string
          status: string
          subject: string
          submitter_email: string
          submitter_name?: string
          submitter_phone?: string
          submitter_profile_id?: string
          ticket_number: string
          updated_at: string
        }
        Update: {
          assigned_to?: string
          attachments?: string
          body?: string
          category?: string
          created_at?: string
          first_response_at?: string
          id?: string
          priority?: string
          resolution_note?: string
          resolved_at?: string
          status?: string
          subject?: string
          submitter_email?: string
          submitter_name?: string
          submitter_phone?: string
          submitter_profile_id?: string
          ticket_number?: string
          updated_at?: string
        }
        Relationships: []
      }
      terms_acceptances: {
        Row: {
          accepted_at: string
          id: string
          ip_address: string
          terms_version: string
          user_id: string
        }
        Insert: {
          accepted_at?: string
          id: string
          ip_address?: string
          terms_version: string
          user_id: string
        }
        Update: {
          accepted_at?: string
          id?: string
          ip_address?: string
          terms_version?: string
          user_id?: string
        }
        Relationships: []
      }
      treatment_plan_checkins: {
        Row: {
          checked_at: string
          client_id: string
          id: string
          item_id: string
          notes: string
          plan_id: string
        }
        Insert: {
          checked_at: string
          client_id: string
          id: string
          item_id: string
          notes?: string
          plan_id: string
        }
        Update: {
          checked_at?: string
          client_id?: string
          id?: string
          item_id?: string
          notes?: string
          plan_id?: string
        }
        Relationships: []
      }
      treatment_plan_items: {
        Row: {
          created_at: string
          duration: string
          frequency: string
          id: string
          instruction: string
          notes: string
          plan_id: string
          sort_order: string
          type: string
        }
        Insert: {
          created_at: string
          duration?: string
          frequency?: string
          id: string
          instruction: string
          notes?: string
          plan_id: string
          sort_order: string
          type: string
        }
        Update: {
          created_at?: string
          duration?: string
          frequency?: string
          id?: string
          instruction?: string
          notes?: string
          plan_id?: string
          sort_order?: string
          type?: string
        }
        Relationships: []
      }
      treatment_plans: {
        Row: {
          client_id: string
          created_at: string
          description: string
          end_date: string
          id: string
          provider_id: string
          review_date: string
          start_date: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at: string
          description?: string
          end_date?: string
          id: string
          provider_id: string
          review_date?: string
          start_date: string
          status: string
          title: string
          updated_at: string
        }
        Update: {
          client_id?: string
          created_at?: string
          description?: string
          end_date?: string
          id?: string
          provider_id?: string
          review_date?: string
          start_date?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      unified_audit_trail: {
        Row: {
          actor: string
          actor_email: string
          created_at: string
          event_type: string
          id: string
          ip_address: string
          payload: string
          source: string
          target_id: string
          target_type: string
        }
        Insert: {
          actor?: string
          actor_email?: string
          created_at?: string
          event_type?: string
          id?: string
          ip_address?: string
          payload?: string
          source?: string
          target_id?: string
          target_type?: string
        }
        Update: {
          actor?: string
          actor_email?: string
          created_at?: string
          event_type?: string
          id?: string
          ip_address?: string
          payload?: string
          source?: string
          target_id?: string
          target_type?: string
        }
        Relationships: []
      }
      user_habit_profile: {
        Row: {
          articles_read: string
          bookings_completed: string
          bookings_started: string
          last_active_at: string
          most_viewed_providers: string
          page_views: string
          peak_active_hours: string
          profile_id: string
          provider_views: string
          tool_uses: string
          top_categories: string
          total_events: string
          updated_at: string
        }
        Insert: {
          articles_read: string
          bookings_completed: string
          bookings_started: string
          last_active_at?: string
          most_viewed_providers?: string
          page_views: string
          peak_active_hours?: string
          profile_id: string
          provider_views: string
          tool_uses: string
          top_categories?: string
          total_events: string
          updated_at: string
        }
        Update: {
          articles_read?: string
          bookings_completed?: string
          bookings_started?: string
          last_active_at?: string
          most_viewed_providers?: string
          page_views?: string
          peak_active_hours?: string
          profile_id?: string
          provider_views?: string
          tool_uses?: string
          top_categories?: string
          total_events?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_habits: {
        Row: {
          category: string
          created_at: string
          event_type: string
          id: string
          metadata: string
          profile_id: string
        }
        Insert: {
          category?: string
          created_at: string
          event_type: string
          id: string
          metadata?: string
          profile_id: string
        }
        Update: {
          category?: string
          created_at?: string
          event_type?: string
          id?: string
          metadata?: string
          profile_id?: string
        }
        Relationships: []
      }
      user_nudge_seen: {
        Row: {
          created_at: string
          dismissed: string
          feature_key: string
          id: string
          seen_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dismissed?: string
          feature_key: string
          id: string
          seen_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          dismissed?: string
          feature_key?: string
          id?: string
          seen_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_onboarding_progress: {
        Row: {
          completed_at: string
          created_at: string
          data: string
          id: string
          layer: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          created_at?: string
          data?: string
          id: string
          layer: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string
          created_at?: string
          data?: string
          id?: string
          layer?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      user_streaks: {
        Row: {
          created_at: string
          current_streak: string
          id: string
          last_activity_date: string
          longest_streak: string
          streak_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at: string
          current_streak?: string
          id: string
          last_activity_date?: string
          longest_streak?: string
          streak_type: string
          updated_at: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_streak?: string
          id?: string
          last_activity_date?: string
          longest_streak?: string
          streak_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      voucher_redemption_attempts: {
        Row: {
          attempted_at: string
          booking_id: string
          denial_detail: string
          id: string
          ip: string
          outcome: string
          redeemer_profile_id: string
          target_provider_id: string
          user_agent: string
          voucher_id: string
        }
        Insert: {
          attempted_at: string
          booking_id?: string
          denial_detail?: string
          id: string
          ip?: string
          outcome: string
          redeemer_profile_id: string
          target_provider_id: string
          user_agent?: string
          voucher_id?: string
        }
        Update: {
          attempted_at?: string
          booking_id?: string
          denial_detail?: string
          id?: string
          ip?: string
          outcome?: string
          redeemer_profile_id?: string
          target_provider_id?: string
          user_agent?: string
          voucher_id?: string
        }
        Relationships: []
      }
      voucher_wallet: {
        Row: {
          amount_rand: string
          created_at: string
          expires_at: string
          id: string
          redeemed_at: string
          redeemed_booking_id: string
          related_booking_id: string
          source: string
          user_id: string
        }
        Insert: {
          amount_rand: string
          created_at?: string
          expires_at: string
          id: string
          redeemed_at?: string
          redeemed_booking_id?: string
          related_booking_id?: string
          source: string
          user_id: string
        }
        Update: {
          amount_rand?: string
          created_at?: string
          expires_at?: string
          id?: string
          redeemed_at?: string
          redeemed_booking_id?: string
          related_booking_id?: string
          source?: string
          user_id?: string
        }
        Relationships: []
      }
      vouchers: {
        Row: {
          earmarked_provider_id: string
          expires_at: string
          face_value_rand: string
          holder_profile_id: string
          id: string
          issued_at: string
          redeemed_at: string
          redeemed_booking_id: string
          void_reason: string
        }
        Insert: {
          earmarked_provider_id?: string
          expires_at: string
          face_value_rand: string
          holder_profile_id: string
          id: string
          issued_at: string
          redeemed_at?: string
          redeemed_booking_id?: string
          void_reason?: string
        }
        Update: {
          earmarked_provider_id?: string
          expires_at?: string
          face_value_rand?: string
          holder_profile_id?: string
          id?: string
          issued_at?: string
          redeemed_at?: string
          redeemed_booking_id?: string
          void_reason?: string
        }
        Relationships: []
      }
      wallet_balances: {
        Row: {
          balance: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance: string
          updated_at: string
          user_id: string
        }
        Update: {
          balance?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount_rand: string
          balance_after: string
          created_at: string
          description: string
          id: string
          paystack_ref: string
          reference_id: string
          source_role: string
          status: string
          type: string
          user_id: string
        }
        Insert: {
          amount_rand: string
          balance_after?: string
          created_at?: string
          description?: string
          id: string
          paystack_ref?: string
          reference_id?: string
          source_role?: string
          status: string
          type: string
          user_id: string
        }
        Update: {
          amount_rand?: string
          balance_after?: string
          created_at?: string
          description?: string
          id?: string
          paystack_ref?: string
          reference_id?: string
          source_role?: string
          status?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      water_log: {
        Row: {
          count: string
          date: string
          id: string
          user_id: string
        }
        Insert: {
          count: string
          date: string
          id: string
          user_id: string
        }
        Update: {
          count?: string
          date?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_budget_counters: {
        Row: {
          cost_usd: string
          count: string
          period: string
          updated_at: string
        }
        Insert: {
          cost_usd: string
          count: string
          period: string
          updated_at: string
        }
        Update: {
          cost_usd?: string
          count?: string
          period?: string
          updated_at?: string
        }
        Relationships: []
      }
      whatsapp_messages: {
        Row: {
          content: string
          created_at: string
          direction: string
          id: string
          meta: string
          phone: string
        }
        Insert: {
          content: string
          created_at: string
          direction: string
          id: string
          meta?: string
          phone: string
        }
        Update: {
          content?: string
          created_at?: string
          direction?: string
          id?: string
          meta?: string
          phone?: string
        }
        Relationships: []
      }
      whatsapp_outbound_daily: {
        Row: {
          phone: string
          sent_count: string
          sent_date: string
          updated_at: string
        }
        Insert: {
          phone: string
          sent_count: string
          sent_date: string
          updated_at: string
        }
        Update: {
          phone?: string
          sent_count?: string
          sent_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      whatsapp_threads: {
        Row: {
          in_count: string
          last_direction: string
          last_message: string
          last_message_at: string
          message_count: string
          out_count: string
          phone: string
        }
        Insert: {
          in_count?: string
          last_direction?: string
          last_message?: string
          last_message_at?: string
          message_count?: string
          out_count?: string
          phone?: string
        }
        Update: {
          in_count?: string
          last_direction?: string
          last_message?: string
          last_message_at?: string
          message_count?: string
          out_count?: string
          phone?: string
        }
        Relationships: []
      }
      withdrawal_requests: {
        Row: {
          bank_account_name: string
          bank_account_number: string
          bank_name: string
          branch_code: string
          failure_reason: string
          fee_rand: string
          id: string
          net_amount_rand: string
          paystack_transfer_code: string
          processed_at: string
          requested_amount_rand: string
          requested_at: string
          source: string
          status: string
          user_id: string
        }
        Insert: {
          bank_account_name: string
          bank_account_number: string
          bank_name: string
          branch_code?: string
          failure_reason?: string
          fee_rand: string
          id: string
          net_amount_rand: string
          paystack_transfer_code?: string
          processed_at?: string
          requested_amount_rand: string
          requested_at?: string
          source: string
          status: string
          user_id: string
        }
        Update: {
          bank_account_name?: string
          bank_account_number?: string
          bank_name?: string
          branch_code?: string
          failure_reason?: string
          fee_rand?: string
          id?: string
          net_amount_rand?: string
          paystack_transfer_code?: string
          processed_at?: string
          requested_amount_rand?: string
          requested_at?: string
          source?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      _caller_can_act_on: {
        Args: {
          p_user_id: string
        }
        Returns: any
      }
      accrue_referral_commissions_current_month: {
        Args: {
        }
        Returns: any
      }
      accrue_referral_commissions_for_month: {
        Args: {
        }
        Returns: any
      }
      boost_marketing_levy: {
        Args: {
        }
        Returns: any
      }
      calculate_delivery_cost: {
        Args: {
          p_zone: string
          p_weight_grams: string
          p_largest_side_cm: string
        }
        Returns: any
      }
      chat_usage_increment: {
        Args: {
        }
        Returns: any
      }
      check_and_award_ranger_status: {
        Args: {
        }
        Returns: any
      }
      claim_acquisition_voucher: {
        Args: {
        }
        Returns: any
      }
      corporate_recent_activity: {
        Args: {
        }
        Returns: any
      }
      corporate_spend_buckets: {
        Args: {
        }
        Returns: any
      }
      corporate_spend_by_vertical: {
        Args: {
        }
        Returns: any
      }
      corporate_top_providers: {
        Args: {
        }
        Returns: any
      }
      eligible_acquisition_vouchers: {
        Args: {
        }
        Returns: any
      }
      generate_bion_id: {
        Args: {
        }
        Returns: any
      }
      get_subscription_tier: {
        Args: {
        }
        Returns: any
      }
      group_booking_reserve_seat: {
        Args: {
        }
        Returns: any
      }
      has_role: {
        Args: {
          _user_id: string
          _role: string
        }
        Returns: any
      }
      haversine_km: {
        Args: {
          lat1: string
          lng1: string
          lat2: string
          lng2: string
        }
        Returns: any
      }
      is_admin: {
        Args: {
        }
        Returns: any
      }
      places_api_increment: {
        Args: {
        }
        Returns: any
      }
      provider_can_have_storefront: {
        Args: {
          p_provider_id: string
        }
        Returns: any
      }
      raise_dispute: {
        Args: {
        }
        Returns: any
      }
      redeem_acquisition_voucher: {
        Args: {
        }
        Returns: any
      }
      refresh_user_habit_profile: {
        Args: {
        }
        Returns: any
      }
      resolve_dispute: {
        Args: {
        }
        Returns: any
      }
      search_providers: {
        Args: {
          p_query: string
          p_category: string
          p_city: string
          p_limit: string
        }
        Returns: any
      }
      submit_provider_dispute_response: {
        Args: {
        }
        Returns: any
      }
      upsert_monthly_spend: {
        Args: {
        }
        Returns: any
      }
      wallet_apply_delta: {
        Args: {
        }
        Returns: any
      }
      whatsapp_budget_increment: {
        Args: {
        }
        Returns: any
      }
    }
    Enums: {
      app_role: "admin" | "provider" | "client"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

