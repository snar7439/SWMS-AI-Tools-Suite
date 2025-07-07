import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { query } = await request.json();
    
    // Test the LLM agent endpoint
    const response = await fetch('https://sysco-gen-ai-platform.labseag.us-east-1.aws.sysco.net/api/sysco-gen-ai-platform/agents/v1/content/generic/answer', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic Og==',
        'Content-Type': 'application/json',
        'User-Agent': 'report-test-automation-nextjs/1.0.0'
      },
      body: JSON.stringify({
        ai_agent_id: "682ac9d8c93b572e5359f06e",
        user_query: query || "what is a warehouse",
        configuration_environment: "DEV"
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      data: data,
      status: response.status
    });
    
  } catch (error) {
    console.error('LLM Agent API Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      details: error.cause || 'Unknown error occurred'
    }, { status: 500 });
  }
}

export async function GET() {
  // Test with a simple query
  try {
    const response = await fetch('https://sysco-gen-ai-platform.labseag.us-east-1.aws.sysco.net/api/sysco-gen-ai-platform/agents/v1/content/generic/answer', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic Og==',
        'Content-Type': 'application/json',
        'User-Agent': 'report-test-automation-nextjs/1.0.0'
      },
      body: JSON.stringify({
        ai_agent_id: "682ac9d8c93b572e5359f06e",
        user_query: "what is a warehouse",
        configuration_environment: "DEV"
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      message: 'LLM Agent is working!',
      data: data,
      status: response.status,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('LLM Agent API Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      details: error.cause || 'Unknown error occurred',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
