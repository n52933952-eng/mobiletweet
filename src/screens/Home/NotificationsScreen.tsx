import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { COLORS, TWITTER_STYLES } from '../../utils/constants';
import { apiService } from '../../services/api';
import { useNotifications } from '../../context/NotificationContext';

const DEFAULT_AVATAR = 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png';

type NotificationItem = {
  _id: string;
  type: 'like' | 'retweet' | 'follow' | 'reply';
  read: boolean;
  createdAt: string;
  actor?: { _id: string; name: string; username: string; profilePic?: string };
  tweet?: { _id: string; text: string } | null;
};

const getActionText = (type: string) => {
  switch (type) {
    case 'like': return 'liked your tweet';
    case 'retweet': return 'retweeted your tweet';
    case 'follow': return 'followed you';
    case 'reply': return 'replied to your tweet';
    default: return 'sent you a notification';
  }
};

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'like': return 'favorite';
    case 'retweet': return 'repeat';
    case 'follow': return 'person-add';
    case 'reply': return 'chat-bubble-outline';
    default: return 'notifications';
  }
};

const formatTime = (dateStr: string) => {
  const now = new Date();
  const d = new Date(dateStr);
  const diffMs = now.getTime() - d.getTime();
  const diffM = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffMs / 86400000);
  if (diffM < 1) return 'now';
  if (diffM < 60) return `${diffM}m`;
  if (diffH < 24) return `${diffH}h`;
  if (diffD < 7) return `${diffD}d`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const NotificationsScreen = ({ navigation }: any) => {
  const { unreadCount, newNotifications, clearUnread, clearNew } = useNotifications();
  const [activeTab, setActiveTab] = useState<'all' | 'mentions'>('all');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const lastScrollY = useRef(0);

  const tabBarStyle = {
    display: 'flex' as const,
    backgroundColor: COLORS.white,
    borderTopColor: COLORS.border,
    borderTopWidth: 0.5,
    height: 60,
    paddingBottom: 8,
    paddingTop: 8,
  };

  const fetchNotifications = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    try {
      if (pageNum === 1 && !append) setLoading(true);
      if (pageNum > 1) setLoadingMore(true);
      const res = await apiService.get(`/api/notifications?page=${pageNum}&limit=20`);
      const list = res.notifications || [];
      const pagination = res.pagination || {};
      if (append) {
        setNotifications(prev => {
          const ids = new Set(prev.map(n => n._id));
          const toAdd = list.filter((n: NotificationItem) => !ids.has(n._id));
          return toAdd.length ? [...prev, ...toAdd] : prev;
        });
      } else {
        const all = [...newNotifications.map(n => n as NotificationItem), ...list];
        const unique = all.filter((n, i) => all.findIndex(x => x._id === n._id) === i);
        setNotifications(unique);
      }
      setPage(pageNum);
      setHasMore((pagination.page ?? pageNum) < (pagination.totalPages ?? 1));
      if (pageNum === 1) {
        clearUnread();
        clearNew();
        try {
          await apiService.patch('/api/notifications/read', {});
        } catch (_) {}
      }
    } catch (e) {
      console.error('Notifications fetch', e);
      if (!append) setNotifications([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [navigation, newNotifications, clearUnread, clearNew]);

  useEffect(() => {
    fetchNotifications(1);
  }, [fetchNotifications]);

  useEffect(() => {
    navigation.setOptions({
      tabBarBadge: unreadCount > 0 ? (unreadCount > 99 ? '99+' : unreadCount) : undefined,
    });
  }, [navigation, unreadCount]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications(1);
    setRefreshing(false);
  };

  const loadMore = () => {
    if (loadingMore || !hasMore) return;
    fetchNotifications(page + 1, true);
  };

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const delta = y - lastScrollY.current;
    lastScrollY.current = y;
    const parent = navigation.getParent?.();
    if (!parent?.setOptions) return;
    if (y <= 0) {
      parent.setOptions({ tabBarStyle });
      return;
    }
    if (delta > 0) parent.setOptions({ tabBarStyle: { display: 'none' } });
    else parent.setOptions({ tabBarStyle });
  };

  const openProfile = (userId: string) => {
    navigation.navigate('UserProfile', { userId });
  };

  const renderItem = ({ item }: { item: NotificationItem }) => {
    const actor = item.actor;
    const name = actor?.name ?? 'Someone';
    const username = actor?.username ?? '';
    const avatar = actor?.profilePic || DEFAULT_AVATAR;
    const actionText = getActionText(item.type);
    const iconName = getNotificationIcon(item.type);

    return (
      <TouchableOpacity
        style={[styles.notificationCard, !item.read && styles.unreadCard]}
        onPress={() => actor?._id && openProfile(actor._id)}
        activeOpacity={0.7}
      >
        <View style={styles.iconWrap}>
          <Icon name={iconName} size={20} color={COLORS.primary} />
        </View>
        <Image source={{ uri: avatar }} style={styles.avatar} />
        <View style={styles.textContent}>
          <Text style={styles.notificationText} numberOfLines={3}>
            <Text style={styles.userName}>{name}</Text>
            {username ? ` @${username} ` : ' '}
            <Text style={styles.actionText}>{actionText}</Text>
          </Text>
          {item.tweet?.text ? (
            <Text style={styles.tweetPreview} numberOfLines={2}>{item.tweet.text}</Text>
          ) : null}
          <Text style={styles.time}>{formatTime(item.createdAt)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && notifications.length === 0) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.activeTab]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'mentions' && styles.activeTab]}
          onPress={() => setActiveTab('mentions')}
        >
          <Text style={[styles.tabText, activeTab === 'mentions' && styles.activeTabText]}>Mentions</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={notifications}
        keyExtractor={item => item._id}
        renderItem={renderItem}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        ListFooterComponent={loadingMore ? <View style={styles.footer}><ActivityIndicator size="small" color={COLORS.primary} /></View> : null}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="notifications-none" size={48} color={COLORS.textSecondary} />
            <Text style={styles.emptyStateText}>No notifications yet</Text>
            <Text style={styles.emptyStateSubtext}>When you get likes, retweets, or new followers, they'll show here</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { justifyContent: 'center', alignItems: 'center' },
  header: {
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  tabs: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  tab: { flex: 1, paddingVertical: 15, alignItems: 'center' },
  activeTab: { borderBottomWidth: 3, borderBottomColor: COLORS.primary },
  tabText: { color: COLORS.textSecondary, fontSize: TWITTER_STYLES.fontSize.regular, fontWeight: '600' },
  activeTabText: { color: COLORS.text },
  notificationCard: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
    alignItems: 'flex-start',
  },
  unreadCard: { backgroundColor: COLORS.backgroundLight },
  iconWrap: {
    width: 28,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  textContent: { flex: 1, minWidth: 0 },
  notificationText: { fontSize: TWITTER_STYLES.fontSize.regular, color: COLORS.text, marginBottom: 2 },
  userName: { fontWeight: '700' },
  actionText: { color: COLORS.textSecondary },
  tweetPreview: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4, marginBottom: 2 },
  time: { fontSize: TWITTER_STYLES.fontSize.small, color: COLORS.textSecondary },
  footer: { paddingVertical: 16, alignItems: 'center' },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyStateText: { fontSize: 20, fontWeight: '700', color: COLORS.text, marginTop: 16 },
  emptyStateSubtext: { fontSize: 15, color: COLORS.textSecondary, textAlign: 'center', marginTop: 8 },
});

export default NotificationsScreen;
