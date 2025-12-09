const { Resend } = require('resend');

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

// Email configuration
const URGENT_EMAIL_FROM = process.env.URGENT_EMAIL_FROM || 'urgent-friendschat@scstudios.tech';
const MASTER_ADMIN_EMAIL = process.env.MASTER_ADMIN_EMAIL || 'ruben@scstudios.tech';

/**
 * Send admin misconduct report notification
 * @param {Object} report - Admin report object
 * @param {Object} accusedAdmin - Admin being reported
 * @param {Object} reporter - User who made the report
 */
async function sendAdminMisconductAlert(report, accusedAdmin, reporter) {
  try {
    const emailData = {
      from: URGENT_EMAIL_FROM,
      to: MASTER_ADMIN_EMAIL,
      subject: `🚨 URGENT: Admin Misconduct Report - ${accusedAdmin.username}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fff;">
          <div style="background-color: #dc3545; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">🚨 URGENT: Admin Misconduct Report</h1>
          </div>
          
          <div style="padding: 30px; background-color: #f8f9fa; border: 2px solid #dc3545; border-top: none; border-radius: 0 0 8px 8px;">
            <h2 style="color: #dc3545; margin-top: 0;">Admin Privileges Automatically Frozen</h2>
            
            <div style="background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="color: #333; margin-top: 0;">Accused Admin</h3>
              <p style="margin: 5px 0;"><strong>Username:</strong> ${accusedAdmin.username}</p>
              <p style="margin: 5px 0;"><strong>Name:</strong> ${accusedAdmin.firstName} ${accusedAdmin.lastName}</p>
              <p style="margin: 5px 0;"><strong>Student ID:</strong> ${accusedAdmin.studentId}</p>
              <p style="margin: 5px 0;"><strong>Email:</strong> ${accusedAdmin.email}</p>
            </div>
            
            <div style="background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="color: #333; margin-top: 0;">Reporter</h3>
              <p style="margin: 5px 0;"><strong>Username:</strong> ${reporter.username}</p>
              <p style="margin: 5px 0;"><strong>Name:</strong> ${reporter.firstName} ${reporter.lastName}</p>
              <p style="margin: 5px 0;"><strong>Student ID:</strong> ${reporter.studentId}</p>
            </div>
            
            <div style="background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="color: #333; margin-top: 0;">Report Details</h3>
              <p style="margin: 5px 0;"><strong>Report ID:</strong> ${report._id}</p>
              <p style="margin: 5px 0;"><strong>Reason:</strong> ${report.reason}</p>
              <p style="margin: 5px 0;"><strong>Submitted:</strong> ${new Date(report.createdAt).toLocaleString()}</p>
            </div>
            
            <div style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin-bottom: 20px;">
              <p style="margin: 0; color: #856404;"><strong>⚠️ Action Taken:</strong> Admin privileges have been automatically frozen pending investigation.</p>
            </div>
            
            <div style="background-color: #d1ecf1; padding: 15px; border-left: 4px solid #0dcaf0; margin-bottom: 20px;">
              <p style="margin: 0; color: #055160;"><strong>ℹ️ Next Steps:</strong></p>
              <ol style="margin: 10px 0 0 0; padding-left: 20px; color: #055160;">
                <li>Review the report in the admin panel</li>
                <li>Assign an uninvolved admin to investigate</li>
                <li>Collect evidence from both parties</li>
                <li>Make final adjudication decision</li>
              </ol>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.APP_URL || 'http://localhost:3000'}/admin" 
                 style="display: inline-block; background-color: #dc3545; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                View Report in Admin Panel
              </a>
            </div>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #6c757d; font-size: 12px;">
            <p style="margin: 0;">FriendsChat Admin Governance System</p>
            <p style="margin: 5px 0;">© 2025 SuperCode Studios</p>
          </div>
        </div>
      `
    };

    const result = await resend.emails.send(emailData);
    console.log('✅ Admin misconduct alert sent:', result);
    return result;
  } catch (error) {
    console.error('❌ Failed to send admin misconduct alert:', error);
    throw error;
  }
}

/**
 * Send Direct Warning urgent notification
 * @param {Object} dw - Direct Warning object
 * @param {Object} user - User receiving DW
 * @param {Object} admin - Admin who issued DW
 */
async function sendDirectWarningNotification(dw, user, admin) {
  try {
    if (!user.email) {
      console.log('⚠️ User has no email address, skipping notification');
      return null;
    }

    const emailData = {
      from: URGENT_EMAIL_FROM,
      to: user.email,
      subject: `🚨 URGENT: Direct Warning from ${admin.username}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fff;">
          <div style="background-color: #dc3545; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">🚨 URGENT: Direct Warning</h1>
          </div>
          
          <div style="padding: 30px; background-color: #f8f9fa; border: 2px solid #dc3545; border-top: none; border-radius: 0 0 8px 8px;">
            <p style="font-size: 16px; color: #333;">
              You have received a <strong style="color: #dc3545;">Direct Warning</strong> from an administrator. 
              This requires your immediate attention.
            </p>
            
            <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #333; margin-top: 0;">Warning Details</h3>
              <p style="margin: 5px 0;"><strong>From:</strong> ${admin.username}</p>
              <p style="margin: 5px 0;"><strong>Reason:</strong> ${dw.reason}</p>
              <p style="margin: 5px 0;"><strong>Issued:</strong> ${new Date(dw.createdAt).toLocaleString()}</p>
            </div>
            
            <div style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">
              <p style="margin: 0; color: #856404;"><strong>⚠️ Action Required:</strong> Please respond to this Direct Warning within 24 hours.</p>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.APP_URL || 'http://localhost:3000'}/chat" 
                 style="display: inline-block; background-color: #dc3545; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Respond to Direct Warning
              </a>
            </div>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #6c757d; font-size: 12px;">
            <p style="margin: 0;">FriendsChat Moderation System</p>
            <p style="margin: 5px 0;">© 2025 SuperCode Studios</p>
          </div>
        </div>
      `
    };

    const result = await resend.emails.send(emailData);
    console.log('✅ Direct Warning notification sent:', result);
    return result;
  } catch (error) {
    console.error('❌ Failed to send Direct Warning notification:', error);
    throw error;
  }
}

