export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      capi_secrets: {
        Row: {
          access_token: string | null
          id: string
          updated_at: string
        }
        Insert: {
          access_token?: string | null
          id?: string
          updated_at?: string
        }
        Update: {
          access_token?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          id: string
          image: string
          is_active: boolean
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          image: string
          is_active?: boolean
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          image?: string
          is_active?: boolean
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      checkout_leads: {
        Row: {
          address: string | null
          city: string | null
          converted_order_id: string | null
          country: string | null
          created_at: string
          currency_code: string
          customer_name: string | null
          email: string | null
          id: string
          items: Json
          last_activity_at: string
          lead_no: string
          lead_token: string
          notes: string | null
          page_url: string | null
          phone: string
          shipping_fee: number
          source: string
          status: string
          subtotal: number
          total: number
          updated_at: string
          user_agent: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          converted_order_id?: string | null
          country?: string | null
          created_at?: string
          currency_code?: string
          customer_name?: string | null
          email?: string | null
          id?: string
          items?: Json
          last_activity_at?: string
          lead_no: string
          lead_token?: string
          notes?: string | null
          page_url?: string | null
          phone: string
          shipping_fee?: number
          source?: string
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          converted_order_id?: string | null
          country?: string | null
          created_at?: string
          currency_code?: string
          customer_name?: string | null
          email?: string | null
          id?: string
          items?: Json
          last_activity_at?: string
          lead_no?: string
          lead_token?: string
          notes?: string | null
          page_url?: string | null
          phone?: string
          shipping_fee?: number
          source?: string
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checkout_leads_converted_order_id_fkey"
            columns: ["converted_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          description: string | null
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number | null
          min_order_amount: number
          starts_at: string
          updated_at: string
          used_count: number
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_order_amount?: number
          starts_at?: string
          updated_at?: string
          used_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_order_amount?: number
          starts_at?: string
          updated_at?: string
          used_count?: number
        }
        Relationships: []
      }
      courier_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          message: string | null
          order_id: string | null
          provider: string
          request_payload: Json | null
          response_payload: Json | null
          status: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          message?: string | null
          order_id?: string | null
          provider: string
          request_payload?: Json | null
          response_payload?: Json | null
          status?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          message?: string | null
          order_id?: string | null
          provider?: string
          request_payload?: Json | null
          response_payload?: Json | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "courier_logs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      courier_settings: {
        Row: {
          api_base_url: string | null
          api_key: string | null
          api_secret: string | null
          cod_enabled: boolean | null
          created_at: string | null
          default_weight: number | null
          enabled: boolean | null
          id: string
          merchant_id: string | null
          pickup_address: string | null
          pickup_phone: string | null
          provider: string
          show_tracking_to_customer: boolean | null
          updated_at: string | null
        }
        Insert: {
          api_base_url?: string | null
          api_key?: string | null
          api_secret?: string | null
          cod_enabled?: boolean | null
          created_at?: string | null
          default_weight?: number | null
          enabled?: boolean | null
          id?: string
          merchant_id?: string | null
          pickup_address?: string | null
          pickup_phone?: string | null
          provider: string
          show_tracking_to_customer?: boolean | null
          updated_at?: string | null
        }
        Update: {
          api_base_url?: string | null
          api_key?: string | null
          api_secret?: string | null
          cod_enabled?: boolean | null
          created_at?: string | null
          default_weight?: number | null
          enabled?: boolean | null
          id?: string
          merchant_id?: string | null
          pickup_address?: string | null
          pickup_phone?: string | null
          provider?: string
          show_tracking_to_customer?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      customer_courier_history: {
        Row: {
          cache_expire_at: string
          cancelled_count: number
          created_at: string
          delivered_count: number
          id: string
          in_transit_count: number
          last_checked_at: string
          last_delivery_date: string | null
          last_status: string | null
          phone: string
          recent_parcels: Json
          return_rate: number
          returned_count: number
          source: string
          success_rate: number
          total_parcels: number
          updated_at: string
        }
        Insert: {
          cache_expire_at?: string
          cancelled_count?: number
          created_at?: string
          delivered_count?: number
          id?: string
          in_transit_count?: number
          last_checked_at?: string
          last_delivery_date?: string | null
          last_status?: string | null
          phone: string
          recent_parcels?: Json
          return_rate?: number
          returned_count?: number
          source?: string
          success_rate?: number
          total_parcels?: number
          updated_at?: string
        }
        Update: {
          cache_expire_at?: string
          cancelled_count?: number
          created_at?: string
          delivered_count?: number
          id?: string
          in_transit_count?: number
          last_checked_at?: string
          last_delivery_date?: string | null
          last_status?: string | null
          phone?: string
          recent_parcels?: Json
          return_rate?: number
          returned_count?: number
          source?: string
          success_rate?: number
          total_parcels?: number
          updated_at?: string
        }
        Relationships: []
      }
      homepage_banners: {
        Row: {
          alt_text: string | null
          created_at: string
          id: string
          image: string
          is_active: boolean
          link: string | null
          sort_order: number
          template_id: string
          updated_at: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          id?: string
          image?: string
          is_active?: boolean
          link?: string | null
          sort_order?: number
          template_id: string
          updated_at?: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          id?: string
          image?: string
          is_active?: boolean
          link?: string | null
          sort_order?: number
          template_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "homepage_banners_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "homepage_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      homepage_sections: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          layout_style: string
          product_source: string | null
          product_source_value: string | null
          section_type: string
          settings_json: Json
          sort_order: number
          subtitle: string | null
          template_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          layout_style?: string
          product_source?: string | null
          product_source_value?: string | null
          section_type: string
          settings_json?: Json
          sort_order?: number
          subtitle?: string | null
          template_id: string
          title?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          layout_style?: string
          product_source?: string | null
          product_source_value?: string | null
          section_type?: string
          settings_json?: Json
          sort_order?: number
          subtitle?: string | null
          template_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "homepage_sections_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "homepage_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      homepage_templates: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          label: string
          name: string
          preview_image: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          label: string
          name: string
          preview_image?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string
          name?: string
          preview_image?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      landing_pages: {
        Row: {
          created_at: string
          hero_cta_text: string
          hero_image: string | null
          hero_subtitle: string | null
          hero_title: string
          how_to_use_cards: Json
          id: string
          is_active: boolean
          product_ids: string[]
          show_reviews: boolean
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          hero_cta_text?: string
          hero_image?: string | null
          hero_subtitle?: string | null
          hero_title?: string
          how_to_use_cards?: Json
          id?: string
          is_active?: boolean
          product_ids?: string[]
          show_reviews?: boolean
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          hero_cta_text?: string
          hero_image?: string | null
          hero_subtitle?: string | null
          hero_title?: string
          how_to_use_cards?: Json
          id?: string
          is_active?: boolean
          product_ids?: string[]
          show_reviews?: boolean
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          line_total: number | null
          order_id: string
          price: number
          product_id: string | null
          product_image: string | null
          product_name: string
          quantity: number
          variant_id: string | null
          variant_info: Json | null
        }
        Insert: {
          created_at?: string
          id?: string
          line_total?: number | null
          order_id: string
          price: number
          product_id?: string | null
          product_image?: string | null
          product_name: string
          quantity: number
          variant_id?: string | null
          variant_info?: Json | null
        }
        Update: {
          created_at?: string
          id?: string
          line_total?: number | null
          order_id?: string
          price?: number
          product_id?: string | null
          product_image?: string | null
          product_name?: string
          quantity?: number
          variant_id?: string | null
          variant_info?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          courier_consignment_id: string | null
          courier_created_at: string | null
          courier_payload: Json | null
          courier_provider: string | null
          courier_reference: string | null
          courier_response: Json | null
          courier_status: string | null
          courier_tracking_id: string | null
          courier_updated_at: string | null
          created_at: string
          customer_email: string | null
          customer_name: string
          customer_phone: string
          due_amount: number
          fb_purchase_sent: boolean
          id: string
          notes: string | null
          order_number: string
          paid_amount: number
          partial_rule_snapshot: Json | null
          payment_method: string
          payment_method_id: string | null
          payment_method_name: string | null
          payment_status: string
          shipping_address: string
          shipping_city: string
          shipping_cost: number
          shipping_method: string
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          total: number
          transaction_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          courier_consignment_id?: string | null
          courier_created_at?: string | null
          courier_payload?: Json | null
          courier_provider?: string | null
          courier_reference?: string | null
          courier_response?: Json | null
          courier_status?: string | null
          courier_tracking_id?: string | null
          courier_updated_at?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name: string
          customer_phone: string
          due_amount?: number
          fb_purchase_sent?: boolean
          id?: string
          notes?: string | null
          order_number: string
          paid_amount?: number
          partial_rule_snapshot?: Json | null
          payment_method?: string
          payment_method_id?: string | null
          payment_method_name?: string | null
          payment_status?: string
          shipping_address: string
          shipping_city: string
          shipping_cost: number
          shipping_method: string
          status?: Database["public"]["Enums"]["order_status"]
          subtotal: number
          total: number
          transaction_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          courier_consignment_id?: string | null
          courier_created_at?: string | null
          courier_payload?: Json | null
          courier_provider?: string | null
          courier_reference?: string | null
          courier_response?: Json | null
          courier_status?: string | null
          courier_tracking_id?: string | null
          courier_updated_at?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string
          due_amount?: number
          fb_purchase_sent?: boolean
          id?: string
          notes?: string | null
          order_number?: string
          paid_amount?: number
          partial_rule_snapshot?: Json | null
          payment_method?: string
          payment_method_id?: string | null
          payment_method_name?: string | null
          payment_status?: string
          shipping_address?: string
          shipping_city?: string
          shipping_cost?: number
          shipping_method?: string
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          total?: number
          transaction_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          allow_partial_delivery_payment: boolean
          code: string
          created_at: string
          description: string | null
          fixed_partial_amount: number | null
          id: string
          instructions: string | null
          is_enabled: boolean
          name: string
          partial_type: string | null
          provider_fields: Json | null
          require_transaction_id: boolean
          sort_order: number
          updated_at: string
        }
        Insert: {
          allow_partial_delivery_payment?: boolean
          code: string
          created_at?: string
          description?: string | null
          fixed_partial_amount?: number | null
          id?: string
          instructions?: string | null
          is_enabled?: boolean
          name: string
          partial_type?: string | null
          provider_fields?: Json | null
          require_transaction_id?: boolean
          sort_order?: number
          updated_at?: string
        }
        Update: {
          allow_partial_delivery_payment?: boolean
          code?: string
          created_at?: string
          description?: string | null
          fixed_partial_amount?: number | null
          id?: string
          instructions?: string | null
          is_enabled?: boolean
          name?: string
          partial_type?: string | null
          provider_fields?: Json | null
          require_transaction_id?: boolean
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      product_variants: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          price_adjustment: number | null
          product_id: string
          size: string | null
          sku: string
          stock: number
          updated_at: string | null
          variant_price: number | null
          variant_sale_price: number | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          price_adjustment?: number | null
          product_id: string
          size?: string | null
          sku: string
          stock?: number
          updated_at?: string | null
          variant_price?: number | null
          variant_sale_price?: number | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          price_adjustment?: number | null
          product_id?: string
          size?: string | null
          sku?: string
          stock?: number
          updated_at?: string | null
          variant_price?: number | null
          variant_sale_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string | null
          created_at: string
          description: string | null
          hide_stock: boolean
          id: string
          images: string[]
          is_active: boolean
          is_best_seller: boolean | null
          is_featured: boolean | null
          is_new: boolean | null
          is_variable: boolean
          name: string
          price: number
          sale_price: number | null
          short_description: string | null
          sku: string
          slug: string
          specifications: Json | null
          stock: number
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          hide_stock?: boolean
          id?: string
          images?: string[]
          is_active?: boolean
          is_best_seller?: boolean | null
          is_featured?: boolean | null
          is_new?: boolean | null
          is_variable?: boolean
          name: string
          price: number
          sale_price?: number | null
          short_description?: string | null
          sku: string
          slug: string
          specifications?: Json | null
          stock?: number
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          hide_stock?: boolean
          id?: string
          images?: string[]
          is_active?: boolean
          is_best_seller?: boolean | null
          is_featured?: boolean | null
          is_new?: boolean | null
          is_variable?: boolean
          name?: string
          price?: number
          sale_price?: number | null
          short_description?: string | null
          sku?: string
          slug?: string
          specifications?: Json | null
          stock?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_active: boolean
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          created_at: string
          id: string
          is_approved: boolean | null
          name: string
          rating: number
          text: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_approved?: boolean | null
          name: string
          rating: number
          text: string
        }
        Update: {
          created_at?: string
          id?: string
          is_approved?: boolean | null
          name?: string
          rating?: number
          text?: string
        }
        Relationships: []
      }
      shipping_methods: {
        Row: {
          base_rate: number
          created_at: string
          description: string | null
          estimated_days: string | null
          id: string
          is_active: boolean
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          base_rate?: number
          created_at?: string
          description?: string | null
          estimated_days?: string | null
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          base_rate?: number
          created_at?: string
          description?: string | null
          estimated_days?: string | null
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          brand_accent: string | null
          brand_background: string | null
          brand_border: string | null
          brand_card: string | null
          brand_foreground: string | null
          brand_muted: string | null
          brand_primary: string | null
          brand_radius: string | null
          brand_secondary: string | null
          cookie_consent_enabled: boolean
          currency_code: string
          currency_locale: string
          currency_symbol: string
          default_country_code: string
          default_country_name: string
          fb_capi_api_version: string
          fb_capi_dataset_id: string | null
          fb_capi_enabled: boolean
          fb_capi_test_event_code: string | null
          fb_pixel_enabled: boolean
          fb_pixel_id: string | null
          fb_pixel_test_event_code: string | null
          id: string
          language: string
          show_stock_to_visitors: boolean
          theme_accent_color: string | null
          updated_at: string
        }
        Insert: {
          brand_accent?: string | null
          brand_background?: string | null
          brand_border?: string | null
          brand_card?: string | null
          brand_foreground?: string | null
          brand_muted?: string | null
          brand_primary?: string | null
          brand_radius?: string | null
          brand_secondary?: string | null
          cookie_consent_enabled?: boolean
          currency_code?: string
          currency_locale?: string
          currency_symbol?: string
          default_country_code?: string
          default_country_name?: string
          fb_capi_api_version?: string
          fb_capi_dataset_id?: string | null
          fb_capi_enabled?: boolean
          fb_capi_test_event_code?: string | null
          fb_pixel_enabled?: boolean
          fb_pixel_id?: string | null
          fb_pixel_test_event_code?: string | null
          id?: string
          language?: string
          show_stock_to_visitors?: boolean
          theme_accent_color?: string | null
          updated_at?: string
        }
        Update: {
          brand_accent?: string | null
          brand_background?: string | null
          brand_border?: string | null
          brand_card?: string | null
          brand_foreground?: string | null
          brand_muted?: string | null
          brand_primary?: string | null
          brand_radius?: string | null
          brand_secondary?: string | null
          cookie_consent_enabled?: boolean
          currency_code?: string
          currency_locale?: string
          currency_symbol?: string
          default_country_code?: string
          default_country_name?: string
          fb_capi_api_version?: string
          fb_capi_dataset_id?: string | null
          fb_capi_enabled?: boolean
          fb_capi_test_event_code?: string | null
          fb_pixel_enabled?: boolean
          fb_pixel_id?: string | null
          fb_pixel_test_event_code?: string | null
          id?: string
          language?: string
          show_stock_to_visitors?: boolean
          theme_accent_color?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      slider_slides: {
        Row: {
          created_at: string
          cta_link: string
          cta_text: string
          heading: string
          id: string
          image: string
          is_active: boolean | null
          sort_order: number
          text: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          cta_link: string
          cta_text: string
          heading: string
          id?: string
          image: string
          is_active?: boolean | null
          sort_order?: number
          text: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          cta_link?: string
          cta_text?: string
          heading?: string
          id?: string
          image?: string
          is_active?: boolean | null
          sort_order?: number
          text?: string
          updated_at?: string
        }
        Relationships: []
      }
      store_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wishlists: {
        Row: {
          created_at: string
          id: string
          product_id: string
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wishlists_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_manage_orders: { Args: { _user_id: string }; Returns: boolean }
      can_manage_products: { Args: { _user_id: string }; Returns: boolean }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_any_staff_role: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "customer" | "manager" | "order_handler"
      order_status:
        | "pending"
        | "confirmed"
        | "processing"
        | "shipped"
        | "delivered"
        | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "customer", "manager", "order_handler"],
      order_status: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ],
    },
  },
} as const
