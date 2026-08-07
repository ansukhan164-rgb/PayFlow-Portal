
# Employee Payroll and Leave Management System

A static frontend dashboard built with HTML, CSS, and JavaScript.

## Run locally

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm start
```

3. Open the app at:

```text
http://127.0.0.1:3000/index.html
```

## Vercel Deployment

This project is ready for static deployment on Vercel.

1. Push the repository to GitHub or another Git host.
2. Import the project in Vercel.
3. Use the root folder as the deployment source.

Vercel will serve `index.html` and fallback all routes to it using `vercel.json`.

## Notes

- The app is currently a static site using `js/app.js` and `js/data.js`.
- `js/login.jsx` exists for future React-based login integration, but the current site does not yet mount it automatically.
