# 🎓 College Submission Toolkit

![License](https://img.shields.io/badge/license-MIT-blue.svg) ![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB) ![Node](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-339933) ![Docker](https://img.shields.io/badge/Container-Docker-2496ED)

> **The ultimate utility belt for students.**  
> A privacy-focused, ad-free, and open-source web application to manage PDF assignments, convert formats, and organize submissions.

![Project Preview](https://via.placeholder.com/800x400?text=App+Preview+Screenshot)

## 📖 Table of Contents
- [✨ Features](#-features)
- [🏗️ Architecture](#️-architecture)
- [�️ Tech Stack](#️-tech-stack)
- [🚀 Getting Started (Local Dev)](#-getting-started-local-dev)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [🐳 Docker Setup (Recommended)](#-docker-setup-recommended)
- [☁️ Deployment Guide](#️-deployment-guide)
- [🔧 Environment Variables](#-environment-variables)
- [🤝 Contributing](#-contributing)

---

## ✨ Features

| Feature | Description | Engine |
| :--- | :--- | :--- |
| **Smart Compress** | Reduces PDF file size by up to 80% while keeping text readable. | `ghostscript` |
| **Split PDF** | Extract specific pages (e.g., "1-3, 5") into a new document. | `pdf-lib` |
| **Merge PDFs** | Combine multiple lecture notes or assignments into one file. | `pdf-lib` |
| **Organise Pages** | Visual Drag & Drop interface to reorder pages within a PDF. | `pdf-lib` |
| **Rotate Pages** | Fix upside-down scans with a simple click. | `pdf-lib` |
| **PDF to Word** | Convert read-only PDFs to editable `.docx` files. | `LibreOffice` |
| **Img to PDF** | Turn phone screenshots (JPG/PNG) into a professional scan. | `pdf-lib` |

---

## �️ Architecture

The application is split into two distinct parts:

1.  **Frontend (Client)**: A React application that handles the UI, file selection, and visual manipulation (like reordering pages). It communicates with the backend via REST API.
2.  **Backend (Server)**: A Node.js server that performs the heavy lifting. It uses system-level interaction (spawning processes) to run powerful tools like Ghostscript and LibreOffice.

```mermaid
graph TD
    User[Student] -->|Uploads File| Frontend[React Frontend (Netlify)]
    Frontend -->|POST /api/compress| Backend[Node.js Backend (Render)]
    Backend -->|Spawns Process| GS[Ghostscript]
    Backend -->|Spawns Process| LO[LibreOffice]
    GS -->|Optimized PDF| Backend
    Backend -->|Download URL| Frontend
```

---

## �️ Tech Stack

### **Frontend** (`/frontend`)
- **React 18**: Component-based UI.
- **Vite**: Next-gen build tool for lightning-fast dev server.
- **Tailwind CSS**: Utility-first styling with a custom **Glassmorphism** design system.
- **Framer Motion**: Smooth, spring-based animations.
- **@dnd-kit**: Robust drag-and-drop primitives for page organization.
- **Axios**: HTTP client for API requests.

### **Backend** (`/backend`)
- **Express.js**: REST API framework.
- **Multer**: Handling `multipart/form-data` file uploads.
- **PDF-Lib**: Pure JavaScript PDF manipulation (split, merge, rotate).
- **Child Process**: For executing shell commands (Ghostscript/LibreOffice).

### **Infrastructure**
- **Docker**: Containerizes the backend to ensure `ghostscript` and `libreoffice` are present in any environment.

---

## 🚀 Getting Started (Local Dev)

### Prerequisites
- **Node.js** (v18 or higher)
- **Git**
- *(Optional but Recommended)* **Docker Desktop**

### Installation

#### 1. Clone the Repo
```bash
git clone https://github.com/your-username/clg-toolkit.git
cd clg-toolkit
```

#### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
# App runs at http://localhost:5173
```

#### 3. Backend Setup (Non-Docker Method)
> **⚠️ Warning**: You must manually install dependencies for this to work.
> 1. Install [Ghostscript](https://ghostscript.com/releases/gsdnld.html).
> 2. Install [LibreOffice](https://www.libreoffice.org/).
> 3. Add both to your System PATH variables.

```bash
cd backend
npm install
node server.js
# Server runs at http://localhost:5000
```

---

## 🐳 Docker Setup (Recommended)

Running the backend in Docker avoids checking for system dependencies manually. It guarantees a production-like environment.

1. **Build the Image**
   ```bash
   cd backend
   docker build -t clg-toolkit-backend .
   ```

2. **Run the Container**
   ```bash
   docker run -p 5000:5000 clg-toolkit-backend
   ```
   
The backend is now running at `http://localhost:5000` with all tools pre-installed.

---

## ☁️ Deployment Guide

### Phase 1: Backend (Render.com)
Since our backend needs a persistent file system and specific binaries, we use **Docker Deployment** on Render.

1. Create a [Render](https://render.com) account.
2. Click **New +** -> **Web Service**.
3. Connect your GitHub repository.
4. Select the **Docker** Runtime (Render auto-detects the `Dockerfile` in `/backend`).
5. Set **Root Directory** to `backend`.
6. Deploy! Render will build the image and start the server.
7. **Copy your Service URL** (e.g., `https://clg-toolkit-api.onrender.com`).

### Phase 2: Frontend (Netlify)
1. Create a [Netlify](https://netlify.com) account.
2. "Import from Git" -> Choose your repository.
3. **Build Settings**:
   - Base directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `dist`
4. **Environment Variables**:
   - Key: `VITE_API_URL`
   - Value: `https://clg-toolkit-api.onrender.com` (Your Render URL)
5. Deploy Site.

---

## 🔧 Environment Variables

### Frontend (`frontend/.env`)
| Variable | Description | Default |
| :--- | :--- | :--- |
| `VITE_API_URL` | The URL of your backend server. | `http://localhost:5000` |

### Backend (`backend/.env`)
| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | Port for the server to listen on. | `5000` |

---

## 🧼 Script for Easy Updates
Included in the root directory is `deploy.bat` for Windows users. Double-clicking this script will:
1. `git add` all changes.
2. `git commit` with a current timestamp.
3. `git push` to your repository.

---

## 📄 License
This project is licensed under the **MIT License** - see the LICENSE file for details.
