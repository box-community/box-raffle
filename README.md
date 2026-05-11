# Box Raffle

A simple Next.js raffle entry form that uploads a file with the Box Content Uploader and stores the entrant details on the uploaded file as Box metadata.

Server-side Box operations use the official `box-node-sdk`.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `.env.local` from `.env.example` and set `BOX_ACCESS_TOKEN`.

3. Start the app:

   ```bash
   npm run dev
   ```

4. Open `http://localhost:3000`.

## Box behavior

- The server uses `box-node-sdk` to look for a folder named `Raffle` under `BOX_PARENT_FOLDER_ID` and creates it if it does not exist.
- The browser uses Box Content Uploader CDN assets to upload one file to that folder.
- On form submit, the app applies `firstName`, `lastName`, `email`, and `submittedAt` to the uploaded file using Box's `global/properties` metadata template.
- If `BOX_CLIENT_ID` and `BOX_CLIENT_SECRET` are configured, the app uses `box-node-sdk` to return a downscoped `base_upload` token to the browser. Otherwise it returns `BOX_ACCESS_TOKEN`, which is convenient for local testing but should not be used in production.
