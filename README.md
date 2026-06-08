# TapHTML

TapHTML is an open-source, self-hostable live chat platform. It allows you to run your own live chat widget, store your own data, and avoid third-party tracking cookies.

The project is structured as a monorepo containing the backend API, dashboard, browser extensions, and embeddable widget.

## Repository Structure

* **`api`**: Node.js backend handling REST endpoints, WebSockets, database operations, caching, and alerts.
* **`dashboard`**: Preact dashboard interface.
* **`widget`**: Preact live chat client interface.
* **`extension`**: Preact browser extension for Chrome and Firefox.
* **`landing`**: HTML and CSS landing page.

## Tech Stack

### Backend API
* **Framework:** Express (Node.js)
* **Real-Time:** Socket.io
* **Databases:** PostgreSQL, Redis
* **Authentication:** JWT, fido2-lib
* **Mails & Alerts:** Nodemailer, Web Push API

### Admin Dashboard
* **Framework:** Preact
* **Build Tool:** Vite
* **State Management:** Zustand
* **Routing:** Wouter
* **Real-Time Client:** Socket.io-client

### Browser Extension (Chrome & Firefox)
* **Framework:** Preact
* **Build Tool:** Vite (with `fs-extra` for dual-manifest compilation)
* **State Management:** Zustand
* **Real-Time Client:** Socket.io-client

### Widget
* **Framework:** Preact
* **Build Tool:** Vite
* **Real-Time Client:** Socket.io-client

## Features

### A) API
The backend handles REST routes, live communications, and notification triggers.
* **Databases**: Uses PostgreSQL as database and Redis for storing authentication sessions and OTP.
* **Authentication**: Uses Access and Refresh tokens. When an access token expires and a user runs a refresh request, both the access and refresh tokens are rotated instantly to prevent reuse. Supports passwordless authentication via Passkeys
* **WebSockets**: Utilizes `socket.io` for duplex communication between visitors and admins.
* **Mails**: Uses `nodemailer` to dispatch send emails for account authentication and team invitations.

### B) Admin Dashboard
The dashboard allows admins to view metrics, communicate with visitors, and configure the platform.

1. **Analytics**: The main landing page reports operations traffic metrics. Stats include:
    * Total Chats (all time)
    * Today (new chats created in the current day)
    * Active (chats updated within the last 24 hours)
    * Traffic (new chats created over the past 7 days)
    * Top Countries (chat counts sorted by geography)
    * Peak Hours (chat tracking heatmap sorted by hour)

2. **Chats**: Displays all conversations. Admins can search individual chat by visitor email address. Selecting a visitor reveals the full messaging thread.

3. **Widget Customization**: Allows real-time adjustments to the widget styling. There are total of 25 specific design configurations.

4. **Installation Integration**: Contains the script required to embed the chat interface into website:
    ```html
    <script async type="module" src="https://widget.taphtml.com" data-id="YOUR WIDGET ID"></script>
    ```

5. **Team**: Supports two structural roles: `OWNER` and `TEAM`.
    * `OWNER` users hold privileges to invite new member, adjust member emails/roles, or delete users from the workspace.
    * `TEAM` users are restricted only from team-altering features.

6. **Settings**: Divided into distinct functional subsections:
    * **Account**: Modify personal name and email address.
    * **Gmail Connection**: Connect or switch Gmail to handle direct message replies to visitor emails.
    * **Notification Triggers**: Manage active notification for Web Push, Slack, Discord, and Telegram.
    * **Account Deletion**: Delete own records permanently.
    * **Logout**: Logout from all logged in devices (Logging out of the current device only is handled from the sidebar).

7. **PWA Standalone App Link**: To install the dashboard as a mobile and desktop web app: `https://dashboard.taphtml.com/?app=true`

### C) Browser Extensions
Single Vite + Preact codebase for both Chrome and Firefox. Build command generate the separate manifest files required by each browser.

### D) Embeddable Web Widget
Embeddable script (~74 kB) built using Vite, Preact, and `socket.io-client` that operates in complete isolation from the website's background runtime scripts.

## Local Development Setup

1. Set up the environment variables for each service by copying `.env.example` to `.env` inside their respective directories and fill in your values. :
    ```bash
    cp api/.env.example api/.env
    cp dashboard/.env.example dashboard/.env
    cp widget/.env.example widget/.env
    cp extension/.env.example extension/.env
    ```

2. Install the dependencies for all services from the root of the repository:
    ```bash
    npm run install
    ```

3. Start each service using the root commands. Run these in separate terminal windows:
    ```bash
    # Backend server
    npm run api

    # Admin dashboard
    npm run dashboard

    # Chat widget
    npm run widget

    # Browser extension
    npm run extension
    ```

## Local Setup via Docker

1. Clone the platform repository locally:
    ```bash
    git clone https://github.com/prodsaas/taphtml.git
    cd taphtml
    ```

2. Set up the environment variables for each service. Navigate into the `api`, `dashboard`, `widget`, and `extension` folders, copy `.env.example` to `.env`, and fill in your values. You can create the files from the root directory using:
    ```bash
    cp api/.env.example api/.env
    cp dashboard/.env.example dashboard/.env
    cp widget/.env.example widget/.env
    cp extension/.env.example extension/.env
    ```

3. Spin up the containers using Docker Compose:
    ```bash
    docker compose up --build
    ```

## License

This repository is available as open-source software under the terms of the [MIT License](LICENSE).