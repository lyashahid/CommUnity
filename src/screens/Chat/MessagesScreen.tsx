import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  Image,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SwipeListView } from 'react-native-swipe-list-view';
import { collection, query, where, onSnapshot, orderBy, limit, doc, getDocs, db, auth, deleteDoc, updateDoc, addDoc, serverTimestamp } from '@/services/firebase';
import { useTheme } from '@/context/ThemeContext';
import { typography } from '../../theme/typography';

type Chat = {
  id: string;
  participantIds: string[];
  participants: { [key: string]: { name: string; avatar?: string } };
  lastMessage: string;
  lastMessageTime: any;
  unreadCount: number;
  requestTitle?: string;
  isMuted?: boolean;
};

const MessagesScreen = ({ navigation }: { navigation: any }) => {
  const { colors } = useTheme();
  const [chats, setChats] = useState<Chat[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread'>('all');
  const [recentUsers, setRecentUsers] = useState<{ uid: string; name: string; avatar?: string; lastChatTime: any }[]>([]);

  // Prevent rendering if colors are not available yet
  if (!colors) {
    return null;
  }

  const currentUserId = auth.currentUser?.uid;

  useEffect(() => {
    if (!currentUserId) return;

    // Query chats where current user is a participant
    const chatsQuery = query(
      collection(db, 'chats'),
      where('participantIds', 'array-contains', currentUserId),
      orderBy('lastMessageTime', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(chatsQuery, (snapshot) => {
      const chatsData = snapshot.docs.map(doc => {
        const data = doc.data();
        // Ensure participants object exists and has proper structure
        const participants = data.participants || {};
        const participantIds = data.participantIds || [];
        
        return {
          id: doc.id,
          unreadCount: 0, // Default to 0
          participantIds,
          participants,
          lastMessage: data.lastMessage || '',
          lastMessageTime: data.lastMessageTime,
          requestTitle: data.requestTitle,
          isMuted: data.isMuted || false,
          ...data
        };
      }).filter(chat => {
        // Filter out chats with invalid participant data
        return chat.participantIds && 
               Array.isArray(chat.participantIds) && 
               chat.participants && 
               typeof chat.participants === 'object';
      }) as Chat[];
      
      setChats(chatsData);

      // Extract recent users from all chats (including deleted ones)
      const usersMap = new Map<string, { uid: string; name: string; avatar?: string; lastChatTime: any }>();
      
      chatsData.forEach(chat => {
        const otherUserId = chat.participantIds.find(id => id !== currentUserId);
        if (otherUserId && chat.participants[otherUserId]) {
          const participant = chat.participants[otherUserId];
          const existingUser = usersMap.get(otherUserId);
          
          // Only update if this chat is more recent
          if (!existingUser || (chat.lastMessageTime && existingUser.lastChatTime && chat.lastMessageTime.toDate() > existingUser.lastChatTime.toDate())) {
            usersMap.set(otherUserId, {
              uid: otherUserId,
              name: participant.name || 'Unknown User',
              avatar: participant.avatar,
              lastChatTime: chat.lastMessageTime
            });
          }
        }
      });
      
      const recentUsersList = Array.from(usersMap.values())
        .sort((a, b) => {
          if (!a.lastChatTime) return 1;
          if (!b.lastChatTime) return -1;
          return b.lastChatTime.toDate().getTime() - a.lastChatTime.toDate().getTime();
        })
        .slice(0, 10); // Show top 10 recent users
      
      setRecentUsers(recentUsersList);
    }, (error) => {
      console.error('Error loading chats:', error);
    });

    return unsubscribe;
  }, [currentUserId]);

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => setRefreshing(false), 1000);
  };

  const getOtherParticipant = (chat: Chat) => {
    const otherUserId = chat.participantIds.find(id => id !== currentUserId);
    if (!otherUserId) {
      return { name: 'Unknown User', avatar: undefined };
    }
    return chat.participants[otherUserId] || { name: 'Unknown User', avatar: undefined };
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp || !timestamp.toDate) return '';
    
    try {
      const date = timestamp.toDate();
      const now = new Date();
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
      
      if (diffInHours < 24) {
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      } else if (diffInHours < 168) {
        return date.toLocaleDateString('en-US', { weekday: 'short' });
      } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
    } catch (error) {
      console.error('Error formatting timestamp:', error);
      return '';
    }
  };

  const filteredChats = chats.filter(chat => {
    const otherParticipant = getOtherParticipant(chat);
    const otherParticipantName = otherParticipant?.name || 'Unknown User';
    const lastMessage = chat.lastMessage || '';
    
    const matchesSearch = otherParticipantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         lastMessage.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeFilter === 'unread') {
      return matchesSearch && chat.unreadCount > 0;
    }
    
    return matchesSearch;
  });

  const handleDeleteChat = async (chatId: string) => {
    Alert.alert(
      'Delete Chat',
      'Are you sure you want to delete this chat conversation? This will remove all messages but you can still chat with this person again.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete Chat',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete the chat document only (not the user)
              await deleteDoc(doc(db, 'chats', chatId));
              
              // Note: Firebase automatically deletes subcollections when parent is deleted
              // So all messages will be removed with the chat document
              
              console.log('Chat conversation deleted successfully');
              Alert.alert('Success', 'Chat conversation deleted. You can start a new conversation with this person anytime.');
            } catch (error) {
              console.error('Error deleting chat:', error);
              Alert.alert('Error', 'Failed to delete chat. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleToggleMute = async (chatId: string, isMuted: boolean) => {
    try {
      await updateDoc(doc(db, 'chats', chatId), {
        isMuted: !isMuted
      });
      
      console.log(`Chat ${!isMuted ? 'muted' : 'unmuted'} successfully`);
    } catch (error) {
      console.error('Error toggling mute:', error);
      Alert.alert('Error', 'Failed to update chat settings. Please try again.');
    }
  };

  const handleStartNewChat = () => {
    Alert.alert(
      'Start New Chat',
      'How would you like to start a new conversation?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Browse Help Requests',
          onPress: () => {
            // Navigate to feed to find help requests to start conversations
            navigation.navigate('App', { screen: 'Feed' });
          },
        },
        {
          text: 'Search Users',
          onPress: () => {
            // Future enhancement: Add user search functionality
            Alert.alert('Coming Soon', 'User search will be available in the next update. For now, please browse help requests to start conversations.');
          },
        },
      ]
    );
  };

  const createNewChatWithUser = async (otherUserId: string, otherUserName: string) => {
    if (!currentUserId) return;

    try {
      // Check if chat already exists
      const chatsQuery = query(
        collection(db, 'chats'),
        where('participantIds', 'array-contains', currentUserId)
      );
      
      const querySnapshot = await getDocs(chatsQuery);
      let existingChat = null;

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.participantIds.includes(otherUserId)) {
          existingChat = { id: doc.id, ...data };
        }
      });

      if (existingChat) {
        // Navigate to existing chat
        navigation.navigate('Chat', { 
          chatId: existingChat.id,
          otherUserName: otherUserName
        });
      } else {
        // Create new chat
        const newChat = {
          participantIds: [currentUserId, otherUserId],
          participants: {
            [currentUserId]: {
              name: auth.currentUser?.displayName || 'User',
              avatar: auth.currentUser?.photoURL
            },
            [otherUserId]: {
              name: otherUserName,
              avatar: undefined
            }
          },
          lastMessage: '',
          lastMessageTime: serverTimestamp(),
          unreadCount: 0,
          createdAt: serverTimestamp()
        };

        const docRef = await addDoc(collection(db, 'chats'), newChat);
        
        // Navigate to new chat
        navigation.navigate('Chat', { 
          chatId: docRef.id,
          otherUserName: otherUserName
        });
      }
    } catch (error) {
      console.error('Error creating new chat:', error);
      Alert.alert('Error', 'Failed to start new chat. Please try again.');
    }
  };

  const renderRecentUser = ({ item }: { item: { uid: string; name: string; avatar?: string; lastChatTime: any } }) => {
    const isCurrentlyChatting = chats.some(chat => 
      chat.participantIds.includes(item.uid) && 
      chat.participantIds.includes(currentUserId!)
    );

    return (
      <TouchableOpacity
        style={[styles.recentUserItem, { backgroundColor: colors.surface.card }]}
        onPress={() => createNewChatWithUser(item.uid, item.name)}
      >
        <View style={styles.avatarContainer}>
          {item.avatar ? (
            <Image source={{ uri: item.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
              <Text style={[styles.avatarText, { color: colors.text.inverse }]}>
                {item.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          {isCurrentlyChatting && (
            <View style={[styles.activeChatIndicator, { backgroundColor: colors.success }]} />
          )}
        </View>
        
        <View style={styles.recentUserInfo}>
          <Text style={[styles.recentUserName, { color: colors.text.primary }]}>
            {item.name}
          </Text>
          <Text style={[styles.recentUserTime, { color: colors.text.secondary }]}>
            {item.lastChatTime ? formatTime(item.lastChatTime) : 'No recent messages'}
          </Text>
        </View>
        
        <View style={styles.recentUserAction}>
          <Ionicons name="chatbubble-outline" size={20} color={colors.primary} />
        </View>
      </TouchableOpacity>
    );
  };

  const renderChatItem = ({ item }: { item: Chat }) => {
    const otherParticipant = getOtherParticipant(item);
    const otherParticipantName = otherParticipant?.name || 'Unknown User';
    const otherParticipantAvatar = otherParticipant?.avatar;
    const hasUnread = item.unreadCount > 0 && !item.isMuted;

    return (
      <TouchableOpacity
        style={[styles.chatItem, { backgroundColor: colors.surface.card, shadowColor: colors.shadow }]}
        onPress={() => navigation.navigate('Chat', { 
          chatId: item.id,
          otherUserName: otherParticipantName
        })}
      >
        <View style={styles.avatarContainer}>
          {otherParticipantAvatar ? (
            <Image source={{ uri: otherParticipantAvatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
              <Text style={[styles.avatarText, { color: colors.text.inverse }]}>
                {otherParticipantName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          {hasUnread && <View style={[styles.unreadBadge, { backgroundColor: colors.error, borderColor: colors.surface.card }]} />}
          {item.isMuted && (
            <View style={[styles.muteBadge, { backgroundColor: colors.background.secondary }]}>
              <Ionicons name="notifications-off" size={10} color={colors.text.secondary} />
            </View>
          )}
        </View>

        <View style={styles.chatContent}>
          <View style={styles.chatHeader}>
            <Text style={[styles.name, hasUnread && styles.unreadName, { color: colors.text.primary }]}>
              {otherParticipantName}
            </Text>
            <Text style={[styles.time, { color: colors.text.secondary }]}>
              {formatTime(item.lastMessageTime)}
            </Text>
          </View>
          
          <Text 
            style={[styles.lastMessage, hasUnread && styles.unreadMessage, { color: hasUnread ? colors.text.primary : colors.text.secondary }]}
            numberOfLines={1}
          >
            {item.lastMessage || 'No messages yet'}
          </Text>
          
          {item.requestTitle && (
            <View style={[styles.requestTag, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="help-circle" size={12} color={colors.primary} />
              <Text style={[styles.requestText, { color: colors.primary }]}>{item.requestTitle}</Text>
            </View>
          )}
        </View>

        {hasUnread && (
          <View style={[styles.unreadCount, { backgroundColor: colors.primary }]}>
            <Text style={[styles.unreadCountText, { color: colors.text.inverse }]}>
              {item.unreadCount > 9 ? '9+' : item.unreadCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderHiddenItem = ({ item }: { item: Chat }) => {
    const otherParticipant = getOtherParticipant(item);
    
    return (
      <View style={styles.rowBack}>
        {/* Mute/Unmute Button */}
        <TouchableOpacity
          style={[styles.backRightBtn, styles.backRightBtnMute, { backgroundColor: item.isMuted ? colors.success : colors.warning }]}
          onPress={() => handleToggleMute(item.id, item.isMuted || false)}
        >
          <Ionicons 
            name={item.isMuted ? "notifications" : "notifications-off"} 
            size={24} 
            color="white" 
          />
          <Text style={styles.backTextWhite}>{item.isMuted ? 'Unmute' : 'Mute'}</Text>
        </TouchableOpacity>
        
        {/* Delete Button */}
        <TouchableOpacity
          style={[styles.backRightBtn, styles.backRightBtnDelete]}
          onPress={() => handleDeleteChat(item.id)}
        >
          <Ionicons name="trash" size={24} color="white" />
          <Text style={styles.backTextWhite}>Delete</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Messages</Text>
        <TouchableOpacity 
          style={[styles.newChatButton, { backgroundColor: colors.background.secondary }]}
          onPress={handleStartNewChat}
        >
          <Ionicons name="create-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.background.tertiary, borderColor: colors.border }]}>
        <Ionicons name="search" size={20} color={colors.text.secondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text.primary }]}
          placeholder="Search messages..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={colors.text.secondary}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={colors.text.secondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs */}
      <View style={[styles.filterContainer, { backgroundColor: colors.background.secondary }]}>
        <TouchableOpacity
          style={[styles.filterTab, activeFilter === 'all' && [styles.activeFilterTab, { backgroundColor: colors.surface.card, shadowColor: colors.shadow }]]}
          onPress={() => setActiveFilter('all')}
        >
          <Text style={[styles.filterText, activeFilter === 'all' && styles.activeFilterText, { color: activeFilter === 'all' ? colors.primary : colors.text.secondary }]}>
            All Messages
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, activeFilter === 'unread' && [styles.activeFilterTab, { backgroundColor: colors.surface.card, shadowColor: colors.shadow }]]}
          onPress={() => setActiveFilter('unread')}
        >
          <View style={styles.unreadFilter}>
            <Text style={[styles.filterText, activeFilter === 'unread' && styles.activeFilterText, { color: activeFilter === 'unread' ? colors.primary : colors.text.secondary }]}>
              Unread
            </Text>
            {chats.some(chat => chat.unreadCount > 0) && (
              <View style={[styles.filterBadge, { backgroundColor: colors.error }]}>
                <Text style={[styles.filterBadgeText, { color: colors.text.inverse }]}>
                  {chats.filter(chat => chat.unreadCount > 0).length}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* Recent Users Section - Show when no active chats or as additional option */}
      {filteredChats.length === 0 && recentUsers.length > 0 && (
        <View style={[styles.recentUsersSection, { backgroundColor: colors.background.secondary }]}>
          <Text style={[styles.recentUsersTitle, { color: colors.text.primary }]}>
            People you've chatted with
          </Text>
          <Text style={[styles.recentUsersSubtitle, { color: colors.text.secondary }]}>
            Start a new conversation with someone you know
          </Text>
          <FlatList
            data={recentUsers.filter(user => !chats.some(chat => chat.participantIds.includes(user.uid)))}
            keyExtractor={(item) => item.uid}
            renderItem={renderRecentUser}
            showsVerticalScrollIndicator={false}
            scrollEnabled={false}
          />
        </View>
      )}

      {/* Chats List */}
      <SwipeListView
        data={filteredChats}
        keyExtractor={(item) => item.id}
        renderItem={renderChatItem}
        renderHiddenItem={renderHiddenItem}
        leftOpenValue={0}
        rightOpenValue={-140}
        previewRowKey={'id'}
        previewDuration={300}
        previewOpenValue={-40}
        closeOnRowPress={true}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="chatbubble-ellipses-outline" size={64} color={colors.text.secondary} />
            <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
              {searchQuery ? 'No messages found' : 'No messages yet'}
            </Text>
            <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
              {searchQuery 
                ? 'Try different search terms'
                : activeFilter === 'unread' 
                  ? 'No unread messages'
                  : 'Start a conversation by helping someone!'
              }
            </Text>
            <TouchableOpacity 
              style={[styles.emptyButton, { backgroundColor: colors.primary }]}
              onPress={() => navigation.navigate('App', { screen: 'Feed' })}
            >
              <Text style={[styles.emptyButtonText, { color: colors.text.inverse }]}>Find requests to help</Text>
            </TouchableOpacity>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    ...typography.h1,
  },
  newChatButton: {
    padding: 8,
    borderRadius: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 20,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    ...typography.body,
  },
  filterContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 12,
    padding: 4,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeFilterTab: {
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  filterText: {
    ...typography.caption,
    fontWeight: '500',
  },
  activeFilterText: {
    fontWeight: '600',
  },
  unreadFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filterBadge: {
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    ...typography.caption,
    fontWeight: '600',
    paddingHorizontal: 4,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexGrow: 1,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    zIndex: 1,
    backgroundColor: 'white',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...typography.h3,
    fontWeight: '600',
  },
  unreadBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  muteBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  chatContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    ...typography.body,
    fontWeight: '600',
  },
  unreadName: {
    fontWeight: '700',
  },
  time: {
    ...typography.caption,
  },
  lastMessage: {
    ...typography.caption,
    marginBottom: 6,
  },
  unreadMessage: {
    fontWeight: '500',
  },
  requestTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  requestText: {
    ...typography.caption,
    fontWeight: '500',
  },
  unreadCount: {
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  unreadCountText: {
    ...typography.caption,
    fontWeight: '600',
  },
  rowBack: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 15,
    marginVertical: 6,
    borderRadius: 16,
  },
  backRightBtn: {
    alignItems: 'center',
    bottom: 8,
    justifyContent: 'center',
    position: 'absolute',
    top: 8,
    width: 70,
    marginHorizontal: 6,
  },
  backRightBtnMute: {
    right: 70,
  },
  backRightBtnDelete: {
    right: 0,
    backgroundColor: '#FF3B30',
  },
  backTextWhite: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    ...typography.h2,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    ...typography.body,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    ...typography.body,
    fontWeight: '600',
  },
  recentUsersSection: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
  },
  recentUsersTitle: {
    ...typography.h3,
    fontWeight: '600',
    marginBottom: 4,
  },
  recentUsersSubtitle: {
    ...typography.caption,
    marginBottom: 16,
  },
  recentUserItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  recentUserInfo: {
    flex: 1,
    marginLeft: 12,
  },
  recentUserName: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: 2,
  },
  recentUserTime: {
    ...typography.caption,
  },
  recentUserAction: {
    padding: 8,
  },
  activeChatIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: 'white',
  },
});

export default MessagesScreen;