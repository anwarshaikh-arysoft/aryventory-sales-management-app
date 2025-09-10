// utils/uploadToS3.js
export async function getPresignedUrl(apiBase, token, filename, contentType, folder = 'selfies') {
    const resp = await fetch(`${apiBase}/uploads/presign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ filename, contentType, folder }),
    });
    if (!resp.ok) throw new Error('Failed to get presigned URL');
    return resp.json(); // { url, key }
  }
  
  /**
   * uploadWithProgress: uploads fileUri to presigned PUT URL, reports progress (0-100)
   * returns true on success
   */
  export function uploadWithProgress(presignedUrl, fileUri, mimeType, onProgress = () => {}) {
    return new Promise(async (resolve, reject) => {
      try {
        const fileBlob = await (await fetch(fileUri)).blob();
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', presignedUrl);
        xhr.setRequestHeader('Content-Type', mimeType);
  
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            onProgress(percent);
          }
        };
  
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve(true);
          else reject(new Error('Upload failed with status ' + xhr.status));
        };
  
        xhr.onerror = () => reject(new Error('Network error during upload'));
        xhr.send(fileBlob);
      } catch (e) {
        reject(e);
      }
    });
  }
  