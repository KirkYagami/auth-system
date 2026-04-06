import logging
import uuid

import boto3
from botocore.exceptions import BotoCoreError, ClientError
from fastapi import HTTPException, UploadFile, status

from app.core.config import settings

logger = logging.getLogger(__name__)

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB


def _s3_client():
    return boto3.client(
        "s3",
        region_name=settings.AWS_REGION,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    )


async def upload_profile_image(file: UploadFile, user_id: str) -> str:
    """
    Validate, upload image to S3, return the public HTTPS URL.
    Raises HTTPException on invalid file or upload failure.
    """
    # ── Validate content type ────────────────────────────────────────────────
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file type '{file.content_type}'. Allowed: jpeg, png, webp, gif.",
        )

    # ── Read and validate size ───────────────────────────────────────────────
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File exceeds the 5 MB limit.",
        )

    # ── Build a unique, safe S3 key ──────────────────────────────────────────
    ext = file.content_type.split("/")[-1]          # e.g. "jpeg"
    ext = "jpg" if ext == "jpeg" else ext            # normalise
    key = f"{settings.S3_PROFILE_IMAGE_PREFIX}/{user_id}/{uuid.uuid4().hex}.{ext}"

    # ── Upload ───────────────────────────────────────────────────────────────
    try:
        _s3_client().put_object(
            Bucket=settings.S3_BUCKET_NAME,
            Key=key,
            Body=contents,
            ContentType=file.content_type,
        )
        logger.info("Uploaded profile image for user %s → s3://%s/%s", user_id, settings.S3_BUCKET_NAME, key)
    except (BotoCoreError, ClientError) as exc:
        logger.error("S3 upload failed for user %s: %s", user_id, exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to upload image. Please try again later.",
        )

    # ── Return public URL ────────────────────────────────────────────────────
    url = f"https://{settings.S3_BUCKET_NAME}.s3.{settings.AWS_REGION}.amazonaws.com/{key}"
    return url
