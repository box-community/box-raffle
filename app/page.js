"use client";

import { useRouter } from "next/navigation";
import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";

const initialForm = {
  firstName: "",
  lastName: "",
  email: "",
};

export default function Home() {
  const router = useRouter();
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
        text: "Raffle entry submitted. Redirecting.",
      });
      router.push("/success");
    } catch (error) {
      setStatus({
        tone: "error",
        text: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [router]);

  useEffect(() => {
    if (!isBoxScriptReady || !boxConfig || uploaderRef.current || !window.Box) {
      return undefined;
    }

    const uploader = new window.Box.ContentUploader();
    uploaderRef.current = uploader;

    const handleUpload = (boxFile) => {
      const file = normalizeBoxFile(boxFile);

      if (!file?.id) {
        clearPendingUploadNames();
        setStatus({
          tone: "error",
          text: "Box uploaded the file but did not return a file ID.",
        });
        return;
      }

      clearPendingUploadNames();
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
      clearPendingUploadNames();
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
      requestInterceptor: createUniqueUploadNameRequestInterceptor(),
      size: "large",
    });

    return () => {
      clearPendingUploadNames();
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
          <h1 id="raffle-title">Selfie Raffle</h1>
          <p className="lede">
            Take a selfie, upload it to Box and your contact information will be attached as metadata!
          </p>
          <p className="lede"><i>Your name and email are collected solely for the purpose of this raffle draw and will be permanently deleted from Box once the winner has been selected.</i></p>
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

const pendingUploadNames = new Map();

function createUniqueUploadNameRequestInterceptor() {
  return (config) => {
    const url = String(config.url || "");
    const method = String(config.method || "get").toLowerCase();

    if (method === "options" && url.includes("/files/content")) {
      if (config.data?.name) {
        config.data = {
          ...config.data,
          name: getOrCreateUniqueUploadName(config.data.name),
        };
      }

      return config;
    }

    if (config.data?.attributes) {
      try {
        const attributes = JSON.parse(config.data.attributes);
        const originalName =
          attributes.name ||
          (config.data.file instanceof File ? config.data.file.name : "") ||
          "";
        attributes.name = getOrCreateUniqueUploadName(originalName);
        config.data = {
          ...config.data,
          attributes: JSON.stringify(attributes),
        };
      } catch {
        // Leave the request unchanged if attributes cannot be parsed.
      }
    }

    return config;
  };
}

function getOrCreateUniqueUploadName(originalName) {
  const key = String(originalName || "").trim() || "__anonymous__";

  if (!pendingUploadNames.has(key)) {
    pendingUploadNames.set(key, buildUniqueUploadName(originalName));
  }

  return pendingUploadNames.get(key);
}

function clearPendingUploadNames() {
  pendingUploadNames.clear();
}

function buildUniqueUploadName(originalName = "") {
  return `${crypto.randomUUID()}${getFileExtension(originalName)}`;
}

function getFileExtension(name) {
  const trimmed = String(name || "").trim();
  const lastSlash = Math.max(trimmed.lastIndexOf("/"), trimmed.lastIndexOf("\\"));
  const basename = trimmed.slice(lastSlash + 1);
  const dotIndex = basename.lastIndexOf(".");

  if (dotIndex <= 0 || dotIndex === basename.length - 1) {
    return "";
  }

  return basename.slice(dotIndex);
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
