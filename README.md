# Absensi Magang Frontend (Logwork System)

Frontend application for the Absensi Magang (Internship Attendance) system. Built with React and Vite, featuring a modern, dark-themed, glassmorphism UI with role-based access control and OpenFreeMap integration for geofencing.

## 🚀 Features

### For Users (Interns)
- **Dashboard**: Track daily shift status (Not Started / Active / Completed).
- **Work Logs**: Add detailed task entries throughout the active shift.
- **Geofencing Verification**: Start and end shifts strictly within designated work zones using MapLibre & OpenFreeMap tiles.
- **History**: View monthly work history and statistics.
- **Profile Management**: Update personal information and change passwords.

### For Administrators
- **Dashboard Overview**: Monitor active users, ongoing shifts, and total hours for the day.
- **User Management**: Full CRUD operations for managing interns/users.
- **Geofence Control**: Interactive map tools to define and toggle valid work zones (radius-based).
- **Log Management**: Review all shifts, edit details (like descriptions and break minutes), and filter by month/user/status.
- **System Configuration**: Set default break durations and other global settings.

## 🛠️ Technology Stack

- **Framework**: React 19 + Vite 8
- **Routing**: React Router v7
- **HTTP Client**: Axios (configured with JWT interceptors)
- **Maps**: MapLibre GL JS + react-map-gl + Turf.js
- **Map Tiles**: [OpenFreeMap](https://openfreemap.org/) (Liberty Style)
- **Styling**: Vanilla CSS (Custom Properties / Variables design system)
- **Icons**: Lucide React
- **Date Handling**: date-fns (configured for `id` locale)

## 📦 Project Setup

### Prerequisites
- Node.js v18+
- The `Absensi-Magang-BE` backend running locally.

### Installation

1. Clone the repository and navigate to the frontend directory:
   ```bash
   cd Absensi-Magang-FE
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Create a `.env` file in the root directory (already configured by default for local development):
   ```env
   VITE_API_URL=/api
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Build for production:
   ```bash
   npm run build
   ```

## 🗺️ About the Map Implementation

This project uses **MapLibre** in combination with **OpenFreeMap** to provide completely free, vector-based map tiles. 
- The map style defaults to `https://tiles.openfreemap.org/styles/liberty`.
- Circle radiuses are generated as GeoJSON polygons using `@turf/circle` to accurately reflect radius bounds in meters regardless of zoom level or distortion.

## 🎨 Design System

The application relies heavily on CSS variables defined in `src/index.css`. The aesthetic is a sleek, dark UI focusing on readability and contrast. Key tokens:
- Primary Accent: `#6c63ff`
- Glassmorphism effects for floating elements (TopBar, Modals, Cards)
- Responsive sidebar navigation

## 🔒 Authentication Flow

Authentication is handled via JWT tokens stored in `localStorage`. 
- An `axios` interceptor automatically attaches the Bearer token to all outgoing requests.
- If a `401 Unauthorized` is returned by the backend, the `AuthContext` will automatically log the user out and redirect them to `/login`.
