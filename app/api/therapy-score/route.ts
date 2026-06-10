import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const audio = formData.get('audio') as Blob;
    const targetWord = formData.get('targetWord') as string;

    if (!audio || !targetWord) {
      return NextResponse.json({ error: 'Missing audio or targetWord' }, { status: 400 });
    }

    const arrayBuffer = await audio.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const apiKey = process.env.DEEPGRAM_API_KEY;
    if (!apiKey) {
      throw new Error('DEEPGRAM_API_KEY is not set');
    }

    const res = await fetch(
      `https://api.deepgram.com/v1/listen?search=${encodeURIComponent(targetWord)}&punctuate=true`,
      {
        method: "POST",
        headers: {
          Authorization: `Token ${apiKey}`,
          "Content-Type": audio.type || "audio/webm"
        },
        body: buffer
      }
    );

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Deepgram API Error:', errorText);
      throw new Error('Failed to process audio with Deepgram');
    }
    
    const data = await res.json();

    const channel = data.results?.channels?.[0];
    const alternative = channel?.alternatives?.[0];
    const searchHit = channel?.search?.[0]?.hits?.[0];

    if (!channel || !alternative || !alternative.words || alternative.words.length === 0) {
      return NextResponse.json({ score: 0, error: 'No words detected' });
    }

    const actualText = alternative.transcript;
    const firstWord = alternative.words[0];
    
    let correctnessScore = 0.0;
    let clarityScore = 0.0;
    let durationMs = (firstWord.end - firstWord.start) * 1000;
    let confidence = firstWord.confidence;

    // If Deepgram found the search term, use its specific confidence and duration
    if (searchHit) {
      correctnessScore = 1.0;
      clarityScore = searchHit.confidence;
      durationMs = (searchHit.end - searchHit.start) * 1000;
      confidence = searchHit.confidence;
    } else {
      // Fallback check if the transcript happened to catch it without a direct search hit
      const normalize = (s: string) => s.trim().toLowerCase().replace(/[^\w\s]/g, '');
      const correctWord = normalize(actualText).includes(normalize(targetWord));
      if (correctWord) {
        correctnessScore = 1.0;
      }
      clarityScore = confidence;
    }

    const speedScore = durationMs < 2000 ? 1.0 : Math.max(0, 1 - (durationMs - 2000) / 3000);
    const finalScore = (correctnessScore * 0.5) + (clarityScore * 0.35) + (speedScore * 0.15);

    return NextResponse.json({
      score: finalScore,
      details: {
        correctnessScore,
        clarityScore,
        speedScore,
        transcript: actualText,
        confidence,
        durationMs
      }
    });

  } catch (error: any) {
    console.error('Error in therapy-score:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
