# SAP RBAC & SoD Simulator

**🚀 Live Demo:** https://sap-security-simulator.onrender.com

A web-based SAP Security Simulator that demonstrates core SAP S/4HANA security concepts, including role design, user administration, authorization management, and automated Segregation of Duties (SoD) conflict detection.

## Features

- **Dashboard:** View security information and detected SoD violations.
- **Role Management (PFCG-style):** Create and manage single and composite roles.
- **User Administration (SU01-style):** Manage users and assign roles.
- **Authorization Management:** Configure authorization objects and access permissions.
- **SoD Conflict Detection:** Identify conflicting authorizations and potential security risks.
- **Audit Logs (SM20-style):** Review available security audit information.
- **Sample Data:** Includes a demonstration user with conflicting roles to showcase SoD detection.

## Technology Stack

- **Backend:** Node.js, Express.js
- **Frontend:** HTML, CSS, JavaScript
- **Data Storage:** JSON file-based storage
- **Version Control:** Git and GitHub
- **Deployment:** Render

## Getting Started

### Prerequisites

- Node.js and npm installed.

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/keerthana935/sap-security-simulator.git
   ```

2. Navigate to the project directory:

   ```bash
   cd sap-security-simulator
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Start the application:

   ```bash
   npm start
   ```

5. Open your browser and visit:

   ```text
   http://localhost:3000
   ```

## Project Structure

```text
sap-security-simulator/
├── server.js
├── db.js
├── package.json
├── package-lock.json
├── data/
│   └── store.json
├── routes/
│   ├── users.js
│   ├── roles.js
│   ├── authorizations.js
│   ├── sod.js
│   └── audit.js
└── public/
    ├── index.html
    ├── css/
    │   └── style.css
    └── js/
        └── app.js
```

## How SoD Conflict Detection Works

1. Retrieve the roles assigned to a user.
2. Expand composite roles into their child roles when applicable.
3. Collect the effective authorization codes associated with those roles.
4. Compare the user's authorizations against configured SoD rules.
5. Identify and display violations when both sides of a conflicting authorization pair are present.

## Future Enhancements

- Integration with a relational database such as MySQL or PostgreSQL.
- Enhanced audit reporting and security analytics.
- Risk owner approval workflows for SoD violations.
- Improved authentication and access control.
- Additional security rules and authorization objects.

## Learning Outcomes

This project demonstrates practical concepts related to role-based access control (RBAC), user and role administration, authorization management, security risk identification, REST APIs, and web application development.

## Author

**Jala Keerthana**

- GitHub: https://github.com/keerthana935
- Project Repository: https://github.com/keerthana935/sap-security-simulator

---

*Developed as a hands-on project to explore SAP S/4HANA security concepts and access control workflows.*
