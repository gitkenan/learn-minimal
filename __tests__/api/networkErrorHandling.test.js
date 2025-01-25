import { syncService } from '../../lib/syncService';

// Mock Supabase client with error handling similar to generate-plan.test.js
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn().mockImplementation(() => ({
    auth: {
      signInWithPassword: jest.fn().mockRejectedValue(new Error('Network error'))
    },
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    single: jest.fn().mockRejectedValue(new Error('Database error'))
  }))
}));

// Mock environment validation like generate-plan.test.js
jest.mock('../../lib/supabaseClient', () => ({
  initializeSupabase: jest.fn().mockImplementation(() => ({
    auth: {
      signInWithPassword: jest.fn()
    }
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
    const supabase = initializeSupabase();
    
    // Test auth failure with mocked error response
    await expect(supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'password'
    })).rejects.toThrow('Network error');
  });

  test('should handle plan save network errors', async () => {
    // Mock failed update with specific error code like generate-plan.test.js
    const dbError = new Error('Connection reset');
    dbError.code = 'ECONNRESET';
    jest.spyOn(syncService, 'updatePlanContent').mockRejectedValue(dbError);

    // Attempt to save and verify error handling
    await expect(syncService.updatePlanContent('123', () => ({})))
      .rejects.toThrow('Connection reset');
    
    // Verify error logging matches generate-plan.test.js patterns
    expect(console.error).toHaveBeenCalledWith(
      'Supabase request failed:', 
      expect.objectContaining({ code: 'ECONNRESET' })
    );
  });

  test('should handle query network errors', async () => {
    const supabase = initializeSupabase();
    const error = new Error('Connection reset');
    
    // Mock failed query
    supabase.from('plans').select = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        single: jest.fn().mockRejectedValue(error)
      })
    });

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
