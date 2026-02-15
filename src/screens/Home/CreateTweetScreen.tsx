import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { COLORS, TWITTER_STYLES } from '../../utils/constants';
import { useUser } from '../../context/UserContext';
import { apiService } from '../../services/api';

const DEFAULT_AVATAR = 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png';

const CreateTweetScreen = ({ navigation, route }: any) => {
  const { user } = useUser();
  const [tweetText, setTweetText] = useState('');
  const [posting, setPosting] = useState(false);
  const maxLength = 280;
  const isReply = route?.params?.isReply || false;
  const replyToTweet = route?.params?.tweet;

  const handlePost = async () => {
    const text = tweetText.trim();
    if (text.length === 0) {
      Alert.alert('Error', 'Tweet cannot be empty');
      return;
    }
    if (text.length > maxLength) {
      Alert.alert('Error', `Tweet cannot exceed ${maxLength} characters`);
      return;
    }

    setPosting(true);
    try {
      const body: { text: string; replyTo?: string } = { text };
      if (isReply && replyToTweet?._id) {
        body.replyTo = typeof replyToTweet._id === 'string' ? replyToTweet._id : replyToTweet._id.toString();
      }
      await apiService.post('/api/tweets', body);
      setTweetText('');
      navigation.goBack();
    } catch (err: any) {
      const message = err?.message || 'Failed to post tweet';
      Alert.alert('Error', message);
    } finally {
      setPosting(false);
    }
  };

  const getCharacterColor = () => {
    const remaining = maxLength - tweetText.length;
    if (remaining < 0) return COLORS.error;
    if (remaining < 20) return '#FFD400';
    return COLORS.textSecondary;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelText}>✕</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.postButton,
            (tweetText.trim().length === 0 || tweetText.length > maxLength) && !posting && styles.postButtonDisabled,
            posting && styles.postButtonLoading,
          ]}
          onPress={handlePost}
          disabled={tweetText.trim().length === 0 || tweetText.length > maxLength || posting}
        >
          {posting ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Text style={styles.postButtonText}>
              {isReply ? 'Reply' : 'Post'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Reply Preview */}
        {isReply && replyToTweet && (
          <View style={styles.replyPreview}>
            <Text style={styles.replyingTo}>
              Replying to <Text style={styles.replyUsername}>@{replyToTweet.username}</Text>
            </Text>
          </View>
        )}

        {/* User Avatar */}
        <View style={styles.tweetComposer}>
          <Image
            source={{ uri: user?.profilePic || DEFAULT_AVATAR }}
            style={styles.avatar}
          />
          
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.tweetInput}
              placeholder={isReply ? "Tweet your reply" : "What's happening?"}
              placeholderTextColor={COLORS.textSecondary}
              value={tweetText}
              onChangeText={setTweetText}
              multiline
              autoFocus
              maxLength={maxLength + 50} // Allow typing beyond limit for UX
            />
          </View>
        </View>

        {/* Character Counter */}
        <View style={styles.footer}>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionIcon}>🖼️</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionIcon}>GIF</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionIcon}>📊</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionIcon}>😊</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionIcon}>📅</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.characterCounter}>
            {tweetText.length > maxLength - 20 && (
              <>
                <Text style={[styles.characterCount, { color: getCharacterColor() }]}>
                  {maxLength - tweetText.length}
                </Text>
                {tweetText.length > maxLength && (
                  <View style={styles.errorCircle} />
                )}
              </>
            )}
          </View>
        </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  cancelButton: {
    padding: 5,
  },
  cancelText: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '400',
  },
  postButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 88,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postButtonDisabled: {
    backgroundColor: COLORS.backgroundLight,
    opacity: 0.5,
  },
  postButtonLoading: {
    opacity: 1,
  },
  postButtonText: {
    color: COLORS.white,
    fontSize: TWITTER_STYLES.fontSize.regular,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  replyPreview: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  replyingTo: {
    fontSize: TWITTER_STYLES.fontSize.small,
    color: COLORS.textSecondary,
  },
  replyUsername: {
    color: COLORS.primary,
  },
  tweetComposer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingTop: 15,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  inputContainer: {
    flex: 1,
  },
  tweetInput: {
    color: COLORS.text,
    fontSize: 18,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.border,
    marginTop: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    padding: 5,
  },
  actionIcon: {
    fontSize: 18,
    color: COLORS.primary,
  },
  characterCounter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  characterCount: {
    fontSize: TWITTER_STYLES.fontSize.small,
    marginRight: 10,
  },
  errorCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.error,
  },
});

export default CreateTweetScreen;
