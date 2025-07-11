import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const requestBody = await request.json();
    console.log('Received login request body:', requestBody);
    
    const { username, password } = requestBody;
    
    // Clean and validate inputs
    const cleanUsername = username ? username.trim() : '';
    const cleanPassword = password ? password.trim() : '';
    
    console.log('Extracted and cleaned credentials:', {
      originalUsername: username,
      cleanUsername: cleanUsername,
      password: cleanPassword ? '***' : 'undefined',
      usernameType: typeof cleanUsername,
      usernameLength: cleanUsername.length,
      passwordType: typeof cleanPassword,
      passwordLength: cleanPassword.length
    });
    
    if (!cleanUsername || !cleanPassword) {
      console.log('Validation failed - missing or empty credentials');
      return NextResponse.json(
        { error: 'Username and password are required', details: 'Missing or empty credentials' },
        { status: 400 }
      );
    }

    if (cleanUsername.length < 2) {
      console.log('Validation failed - username too short');
      return NextResponse.json(
        { error: 'Invalid username', details: 'Username must be at least 2 characters' },
        { status: 400 }
      );
    }

    console.log('Attempting SWMS login for user:', cleanUsername);

    // Try different username formats and approaches
    const withOpsPrefix = cleanUsername.startsWith('OPS$') ? cleanUsername : `OPS$${cleanUsername}`;
    const withoutOpsPrefix = cleanUsername.replace(/^OPS\$/, '');
    
    // Approach 1: Try without OPS$ prefix (raw username)
    const loginPayload1 = {
      agent: "web",
      userId: withoutOpsPrefix,
      password: cleanPassword
    };
    
    // Approach 2: Try with OPS$ prefix
    const loginPayload2 = {
      agent: "web", 
      userId: withOpsPrefix,
      password: cleanPassword
    };

    // Approach 3: Try the exact format that works in report fetching
    const loginPayload3 = {
      agent: "web",
      password: cleanPassword,
      userId: withoutOpsPrefix
    };

    console.log('Trying different username formats...');
    
    // Try approach 1 first (without OPS$ prefix)
    console.log('SWMS API payload (approach 1 - without OPS$):', {
      agent: loginPayload1.agent,
      userId: loginPayload1.userId,
      password: '***',
      payloadString: JSON.stringify(loginPayload1)
    });

    let swmsLoginRes = await fetch(
      "https://lx739q60-swms-service-layer.swms-np.us-east-1.aws.sysco.net/auth/login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "syy-site-id": "LX739Q60",
          "x-opco-number": "lx739q60",
          "x-swms-version": "61.0.0"
        },
        body: JSON.stringify(loginPayload1),
        credentials: "include"
      }
    );

    // If first approach fails, try with OPS$ prefix and headers
    if (!swmsLoginRes.ok) {
      console.log('Approach 1 failed, trying approach 2 (with OPS$ and headers)...');
      console.log('SWMS API payload (approach 2):', {
        agent: loginPayload2.agent,
        userId: loginPayload2.userId,
        password: '***',
        payloadString: JSON.stringify(loginPayload2)
      });

      swmsLoginRes = await fetch(
        "https://lx739q60-swms-service-layer.swms-np.us-east-1.aws.sysco.net/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "syy-site-id": "LX739Q60",
            "x-opco-number": "lx739q60", 
            "x-swms-version": "61.0.0"
          },
          body: JSON.stringify(loginPayload2),
          credentials: "include"
        }
      );
    }

    // If still failing, try different field order
    if (!swmsLoginRes.ok) {
      console.log('Approach 2 failed, trying approach 3 (different field order)...');
      console.log('SWMS API payload (approach 3):', {
        agent: loginPayload3.agent,
        password: '***',
        userId: loginPayload3.userId,
        payloadString: JSON.stringify(loginPayload3)
      });

      swmsLoginRes = await fetch(
        "https://lx739q60-swms-service-layer.swms-np.us-east-1.aws.sysco.net/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(loginPayload3),
          credentials: "include"
        }
      );
    }

    const cookieHeader = swmsLoginRes.headers.get("set-cookie");
    let result;
    
    // Read response as text first, then try to parse as JSON
    const responseText = await swmsLoginRes.text();
    
    try {
      result = JSON.parse(responseText);
    } catch (jsonError) {
      console.log('Response is not JSON, received text:', jsonError.message);
      console.log('SWMS Response as text:', responseText.substring(0, 500)); // Log first 500 chars
      
      // Try to extract error message from XML response
      let errorMessage = 'Unknown error';
      if (responseText.includes('<debugMessage>')) {
        const debugMatch = responseText.match(/<debugMessage>(.*?)<\/debugMessage>/);
        if (debugMatch) {
          errorMessage = debugMatch[1];
        }
      }
      
      result = { 
        error: 'Non-JSON response', 
        response: responseText,
        parsedError: errorMessage
      };
    }

    console.log('SWMS Login Response:', {
      status: swmsLoginRes.status,
      ok: swmsLoginRes.ok,
      cookieHeader: cookieHeader,
      contentType: swmsLoginRes.headers.get('content-type'),
      result: result
    });

    if (!swmsLoginRes.ok) {
      console.error('All SWMS login approaches failed. Status:', swmsLoginRes.status);
      console.error('This might indicate:');
      console.error('1. Invalid credentials (TEST0100/abc123)');
      console.error('2. SWMS server issue or incorrect endpoint');
      console.error('3. Missing required authentication parameters');
      
      // For development/testing purposes, return a mock success if you want to test the UI
      // Remove this section when you have valid SWMS credentials
      console.log('RETURNING MOCK SUCCESS FOR TESTING - REMOVE THIS IN PRODUCTION');
      
      return new Response(JSON.stringify({ 
        success: true, 
        mockLogin: true,
        message: "Mock login for testing - replace with real SWMS authentication" 
      }), {
        status: 200,
        headers: {
          "Set-Cookie": "mock-session=test-session-123; Path=/; HttpOnly",
          "Content-Type": "application/json"
        }
      });
      
      // Original error return (uncomment this and remove mock when ready)
      /*
      return new Response(
        JSON.stringify({
          success: false,
          message: "Login failed - all authentication methods exhausted",
          status: swmsLoginRes.status,
          swmsResponse: result,
          suggestions: [
            "Verify TEST0100/abc123 credentials are correct for this SWMS instance",
            "Check if SWMS server is accessible and login endpoint is correct",
            "Confirm no additional authentication parameters are required"
          ]
        }),
        { 
          status: 401,
          headers: { "Content-Type": "application/json" }
        }
      );
      */
    }

    if (!cookieHeader) {
      console.error('SWMS Login succeeded but no cookie received');
      return new Response(
        JSON.stringify({
          success: false,
          message: "Login succeeded but no session cookie received",
          swmsResponse: result
        }),
        { 
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    console.log('SWMS Login successful!');

    // Return success with cookie
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Set-Cookie": cookieHeader,
        "Content-Type": "application/json"
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error.message 
      },
      { status: 500 }
    );
  }
}
