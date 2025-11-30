import { NextResponse } from 'next/server';
import { readFile, writeFile } from 'fs/promises';
import { join, resolve } from 'path';
import { existsSync } from 'fs';

// Path to cart.json (should match backend location)
function getCartFilePath(): string {
  const possiblePaths = [
    join(process.cwd(), 'backend', 'cart.json'),
    resolve(process.cwd(), 'backend', 'cart.json'),
    join(process.cwd(), '..', 'backend', 'cart.json'),
  ];
  
  for (const path of possiblePaths) {
    if (existsSync(path)) {
      console.log('✅ Found cart file at:', path);
      return path;
    }
  }
  
  // Default to the most likely path
  const defaultPath = join(process.cwd(), 'backend', 'cart.json');
  console.log('⚠️ Using default path (may not exist):', defaultPath);
  return defaultPath;
}

const CART_FILE = getCartFilePath();

export async function GET() {
  try {
    console.log('🛒 GET /api/cart - Looking for file at:', CART_FILE);
    
    // Check if cart file exists
    if (!existsSync(CART_FILE)) {
      console.log('⚠️ Cart file does not exist at:', CART_FILE);
      // Return empty array if file doesn't exist
      return NextResponse.json([]);
    }

    console.log('✅ Cart file exists, reading...');
    // Read cart from file
    const fileContent = await readFile(CART_FILE, 'utf-8');
    const cart = JSON.parse(fileContent || '[]');

    console.log('🛒 Parsed cart:', cart.length, 'items found');
    
    // Ensure it's an array
    if (!Array.isArray(cart)) {
      console.log('⚠️ Cart is not an array:', typeof cart);
      return NextResponse.json([]);
    }

    console.log('✅ Returning', cart.length, 'cart items');
    return NextResponse.json(cart);
  } catch (error) {
    console.error('❌ Error reading cart:', error);
    // Return empty array on error
    return NextResponse.json([]);
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { product_id, quantity } = body;
    
    if (!product_id || quantity === undefined) {
      return NextResponse.json(
        { error: 'product_id and quantity are required' },
        { status: 400 }
      );
    }
    
    if (quantity < 1) {
      return NextResponse.json(
        { error: 'Quantity must be at least 1' },
        { status: 400 }
      );
    }
    
    // Load existing cart
    let cart = [];
    if (existsSync(CART_FILE)) {
      const fileContent = await readFile(CART_FILE, 'utf-8');
      cart = JSON.parse(fileContent || '[]');
    }
    
    // Find the item in cart
    const itemIndex = cart.findIndex((item: any) => item.product_id === product_id);
    if (itemIndex === -1) {
      return NextResponse.json(
        { error: 'Product not found in cart' },
        { status: 404 }
      );
    }
    
    // Update the quantity
    cart[itemIndex].quantity = quantity;
    
    // Save updated cart
    await writeFile(CART_FILE, JSON.stringify(cart, null, 2), 'utf-8');
    
    return NextResponse.json(cart);
  } catch (error) {
    console.error('Error updating cart:', error);
    return NextResponse.json(
      { error: 'Failed to update cart' },
      { status: 500 }
    );
  }
}