/**
 * Send investigation assignment notification to admin
 * @param {Object} report - Admin report object
 * @param {Object} assignedAdmin - Admin assigned to investigate
 */
async function sendInvestigationAssignment(report, assignedAdmin) {
  try {
    if (!assignedAdmin.email) {
      console.log('⚠️ Admin has no email address, skipping notification');
      return null;
    }

    const emailData = {
      from: URGENT_EMAIL_FROM,
      to: assignedAdmin.email,
      subject: `📋 Admin Investigation Assignment - Report #${report._id}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fff;">
          <div style="background-color: #0d6efd; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">📋 Investigation Assignment</h1>
          </div>
          
          <div style="padding: 30px; background-color: #f8f9fa; border: 2px solid #0d6efd; border-top: none; border-radius: 0 0 8px 8px;">
            <p style="font-size: 16px; color: #333;">
              You have been assigned to investigate an admin misconduct report as a neutral party.
            </p>
            
            <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #333; margin-top: 0;">Your Responsibilities</h3>
              <ul style="color: #333; line-height: 1.6;">
                <li>Collect evidence from the reporter</li>
                <li>Gather statements from the accused admin</li>
                <li>Review relevant chat logs and actions</li>
                <li>Submit findings to master admin</li>
                <li>Provide recommendations for action</li>
              </ul>
            </div>
            
            <div style="background-color: #d1ecf1; padding: 15px; border-left: 4px solid #0dcaf0; margin: 20px 0;">
              <p style="margin: 0; color: #055160;"><strong>ℹ️ Report ID:</strong> ${report._id}</p>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.APP_URL || 'http://localhost:3000'}/admin" 
                 style="display: inline-block; background-color: #0d6efd; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Begin Investigation
              </a>
            </div>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #6c757d; font-size: 12px;">
            <p style="margin: 0;">FriendsChat Admin Governance System</p>
            <p style="margin: 5px 0;">© 2025 SuperCode Studios</p>
          </div>
        </div>
      `
    };

    const result = await resend.emails.send(emailData);
    console.log('✅ Investigation assignment sent:', result);
    return result;
  } catch (error) {
    console.error('❌ Failed to send investigation assignment:', error);
    throw error;
  }
}

/**
 * Send system freeze notification to master admin
 * @param {Object} systemStatus - System status object
 * @param {Object} admin - Admin who triggered freeze
 */
async function sendSystemFreezeAlert(systemStatus, admin) {
  try {
    const emailData = {
      from: URGENT_EMAIL_FROM,
      to: MASTER_ADMIN_EMAIL,
      subject: `🚨 URGENT: System Freeze Activated`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fff;">
          <div style="background-color: #6c757d; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">🚨 System Freeze Activated</h1>
          </div>
          
          <div style="padding: 30px; background-color: #f8f9fa; border: 2px solid #6c757d; border-top: none; border-radius: 0 0 8px 8px;">
            <p style="font-size: 16px; color: #333;">
              The FriendsChat application has been placed in maintenance mode.
            </p>
            
            <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #333; margin-top: 0;">Freeze Details</h3>
              <p style="margin: 5px 0;"><strong>Triggered by:</strong> ${admin.username}</p>
              <p style="margin: 5px 0;"><strong>Reason:</strong> ${systemStatus.reason}</p>
              <p style="margin: 5px 0;"><strong>Time:</strong> ${new Date(systemStatus.createdAt).toLocaleString()}</p>
            </div>
            
            <div style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">
              <p style="margin: 0; color: #856404;"><strong>⚠️ Status:</strong> All users are now seeing the maintenance mode page.</p>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.APP_URL || 'http://localhost:3000'}/admin" 
                 style="display: inline-block; background-color: #6c757d; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                View System Status
              </a>
            </div>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #6c757d; font-size: 12px;">
            <p style="margin: 0;">FriendsChat System Management</p>
            <p style="margin: 5px 0;">© 2025 SuperCode Studios</p>
          </div>
        </div>
      `
    };

    const result = await resend.emails.send(emailData);
    console.log('✅ System freeze alert sent:', result);
    return result;
  } catch (error) {
    console.error('❌ Failed to send system freeze alert:', error);
    throw error;
  }
}

module.exports = {
  sendAdminMisconductAlert,
  sendDirectWarningNotification,
  sendInvestigationAssignment,
  sendSystemFreezeAlert
};
