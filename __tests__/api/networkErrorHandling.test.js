import { initializeSupabase } from '../../lib/supabaseClient';
import { syncService } from '../../lib/syncService';
import { toast } from 'react-hot-toast';

// Mock network requests
beforeAll(() => {
  global.fetch = jest.fn();
});

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

describe('Network Error Handling', () => {
  test('should handle failed fetch requests', async () => {
    // Simulate network failure
    fetch.mockRejectedValue(new Error('Network request failed'));

    const supabase = initializeSupabase();
    
    // Test auth failure
    const authPromise = supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'password'
    });

    await expect(authPromise).rejects.toThrow('Network request failed');
  });

  test('should handle plan save network errors', async () => {
    const mockPlan = { id: '123', content: {} };
    const error = new Error('Failed to save - network error');
    
    // Mock failed update
    jest.spyOn(syncService, 'updatePlanContent').mockRejectedValue(error);

    // Spy on toast
    const toastSpy = jest.spyOn(toast, 'error');

    // Attempt to save
    await expect(syncService.updatePlanContent(mockPlan.id, () => ({})))
      .rejects.toThrow('Failed to save - network error');

    // Verify error handling
    expect(toastSpy).toHaveBeenCalledWith(
      expect.stringContaining('network error'),
      expect.objectContaining({ duration: 4000 })
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
