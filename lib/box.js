import {
  BoxCcgAuth,
  BoxClient,
  BoxDeveloperTokenAuth,
  CcgConfig,
} from "box-node-sdk";
import { BoxApiError, BoxSdkError } from "box-node-sdk/box";
import { AuthorizationManager } from "box-node-sdk/managers";

const BOX_API_BASE = "https://api.box.com/2.0";

export class BoxRequestError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = "BoxRequestError";
    this.status = status;
    this.details = details;
  }
}

let cachedAuth = null;

function usesClientCredentialsGrant() {
  const id = process.env.BOX_CLIENT_ID;
  const secret = process.env.BOX_CLIENT_SECRET;
  const subject =
    process.env.BOX_ENTERPRISE_ID || process.env.BOX_USER_ID;
  return Boolean(id && secret && subject);
}

function validateAuthEnv() {
  const id = process.env.BOX_CLIENT_ID;
  const secret = process.env.BOX_CLIENT_SECRET;
  const hasOAuthPair = Boolean(id && secret);
  const hasSubject = Boolean(
    process.env.BOX_ENTERPRISE_ID || process.env.BOX_USER_ID,
  );
  const hasDevToken = Boolean(process.env.BOX_ACCESS_TOKEN);

  if (!hasOAuthPair && !hasDevToken) {
    throw new BoxRequestError(
      "Set BOX_CLIENT_ID, BOX_CLIENT_SECRET, and BOX_ENTERPRISE_ID or BOX_USER_ID (CCG), or set BOX_ACCESS_TOKEN for developer-token mode.",
      500,
    );
  }

  if (hasOAuthPair && !hasSubject && !hasDevToken) {
    throw new BoxRequestError(
      "With BOX_CLIENT_ID and BOX_CLIENT_SECRET, add BOX_ENTERPRISE_ID or BOX_USER_ID for Client Credentials Grant, or set BOX_ACCESS_TOKEN.",
      500,
    );
  }
}

function getServerAccessToken() {
  const token = process.env.BOX_ACCESS_TOKEN;

  if (!token) {
    throw new BoxRequestError("BOX_ACCESS_TOKEN is not configured.", 500);
  }

  return token;
}

function buildBoxAuth() {
  validateAuthEnv();

  if (usesClientCredentialsGrant()) {
    const clientId = process.env.BOX_CLIENT_ID;
    const clientSecret = process.env.BOX_CLIENT_SECRET;
    const userId = process.env.BOX_USER_ID;

    const configFields = {
      clientId,
      clientSecret,
      ...(userId
        ? { userId }
        : { enterpriseId: process.env.BOX_ENTERPRISE_ID }),
    };

    return new BoxCcgAuth({
      config: new CcgConfig(configFields),
    });
  }

  const token = getServerAccessToken();
  const oauthConfig =
    process.env.BOX_CLIENT_ID && process.env.BOX_CLIENT_SECRET
      ? {
          clientId: process.env.BOX_CLIENT_ID,
          clientSecret: process.env.BOX_CLIENT_SECRET,
        }
      : undefined;

  return new BoxDeveloperTokenAuth({
    token,
    ...(oauthConfig ? { config: oauthConfig } : {}),
  });
}

function getBoxAuth() {
  if (!cachedAuth) {
    cachedAuth = buildBoxAuth();
  }
  return cachedAuth;
}

function getBoxClient() {
  return new BoxClient({
    auth: getBoxAuth(),
  });
}

function getRaffleFolderName() {
  return process.env.BOX_RAFFLE_FOLDER_NAME || "Raffle";
}

function getParentFolderId() {
  return process.env.BOX_PARENT_FOLDER_ID || "0";
}

export async function ensureRaffleFolder() {
  const client = getBoxClient();
  const folderName = getRaffleFolderName();
  const parentFolderId = getParentFolderId();
  const existing = await findFolderByName(client, parentFolderId, folderName);

  if (existing) {
    return existing;
  }

  try {
    return await client.folders.createFolder(
      {
        name: folderName,
        parent: { id: parentFolderId },
      },
      {
        queryParams: {
          fields: ["id", "type", "name"],
        },
      },
    );
  } catch (error) {
    if (isBoxApiError(error) && getBoxStatus(error) === 409) {
      const folder = await findFolderByName(client, parentFolderId, folderName);

      if (folder) {
        return folder;
      }
    }

    throw error;
  }
}

