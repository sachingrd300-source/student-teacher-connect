'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex items-center justify-center min-h-screen bg-background">
            <Card className="w-full max-w-lg text-center shadow-2xl">
                <CardHeader>
                    <CardTitle className="text-2xl font-headline text-destructive">Something went wrong!</CardTitle>
                    <CardDescription>
                        We encountered an unexpected error. Please try again.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {process.env.NODE_ENV === 'development' && (
                        <div className="p-4 text-left bg-muted rounded-md text-xs overflow-auto">
                            <h3 className="font-semibold mb-2">Error Details:</h3>
                            <pre className="whitespace-pre-wrap">
                                <code>{error.stack || error.message}</code>
                            </pre>
                        </div>
                    )}
                    <Button onClick={() => reset()}>
                        Try again
                    </Button>
                </CardContent>
            </Card>
        </div>
      </body>
    </html>
  );
}
