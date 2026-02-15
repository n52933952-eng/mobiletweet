import React, { useState, useEffect, useCallback, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { useUser } from '../../context/UserContext';
import { apiService } from '../../services/api';
import { COLORS } from '../../utils/constants';

const formatTimestamp = (date: string) => {
  const now = new Date();
  const d = new Date(date);
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const ProfileTweetRow = memo(({ tweet, navigation }: any) => (
  <TouchableOpacity
    style={styles.tweetRow}
    activeOpacity={0.7}
    onPress={() => navigation.navigate('TweetDetail', { tweetId: tweet._id, tweet })}
  >
    <Image
      source={{ uri: tweet.author?.profilePic || 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png' }}
      style={styles.tweetAvatar}
    />
    <View style={styles.tweetBody}>
      <View style={styles.tweetHeader}>
        <Text style={styles.tweetName}>{tweet.author?.name}</Text>
        <Text style={styles.tweetHandle}>@{tweet.author?.username}</Text>
        <Text style={styles.tweetDot}>·</Text>
        <Text style={styles.tweetTime}>{formatTimestamp(tweet.createdAt)}</Text>
      </View>
      <Text style={styles.tweetText}>{tweet.text}</Text>
      {tweet.media?.[0] && tweet.media[0].type === 'image' && (
        <Image source={{ uri: tweet.media[0].url }} style={styles.tweetMedia} resizeMode="cover" />
      )}
      <View style={styles.tweetActions}>
        <Text style={styles.tweetStat}>💬 {tweet.replyCount || 0}</Text>
        <Text style={styles.tweetStat}>🔁 {tweet.retweetCount || 0}</Text>
        <Text style={styles.tweetStat}>❤️ {tweet.likeCount || 0}</Text>
        <Text style={styles.tweetStat}>📊 {tweet.viewCount || 0}</Text>
      </View>
    </View>
  </TouchableOpacity>
));

const UserProfileScreen = ({ navigation, route }: any) => {
  const { user: currentUser, logout } = useUser();
  const userId = route.params?.userId;

  const [profileUser, setProfileUser] = useState<any>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [tweets, setTweets] = useState<any[]>([]);
  const [tweetPage, setTweetPage] = useState(1);
  const [hasMoreTweets, setHasMoreTweets] = useState(true);
  const [loadingMoreTweets, setLoadingMoreTweets] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const isOwnProfile = !userId || (currentUser && currentUser._id === userId);

  const fetchProfile = useCallback(async () => {
    if (isOwnProfile) {
      setProfileUser(currentUser || null);
      setIsFollowing(false);
      setLoading(false);
      return;
    }
    if (!userId) return;
    try {
      const res = await apiService.get(`/api/users/profile/${userId}`);
      setProfileUser(res.user);
      setIsFollowing(res.isFollowing ?? false);
    } catch (e) {
      console.error('Failed to load profile', e);
      setProfileUser(null);
    } finally {
      setLoading(false);
    }
  }, [userId, isOwnProfile, currentUser]);

  const fetchTweets = useCallback(async (page = 1, append = false) => {
    const user = isOwnProfile ? currentUser : profileUser;
    if (!user?.username) return;
    try {
      if (!append) setLoading(true);
      if (append) setLoadingMoreTweets(true);
      const res = await apiService.get(`/api/tweets/user/${user.username}?page=${page}&limit=20`);
      const list = res.tweets || [];
      const pagination = res.pagination || {};
      if (append) {
        setTweets((prev) => {
          const ids = new Set(prev.map((t: any) => t._id));
          const toAdd = list.filter((t: any) => !ids.has(t._id));
          return toAdd.length ? [...prev, ...toAdd] : prev;
        });
        setTweetPage(page);
        setHasMoreTweets((pagination.page ?? page) < (pagination.totalPages ?? 1));
      } else {
        setTweets(list);
        setTweetPage(1);
        setHasMoreTweets((pagination.page ?? 1) < (pagination.totalPages ?? 1));
      }
    } catch (e) {
      console.error('Failed to load tweets', e);
      if (!append) setTweets([]);
    } finally {
      setLoading(false);
      setLoadingMoreTweets(false);
    }
  }, [isOwnProfile, currentUser, profileUser]);

  useEffect(() => {
    setLoading(true);
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (profileUser?.username || (isOwnProfile && currentUser?.username)) {
      fetchTweets();
    }
  }, [profileUser?.username, isOwnProfile, currentUser?.username, fetchTweets]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProfile();
    await fetchTweets(1, false);
    setRefreshing(false);
  };

  const loadMoreTweets = useCallback(() => {
    if (loadingMoreTweets || !hasMoreTweets) return;
    fetchTweets(tweetPage + 1, true);
  }, [loadingMoreTweets, hasMoreTweets, tweetPage, fetchTweets]);

  const renderTweetItem = useCallback(
    ({ item }: { item: any }) => <ProfileTweetRow tweet={item} navigation={navigation} />,
    [navigation],
  );

  const handleFollow = async () => {
    if (!userId || followLoading) return;
    setFollowLoading(true);
    try {
      const res = await apiService.post(`/api/users/${userId}/follow`, {});
      setIsFollowing(res.following ?? false);
      if (profileUser) {
        setProfileUser({
          ...profileUser,
          followerCount: Math.max(0, (profileUser.followerCount || 0) + (res.following ? 1 : -1)),
        });
      }
    } catch (e) {
      console.error('Follow failed', e);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e: any) {
      console.error('Logout error', e);
      alert(e.message || 'Failed to logout');
    }
  };

  const displayUser = isOwnProfile ? currentUser : profileUser;

  if (loading && !displayUser) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!displayUser && !isOwnProfile) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>User not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{displayUser?.name}</Text>
        <View style={{ width: 30 }} />
      </View>

      <FlatList
        data={tweets}
        keyExtractor={(item) => item._id}
        style={styles.content}
        contentContainerStyle={tweets.length === 0 ? styles.listContentEmpty : undefined}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={10}
        removeClippedSubviews={Platform.OS === 'android'}
        onEndReached={loadMoreTweets}
        onEndReachedThreshold={0.4}
        ListHeaderComponent={
          <>
            <View style={styles.coverPhoto} />
            <View style={styles.profilePicContainer}>
              <Image
                source={{ uri: displayUser?.profilePic || 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png' }}
                style={styles.profilePic}
              />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.name}>{displayUser?.name}</Text>
              <Text style={styles.username}>@{displayUser?.username}</Text>
              {displayUser?.bio ? <Text style={styles.bio}>{displayUser.bio}</Text> : null}
              <View style={styles.stats}>
                <Text style={styles.statNumber}>{displayUser?.followingCount ?? 0}</Text>
                <Text style={styles.statLabel}> Following</Text>
                <Text style={styles.statNumber}>{displayUser?.followerCount ?? 0}</Text>
                <Text style={styles.statLabel}> Followers</Text>
              </View>
              {isOwnProfile ? (
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                  <Text style={styles.logoutButtonText}>Log out</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.followButton, isFollowing && styles.followingButton]}
                  onPress={handleFollow}
                  disabled={followLoading}
                >
                  <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
                    {followLoading ? '...' : isFollowing ? 'Following' : 'Follow'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.tweetsSection}>
              <Text style={styles.tweetsSectionTitle}>Tweets</Text>
            </View>
          </>
        }
        ListEmptyComponent={
          !loading ? <Text style={styles.noTweets}>No tweets yet.</Text> : null
        }
        ListFooterComponent={
          loadingMoreTweets ? (
            <View style={styles.loadMoreFooter}>
              <ActivityIndicator size="small" color={COLORS.primary} />
            </View>
          ) : null
        }
        renderItem={renderTweetItem}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  backBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 20,
  },
  backBtnText: {
    color: COLORS.white,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    fontSize: 24,
    color: COLORS.text,
    width: 30,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  content: {
    flex: 1,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  loadMoreFooter: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  coverPhoto: {
    height: 120,
    backgroundColor: COLORS.backgroundLight,
  },
  profilePicContainer: {
    paddingHorizontal: 15,
    marginTop: -40,
  },
  profilePic: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: COLORS.background,
  },
  userInfo: {
    paddingHorizontal: 15,
    paddingTop: 12,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  username: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  bio: {
    fontSize: 15,
    color: COLORS.text,
    marginBottom: 12,
    lineHeight: 20,
  },
  stats: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  statNumber: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  logoutButton: {
    backgroundColor: COLORS.error,
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  followButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 28,
    alignItems: 'center',
  },
  followingButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  followButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  followingButtonText: {
    color: COLORS.text,
  },
  tweetsSection: {
    borderTopWidth: 0.5,
    borderTopColor: COLORS.border,
    paddingTop: 12,
    paddingHorizontal: 15,
    paddingBottom: 24,
  },
  tweetsSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  noTweets: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingVertical: 24,
  },
  tweetRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  tweetAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  tweetBody: {
    flex: 1,
  },
  tweetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  tweetName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.text,
    marginRight: 4,
  },
  tweetHandle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginRight: 4,
  },
  tweetDot: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginRight: 4,
  },
  tweetTime: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  tweetText: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 20,
    marginBottom: 8,
  },
  tweetMedia: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 8,
  },
  tweetActions: {
    flexDirection: 'row',
    gap: 16,
  },
  tweetStat: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
});

export default UserProfileScreen;
