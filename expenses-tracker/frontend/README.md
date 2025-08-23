# Expenses Tracker - React Native App

A comprehensive mobile application for tracking personal expenses with tithing support, built using React Native and Expo.

## Features

### 🎯 Core Functionality
- **Payment Frequency Options**: Choose between daily, weekly, or monthly payment schedules
- **Tithing Support**: Automatic 10% deduction calculation (customizable percentage)
- **Expense Tracking**: Log daily expenses with descriptions and categories
- **Smart Notifications**: Daily reminders at 11 PM to log expenses

### 📊 Analytics & Reports
- **Daily Summaries**: Track expenses for each day
- **Weekly Reports**: Saturday summaries at 11 PM
- **Monthly Reports**: End-of-month summaries at 11 PM
- **Real-time Dashboard**: View current spending and remaining budget

### 🔧 Data Management
- **Edit Expenses**: Modify expense details after creation
- **Delete Expenses**: Remove unwanted entries
- **Data Retention**: Configurable data cleanup (30, 90, 180, or 365 days)
- **Search & Filter**: Find expenses by category or date range

### ⚙️ Settings & Customization
- **Payment Settings**: Modify frequency, amount, and tithing preferences
- **Notification Preferences**: Control reminder schedules
- **Data Management**: Clear old data or reset the entire app
- **Category Management**: Organize expenses by type

## Tech Stack

- **Frontend**: React Native with Expo
- **Database**: SQLite (expo-sqlite)
- **Notifications**: Expo Notifications
- **UI Components**: React Native Paper
- **Navigation**: React Navigation v6
- **Date Handling**: date-fns
- **Icons**: Material Icons

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd expenses-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start the development server**
   ```bash
   npm start
   # or
   yarn start
   ```

4. **Run on device/simulator**
   - Press `a` for Android
   - Press `i` for iOS
   - Scan QR code with Expo Go app on your phone

## Project Structure

```
src/
├── context/
│   ├── DatabaseContext.js      # SQLite database operations
│   └── NotificationContext.js  # Push notification management
├── navigation/
│   └── MainTabNavigator.js     # Tab navigation setup
├── screens/
│   ├── OnboardingScreen.js     # Initial setup screen
│   ├── HomeScreen.js          # Dashboard and overview
│   ├── ExpensesScreen.js      # Expense list and management
│   └── SettingsScreen.js      # App settings and preferences
└── utils/                      # Helper functions (if any)
```

## Database Schema

### User Settings Table
- Payment frequency (daily/weekly/monthly)
- Payment amount
- Tithing percentage
- Tithing enabled flag

### Expenses Table
- Amount
- Description
- Category
- Date
- Timestamps

### Summary Tables
- Daily summaries
- Weekly summaries
- Monthly summaries

## Key Features Implementation

### 1. Tithing Calculation
```javascript
const calculateTithing = (amount, percentage) => {
  return (amount * percentage) / 100;
};
```

### 2. Daily Reminders
- Scheduled notifications at 11 PM daily
- Weekly summaries every Saturday
- Monthly summaries on the last day of each month

### 3. Data Persistence
- Local SQLite database
- Automatic data cleanup based on retention settings
- Export/import functionality (can be added)

## Configuration

### App Configuration (`app.json`)
- App name, version, and bundle identifier
- Notification settings
- Platform-specific configurations

### Database Configuration
- SQLite database file: `expenses.db`
- Automatic table creation on first run
- Data migration support

## Usage Guide

### First Time Setup
1. Launch the app
2. Choose payment frequency (daily/weekly/monthly)
3. Enter payment amount
4. Configure tithing percentage (default: 10%)
5. Complete setup to access the main app

### Daily Usage
1. **Add Expenses**: Use the FAB button on the home screen
2. **View Dashboard**: Check remaining budget and daily totals
3. **Review Expenses**: Navigate to Expenses tab for detailed view
4. **Edit/Delete**: Long press or use action buttons on expense items

### Weekly/Monthly Review
- Automatic notifications at scheduled times
- View summaries in the respective tabs
- Export data if needed

## Customization

### Adding New Categories
Modify the `getCategoryIcon` function in screens to add new expense categories:

```javascript
const icons = {
  'Food': 'restaurant',
  'Transport': 'directions-car',
  'Shopping': 'shopping-cart',
  'Bills': 'receipt',
  'Entertainment': 'movie',
  'Health': 'local-hospital',
  'General': 'attach-money',
  'YourCategory': 'your-icon-name',
};
```

### Modifying Notification Times
Update the notification scheduling in `NotificationContext.js`:

```javascript
const scheduleDailyReminder = async () => {
  await Notifications.scheduleNotificationAsync({
    content: { /* ... */ },
    trigger: {
      hour: 23,    // Change hour (0-23)
      minute: 0,   // Change minute (0-59)
      repeats: true,
    },
  });
};
```

## Troubleshooting

### Common Issues

1. **Database not initializing**
   - Check if expo-sqlite is properly installed
   - Verify device permissions

2. **Notifications not working**
   - Ensure notification permissions are granted
   - Check device notification settings
   - Verify Expo project configuration

3. **App crashes on startup**
   - Clear app cache and data
   - Reinstall the app
   - Check console for error messages

### Debug Mode
Enable debug logging by adding console.log statements or using React Native Debugger.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the code comments for implementation details

## Future Enhancements

- [ ] Cloud sync support
- [ ] Multiple currency support
- [ ] Budget planning features
- [ ] Expense analytics and charts
- [ ] Receipt photo capture
- [ ] Export to CSV/PDF
- [ ] Family/shared expense tracking
- [ ] Recurring expense setup
- [ ] Financial goals tracking

---

**Note**: This app is designed for personal use and local data storage. For production use, consider adding proper security measures, data encryption, and cloud backup solutions.
