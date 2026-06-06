// import { NextResponse } from 'next/server';

// export async function GET() {
//   if (!process.env.DEEPGRAM_API_KEY) {
//     return NextResponse.json({ error: 'DEEPGRAM_API_KEY is not set' }, { status: 500 });
//   }

//   try {
//     const response = await fetch('https://api.deepgram.com/v1/auth/grant', {
//       method: 'POST',
//       headers: {
//         Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`,
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({ time_to_live: 3600 }),
//     });

//     if (!response.ok) {
//       throw new Error(`Deepgram grant error: ${response.status}`);
//     }

//     const data = await response.json();
//     return NextResponse.json({ key: data.access_token });
//   } catch (err) {
//     console.error('Error generating Deepgram token:', err);
//     return NextResponse.json({ error: 'Failed to generate token' }, { status: 500 });
//   }
// }

import { NextResponse } from 'next/server';

export async function GET() {
  if (!process.env.DEEPGRAM_API_KEY) {
    return NextResponse.json({ error: 'DEEPGRAM_API_KEY is not set' }, { status: 500 });
  }

  return NextResponse.json({ key: process.env.DEEPGRAM_API_KEY });
}
