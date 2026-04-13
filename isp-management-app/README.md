# ISP Management Application

This project is a comprehensive solution for Internet Service Providers (ISPs), featuring a backend server, an admin web application, and a mobile application for technicians. The system is designed to manage users, permissions, billing, network operations, and support tickets efficiently.

## Project Structure

```
isp-management-app
├── backend                # Backend server
│   ├── src
│   │   ├── app.ts        # Entry point for the backend application
│   │   ├── config        # Configuration settings
│   │   ├── modules       # Functional modules (auth, admins, technicians, etc.)
│   │   └── types         # TypeScript types and interfaces
│   ├── package.json      # Backend dependencies and scripts
│   └── tsconfig.json     # TypeScript configuration for the backend
├── admin-web             # Admin web application
│   ├── src
│   │   ├── app.ts        # Entry point for the admin web application
│   │   ├── pages         # React components for different pages
│   │   ├── components     # Shared components
│   │   └── types         # TypeScript types and interfaces
│   ├── package.json      # Admin web dependencies and scripts
│   └── tsconfig.json     # TypeScript configuration for the admin web
├── tech-mobile           # Technician mobile application
│   ├── src
│   │   ├── app.ts        # Entry point for the technician mobile application
│   │   ├── screens       # Screens for the mobile app
│   │   ├── components     # Shared components
│   │   └── types         # TypeScript types and interfaces
│   ├── package.json      # Technician mobile dependencies and scripts
│   └── tsconfig.json     # TypeScript configuration for the technician mobile
├── shared                # Shared resources across applications
│   ├── src
│   │   ├── api           # API functions
│   │   ├── constants     # Constant values
│   │   ├── hooks         # Custom hooks
│   │   └── types         # Shared TypeScript types and interfaces
│   ├── package.json      # Shared module dependencies and scripts
│   └── tsconfig.json     # TypeScript configuration for the shared module
├── package.json          # Main project dependencies and scripts
└── tsconfig.json         # Main TypeScript configuration for the project
```

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm (Node Package Manager)

### Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd isp-management-app
   ```

2. Install dependencies for each module:
   - For the backend:
     ```
     cd backend
     npm install
     ```

   - For the admin web:
     ```
     cd admin-web
     npm install
     ```

   - For the technician mobile:
     ```
     cd tech-mobile
     npm install
     ```

   - For the shared module:
     ```
     cd shared
     npm install
     ```

### Running the Applications

- To start the backend server:
  ```
  cd backend
  npm start
  ```

- To start the admin web application:
  ```
  cd admin-web
  npm start
  ```

- To start the technician mobile application:
  ```
  cd tech-mobile
  npm start
  ```

## Features

- User authentication and authorization
- Admin management for users and permissions
- Technician task management
- Customer information management
- Network management functionalities
- Billing and invoicing capabilities
- Support ticket management

## Contributing

Contributions are welcome! Please submit a pull request or open an issue for any suggestions or improvements.

## License

This project is licensed under the MIT License. See the LICENSE file for details.