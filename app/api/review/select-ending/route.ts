import { NextRequest, NextResponse } from 'next/server'
import Database from 'better-sqlite3'

const DB_PATH = '/opt/openclaw/futurepulse/db/futurepulse.db'

// Valid ending IDs only
const VALID_ENDING_IDS = ['A', 'B', 'C'] as const

type EndingId = typeof VALID_ENDING_IDS[number]

function getDb() {
  return new Database(DB_PATH, { readonly: false })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { article_id, ending_id } = body

    // Validate article_id at API level
    if (!article_id || typeof article_id !== 'number') {
      return NextResponse.json(
        { ok: false, error: 'Invalid or missing article_id. Must be a number.' },
        { status: 400 }
      )
    }

    // Validate ending_id at API level - ONLY A, B, C allowed
    if (!ending_id || typeof ending_id !== 'string') {
      return NextResponse.json(
        { ok: false, error: 'Missing ending_id' },
        { status: 400 }
      )
    }

    if (!VALID_ENDING_IDS.includes(ending_id as EndingId)) {
      return NextResponse.json(
        { ok: false, error: `Invalid ending_id '${ending_id}'. Must be one of: A, B, C` },
        { status: 400 }
      )
    }

    const db = getDb()

    // Fetch article from DB
    const article = db.prepare(
      'SELECT * FROM articles WHERE id = ?'
    ).get(article_id) as any

    if (!article) {
      db.close()
      return NextResponse.json(
        { ok: false, error: `Article ${article_id} not found` },
        { status: 404 }
      )
    }

    // Parse endings JSON
    let endings: Record<string, string> = {}
    let endings_en: Record<string, string> = {}

    try {
      endings = article.endings_json ? JSON.parse(article.endings_json) : {}
    } catch (e) {
      db.close()
      return NextResponse.json(
        { ok: false, error: 'Invalid endings_json format in database' },
        { status: 500 }
      )
    }

    try {
      endings_en = article.endings_en ? JSON.parse(article.endings_en) : {}
    } catch (e) {
      db.close()
      return NextResponse.json(
        { ok: false, error: 'Invalid endings_en format in database' },
        { status: 500 }
      )
    }

    // Get selected ending content for both languages
    const selected_ending_hr = endings[ending_id]
    const selected_ending_en = endings_en[ending_id]

    // Validate that selected ending exists in both languages
    if (!selected_ending_hr) {
      db.close()
      return NextResponse.json(
        { ok: false, error: `Ending '${ending_id}' not found in endings_json (HR)` },
        { status: 400 }
      )
    }

    if (!selected_ending_en) {
      db.close()
      return NextResponse.json(
        { ok: false, error: `Ending '${ending_id}' not found in endings_en (EN)` },
        { status: 400 }
      )
    }

    // Get base content parts
    const part1 = article.part1 || ''
    const part2 = article.part2 || ''
    const part1_en = article.part1_en || ''
    const part2_en = article.part2_en || ''

    // Assemble final bodies with selected ending
    // HR: part1 + part2 + selected_ending_hr
    const hrParts = [part1, part2].filter(p => p && p.trim())
    const final_body_hr = [...hrParts, selected_ending_hr].join('\n\n')

    // EN: part1_en + part2_en + selected_ending_en
    const enParts = [part1_en, part2_en].filter(p => p && p.trim())
    const final_body_en = [...enParts, selected_ending_en].join('\n\n')

    // Update database atomically
    const updateStmt = db.prepare(`
      UPDATE articles 
      SET 
        selected_ending_id = ?,
        final_body_hr = ?,
        final_body_en = ?,
        status = 'approved',
        approved = 1,
        pipeline_stage = 'images_pending'
      WHERE id = ?
    `)

    updateStmt.run(ending_id, final_body_hr, final_body_en, article_id)

    db.close()

    // Return success with assembled bodies
    return NextResponse.json({
      ok: true,
      article_id,
      selected_ending_id: ending_id,
      final_body_hr,
      final_body_en,
      message: `Ending ${ending_id} committed successfully. Article approved and ready for image generation.`
    })

  } catch (error: any) {
    console.error('Error in select-ending:', error)
    return NextResponse.json(
      { ok: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint for debugging/testing
export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const articleId = url.searchParams.get('article_id')

  if (!articleId) {
    return NextResponse.json(
      { error: 'Missing article_id parameter' },
      { status: 400 }
    )
  }

  try {
    const db = getDb()
    const article = db.prepare(
      'SELECT id, title, title_en, selected_ending_id, final_body_hr, final_body_en, endings_json, endings_en FROM articles WHERE id = ?'
    ).get(articleId) as any

    db.close()

    if (!article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      article: {
        id: article.id,
        title: article.title,
        title_en: article.title_en,
        selected_ending_id: article.selected_ending_id,
        has_final_body_hr: !!article.final_body_hr,
        has_final_body_en: !!article.final_body_en,
        endings_count: article.endings_json ? Object.keys(JSON.parse(article.endings_json)).length : 0,
        endings_en_count: article.endings_en ? Object.keys(JSON.parse(article.endings_en)).length : 0,
      }
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}