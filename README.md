# 🏦 Secure Bank Application

A full-stack banking simulation app built with Spring Boot, React, MySQL, JWT authentication, account management, fund transfers, transaction history, and scheduled autopay.

> This is a portfolio/demo project, not a real banking system.

## ✨ Key Features
* **JWT Authentication:** Stateless login and protected API routes.
* **Password Hashing:** User passwords are stored with BCrypt instead of plain text.
* **Account Ownership Checks:** Users can only open accounts for themselves, transfer from their own accounts, view their own account history, and cancel their own scheduled transfers.
* **Transaction Engine:** Transfers update sender/receiver balances and save receipts.
* **Scheduled Autopay:** Spring Scheduling processes future transfers.
* **React Dashboard:** Responsive wallet, transfer, autopay, contact book, and transaction history UI.

## 🛠️ Tech Stack
**Backend:** Java 17, Spring Boot, Spring Security, Hibernate/JPA, Maven  
**Frontend:** React, Vite, JavaScript, Tailwind CSS  
**Database:** MySQL  
**Architecture:** REST API, Stateless JWT, Monorepo

## 🔐 Security Notes
This version removes hardcoded database credentials and hardcoded JWT secrets from source code.

Set these environment variables before running the backend:

```bash
DB_URL=jdbc:mysql://localhost:3306/bank_app_db
DB_USERNAME=root
DB_PASSWORD=your_mysql_password_here
JWT_SECRET=replace_with_a_long_random_secret_at_least_32_chars
JWT_EXPIRATION_MS=36000000
```

A template is included at:

```text
backend/.env.example
```

Important: if an old real database password was committed before, change that MySQL password locally too. Removing it from the file does not remove it from Git history.

## 📸 Screenshots

### 1. Secure Login & Registration
<img width="743" height="670" alt="Login screen" src="https://github.com/user-attachments/assets/1467fdc1-1262-4c6d-9824-3b0c325b832c" />

### 2. Main Dashboard & Wallet
<img width="1279" height="889" alt="Dashboard" src="https://github.com/user-attachments/assets/b9166ead-0172-43cb-afe0-e853a87fcba6" />

### 3. Transaction History
<img width="1406" height="765" alt="Transaction history" src="https://github.com/user-attachments/assets/ef92daa6-6fbb-41e5-96e1-9695dd9a3680" />

## 🚀 How to Run Locally

### Prerequisites
* Java 17 or higher
* Node.js and npm
* MySQL Server running on port 3306

### 1. Database Setup
Create a MySQL database:

```sql
CREATE DATABASE bank_app_db;
```

Hibernate is configured with `spring.jpa.hibernate.ddl-auto=update`, so Spring Boot can create/update tables during development.

### 2. Configure Environment Variables
Windows PowerShell example:

```powershell
$env:DB_URL="jdbc:mysql://localhost:3306/bank_app_db"
$env:DB_USERNAME="root"
$env:DB_PASSWORD="your_mysql_password_here"
$env:JWT_SECRET="replace_with_a_long_random_secret_at_least_32_chars"
```

macOS/Linux example:

```bash
export DB_URL="jdbc:mysql://localhost:3306/bank_app_db"
export DB_USERNAME="root"
export DB_PASSWORD="your_mysql_password_here"
export JWT_SECRET="replace_with_a_long_random_secret_at_least_32_chars"
```

### 3. Start the Java Backend

```bash
cd backend
./mvnw spring-boot:run
```

The backend runs on `http://localhost:8080`.

### 4. Start the React Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:5173`.
