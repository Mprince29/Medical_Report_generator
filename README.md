🧬 Diagnostics Management System 

A full-stack diagnostics and patient management platform for clinical labs or hospitals. Built with Node.js, Express.js, MySQL, and integrated into a desktop interface via Electron.js, this system provides real-time test management, OTP-based login, JWT authentication, and billing/reporting functionality.

✨ Features

🧪 Medical Test Management (CRUD)

👩‍⚕️ Patient Visit & Test Record Keeping

📄 Comprehensive Report Generation

📊 Dynamic Billing System (with tax calculations)

🔐 Secure Auth System:

Email/password login

OTP-based phone login

JWT token + session-based auth

📬 Contact Form Submission (stored in DB)

🧠 Input Validation & Error Handling

💻 Electron App Integration

🔎 Search API for reports

🚀 Ready for Full Deployment

⚙️ Tech Stack

Backend: Node.js, Express.js

Frontend: HTML, CSS (served via Express static files)

Database: MySQL (user_management)

Desktop: Electron.js

Auth: JWT + Sessions + Bcrypt for hashing

Others: CORS, Body-Parser, dotenv, file system (fs)

📁 Folder Structure

├── public/

│   ├── Luchkee_homepage.html

│   ├── Luchkee Dashboard.html

│   └── Login.html

├── server.js

├── package.json

└── README.md

🔐 Authentication
Manual Signup/Login using:

POST /signup with email, phone, password

POST /login with email & password

OTP Login via:

POST /request-otp (send OTP to phone)

POST /verify-otp (verify OTP + login)

Authenticated users can access protected routes like /dashboard, /api/tests, etc.

📋 API Endpoints

Method	Endpoint	Description

GET	/dashboard	Dashboard view with session user

POST	/signup, /login	Manual user authentication

POST	/request-otp, /verify-otp	Phone number based OTP login

POST	/contact	Contact form submission

GET	/api/tests	Fetch medical test list

PUT	/api/tests/:id	Update medical test info

POST	/api/patients	Add patient + tests + billing

GET	/api/reports	Search reports (by name/ID)

GET	/api/report/:visitId	View specific report with billing

PUT	/api/report/:visitId	Update report details

GET	/api/next-visit-id	Generate new visit ID like LH1001

POST	/logout	Destroy session

🔒 Security Notes
Passwords are hashed with bcrypt

JWT tokens are stored in both headers and session

Input validation ensures:

Valid email format

Strong password (8+ characters)

Valid phone number format

⚙️ Setup & Installation
1. Clone the Repository
bash
Copy
Edit
git clone https://github.com/your-username/diagnostics-management-system.git
cd diagnostics-management-system
2. Install Dependencies
bash
Copy
Edit
npm install
3. Setup MySQL Database
sql
Copy
Edit
CREATE DATABASE user_management;
-- Create tables: users, contact_submissions, patients, patient_tests, test_results, reference_ranges, patient_billing, medical_tests
4. Start the Server
bash
Copy
Edit
node server.js

🖥️ Electron Integration
The backend is compatible with Electron. When used as an Electron app, it gracefully shuts down the server on app exit:

👤 Author

Master Prince
