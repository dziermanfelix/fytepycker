# Fytepycker

Tired of arguing over who _really_ knows UFC best? Think you can outpick your friends on every fight card? Step into the digital octagon with **Fytepycker**—a head-to-head UFC betting experience that lets your fight predictions do the talking.

Fytepycker is a social betting app for UFC events that keeps you in the action. It automatically scrapes official UFC fight cards so you're always picking from up-to-date matchups. Create head-to-head challenges, make your picks, and watch the scores update in realtime. Over time, track exactly how your predictions stack up with a full history of events and a clear record of your total winnings (or losings) — all in a sleek, easy-to-use interface.

## How To Play

1. **Create an Account** – Sign up and log in to start picking.
2. **View Upcoming Events** – Fytepycker pulls the latest UFC fight cards so you’re always in the know.
3. **Start a Matchup** – Create a matchup against a friend.
4. **Make Your Picks** – Predict the winners for each fight in the event by selecting your fighter when it's your turn.
5. **Track Results & Rankings** – After each event, visit the Record tab to see how you fare against your opponents.

## Tech Stack

- **Frontend:** React, Tailwind CSS for fast and responsive UI
- **Backend:** Django with Django REST Framework (DRF)
- **Database:** PostgreSQL for robust relational data storage
- **Auth:** JSON Web Tokens (JWT) for secure authentication
- **Scraping:** Beautiful Soup + Playwright to extract and automate UFC event data
- **Asynchronous Tasks:** Celery + cron jobs for scheduling regular fight card updates
- **Real-Time:** Redis + Django Channels + WebSockets for live matchup updates
- **Testing:** The backend is thoroughly tested using Django REST Framework’s `APITestCase`, allowing full end-to-end testing of API behavior, including authentication, request handling, and data validation.
- **Containerization:** Built and managed with Docker for local development and deployment
- **Deployment:** Docker-based deployment with environment-specific settings for easy scaling
- **Modular Architecture:** Clean separation of concerns between services for maintainability

## Features

- **Automatic Fight Card Updates:** Fight cards update regularly using automated scraping from UFC.com.
- **1v1 Matchups:** Challenge your friends and make your picks for each event.
- **Event History & Rankings:** Track how you perform over time with detailed matchup results.
- **Real-Time Updates:** See picks and results as they happen, no refresh required.
