export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      academy_notifications: {
        Row: {
          email_notifications: boolean | null
          id: string
          subscribed_at: string | null
          user_id: string | null
        }
        Insert: {
          email_notifications?: boolean | null
          id?: string
          subscribed_at?: string | null
          user_id?: string | null
        }
        Update: {
          email_notifications?: boolean | null
          id?: string
          subscribed_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "academy_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      availability: {
        Row: {
          created_at: string
          end_time: string
          id: string
          is_recurring: boolean
          profile_id: string
          recurrence_rule: string | null
          start_time: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_time: string
          id?: string
          is_recurring?: boolean
          profile_id: string
          recurrence_rule?: string | null
          start_time: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_time?: string
          id?: string
          is_recurring?: boolean
          profile_id?: string
          recurrence_rule?: string | null
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "availability_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_participants: {
        Row: {
          check_in_time: string | null
          created_at: string
          event_id: string
          id: string
          invitation_status: Database["public"]["Enums"]["invitation_status_enum"]
          profile_id: string
          role: Database["public"]["Enums"]["participant_role_enum"]
          score_confirmation_status: Database["public"]["Enums"]["confirmation_status_enum"]
        }
        Insert: {
          check_in_time?: string | null
          created_at?: string
          event_id: string
          id?: string
          invitation_status?: Database["public"]["Enums"]["invitation_status_enum"]
          profile_id: string
          role: Database["public"]["Enums"]["participant_role_enum"]
          score_confirmation_status?: Database["public"]["Enums"]["confirmation_status_enum"]
        }
        Update: {
          check_in_time?: string | null
          created_at?: string
          event_id?: string
          id?: string
          invitation_status?: Database["public"]["Enums"]["invitation_status_enum"]
          profile_id?: string
          role?: Database["public"]["Enums"]["participant_role_enum"]
          score_confirmation_status?: Database["public"]["Enums"]["confirmation_status_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "event_participants_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_participants_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "view_detailed_events"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_participants_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          actual_end_time: string | null
          actual_start_time: string | null
          created_at: string
          created_by: string | null
          event_type: Database["public"]["Enums"]["event_type_enum"]
          id: string
          location_details: string | null
          location_id: string | null
          notes: string | null
          scheduled_end_time: string | null
          scheduled_start_time: string
          status: Database["public"]["Enums"]["event_status_enum"]
          updated_at: string
        }
        Insert: {
          actual_end_time?: string | null
          actual_start_time?: string | null
          created_at?: string
          created_by?: string | null
          event_type: Database["public"]["Enums"]["event_type_enum"]
          id?: string
          location_details?: string | null
          location_id?: string | null
          notes?: string | null
          scheduled_end_time?: string | null
          scheduled_start_time: string
          status?: Database["public"]["Enums"]["event_status_enum"]
          updated_at?: string
        }
        Update: {
          actual_end_time?: string | null
          actual_start_time?: string | null
          created_at?: string
          created_by?: string | null
          event_type?: Database["public"]["Enums"]["event_type_enum"]
          id?: string
          location_details?: string | null
          location_id?: string | null
          notes?: string | null
          scheduled_end_time?: string | null
          scheduled_start_time?: string
          status?: Database["public"]["Enums"]["event_status_enum"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      favorite_players: {
        Row: {
          created_at: string | null
          profile_id: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          profile_id?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          profile_id?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "favorite_players_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorite_players_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          address: string | null
          court_surface:
            | Database["public"]["Enums"]["court_surface_enum"]
            | null
          created_at: string
          created_by: string | null
          id: string
          latitude: number
          longitude: number
          name: string
          number_of_courts: number | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          court_surface?:
            | Database["public"]["Enums"]["court_surface_enum"]
            | null
          created_at?: string
          created_by?: string | null
          id?: string
          latitude: number
          longitude: number
          name: string
          number_of_courts?: number | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          court_surface?:
            | Database["public"]["Enums"]["court_surface_enum"]
            | null
          created_at?: string
          created_by?: string | null
          id?: string
          latitude?: number
          longitude?: number
          name?: string
          number_of_courts?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "locations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      match_scores: {
        Row: {
          created_at: string
          event_id: string
          game_score_detail_json: Json | null
          id: string
          recorded_by: string | null
          score_team_a: number
          score_team_b: number
          set_number: number
          tiebreak_score_team_a: number | null
          tiebreak_score_team_b: number | null
        }
        Insert: {
          created_at?: string
          event_id: string
          game_score_detail_json?: Json | null
          id?: string
          recorded_by?: string | null
          score_team_a: number
          score_team_b: number
          set_number: number
          tiebreak_score_team_a?: number | null
          tiebreak_score_team_b?: number | null
        }
        Update: {
          created_at?: string
          event_id?: string
          game_score_detail_json?: Json | null
          id?: string
          recorded_by?: string | null
          score_team_a?: number
          score_team_b?: number
          set_number?: number
          tiebreak_score_team_a?: number | null
          tiebreak_score_team_b?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "match_scores_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_scores_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "view_detailed_events"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "match_scores_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      match_statistics: {
        Row: {
          aces: number | null
          created_at: string | null
          id: string
          match_id: string | null
          player_id: string | null
          unforced_errors: number | null
          updated_at: string | null
          winners: number | null
        }
        Insert: {
          aces?: number | null
          created_at?: string | null
          id?: string
          match_id?: string | null
          player_id?: string | null
          unforced_errors?: number | null
          updated_at?: string | null
          winners?: number | null
        }
        Update: {
          aces?: number | null
          created_at?: string | null
          id?: string
          match_id?: string | null
          player_id?: string | null
          unforced_errors?: number | null
          updated_at?: string | null
          winners?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "match_statistics_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_statistics_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "view_detailed_events"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "match_statistics_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string | null
          recipient_profile_id: string
          related_event_id: string | null
          related_profile_id: string | null
          sender_profile_id: string | null
          type: Database["public"]["Enums"]["notification_type_enum"]
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string | null
          recipient_profile_id: string
          related_event_id?: string | null
          related_profile_id?: string | null
          sender_profile_id?: string | null
          type: Database["public"]["Enums"]["notification_type_enum"]
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string | null
          recipient_profile_id?: string
          related_event_id?: string | null
          related_profile_id?: string | null
          sender_profile_id?: string | null
          type?: Database["public"]["Enums"]["notification_type_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "notifications_recipient_profile_id_fkey"
            columns: ["recipient_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_related_event_id_fkey"
            columns: ["related_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_related_event_id_fkey"
            columns: ["related_event_id"]
            isOneToOne: false
            referencedRelation: "view_detailed_events"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "notifications_related_profile_id_fkey"
            columns: ["related_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_sender_profile_id_fkey"
            columns: ["sender_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      player_achievements: {
        Row: {
          achieved_at: string | null
          achievement_level: string
          achievement_type: string
          description: string | null
          id: string
          metadata: Json | null
          player_id: string | null
        }
        Insert: {
          achieved_at?: string | null
          achievement_level: string
          achievement_type: string
          description?: string | null
          id?: string
          metadata?: Json | null
          player_id?: string | null
        }
        Update: {
          achieved_at?: string | null
          achievement_level?: string
          achievement_type?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          player_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "player_achievements_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      player_challenges: {
        Row: {
          challenge_type: string
          completed: boolean | null
          created_at: string | null
          current_value: number | null
          description: string
          end_date: string
          id: string
          player_id: string | null
          reward_points: number | null
          start_date: string
          target_value: number
        }
        Insert: {
          challenge_type: string
          completed?: boolean | null
          created_at?: string | null
          current_value?: number | null
          description: string
          end_date: string
          id?: string
          player_id?: string | null
          reward_points?: number | null
          start_date: string
          target_value: number
        }
        Update: {
          challenge_type?: string
          completed?: boolean | null
          created_at?: string | null
          current_value?: number | null
          description?: string
          end_date?: string
          id?: string
          player_id?: string | null
          reward_points?: number | null
          start_date?: string
          target_value?: number
        }
        Relationships: [
          {
            foreignKeyName: "player_challenges_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      player_skill_history: {
        Row: {
          changed_at: string | null
          id: string
          new_skill_level: number
          old_skill_level: number | null
          player_id: string | null
          reason: string | null
        }
        Insert: {
          changed_at?: string | null
          id?: string
          new_skill_level: number
          old_skill_level?: number | null
          player_id?: string | null
          reason?: string | null
        }
        Update: {
          changed_at?: string | null
          id?: string
          new_skill_level?: number
          old_skill_level?: number | null
          player_id?: string | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "player_skill_history_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          username: string | null
          full_name: string | null
          avatar_url: string | null
          bio: string | null
          playing_style: string | null
          preferred_hand: 'left' | 'right' | 'ambidextrous' | null
          is_coach: boolean
          coach_hourly_rate: number | null
          coach_specialization: string | null
          skill_level: number | null
          location_id: string | null
          current_ranking_points_singles: number
          current_ranking_points_doubles: number
          rating_status: 'Provisional' | 'Established'
          singles_matches_played: number
          doubles_matches_played: number
          singles_matches_won: number
          doubles_matches_won: number
          last_ranking_update: string
          is_guest: boolean
          date_of_birth: string | null
          gender: 'male' | 'female' | 'other' | null
          home_latitude: number | null
          home_longitude: number | null
          home_location_description: string | null
          search_radius_km: number
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          playing_style?: string | null
          preferred_hand?: 'left' | 'right' | 'ambidextrous' | null
          is_coach?: boolean
          coach_hourly_rate?: number | null
          coach_specialization?: string | null
          skill_level?: number | null
          location_id?: string | null
          current_ranking_points_singles?: number
          current_ranking_points_doubles?: number
          rating_status?: 'Provisional' | 'Established'
          singles_matches_played?: number
          doubles_matches_played?: number
          singles_matches_won?: number
          doubles_matches_won?: number
          last_ranking_update?: string
          is_guest?: boolean
          date_of_birth?: string | null
          gender?: 'male' | 'female' | 'other' | null
          home_latitude?: number | null
          home_longitude?: number | null
          home_location_description?: string | null
          search_radius_km?: number
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          playing_style?: string | null
          preferred_hand?: 'left' | 'right' | 'ambidextrous' | null
          is_coach?: boolean
          coach_hourly_rate?: number | null
          coach_specialization?: string | null
          skill_level?: number | null
          location_id?: string | null
          current_ranking_points_singles?: number
          current_ranking_points_doubles?: number
          rating_status?: 'Provisional' | 'Established'
          singles_matches_played?: number
          doubles_matches_played?: number
          singles_matches_won?: number
          doubles_matches_won?: number
          last_ranking_update?: string
          is_guest?: boolean
          date_of_birth?: string | null
          gender?: 'male' | 'female' | 'other' | null
          home_latitude?: number | null
          home_longitude?: number | null
          home_location_description?: string | null
          search_radius_km?: number
        }
      }
      ranking_history: {
        Row: {
          calculation_date: string
          created_at: string | null
          id: string
          points: number
          profile_id: string | null
          rank: number
          ranking_type: Database["public"]["Enums"]["ranking_type_enum"]
        }
        Insert: {
          calculation_date: string
          created_at?: string | null
          id?: string
          points: number
          profile_id?: string | null
          rank: number
          ranking_type: Database["public"]["Enums"]["ranking_type_enum"]
        }
        Update: {
          calculation_date?: string
          created_at?: string | null
          id?: string
          points?: number
          profile_id?: string | null
          rank?: number
          ranking_type?: Database["public"]["Enums"]["ranking_type_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "ranking_history_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tournaments: {
        Row: {
          id: string;
          created_at: string;
          name: string;
          description?: string;
          start_date: string;
          end_date: string;
          location: string;
          status: 'upcoming' | 'in_progress' | 'completed';
          tournament_type: 'single_elimination' | 'double_elimination' | 'round_robin';
          created_by: string;
        }
        Insert: {
          id?: string;
          created_at?: string;
          name: string;
          description?: string;
          start_date: string;
          end_date: string;
          location: string;
          status?: 'upcoming' | 'in_progress' | 'completed';
          tournament_type: 'single_elimination' | 'double_elimination' | 'round_robin';
          created_by: string;
        }
        Update: {
          id?: string;
          created_at?: string;
          name?: string;
          description?: string;
          start_date?: string;
          end_date?: string;
          location?: string;
          status?: 'upcoming' | 'in_progress' | 'completed';
          tournament_type?: 'single_elimination' | 'double_elimination' | 'round_robin';
          created_by?: string;
        }
        Relationships: [
          {
            foreignKeyName: "tournaments_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      tournament_rounds: {
        Row: {
          id: string;
          tournament_id: string;
          round_number: number;
          status: Database["public"]["Enums"]["tournament_status_enum"];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tournament_id: string;
          round_number: number;
          status?: Database["public"]["Enums"]["tournament_status_enum"];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tournament_id?: string;
          round_number?: number;
          status?: Database["public"]["Enums"]["tournament_status_enum"];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tournament_rounds_tournament_id_fkey";
            columns: ["tournament_id"];
            isOneToOne: false;
            referencedRelation: "tournaments";
            referencedColumns: ["id"];
          }
        ];
      };
      tournament_matches: {
        Row: {
          id: string;
          tournament_id: string;
          round_id: string;
          player1_id: string | null;
          player2_id: string | null;
          winner_id: string | null;
          status: Database["public"]["Enums"]["tournament_status_enum"];
          scheduled_time: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
          event_id: string | null;
          score_summary: any | null;
        };
        Insert: {
          id?: string;
          tournament_id: string;
          round_id: string;
          player1_id?: string | null;
          player2_id?: string | null;
          winner_id?: string | null;
          status?: Database["public"]["Enums"]["tournament_status_enum"];
          scheduled_time?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
          event_id?: string | null;
          score_summary?: any | null;
        };
        Update: {
          id?: string;
          tournament_id?: string;
          round_id?: string;
          player1_id?: string | null;
          player2_id?: string | null;
          winner_id?: string | null;
          status?: Database["public"]["Enums"]["tournament_status_enum"];
          scheduled_time?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
          event_id?: string | null;
          score_summary?: any | null;
        };
        Relationships: [
          {
            foreignKeyName: "tournament_matches_tournament_id_fkey";
            columns: ["tournament_id"];
            isOneToOne: false;
            referencedRelation: "tournaments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tournament_matches_round_id_fkey";
            columns: ["round_id"];
            isOneToOne: false;
            referencedRelation: "tournament_rounds";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tournament_matches_player1_id_fkey";
            columns: ["player1_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tournament_matches_player2_id_fkey";
            columns: ["player2_id"];
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_matches_winner_id_fkey";
            columns: ["winner_id"];
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_matches_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          }
        ];
      };
      tournament_participants: {
        Row: {
          id: string
          tournament_id: string
          player_id: string
          created_at: string
          status: 'registered' | 'confirmed' | 'eliminated'
          seed?: number
        }
        Insert: {
          id?: string
          tournament_id: string
          player_id: string
          created_at?: string
          status?: 'registered' | 'confirmed' | 'eliminated'
          seed?: number
        }
        Update: {
          id?: string
          tournament_id?: string
          player_id?: string
          created_at?: string
          status?: 'registered' | 'confirmed' | 'eliminated'
          seed?: number
        }
        Relationships: [
          {
            foreignKeyName: "tournament_participants_tournament_id_fkey"
            columns: ["tournament_id"]
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_participants_player_id_fkey"
            columns: ["player_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      matches: {
        Row: {
          id: string;
          created_at: string;
          tournament_id: string;
          round_number: number;
          player1_id: string;
          player2_id: string;
          winner_id?: string;
          status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
          court_number?: number;
          started_at?: string;
          completed_at?: string;
          umpire_id?: string;
        }
        Insert: {
          id?: string;
          created_at?: string;
          tournament_id: string;
          round_number?: number;
          player1_id: string;
          player2_id: string;
          winner_id?: string;
          status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
          court_number?: number;
          started_at?: string;
          completed_at?: string;
          umpire_id?: string;
        }
        Update: {
          id?: string;
          created_at?: string;
          tournament_id?: string;
          round_number?: number;
          player1_id?: string;
          player2_id?: string;
          winner_id?: string;
          status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
          court_number?: number;
          started_at?: string;
          completed_at?: string;
          umpire_id?: string;
        }
        Relationships: [
          {
            foreignKeyName: "matches_tournament_id_fkey"
            columns: ["tournament_id"]
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          }
        ]
      }
      match_disputes: {
        Row: {
          id: string;
          match_id: string;
          description: string;
          status: 'pending' | 'resolved' | 'rejected';
          created_at: string;
          resolved_at?: string;
          resolved_by?: string;
          resolution_notes?: string;
        }
        Insert: {
          id?: string;
          match_id: string;
          description: string;
          status?: 'pending' | 'resolved' | 'rejected';
          created_at?: string;
          resolved_at?: string;
          resolved_by?: string;
          resolution_notes?: string;
        }
        Update: {
          id?: string;
          match_id?: string;
          description?: string;
          status?: 'pending' | 'resolved' | 'rejected';
          created_at?: string;
          resolved_at?: string;
          resolved_by?: string;
          resolution_notes?: string;
        }
        Relationships: [
          {
            foreignKeyName: "match_disputes_match_id_fkey"
            columns: ["match_id"]
            referencedRelation: "matches"
            referencedColumns: ["id"]
          }
        ]
      }
      system_settings: {
        Row: {
          id: string;
          setting_key: string;
          setting_value: string;
          updated_at: string;
          updated_by: string;
        }
        Insert: {
          id?: string;
          setting_key?: string;
          setting_value?: string;
          updated_at?: string;
          updated_by?: string;
        }
        Update: {
          id?: string;
          setting_key?: string;
          setting_value?: string;
          updated_at?: string;
          updated_by?: string;
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          plan_type: 'free' | 'pro' | 'premium'
          status: 'active' | 'inactive' | 'trial'
          trial_ends_at: string | null
          current_period_start: string
          current_period_end: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan_type: 'free' | 'pro' | 'premium'
          status: 'active' | 'inactive' | 'trial'
          trial_ends_at?: string | null
          current_period_start?: string
          current_period_end: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plan_type?: 'free' | 'pro' | 'premium'
          status?: 'active' | 'inactive' | 'trial'
          trial_ends_at?: string | null
          current_period_start?: string
          current_period_end?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      view_detailed_events: {
        Row: {
          event_id: string | null
          event_type: Database["public"]["Enums"]["event_type_enum"] | null
          location_address: string | null
          location_id: string | null
          location_name: string | null
          organizer_id: string | null
          scheduled_end_time: string | null
          scheduled_start_time: string | null
          status: Database["public"]["Enums"]["event_status_enum"] | null
        }
        Relationships: [
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      calculate_rankings: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      calculate_initial_rating: {
        Args: {
          player_id: string
        }
        Returns: undefined
      }
      get_current_rankings: {
        Args: {
          ranking_type: Database["public"]["Enums"]["ranking_type_enum"]
          limit_count?: number
        }
        Returns: {
          profile_id: string
          full_name: string
          username: string
          avatar_url: string
          points: number
          rank: number
        }[]
      }
      get_my_upcoming_events: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["CompositeTypes"]["detailed_event_summary"][]
      }
      get_player_ranking_history: {
        Args: {
          player_id: string
          ranking_type: Database["public"]["Enums"]["ranking_type_enum"]
          days_limit?: number
        }
        Returns: {
          calculation_date: string
          points: number
          rank: number
        }[]
      }
      get_user_events: {
        Args: { user_id: string }
        Returns: {
          id: string
          event_type: Database["public"]["Enums"]["event_type_enum"]
          status: Database["public"]["Enums"]["event_status_enum"]
          scheduled_start_time: string
          scheduled_end_time: string
          location_id: string
          location_details: string
          notes: string
          created_by: string
          created_at: string
          location: Json
          participants: Json
        }[]
      }
      initialize_player_rankings: {
        Args: { player_id: string }
        Returns: undefined
      }
    }
    Enums: {
      confirmation_status_enum:
        | "not_required"
        | "pending"
        | "confirmed"
        | "disputed"
      court_surface_enum:
        | "clay"
        | "hard"
        | "grass"
        | "carpet"
        | "other"
        | "Hard"
        | "All-weather"
      event_status_enum:
        | "pending_confirmation"
        | "scheduled"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "disputed"
      event_type_enum:
        | "match_singles_friendly"
        | "match_singles_ranked"
        | "match_doubles_friendly"
        | "match_doubles_ranked"
        | "coaching_session"
        | "hitting_session"
        | "tournament_match_singles"
        | "tournament_match_doubles"
      tournament_format_enum:
        | "single_elimination"
        | "double_elimination"
        | "round_robin"
        | "swiss"
      tournament_status_enum:
        | "pending"
        | "in_progress"
        | "completed"
        | "cancelled"
      gender_enum: "male" | "female" | "other" | "prefer_not_to_say"
      hand_enum: "right" | "left" | "ambidextrous"
      invitation_status_enum: "pending" | "accepted" | "declined"
      notification_type_enum:
        | "event_invitation"
        | "event_update"
        | "event_cancellation"
        | "score_confirmation_request"
        | "score_dispute"
        | "coaching_request"
        | "friend_request"
        | "new_ranking"
        | "message_received"
      participant_role_enum:
        | "challenger"
        | "opponent"
        | "player_team_a1"
        | "player_team_a2"
        | "player_team_b1"
        | "player_team_b2"
        | "student"
        | "coach"
        | "umpire"
        | "witness"
        | "organizer"
        | "player"
      ranking_type_enum: "singles" | "doubles"
    }
    CompositeTypes: {
      detailed_event_summary: {
        event_id: string | null
        event_type: string | null
        event_status: string | null
        start_time: string | null
        location_name: string | null
        opponent_id: string | null
        opponent_name: string | null
        opponent_avatar: string | null
      }
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      confirmation_status_enum: [
        "not_required",
        "pending",
        "confirmed",
        "disputed",
      ],
      court_surface_enum: [
        "clay",
        "hard",
        "grass",
        "carpet",
        "other",
        "Hard",
        "All-weather",
      ],
      event_status_enum: [
        "pending_confirmation",
        "scheduled",
        "in_progress",
        "completed",
        "cancelled",
        "disputed",
      ],
      event_type_enum: [
        "match_singles_friendly",
        "match_singles_ranked",
        "match_doubles_friendly",
        "match_doubles_ranked",
        "coaching_session",
        "hitting_session",
        "tournament_match_singles",
        "tournament_match_doubles",
      ],
      gender_enum: ["male", "female", "other", "prefer_not_to_say"],
      hand_enum: ["right", "left", "ambidextrous"],
      invitation_status_enum: ["pending", "accepted", "declined"],
      notification_type_enum: [
        "event_invitation",
        "event_update",
        "event_cancellation",
        "score_confirmation_request",
        "score_dispute",
        "coaching_request",
        "friend_request",
        "new_ranking",
        "message_received",
      ],
      participant_role_enum: [
        "challenger",
        "opponent",
        "player_team_a1",
        "player_team_a2",
        "player_team_b1",
        "player_team_b2",
        "student",
        "coach",
        "umpire",
        "witness",
        "organizer",
        "player",
      ],
      ranking_type_enum: ["singles", "doubles"],
    },
  },
} as const

export interface Tournament {
  id: string;
  created_at: string;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  location: string;
  status: 'upcoming' | 'in_progress' | 'completed';
  tournament_type: 'single_elimination' | 'double_elimination' | 'round_robin';
  created_by: string;
}

export interface TournamentParticipant {
  id: string;
  tournament_id: string;
  player_id: string;
  created_at: string;
  status: 'registered' | 'confirmed' | 'eliminated';
  seed?: number;
}

export interface Match {
  id: string;
  created_at: string;
  tournament_id: string;
  round_number: number;
  player1_id: string;
  player2_id: string;
  winner_id?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  court_number?: number;
  started_at?: string;
  completed_at?: string;
  umpire_id?: string;
}

export interface MatchScore {
  id: string;
  match_id: string;
  set_number: number;
  player1_score: number;
  player2_score: number;
  submitted_at: string;
}

export interface MatchDispute {
  id: string;
  match_id: string;
  description: string;
  status: 'pending' | 'resolved' | 'rejected';
  created_at: string;
  resolved_at?: string;
  resolved_by?: string;
  resolution_notes?: string;
}

export interface SystemSettings {
  id: string;
  setting_key: string;
  setting_value: string;
  updated_at: string;
  updated_by: string;
}

export interface CustomTables {
  academy_notifications: {
    Row: {
      id: string;
      user_id: string | null;
      email_notifications: boolean | null;
      subscribed_at: string | null;
    };
    Insert: {
      id?: string;
      user_id?: string | null;
      email_notifications?: boolean | null;
      subscribed_at?: string | null;
    };
    Update: {
      id?: string;
      user_id?: string | null;
      email_notifications?: boolean | null;
      subscribed_at?: string | null;
    };
    Relationships: [
      {
        foreignKeyName: "academy_notifications_user_id_fkey";
        columns: ["user_id"];
        referencedRelation: "profiles";
        referencedColumns: ["id"];
      }
    ];
  };
  tournaments: Tournament;
  tournament_participants: TournamentParticipant;
  matches: Match;
  match_scores: MatchScore;
  match_disputes: MatchDispute;
  system_settings: SystemSettings;
}
