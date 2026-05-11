"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";

const initialForm = {
  firstName: "",
  lastName: "",
  email: "",
};

export default function Home() {
  const [form, setForm] = useState(initialForm);
  const [boxConfig, setBoxConfig] = useState(null);
  const [isBoxScriptReady, setIsBoxScriptReady] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingMetadata, setPendingMetadata] = useState(false);
  const [status, setStatus] = useState({
    tone: "idle",
    text: "Preparing Box uploader.",
  });
  const uploaderRef = useRef(null);
  const formRef = useRef(form);
  const appliedFileIdRef = useRef("");
  const pendingMetadataRef = useRef(false);

  useEffect(() => {
    formRef.current = form;
  }, [form]);

  useEffect(() => {
    pendingMetadataRef.current = pendingMetadata;
  }, [pendingMetadata]);

  useEffect(() => {
    let isMounted = true;

    async function loadBoxConfig() {
      try {
        const response = await fetch("/api/box/uploader-config", {
          cache: "no-store",
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to initialize Box.");
        }

        if (isMounted) {
          setBoxConfig(data);
          setStatus({
            tone: "idle",
            text: `Upload target ready: ${data.folderName}.`,
          });
        }
      } catch (error) {
        if (isMounted) {
          setStatus({
            tone: "error",
            text: error.message,
          });
        }
      }
    }

    loadBoxConfig();

    return () => {
      isMounted = false;
    };
  }, []);

  const submitMetadata = useCallback(async (fileId) => {
    if (!fileId || appliedFileIdRef.current === fileId) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/box/metadata", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileId,
          ...formRef.current,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to save metadata.");
      }

      appliedFileIdRef.current = fileId;
      setPendingMetadata(false);
      setStatus({
        tone: "success",
        text: "Raffle entry submitted and metadata saved to the uploaded file.",
      });
    } catch (error) {
      setStatus({
        tone: "error",
        text: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  useEffect(() => {
    if (!isBoxScriptReady || !boxConfig || uploaderRef.current || !window.Box) {
      return undefined;
    }

    const uploader = new window.Box.ContentUploader();
    uploaderRef.current = uploader;

    const handleUpload = (boxFile) => {
      const file = normalizeBoxFile(boxFile);

      if (!file?.id) {
        setStatus({
          tone: "error",
          text: "Box uploaded the file but did not return a file ID.",
        });
        return;
      }

      setUploadedFile(file);
      setStatus({
        tone: "idle",
        text: `${file.name || "File"} uploaded. Submit the form to save metadata.`,
      });

      if (pendingMetadataRef.current) {
        submitMetadata(file.id);
      }
    };

    const handleError = (error) => {
      const message = error?.error?.message || error?.message || "Upload failed.";

      setStatus({
        tone: "error",
        text: message,
      });
      setPendingMetadata(false);
      setIsSubmitting(false);
    };

    uploader.addListener("upload", handleUpload);
    uploader.addListener("error", handleError);
    uploader.show(boxConfig.folderId, boxConfig.accessToken, {
      container: "#box-uploader",
      fileLimit: 1,
      size: "large",
    });

    return () => {
      uploader.removeAllListeners();
      uploader.hide();
      uploaderRef.current = null;
    };
  }, [boxConfig, isBoxScriptReady, submitMetadata]);

  function updateField(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    const validationError = validateForm(form);

    if (validationError) {
      setStatus({
        tone: "error",
        text: validationError,
      });
      return;
    }

    if (!uploadedFile?.id) {
      setPendingMetadata(true);
      setStatus({
        tone: "idle",
        text: "Waiting for Box to finish uploading your selected file.",
      });
      return;
    }

    submitMetadata(uploadedFile.id);
  }

  return (
    <main className="page">
      <Script
        src="https://cdn01.boxcdn.net/platform/elements/26.0.0/en-US/uploader.js"
        strategy="afterInteractive"
        onLoad={() => setIsBoxScriptReady(true)}
        onError={() =>
          setStatus({
            tone: "error",
            text: "Unable to load the Box Content Uploader.",
          })
        }
      />

      <section className="shell" aria-labelledby="raffle-title">
        <header className="header">
          <img src="/box-devs.png" alt="Box Devs logo" className="logo" width={200} />
          <h1 id="raffle-title">LangChain Interrupt Raffle</h1>
          <p className="lede">
            Take a selfie, upload it to Box and attach your contact information as metadata. The winner of the raffle will win an Xbox!
          </p>
        </header>

        <form className="entry-form" onSubmit={handleSubmit}>
          <div className="field-grid">
            <div className="field">
              <label htmlFor="firstName">First Name</label>
              <input
                id="firstName"
                name="firstName"
                autoComplete="given-name"
                value={form.firstName}
                onChange={updateField}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="lastName">Last Name</label>
              <input
                id="lastName"
                name="lastName"
                autoComplete="family-name"
                value={form.lastName}
                onChange={updateField}
                required
              />
            </div>

            <div className="field full">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={updateField}
                required
              />
            </div>

            <div className="field full">
              <label htmlFor="box-uploader">File Upload</label>
              <div className="uploader-frame">
                <div
                  id="box-uploader"
                  className="uploader-target"
                  aria-live="polite"
                />
              </div>
            </div>
          </div>

          <div className={`status ${status.tone}`} role="status">
            {status.text}
          </div>

          <div className="actions">
            <button className="submit-button" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting" : "Submit"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

function normalizeBoxFile(boxFile) {
  if (!boxFile) {
    return null;
  }

  if (boxFile.id) {
    return boxFile;
  }

  if (boxFile.file?.id) {
    return boxFile.file;
  }

  if (boxFile.data?.id) {
    return boxFile.data;
  }

  return null;
}

function validateForm(form) {
  if (!form.firstName.trim()) {
    return "First name is required.";
  }

  if (!form.lastName.trim()) {
    return "Last name is required.";
  }

  if (!form.email.trim()) {
    return "Email is required.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    return "Enter a valid email address.";
  }

  return "";
}
