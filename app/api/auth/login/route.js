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

    // Ensure we have clean, non-null values
    const withOpsPrefix = cleanUsername.startsWith('OPS$') ? cleanUsername : `OPS$${cleanUsername}`;
    const withoutOpsPrefix = cleanUsername.replace(/^OPS\$/, '');
    
    // Validate that we have proper userId values
    if (!withoutOpsPrefix || withoutOpsPrefix.trim() === '') {
      return NextResponse.json(
        { error: 'Invalid username', details: 'Username cannot be empty after processing' },
        { status: 400 }
      );
    }

    console.log('Username processing:', {
      original: cleanUsername,
      withoutOps: withoutOpsPrefix,
      withOps: withOpsPrefix
    });
    
    // Use the comprehensive approach with all required headers (previously approach 4)
    const loginPayload = {
      "userId": withoutOpsPrefix,
      "password": cleanPassword,
      "agent": "web"
    };

    console.log('SWMS API payload:', {
      userId: loginPayload.userId,
      password: loginPayload.password ? '***' : 'null/undefined',
      agent: loginPayload.agent,
      userIdLength: loginPayload.userId?.length || 0,
      payloadString: JSON.stringify(loginPayload)
    });

    // Validate payload before sending
    if (!loginPayload.userId || !loginPayload.password) {
      throw new Error('Payload validation failed: userId or password is null/undefined');
    }

    const swmsLoginRes = await fetch(
      "https://lx739q21-swms-service-layer.swms-np.us-east-1.aws.sysco.net/auth/login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "syy-site-id": "LX739Q21",
          "x-opco-number": "lx739q21",
          "x-swms-version": "61.0.0",
          "x-session-user-id": withoutOpsPrefix,
          "accept": "application/json",
          "user-agent": "SWMS-Report-Tool/1.0"
        },
        body: JSON.stringify(loginPayload),
        credentials: "include"
      }
    );

    // Extract ALL cookies from the response
    const allCookieHeaders = [];
    
    // Get all Set-Cookie headers (there might be multiple)
    for (const [key, value] of swmsLoginRes.headers.entries()) {
      if (key.toLowerCase() === 'set-cookie') {
        allCookieHeaders.push(value);
      }
    }
    
    // Alternative method to get all cookies if the above doesn't work
    const cookieHeaderString = swmsLoginRes.headers.get("set-cookie");
    
    console.log('All cookie headers found:', {
      allCookieHeaders: allCookieHeaders,
      cookieHeaderString: cookieHeaderString
    });
    
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
      allCookieHeaders: allCookieHeaders,
      cookieHeaderString: cookieHeaderString,
      contentType: swmsLoginRes.headers.get('content-type'),
      result: result
    });

    if (!swmsLoginRes.ok) {
      console.error('SWMS login failed. Status:', swmsLoginRes.status);
      console.error('SWMS Response Details:', {
        status: swmsLoginRes.status,
        statusText: swmsLoginRes.statusText,
        response: result
      });
      
      return new Response(
        JSON.stringify({
          success: false,
          message: "SWMS Authentication failed",
          status: swmsLoginRes.status,
          details: result?.parsedError || result?.error || 'Invalid credentials or SWMS server issue',
          suggestions: [
            "Verify your SWMS username and password are correct",
            "Check if SWMS server is accessible",
            "Ensure you have access to LX739Q21 environment"
          ]
        }),
        { 
          status: 401,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    if (!allCookieHeaders.length && !cookieHeaderString) {
      console.error('SWMS Login succeeded but no cookies received');
      return new Response(
        JSON.stringify({
          success: false,
          message: "Login succeeded but no session cookies received",
          swmsResponse: result
        }),
        { 
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    console.log('SWMS Login successful! Processing all session cookies...');

    // Process all cookies from SWMS response
    const cookiesToSet = [];
    const allCookiesForSession = [];
    
    // Function to extract cookie name and value from a Set-Cookie string
    const parseCookie = (cookieString) => {
      const parts = cookieString.split(';')[0].trim(); // Get name=value part
      const [name, value] = parts.split('=');
      return { name: name?.trim(), value: value?.trim() };
    };
    
    // Process all cookie headers
    if (allCookieHeaders.length > 0) {
      allCookieHeaders.forEach(cookieHeader => {
        if (cookieHeader) {
          // Split multiple cookies if they're in one header (separated by commas)
          const cookies = cookieHeader.split(',').map(c => c.trim());
          cookies.forEach(cookie => {
            const parsed = parseCookie(cookie);
            if (parsed.name && parsed.value) {
              console.log(`Found cookie: ${parsed.name} = ${parsed.value}`);
              allCookiesForSession.push(`${parsed.name}=${parsed.value}`);
              
              // Set individual cookies for our application
              cookiesToSet.push(`swms-${parsed.name}=${parsed.value}; Path=/; HttpOnly; SameSite=Lax`);
            }
          });
        }
      });
    } else if (cookieHeaderString) {
      // Fallback to single header processing
      const cookies = cookieHeaderString.split(',').map(c => c.trim());
      cookies.forEach(cookie => {
        const parsed = parseCookie(cookie);
        if (parsed.name && parsed.value) {
          console.log(`Found cookie: ${parsed.name} = ${parsed.value}`);
          allCookiesForSession.push(`${parsed.name}=${parsed.value}`);
          
          // Set individual cookies for our application
          cookiesToSet.push(`swms-${parsed.name}=${parsed.value}; Path=/; HttpOnly; SameSite=Lax`);
        }
      });
    }
    
    // Also add the username cookie
    cookiesToSet.push(`swms-username=${withOpsPrefix}; Path=/; HttpOnly; SameSite=Lax`);
    
    // Create a combined cookie string for session storage
    const combinedCookieString = allCookiesForSession.join('; ');
    cookiesToSet.push(`swms-session-all=${combinedCookieString}; Path=/; HttpOnly; SameSite=Lax`);
    
    console.log('Setting cookies:', {
      individualCookies: allCookiesForSession,
      combinedCookieString: combinedCookieString,
      totalCookiesSet: cookiesToSet.length
    });

    // Return success with properly set cookies for our application
    return new Response(JSON.stringify({ 
      success: true,
      message: "Login successful",
      username: withOpsPrefix,
      cookiesSet: allCookiesForSession.length
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        // Set all cookies
        "Set-Cookie": cookiesToSet
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
