import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware';
import nodemailer from 'nodemailer';
import { decrypt } from '@/lib/encryption';

/**
 * POST /api/settings/smtp/test
 * Test SMTP connection (admin only)
 */
async function handlePOST(request: AuthenticatedRequest) {
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
    const { host, port, secure, username, password, fromEmail, fromName, testEmail } = body;

    // If password is hidden placeholder, decrypt from database
    let actualPassword = password;
    if (password === '***HIDDEN***' || !password) {
      const existingSettings = await prisma.sMTPSettings.findFirst();
      if (!existingSettings) {
        return NextResponse.json(
          { error: 'No SMTP settings found. Please save settings first.' },
          { status: 400 }
        );
      }
      // Decrypt the stored password
      actualPassword = decrypt(existingSettings.password);
    }

    // Use provided test email or fall back to user's email
    const recipientEmail = testEmail || user.email;

    // Validate required fields
    if (!host || !port || !username || !actualPassword || !fromEmail || !recipientEmail) {
      return NextResponse.json(
        { error: 'Missing required SMTP configuration fields' },
        { status: 400 }
      );
    }

    try {
      // Create transporter with test credentials
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
          user: username,
          pass: actualPassword,  // Use decrypted password
        },
      });

      // Test the connection
      await transporter.verify();

      // Send a test email
      await transporter.sendMail({
        from: `${fromName} <${fromEmail}>`,
        to: recipientEmail,  // Use provided or user's email
        subject: 'SEMS SMTP Configuration Test',
        html: `
          <h2>SEMS Email Configuration Test</h2>
          <p>This is a test email to verify your SMTP configuration is working correctly.</p>
          <p>If you received this email, your email settings are configured properly.</p>
          <hr />
          <p><small>Sent at ${new Date().toLocaleString()}</small></p>
        `,
      });

      // Update test status in database
      const existingSettings = await prisma.sMTPSettings.findFirst();
      if (existingSettings) {
        await prisma.sMTPSettings.update({
          where: { id: existingSettings.id },
          data: {
            testStatus: 'success',
            lastTestedAt: new Date(),
          },
        });
      }

      return NextResponse.json({
        success: true,
        message: `SMTP connection test successful! Test email sent to ${recipientEmail}`,
      });
    } catch (smtpError) {
      console.error('SMTP test error:', smtpError);

      // Update test status in database
      const existingSettings = await prisma.sMTPSettings.findFirst();
      if (existingSettings) {
        await prisma.sMTPSettings.update({
          where: { id: existingSettings.id },
          data: {
            testStatus: 'failed',
            lastTestedAt: new Date(),
          },
        });
      }

      const errorMessage = smtpError instanceof Error ? smtpError.message : 'Unknown error';
      return NextResponse.json(
        {
          success: false,
          error: `SMTP connection failed: ${errorMessage}`,
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error testing SMTP settings:', error);
    return NextResponse.json(
      { error: 'Failed to test SMTP settings' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(handlePOST);
