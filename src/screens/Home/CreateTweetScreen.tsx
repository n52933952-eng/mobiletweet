import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { COLORS, TWITTER_STYLES } from '../../utils/constants';

const CreateTweetScreen = ({ navigation, route }: any) => {
  const [tweetText, setTweetText] = useState('');
  const maxLength = 280;
  const isReply = route?.params?.isReply || false;
  const replyToTweet = route?.params?.tweet;

  const handlePost = async () => {
    if (tweetText.trim().length === 0) {
      Alert.alert('Error', 'Tweet cannot be empty');
      return;
    }

    try {
      // TODO: Implement API call to post tweet
      console.log('Posting tweet:', tweetText);
      Alert.alert('Success', 'Tweet posted!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to post tweet');
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
            tweetText.trim().length === 0 && styles.postButtonDisabled
          ]}
          onPress={handlePost}
          disabled={tweetText.trim().length === 0 || tweetText.length > maxLength}
        >
          <Text style={styles.postButtonText}>
            {isReply ? 'Reply' : 'Post'}
          </Text>
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
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>U</Text>
          </View>
          
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
  },
  postButtonDisabled: {
    backgroundColor: COLORS.backgroundLight,
    opacity: 0.5,
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
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
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
