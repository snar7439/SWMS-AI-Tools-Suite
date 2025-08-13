import { NextResponse } from 'next/server';
import { HfInference } from '@huggingface/inference';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(request) {
  try {
    console.log('[DEBUG] Starting report comparison with Hugging Face...');
    
    const body = await request.json();
    const { ai_agent_id, user_query, configuration_environment } = body;
    
    if (!user_query) {
      return NextResponse.json({ 
        error: 'Missing user_query parameter' 
      }, { status: 400 });
    }

    // Parse the user_query to get the two reports for comparison
    let parsedQuery;
    try {
      parsedQuery = JSON.parse(user_query);
    } catch (parseError) {
      return NextResponse.json({ 
        error: 'Invalid user_query format', 
        details: 'user_query must be valid JSON' 
      }, { status: 400 });
    }

    const { baseline, test } = parsedQuery;
    
    if (!baseline || !test) {
      return NextResponse.json({ 
        error: 'Missing baseline or test report in user_query' 
      }, { status: 400 });
    }

    // Create the comparison prompt for Hugging Face
    const prompt = `You are an expert analyst comparing two reports. Please provide a detailed comparison analysis.

BASELINE REPORT:
${JSON.stringify(baseline, null, 2)}

TEST REPORT:
${JSON.stringify(test, null, 2)}

TASK: Compare these two reports and provide detailed insights about their similarities, differences, and overall alignment.

Please return your response in JSON format with the following structure:
{
  "comparison_summary": "Overall summary of the comparison",
  "similarity_score": 85,
  "key_differences": [
    {
      "category": "Data Values",
      "difference": "Description of specific difference",
      "impact": "high|medium|low"
    }
  ],
  "similarities": [
    {
      "category": "Structure",
      "similarity": "Description of what is similar"
    }
  ],
  "recommendations": [
    "Specific recommendation 1",
    "Specific recommendation 2"
  ],
  "detailed_analysis": {
    "baseline_strengths": ["Strength 1", "Strength 2"],
    "test_improvements": ["Improvement 1", "Improvement 2"],
    "concerns": ["Concern 1", "Concern 2"]
  }
}`;

    // Call Hugging Face API using the official client
    const HF_TOKEN = process.env.HF_TOKEN;
    const HF_MODEL = process.env.HF_MODEL || "microsoft/DialoGPT-medium";

    if (!HF_TOKEN) {
      return NextResponse.json({
        error: 'Server misconfigured: missing HF_TOKEN'
      }, { status: 500 });
    }

    console.log('[DEBUG] Using Hugging Face model for comparison:', HF_MODEL);

    // Initialize variables outside try block to avoid scope issues
    let parsedResult = null;

    try {
      const hf = new HfInference(HF_TOKEN);
      
      console.log('[DEBUG] Calling Hugging Face API for report comparison...');

      // Use textGeneration for most models, or chatCompletion for chat models
      let response;
      let generatedText = '';

      // Check if it's a chat model
      const isChatModel = HF_MODEL.toLowerCase().includes('chat') || 
                         HF_MODEL.toLowerCase().includes('instruct') || 
                         HF_MODEL.toLowerCase().includes('gemma') ||
                         HF_MODEL.toLowerCase().includes('gpt-oss') ||
                         HF_MODEL.toLowerCase().includes('conversational');

      if (isChatModel) {
        // Use chat completion for conversational models
        response = await hf.chatCompletion({
          model: HF_MODEL,
          messages: [{ role: "user", content: prompt }],
          max_tokens: 2048,
          temperature: 0.3,
        });
        
        if (response && response.choices && response.choices.length > 0) {
          generatedText = response.choices[0].message.content;
        }
      } else {
        // Use text generation for other models, with fallback to chat completion
        try {
          response = await hf.textGeneration({
            model: HF_MODEL,
            inputs: prompt,
            parameters: {
              max_new_tokens: 2048,
              temperature: 0.3,
              top_p: 0.9,
              repetition_penalty: 1.1,
              return_full_text: false
            }
          });
          
          generatedText = response.generated_text;
        } catch (textGenError) {
          console.log('[WARNING] Text generation failed, trying chat completion:', textGenError.message);
          
          // Fallback to chat completion if text generation fails
          response = await hf.chatCompletion({
            model: HF_MODEL,
            messages: [{ role: "user", content: prompt }],
            max_tokens: 2048,
            temperature: 0.3,
          });
          
          if (response && response.choices && response.choices.length > 0) {
            generatedText = response.choices[0].message.content;
          }
        }
      }

      console.log('[DEBUG] Hugging Face response received');
      console.log('[DEBUG] Generated text length:', generatedText?.length || 0);

      if (!generatedText) {
        console.log('[WARNING] No generated text found in response, using fallback');
      }

      // Parse the generated text as JSON
      if (generatedText) {
        try {
          // Try to extract JSON from the generated text
          const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            parsedResult = JSON.parse(jsonMatch[0]);
          } else {
            console.log('[WARNING] No JSON found in generated text:', generatedText.substring(0, 200));
          }
        } catch (parseError) {
          console.error('[ERROR] Failed to parse generated text as JSON:', parseError);
          console.log('[DEBUG] Generated text sample:', generatedText.substring(0, 500));
        }
      }

    } catch (hfError) {
      console.error('[ERROR] Hugging Face API call failed:', hfError);
      
      // Check if it's a model not found error
      if (hfError.message && hfError.message.includes('404')) {
        return NextResponse.json({
          error: 'Model not found or not accessible',
          details: `The model "${HF_MODEL}" was not found. Please check the model name or try a different model.`,
          suggestions: [
            'microsoft/DialoGPT-medium',
            'gpt2',
            'google/flan-t5-base',
            'facebook/bart-large-cnn'
          ]
        }, { status: 404 });
      }

      // Check if it's a model loading error
      if (hfError.message && hfError.message.includes('loading')) {
        return NextResponse.json({
          error: 'Model is loading',
          details: 'Please wait a moment for the model to load and try again.',
          retryAfter: 60
        }, { status: 503 });
      }

      return NextResponse.json({ 
        error: 'Hugging Face API error', 
        details: hfError.message || 'Unknown error occurred',
        model: HF_MODEL
      }, { status: 502 });
    }

    console.log('[DEBUG] Parsed result:', {
      type: typeof parsedResult,
      content: parsedResult,
      isEmpty: !parsedResult || parsedResult === ""
    });

    if (!parsedResult || parsedResult === "" || parsedResult === null) {
      // Enhanced fallback result for comparison
      console.log('[WARNING] Creating fallback result due to empty Hugging Face response');
      const fallbackResult = {
        comparison_summary: "Hugging Face model response was empty, using fallback comparison",
        similarity_score: 50,
        key_differences: [
          {
            category: "Model Response",
            difference: "Unable to perform detailed comparison due to model response issue",
            impact: "high"
          }
        ],
        similarities: [
          {
            category: "Structure",
            similarity: "Both reports have the same basic structure"
          }
        ],
        recommendations: [
          "Check Hugging Face model configuration",
          "Verify model availability and access permissions",
          "Consider trying a different model"
        ],
        detailed_analysis: {
          baseline_strengths: ["Baseline report structure maintained"],
          test_improvements: ["Test report format preserved"],
          concerns: ["Unable to perform deep analysis due to model response issue"]
        },
        timestamp: new Date().toISOString(),
        model: HF_MODEL,
        ai_agent_id: ai_agent_id,
        configuration_environment: configuration_environment
      };

      return NextResponse.json({ 
        result: fallbackResult,
        note: "This is a fallback result due to empty model response. Check Hugging Face model configuration."
      });
    }

    // If we got a response, try to parse it
    if (typeof parsedResult === 'string') {
      try {
        parsedResult = JSON.parse(parsedResult);
      } catch (e) {
        console.log('[ERROR] Could not parse Hugging Face response as JSON:', e);
        return NextResponse.json({ 
          error: 'Invalid response format', 
          details: 'Hugging Face model returned non-JSON response',
          modelResponse: parsedResult
        }, { status: 422 });
      }
    }

    // Process the successful result - format it in the expected structure
    const result = {
      comparison_summary: parsedResult.comparison_summary || 'Comparison completed',
      similarity_score: parsedResult.similarity_score || 0,
      key_differences: parsedResult.key_differences || [],
      similarities: parsedResult.similarities || [],
      recommendations: parsedResult.recommendations || [],
      detailed_analysis: parsedResult.detailed_analysis || {
        baseline_strengths: [],
        test_improvements: [],
        concerns: []
      },
      timestamp: new Date().toISOString(),
      model: HF_MODEL,
      ai_agent_id: ai_agent_id,
      configuration_environment: configuration_environment
    };

    return NextResponse.json({ result });

  } catch (error) {
    console.error('[ERROR] Comparison failed:', error);
    return NextResponse.json({ 
      error: error.message || 'Comparison failed',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
