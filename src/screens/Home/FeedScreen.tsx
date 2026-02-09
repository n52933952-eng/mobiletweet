import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Image,
  RefreshControl,
  ActivityIndicator,
  Animated,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Dimensions,
  Pressable,
  BackHandler,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Video from 'react-native-video';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { io } from 'socket.io-client';
import { COLORS, SOCKET_URL } from '../../utils/constants';
import { useUser } from '../../context/UserContext';
import { apiService } from '../../services/api';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(SCREEN_WIDTH * 0.85, 320);

// Tweet Card Component
const TweetCard = ({ tweet, navigation, isVisible }: any) => {
  const [liked, setLiked] = useState(false);
  const [retweeted, setRetweeted] = useState(false);
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(true);
  const videoRef = useRef<any>(null);

  // Auto-play video when visible
  useEffect(() => {
    if (isVisible && tweet.media?.length > 0 && tweet.media[0].type === 'video') {
      setPaused(false);
    } else {
      setPaused(true);
    }
  }, [isVisible, tweet.media]);

  return (
    <View style={styles.tweetCard}>
      {/* Tweet Header */}
      <View style={styles.tweetHeader}>
        {/* Profile Picture */}
        <TouchableOpacity onPress={() => navigation.navigate('UserProfile', { userId: tweet.author._id })}>
          <Image
            source={{ uri: tweet.author.profilePic || 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png' }}
            style={styles.avatar}
          />
        </TouchableOpacity>

        {/* Tweet Content */}
        <View style={styles.tweetContent}>
          {/* User Info */}
          <View style={styles.userInfo}>
            <TouchableOpacity onPress={() => navigation.navigate('UserProfile', { userId: tweet.author._id })}>
              <View style={styles.userNameRow}>
                <Text style={styles.userName}>{tweet.author.name}</Text>
                {tweet.author.verified && <Text style={styles.verifiedBadge}>✓</Text>}
              </View>
            </TouchableOpacity>
            <Text style={styles.userHandle}>@{tweet.author.username}</Text>
            <Text style={styles.separator}>·</Text>
            <Text style={styles.timestamp}>{formatTimestamp(tweet.createdAt)}</Text>
          </View>

          {/* Tweet Text */}
          <Text style={styles.tweetText}>{tweet.text}</Text>

          {/* Tweet Media (if exists) */}
          {tweet.media && tweet.media.length > 0 && (
            <View style={styles.mediaContainer}>
              {tweet.media[0].type === 'image' ? (
                <Image
                  source={{ uri: tweet.media[0].url }}
                  style={styles.tweetImage}
                  resizeMode="cover"
                />
              ) : (
                <TouchableOpacity 
                  style={styles.videoContainer}
                  activeOpacity={1}
                  onPress={() => setMuted(!muted)}
                >
                  <Video
                    ref={videoRef}
                    source={{ uri: tweet.media[0].url }}
                    style={styles.tweetVideo}
                    resizeMode="cover"
                    repeat={true}
                    paused={paused}
                    muted={muted}
                    playInBackground={false}
                    playWhenInactive={false}
                  />
                  
                  {/* Mute/Unmute Button */}
                  <View style={styles.muteButton}>
                    <Text style={styles.muteIcon}>{muted ? '🔇' : '🔊'}</Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Tweet Actions */}
          <View style={styles.tweetActions}>
            {/* Reply */}
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionIcon}>💬</Text>
              <Text style={styles.actionCount}>{tweet.replyCount || 0}</Text>
            </TouchableOpacity>

            {/* Retweet */}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setRetweeted(!retweeted)}
            >
              <Text style={[styles.actionIcon, retweeted && styles.actionIconActive]}>🔁</Text>
              <Text style={[styles.actionCount, retweeted && styles.actionCountActive]}>
                {tweet.retweetCount || 0}
              </Text>
            </TouchableOpacity>

            {/* Like */}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setLiked(!liked)}
            >
              <Text style={[styles.actionIcon, liked && styles.actionIconLiked]}>
                {liked ? '❤️' : '🤍'}
              </Text>
              <Text style={[styles.actionCount, liked && styles.actionCountLiked]}>
                {tweet.likeCount || 0}
              </Text>
            </TouchableOpacity>

            {/* Views */}
            <View style={styles.actionButton}>
              <Text style={styles.actionIcon}>📊</Text>
              <Text style={styles.actionCount}>{formatViews(tweet.viewCount || 0)}</Text>
            </View>

            {/* Share */}
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionIcon}>🔗</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const FeedScreen = ({ navigation }: any) => {
  const { user, logout } = useUser();
  const [activeTab, setActiveTab] = useState<'forYou' | 'following'>('forYou');
  const [tweets, setTweets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [visibleVideoIndex, setVisibleVideoIndex] = useState<number | null>(null);
  const [fabExpanded, setFabExpanded] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerSlide = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const drawerBackdropOpacity = useRef(new Animated.Value(0)).current;
  const fabSpin = useRef(new Animated.Value(0)).current;

  // Scroll animations
  const scrollY = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);
  const fabScale = useRef(new Animated.Value(1)).current;
  const fabOpacity = useRef(new Animated.Value(1)).current;

  // Which video should play: use FlatList viewability (reliable)
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 100,
  }).current;

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    const videoItems = (viewableItems || [])
      .filter((v: any) => v.item?.media?.length > 0 && v.item.media[0].type === 'video')
      .sort((a: any, b: any) => a.index - b.index);
    const topmostVideo = videoItems[0];
    setVisibleVideoIndex(topmostVideo ? topmostVideo.index : null);
  }).current;

  // Feed type: forYou = mixed (following + suggested/trending), following = only people you follow
  const feedType = activeTab === 'forYou' ? 'forYou' : 'following';
  const feedTypeRef = useRef(feedType);
  feedTypeRef.current = feedType;

  useEffect(() => {
    fetchTweets();
  }, [activeTab]);

  const fetchTweets = async (appendNewOnly = false) => {
    const currentFeedType = appendNewOnly ? feedTypeRef.current : feedType;
    try {
      if (!appendNewOnly) setLoading(true);
      const response = await apiService.get(`/api/tweets/feed?feedType=${currentFeedType}`);
      const newList = response.tweets || [];
      if (appendNewOnly && newList.length > 0) {
        setTweets((prev) => {
          const prevIds = new Set(prev.map((t: any) => t._id));
          const toPrepend = newList.filter((t: any) => !prevIds.has(t._id));
          if (toPrepend.length === 0) return prev;
          return [...toPrepend, ...prev];
        });
      } else {
        setTweets(newList);
      }
      if (!appendNewOnly) console.log('✅ Fetched tweets:', newList.length);
    } catch (error) {
      console.error('❌ Error fetching tweets:', error);
      if (!appendNewOnly) setTweets([]);
    } finally {
      if (!appendNewOnly) setLoading(false);
    }
  };

  // Real-time: poll feed every 20s and prepend new tweets (like real Twitter)
  const FEED_POLL_MS = 20000;
  useEffect(() => {
    const interval = setInterval(() => {
      fetchTweets(true);
    }, FEED_POLL_MS);
    return () => clearInterval(interval);
  }, [activeTab]);

  // Real-time: Socket.io – prepend new tweet as soon as someone posts
  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socket.on('newTweet', (tweet: any) => {
      if (!tweet || !tweet._id) return;
      setTweets((prev) => {
        const id = typeof tweet._id === 'string' ? tweet._id : tweet._id.toString();
        if (prev.some((t: any) => (t._id || t.id)?.toString() === id)) return prev;
        return [{ ...tweet, _id: tweet._id }, ...prev];
      });
    });
    return () => {
      socket.off('newTweet');
      socket.disconnect();
    };
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTweets();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      console.log('✅ Logged out successfully');
    } catch (error) {
      console.error('❌ Logout error:', error);
    }
  };

  const handleFabPress = () => {
    const toValue = fabExpanded ? 0 : 1;
    setFabExpanded(!fabExpanded);
    Animated.spring(fabSpin, {
      toValue,
      useNativeDriver: true,
      friction: 6,
      tension: 80,
    }).start();
  };

  const handlePostPress = () => {
    setFabExpanded(false);
    Animated.timing(fabSpin, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
    navigation.navigate('CreateTweet');
  };

  const spinInterpolate = fabSpin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '135deg'],
  });

  // Android back button closes FAB overlay or drawer
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (drawerOpen) {
        closeDrawer();
        return true;
      }
      if (fabExpanded) {
        handleFabPress();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [fabExpanded, drawerOpen]);

  const openDrawer = () => {
    drawerSlide.setValue(-DRAWER_WIDTH);
    drawerBackdropOpacity.setValue(0);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    Animated.parallel([
      Animated.timing(drawerSlide, {
        toValue: -DRAWER_WIDTH,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.timing(drawerBackdropOpacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(() => setDrawerOpen(false));
  };

  // Run slide-in + backdrop fade after Modal has mounted
  useEffect(() => {
    if (!drawerOpen) return;
    const t = setTimeout(() => {
      Animated.parallel([
        Animated.spring(drawerSlide, {
          toValue: 0,
          useNativeDriver: true,
          friction: 10,
          tension: 68,
        }),
        Animated.timing(drawerBackdropOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }, 30);
    return () => clearTimeout(t);
  }, [drawerOpen]);

  const SCROLL_THRESHOLD = 0;

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    const delta = currentScrollY - lastScrollY.current;

    // Update last scroll position
    lastScrollY.current = currentScrollY;

    // Don't animate if at the top
    if (currentScrollY <= 0) {
      // Show FAB at top
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
      
      // Show tab bar
      navigation.setOptions({
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

    // Use threshold to avoid flicker on small scrolls
    if (delta < -SCROLL_THRESHOLD) {
      // Scrolling up - show FAB and tab bar
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

      navigation.setOptions({
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
    } else if (delta > SCROLL_THRESHOLD) {
      // Scrolling down - hide FAB and tab bar
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

      // Hide tab bar
      navigation.setOptions({
        tabBarStyle: { display: 'none' },
      });
    }
  };

  return (
    <View style={styles.container}>
      {/* Side drawer – Twitter-style, professional */}
      <Modal visible={drawerOpen} transparent animationType="none" statusBarTranslucent>
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <Animated.View style={[styles.drawerBackdropDim, { opacity: drawerBackdropOpacity }]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={closeDrawer} />
          </Animated.View>
          <Animated.View
            style={[
              styles.drawerPanel,
              {
                width: DRAWER_WIDTH,
                transform: [{ translateX: drawerSlide }],
              },
            ]}
            pointerEvents="box-none"
          >
            <SafeAreaView style={styles.drawerSafe} edges={['top', 'left']}>
              <ScrollView
                style={styles.drawerScroll}
                contentContainerStyle={styles.drawerScrollContent}
                showsVerticalScrollIndicator={false}
              >
                {/* User block – like real Twitter */}
                <View style={styles.drawerUserBlock}>
                  <Image
                    source={{ uri: user?.profilePic || 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png' }}
                    style={styles.drawerAvatar}
                  />
                  <View style={styles.drawerUserInfo}>
                    <Text style={styles.drawerName} numberOfLines={1}>{user?.name}</Text>
                    <Text style={styles.drawerHandle} numberOfLines={1}>@{user?.username}</Text>
                    <View style={styles.drawerStatsRow}>
                      <Text style={styles.drawerStatsText}><Text style={styles.drawerStatsNum}>{user?.followingCount ?? 0}</Text> Following</Text>
                      <Text style={styles.drawerStatsText}><Text style={styles.drawerStatsNum}>{user?.followerCount ?? 0}</Text> Followers</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.drawerUserMore} onPress={closeDrawer} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} activeOpacity={0.7}>
                    <Icon name="more-horiz" size={22} color={COLORS.text} />
                  </TouchableOpacity>
                </View>

                {/* Menu items */}
                <TouchableOpacity style={styles.drawerItem} activeOpacity={0.6} onPress={() => { closeDrawer(); navigation.navigate('UserProfile', { userId: user?._id }); }}>
                  <View style={styles.drawerItemIconWrap}><Icon name="person-outline" size={24} color={COLORS.text} /></View>
                  <Text style={styles.drawerItemText}>Profile</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.drawerItem} activeOpacity={0.6} onPress={closeDrawer}>
                  <View style={styles.drawerItemIconWrap}><Text style={styles.drawerItemIcon}>𝕏</Text></View>
                  <Text style={styles.drawerItemText}>Premium</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.drawerItem} activeOpacity={0.6} onPress={closeDrawer}>
                  <View style={styles.drawerItemIconWrap}><Icon name="people-outline" size={24} color={COLORS.text} /></View>
                  <Text style={styles.drawerItemText}>Communities</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.drawerItem} activeOpacity={0.6} onPress={closeDrawer}>
                  <View style={styles.drawerItemIconWrap}><Icon name="bookmark-border" size={24} color={COLORS.text} /></View>
                  <Text style={styles.drawerItemText}>Bookmarks</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.drawerItem} activeOpacity={0.6} onPress={closeDrawer}>
                  <View style={styles.drawerItemIconWrap}><Icon name="list" size={24} color={COLORS.text} /></View>
                  <Text style={styles.drawerItemText}>Lists</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.drawerItem} activeOpacity={0.6} onPress={closeDrawer}>
                  <View style={styles.drawerItemIconWrap}><Icon name="mic-none" size={24} color={COLORS.text} /></View>
                  <Text style={styles.drawerItemText}>Spaces</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.drawerItem} activeOpacity={0.6} onPress={closeDrawer}>
                  <View style={styles.drawerItemIconWrap}><Icon name="insights" size={24} color={COLORS.text} /></View>
                  <Text style={styles.drawerItemText}>Creator Studio</Text>
                </TouchableOpacity>

                <View style={styles.drawerDivider} />

                <TouchableOpacity style={[styles.drawerItem, styles.drawerItemLast]} activeOpacity={0.6} onPress={closeDrawer}>
                  <View style={styles.drawerItemIconWrap}><Icon name="settings" size={24} color={COLORS.text} /></View>
                  <Text style={styles.drawerItemText}>Settings & Support</Text>
                  <Icon name="chevron-right" size={20} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </ScrollView>
            </SafeAreaView>
          </Animated.View>
        </View>
      </Modal>

      {/* Header */}
      <View style={styles.header}>
        {/* Profile Picture – opens side drawer like real Twitter */}
        <TouchableOpacity onPress={openDrawer}>
          <Image
            source={{ uri: user?.profilePic || 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png' }}
            style={styles.headerAvatar}
          />
        </TouchableOpacity>

        {/* X Logo */}
        <Text style={styles.logo}>𝕏</Text>

        {/* Upgrade Button */}
        <TouchableOpacity style={styles.upgradeButton}>
          <Text style={styles.upgradeText}>Upgrade</Text>
        </TouchableOpacity>
      </View>

      {/* For You / Following Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'forYou' && styles.tabActive]}
          onPress={() => setActiveTab('forYou')}
        >
          <Text style={[styles.tabText, activeTab === 'forYou' && styles.tabTextActive]}>
            For you
          </Text>
          {activeTab === 'forYou' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'following' && styles.tabActive]}
          onPress={() => setActiveTab('following')}
        >
          <Text style={[styles.tabText, activeTab === 'following' && styles.tabTextActive]}>
            Following
          </Text>
          {activeTab === 'following' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
      </View>

      {/* Tweet Feed */}
      {loading ? (
        <View style={styles.feed}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        </View>
      ) : tweets.length === 0 ? (
        <ScrollView
          style={styles.feed}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
          }
        >
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Welcome to 𝕏!</Text>
            <Text style={styles.emptySubtitle}>
              This is where tweets from people you follow will appear.
            </Text>
            <Text style={styles.emptySubtitle}>
              Start following accounts to see their tweets here!
            </Text>
          </View>
        </ScrollView>
      ) : (
        <FlatList
          data={tweets}
          keyExtractor={(item) => item._id}
          style={styles.feed}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
          }
          viewabilityConfig={viewabilityConfig}
          onViewableItemsChanged={onViewableItemsChanged}
          renderItem={({ item, index }) => (
            <TweetCard
              tweet={item}
              navigation={navigation}
              isVisible={visibleVideoIndex === index}
            />
          )}
        />
      )}

      {/* Overlay (blurred white) – appears instantly when FAB is pressed */}
      {fabExpanded && (
        <Pressable
          style={[StyleSheet.absoluteFill, styles.fabOverlay]}
          onPress={handleFabPress}
        >
          <View style={styles.fabMenuWrapper} pointerEvents="box-none">
            <View style={styles.fabMenu} pointerEvents="box-none">
              <TouchableOpacity style={styles.fabMenuItem} onPress={() => setFabExpanded(false)}>
                <Text style={styles.fabMenuLabel}>Go Live</Text>
                <View style={styles.fabMenuIconWrap}>
                  <Icon name="notifications" size={22} color={COLORS.primary} />
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.fabMenuItem} onPress={() => setFabExpanded(false)}>
                <Text style={styles.fabMenuLabel}>Spaces</Text>
                <View style={styles.fabMenuIconWrap}>
                  <Icon name="videocam" size={22} color={COLORS.primary} />
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.fabMenuItem} onPress={() => setFabExpanded(false)}>
                <Text style={styles.fabMenuLabel}>Photos</Text>
                <View style={styles.fabMenuIconWrap}>
                  <Icon name="person-add" size={22} color={COLORS.primary} />
                </View>
              </TouchableOpacity>
            </View>
            {/* Post label in a row next to the FAB (spin icon) */}
            <View style={styles.fabPostRow} pointerEvents="box-none">
              <Text style={[styles.fabMenuLabel, styles.fabPostLabel]}>Post</Text>
            </View>
          </View>
        </Pressable>
      )}

      {/* FAB – always in place: plus → spins and becomes feather when expanded */}
      <Animated.View
        style={[
          styles.fab,
          {
            transform: [
              { scale: fabScale },
              { rotate: spinInterpolate },
            ],
            opacity: fabOpacity,
          },
        ]}
        pointerEvents="box-none"
      >
        <TouchableOpacity
          style={styles.fabButton}
          onPress={fabExpanded ? handlePostPress : handleFabPress}
          activeOpacity={0.8}
        >
          {fabExpanded ? (
            <Icon name="edit" size={26} color={COLORS.white} />
          ) : (
            <Text style={styles.fabIcon}>+</Text>
          )}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

// Helper functions
const formatTimestamp = (date: string) => {
  const now = new Date();
  const tweetDate = new Date(date);
  const diff = Math.floor((now.getTime() - tweetDate.getTime()) / 1000);

  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  
  return tweetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatViews = (views: number) => {
  if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
  if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
  return views.toString();
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  drawerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  drawerBackdropDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  drawerPanel: {
    flex: 0,
    height: '100%',
    backgroundColor: COLORS.background,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 24,
  },
  drawerSafe: {
    flex: 1,
  },
  drawerScroll: {
    flex: 1,
  },
  drawerScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  drawerUserBlock: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingVertical: 12,
  },
  drawerAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 14,
  },
  drawerUserInfo: {
    flex: 1,
    minWidth: 0,
  },
  drawerName: {
    fontSize: 19,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  drawerHandle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  drawerStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  drawerStatsText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  drawerStatsNum: {
    fontWeight: '600',
    color: COLORS.text,
  },
  drawerUserMore: {
    padding: 8,
    marginRight: -4,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingRight: 8,
  },
  drawerItemIconWrap: {
    width: 28,
    marginRight: 12,
    alignItems: 'center',
  },
  drawerItemIcon: {
    fontSize: 20,
    color: COLORS.text,
  },
  drawerItemText: {
    flex: 1,
    fontSize: 18,
    color: COLORS.text,
    fontWeight: '500',
  },
  drawerDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.border,
    marginVertical: 10,
    marginRight: -8,
  },
  drawerItemLast: {
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  logo: {
    fontSize: 24,
    color: COLORS.text,
    fontWeight: 'bold',
  },
  upgradeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundLight,
  },
  upgradeText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    position: 'relative',
  },
  tabActive: {
    // Active tab style
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.text,
    fontWeight: '700',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  feed: {
    flex: 1,
  },
  loadingContainer: {
    paddingVertical: 100,
    alignItems: 'center',
  },
  emptyState: {
    paddingHorizontal: 30,
    paddingVertical: 100,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 15,
  },
  emptySubtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 10,
  },
  tweetCard: {
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  tweetHeader: {
    flexDirection: 'row',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  tweetContent: {
    flex: 1,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginRight: 4,
  },
  verifiedBadge: {
    fontSize: 14,
    color: COLORS.primary,
    marginRight: 4,
  },
  userHandle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginRight: 4,
  },
  separator: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginRight: 4,
  },
  timestamp: {
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  tweetText: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 20,
    marginBottom: 12,
  },
  mediaContainer: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  tweetImage: {
    width: '100%',
    height: 300,
    borderRadius: 16,
  },
  videoContainer: {
    position: 'relative',
    width: '100%',
    height: 300,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: COLORS.black,
  },
  tweetVideo: {
    width: '100%',
    height: 300,
  },
  muteButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  muteIcon: {
    fontSize: 16,
  },
  videoPlaceholder: {
    position: 'relative',
  },
  playIcon: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -20 }, { translateY: -20 }],
    fontSize: 40,
    color: COLORS.white,
    zIndex: 1,
  },
  tweetActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingRight: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 16,
    marginRight: 4,
    opacity: 0.6,
  },
  actionIconActive: {
    color: '#00BA7C',
    opacity: 1,
  },
  actionIconLiked: {
    color: '#F91880',
    opacity: 1,
  },
  actionCount: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  actionCountActive: {
    color: '#00BA7C',
  },
  actionCountLiked: {
    color: '#F91880',
  },
  fab: {
    position: 'absolute',
    bottom: 56,
    right: 20,
  },
  fabOverlay: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    paddingRight: 20,
    paddingBottom: 56,
  },
  fabMenuWrapper: {
    alignItems: 'flex-end',
  },
  fabMenu: {
    backgroundColor: 'transparent',
    paddingVertical: 4,
    paddingHorizontal: 0,
    marginBottom: 24,
    minWidth: 160,
  },
  fabPostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    minHeight: 56,
    paddingRight: 20,
  },
  fabPostLabel: {
    marginRight: 72,
    fontSize: 18,
  },
  fabMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 2,
  },
  fabMenuLabel: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
  },
  fabMenuIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(29, 155, 240, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: 28,
    color: COLORS.white,
    fontWeight: 'bold',
  },
});

export default FeedScreen;
