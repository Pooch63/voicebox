import { NextResponse } from 'next/server';
import { createClient } from "@/lib/supabase-server";

export async function GET() {
  try {
    const supabase = await createClient();
    
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Get current user (patient)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { food_name, restaurant_name, order_details } = body;

    if (!restaurant_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get all caregivers for this patient
    const { data: patientCaregivers, error: pcError } = await supabase
      .from("patient_caregivers")
      .select("caregiver_id, caregivers(name)")
      .eq("patient_id", user.id);

    if (pcError || !patientCaregivers || patientCaregivers.length === 0) {
      return NextResponse.json({ error: "No caregivers found" }, { status: 404 });
    }

    // Get patient name
    const { data: patient } = await supabase
      .from("users")
      .select("name")
      .eq("user_id", user.id)
      .single();

    const patientName = patient?.name || "Patient";

    // Create order for each caregiver and notification
    const results = [];
    
    for (const pc of patientCaregivers) {
      // Create order
      const { data: newOrder, error: orderError } = await supabase
        .from('orders')
        .insert({
          patient_id: user.id,
          caregiver_id: pc.caregiver_id,
          food_name,
          restaurant_name,
          order_details: order_details || {},
          status: 'pending',
        })
        .select()
        .single();

      if (orderError) {
        console.error('Error creating order:', orderError);
        continue;
      }

      // Create notification
      const { data: notification, error: notifError } = await supabase
        .from('notifications')
        .insert({
          patient_id: user.id,
          caregiver_id: pc.caregiver_id,
          notification_type: 'food_order',
          title: '🍔 Food Order Request',
          message: `${patientName} wants to order from ${restaurant_name}`,
          metadata: {
            order_id: newOrder.order_id,
            restaurant_name,
            food_name,
            order_details: order_details || {}
          },
          priority: 'normal',
          status: 'pending'
        })
        .select()
        .single();

      if (!notifError) {
        // Link notification to order
        await supabase
          .from('orders')
          .update({ notification_id: notification.notification_id })
          .eq('order_id', newOrder.order_id);
      }

      results.push({ order: newOrder, notification });
    }

    return NextResponse.json({ success: true, results }, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
