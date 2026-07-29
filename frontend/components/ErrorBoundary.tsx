"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught frontend error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6 text-center">
          <div className="max-w-md w-full bg-white p-8 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Something went wrong</h2>
            <p className="text-sm text-gray-500">
              An unexpected application error occurred. Please refresh or try again shortly.
            </p>
            <Button
              onClick={this.handleReset}
              className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Refresh Page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
