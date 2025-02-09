# TimeWorld Management

A modern web application for managing international contacts and their time zones, built with Vue 3 and Supabase.

![time-zone (1)](https://github.com/user-attachments/assets/59d3b435-eb20-4630-ae0d-376c43ee4691)

<a href="https://www.flaticon.com/free-icons/world-time" title="world time icons">World time icons created by Flat Icons - Flaticon</a>

## Features

### For Users

- **Contact Management**
  - Add, edit, and delete contacts with their time zone information
  - Store contact details including name, email, phone, location, and notes
  - View contact availability status (working, sleeping, free time)

- **Time Zone Visualization**
  - Interactive timeline view showing current time for all contacts
  - Real-time updates of contact local times
  - Visual indicators for contact availability status
  - Drag-and-drop timeline navigation

- **Smart Organization**
  - Search contacts by name, email, or location
  - Filter contacts by time zone and availability status
  - Sort contacts by name, time zone, status, or recent additions
  - Group contacts by region for easy management

- **Customization**
  - Multiple theme styles (Modern, Minimal, Glass, Neumorph, Colorful)
  - Light and dark mode support
  - Automatic system theme detection
  - Internationalization support (English and Spanish)

### For Developers

## Technical Stack

- **Frontend Framework**: Vue 3 with Composition API
- **Type Safety**: TypeScript
- **State Management**: Pinia
- **Styling**: Tailwind CSS
- **Database & Auth**: Supabase
- **Build Tool**: Vite
- **Icons**: Lucide Vue
- **Internationalization**: Vue I18n

## Architecture

### Core Components

1. **Authentication System**
   - Email-based authentication
   - Protected routes
   - Profile management
   - Session persistence

2. **State Management**
   - `authStore`: Handles user authentication and profile
   - `contactsStore`: Manages contact CRUD operations
   - `themeStore`: Controls application theming
   - `notificationStore`: Manages toast notifications

3. **Database Schema**
   ```sql
   profiles
     - id (uuid, PK)
     - email (text)
     - timezone (text)
     - language (text)
     - created_at (timestamptz)
     - updated_at (timestamptz)

   contacts
     - id (uuid, PK)
     - user_id (uuid, FK)
     - name (text)
     - email (text)
     - phone (text, optional)
     - timezone (text)
     - location (text, optional)
     - notes (text, optional)
     - created_at (timestamptz)
     - updated_at (timestamptz)
   ```

4. **Security Features**
   - Row Level Security (RLS) policies
   - Email validation constraints
   - Secure account deletion
   - Protected API endpoints

### Key Services

1. **TimeService**
   - Time zone conversion
   - Date formatting
   - Time zone list management

2. **Composables**
   - `useContactAvailability`: Manages contact status
   - `useContactTime`: Handles time updates
   - `useTimeline`: Controls timeline interactions

### Theme System

The application implements a comprehensive theme system with:
- Multiple visual styles
- Dark/light mode support
- CSS custom properties for dynamic theming
- Smooth transitions between themes

## Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/timezone-hub.git
   cd timezone-hub
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Add your Supabase credentials to `.env`

4. Start development server:
   ```bash
   npm run dev
   ```

## Building for Production

1. Build the application:
   ```bash
   npm run build
   ```

2. Preview the build:
   ```bash
   npm run preview
   ```

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Vue.js](https://vuejs.org/)
- [Supabase](https://supabase.io/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)
