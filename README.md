# Allocation Problem

This is an interactive, frontend allocation interface built for processing customer salmon orders based on strict inventory, credit, and pricing constraints.

## Live Demo
[View the Live Deployment Here](https://allocation-app-six.vercel.app/)

## Tech Stack
* **Framework:** React + TypeScript (via Vite)
* **Styling:** Tailwind CSS + shadcn/ui
* **State Management:** Zustand
* **Deployment:** Vercel

## Core Features
* **Auto-Assignment Algorithm:** Automatically processes orders based on Priority (EMERGENCY > OVER_DUE > DAILY) and FIFO.
* **Wildcard Resolution:** Dynamically routes `WH-000` and `SP-000` orders to the warehouse/supplier with the highest available stock.
* **Banker's Rounding:** Strictly enforces financial rounding rules to 2 decimal places and rounds midpoint values (ending in exactly 5) to the nearest even number.
* **Manual Override:** Users can manually adjust allocations via the data grid. Inputs are strictly validated against remaining stock and customer credit limits.

## Local Setup

Follow these steps to get the project up and running on your local machine:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/TemPattrakorn/allocation-app.git
   
2. **Navigate into the project directory:**
   ```bash
   cd allocation-app
   
3. **Install the dependencies:**
   ```bash
   npm install
   
4. **Start the development server:**
   ```bash
   npm run dev
   
5. **Open the app:**

   Your terminal will provide a local address (usually http://localhost:5173/). Click or copy/paste it into your browser to view the app.
