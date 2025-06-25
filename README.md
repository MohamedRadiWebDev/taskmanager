# Task Manager - Static Web Application

A modern, feature-rich task management application built with pure HTML, CSS, and JavaScript. No backend server required!

## Features

### Core Functionality
- **Task Management**: Create, edit, complete, and delete tasks
- **Priority System**: High (🔥), Medium (☕), and Low (zzz) priority levels with animated icons
- **Status Tracking**: To Do, In Progress, and Completed status management
- **Categories**: Organize tasks with custom categories

### Advanced Features
- **Search & Filtering**: Real-time search with text highlighting and advanced filters
- **Recurring Tasks**: Daily, weekly, monthly, and custom day-of-week recurrence
- **Scheduled Tasks**: Set due dates and times for tasks
- **Swipe to Delete**: Mobile-friendly swipe gestures with animated truck effect
- **Audio Feedback**: Sound effects for task actions using Web Audio API

### User Experience
- **Responsive Design**: Mobile-first design that works on all devices
- **Animated Interactions**: Smooth animations and visual feedback
- **Local Storage**: All data persists in browser localStorage
- **Session Management**: Simple login system for multiple users

## Getting Started

### Option 1: Direct File Access
1. Download all files to a folder
2. Open `index.html` in any modern web browser
3. Start managing your tasks!

### Option 2: Local Web Server
For the best experience (especially for the truck SVG animations), serve the files through a local web server:

```bash
# Using Python 3
python -m http.server 8000

# Using Node.js (if you have http-server installed)
npx http-server

# Using PHP
php -S localhost:8000
```

Then visit `http://localhost:8000` in your browser.

## File Structure

```
├── index.html          # Main application file
├── css/
│   └── style.css       # All styles and animations
├── js/
│   ├── app.js          # Main application logic
│   └── audio.js        # Audio management system
├── images/
│   └── truck.svg       # Animated truck for swipe-to-delete
└── README.md           # This file
```

## Browser Compatibility

- **Chrome/Edge**: Full support
- **Firefox**: Full support
- **Safari**: Full support (iOS 12+)
- **Mobile Browsers**: Optimized for touch interactions

## Local Storage

The application uses browser localStorage to persist:
- User sessions
- All task data
- User preferences

Data remains available between browser sessions but is specific to each browser/device.

## Features in Detail

### Priority Icons
- **High Priority (🔥)**: Animated fire with flickering effects
- **Medium Priority (☕)**: Coffee cup with rising steam animation
- **Low Priority (zzz)**: Sleep text with floating sleep bubbles

### Search & Filtering
- **Text Search**: Search across task names, descriptions, and categories
- **Priority Filter**: Filter by High/Medium/Low priority
- **Category Filter**: Dynamically populated with existing categories
- **Due Date Filter**: Show overdue, due today, this week, or this month
- **Combined Filters**: All filters work together for precise results

### Recurring Tasks
- **Daily**: Repeats every day at the same time
- **Weekly**: Repeats every 7 days
- **Monthly**: Repeats monthly on the same date
- **Custom**: Select specific days of the week

### Mobile Experience
- **Touch-Friendly**: 44px minimum touch targets
- **Swipe Gestures**: Swipe left to delete tasks with truck animation
- **Responsive Layout**: Adapts to all screen sizes
- **Always-Visible Actions**: Task buttons always visible on mobile

## Customization

### Colors and Themes
Edit the CSS variables in `css/style.css`:

```css
:root {
    --primary-color: #0d6efd;
    --priority-high: #dc3545;
    --priority-medium: #ffc107;
    --priority-low: #198754;
}
```

### Sound Effects
Modify the audio generation in `js/audio.js` to create custom sound effects.

### Animations
Adjust animation timings and effects in the CSS keyframes sections.

## Development Notes

This application was converted from a Flask-based backend to a pure frontend solution. All server-side functionality has been replaced with client-side equivalents:

- **Authentication**: Simple localStorage-based sessions
- **Data Persistence**: Browser localStorage instead of database
- **Real-time Updates**: JavaScript intervals for scheduled task checking

## License

MIT License - Feel free to use and modify for personal or commercial projects.

## Support

This is a standalone application with no external dependencies beyond standard web browser APIs. If you encounter issues:

1. Ensure you're using a modern web browser
2. Check browser console for any JavaScript errors
3. Clear localStorage if data becomes corrupted: `localStorage.clear()`
4. For best experience, serve files through a web server rather than file:// protocol
