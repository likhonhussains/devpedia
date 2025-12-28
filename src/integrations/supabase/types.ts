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
      badges: {
        Row: {
          created_at: string
          criteria_type: string
          criteria_value: number
          description: string
          icon: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          criteria_type: string
          criteria_value?: number
          description: string
          icon: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          criteria_type?: string
          criteria_value?: number
          description?: string
          icon?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          content: string
          created_at: string
          id: string
          likes_count: number
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          likes_count?: number
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          likes_count?: number
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          id: string
          joined_at: string
          last_read_at: string | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          joined_at?: string
          last_read_at?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          joined_at?: string
          last_read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          avatar_url: string | null
          created_at: string
          creator_id: string | null
          id: string
          is_group: boolean
          name: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          creator_id?: string | null
          id?: string
          is_group?: boolean
          name?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          creator_id?: string | null
          id?: string
          is_group?: boolean
          name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ebook_bookmarks: {
        Row: {
          created_at: string
          ebook_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          ebook_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          ebook_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ebook_bookmarks_ebook_id_fkey"
            columns: ["ebook_id"]
            isOneToOne: false
            referencedRelation: "ebooks"
            referencedColumns: ["id"]
          },
        ]
      }
      ebook_chapter_comments: {
        Row: {
          chapter_id: string
          content: string
          created_at: string
          id: string
          likes_count: number
          user_id: string
        }
        Insert: {
          chapter_id: string
          content: string
          created_at?: string
          id?: string
          likes_count?: number
          user_id: string
        }
        Update: {
          chapter_id?: string
          content?: string
          created_at?: string
          id?: string
          likes_count?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ebook_chapter_comments_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "ebook_chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      ebook_chapters: {
        Row: {
          chapter_order: number
          content: string
          created_at: string
          ebook_id: string
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          chapter_order?: number
          content: string
          created_at?: string
          ebook_id: string
          id?: string
          title: string
          updated_at?: string
        }
        Update: {
          chapter_order?: number
          content?: string
          created_at?: string
          ebook_id?: string
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ebook_chapters_ebook_id_fkey"
            columns: ["ebook_id"]
            isOneToOne: false
            referencedRelation: "ebooks"
            referencedColumns: ["id"]
          },
        ]
      }
      ebook_likes: {
        Row: {
          created_at: string
          ebook_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          ebook_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          ebook_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ebook_likes_ebook_id_fkey"
            columns: ["ebook_id"]
            isOneToOne: false
            referencedRelation: "ebooks"
            referencedColumns: ["id"]
          },
        ]
      }
      ebook_reviews: {
        Row: {
          content: string | null
          created_at: string
          ebook_id: string
          id: string
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          ebook_id: string
          id?: string
          rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          ebook_id?: string
          id?: string
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ebook_reviews_ebook_id_fkey"
            columns: ["ebook_id"]
            isOneToOne: false
            referencedRelation: "ebooks"
            referencedColumns: ["id"]
          },
        ]
      }
      ebooks: {
        Row: {
          average_rating: number | null
          cover_url: string | null
          created_at: string
          description: string | null
          genre: Database["public"]["Enums"]["ebook_genre"]
          id: string
          likes_count: number
          reviews_count: number
          status: Database["public"]["Enums"]["ebook_status"]
          title: string
          updated_at: string
          user_id: string
          views_count: number
        }
        Insert: {
          average_rating?: number | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          genre?: Database["public"]["Enums"]["ebook_genre"]
          id?: string
          likes_count?: number
          reviews_count?: number
          status?: Database["public"]["Enums"]["ebook_status"]
          title: string
          updated_at?: string
          user_id: string
          views_count?: number
        }
        Update: {
          average_rating?: number | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          genre?: Database["public"]["Enums"]["ebook_genre"]
          id?: string
          likes_count?: number
          reviews_count?: number
          status?: Database["public"]["Enums"]["ebook_status"]
          title?: string
          updated_at?: string
          user_id?: string
          views_count?: number
        }
        Relationships: []
      }
      followers: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      group_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          likes_count: number
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          likes_count?: number
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          likes_count?: number
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "group_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          role: Database["public"]["Enums"]["group_role"]
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["group_role"]
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["group_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "group_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      group_posts: {
        Row: {
          comments_count: number
          content: string
          created_at: string
          group_id: string
          id: string
          likes_count: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          comments_count?: number
          content: string
          created_at?: string
          group_id: string
          id?: string
          likes_count?: number
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          comments_count?: number
          content?: string
          created_at?: string
          group_id?: string
          id?: string
          likes_count?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_posts_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          avatar_url: string | null
          cover_url: string | null
          created_at: string
          creator_id: string
          description: string | null
          id: string
          members_count: number
          name: string
          posts_count: number
          privacy: Database["public"]["Enums"]["group_privacy"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          cover_url?: string | null
          created_at?: string
          creator_id: string
          description?: string | null
          id?: string
          members_count?: number
          name: string
          posts_count?: number
          privacy?: Database["public"]["Enums"]["group_privacy"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          cover_url?: string | null
          created_at?: string
          creator_id?: string
          description?: string | null
          id?: string
          members_count?: number
          name?: string
          posts_count?: number
          privacy?: Database["public"]["Enums"]["group_privacy"]
          updated_at?: string
        }
        Relationships: []
      }
      likes: {
        Row: {
          comment_id: string | null
          created_at: string
          id: string
          post_id: string | null
          user_id: string
        }
        Insert: {
          comment_id?: string | null
          created_at?: string
          id?: string
          post_id?: string | null
          user_id: string
        }
        Update: {
          comment_id?: string | null
          created_at?: string
          id?: string
          post_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachment_name: string | null
          attachment_type: string | null
          attachment_url: string | null
          content: string
          conversation_id: string
          created_at: string
          id: string
          read_at: string | null
          sender_id: string
        }
        Insert: {
          attachment_name?: string | null
          attachment_type?: string | null
          attachment_url?: string | null
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id: string
        }
        Update: {
          attachment_name?: string | null
          attachment_type?: string | null
          attachment_url?: string | null
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_id: string
          comment_id: string | null
          created_at: string
          id: string
          message_id: string | null
          post_id: string | null
          read_at: string | null
          type: string
          user_id: string
        }
        Insert: {
          actor_id: string
          comment_id?: string | null
          created_at?: string
          id?: string
          message_id?: string | null
          post_id?: string | null
          read_at?: string | null
          type: string
          user_id: string
        }
        Update: {
          actor_id?: string
          comment_id?: string | null
          created_at?: string
          id?: string
          message_id?: string | null
          post_id?: string | null
          read_at?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          category: string | null
          comments_count: number
          content: string
          created_at: string
          id: string
          likes_count: number
          status: string
          tags: string[] | null
          title: string
          type: string
          updated_at: string
          user_id: string
          video_url: string | null
        }
        Insert: {
          category?: string | null
          comments_count?: number
          content: string
          created_at?: string
          id?: string
          likes_count?: number
          status?: string
          tags?: string[] | null
          title: string
          type: string
          updated_at?: string
          user_id: string
          video_url?: string | null
        }
        Update: {
          category?: string | null
          comments_count?: number
          content?: string
          created_at?: string
          id?: string
          likes_count?: number
          status?: string
          tags?: string[] | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
          video_url?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          cover_url: string | null
          created_at: string
          display_name: string
          github: string | null
          id: string
          linkedin: string | null
          location: string | null
          twitter: string | null
          updated_at: string
          user_id: string
          username: string
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          cover_url?: string | null
          created_at?: string
          display_name: string
          github?: string | null
          id?: string
          linkedin?: string | null
          location?: string | null
          twitter?: string | null
          updated_at?: string
          user_id: string
          username: string
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          cover_url?: string | null
          created_at?: string
          display_name?: string
          github?: string | null
          id?: string
          linkedin?: string | null
          location?: string | null
          twitter?: string | null
          updated_at?: string
          user_id?: string
          username?: string
          website?: string | null
        }
        Relationships: []
      }
      reading_history: {
        Row: {
          id: string
          post_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          id?: string
          post_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          id?: string
          post_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reading_history_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_and_award_badges: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      decrement_ebook_likes: {
        Args: { p_ebook_id: string }
        Returns: undefined
      }
      decrement_group_members: {
        Args: { p_group_id: string }
        Returns: undefined
      }
      decrement_group_post_comments: {
        Args: { p_post_id: string }
        Returns: undefined
      }
      decrement_group_post_likes: {
        Args: { p_post_id: string }
        Returns: undefined
      }
      decrement_group_posts: {
        Args: { p_group_id: string }
        Returns: undefined
      }
      decrement_post_comments: {
        Args: { p_post_id: string }
        Returns: undefined
      }
      decrement_post_likes: { Args: { post_id: string }; Returns: undefined }
      increment_ebook_likes: {
        Args: { p_ebook_id: string }
        Returns: undefined
      }
      increment_ebook_views: {
        Args: { p_ebook_id: string }
        Returns: undefined
      }
      increment_group_members: {
        Args: { p_group_id: string }
        Returns: undefined
      }
      increment_group_post_comments: {
        Args: { p_post_id: string }
        Returns: undefined
      }
      increment_group_post_likes: {
        Args: { p_post_id: string }
        Returns: undefined
      }
      increment_group_posts: {
        Args: { p_group_id: string }
        Returns: undefined
      }
      increment_post_comments: {
        Args: { p_post_id: string }
        Returns: undefined
      }
      increment_post_likes: { Args: { post_id: string }; Returns: undefined }
      is_conversation_participant: {
        Args: { conv_id: string; uid: string }
        Returns: boolean
      }
      is_group_admin: {
        Args: { p_group_id: string; p_user_id: string }
        Returns: boolean
      }
      is_group_admin_or_moderator: {
        Args: { p_group_id: string; p_user_id: string }
        Returns: boolean
      }
      is_group_member: {
        Args: { p_group_id: string; p_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      ebook_genre:
        | "fiction"
        | "non_fiction"
        | "technology"
        | "science"
        | "self_help"
        | "business"
        | "biography"
        | "history"
        | "fantasy"
        | "mystery"
        | "romance"
        | "horror"
        | "poetry"
        | "education"
        | "other"
      ebook_status: "draft" | "published" | "archived"
      group_privacy: "public" | "private"
      group_role: "admin" | "moderator" | "member"
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
      ebook_genre: [
        "fiction",
        "non_fiction",
        "technology",
        "science",
        "self_help",
        "business",
        "biography",
        "history",
        "fantasy",
        "mystery",
        "romance",
        "horror",
        "poetry",
        "education",
        "other",
      ],
      ebook_status: ["draft", "published", "archived"],
      group_privacy: ["public", "private"],
      group_role: ["admin", "moderator", "member"],
    },
  },
} as const
