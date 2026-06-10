import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const location = searchParams.get('location') || process.env.NEXT_PUBLIC_YELP_DEFAULT_LOCATION || 'San Francisco, CA';
  const term = searchParams.get('term') || 'food';

  const apiKey = process.env.YELP_API_KEY;

  if (!apiKey) {
    // Return mock data if no API key is provided, so the hackathon app doesn't break entirely
    return NextResponse.json({
      businesses: [
        { id: '1', name: 'Mock Pizza Place', image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591', rating: 4.5 },
        { id: '2', name: 'Mock Burger Joint', image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd', rating: 4.2 },
        { id: '3', name: 'Mock Sushi Spot', image_url: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c', rating: 4.8 },
      ]
    });
  }

  try {
    const response = await fetch(
      `https://api.yelp.com/v3/businesses/search?location=${encodeURIComponent(location)}&term=${encodeURIComponent(term)}&limit=10`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          accept: 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Yelp API error: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching from Yelp API:', error);
    return NextResponse.json({ error: 'Failed to fetch food options' }, { status: 500 });
  }
}
