import nodemailer from 'nodemailer';

export interface SMTPSettingsForEmail {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  fromEmail: string;
  fromName: string;
}

export interface TicketEmailData {
  ticketNumber: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  userName: string;
  userEmail: string;
  adminEmail: string;
  smtpSettings: SMTPSettingsForEmail;
}

export interface TicketNoteEmailData {
  ticketNumber: string;
  ticketTitle: string;
  noteContent: string;
  authorName: string;
  isAdminNote: boolean;
  recipientEmail: string;
  smtpSettings: SMTPSettingsForEmail;
}

/**
 * Send email notification when a new ticket is created
 */
export async function sendTicketNotificationEmail(data: TicketEmailData): Promise<void> {
  try {
    const transporter = nodemailer.createTransport({
      host: data.smtpSettings.host,
      port: data.smtpSettings.port,
      secure: data.smtpSettings.secure,
      auth: {
        user: data.smtpSettings.username,
        pass: data.smtpSettings.password,
      },
    });

    const adminMailContent = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border-radius: 5px;">
            <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
              New Support Ticket Submitted
            </h2>

            <div style="background-color: #fff; padding: 15px; border-left: 4px solid #3498db; margin: 20px 0;">
              <p><strong>Ticket Number:</strong> ${data.ticketNumber}</p>
              <p><strong>Submitted By:</strong> ${data.userName} (${data.userEmail})</p>
              <p><strong>Category:</strong> ${data.category}</p>
              <p><strong>Priority:</strong> <span style="color: ${getPriorityColor(data.priority)}; font-weight: bold;">${data.priority.toUpperCase()}</span></p>
            </div>

            <div style="background-color: #fff; padding: 15px; margin: 20px 0;">
              <h3 style="color: #2c3e50;">Title</h3>
              <p>${data.title}</p>

              <h3 style="color: #2c3e50;">Description</h3>
              <p>${data.description.replace(/\n/g, '<br>')}</p>
            </div>

            <div style="background-color: #ecf0f1; padding: 15px; border-radius: 5px; text-align: center;">
              <p style="margin: 0;">
                <a href="#" style="display: inline-block; padding: 10px 20px; background-color: #3498db; color: white; text-decoration: none; border-radius: 5px;">
                  View Ticket in Admin Panel
                </a>
              </p>
            </div>

            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="font-size: 12px; color: #7f8c8d;">
              This is an automated message from the SEMS Support System. Please do not reply to this email.
            </p>
          </div>
        </body>
      </html>
    `;

    await transporter.sendMail({
      from: `${data.smtpSettings.fromName} <${data.smtpSettings.fromEmail}>`,
      to: data.adminEmail,
      subject: `[New Ticket] ${data.title} (${data.ticketNumber})`,
      html: adminMailContent,
    });

    console.log(`Ticket notification email sent to admin for ticket ${data.ticketNumber}`);
  } catch (error) {
    console.error('Error sending ticket notification email:', error);
    throw error;
  }
}

/**
 * Send email notification when a ticket note is added
 */
export async function sendTicketNoteEmail(data: TicketNoteEmailData): Promise<void> {
  try {
    const transporter = nodemailer.createTransport({
      host: data.smtpSettings.host,
      port: data.smtpSettings.port,
      secure: data.smtpSettings.secure,
      auth: {
        user: data.smtpSettings.username,
        pass: data.smtpSettings.password,
      },
    });

    const noteType = data.isAdminNote ? 'Admin Response' : 'User Response';
    
    const mailContent = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border-radius: 5px;">
            <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
              Update on Your Support Ticket
            </h2>

            <div style="background-color: #fff; padding: 15px; border-left: 4px solid #3498db; margin: 20px 0;">
              <p><strong>Ticket Number:</strong> ${data.ticketNumber}</p>
              <p><strong>Ticket Title:</strong> ${data.ticketTitle}</p>
              <p><strong>Response From:</strong> ${data.authorName}</p>
              <p><strong>Type:</strong> <span style="background-color: ${data.isAdminNote ? '#e74c3c' : '#3498db'}; color: white; padding: 3px 8px; border-radius: 3px; font-size: 12px;">${noteType}</span></p>
            </div>

            <div style="background-color: #fff; padding: 15px; border-left: 4px solid #2ecc71; margin: 20px 0;">
              <h3 style="color: #2c3e50; margin-top: 0;">Message</h3>
              <p>${data.noteContent.replace(/\n/g, '<br>')}</p>
            </div>

            <div style="background-color: #ecf0f1; padding: 15px; border-radius: 5px; text-align: center;">
              <p style="margin: 0;">
                <a href="#" style="display: inline-block; padding: 10px 20px; background-color: #3498db; color: white; text-decoration: none; border-radius: 5px;">
                  View Ticket Details
                </a>
              </p>
            </div>

            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="font-size: 12px; color: #7f8c8d;">
              This is an automated message from the SEMS Support System. Please log in to your account to reply.
            </p>
          </div>
        </body>
      </html>
    `;

    await transporter.sendMail({
      from: `${data.smtpSettings.fromName} <${data.smtpSettings.fromEmail}>`,
      to: data.recipientEmail,
      subject: `[Update] ${data.ticketNumber}: ${data.ticketTitle}`,
      html: mailContent,
    });

    console.log(`Ticket note email sent to ${data.recipientEmail} for ticket ${data.ticketNumber}`);
  } catch (error) {
    console.error('Error sending ticket note email:', error);
    throw error;
  }
}

