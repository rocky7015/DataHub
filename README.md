# Dataset Sharing & Collaboration Platform

A full-stack web platform for discovering, previewing, and discussing datasets.

## 🚀 Tech Stack
- **Frontend**: React 18, Vite, Tailwind CSS v3
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (Mongoose)
- **Auth**: JWT (JSON Web Tokens)
- **Storage**: Local Disk (via Multer)

## 📦 Features
- 📤 Upload & manage datasets (CSV, JSON, XLSX)
- 🔍 Full-text search and advanced filtering (tags, categories, types)
- 👀 Preview tabular data (first 10 rows) directly in browser
- 💬 Threaded discussion/comments system on datasets
- ⭐ Rating and bookmarking system
- 👤 Public contributor profiles & private dashboards
- 🛡️ Admin dashboard for moderation & platform metrics

## 💻 Local Development

1. **Install Dependencies**
   Run the following from the root directory:
   ```bash
   npm install concurrently
   npm run build
   # This installs both backend and frontend dependencies
   ```

2. **Environment Variables**
   Create a `.env` file in the `backend/` directory:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/dataset_platform
   JWT_SECRET=your_super_secret_key
   JWT_EXPIRE=30d
   ```
   (No env needed for frontend unless overriding API URL locally via `VITE_API_URL`)

3. **Start Development Servers**
   ```bash
   npm run dev
   ```
   - Frontend runs on `http://localhost:5173`
   - Backend API runs on `http://localhost:5000`

## 🌐 Production Deployment

The application is configured as a monorepo that serves the built React frontend directly from the Node server.

### Deploying to Render / Heroku
1. Push your repository to GitHub.
2. Create a new "Web Service".
3. Use the following build settings:
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
4. Set the Environment Variables:
   - `NODE_ENV=production`
   - `MONGO_URI=mongodb+srv://...`
   - `JWT_SECRET=your_production_secret`

The Node.js server will automatically route all unknown requests to the generated `frontend/dist/index.html`.

## 📂 Folder Structure
- `backend/`: Express Server, Models, Controllers, Multer Uploads
- `frontend/`: React SPA, Tailwind UI Components
- `package.json`: Root scripts for concurrently running & building the full stack.
