---
description: Deploying the Face Finder (Sentinel v2.0) to Render
---

To deploy this application to Render, follow these steps:

### 1. Connect GitHub Repository
1. Log in to your [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** and select **Static Site**.
3. Connect your GitHub account and select the `Intelligent-Recognition-Identification-System` repository.

### 2. Configure Build Settings
During the creation process, use the following settings:

- **Name**: `intelligent-recognition-system` (or any name you prefer)
- **Branch**: `main`
- **Build Command**: `npm run build`
- **Publish Directory**: `dist`

### 3. Advanced Configuration (Optional)
- **Environment Variables**: No specific environment variables are required for this frontend-only app.
- **Pull Request Previews**: Render automatically enables these; they are highly recommended for testing new features.

### 4. Deploy
1. Click **Create Static Site**.
2. Render will pull the code, install dependencies, and build the project.
3. Once the build is complete, you will receive a unique URL (e.g., `https://intelligent-recognition-system.onrender.com`).

### Troubleshooting
- If the build fails due to missing dependencies, ensure that `package-lock.json` is pushed to the repository.
- Ensure the **Publish Directory** is exactly `dist`.
