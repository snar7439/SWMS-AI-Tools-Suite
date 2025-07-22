import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const body = await req.json();
    const response = await fetch('https://sysco-gen-ai-platform.labseag.us-east-1.aws.sysco.net/api/sysco-gen-ai-platform/agents/v1/content/rag/answer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ai_agent_id: body.ai_agent_id,
        user_query: body.user_query,
        configuration_environment: body.configuration_environment,
      }),
    });

    let data;
    let text = await response.text();
    try {
      data = JSON.parse(text);
    } catch (e) {
      data = { raw: text };
    }

    // Log the backend response for debugging
    // eslint-disable-next-line no-console
    console.log('Sysco GenAI backend response:', data);

    // Always return an 'answer' field for the frontend
    let answer =
      data?.answer ||
      data?.content ||
      data?.raw ||
      data?.data?.responses?.agent_response ||
      '';
    if (!answer && typeof data === 'string') answer = data;

    return NextResponse.json({
      answer,
      format: 'slack-markdown',
      _debug: {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        backend: data
      }
    }, { status: response.status });
  } catch (error) {
    return NextResponse.json({ error: 'Proxy error', details: error.message }, { status: 500 });
  }
}
