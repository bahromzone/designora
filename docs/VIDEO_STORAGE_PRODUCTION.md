# 3 GB production video upload

Designora videolarni backend RAM yoki local disk orqali emas, S3-compatible object storage'ga multipart upload qiladi.

## Required environment

Set `VIDEO_STORAGE_BUCKET`, `VIDEO_STORAGE_REGION`, `VIDEO_STORAGE_ENDPOINT`, `VIDEO_STORAGE_ACCESS_KEY`, `VIDEO_STORAGE_SECRET_KEY`, `VIDEO_STORAGE_PUBLIC_BASE_URL`, `VIDEO_UPLOAD_MAX_GB=3` and `VIDEO_UPLOAD_PART_SIZE_MB=16`.

Cloudflare R2, AWS S3 and MinIO are supported. The public base URL should point to a CDN or signed media gateway, not the bucket's private API endpoint.

## Bucket CORS

Allow the frontend origin for `PUT` requests and expose the `ETag` response header. Without exposed `ETag`, the browser cannot complete multipart uploads.

```json
[{"AllowedOrigins":["https://app.example.com"],"AllowedMethods":["PUT","GET","HEAD"],"AllowedHeaders":["*"],"ExposeHeaders":["ETag"],"MaxAgeSeconds":3600}]
```

## Flow

1. Instructor requests an initiate URL set. The API checks role, course ownership and file size.
2. Browser uploads 16 MB parts directly to storage with presigned URLs. FastAPI never buffers the video.
3. Browser sends part numbers and ETags to complete. The API validates the key ownership, completes the multipart upload and stores the public media URL on the lesson.
4. Abandoned uploads should be removed with the abort endpoint and a storage lifecycle rule should clean incomplete multipart uploads after 1 day.

The 3 GB limit is enforced server-side. Reverse proxies should not set a body limit for these requests because the browser sends parts directly to object storage.
