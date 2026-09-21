# Password reset email setup

Nodemailer is installed. Add these settings to `backend/.env` (never commit credentials):

```dotenv
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your-sender@gmail.com
SMTP_PASS=your-google-app-password
MAIL_FROM="Alimento <your-sender@gmail.com>"
FRONTEND_URL=http://localhost:3000
```

For Gmail, enable 2-Step Verification and create an App Password where available: https://support.google.com/accounts/answer/185833
Use the App Password, not your regular Google password. Other SMTP providers work too: use their SMTP host, port, credentials and authorized sender address. Port 465 uses immediate TLS; other ports require STARTTLS. See https://nodemailer.com/smtp.

Restart the backend after changing settings. In production, configure the same environment variables on the backend host and set `FRONTEND_URL` to the public HTTPS frontend URL. Ensure the frontend host serves the React app for `/portal/reset-password` links.

## Check the flow

1. Open the customer login page and select **Forgot password?**
2. Enter the email of an existing account you control.
3. Open the email link within 15 minutes and choose a password.
4. Confirm the new password works, the old password fails, and the link cannot be reused.

The app stores only a SHA-256 hash of the reset token. Password changes consume the token atomically and revoke existing sessions. Reset requests are limited to 10 per IP per 15 minutes, shared between both endpoints. A new request replaces the previous link.

Unknown addresses and delivery failures receive the same public response to avoid revealing registered emails. Delivery failures produce a generic backend log entry; check SMTP credentials, sender authorization and hosting SMTP restrictions if mail does not arrive. Missing configuration returns a setup error before looking up the account. No real email delivery is exercised by automated tests.
