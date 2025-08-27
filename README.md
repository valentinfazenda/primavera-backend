# Primavera Backend

**Primavera Backend** is a modern, scalable **Node.js API** designed for:  
📄 intelligent document management,  
⚡ workflow orchestration,  
🤖 and advanced integration with AI models (**OpenAI, Azure OpenAI**).  

It leverages **Express, MongoDB, AWS S3, and Socket.io** to provide a robust, secure, and extensible platform for enterprises and individuals.

---

## 🚀 Main Features

- **🔐 User Management**  
  JWT authentication, registration, profile update, permission management, and advanced security.

- **📂 Documents**  
  Import, PDF OCR, text extraction from XLSX/HTML, secure storage on **AWS S3**, full-text search.

- **⚙️ Workflows & Flows**  
  Create, edit, delete, and execute custom workflows. Manage steps and connections between steps.

- **🤖 AI Integration**  
  Connect to **OpenAI** and **Azure OpenAI** for LLM tasks. Manage models, activate/deactivate, usage tracking.

- **🔌 Socket.io**  
  Real-time communication for monitoring long-running tasks (OCR, flow execution).

- **📝 Waiting List**  
  Registration system for onboarding new users.

- **🛡️ Security**  
  Authentication middleware, fine-grained access control, secure API key storage.

---

## 📁 Project Structure

```bash
primavera-backend/
├── src/
│   ├── models/         # MongoDB schemas
│   ├── routes/         # API routes
│   ├── controllers/    # Business logic
│   ├── services/       # External services (S3, OpenAI, etc.)
│   └── utils/          # Utilities
├── .env.example        # Environment variables template
└── server.js           # App entry point
```

---

## ⚡ Installation

1. **Clone the repo**
   ```bash
   git clone https://github.com/your-account/primavera-backend.git
   cd primavera-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**  
   Copy `.env.example` → `.env` and fill in the required variables (MongoDB URI, AWS, JWT, etc.).

4. **Start the server**
   ```bash
   npm start
   ```
   The server runs by default on the port defined in `.env` (**5000**).

---

## 📌 API Documentation

Available RESTful endpoints:  

- **`/api/auth`** → Authentication, registration, profile retrieval  
- **`/api/user`** → Profile update, user details  
- **`/api/documents`** → Upload, search, delete, OCR, text extraction  
- **`/api/flows`** → Workflow management, steps, execution, statistics  
- **`/api/models`** → AI model management (activation, details, deletion)  
- **`/api/llms`** → Interact with OpenAI/Azure OpenAI  
- **`/api/links`** → Extract text from web links  
- **`/api/waitingList`** → Join the waiting list  

⚠️ All routes (except `/auth` and `/waitingList`) are protected by **JWT**.

---

## 🛠️ Technologies

- **Backend**: Node.js, Express  
- **Database**: MongoDB + Mongoose  
- **Realtime**: Socket.io  
- **File Storage**: AWS S3  
- **AI**: OpenAI, Azure OpenAI  
- **OCR / Extraction**: Tesseract.js, pdf-lib, exceljs, Cheerio  

---

## ✅ Best Practices & Security

- 🔒 All critical routes are protected by **JWT**  
- 🔑 API keys and secrets are stored only in `.env`  
- 📂 User files are stored on **S3 with access control**  
- 🐛 Errors are logged and clearly returned through the API  

---

## 🤝 Contributing

Contributions are welcome!  

1. Fork the repo  
2. Create a branch:  
   ```bash
   git checkout -b feature/my-feature
   ```
3. Commit your changes:  
   ```bash
   git commit -m "feat: add my feature"
   ```
4. Push and open a PR  

---

## 📜 License

This project is licensed under the **MIT License**.

---

## 📬 Support

For questions or support, please open a GitHub issue.  