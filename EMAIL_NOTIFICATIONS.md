# Email Notifications System

## Overview

FriendsChat uses **Resend** for sending urgent email notifications to admins and users for critical events requiring immediate attention.

## Configuration

### Environment Variables

Add these to your `.env` file:

```env
RESEND_API_KEY=your_resend_api_key_here
URGENT_EMAIL_FROM=urgent-friendschat@scstudios.tech
MASTER_ADMIN_EMAIL=ruben@scstudios.tech
APP_URL=https://your-domain.com  # or http://localhost:3000 for development
```

### Setup Resend

1. Sign up at [resend.com](https://resend.com)
2. Verify your domain (`scstudios.tech`)
3. Get your API key from the dashboard
4. Add the API key to your `.env` file

## Email Types

### 1. Admin Misconduct Alert

**Trigger:** When a user reports an admin for misconduct

**Recipient:** Master admin (ruben@scstudios.tech)

**Content:**
- Details of accused admin
- Reporter information
- Report reason
- Timestamp
- Auto-freeze notification
- Next steps for investigation

**Urgency:** 🚨 CRITICAL - Immediate action required

### 2. Direct Warning Notification

**Trigger:** When an admin issues a Direct Warning to a user

**Recipient:** User receiving the DW

**Content:**
- Admin who issued warning
- Reason for warning
- Timestamp
- 24-hour response deadline
- Link to respond

**Urgency:** 🚨 URGENT - Response required within 24 hours

### 3. Investigation Assignment

**Trigger:** When master admin assigns an investigation to an admin

**Recipient:** Assigned admin investigator

**Content:**
- Report ID
- Investigation responsibilities
- Evidence collection steps
- Timeline
- Link to admin panel

**Urgency:** 📋 HIGH - Review and action needed

### 4. System Freeze Alert

**Trigger:** When master admin activates emergency system freeze

**Recipient:** Master admin (confirmation)

**Content:**
- Who triggered freeze
- Reason for freeze
- Timestamp
- Current status
- Link to system controls

**Urgency:** 🚨 CRITICAL - System-wide impact

## Email Design

All urgent notifications feature:
- Professional HTML templates
- Color-coded headers (red for critical, blue for info)
- Clear action buttons
- Responsive design
- FriendsChat branding
- SuperCode Studios footer

## Usage in Controllers

### Example: Admin Report Controller

```javascript
const { sendAdminMisconductAlert } = require('../utils/emailNotifications');

// When admin report is submitted
async function createAdminReport(req, res) {
  try {
    const report = await AdminReport.create({
      accusedAdmin: req.params.adminId,
      reporter: req.user._id,
      reason: req.body.reason
    });

    // Freeze accused admin privileges
    await User.findByIdAndUpdate(req.params.adminId, {
      adminPrivilegesFrozen: true
    });

    // Send urgent email to master admin
    const accusedAdmin = await User.findById(req.params.adminId);
    const reporter = req.user;
    
    await sendAdminMisconductAlert(report, accusedAdmin, reporter);

    res.json({ success: true, report });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

### Example: Direct Warning Controller

```javascript
const { sendDirectWarningNotification } = require('../utils/emailNotifications');

// When DW is created
async function createDirectWarning(req, res) {
  try {
    const dw = await DirectWarning.create({
      admin: req.user._id,
      user: req.params.userId,
      reason: req.body.reason
    });

    // Send urgent notification to user
    const user = await User.findById(req.params.userId);
    const admin = req.user;
    
    await sendDirectWarningNotification(dw, user, admin);

    res.json({ success: true, dw });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

## Email Deliverability

### Best Practices

1. **Domain Verification**: Ensure `scstudios.tech` is verified in Resend
2. **SPF/DKIM**: Configure DNS records for authentication
3. **Rate Limits**: Resend free tier allows 100 emails/day, 3,000/month
4. **Error Handling**: All email functions include try-catch blocks
5. **Logging**: Console logs for success/failure tracking

### Troubleshooting

**Emails not sending:**
- Check `RESEND_API_KEY` is set correctly
- Verify domain in Resend dashboard
- Check console for error messages
- Ensure recipient emails are valid

**Emails in spam:**
- Add SPF record: `v=spf1 include:_spf.resend.com ~all`
- Add DKIM record (provided by Resend)
- Warm up domain with gradual sending

## Testing

### Development Mode

```javascript
// Set APP_URL for local testing
APP_URL=http://localhost:3000

// Test email sending
node -e "
  require('dotenv').config();
  const { sendAdminMisconductAlert } = require('./src/utils/emailNotifications');
  // Create test objects and call function
"
```

### Email Preview

All emails use HTML templates that are:
- Mobile responsive
- Accessible
- Professional appearance
- Clear call-to-action buttons

## Security

- API keys stored in environment variables (never committed)
- Email addresses validated before sending
- Sensitive data (passwords, tokens) never included in emails
- All emails use HTTPS links
- Rate limiting prevents abuse

## Monitoring

Track email delivery in:
1. Resend dashboard (delivery status, opens, clicks)
2. Console logs (success/failure messages)
3. Database logs (notification history)

## Cost Estimate

**Resend Pricing:**
- Free tier: 3,000 emails/month
- Pro tier: $20/month for 50,000 emails

**Expected usage:**
- Admin misconduct reports: ~5-10/month
- Direct Warnings: ~20-50/month
- Investigations: ~5-10/month
- System freezes: ~1-2/month

**Total: ~30-75 emails/month** - Well within free tier

## Support

For issues with email notifications:
1. Check Resend dashboard for delivery status
2. Review console logs for error messages
3. Verify environment variables are set
4. Contact Resend support if delivery issues persist

---

**© 2025 SuperCode Studios - FriendsChat**
*Secure, reliable email notifications for critical admin events*
