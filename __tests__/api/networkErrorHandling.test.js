import { syncService } from '../../lib/syncService';

// Match generate-plan.test.js mocking patterns exactly
jest.mock('@supabase/auth-helpers-nextjs', () => ({
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
    
    // Mock failed query using chained syntax
    supabase.from.mockReturnThis();
    supabase.select.mockReturnThis();
    supabase.eq.mockReturnThis();
    supabase.single.mockRejectedValue(error);

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
