import { syncService } from '../../lib/syncService';
import { supabase } from '../../lib/supabaseClient';

// Mock environment variables required by supabaseClient
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:3000';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';

// Mock supabaseClient instead of supabase-js directly
jest.mock('../../lib/supabaseClient', () => ({
  initializeSupabase: () => ({
    auth: {
      signInWithPassword: jest.fn().mockRejectedValue(
        Object.assign(new Error('Network error'), { code: 'ECONNREFUSED' })
      ),
      getSession: jest.fn().mockRejectedValue(new Error('Session error'))
    },
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn()
  })
}));

// Match generate-plan.test.js mocking patterns exactly
jest.mock('@supabase/supabase-js', () => ({
  createPagesServerClient: jest.fn().mockImplementation(() => ({
    auth: {
      getSession: jest.fn().mockRejectedValue(
        Object.assign(new Error('Network error'), { code: 'ECONNREFUSED' })
      )
    },
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockRejectedValue(
      Object.assign(new Error('Database error'), { code: 'ECONNRESET' })
    )
  }))
}));
beforeAll(() => {
  global.fetch = jest.fn();
});

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

describe('Network Error Handling', () => {
  test('should handle failed fetch requests', async () => {
    // initializeSupabase was here!
    
    // Test auth failure with mocked error response
    await expect(supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'password'
    })).rejects.toThrow('Network error');
  });

  test('should handle plan save network errors', async () => {
    // Mock failed update through Supabase client
    const dbError = new Error('Connection reset');
    dbError.code = 'ECONNRESET';
    // initializeSupabase was here!
    supabase.from.mockImplementation(() => {
      throw dbError;
    });

    // Attempt to save and verify error handling
    await expect(syncService.updatePlanContent('123', () => ({})))
      .rejects.toThrow('Connection reset');
    
    // Verify error logging with more flexible matching
    expect(console.error).toHaveBeenCalledWith(
      'Supabase request failed:',
      expect.objectContaining({ 
        message: expect.stringContaining('reset'),
        code: expect.stringMatching(/ECONN|ERR/)
      })
    );
  });

  test('should handle query network errors', async () => {
    // initializeSupabase was here!
    const error = new Error('Connection reset');
    error.code = 'ECONNRESET';
    
    // Mock failed query using chained syntax
    supabase.from.mockImplementation(() => ({
      select: jest.fn().mockImplementation(() => ({
        eq: jest.fn().mockImplementation(() => ({
          single: jest.fn().mockRejectedValue(error)
        }))
      }))
    }));

    // Execute query
    const queryPromise = supabase
      .from('plans')
      .select('*')
      .eq('id', '123')
      .single();

    await expect(queryPromise).rejects.toThrow('Connection reset');
    expect(console.error).toHaveBeenCalledWith(
      'Supabase request failed:',
      error
    );
  });
});
