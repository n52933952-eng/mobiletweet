// API Configuration
// 🔧 ALWAYS USE RENDER - No need to run backend locally!
export const API_URL = 'https://tweet-3.onrender.com';

export const SOCKET_URL = API_URL;

// API Endpoints
export const ENDPOINTS = {
  // Auth
  LOGIN: '/api/auth/login',
  SIGNUP: '/api/auth/signup',
  LOGOUT: '/api/auth/logout',
  GET_ME: '/api/auth/me',
  GOOGLE_SIGNIN: '/api/auth/google',
  
  // User
  GET_USER_PROFILE: '/api/users',
  UPDATE_PROFILE: '/api/users',
  FOLLOW_USER: '/api/users',
  SEARCH_USERS: '/api/users/search',
  GET_SUGGESTED_USERS: '/api/users/suggested',
  
  // Tweets
  CREATE_TWEET: '/api/tweets',
  GET_FEED: '/api/tweets/feed',
  GET_TWEET: '/api/tweets',
  DELETE_TWEET: '/api/tweets',
  LIKE_TWEET: '/api/tweets',
  RETWEET: '/api/tweets',
  REPLY_TWEET: '/api/tweets',
  GET_USER_TWEETS: '/api/tweets/user',
  
  // Messages
  GET_CONVERSATIONS: '/api/messages/conversations',
  GET_MESSAGES: '/api/messages',
  SEND_MESSAGE: '/api/messages',
  
  // Notifications
  GET_NOTIFICATIONS: '/api/notifications',
  MARK_READ: '/api/notifications',
};

// Storage Keys
export const STORAGE_KEYS = {
  USER: '@twitter_user',
  TOKEN: '@twitter_token',
};

// Twitter Colors (Light Mode - White Background)
export const COLORS = {
  // Primary
  primary: '#1D9BF0',          // Twitter blue
  primaryHover: '#1A8CD8',     // Darker blue on press
  
  // Backgrounds
  white: '#FFFFFF',
  black: '#000000',
  background: '#FFFFFF',        // White background (light mode)
  backgroundLight: '#F7F9F9',   // Light gray for cards/inputs
  
  // Text
  text: '#0F1419',             // Black text
  textSecondary: '#536471',    // Gray text
  textGray: '#71767B',         // Muted text
  
  // Borders
  border: '#CFD9DE',           // Gray border color (visible on white)
  
  // States
  error: '#F4212E',            // Error red
  success: '#00BA7C',          // Success green
  
  // Button
  buttonBlack: '#0F1419',      // Black button
  buttonWhite: '#EFF3F4',      // White button
};

// Twitter Styles
export const TWITTER_STYLES = {
  borderRadius: 20,             // Rounded buttons
  inputBorderRadius: 4,         // Inputs slightly rounded
  spacing: 20,
  fontSize: {
    small: 13,
    regular: 15,
    medium: 17,
    large: 20,
    xlarge: 31,                 // "See what's happening..."
  },
  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
};
