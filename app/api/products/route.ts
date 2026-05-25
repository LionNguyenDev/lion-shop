import { NextResponse } from 'next/server';
import { getAllProducts, createProduct } from '@/lib/services/productService';


export async function GET() {
  try {
    const products = await getAllProducts();
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    console.error('Error fetching products:', error);
  }
}


export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.name || body.originalPrice === undefined || body.sellingPrice === undefined || body.stock === undefined || !body.image) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const product = await createProduct(body);
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
    console.error('Error creating product:', error);
  }
}

