import { NextRequest, NextResponse } from 'next/server'
import { getProducts, createProduct } from '@/lib/services/productService'
import { WAREHOUSES, type Warehouse } from '@/lib/types'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const search     = searchParams.get('search') || undefined
    const brand      = searchParams.get('brand')  || undefined
    const page       = Math.max(1, parseInt(searchParams.get('page')  || '1',  10))
    const limit      = Math.min(500, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)))
    const outOfStock = searchParams.get('outOfStock') === '1'
    const warehouseParam = searchParams.get('warehouse') || undefined
    const warehouse  = warehouseParam && warehouseParam in WAREHOUSES ? warehouseParam as Warehouse : undefined

    const result = await getProducts({ search, brand, page, limit, outOfStock, warehouse })
    return NextResponse.json(result)
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('Error fetching products:', error)
    return NextResponse.json({ error: 'Failed to fetch products', detail: msg }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    if (!body.name || !body.brand || !body.type || body.originalPrice === undefined || body.sellingPrice === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    const product = await createProduct(body)
    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
