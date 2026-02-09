import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { COLORS, TWITTER_STYLES } from '../../utils/constants';
import { apiService } from '../../services/api';
import { useUser } from '../../context/UserContext';

const DEFAULT_AVATAR = 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png';

// Debounce delay (ms)
const SEARCH_DEBOUNCE_MS = 400;

type UserResult = {
  _id: string;
  name: string;
  username: string;
  profilePic?: string;
  bio?: string;
  followerCount?: number;
  followingCount?: number;
  isFollowing?: boolean;
};

const UserRow = ({
  user,
  onFollow,
  onPress,
  followLoading,
}: {
  user: UserResult;
  onFollow: () => void;
  onPress: () => void;
  followLoading: boolean;
}) => {
  const isSelf = useUser().user?._id === user._id;
  return (
    <TouchableOpacity
      style={styles.userRow}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: user.profilePic || DEFAULT_AVATAR }}
        style={styles.userAvatar}
      />
      <View style={styles.userInfo}>
        <Text style={styles.userName} numberOfLines={1}>{user.name}</Text>
        <Text style={styles.userHandle} numberOfLines={1}>@{user.username}</Text>
        {user.bio ? (
          <Text style={styles.userBio} numberOfLines={2}>{user.bio}</Text>
        ) : null}
      </View>
      {!isSelf && (
        <TouchableOpacity
          style={[styles.followBtn, user.isFollowing && styles.followingBtn]}
          onPress={(e) => {
            e.stopPropagation();
            onFollow();
          }}
          disabled={followLoading}
          activeOpacity={0.8}
        >
          {followLoading ? (
            <ActivityIndicator size="small" color={user.isFollowing ? COLORS.text : COLORS.white} />
          ) : (
            <Text style={[styles.followBtnText, user.isFollowing && styles.followingBtnText]}>
              {user.isFollowing ? 'Following' : 'Follow'}
            </Text>
          )}
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const SearchScreen = ({ navigation }: any) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<UserResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [followLoadingId, setFollowLoadingId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastScrollY = useRef(0);

  const fetchSuggested = useCallback(async () => {
    try {
      const res = await apiService.get('/api/users/suggested?limit=20');
      const users = (res.users || []).map((u: any) => ({ ...u, isFollowing: false }));
      setSuggestedUsers(users);
    } catch (e) {
      console.error('Suggested users', e);
      setSuggestedUsers([]);
    }
  }, []);

  const searchUsers = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    try {
      const res = await apiService.get(`/api/users/search?q=${encodeURIComponent(trimmed)}&limit=30`);
      setSearchResults(res.users || []);
    } catch (e) {
      console.error('Search users', e);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!searchQuery.trim()) {
      setSearchResults([]);
      fetchSuggested();
      return;
    }
    debounceRef.current = setTimeout(() => {
      searchUsers(searchQuery);
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery, searchUsers, fetchSuggested]);

  useEffect(() => {
    if (!searchQuery.trim()) fetchSuggested();
  }, [fetchSuggested]);

  const updateUserInList = (userId: string, isFollowing: boolean, deltaFollower: number) => {
    setSearchResults(prev =>
      prev.map(u =>
        u._id === userId
          ? {
              ...u,
              isFollowing,
              followerCount: Math.max(0, (u.followerCount ?? 0) + deltaFollower),
            }
          : u
      )
    );
    setSuggestedUsers(prev =>
      prev.map(u =>
        u._id === userId ? { ...u, isFollowing } : u
      )
    );
  };

  const handleFollow = async (user: UserResult) => {
    if (followLoadingId) return;
    setFollowLoadingId(user._id);
    try {
      const res = await apiService.post(`/api/users/${user._id}/follow`, {});
      const following = res.following ?? false;
      updateUserInList(user._id, following, following ? 1 : -1);
    } catch (e) {
      console.error('Follow failed', e);
    } finally {
      setFollowLoadingId(null);
    }
  };

  const openProfile = (userId: string) => {
    navigation.navigate('UserProfile', { userId });
  };

  const tabBarVisibleStyle = {
    display: 'flex' as const,
    backgroundColor: COLORS.white,
    borderTopColor: COLORS.border,
    borderTopWidth: 0.5,
    height: 60,
    paddingBottom: 8,
    paddingTop: 8,
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    const scrollDirection = currentScrollY > lastScrollY.current ? 'down' : 'up';
    lastScrollY.current = currentScrollY;
    if (currentScrollY <= 0) {
      navigation.setOptions({ tabBarStyle: tabBarVisibleStyle });
      return;
    }
    if (scrollDirection === 'down') {
      navigation.setOptions({ tabBarStyle: { display: 'none' } });
    } else {
      navigation.setOptions({ tabBarStyle: tabBarVisibleStyle });
    }
  };

  const showResults = searchQuery.trim().length > 0;
  const listData = showResults ? searchResults : suggestedUsers;
  const sectionTitle = showResults ? 'People' : 'Suggested for you';

  const renderUser = ({ item }: { item: UserResult }) => (
    <UserRow
      user={item}
      onFollow={() => handleFollow(item)}
      onPress={() => openProfile(item._id)}
      followLoading={followLoadingId === item._id}
    />
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color={COLORS.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor={COLORS.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.clearBtn}
            >
              <Icon name="close" size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {searchLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{sectionTitle}</Text>
          </View>
          <FlatList
            data={listData}
            keyExtractor={(item) => item._id}
            renderItem={renderUser}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            ListEmptyComponent={
              showResults && !searchLoading ? (
                <View style={styles.emptyWrap}>
                  <Icon name="person-search" size={48} color={COLORS.textSecondary} />
                  <Text style={styles.emptyText}>No people found for "{searchQuery}"</Text>
                </View>
              ) : null
            }
            contentContainerStyle={listData.length === 0 ? styles.listEmpty : styles.listContent}
          />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 20,
    paddingHorizontal: 14,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: TWITTER_STYLES.fontSize.regular,
    paddingVertical: 10,
  },
  clearBtn: {
    padding: 4,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: COLORS.text,
  },
  listContent: {
    paddingBottom: 24,
  },
  listEmpty: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
    minWidth: 0,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  userHandle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  userBio: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  followBtn: {
    backgroundColor: COLORS.text,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  followingBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  followBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
  followingBtnText: {
    color: COLORS.text,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 12,
    textAlign: 'center',
  },
});

export default SearchScreen;
