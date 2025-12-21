import { NextRequest, NextResponse } from 'next/server';
import type { PrintTemplate } from '@/types';

// In-memory storage for demo (replace with database in production)
const templatesStore = new Map<string, PrintTemplate>();

/**
 * GET /api/templates
 * Fetch all templates (optionally filtered by sync time)
 */
export async function GET(req: NextRequest) {
  try {
    // Optional: Check auth token
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization' },
        { status: 401 }
      );
    }

    // Optional query params for filtering
    const searchParams = req.nextUrl.searchParams;
    const sinceTimestamp = searchParams.get('since');

    // Get all templates from store
    let templates = Array.from(templatesStore.values());

    // Filter by sync time if provided
    if (sinceTimestamp) {
      const since = parseInt(sinceTimestamp, 10);
      if (!isNaN(since)) {
        templates = templates.filter((t) => t.updatedAt > since);
      }
    }

    return NextResponse.json(templates, { status: 200 });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/templates
 * Save or update a template
 */
export async function POST(req: NextRequest) {
  try {
    // Check auth token
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await req.json();
    const template = body as PrintTemplate & { syncedAt?: number };

    // Validate required fields
    if (!template.id || !template.name || !template.htmlTemplate) {
      return NextResponse.json(
        { error: 'Missing required fields: id, name, htmlTemplate' },
        { status: 400 }
      );
    }

    // Check if template exists
    const existing = templatesStore.get(template.id);

    // If template exists and incoming is older, reject it (server wins on conflicts)
    if (existing && template.updatedAt < existing.updatedAt) {
      return NextResponse.json(
        {
          message: 'Server has newer version of this template',
          template: existing,
        },
        { status: 409 }
      );
    }

    // Store template (remove syncedAt as it's client-side only)
    const { syncedAt, ...templateToStore } = template;
    templatesStore.set(template.id, templateToStore);

    console.log(`Template ${template.id} synced at ${new Date().toISOString()}`);

    return NextResponse.json(
      {
        message: 'Template saved successfully',
        template: templateToStore,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error saving template:', error);
    return NextResponse.json(
      { error: 'Failed to save template' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/templates?id=template-id
 * Delete a template
 */
export async function DELETE(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization' },
        { status: 401 }
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const templateId = searchParams.get('id');

    if (!templateId) {
      return NextResponse.json(
        { error: 'Missing template id parameter' },
        { status: 400 }
      );
    }

    if (!templatesStore.has(templateId)) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    templatesStore.delete(templateId);

    return NextResponse.json(
      { message: 'Template deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting template:', error);
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    );
  }
}

