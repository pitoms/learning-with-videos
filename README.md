# AcademiaX - Learn Anything

A modern, full-featured educational video platform built with React, TypeScript, and TailwindCSS. This application allows users to browse, create, watch, and comment on educational videos.

## Features

- **Browse Videos**: View a grid of educational videos with search functionality
- **Video Playback**: Full-featured video player with:
  - Play/pause controls
  - Progress bar with seeking
  - Volume control with mute toggle
  - Playback speed adjustment (0.25x - 2x)
  - Fullscreen support
  - Keyboard shortcuts
- **Create Videos**: Upload new videos with title, description, and URL
- **Edit Videos**: Update video title and description
- **Comments**: View and add comments on videos
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **Routing**: React Router v6
- **State Management**: TanStack React Query
- **Icons**: Lucide React
- **API**: RESTful backend integration

## Project Structure

```
src/
├── components/
│   ├── layout/          # Header, Layout components
│   ├── ui/              # Reusable UI components (Button, Input, etc.)
│   └── video/           # Video-specific components
├── hooks/               # Custom React hooks for data fetching
├── pages/               # Page components
├── services/            # API service layer
├── types/               # TypeScript type definitions
└── constants/           # Application constants
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open http://localhost:5173 in your browser

## API Integration

The application integrates with the following API endpoints:

| Method | Endpoint                         | Description                 |
| ------ | -------------------------------- | --------------------------- |
| GET    | `/videos?user_id={id}`           | Fetch all videos for a user |
| GET    | `/videos/single?video_id={id}`   | Fetch a single video        |
| POST   | `/videos`                        | Create a new video          |
| PUT    | `/videos`                        | Update a video              |
| GET    | `/videos/comments?video_id={id}` | Fetch comments for a video  |
| POST   | `/videos/comments`               | Create a new comment        |

## Keyboard Shortcuts

| Key           | Action            |
| ------------- | ----------------- |
| `Space` / `K` | Play/Pause        |
| `F`           | Toggle fullscreen |
| `M`           | Toggle mute       |
| `←`           | Seek backward 10s |
| `→`           | Seek forward 10s  |
| `↑`           | Volume up         |
| `↓`           | Volume down       |

## Design Decisions

### Architecture

- **Component-based**: Modular components for reusability
- **Custom hooks**: Separation of data fetching logic from UI components
- **Service layer**: Centralized API calls with error handling

### State Management

- **React Query**: Efficient server state management with caching, refetching, and optimistic updates

### Styling

- **TailwindCSS**: Utility-first approach for rapid UI development
- **Consistent design system**: Unified colors, spacing, and typography

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
