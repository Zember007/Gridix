import { Component, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@gridix/ui';

// ── Error fallback UI ──

interface ErrorFallbackProps {
  error: Error;
  onRetry: () => void;
}

function ErrorFallback({ error, onRetry }: ErrorFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8 text-center min-h-[300px]">
      <AlertTriangle className="h-10 w-10 text-yellow-500" />
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Something went wrong</h3>
        <p className="mt-1 text-sm text-gray-500 max-w-md">
          {error.message || 'An unexpected error occurred while loading data.'}
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RefreshCw className="mr-2 h-4 w-4" />
        Retry
      </Button>
    </div>
  );
}

// ── Class-based ErrorBoundary (React requires class component) ──

interface ProjectErrorBoundaryProps {
  children: ReactNode;
  /** Optional fallback renderer. Receives error + retry callback. */
  fallback?: (error: Error, onRetry: () => void) => ReactNode;
}

interface ProjectErrorBoundaryState {
  error: Error | null;
}

class ProjectErrorBoundaryInner extends Component<
  ProjectErrorBoundaryProps & { onRetry: () => void },
  ProjectErrorBoundaryState
> {
  constructor(props: ProjectErrorBoundaryProps & { onRetry: () => void }) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): ProjectErrorBoundaryState {
    return { error };
  }

  handleRetry = () => {
    this.setState({ error: null });
    this.props.onRetry();
  };

  render() {
    if (this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleRetry);
      }
      return <ErrorFallback error={this.state.error} onRetry={this.handleRetry} />;
    }
    return this.props.children;
  }
}

// ── Wrapper that provides QueryClient-based retry ──

export function ProjectErrorBoundary({ children, fallback }: ProjectErrorBoundaryProps) {
  const queryClient = useQueryClient();

  const handleRetry = () => {
    // Invalidate all queries in the project-selector scope to trigger refetch.
    void queryClient.invalidateQueries({ queryKey: ['project-apartments'] });
    void queryClient.invalidateQueries({ queryKey: ['project-layout-photos'] });
    void queryClient.invalidateQueries({ queryKey: ['project-facades'] });
    void queryClient.invalidateQueries({ queryKey: ['building-floors'] });
    void queryClient.invalidateQueries({ queryKey: ['facade-settings'] });
  };

  return (
    <ProjectErrorBoundaryInner onRetry={handleRetry} fallback={fallback}>
      {children}
    </ProjectErrorBoundaryInner>
  );
}
