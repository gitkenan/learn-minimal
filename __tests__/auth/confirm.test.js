// __tests__/auth/confirm.test.js
import { render, screen, waitFor, act } from '@testing-library/react';
import { useRouter } from 'next/router';
import ConfirmEmail from '@/pages/auth/confirm';
import { supabase } from '@/lib/supabaseClient';

jest.mock('next/router', () => ({
  useRouter: jest.fn()
}));

jest.mock('@/lib/supabaseClient', () => ({
  initializeSupabase: jest.fn()
}));

describe('ConfirmEmail', () => {
  let mockRouter;
  let mockSupabase;
  const message = 'Verifying your email...';

  beforeEach(() => {
    mockRouter = {
      query: { token_hash: 'test_token', type: 'email' },
      push: jest.fn(),
      isReady: true
    };
    useRouter.mockReturnValue(mockRouter);

    mockSupabase = {
      auth: {
        verifyOtp: jest.fn()
      }
    };
    initializeSupabase.mockReturnValue(mockSupabase);
  });

  it('shows initial state correctly', async () => {
    mockRouter.query = {};  // No query params to prevent immediate verification
    
    await act(async () => {
      render(<ConfirmEmail />);
    });
    
    const heading = screen.getByRole('heading', { name: 'Email Confirmation' });
    expect(heading).toBeInTheDocument();
    expect(screen.getByText('Invalid confirmation link')).toBeInTheDocument();
  });

  it('handles missing token or type parameters', async () => {
    mockRouter.query = {};
    
    await act(async () => {
      render(<ConfirmEmail />);
    });

    await waitFor(() => {
      expect(screen.getByText('Invalid confirmation link')).toBeInTheDocument();
    });
  });

  it('handles successful email verification', async () => {
    mockSupabase.auth.verifyOtp.mockResolvedValueOnce({ error: null });
    
    await act(async () => {
      render(<ConfirmEmail />);
    });

    await waitFor(() => {
      expect(screen.getByText('Email verified successfully! Redirecting...')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/dashboard');
    }, { timeout: 2500 });
  });

  it('handles verification error', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockSupabase.auth.verifyOtp.mockRejectedValueOnce(new Error('Invalid token'));
    
    await act(async () => {
      render(<ConfirmEmail />);
    });

    await waitFor(() => {
      expect(screen.getByText('Invalid token')).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });

  it('waits for router to be ready', async () => {
    mockRouter.isReady = false;
    
    await act(async () => {
      render(<ConfirmEmail />);
    });
    
    expect(mockSupabase.auth.verifyOtp).not.toHaveBeenCalled();
  });
});