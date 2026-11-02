# HireFlow

**Automating the hiring journey from request to offer.**

HireFlow is a comprehensive recruiting platform designed to replace fragmented spreadsheets and manual workflows with a streamlined, automated system. Built by the SixAcademy student team, it empowers recruiters to manage vacancies, track candidate pipelines, and collaborate with hiring managers—all in one place.

---

## 🛠 Tech Stack

### Backend

- **Framework:** [NestJS](https://nestjs.com/) (Node.js)
- **Language:** TypeScript
- **Database:** PostgreSQL
- **ORM:** [TypeORM](https://typeorm.io/)
- **Testing:** Jest

### Frontend

- **Framework:** [React 19](https://react.dev/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Styling:** Vanilla CSS
- **Linting:** ESLint

### Infrastructure & DevOps

- **Containerization:** Docker & Docker Compose
- **CI/CD:** GitHub Actions
- **Formatting:** Prettier

---

## 📂 Project Structure

```text
hireflow/
├── api/             # NestJS Backend API
│   ├── src/         # Application source code
│   └── test/        # Unit and E2E tests
├── ui/              # React Frontend
│   └── src/         # Components and application logic
├── docker/          # Docker configuration & Compose files
└── .github/         # CI/CD Workflows
```

---

## 🚦 Getting Started

### Prerequisites

- Node.js (v20+)
- Docker & Docker Compose

### Fast Track with Docker

```bash
# Clone the repository
git clone https://github.com/your-repo/hireflow.git
cd hireflow

# Start the entire stack
docker-compose -f docker/docker-compose.yml up --build
```

### Local Development

**Backend:**

```bash
cd api
npm install
npm run start:dev

# run migrations
npm run migration:run

# generate migration (based on entity changes)
npm run migration:generate -- src/database/migrations/<migration-name>
```

**Frontend:**

```bash
cd ui
npm install
npm run dev
```

---

## 👥 The Team

HireFlow is developed by a dedicated team of junior developers at **SixAcademy**, focusing on building real-world products with professional engineering standards.

---

> "HireFlow is the tool that lets a small recruiting team work twice as fast, never lose a candidate, and always know the status of every open position."

### 🔐 Default Credentials

When the database migrations are executed, a default System Admin account is automatically seeded.
You can use these credentials to log in to the platform for the first time:

```text
Email: fireflow.dev@gmail.com
Password: Admin_123
```

### MinIO Console (S3 Storage):

If you are running the project using Docker Compose,
MinIO is available at http://localhost:9001 with the following default credentials:

```text
User: minioadmin
Password: minioadmin
```
