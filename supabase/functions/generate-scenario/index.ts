import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface GenerateScenarioRequest {
  currentDay: number;
  currentMetrics: {
    health: number;
    hunger: number;
    thirst: number;
    energy: number;
    morale: number;
    warmth: number;
  };
  previousDecisions?: string[];
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const { currentDay, currentMetrics, previousDecisions }: GenerateScenarioRequest = await req.json();

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: apiKeyData, error: apiKeyError } = await supabase
      .from('game_settings')
      .select('setting_value')
      .eq('setting_key', 'openai_api_key')
      .maybeSingle();

    if (apiKeyError || !apiKeyData?.setting_value) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured in database settings.' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const openaiApiKey = apiKeyData.setting_value;

    let pdfContent = '';
    try {
      const pdfResponse = await fetch(`${supabaseUrl}/functions/v1/extract-pdf-content`, {
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
      });

      if (pdfResponse.ok) {
        const pdfData = await pdfResponse.json();
        pdfContent = pdfData.text || '';
      }
    } catch (error) {
      console.log('PDF extraction failed, using default survival knowledge');
    }

    const survivalGuide = pdfContent || `
Basic Wilderness Survival Principles:

1. Priorities of Survival (Rule of Threes):
   - 3 minutes without air
   - 3 hours without shelter (in harsh conditions)
   - 3 days without water
   - 3 weeks without food

2. Shelter:
   - Protection from elements is critical
   - Build in safe location away from hazards
   - Insulate from ground
   - Consider wind direction and water drainage

3. Water:
   - Find clean water sources
   - Purify before drinking (boiling, filtering)
   - Collect rainwater or dew
   - Avoid drinking unpurified water

4. Fire:
   - Provides warmth, cooking, water purification, and morale
   - Gather tinder, kindling, and fuel wood
   - Protect from wind and rain
   - Never leave unattended

5. Food:
   - Low priority initially
   - Know edible plants in your area
   - Fishing and trapping require less energy than hunting
   - Universal edibility test for unknown plants

6. Signaling:
   - Three of anything is universal distress signal
   - Use fire, mirrors, bright materials
   - Create visible ground signals

7. Mental Attitude:
   - Stay positive and focused
   - STOP: Sit, Think, Observe, Plan
   - Panic is your worst enemy
   - Small successes build confidence
`;

    const prompt = `You are a survival scenario generator for a wilderness survival game. Use the following survival guide content to create realistic scenarios:

${survivalGuide.substring(0, 8000)}

Current game state:
- Day: ${currentDay}
- Health: ${currentMetrics.health}%
- Hunger: ${currentMetrics.hunger}%
- Thirst: ${currentMetrics.thirst}%
- Energy: ${currentMetrics.energy}%
- Morale: ${currentMetrics.morale}%
- Warmth: ${currentMetrics.warmth}%
${previousDecisions ? `- Previous decisions: ${previousDecisions.join(', ')}` : ''}

Generate a survival scenario with 3 decision options based on the survival guide. Each decision should have realistic impacts on the metrics.

IMPORTANT: When describing scenarios and decisions:
- The player knows their own body status (energy, hunger, thirst, warmth, morale)
- Unknown factors must be EXTERNAL (weather changes, animal behavior, terrain hazards, resource availability) or INTERNAL INJURIES not yet discovered
- Never describe the player's own energy reserves or basic body status as "unknown"
- Focus on environmental uncertainties and hidden dangers

Respond with valid JSON only (no markdown):
{
  "scenario": {
    "title": "Brief title",
    "description": "Detailed scenario description based on survival guide principles",
    "environment": "forest" | "mountain" | "desert" | "tundra",
    "timeOfDay": "morning" | "afternoon" | "evening" | "night",
    "weather": "clear" | "rain" | "storm" | "snow" | "fog"
  },
  "decisions": [
    {
      "id": "decision_1",
      "text": "Decision option text",
      "reasoning": "Why this choice based on survival guide",
      "metrics": {
        "health": 0,
        "hunger": -5,
        "thirst": -3,
        "energy": -10,
        "morale": 5,
        "warmth": 0
      },
      "risk": "low" | "medium" | "high"
    }
  ],
  "briefing": "Post-decision briefing explaining what happened and survival lessons learned"
}`;

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a survival scenario generator. Always respond with valid JSON only, no markdown formatting.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.8,
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      return new Response(
        JSON.stringify({ error: 'OpenAI API error', details: errorText }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const openaiData = await openaiResponse.json();
    let generatedContent = openaiData.choices[0].message.content;

    generatedContent = generatedContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const scenarioData = JSON.parse(generatedContent);

    return new Response(
      JSON.stringify(scenarioData),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});