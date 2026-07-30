"use client";

import React, { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // In production, send to Sentry or similar
    console.error("[ErrorBoundary] Caught error:", error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[60vh] items-center justify-center p-6">
          <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center shadow-lg">
            <div className="mb-4 flex justify-center">
              <div className="rounded-full bg-red-50 p-4">
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
            </div>
            <h2 className="mb-2 text-xl font-bold text-gray-900">
              {this.props.fallbackTitle ?? "Something went wrong"}
            </h2>
            <p className="mb-1 text-sm text-gray-500">
              An unexpected error occurred in this section.
            </p>
            {this.state.error?.message && (
              <p className="mb-6 rounded-lg bg-red-50 px-4 py-2 font-mono text-xs text-red-700">
                {this.state.error.message}
              </p>
            )}
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Button
                variant="outline"
                className="border-red-200 text-red-700 hover:bg-red-50"
                onClick={this.handleReset}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
              <Button
                variant="ghost"
                className="text-gray-500 hover:text-gray-700"
                onClick={() => window.location.reload()}
              >
                Reload Page
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
