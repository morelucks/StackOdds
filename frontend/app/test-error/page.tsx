'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ErrorBoundary } from '@/components/common/error-boundary';

function ErrorTrigger() {
  const [shouldError, setShouldError] = useState(false);

  if (shouldError) {
    throw new Error('Test error: This is a simulated error for testing the error boundary');
  }

  return (
    <Card className="p-6 space-y-4">
      <h3 className="text-lg font-semibold">Error Boundary Test</h3>
      <p className="text-sm text-muted-foreground">
        Click the button below to trigger an error and test the error boundary.
      </p>
      <Button onClick={() => setShouldError(true)} variant="destructive">
        Trigger Error
      </Button>
    </Card>
  );
}

export default function ErrorBoundaryTestPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Error Boundary Test Page</h1>
          <p className="text-muted-foreground">
            This page is for testing error boundaries in development.
          </p>
        </div>

        <ErrorBoundary>
          <ErrorTrigger />
        </ErrorBoundary>
      </div>
    </div>
  );
}
