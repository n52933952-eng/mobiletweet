import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Image } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { COLORS } from '../utils/constants';

interface Props {
  visible: boolean;
  onAllow: () => void;
  onNotNow: () => void;
}

/**
 * Twitter-style notification permission modal
 * Shown once after login to request push notification permission
 */
export const NotificationPermissionModal = ({ visible, onAllow, onNotNow }: Props) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onNotNow}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.iconContainer}>
            <Icon name="notifications" size={64} color={COLORS.primary} />
          </View>
          <Text style={styles.title}>Turn on notifications?</Text>
          <Text style={styles.message}>
            Get notified when people like, retweet, and reply to your tweets.
          </Text>
          <TouchableOpacity style={styles.allowButton} onPress={onAllow} activeOpacity={0.8}>
            <Text style={styles.allowButtonText}>Allow</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.notNowButton} onPress={onNotNow} activeOpacity={0.8}>
            <Text style={styles.notNowButtonText}>Not now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 32,
    width: '90%',
    maxWidth: 360,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  allowButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 25,
    width: '100%',
    marginBottom: 12,
    alignItems: 'center',
  },
  allowButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  notNowButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
  },
  notNowButtonText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
});
