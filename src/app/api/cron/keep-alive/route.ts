import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // Validate Vercel cron secret to prevent unauthorized public spamming
  const authHeader = request.headers.get('authorization');
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized access' },
      { status: 401 }
    );
  }

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
  
  try {
    // 1. Ping the backend's health check endpoint to prevent Render Free tier from putting it to sleep
    const res = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache',
      },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      throw new Error(`Backend responded with status: ${res.status}`);
    }

    const data = await res.json();
    
    // 2. Return success
    return NextResponse.json({
      success: true,
      message: 'Backend keep-alive ping successful',
      backendStatus: data,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Keep-alive ping failed:', error.message);
    return NextResponse.json(
      {
        success: false,
        message: 'Backend keep-alive ping failed',
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
