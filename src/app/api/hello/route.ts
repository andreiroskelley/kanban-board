import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    message: "Hello from Next" 
  });
}

// Optional: You can also handle other HTTP methods
export async function POST() {
  return NextResponse.json({ 
    message: "POST request received" 
  });
}

export async function PUT() {
  return NextResponse.json({ 
    message: "PUT request received" 
  });
}