import { NextRequest } from 'next/server';
import webhooks from '@/lib/webhooks';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const rows = await prisma.webhookEndpoint.findMany({ where: { isActive: true } });
    return new Response(JSON.stringify({ data: rows }));
  } catch (e) {
    return new Response(JSON.stringify({ data: webhooks.list() }));
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, url, name, secret } = body;
    if (!url) return new Response(JSON.stringify({ error: 'url required' }), { status: 400 });
    try {
      const rec = await prisma.webhookEndpoint.create({ data: { name: name || url, url, secret } });
      // also register in-memory for immediate dispatch
      webhooks.register({ id: rec.id, url: rec.url, secret: rec.secret });
      return new Response(JSON.stringify({ data: rec }), { status: 201 });
    } catch (e) {
      return new Response(JSON.stringify({ error: 'db error' }), { status: 500 });
    }
  } catch (e) {
    return new Response(JSON.stringify({ error: 'invalid' }), { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) return new Response(JSON.stringify({ error: 'id required' }), { status: 400 });
    try {
      await prisma.webhookEndpoint.update({ where: { id }, data: { isActive: false } });
      webhooks.unregister(id);
      return new Response(JSON.stringify({ data: true }));
    } catch (e) {
      return new Response(JSON.stringify({ error: 'db error' }), { status: 500 });
    }
  } catch (e) {
    return new Response(JSON.stringify({ error: 'invalid' }), { status: 400 });
  }
}
