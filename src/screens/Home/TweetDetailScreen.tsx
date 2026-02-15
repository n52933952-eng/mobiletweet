/**
 * Tweet Detail (Post) screen – like real Twitter when you tap a post
 * Shows full tweet, author, stats, and reply box
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Video from 'react-native-video';
import { useUser } from '../../context/UserContext';
import { apiService } from '../../services/api';
import { COLORS, TWITTER_STYLES } from '../../utils/constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DEFAULT_AVATAR = 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png';

const formatPostTime = (date: string) => {
  const d = new Date(date);
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
  return `${time} · ${dateStr}`;
};

const formatViews = (views: number) => {
  if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
  if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
  return views.toString();
};

const TweetDetailScreen = ({ navigation, route }: any) => {
  const { user: currentUser } = useUser();
  const tweetId = route.params?.tweetId;
  const initialTweet = route.params?.tweet;

  const [tweet, setTweet] = useState<any>(initialTweet || null);
  const [loading, setLoading] = useState(!initialTweet);
  const [refreshing, setRefreshing] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [retweeted, setRetweeted] = useState(false);
  const [retweetCount, setRetweetCount] = useState(0);
  const [likeLoading, setLikeLoading] = useState(false);
  const [retweetLoading, setRetweetLoading] = useState(false);
  const [videoMuted, setVideoMuted] = useState(true);
  const [videoPaused, setVideoPaused] = useState(false);
  const [replies, setReplies] = useState<any[]>([]);
  const [replyPage, setReplyPage] = useState(1);
  const [hasMoreReplies, setHasMoreReplies] = useState(true);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [loadingMoreReplies, setLoadingMoreReplies] = useState(false);

  const applyTweetEngagement = useCallback((t: any) => {
    if (!t) return;
    setLikeCount(t.likeCount ?? 0);
    setRetweetCount(t.retweetCount ?? 0);
    const uid = currentUser?._id;
    setLiked(!!t.likes?.some((id: any) => String(id) === String(uid)));
    setRetweeted(!!t.retweets?.some((id: any) => String(id) === String(uid)));
  }, [currentUser?._id]);

  const fetchTweet = useCallback(async () => {
    if (!tweetId) return;
    try {
      const res = await apiService.get(`/api/tweets/${tweetId}`);
      setTweet(res.tweet);
      applyTweetEngagement(res.tweet);
    } catch (e) {
      console.error('Fetch tweet', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tweetId, applyTweetEngagement]);

  const fetchReplies = useCallback(async (page = 1, append = false) => {
    if (!tweetId) return;
    if (!append) setLoadingReplies(true);
    else setLoadingMoreReplies(true);
    try {
      const res = await apiService.get(`/api/tweets/${tweetId}/replies?page=${page}&limit=20`);
      const list = res.replies || [];
      const pagination = res.pagination || {};
      if (append) {
        setReplies((prev) => {
          const ids = new Set(prev.map((r: any) => String(r._id)));
          const toAdd = list.filter((r: any) => !ids.has(String(r._id)));
          return toAdd.length ? [...prev, ...toAdd] : prev;
        });
        setReplyPage(page);
        setHasMoreReplies((pagination.page ?? page) < (pagination.totalPages ?? 1));
      } else {
        setReplies(list);
        setReplyPage(1);
        setHasMoreReplies((pagination.page ?? 1) < (pagination.totalPages ?? 1));
      }
    } catch (e) {
      console.error('Fetch replies', e);
      if (!append) setReplies([]);
    } finally {
      setLoadingReplies(false);
      setLoadingMoreReplies(false);
    }
  }, [tweetId]);

  useEffect(() => {
    if (initialTweet) {
      setTweet(initialTweet);
      applyTweetEngagement(initialTweet);
    }
    if (tweetId) fetchTweet();
  }, [tweetId]);

  useEffect(() => {
    if (tweetId && tweet) fetchReplies(1, false);
  }, [tweetId, tweet?._id]);

  // When we return from reply screen, refetch tweet + first page of replies
  useFocusEffect(
    useCallback(() => {
      if (tweetId && tweet) {
        fetchTweet();
        fetchReplies(1, false);
      }
    }, [tweetId, fetchTweet, fetchReplies]),
  );

  const loadMoreReplies = useCallback(() => {
    if (loadingMoreReplies || !hasMoreReplies) return;
    fetchReplies(replyPage + 1, true);
  }, [loadingMoreReplies, hasMoreReplies, replyPage, fetchReplies]);

  // Set isFollowing when we have tweet author (fetch profile for that)
  useEffect(() => {
    const authorId = tweet?.author?._id;
    if (!authorId || authorId === currentUser?._id) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await apiService.get(`/api/users/profile/${authorId}`);
        if (!cancelled) setIsFollowing(res.isFollowing ?? false);
      } catch (_) {}
    })();
    return () => { cancelled = true; };
  }, [tweet?.author?._id, currentUser?._id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTweet();
  };

  const handleFollow = async () => {
    const authorId = tweet?.author?._id;
    if (!authorId || followLoading) return;
    setFollowLoading(true);
    try {
      const res = await apiService.post(`/api/users/${authorId}/follow`, {});
      setIsFollowing(res.following ?? false);
    } catch (e) {
      console.error('Follow', e);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleLike = async () => {
    if (!tweetId || likeLoading) return;
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikeCount((c) => (nextLiked ? c + 1 : Math.max(0, c - 1)));
    setLikeLoading(true);
    try {
      const res = await apiService.post(`/api/tweets/${tweetId}/like`, {});
      setLiked(res.liked);
      if (typeof res.likeCount === 'number') setLikeCount(res.likeCount);
    } catch (e) {
      setLiked(liked);
      setLikeCount(tweet?.likeCount ?? 0);
      console.error('Like', e);
    } finally {
      setLikeLoading(false);
    }
  };

  const handleRetweet = async () => {
    if (!tweetId || retweetLoading) return;
    const nextRetweeted = !retweeted;
    setRetweeted(nextRetweeted);
    setRetweetCount((c) => (nextRetweeted ? c + 1 : Math.max(0, c - 1)));
    setRetweetLoading(true);
    try {
      const res = await apiService.post(`/api/tweets/${tweetId}/retweet`, {});
      setRetweeted(res.retweeted);
      if (typeof res.retweetCount === 'number') setRetweetCount(res.retweetCount);
    } catch (e) {
      setRetweeted(retweeted);
      setRetweetCount(tweet?.retweetCount ?? 0);
      console.error('Retweet', e);
    } finally {
      setRetweetLoading(false);
    }
  };

  const openReply = () => {
    navigation.navigate('CreateTweet', {
      isReply: true,
      tweet: {
        _id: tweet._id,
        username: tweet.author?.username,
      },
    });
  };

  if (loading && !tweet) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
            <Icon name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Post</Text>
          <View style={styles.headerBtn} />
        </View>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!tweet) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
            <Icon name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Post</Text>
          <View style={styles.headerBtn} />
        </View>
        <View style={styles.loadingWrap}>
          <Text style={styles.errorText}>Tweet not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const author = tweet.author || {};
  const isOwnTweet = currentUser?._id === author._id;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header: back, "Post", refresh */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Icon name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.headerBtn}>
          <Icon name="refresh" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {/* Author row: avatar, name, @handle, Follow, more */}
        <View style={styles.authorRow}>
          <TouchableOpacity onPress={() => navigation.navigate('UserProfile', { userId: author._id })}>
            <Image source={{ uri: author.profilePic || DEFAULT_AVATAR }} style={styles.avatar} />
          </TouchableOpacity>
          <View style={styles.authorInfo}>
            <TouchableOpacity onPress={() => navigation.navigate('UserProfile', { userId: author._id })}>
              <View style={styles.nameRow}>
                <Text style={styles.authorName}>{author.name}</Text>
                {author.verified && <Text style={styles.verified}>✓</Text>}
              </View>
              <Text style={styles.authorHandle}>@{author.username}</Text>
            </TouchableOpacity>
          </View>
          {!isOwnTweet && (
            <TouchableOpacity
              style={[styles.followBtn, isFollowing && styles.followingBtn]}
              onPress={handleFollow}
              disabled={followLoading}
            >
              {followLoading ? (
                <ActivityIndicator size="small" color={isFollowing ? COLORS.text : COLORS.white} />
              ) : (
                <Text style={[styles.followBtnText, isFollowing && styles.followingBtnText]}>
                  {isFollowing ? 'Following' : 'Follow'}
                </Text>
              )}
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.moreBtn}>
            <Icon name="more-horiz" size={22} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        {/* Tweet text */}
        <Text style={styles.tweetText}>{tweet.text}</Text>

        {/* Media */}
        {tweet.media && tweet.media.length > 0 && (
          <View style={styles.mediaWrap}>
            {tweet.media[0].type === 'image' ? (
              <Image source={{ uri: tweet.media[0].url }} style={styles.mediaImage} resizeMode="cover" />
            ) : tweet.media[0].type === 'video' ? (
              <View style={styles.videoContainer}>
                <Video
                  source={{ uri: tweet.media[0].url }}
                  style={styles.mediaVideo}
                  resizeMode="cover"
                  repeat
                  paused={videoPaused}
                  muted={videoMuted}
                  playInBackground={false}
                  playWhenInactive={false}
                />
                {videoPaused && (
                  <View style={styles.videoPlayOverlay} pointerEvents="none">
                    <Text style={styles.videoPlayIcon}>▶</Text>
                  </View>
                )}
                {/* Transparent overlay so tap always triggers play/pause */}
                <TouchableOpacity
                  style={StyleSheet.absoluteFill}
                  activeOpacity={1}
                  onPress={() => setVideoPaused((p) => !p)}
                />
                <TouchableOpacity
                  style={styles.muteButton}
                  onPress={() => setVideoMuted((m) => !m)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.muteIcon}>{videoMuted ? '🔇' : '🔊'}</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        )}

        {/* Timestamp */}
        <Text style={styles.timestamp}>{formatPostTime(tweet.createdAt)}</Text>

        {/* Stats row: Views, Reposts, Likes, Replies */}
        <View style={styles.statsRow}>
          <Text style={styles.statsText}>{formatViews(tweet.viewCount || 0)} Views</Text>
          <Text style={styles.statsDot}>·</Text>
          <Text style={styles.statsText}>{formatViews(retweetCount)} Reposts</Text>
          <Text style={styles.statsDot}>·</Text>
          <Text style={styles.statsText}>{formatViews(likeCount)} Likes</Text>
          <Text style={styles.statsDot}>·</Text>
          <Text style={styles.statsText}>{formatViews(tweet.replyCount || 0)} Replies</Text>
        </View>

        {/* Action row: Reply, Retweet, Like, Share */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={openReply}>
            <Icon name="chat-bubble-outline" size={22} color={COLORS.textSecondary} />
            <Text style={styles.actionCount}>{tweet.replyCount || 0}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={handleRetweet} disabled={retweetLoading}>
            <Icon name="repeat" size={22} color={retweeted ? COLORS.primary : COLORS.textSecondary} />
            <Text style={[styles.actionCount, retweeted && styles.actionCountLiked]}>{retweetCount}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={handleLike} disabled={likeLoading}>
            <Icon name={liked ? 'favorite' : 'favorite-border'} size={22} color={liked ? COLORS.error : COLORS.textSecondary} />
            <Text style={[styles.actionCount, liked && styles.actionCountLiked]}>{likeCount}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Icon name="share" size={22} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Replies list (paginated – scales to millions) */}
        <View style={styles.repliesSection}>
          <Text style={styles.repliesSectionTitle}>Replies</Text>
          {loadingReplies ? (
            <View style={styles.repliesLoading}>
              <ActivityIndicator size="small" color={COLORS.primary} />
            </View>
          ) : replies.length === 0 ? (
            <Text style={styles.noReplies}>
              {(tweet.replyCount ?? 0) > 0 ? 'No replies loaded.' : 'No replies yet.'}
            </Text>
          ) : (
            <>
              {replies.map((reply: any, index: number) => {
                const replyAuthor = reply.author || {};
                return (
                  <TouchableOpacity
                    key={String(reply._id ?? reply.id ?? `reply-${index}`)}
                    style={styles.replyRow}
                    activeOpacity={0.7}
                    onPress={() => navigation.navigate('TweetDetail', { tweetId: reply._id, tweet: reply })}
                  >
                    <Image
                      source={{ uri: replyAuthor.profilePic || DEFAULT_AVATAR }}
                      style={styles.replyAvatar}
                    />
                    <View style={styles.replyBody}>
                      <View style={styles.replyHeader}>
                        <Text style={styles.replyName}>{replyAuthor.name || 'User'}</Text>
                        <Text style={styles.replyHandle}>@{replyAuthor.username || ''}</Text>
                        <Text style={styles.replyDot}>·</Text>
                        <Text style={styles.replyTime}>{formatPostTime(reply.createdAt)}</Text>
                      </View>
                      <Text style={styles.replyText}>{reply.text}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
              {hasMoreReplies && (
                <TouchableOpacity
                  style={styles.loadMoreReplies}
                  onPress={loadMoreReplies}
                  disabled={loadingMoreReplies}
                >
                  {loadingMoreReplies ? (
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  ) : (
                    <Text style={styles.loadMoreRepliesText}>Load more replies</Text>
                  )}
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </ScrollView>

      {/* Reply input at bottom – like real Twitter */}
      <TouchableOpacity style={styles.replyInputWrap} onPress={openReply} activeOpacity={0.8}>
        <Image source={{ uri: currentUser?.profilePic || DEFAULT_AVATAR }} style={styles.replyAvatar} />
        <Text style={styles.replyPlaceholder}>Post your reply</Text>
        <TouchableOpacity style={styles.replyCamera} onPress={openReply}>
          <Icon name="photo-camera" size={22} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  headerBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16, color: COLORS.textSecondary },
  scroll: { flex: 1 },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  avatar: { width: 48, height: 48, borderRadius: 24, marginRight: 12 },
  authorInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  authorName: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  verified: { fontSize: 16, color: COLORS.primary, marginLeft: 4 },
  authorHandle: { fontSize: 15, color: COLORS.textSecondary },
  followBtn: {
    backgroundColor: COLORS.text,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  followingBtn: { backgroundColor: 'transparent', borderWidth: 1, borderColor: COLORS.border },
  followBtnText: { fontSize: 15, fontWeight: '700', color: COLORS.white },
  followingBtnText: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  moreBtn: { padding: 8 },
  tweetText: {
    fontSize: TWITTER_STYLES.fontSize.medium,
    color: COLORS.text,
    lineHeight: 22,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  mediaWrap: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: COLORS.backgroundLight,
  },
  videoContainer: {
    position: 'relative',
    width: SCREEN_WIDTH - 32,
    height: (SCREEN_WIDTH - 32) * 0.6,
    backgroundColor: COLORS.black,
  },
  mediaImage: { width: SCREEN_WIDTH - 32, height: (SCREEN_WIDTH - 32) * 0.6 },
  mediaVideo: { width: '100%', height: '100%' },
  videoPlayOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlayIcon: { fontSize: 48, color: COLORS.white },
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
  muteIcon: { fontSize: 16 },
  timestamp: { fontSize: 15, color: COLORS.textSecondary, paddingHorizontal: 16, paddingBottom: 16 },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  statsText: { fontSize: 15, color: COLORS.textSecondary },
  statsDot: { fontSize: 15, color: COLORS.textSecondary, marginHorizontal: 6 },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionCount: { fontSize: 13, color: COLORS.textSecondary },
  actionCountLiked: { color: COLORS.error },
  repliesSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
  repliesSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  replyRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  replyBody: { flex: 1 },
  replyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  replyName: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginRight: 6 },
  replyHandle: { fontSize: 15, color: COLORS.textSecondary, marginRight: 4 },
  replyDot: { fontSize: 15, color: COLORS.textSecondary, marginRight: 4 },
  replyTime: { fontSize: 15, color: COLORS.textSecondary },
  replyText: { fontSize: 15, color: COLORS.text, lineHeight: 20 },
  repliesLoading: { paddingVertical: 24, alignItems: 'center' },
  noReplies: { fontSize: 15, color: COLORS.textSecondary, paddingVertical: 16, textAlign: 'center' },
  loadMoreReplies: { paddingVertical: 16, alignItems: 'center' },
  loadMoreRepliesText: { fontSize: 15, color: COLORS.primary, fontWeight: '600' },
  replyInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  replyAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 12 },
  replyPlaceholder: { flex: 1, fontSize: 17, color: COLORS.textSecondary },
  replyCamera: { padding: 8 },
});

export default TweetDetailScreen;
