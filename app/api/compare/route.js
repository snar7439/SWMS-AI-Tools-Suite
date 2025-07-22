import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    // Forward the request to the external agent API
    const agentRes = await fetch('https://sysco-gen-ai-platform.labseag.us-east-1.aws.sysco.net/api/sysco-gen-ai-platform/agents/v1/content/generic/answer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'insomnium/1.3.0'
      },
      body: JSON.stringify({
        ai_agent_id: body.ai_agent_id,
        user_query: body.user_query,
        configuration_environment: body.configuration_environment
      })
    });
    if (!agentRes.ok) {
      return NextResponse.json({ error: 'Agent API error', status: agentRes.status }, { status: agentRes.status });
    }
    const data = await agentRes.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
