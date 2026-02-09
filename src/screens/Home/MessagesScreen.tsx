import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Animated,
} from 'react-native';
import { COLORS, TWITTER_STYLES } from '../../utils/constants';

const MessagesScreen = ({ navigation }: any) => {
  const [searchQuery, setSearchQuery] = useState('');
  const lastScrollY = useRef(0);
  const fabScale = useRef(new Animated.Value(1)).current;
  const fabOpacity = useRef(new Animated.Value(1)).current;

  // Placeholder messages data
  const conversations = [
    {
      id: 1,
      user: { name: 'Alice Johnson', username: '@alicejohnson' },
      lastMessage: 'Hey! How are you doing?',
      time: '2h',
      unread: true,
    },
    {
      id: 2,
      user: { name: 'Bob Smith', username: '@bobsmith' },
      lastMessage: 'Thanks for the info!',
      time: '1d',
      unread: false,
    },
    {
      id: 3,
      user: { name: 'Charlie Brown', username: '@charlieb' },
      lastMessage: 'See you tomorrow 👋',
      time: '2d',
      unread: false,
    },
  ];

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    const scrollDirection = currentScrollY > lastScrollY.current ? 'down' : 'up';

    lastScrollY.current = currentScrollY;

    if (currentScrollY <= 0) {
      Animated.parallel([
        Animated.spring(fabScale, {
          toValue: 1,
          useNativeDriver: true,
          friction: 8,
        }),
        Animated.timing(fabOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      
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
      Animated.parallel([
        Animated.spring(fabScale, {
          toValue: 0,
          useNativeDriver: true,
          friction: 8,
        }),
        Animated.timing(fabOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      navigation.getParent()?.setOptions({
        tabBarStyle: { display: 'none' },
      });
    } else if (scrollDirection === 'up') {
      Animated.parallel([
        Animated.spring(fabScale, {
          toValue: 1,
          useNativeDriver: true,
          friction: 8,
        }),
        Animated.timing(fabOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

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
        <Text style={styles.headerTitle}>Messages</Text>
        <TouchableOpacity style={styles.newMessageButton}>
          <Text style={styles.newMessageIcon}>✉️</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search Direct Messages"
          placeholderTextColor={COLORS.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
        />
      </View>

      {/* Conversations List */}
      <ScrollView
        style={styles.content}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {conversations.map((conversation) => (
          <TouchableOpacity 
            key={conversation.id} 
            style={styles.conversationCard}
            onPress={() => {
              // Navigate to chat screen when implemented
              console.log('Open conversation:', conversation.id);
            }}
          >
            <View style={styles.avatarContainer}>
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {conversation.user.name.charAt(0)}
                </Text>
              </View>
              {conversation.unread && <View style={styles.unreadDot} />}
            </View>
            
            <View style={styles.messageContent}>
              <View style={styles.messageHeader}>
                <Text style={styles.userName}>{conversation.user.name}</Text>
                <Text style={styles.username}>{conversation.user.username}</Text>
                <Text style={styles.dot}>·</Text>
                <Text style={styles.time}>{conversation.time}</Text>
              </View>
              
              <Text 
                style={[
                  styles.lastMessage,
                  conversation.unread && styles.lastMessageUnread
                ]} 
                numberOfLines={1}
              >
                {conversation.lastMessage}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
        
        {conversations.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>✉️</Text>
            <Text style={styles.emptyStateTitle}>Welcome to your inbox!</Text>
            <Text style={styles.emptyStateText}>
              Drop a line, share Tweets and more with private conversations between you and others on Twitter.
            </Text>
            <TouchableOpacity style={styles.writeMessageButton}>
              <Text style={styles.writeMessageText}>Write a message</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <Animated.View
        style={[
          styles.fab,
          {
            transform: [{ scale: fabScale }],
            opacity: fabOpacity,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.fabButton}
          activeOpacity={0.8}
        >
          <Text style={styles.fabIcon}>✉️</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  newMessageButton: {
    padding: 5,
  },
  newMessageIcon: {
    fontSize: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 20,
    paddingHorizontal: 15,
    marginHorizontal: 15,
    marginVertical: 10,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: TWITTER_STYLES.fontSize.regular,
    paddingVertical: 10,
  },
  content: {
    flex: 1,
  },
  conversationCard: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  unreadDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: COLORS.black,
  },
  messageContent: {
    flex: 1,
    justifyContent: 'center',
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  userName: {
    fontSize: TWITTER_STYLES.fontSize.regular,
    fontWeight: 'bold',
    color: COLORS.text,
    marginRight: 5,
  },
  username: {
    fontSize: TWITTER_STYLES.fontSize.regular,
    color: COLORS.textSecondary,
    marginRight: 5,
  },
  dot: {
    color: COLORS.textSecondary,
    marginRight: 5,
  },
  time: {
    fontSize: TWITTER_STYLES.fontSize.small,
    color: COLORS.textSecondary,
  },
  lastMessage: {
    fontSize: TWITTER_STYLES.fontSize.regular,
    color: COLORS.textSecondary,
  },
  lastMessageUnread: {
    fontWeight: 'bold',
    color: COLORS.text,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 50,
  },
  emptyStateIcon: {
    fontSize: 60,
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 10,
  },
  emptyStateText: {
    fontSize: TWITTER_STYLES.fontSize.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  writeMessageButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  writeMessageText: {
    color: COLORS.white,
    fontSize: TWITTER_STYLES.fontSize.regular,
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    bottom: 80,
    right: 20,
  },
  fabButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  fabIcon: {
    fontSize: 24,
  },
});

export default MessagesScreen;