/**
 * Send email notification when a ticket status is resolved/closed
 */
export async function sendTicketResolutionEmail(
  ticketNumber: string,
  ticketTitle: string,
  status: string,
  recipientEmail: string,
  smtpSettings: SMTPSettingsForEmail
): Promise<void> {
  try {
    const transporter = nodemailer.createTransport({
      host: smtpSettings.host,
      port: smtpSettings.port,
      secure: smtpSettings.secure,
      auth: {
        user: smtpSettings.username,
        pass: smtpSettings.password,
      },
    });

    const statusColor = status === 'resolved' ? '#2ecc71' : '#95a5a6';
    const statusMessage = status === 'resolved' 
      ? 'Your support ticket has been resolved.' 
      : 'Your support ticket has been closed.';

    const mailContent = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border-radius: 5px;">
            <h2 style="color: #2c3e50; border-bottom: 2px solid ${statusColor}; padding-bottom: 10px;">
              🎫 Ticket ${status === 'resolved' ? 'Resolved' : 'Closed'}
            </h2>

            <div style="background-color: #fff; padding: 15px; border-left: 4px solid ${statusColor}; margin: 20px 0;">
              <p><strong>Ticket Number:</strong> ${ticketNumber}</p>
              <p><strong>Ticket Title:</strong> ${ticketTitle}</p>
              <p style="font-size: 16px; color: ${statusColor}; font-weight: bold;">${statusMessage}</p>
            </div>

            <div style="background-color: #ecf0f1; padding: 15px; border-radius: 5px; text-align: center;">
              <p style="margin: 0;">
                <a href="#" style="display: inline-block; padding: 10px 20px; background-color: #3498db; color: white; text-decoration: none; border-radius: 5px;">
                  View Ticket Details
                </a>
              </p>
            </div>

            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="font-size: 12px; color: #7f8c8d;">
              If you believe this ticket should remain open, please log in to your account to reopen it.
            </p>
          </div>
        </body>
      </html>
    `;

    await transporter.sendMail({
      from: `${smtpSettings.fromName} <${smtpSettings.fromEmail}>`,
      to: recipientEmail,
      subject: `[${status.toUpperCase()}] ${ticketNumber}: ${ticketTitle}`,
      html: mailContent,
    });

    console.log(`Ticket resolution email sent to ${recipientEmail} for ticket ${ticketNumber}`);
  } catch (error) {
    console.error('Error sending ticket resolution email:', error);
    throw error;
  }
}

/**
 * Helper function to get priority color
 */
function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'critical':
      return '#e74c3c'; // red
    case 'high':
      return '#e67e22'; // orange
    case 'medium':
      return '#f39c12'; // yellow
    case 'low':
      return '#27ae60'; // green
    default:
      return '#95a5a6'; // gray
  }
}
