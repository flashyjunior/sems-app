import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware';
import nodemailer from 'nodemailer';
import { encrypt, decrypt } from '@/lib/encryption';

/**
 * GET /api/settings/smtp
 * Get SMTP settings (admin only)
 */
async function handleGET(request: AuthenticatedRequest) {
  try {
    if (!request.user?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is admin
    const user = await prisma.user.findUnique({
      where: { id: request.user.userId },
      include: { role: true },
    });

    if (!user || user.role?.name !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Fetch SMTP settings
    const smtpSettings = await prisma.sMTPSettings.findFirst();

    if (!smtpSettings) {
      // Return default empty settings
      return NextResponse.json({
        id: '',
        host: '',
        port: 587,
        secure: false,
        username: '',
        password: '', // Don't return actual password for security
        fromEmail: '',
        fromName: 'SEMS Support',
        adminEmail: '',
        replyToEmail: '',
        enabled: false,
        createdAt: new Date().getTime(),
        updatedAt: new Date().getTime(),
      });
    }

    return NextResponse.json({
      id: smtpSettings.id,
      host: smtpSettings.host,
      port: smtpSettings.port,
      secure: smtpSettings.secure,
      username: smtpSettings.username,
      password: smtpSettings.password ? '***HIDDEN***' : '', // Never return password to client
      fromEmail: smtpSettings.fromEmail,
      fromName: smtpSettings.fromName,
      adminEmail: smtpSettings.adminEmail,
      replyToEmail: smtpSettings.replyToEmail,
      enabled: smtpSettings.enabled,
      testStatus: smtpSettings.testStatus,
      lastTestedAt: smtpSettings.lastTestedAt?.getTime(),
      createdAt: smtpSettings.createdAt.getTime(),
      updatedAt: smtpSettings.updatedAt.getTime(),
    });
  } catch (error) {
    console.error('Error fetching SMTP settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch SMTP settings' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/settings/smtp
 * Update SMTP settings (admin only)
 */
async function handlePUT(request: AuthenticatedRequest) {
  try {
    if (!request.user?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is admin
    const user = await prisma.user.findUnique({
      where: { id: request.user.userId },
      include: { role: true },
    });

    if (!user || user.role?.name !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const {
      host,
      port,
      secure,
      username,
      password,
      fromEmail,
      fromName,
      adminEmail,
      replyToEmail,
      enabled,
    } = body;

    // Validate required fields
    if (!host || !port || !username || !fromEmail || !adminEmail) {
      return NextResponse.json(
        { error: 'Missing required SMTP configuration fields' },
        { status: 400 }
      );
    }

    // Check if settings exist
    const existingSettings = await prisma.sMTPSettings.findFirst();

    let smtpSettings;
    if (existingSettings) {
      // Update existing settings
      // Only encrypt password if it's new (not the placeholder)
      const encryptedPassword = password && password !== '***HIDDEN***' 
        ? encrypt(password)
        : existingSettings.password;

      smtpSettings = await prisma.sMTPSettings.update({
        where: { id: existingSettings.id },
        data: {
          host,
          port,
          secure,
          username,
          password: encryptedPassword,
          fromEmail,
          fromName,
          adminEmail,
          replyToEmail,
          enabled,
        },
      });
    } else {
      // Create new settings
      if (!password) {
        return NextResponse.json(
          { error: 'Password is required for new SMTP settings' },
          { status: 400 }
        );
      }

      smtpSettings = await prisma.sMTPSettings.create({
        data: {
          host,
          port,
          secure,
          username,
          password: encrypt(password), // Encrypt on creation
          fromEmail,
          fromName,
          adminEmail,
          replyToEmail,
          enabled,
        },
      });
    }

    return NextResponse.json({
      id: smtpSettings.id,
      host: smtpSettings.host,
      port: smtpSettings.port,
      secure: smtpSettings.secure,
      username: smtpSettings.username,
      password: '***HIDDEN***',
      fromEmail: smtpSettings.fromEmail,
      fromName: smtpSettings.fromName,
      adminEmail: smtpSettings.adminEmail,
      replyToEmail: smtpSettings.replyToEmail,
      enabled: smtpSettings.enabled,
      testStatus: smtpSettings.testStatus,
      lastTestedAt: smtpSettings.lastTestedAt?.getTime(),
      createdAt: smtpSettings.createdAt.getTime(),
      updatedAt: smtpSettings.updatedAt.getTime(),
    });
  } catch (error) {
    console.error('Error updating SMTP settings:', error);
    return NextResponse.json(
      { error: 'Failed to update SMTP settings' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handleGET);
export const PUT = withAuth(handlePUT);
