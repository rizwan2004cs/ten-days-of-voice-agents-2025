import { NextResponse } from 'next/server';
import { readFile, writeFile } from 'fs/promises';
import { join, resolve } from 'path';
import { existsSync } from 'fs';

// Path to orders.json (should match backend location)
// For Next.js API routes, we'll use a relative path from the project root
// Try multiple possible paths
function getOrdersFilePath(): string {
  const possiblePaths = [
    join(process.cwd(), 'backend', 'orders.json'),
    resolve(process.cwd(), 'backend', 'orders.json'),
    join(process.cwd(), '..', 'backend', 'orders.json'),
  ];
  
  for (const path of possiblePaths) {
    if (existsSync(path)) {
      console.log('✅ Found orders file at:', path);
      return path;
    }
  }
  
  // Default to the most likely path
  const defaultPath = join(process.cwd(), 'backend', 'orders.json');
  console.log('⚠️ Using default path (may not exist):', defaultPath);
  return defaultPath;
}

const ORDERS_FILE = getOrdersFilePath();

export async function GET() {
  try {
    console.log('📦 GET /api/orders - Looking for file at:', ORDERS_FILE);
    console.log('📦 process.cwd():', process.cwd());
    
    // Check if orders file exists
    if (!existsSync(ORDERS_FILE)) {
      console.log('⚠️ Orders file does not exist at:', ORDERS_FILE);
      // Return empty array if file doesn't exist
      return NextResponse.json([]);
    }

    console.log('✅ Orders file exists, reading...');
    // Read orders from file
    const fileContent = await readFile(ORDERS_FILE, 'utf-8');
    const orders = JSON.parse(fileContent || '[]');

    console.log('📦 Parsed orders:', orders.length, 'orders found');
    
    // Ensure it's an array
    if (!Array.isArray(orders)) {
      console.log('⚠️ Orders is not an array:', typeof orders);
      return NextResponse.json([]);
    }

    console.log('✅ Returning', orders.length, 'orders');
    return NextResponse.json(orders);
  } catch (error) {
    console.error('❌ Error reading orders:', error);
    // Return empty array on error
    return NextResponse.json([]);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { product_id, quantity = 1 } = body;
    
    if (!product_id) {
      return NextResponse.json(
        { error: 'product_id is required' },
        { status: 400 }
      );
    }
    
    // Import the commerce functions (we'll need to create a shared module or call Python)
    // For now, we'll create the order directly in the API route
    const { readFile, writeFile } = await import('fs/promises');
    const { join } = await import('path');
    const { randomUUID } = await import('crypto');
    
    // Import catalog to get product details
    const { CATALOG } = await import('@/lib/catalog');
    const catalog = CATALOG;
    
    const product = catalog.find(p => p.id === product_id);
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    // Create order
    const order = {
      id: randomUUID(),
      items: [{
        product_id: product_id,
        product_name: product.name,
        quantity: quantity,
        unit_amount: product.price,
        currency: product.currency,
      }],
      total: product.price * quantity,
      currency: product.currency,
      status: "CONFIRMED",
      created_at: new Date().toISOString(),
    };
    
    // Load existing orders and append
    let orders = [];
    if (existsSync(ORDERS_FILE)) {
      const fileContent = await readFile(ORDERS_FILE, 'utf-8');
      orders = JSON.parse(fileContent || '[]');
    }
    
    orders.push(order);
    await writeFile(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf-8');
    
    return NextResponse.json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { order_id, item_index, quantity } = body;
    
    if (!order_id || item_index === undefined || quantity === undefined) {
      return NextResponse.json(
        { error: 'order_id, item_index, and quantity are required' },
        { status: 400 }
      );
    }
    
    if (quantity < 1) {
      return NextResponse.json(
        { error: 'Quantity must be at least 1' },
        { status: 400 }
      );
    }
    
    // Load existing orders
    let orders = [];
    if (existsSync(ORDERS_FILE)) {
      const fileContent = await readFile(ORDERS_FILE, 'utf-8');
      orders = JSON.parse(fileContent || '[]');
    }
    
    // Find the order
    const orderIndex = orders.findIndex((o: any) => o.id === order_id);
    if (orderIndex === -1) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }
    
    const order = orders[orderIndex];
    
    // Update the item quantity
    if (item_index < 0 || item_index >= order.items.length) {
      return NextResponse.json(
        { error: 'Invalid item index' },
        { status: 400 }
      );
    }
    
    order.items[item_index].quantity = quantity;
    
    // Recalculate total
    order.total = order.items.reduce((sum: number, item: any) => {
      return sum + (item.unit_amount * item.quantity);
    }, 0);
    
    // Save updated orders
    await writeFile(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf-8');
    
    return NextResponse.json(order);
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { order_id, item_index } = body;
    
    if (!order_id || item_index === undefined) {
      return NextResponse.json(
        { error: 'order_id and item_index are required' },
        { status: 400 }
      );
    }
    
    // Load existing orders
    let orders = [];
    if (existsSync(ORDERS_FILE)) {
      const fileContent = await readFile(ORDERS_FILE, 'utf-8');
      orders = JSON.parse(fileContent || '[]');
    }
    
    // Find the order
    const orderIndex = orders.findIndex((o: any) => o.id === order_id);
    if (orderIndex === -1) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }
    
    const order = orders[orderIndex];
    
    // Validate item index
    if (item_index < 0 || item_index >= order.items.length) {
      return NextResponse.json(
        { error: 'Invalid item index' },
        { status: 400 }
      );
    }
    
    // Remove the item
    order.items.splice(item_index, 1);
    
    // If no items left, remove the entire order
    if (order.items.length === 0) {
      orders.splice(orderIndex, 1);
    } else {
      // Recalculate total
      order.total = order.items.reduce((sum: number, item: any) => {
        return sum + (item.unit_amount * item.quantity);
      }, 0);
    }
    
    // Save updated orders
    await writeFile(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf-8');
    
    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error('Error removing item from order:', error);
    return NextResponse.json(
      { error: 'Failed to remove item' },
      { status: 500 }
    );
  }
}

