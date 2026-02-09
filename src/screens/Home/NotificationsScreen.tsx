import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { COLORS, TWITTER_STYLES } from '../../utils/constants';

const NotificationsScreen = ({ navigation }: any) => {
  const [activeTab, setActiveTab] = useState<'all' | 'mentions'>('all');
  const lastScrollY = useRef(0);

  // Placeholder notifications data
  const notifications = [
    {
      id: 1,
      type: 'follow',
      user: { name: 'John Doe', username: '@johndoe' },
      message: 'started following you',
      time: '2h',
    },
    {
      id: 2,
      type: 'like',
      user: { name: 'Jane Smith', username: '@janesmith' },
      message: 'liked your tweet',
      tweet: 'Just launched my new app! 🚀',
      time: '5h',
    },
    {
      id: 3,
      type: 'retweet',
      user: { name: 'Tech News', username: '@technews' },
      message: 'retweeted your tweet',
      tweet: 'React Native is amazing!',
      time: '1d',
    },
    {
      id: 4,
      type: 'reply',
      user: { name: 'Sarah Wilson', username: '@sarahw' },
      message: 'replied to your tweet',
      tweet: 'Great work on this!',
      time: '2d',
    },
  ];

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'follow':
        return '👤';
      case 'like':
        return '❤️';
      case 'retweet':
        return '🔁';
      case 'reply':
        return '💬';
      default:
        return '🔔';
    }
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    const scrollDirection = currentScrollY > lastScrollY.current ? 'down' : 'up';

    lastScrollY.current = currentScrollY;

    if (currentScrollY <= 0) {
      navigation.getParent()?.setOptions({
        tabBarStyle: {
          display: 'flex',
          backgroundColor: COLORS.white,
          borderTopColor: COLORS.border,
          borderTopWidth: 0.5,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
      });
      return;
    }

    if (scrollDirection === 'down') {
      navigation.getParent()?.setOptions({
        tabBarStyle: { display: 'none' },
      });
    } else if (scrollDirection === 'up') {
      navigation.getParent()?.setOptions({
        tabBarStyle: {
          display: 'flex',
          backgroundColor: COLORS.white,
          borderTopColor: COLORS.border,
          borderTopWidth: 0.5,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
      });
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'all' && styles.activeTab]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'mentions' && styles.activeTab]}
          onPress={() => setActiveTab('mentions')}
        >
          <Text style={[styles.tabText, activeTab === 'mentions' && styles.activeTabText]}>
            Mentions
          </Text>
        </TouchableOpacity>
      </View>

      {/* Notifications List */}
      <ScrollView
        style={styles.content}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {notifications.map((notification) => (
          <TouchableOpacity key={notification.id} style={styles.notificationCard}>
            <View style={styles.iconContainer}>
              <Text style={styles.notificationIcon}>
                {getNotificationIcon(notification.type)}
              </Text>
            </View>
            
            <View style={styles.notificationContent}>
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {notification.user.name.charAt(0)}
                </Text>
              </View>
              
              <View style={styles.textContent}>
                <Text style={styles.notificationText}>
                  <Text style={styles.userName}>{notification.user.name}</Text>
                  {' '}
                  <Text style={styles.actionText}>{notification.message}</Text>
                </Text>
                
                {notification.tweet && (
                  <Text style={styles.tweetPreview} numberOfLines={2}>
                    {notification.tweet}
                  </Text>
                )}
                
                <Text style={styles.time}>{notification.time}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
        
        {notifications.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No notifications yet</Text>
            <Text style={styles.emptyStateSubtext}>
              When you get notifications, they'll show up here
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    color: COLORS.textSecondary,
    fontSize: TWITTER_STYLES.fontSize.regular,
    fontWeight: '600',
  },
  activeTabText: {
    color: COLORS.text,
  },
  content: {
    flex: 1,
  },
  notificationCard: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  iconContainer: {
    marginRight: 10,
    marginTop: 5,
  },
  notificationIcon: {
    fontSize: 20,
  },
  notificationContent: {
    flex: 1,
    flexDirection: 'row',
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  textContent: {
    flex: 1,
  },
  notificationText: {
    fontSize: TWITTER_STYLES.fontSize.regular,
    color: COLORS.text,
    marginBottom: 5,
  },
  userName: {
    fontWeight: 'bold',
  },
  actionText: {
    color: COLORS.textSecondary,
  },
  tweetPreview: {
    fontSize: TWITTER_STYLES.fontSize.regular,
    color: COLORS.textSecondary,
    marginTop: 5,
    marginBottom: 5,
  },
  time: {
    fontSize: TWITTER_STYLES.fontSize.small,
    color: COLORS.textSecondary,
    marginTop: 5,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 50,
  },
  emptyStateText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 10,
  },
  emptyStateSubtext: {
    fontSize: TWITTER_STYLES.fontSize.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});

export default NotificationsScreen;
