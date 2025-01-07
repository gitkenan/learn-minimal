import { render, screen, fireEvent } from '@testing-library/react';
import { useRouter } from 'next/router';
import PlanPage from '@/pages/plan/[id]';
import { usePlan } from '@/hooks/usePlan';

// Mock next/router
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

// Mock usePlan hook
jest.mock('@/hooks/usePlan', () => ({
  usePlan: jest.fn(),
}));

describe('PlanPage', () => {
  const mockPlan = {
    id: 'test-plan',
    topic: 'Test Topic',
    content: 'Test content',
    created_at: '2023-01-01',
    progress: 50,
  };

  beforeEach(() => {
    // Setup router mock
    useRouter.mockImplementation(() => ({
      query: { id: 'test-plan' },
      isReady: true,
    }));

    // Setup usePlan mock
    usePlan.mockImplementation(() => ({
      plan: mockPlan,
      loading: false,
      error: null,
    }));
  });

  it('renders loading state', () => {
    usePlan.mockImplementation(() => ({
      plan: null,
      loading: true,
      error: null,
    }));

    render(<PlanPage />);
    expect(screen.getByText('Loading plan...')).toBeInTheDocument();
  });

  it('renders error state', () => {
    usePlan.mockImplementation(() => ({
      plan: null,
      loading: false,
      error: 'Test error',
    }));

    render(<PlanPage />);
    expect(screen.getByText('Error loading plan')).toBeInTheDocument();
  });

  it('renders plan details when loaded', () => {
    render(<PlanPage />);
    expect(screen.getByText(mockPlan.topic)).toBeInTheDocument();
    expect(screen.getByText('Created 1/1/2023')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('toggles chat panel on desktop', () => {
    // Mock window.innerWidth for desktop
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 1024,
    });

    render(<PlanPage />);
    const toggleButton = screen.getByRole('button', { name: /toggle chat/i });
    fireEvent.click(toggleButton);
    expect(screen.getByText('Learning Assistant')).toBeInTheDocument();
  });

  it('toggles chat panel on mobile', () => {
    // Mock window.innerWidth for mobile
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 375,
    });

    render(<PlanPage />);
    const toggleButton = screen.getByRole('button', { name: /open chat/i });
    fireEvent.click(toggleButton);
    expect(screen.getByText('Learning Assistant')).toBeInTheDocument();
  });
});
