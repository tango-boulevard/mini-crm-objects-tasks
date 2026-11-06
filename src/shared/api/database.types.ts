export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type AppRole = 'manager' | 'executor';
export type TaskStatus = 'new' | 'in_progress' | 'in_review' | 'accepted' | 'needs_revision';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string;
          role: AppRole;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name: string;
          role: AppRole;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          display_name?: string;
          role?: AppRole;
          is_active?: boolean;
        };
        Relationships: [];
      };
      construction_objects: {
        Row: {
          id: string;
          name: string;
          address: string;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          address: string;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          address?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'construction_objects_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      tasks: {
        Row: {
          id: string;
          object_id: string;
          title: string;
          description: string;
          assignee_id: string;
          status: TaskStatus;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          object_id: string;
          title: string;
          description: string;
          assignee_id: string;
          status?: TaskStatus;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          object_id?: string;
          title?: string;
          description?: string;
          assignee_id?: string;
          status?: TaskStatus;
        };
        Relationships: [
          {
            foreignKeyName: 'tasks_object_id_fkey';
            columns: ['object_id'];
            isOneToOne: false;
            referencedRelation: 'construction_objects';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tasks_assignee_id_fkey';
            columns: ['assignee_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tasks_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      task_status_history: {
        Row: {
          id: number;
          task_id: string;
          from_status: TaskStatus | null;
          to_status: TaskStatus;
          changed_by: string;
          changed_at: string;
          comment: string | null;
        };
        Insert: {
          task_id: string;
          from_status?: TaskStatus | null;
          to_status: TaskStatus;
          changed_by: string;
          changed_at?: string;
          comment?: string | null;
        };
        Update: never;
        Relationships: [
          {
            foreignKeyName: 'task_status_history_task_id_fkey';
            columns: ['task_id'];
            isOneToOne: false;
            referencedRelation: 'tasks';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'task_status_history_changed_by_fkey';
            columns: ['changed_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      current_profile_role: { Args: Record<string, never>; Returns: AppRole | null };
      is_manager: { Args: Record<string, never>; Returns: boolean };
      transition_task_status: {
        Args: { p_task_id: string; p_target_status: TaskStatus; p_comment?: string | null };
        Returns: Database['public']['Tables']['tasks']['Row'];
      };
    };
    Enums: {
      app_role: AppRole;
      task_status: TaskStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}
