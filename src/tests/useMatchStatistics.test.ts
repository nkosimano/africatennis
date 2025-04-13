import { renderHook, act, waitFor } from '@testing-library/react';
import { useMatchStatistics } from '../hooks/useMatchStatistics';
import { supabase } from '../lib/supabase';

// Mock Supabase
jest.mock('../lib/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
    limit: jest.fn()
  }
}));

describe('useMatchStatistics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches match statistics successfully', async () => {
    // Mock data
    const mockMatchData = {
      data: {
        id: 'match-123',
        participants: [
          {
            profile_id: 'player-1',
            profile: {
              full_name: 'Player One',
              username: 'player1'
            }
          },
          {
            profile_id: 'player-2',
            profile: {
              full_name: 'Player Two',
              username: 'player2'
            }
          }
        ]
      },
      error: null
    };

    const mockStatsData = {
      data: [
        {
          id: 'stat-1',
          match_id: 'match-123',
          player_id: 'player-1',
          winners: 10,
          unforced_errors: 5,
          aces: 3,
          player: {
            full_name: 'Player One',
            username: 'player1'
          }
        },
        {
          id: 'stat-2',
          match_id: 'match-123',
          player_id: 'player-2',
          winners: 8,
          unforced_errors: 7,
          aces: 2,
          player: {
            full_name: 'Player Two',
            username: 'player2'
          }
        }
      ],
      error: null
    };

    // Mock implementation
    supabase.from = jest.fn().mockImplementation((table) => {
      if (table === 'events') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue(mockMatchData)
        };
      } else if (table === 'match_statistics') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue(mockStatsData),
          limit: jest.fn().mockReturnThis()
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(),
        limit: jest.fn()
      };
    });

    // Render the hook
    const { result } = renderHook(() => useMatchStatistics('match-123'));

    // Initial state should be loading with empty statistics
    expect(result.current.loading).toBe(true);
    expect(result.current.statistics).toEqual([]);
    expect(result.current.error).toBeNull();

    // Wait for the async operations to complete
    try {
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      }, { timeout: 3000 });
    } catch (error) {
      console.error('Timed out waiting for loading to become false', error);
      console.log('Current state:', result.current);
      throw error;
    }

    // Hook should now have loaded with mock statistics
    expect(result.current.loading).toBe(false);
    expect(result.current.statistics).toHaveLength(2);
    expect(result.current.error).toBeNull();
  });

  it('handles errors when fetching match data', async () => {
    // Mock error
    const mockError = {
      data: null,
      error: { message: 'Failed to fetch match data' }
    };

    // Mock implementation
    supabase.from = jest.fn().mockImplementation(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue(mockError),
      limit: jest.fn().mockReturnThis()
    }));

    // Render the hook
    const { result } = renderHook(() => useMatchStatistics('match-123'));

    // Initial state should be loading with empty statistics
    expect(result.current.loading).toBe(true);
    expect(result.current.statistics).toEqual([]);
    expect(result.current.error).toBeNull();

    // Wait for the async operations to complete
    try {
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      }, { timeout: 3000 });
    } catch (error) {
      console.error('Timed out waiting for loading to become false', error);
      console.log('Current state:', result.current);
      throw error;
    }

    // Hook should now have an error
    expect(result.current.loading).toBe(false);
    expect(result.current.statistics).toEqual([]);
    expect(result.current.error).not.toBeNull();
  });

  it('updates statistics successfully', async () => {
    // Mock data
    const mockUpdateResponse = {
      data: {
        id: 'stat-1',
        match_id: 'match-123',
        player_id: 'player-1',
        winners: 15, // Updated value
        unforced_errors: 5,
        aces: 3
      },
      error: null
    };

    // Mock implementation
    supabase.from = jest.fn().mockImplementation((table) => {
      if (table === 'events') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: {
              id: 'match-123',
              participants: [
                {
                  profile_id: 'player-1',
                  profile: {
                    full_name: 'Player One',
                    username: 'player1'
                  }
                }
              ]
            },
            error: null
          })
        };
      } else if (table === 'match_statistics') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          upsert: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue(mockUpdateResponse),
          limit: jest.fn().mockReturnThis()
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        upsert: jest.fn().mockReturnThis(),
        single: jest.fn(),
        limit: jest.fn()
      };
    });

    // Render the hook
    const { result } = renderHook(() => useMatchStatistics('match-123'));

    // Wait for the hook to load
    try {
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      }, { timeout: 3000 });
    } catch (error) {
      console.error('Timed out waiting for loading to become false', error);
      console.log('Current state:', result.current);
      throw error;
    }

    // Call updateStatistics
    await act(async () => {
      await result.current.updateStatistics('player-1', { winners: 15 });
    });

    // Verify update was successful
    const updatedPlayerStat = result.current.statistics.find(s => s.player_id === 'player-1');
    expect(updatedPlayerStat?.winners).toBe(15);
  });
});
