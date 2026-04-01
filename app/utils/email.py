import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.core.config import settings

logger = logging.getLogger(__name__)


def _send(to: str, subject: str, html_body: str) -> None:
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = settings.EMAIL_FROM
    msg["To"] = to
    msg.attach(MIMEText(html_body, "html"))

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.EMAIL_FROM, to, msg.as_string())
        logger.info("Email sent to %s | subject: %s", to, subject)
    except Exception as exc:
        logger.error("Failed to send email to %s: %s", to, exc)
        raise


def send_verification_email(to: str, token: str) -> None:
    subject = "Verify your email"
    body = f"""
    <h2>Email Verification</h2>
    <p>Click the link below to verify your account:</p>
    <a href="http://localhost:8000/auth/verify-email?token={token}">Verify Email</a>
    <p>This link expires in 24 hours.</p>
    """
    _send(to, subject, body)


def send_password_reset_email(to: str, otp: str) -> None:
    subject = "Password Reset OTP"
    body = f"""
    <h2>Password Reset</h2>
    <p>Use the OTP below to reset your password:</p>
    <h1 style="letter-spacing:4px">{otp}</h1>
    <p>This OTP expires in 10 minutes. Do not share it.</p>
    """
    _send(to, subject, body)


def send_2fa_otp_email(to: str, otp: str) -> None:
    subject = "Your 2FA Code"
    body = f"""
    <h2>Two-Factor Authentication</h2>
    <p>Your one-time login code:</p>
    <h1 style="letter-spacing:4px">{otp}</h1>
    <p>This code expires in 10 minutes.</p>
    """
    _send(to, subject, body)
