# Poker Tracker

A web application for tracking monthly Texas Hold'em poker tournaments.

## Features

- User authentication (login/register)
- Track tournament entries with date, buy-ins, rebuys, and winnings
- View personal statistics and performance over time
- Compare your performance with other players
- Interactive charts and visualizations

## Setup

1. Install dependencies:
```bash
npm install
```

2. Initialize the database:
```bash
npm run init-db
```

3. Start the server:
```bash
npm start
```

4. Open your browser to `http://localhost:3000`

## Usage

- Register a new account or login
- Add tournament entries with the date, amount spent (including rebuys), and winnings
- View your dashboard to see statistics and charts
- Compare your performance with other players

## Technology Stack

- Node.js + Express
- SQLite database
- EJS templates
- Chart.js for visualizations
- bcryptjs for password hashing
