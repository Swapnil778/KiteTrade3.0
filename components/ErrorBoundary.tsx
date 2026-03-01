
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    localStorage.removeItem('kite_current_screen');
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#050505] flex items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-[32px] p-10 shadow-2xl border border-gray-100 dark:border-gray-800 animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-8">
              <AlertCircle size={40} className="text-red-500" />
            </div>
            
            <h1 className="text-2xl font-black italic uppercase tracking-tighter mb-4 text-gray-900 dark:text-white">
              Something went <span className="text-red-500">Wrong</span>
            </h1>
            
            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-10">
              We encountered an unexpected error. This might be due to a temporary glitch or a network issue.
            </p>

            <div className="space-y-4">
              <button
                onClick={this.handleReset}
                className="w-full py-4 bg-[#387ed1] text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition-all flex items-center justify-center gap-3"
              >
                <RefreshCw size={18} /> Reload Application
              </button>
              
              <button
                onClick={this.handleGoHome}
                className="w-full py-4 bg-transparent border-2 border-gray-100 dark:border-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3"
              >
                <Home size={18} /> Return to Home
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mt-10 p-4 bg-gray-50 dark:bg-black rounded-xl text-left overflow-auto max-h-40 border border-gray-100 dark:border-gray-800">
                <p className="text-[10px] font-mono text-red-400 break-all">
                  {this.state.error.toString()}
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
