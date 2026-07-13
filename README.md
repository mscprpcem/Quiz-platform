# MSC Live Quiz Platform

A real-time web-based quiz platform for the Microsoft Student Club events.

## Features
- **Real-Time Synchronized Quiz Play**: Admins control when questions are released and skipped, with real-time sync using Socket.io.
- **Fluent/Microsoft-Inspired Design**: Modern, responsive, minimal layout.
- **Excel Question Import/Export**: Import questions directly from `.xlsx` files and export results, analytics, and participant responses.
- **Interactive Leaderboard**: Updated live after each question, showing rank, points, correct answers, and speed.
- **Anti-Cheating Mechanisms**: Force fullscreen, detect tab switching and focus loss, with configurable penalty point deductions.
- **Rich Analytics**: Visualized score distributions, accuracy rates, and response speed charts.

## Structure
- `/backend`: Node.js Express server + Socket.IO + Sequelize (SQLite/PostgreSQL)
- `/frontend`: React client + Tailwind CSS + Vite

## Installation & Getting Started

1. **Install Dependencies**:
   From the root folder, run:
   ```bash
   npm run install-all
   ```

2. **Set up Environment**:
   Configure `.env` in `backend/` as needed (defaults are pre-configured for SQLite fallback).

3. **Start Development Servers**:
   Run the following in the root folder:
   ```bash
   npm run dev
   ```

## Default Admin Login
- **Email**: `admin@microsoftclub.edu`
- **Password**: `Admin@123`
