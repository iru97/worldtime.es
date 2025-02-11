
![worldtime-logo](https://github.com/user-attachments/assets/1343ff5f-0915-41eb-b79b-f7a1147fc415)
---
A powerful web application for seamless global team coordination and time zone management. WorldTime helps you stay connected with your international contacts by providing real-time visibility of their local time, availability, and work schedules.




## Features

### For Users

- **Interactive Timeline**

  - Dynamic, fluid timeline showing current times across all time zones
  - Intuitive drag-and-drop navigation through different times
  - Quick "Current Time" button to instantly return to present
  - Visual time markers with 3-hour intervals
  - Smooth animations and transitions

- **Smart Contact Management**

  - Effortlessly manage your global network with detailed contact profiles
  - Track local times and availability status in real-time
  - Store essential contact information including email, phone, location, and notes
  - Intelligent availability indicators (working, sleeping, free time)

- **Visual Availability Indicators**

  - Real-time status updates for each contact
  - Color-coded indicators for working hours, sleep time, and free time
  - Time until next status change
  - Local time conversion for easy reference

- **Powerful Organization Tools**

  - Smart search functionality for contacts and locations
  - Advanced filtering by time zone and availability
  - Multiple sorting options (name, time zone, status, recent)
  - Regional grouping for better team management

- **Beautiful & Customizable Interface**
  - Five stunning theme styles:
    - Modern: Clean and professional
    - Minimal: Simple and focused
    - Glass: Elegant transparency effects
    - Neumorph: Soft and dimensional
    - Colorful: Vibrant and energetic
  - Automatic dark/light mode switching
  - System theme detection
  - Multi-language support (English/Spanish)

### Coming Soon

- **Google Calendar Integration**

  - Seamless calendar sync
  - Smart meeting scheduling
  - Availability conflict detection
  - Meeting time suggestions

- **Enhanced Team Features**
  - Team grouping and management
  - Shared schedules
  - Group availability view
  - Team analytics

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
   git clone https://github.com/your-username/worldtime.git
   cd worldtime
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
