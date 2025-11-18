import React, { useState } from "react";
import { uploadToServer } from "../lib/uploadToServer";

export function TestUploader() {
  const [files, setFiles] = useState<FileList | null>(null);
  const [urls, setUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!files) return;

    try {
      setLoading(true);
      const fileArray = Array.from(files);
      const result = await uploadToServer(fileArray, "test-order");
      setUrls(result);
    } catch (err: any) {
      console.error(err);
      alert("Upload failed. Check console.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20, background: "#111", borderRadius: 8, marginTop: 30 }}>
      <h2 style={{ marginBottom: 10 }}>Test Image Upload</h2>

      <input
        type="file"
        multiple
        onChange={(e) => setFiles(e.target.files)}
        style={{ marginBottom: 10 }}
      />

      <button onClick={handleUpload} disabled={loading || !files}>
        {loading ? "Uploading..." : "Upload Files"}
      </button>

      {urls.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <h3>Uploaded URLs</h3>
          <ul>
            {urls.map((url) => (
              <li key={url}>
                <a href={url} target="_blank" rel="noreferrer">
                  {url}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
