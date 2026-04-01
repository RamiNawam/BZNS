// ============================================================
// CONTROLLER: POST   /api/assistant — send a message, get Claude reply
//             GET    /api/assistant — fetch conversation history
//             DELETE /api/assistant — clear conversation history
// Thin layer: validate input → call service → return JSON
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { AssistantService } from '@/services/assistant.service'
import { randomUUID } from 'crypto'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const profile_id = searchParams.get('profile_id')
    const limit = parseInt(searchParams.get('limit') ?? '50', 10)

    if (!profile_id) return NextResponse.json({ error: 'profile_id required' }, { status: 400 })

    const messages = await AssistantService.getHistory(profile_id, limit)
    return NextResponse.json({ messages })
  } catch (err) {
    console.error('[GET /api/assistant]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { profile_id, message, session_id, context_type } = body

    if (!profile_id) return NextResponse.json({ error: 'profile_id required' }, { status: 400 })
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'message (string) required' }, { status: 400 })
    }

    const resolvedSessionId = session_id ?? randomUUID()

    const reply = await AssistantService.chat(
      profile_id,
      message,
      resolvedSessionId,
      context_type
    )

    return NextResponse.json({ reply, session_id: resolvedSessionId })
  } catch (err) {
    console.error('[POST /api/assistant]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const profile_id = searchParams.get('profile_id')

    if (!profile_id) return NextResponse.json({ error: 'profile_id required' }, { status: 400 })

    await AssistantService.clearHistory(profile_id)
    return NextResponse.json({ message: 'Conversation history cleared' })
  } catch (err) {
    console.error('[DELETE /api/assistant]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
