import { render, screen } from '@testing-library/react';
import { Loading } from '@/components/ui/loading';

describe('Loading', () => {
  it('renders spinner variant with default size', () => {
    render(<Loading variant="spinner" />);
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('h-12 w-12');
    expect(spinner).toHaveClass('animate-spin');
  });

  it('renders spinner variant with different sizes', () => {
    const { rerender } = render(<Loading variant="spinner" size="sm" />);
    expect(screen.getByRole('status')).toHaveClass('h-6 w-6');

    rerender(<Loading variant="spinner" size="lg" />);
    expect(screen.getByRole('status')).toHaveClass('h-16 w-16');
  });

  it('renders shimmer variant', () => {
    render(<Loading variant="shimmer" />);
    const shimmer = screen.getByRole('status');
    expect(shimmer).toHaveClass('shimmer');
    expect(shimmer).toHaveClass('animate-shimmer');
  });

  it('displays message when provided', () => {
    const message = 'Loading data...';
    render(<Loading variant="spinner" message={message} />);
    expect(screen.getByText(message)).toBeInTheDocument();
    expect(screen.getByText(message)).toHaveClass('text-sm text-muted-foreground animate-pulse');
  });

  it('applies custom className to the component', () => {
    render(<Loading variant="spinner" className="custom-class" />);
    expect(screen.getByRole('status')).toHaveClass('custom-class');
  });

  it('renders skeleton variant with default line', () => {
    render(<Loading variant="skeleton" />);
    const skeleton = screen.getByRole('status');
    expect(skeleton.children).toHaveLength(1);
    expect(skeleton.firstChild).toHaveClass('shimmer', 'rounded', 'bg-gray-200');
  });

  it('renders skeleton variant with multiple lines', () => {
    const lines = 3;
    render(<Loading variant="skeleton" lines={lines} />);
    const skeleton = screen.getByRole('status');
    expect(skeleton.children).toHaveLength(lines);
    Array.from(skeleton.children).forEach(line => {
      expect(line).toHaveClass('shimmer', 'rounded', 'bg-gray-200');
    });
  });

  it('applies size variants to skeleton lines', () => {
    const { rerender } = render(<Loading variant="skeleton" size="sm" />);
    expect(screen.getByRole('status').firstChild).toHaveClass('h-4', 'w-24');

    rerender(<Loading variant="skeleton" size="default" />);
    expect(screen.getByRole('status').firstChild).toHaveClass('h-6', 'w-48');

    rerender(<Loading variant="skeleton" size="lg" />);
    expect(screen.getByRole('status').firstChild).toHaveClass('h-8', 'w-64');
  });

  it('applies correct border colors to spinner', () => {
    render(<Loading variant="spinner" />);
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('border-t-2 border-b-2');
    expect(spinner).toHaveClass('border-t-transparent');
    expect(spinner.style.borderColor).toBe('currentColor');
  });
});