async function findFolderByName(client, parentFolderId, folderName) {
  let offset = 0;
  const limit = 1000;

  while (true) {
    const body = await client.folders.getFolderItems(parentFolderId, {
      queryParams: {
        fields: ["id", "type", "name"],
        limit,
        offset,
      },
    });
    const entries = body?.entries || [];
    const folder = entries.find(
      (entry) => entry.type === "folder" && entry.name === folderName,
    );

    if (folder) {
      return folder;
    }

    offset += entries.length;

    if (!entries.length || offset >= (body?.totalCount || body?.total_count || 0)) {
      return null;
    }
  }
}

export async function getUploaderAccessToken(folderId) {
  const client = getBoxClient();
  const auth = client.auth;

  if (auth instanceof BoxCcgAuth) {
    const token = await auth.downscopeToken(
      ["base_upload"],
      `${BOX_API_BASE}/folders/${folderId}`,
      undefined,
      client.networkSession,
    );

    return {
      accessToken: token.accessToken,
      tokenType: "downscoped_base_upload_ccg",
    };
  }

  if (process.env.BOX_CLIENT_ID && process.env.BOX_CLIENT_SECRET) {
    return createDownscopedUploadToken(folderId);
  }

  return {
    accessToken: getServerAccessToken(),
    tokenType: "server_access_token",
  };
}

export async function issuePreviewTokenForRaffleFile(fileId) {
  const client = getBoxClient();
  const folder = await ensureRaffleFolder();
  const file = await client.files.getFileById(fileId, {
    queryParams: {
      fields: ["id", "type", "name", "parent"],
    },
  });

  if (file?.type !== "file" || file?.parent?.id !== folder.id) {
    throw new BoxRequestError(
      "This file is not in the configured Raffle folder.",
      403,
    );
  }

  const auth = client.auth;

  if (auth instanceof BoxCcgAuth) {
    const token = await auth.downscopeToken(
      ["base_preview"],
      `${BOX_API_BASE}/files/${fileId}`,
      undefined,
      client.networkSession,
    );

    return {
      accessToken: token.accessToken,
      tokenType: "downscoped_base_preview_ccg",
    };
  }

  if (process.env.BOX_CLIENT_ID && process.env.BOX_CLIENT_SECRET) {
    return createDownscopedPreviewToken(fileId);
  }

  return {
    accessToken: getServerAccessToken(),
    tokenType: "server_access_token",
  };
}

async function createDownscopedPreviewToken(fileId) {
  const authorization = new AuthorizationManager({});
  const token = await authorization.requestAccessToken({
    grantType: "urn:ietf:params:oauth:grant-type:token-exchange",
    clientId: process.env.BOX_CLIENT_ID,
    clientSecret: process.env.BOX_CLIENT_SECRET,
    subjectToken: getServerAccessToken(),
    subjectTokenType: "urn:ietf:params:oauth:token-type:access_token",
    scope: "base_preview",
    resource: `${BOX_API_BASE}/files/${fileId}`,
  });

  return {
    accessToken: token.accessToken,
    tokenType: "downscoped_base_preview",
  };
}

async function createDownscopedUploadToken(folderId) {
  const authorization = new AuthorizationManager({});
  const token = await authorization.requestAccessToken({
    grantType: "urn:ietf:params:oauth:grant-type:token-exchange",
    clientId: process.env.BOX_CLIENT_ID,
    clientSecret: process.env.BOX_CLIENT_SECRET,
    subjectToken: getServerAccessToken(),
    subjectTokenType: "urn:ietf:params:oauth:token-type:access_token",
    scope: "base_upload",
    resource: `${BOX_API_BASE}/folders/${folderId}`,
  });

  return {
    accessToken: token.accessToken,
    tokenType: "downscoped_base_upload",
  };
}

const RAFFLE_FOLDER_ITEM_FIELDS = [
  "id",
  "type",
  "name",
  "metadata.global.properties",
];

