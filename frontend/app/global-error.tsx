"use client";

import { Inter } from "next/font/google";
import { Button } from "@/components/ui/button";

const inter = Inter({ subsets: ["latin"] });

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-gray-50">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">A critical error occurred!</h2>
          <p className="text-gray-500 mb-8 max-w-lg">
            The application crashed at the root level. Please try refreshing or contact support.
          </p>
          <Button onClick={() => window.location.reload()} className="bg-green-700 hover:bg-green-800">
            Refresh Application
          </Button>
        </div>
      </body>
    </html>
  );
}
