const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export const cloudinaryConfig = {
  cloudName: CLOUD_NAME,
  uploadPreset: UPLOAD_PRESET,
  ready: Boolean(CLOUD_NAME && UPLOAD_PRESET),
};

export function uploadVideo(file, { folder = "designora/lessons", onProgress } = {}) {
  if (!cloudinaryConfig.ready) {
    throw new Error(
      "Cloudinary sozlanmagan. VITE_CLOUDINARY_CLOUD_NAME va VITE_CLOUDINARY_UPLOAD_PRESET kerak."
    );
  }
  if (!file?.type?.startsWith("video/")) {
    throw new Error("Faqat video fayl yuklash mumkin.");
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const body = new FormData();
    body.append("file", file);
    body.append("upload_preset", UPLOAD_PRESET);
    body.append("folder", folder);

    xhr.open(
      "POST",
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`
    );
    xhr.responseType = "json";

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        onProgress?.(Math.round((event.loaded / event.total) * 100));
      }
    });
    xhr.addEventListener("load", () => {
      const payload = xhr.response;
      if (xhr.status >= 200 && xhr.status < 300 && payload?.secure_url) {
        resolve(payload);
        return;
      }
      reject(
        new Error(
          payload?.error?.message || "Cloudinary video yuklashda xatolik."
        )
      );
    });
    xhr.addEventListener("error", () =>
      reject(new Error("Internet yoki Cloudinary ulanishida xatolik."))
    );
    xhr.addEventListener("abort", () =>
      reject(new Error("Video yuklash bekor qilindi."))
    );
    xhr.send(body);
  });
}