function readRaffleNameFields(metadataLike) {
  if (!metadataLike || typeof metadataLike !== "object") {
    return { firstName: "", lastName: "" };
  }

  const raw =
    metadataLike.rawData && typeof metadataLike.rawData === "object"
      ? metadataLike.rawData
      : null;
  const extra = metadataLike.extraData || {};

  return {
    firstName: String(raw?.firstName ?? extra.firstName ?? "").trim(),
    lastName: String(raw?.lastName ?? extra.lastName ?? "").trim(),
  };
}

function namesFromFolderItemFile(entry) {
  const props = entry?.metadata?.extraData?.global?.properties;
  return readRaffleNameFields(props);
}

export async function listRaffleFolderFiles() {
  const client = getBoxClient();
  const folder = await ensureRaffleFolder();
  const folderId = folder.id;
  const rows = [];
  let offset = 0;
  const limit = 1000;

  while (true) {
    const body = await client.folders.getFolderItems(folderId, {
      queryParams: {
        fields: RAFFLE_FOLDER_ITEM_FIELDS,
        limit,
        offset,
      },
    });
    const entries = body?.entries || [];

    for (const entry of entries) {
      if (entry.type !== "file") {
        continue;
      }

      let { firstName, lastName } = namesFromFolderItemFile(entry);

      if (!firstName && !lastName) {
        try {
          const md = await client.fileMetadata.getFileMetadataById(
            entry.id,
            "global",
            "properties",
          );
          ({ firstName, lastName } = readRaffleNameFields(md));
        } catch {
          // No metadata on this file yet.
        }
      }

      rows.push({
        id: entry.id,
        name: entry.name ?? "",
        firstName,
        lastName,
      });
    }

    offset += entries.length;
    const total = body?.totalCount ?? body?.total_count ?? 0;

    if (!entries.length || offset >= total) {
      break;
    }
  }

  return rows;
}

export async function applyRaffleMetadata(fileId, values) {
  const client = getBoxClient();
  const metadata = sanitizeMetadata(values);

  try {
    return await client.fileMetadata.createFileMetadataById(
      fileId,
      "global",
      "properties",
      metadata,
    );
  } catch (error) {
    const tupleExists =
      isBoxApiError(error) &&
      getBoxStatus(error) === 409 &&
      getBoxCode(error) === "tuple_already_exists";

    if (!tupleExists) {
      throw error;
    }

    return updateMetadata(client, fileId, metadata);
  }
}

function sanitizeMetadata(values) {
  return {
    firstName: String(values.firstName || "").trim(),
    lastName: String(values.lastName || "").trim(),
    email: String(values.email || "").trim(),
    submittedAt: new Date().toISOString(),
  };
}

async function updateMetadata(client, fileId, metadata) {
  const existing = await client.fileMetadata.getFileMetadataById(
    fileId,
    "global",
    "properties",
  );
  const operations = Object.entries(metadata).map(([key, value]) => ({
    op: hasMetadataKey(existing, key) ? "replace" : "add",
    path: `/${key}`,
    value,
  }));

  return client.fileMetadata.updateFileMetadataById(
    fileId,
    "global",
    "properties",
    operations,
  );
}

function hasMetadataKey(metadata, key) {
  return (
    Object.prototype.hasOwnProperty.call(metadata, key) ||
    Object.prototype.hasOwnProperty.call(metadata?.extraData || {}, key) ||
    Object.prototype.hasOwnProperty.call(metadata?.rawData || {}, key)
  );
}

function isBoxApiError(error) {
  return error instanceof BoxApiError || Boolean(error?.responseInfo?.statusCode);
}

function getBoxStatus(error) {
  return error?.responseInfo?.statusCode || error?.status || 500;
}

function getBoxCode(error) {
  return error?.responseInfo?.code || error?.details?.code || error?.code;
}

export function toPublicBoxError(error) {
  if (error instanceof BoxRequestError) {
    return {
      message: error.message,
      status: error.status,
      code: error.details?.code,
      requestId: error.details?.request_id,
    };
  }

  if (isBoxApiError(error)) {
    return {
      message: error.message || "Box API request failed.",
      status: getBoxStatus(error),
      code: getBoxCode(error),
      requestId: error.responseInfo?.requestId,
    };
  }

  if (error instanceof BoxSdkError) {
    return {
      message: error.message || "Box SDK error.",
      status: 401,
      code: error.name,
    };
  }

  return {
    message: "Unexpected server error.",
    status: 500,
  };
}
