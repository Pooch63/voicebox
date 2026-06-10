import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const orders = await db('orders').where('status', 'pending').orderBy('created_at', 'desc');
    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { food_name, restaurant_name } = body;

    if (!food_name || !restaurant_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const [newOrder] = await db('orders')
      .insert({
        food_name,
        restaurant_name,
        status: 'pending',
      })
      .returning('*');

    return NextResponse.json(newOrder, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
