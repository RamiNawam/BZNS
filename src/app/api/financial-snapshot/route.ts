// ============================================================
// CONTROLLER: POST /api/financial-snapshot  — generate snapshot
//             GET  /api/financial-snapshot  — fetch existing snapshot
//             PUT  /api/financial-snapshot  — force refresh
// Thin layer: validate input → call service → return JSON
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { FinancialService } from '@/services/financial.service'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const profile_id = searchParams.get('profile_id')

    if (!profile_id) return NextResponse.json({ error: 'profile_id required' }, { status: 400 })

    const snapshot = await FinancialService.getByProfileId(profile_id)
    if (!snapshot) return NextResponse.json({ snapshot: null }, { status: 200 })

    return NextResponse.json({ snapshot })
  } catch (err) {
    console.error('[GET /api/financial-snapshot]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { profile_id, monthly_expenses, expense_categories, price_per_unit, units_per_month } = body

    if (!profile_id) return NextResponse.json({ error: 'profile_id required' }, { status: 400 })

    const snapshot = await FinancialService.generate({
      profile_id,
      monthly_expenses,
      expense_categories,
      price_per_unit,
      units_per_month,
    })

    return NextResponse.json({ snapshot }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/financial-snapshot]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { profile_id, monthly_expenses, expense_categories, price_per_unit, units_per_month } = body

    if (!profile_id) return NextResponse.json({ error: 'profile_id required' }, { status: 400 })

    const snapshot = await FinancialService.refresh({
      profile_id,
      monthly_expenses,
      expense_categories,
      price_per_unit,
      units_per_month,
    })

    return NextResponse.json({ snapshot })
  } catch (err) {
    console.error('[PUT /api/financial-snapshot]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
