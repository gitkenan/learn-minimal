// __tests__/auth/confirm.test.js
import { render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/router';
import ConfirmEmail from '../../pages/auth/confirm';
import { initializeSupabase } from '../../lib/supabaseClient';

// Mock next/router
jest.mock('next/router', () => ({
  useRouter: jest.fn()
}));

// Mock supabaseClient
jest.mock('../../lib/supabaseClient', () => ({
  initializeSupabase: jest.fn()
}));

describe('ConfirmEmail', () => {
  let mockRouter;
  let mockSupabase;

  beforeEach(() => {
    // Reset mocks
    mockRouter = {
      query: {},
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

  it('shows loading state initially', () => {
    render(<ConfirmEmail />);
    expect(screen.getByText('Verifying your email...')).toBeInTheDocument();
  });

  it('handles missing token or type parameters', async () => {
    mockRouter.query = {};
    render(<ConfirmEmail />);

    await waitFor(() => {
      expect(screen.getByText('Invalid confirmation link')).toBeInTheDocument();
    });
  });

  it('handles successful email verification', async () => {
    // Setup successful verification
    mockRouter.query = {
      token_hash: 'valid_token',
      type: 'email'
    };
    mockSupabase.auth.verifyOtp.mockResolvedValueOnce({ error: null });

    render(<ConfirmEmail />);

    await waitFor(() => {
      expect(screen.getByText('Email verified successfully! Redirecting...')).toBeInTheDocument();
    });

    // Verify redirect after success
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/dashboard');
    }, { timeout: 2500 });
  });

  it('handles verification error', async () => {
    // Setup failed verification
    mockRouter.query = {
      token_hash: 'invalid_token',
      type: 'email'
    };
    mockSupabase.auth.verifyOtp.mockRejectedValueOnce(new Error('Invalid token'));

    render(<ConfirmEmail />);

    await waitFor(() => {
      expect(screen.getByText('Invalid token')).toBeInTheDocument();
    });
  });

  it('waits for router to be ready', () => {
    // Setup router as not ready
    mockRouter.isReady = false;
    mockRouter.query = {
      token_hash: 'valid_token',
      type: 'email'
    };

    render(<ConfirmEmail />);

    // Verify that verifyOtp wasn't called
    expect(mockSupabase.auth.verifyOtp).not.toHaveBeenCalled();
  });
});
