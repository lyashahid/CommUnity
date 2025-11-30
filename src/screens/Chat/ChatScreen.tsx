import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Image,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  getDocs,
  getDoc,
  serverTimestamp,
  limit,
  arrayUnion,
  db,
  auth
} from '@/services/firebase';
import { useTheme } from '@/context/ThemeContext';
import { typography } from '../../theme/typography';
import HelpRequestButton from '../../components/common/HelpRequestButton';
import CompleteRequestButton from '../../components/common/CompleteRequestButton';
import RequestSticker from '../../components/common/RequestSticker';
import HeaderEnvelopeButton from '../../components/common/HeaderEnvelopeButton';
import AcceptRejectButton from '../../components/common/AcceptRejectButton';
import { saveReviewAndUpdateProfiles, ReviewData } from '@/services/ratingService';
import { postsCol } from '@/services/firebase';
import { 
  HelpRequest, 
  HelpRequestStatus, 
  RequestType,
  canUserSendOfficialRequest,
  canUserAcceptRequest,
  canUserCompleteRequest
} from '../../types/helpRequest';

type Message = {
  id: string;
  text: string;
  senderId: string;
  timestamp: any;
  read: boolean;
  isOfficialRequest?: boolean;
};

type ChatScreenParams = {
  chatId?: string;
  requestId?: string;
  otherUserId?: string;
  requestTitle?: string;
  otherUserName?: string;
};

const ChatScreen = () => {
  const { colors } = useTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState('');
  const [chatId, setChatId] = useState<string | null>(null);
  const [isOfficialRequest, setIsOfficialRequest] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showCompleteButton, setShowCompleteButton] = useState(false);
  const [showRequestSticker, setShowRequestSticker] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [requestStatus, setRequestStatus] = useState<'pending' | 'ongoing' | 'rejected' | null>(null);
  const [isRequester, setIsRequester] = useState(false);
  const [requestData, setRequestData] = useState<any>(null);
  const [recentRequest, setRecentRequest] = useState<{
    title: string;
    description: string;
    category: string;
    urgency: string;
  } | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const unsubscribeRequestRef = useRef<(() => void) | null>(null);
  const unsubscribeMessagesRef = useRef<(() => void) | null>(null);
  const route = useRoute();

  // Prevent rendering if colors are not available yet
  if (!colors) {
    return null;
  }
  const navigation = useNavigation();
  const currentUserId = auth.currentUser?.uid;
  
  const {
    chatId: routeChatId,
    requestId,
    otherUserId,
    requestTitle,
    otherUserName,
  } = route.params as ChatScreenParams;

  // Set up the chat - either load existing or create new
  useEffect(() => {
    console.log('Chat Setup Started:', { requestId, routeChatId, otherUserId, currentUserId });
    
    // Determine if current user is the requester and set up listeners
    const setupChat = async () => {
      if (requestId) {
        console.log('Loading existing request:', requestId);
        try {
          const requestRef = doc(db, 'requests', requestId);
          const requestDoc = await getDoc(requestRef);
          if (requestDoc.exists()) {
            const requestData = requestDoc.data();
            console.log('Existing request data:', requestData);
            setRequestData({ ...requestData, id: requestId });
            setIsRequester(requestData.requesterId === currentUserId);
            setRequestStatus(requestData.status || null);
            
            // Set up real-time listener for request status changes
            unsubscribeRequestRef.current = onSnapshot(requestRef, (snapshot) => {
              const data = snapshot.data();
              if (data) {
                console.log('Request status update:', { id: requestId, status: data.status });
                setRequestData({ ...data, id: requestId });
                setRequestStatus(data.status || null);
                
                // Show complete button for requester when request is accepted (ongoing)
                if (data.status === 'ongoing' && isRequester) {
                  setShowCompleteButton(true);
                }
                
                // Mark as completed if status is completed
                if (data.status === 'completed' || data.status === 'rejected') {
                  setIsCompleted(true);
                  setShowCompleteButton(false);
                }
              }
            });
          } else {
            console.log('Request document not found:', requestId);
          }
        } catch (error) {
          console.error('Error determining requester:', error);
          setIsRequester(true);
        }
      } else {
        console.log('No requestId, will determine role from pending requests');
        // Don't set isRequester here - let the pending request listener determine the role
        setIsRequester(false); // Default to false, will be updated by pending request listener
      }

      if (routeChatId) {
        console.log('Loading existing chat:', routeChatId);
        setChatId(routeChatId);
        loadMessages(routeChatId);
      } else if (requestId && otherUserId && currentUserId) {
        console.log('Finding or creating chat for request:', requestId);
        await findOrCreateChat();
      }
    };

    setupChat();

    // Set up navigation header
    navigation.setOptions({
      title: otherUserName || 'Chat',
      headerBackTitle: 'Back',
    });

    return () => {
      console.log('Cleaning up chat setup');
      // Clean up request listener
      if (unsubscribeRequestRef.current) {
        unsubscribeRequestRef.current();
        unsubscribeRequestRef.current = null;
      }
      // Clean up messages listener
      if (unsubscribeMessagesRef.current) {
        unsubscribeMessagesRef.current();
        unsubscribeMessagesRef.current = null;
      }
    };
  }, [requestId, otherUserId, currentUserId]);

  // Listen for pending requests in the chat (for both requester and helper)
  useEffect(() => {
    if (!chatId || !currentUserId) return;

    console.log('Pending Request Listener Setup:', { chatId, currentUserId });

    const requestsQuery = query(
      collection(db, 'requests'),
      where('chatId', '==', chatId),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(requestsQuery, (snapshot) => {
      console.log('Pending requests snapshot received:', { 
        empty: snapshot.empty, 
        size: snapshot.size,
        chatId
      });
      
      if (!snapshot.empty) {
        const requestDoc = snapshot.docs[0];
        const data = requestDoc.data();
        
        console.log('Pending Request Found:', {
          requestId: requestDoc.id,
          requesterId: data.requesterId,
          currentUserId,
          isCurrentUserRequester: data.requesterId === currentUserId,
          status: data.status
        });
        
        // Store the request data with its ID
        setRequestData({ ...data, id: requestDoc.id });

        // If current user is not the requester, mark as helper view with pending status
        if (data.requesterId !== currentUserId) {
          console.log('Setting as HELPER - showing accept/reject buttons');
          setRequestStatus('pending');
          setIsRequester(false);
        } else {
          // Current user is the requester
          console.log('Setting as REQUESTER - waiting for response');
          setRequestStatus('pending');
          setIsRequester(true);
        }
      } else {
        console.log('No pending requests found, checking for ongoing requests...');
        // No pending requests, check for ongoing requests
        const ongoingQuery = query(
          collection(db, 'requests'),
          where('chatId', '==', chatId),
          where('status', '==', 'ongoing')
        );
        
        getDocs(ongoingQuery).then((snapshot) => {
          console.log('Ongoing requests check:', { 
            empty: snapshot.empty, 
            size: snapshot.size,
            chatId
          });
          
          if (!snapshot.empty) {
            const requestDoc = snapshot.docs[0];
            const data = requestDoc.data();
            console.log('Ongoing request found:', {
              requestId: requestDoc.id,
              requesterId: data.requesterId,
              currentUserId,
              isCurrentUserRequester: data.requesterId === currentUserId
            });
            setRequestData({ ...data, id: requestDoc.id });
            setRequestStatus('ongoing');
            setIsRequester(data.requesterId === currentUserId);
            
            if (data.requesterId === currentUserId) {
              setShowCompleteButton(true);
            }
          } else {
            console.log('No ongoing requests found either');
          }
        });
      }
    });

    return unsubscribe;
  }, [chatId, currentUserId]);

  // Check for expired requests periodically
  useEffect(() => {
    if (!showCompleteButton || isCompleted || !chatId || !currentUserId) return;

    const checkExpiredRequests = async () => {
      try {
        const requestsQuery = query(
          collection(db, 'requests'),
          where('requesterId', '==', currentUserId),
          where('chatId', '==', chatId),
          where('status', '==', 'ongoing')
        );
        
        const querySnapshot = await getDocs(requestsQuery);
        const now = new Date();
        
        for (const document of querySnapshot.docs) {
          const requestData = document.data();
          if (requestData.expiresAt && typeof requestData.expiresAt.toDate === 'function') {
            const expiresAt = requestData.expiresAt.toDate();
            if (expiresAt < now) {
              // Auto-close the expired request
              await updateDoc(document.ref, {
                status: 'cancelled',
                cancelledAt: serverTimestamp(),
                reason: 'expired'
              });
              
              // Send system message about expiration
              const messagesRef = collection(db, 'chats', chatId, 'messages');
              await addDoc(messagesRef, {
                text: 'This request has expired and been automatically closed.',
                senderId: 'system',
                timestamp: serverTimestamp(),
                read: false,
                isSystemMessage: true
              });
              
              // Update chat status
              const chatRef = doc(db, 'chats', chatId);
              await updateDoc(chatRef, {
                isCompleted: true,
                completedAt: serverTimestamp(),
                expired: true
              });
              
              setIsCompleted(true);
              setShowCompleteButton(false);
            }
          }
        }
      } catch (error) {
        console.error('Error checking expired requests:', error);
      }
    };

    // Check immediately and then every minute
    checkExpiredRequests();
    const interval = setInterval(checkExpiredRequests, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [showCompleteButton, isCompleted, chatId, currentUserId]);

  // Fetch user's most recent request for auto-population
  useEffect(() => {
    if (!currentUserId) return;

    const fetchRecentRequest = async () => {
      try {
        const requestsQuery = query(
          collection(db, 'requests'),
          where('requesterId', '==', currentUserId),
          orderBy('createdAt', 'desc'),
          limit(1)
        );
        
        const querySnapshot = await getDocs(requestsQuery);
        if (!querySnapshot.empty) {
          const requestData = querySnapshot.docs[0].data();
          setRecentRequest({
            title: requestData.title || '',
            description: requestData.description || '',
            category: requestData.category || 'General',
            urgency: requestData.urgency || 'medium'
          });
        }
      } catch (error) {
        console.error('Error fetching recent request:', error);
      }
    };

    fetchRecentRequest();
  }, [currentUserId]);

  // Helper function to get current user's display name with proper fallbacks
  const getCurrentUserDisplayName = () => {
    const authUser = auth.currentUser;
    console.log('getCurrentUserDisplayName - authUser:', authUser);
    
    if (!authUser) {
      console.log('No auth user found, returning "User"');
      return 'User';
    }
    
    console.log('Auth user details:', {
      uid: authUser.uid,
      displayName: authUser.displayName,
      email: authUser.email,
      photoURL: authUser.photoURL
    });
    
    // Try multiple possible name fields with explicit checks
    let name = 'User';
    
    if (authUser.displayName && typeof authUser.displayName === 'string' && authUser.displayName.trim() !== '') {
      name = authUser.displayName.trim();
      console.log('Using displayName:', name);
    } else if (authUser.email && typeof authUser.email === 'string') {
      name = authUser.email.split('@')[0];
      console.log('Using email username:', name);
    } else {
      console.log('Using fallback name: User');
    }
    
    console.log('Final name:', name);
    return name;
  };

  // Helper function to fetch user profile if name is not available
  const fetchUserProfile = async (userId: string): Promise<{ name: string; avatar?: string }> => {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return {
          name: userData.displayName || userData.name || 'User',
          avatar: userData.photoURL || userData.avatar
        };
      }
    } catch (error) {
      console.warn('Could not fetch user profile:', userId, error);
    }
    return { name: 'User', avatar: undefined };
  };

  const findOrCreateChat = async () => {
    if (!currentUserId || !otherUserId || !requestId) return;

    console.log('findOrCreateChat:', { currentUserId, otherUserId, requestId, otherUserName });

    try {
      // Check if chat already exists for this request and users
      const chatsRef = collection(db, 'chats');
      const q = query(
        chatsRef,
        where('participantIds', 'array-contains', currentUserId)
      );
      
      const querySnapshot = await getDocs(q);
      let existingChat = null;

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.requestId === requestId && 
            data.participantIds.includes(otherUserId)) {
          existingChat = { id: doc.id, ...data };
        }
      });

      if (existingChat) {
        // Existing chat found
        console.log('Found existing chat:', existingChat.id);
        setChatId(existingChat.id);
        loadMessages(existingChat.id);
        
        // Update otherUserName from existing chat participants if not available
        if (!otherUserName || otherUserName === 'Unknown User') {
          const otherParticipantId = existingChat.participantIds.find(id => id !== currentUserId);
          if (otherParticipantId && existingChat.participants[otherParticipantId]) {
            const otherParticipantName = existingChat.participants[otherParticipantId].name;
            if (otherParticipantName && otherParticipantName !== 'Unknown User') {
              console.log('Updating otherUserName from existing chat:', otherParticipantName);
              // Update the navigation header with the correct name
              navigation.setOptions({
                title: otherParticipantName,
                headerBackTitle: 'Back',
              });
            } else {
              // Try to fetch from user profile
              const userProfile = await fetchUserProfile(otherParticipantId);
              if (userProfile.name !== 'User') {
                console.log('Updating otherUserName from user profile:', userProfile.name);
                navigation.setOptions({
                  title: userProfile.name,
                  headerBackTitle: 'Back',
                });
                // Optionally update the chat document with the correct name
                await updateDoc(doc(db, 'chats', existingChat.id), {
                  [`participants.${otherParticipantId}.name`]: userProfile.name,
                  [`participants.${otherParticipantId}.avatar`]: userProfile.avatar
                });
              }
            }
          }
        }
      } else {
        // Create new chat
        const currentUserDisplayName = getCurrentUserDisplayName();
        let otherUserDisplayName = otherUserName;
        
        console.log('Creating new chat - initial names:', {
          currentUserDisplayName,
          otherUserDisplayName,
          otherUserId,
          authDisplayName: auth.currentUser?.displayName
        });
        
        // If otherUserName is not available, try to fetch it from user profile
        if (!otherUserName || otherUserName === 'Unknown User') {
          console.log('Fetching other user profile for name...');
          const userProfile = await fetchUserProfile(otherUserId);
          otherUserDisplayName = userProfile.name;
          console.log('Fetched user name:', otherUserDisplayName);
        }
        
        console.log('Creating new chat with participants:', {
          currentUserId,
          currentUserDisplayName,
          otherUserId,
          otherUserDisplayName
        });
        
        const newChat = {
          participantIds: [currentUserId, otherUserId],
          participants: {
            [currentUserId]: {
              name: currentUserDisplayName || 'User',
              avatar: auth.currentUser?.photoURL
            },
            [otherUserId]: {
              name: otherUserDisplayName || 'Unknown User',
              // In a real app, you'd fetch the other user's profile here
            }
          },
          requestId,
          requestTitle,
          lastMessage: '',
          lastMessageTime: serverTimestamp(),
          unreadCount: 0,
          createdAt: serverTimestamp()
        };

        // Final validation to ensure no undefined names
        console.log('Before validation - participant names:', {
          currentUserName: newChat.participants[currentUserId].name,
          otherUserName: newChat.participants[otherUserId].name
        });
        
        if (!newChat.participants[currentUserId].name || newChat.participants[currentUserId].name === 'undefined') {
          console.log('Fixing undefined current user name');
          newChat.participants[currentUserId].name = 'User';
        }
        if (!newChat.participants[otherUserId].name || newChat.participants[otherUserId].name === 'undefined') {
          console.log('Fixing undefined other user name');
          newChat.participants[otherUserId].name = 'Unknown User';
        }

        console.log('New chat document (validated):', newChat);
        console.log('Final participant names:', {
          currentUserName: newChat.participants[currentUserId].name,
          otherUserName: newChat.participants[otherUserId].name
        });
        const docRef = await addDoc(collection(db, 'chats'), newChat);
        console.log('Created new chat:', docRef.id);
        setChatId(docRef.id);
      }
    } catch (error) {
      console.error('Error creating/loading chat:', error);
    }
  };

  const loadMessages = (chatId: string) => {
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      
      setMessages(messagesData);
      
      // Mark messages as read
      const unreadMessages = messagesData.filter(
        msg => !msg.read && msg.senderId !== currentUserId
      );
      
      if (unreadMessages.length > 0) {
        markMessagesAsRead(unreadMessages, chatId);
      }
    });

    // Store the unsubscribe function
    unsubscribeMessagesRef.current = unsubscribe;
    return unsubscribe;
  };

  const markMessagesAsRead = async (unreadMessages: Message[], chatId: string) => {
    const batch = [];
    
    for (const msg of unreadMessages) {
      const messageRef = doc(db, 'chats', chatId, 'messages', msg.id);
      batch.push(updateDoc(messageRef, { read: true }));
    }
    
    // Update unread count in chat document
    const chatRef = doc(db, 'chats', chatId);
    batch.push(
      updateDoc(chatRef, {
        unreadCount: 0
      })
    );
    
    await Promise.all(batch);
  };

  const handleSend = async () => {
    if (!message.trim() || !chatId || !currentUserId) return;

    try {
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      const chatRef = doc(db, 'chats', chatId);
      
      // Add new message
      await addDoc(messagesRef, {
        text: message.trim(),
        senderId: currentUserId,
        timestamp: serverTimestamp(),
        read: false,
        isOfficialRequest: isOfficialRequest
      });
      
      // Update chat's last message info
      await updateDoc(chatRef, {
        lastMessage: message.trim(),
        lastMessageTime: serverTimestamp(),
        [`unreadCount.${currentUserId}`]: 0,
        [`unreadCount.${otherUserId}`]: 1, // Increment unread for other user
        hasOfficialRequest: isOfficialRequest || false
      });
      
      setMessage('');
      setIsOfficialRequest(false);
                // Show complete button after official request is sent (only for requester)
      if (isOfficialRequest && isRequester) {
        // Don't show complete button yet - wait for acceptance
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleOfficialRequest = async (requestData: any) => {
    console.log('Official Request Started:', { requestData, currentUserId, otherUserId, chatId });
    
    // Check if user should be requester
    const shouldBeRequester = !requestId || currentUserId === requestData?.ownerUid;
    
    // Allow request if user should be requester
    if (!shouldBeRequester) {
      console.log('Non-requester trying to send official request');
      Alert.alert('Error', 'Only the original requester can send official requests.');
      return;
    }

    // Set as requester if not already
    if (!isRequester) {
      setIsRequester(true);
    }

    setIsOfficialRequest(true);
    setRequestStatus('pending'); // Start as pending
    const officialMessage = `Official Request: ${requestData.title}\n\n${requestData.description}`;
    setMessage(officialMessage);
    setShowRequestSticker(true);
    
    try {
      // Save the official request to the database
      if (currentUserId && otherUserId && chatId) {
        console.log('Creating new request document...');
        const requestDoc = {
          title: requestData.title,
          description: requestData.description,
          requesterId: currentUserId,
          requesterName: auth.currentUser?.displayName || 'User',
          helperId: otherUserId,
          helperName: otherUserName || 'Helper',
          chatId: chatId,
          category: 'General',
          urgency: 'medium' as const,
          location: 'Chat',
          type: 'official_chat_request' as RequestType,
          status: 'pending' as HelpRequestStatus,
          helpOffers: 1,
          isOfficialRequest: true,
          duration: requestData.duration || 24,
          createdAt: serverTimestamp(),
          requestSentAt: serverTimestamp(),
          expiresAt: serverTimestamp(),
        };

        // Save to requests collection
        const newRequestRef = await addDoc(collection(db, 'requests'), requestDoc);
        const newRequestId = newRequestRef.id;
        
        console.log('New request created:', { newRequestId, chatId });
        
        // Store the new request data with ID
        setRequestData({ ...requestDoc, id: newRequestId });
        console.log('Request data stored in state');

        // Update the original post if it exists
        if (requestId) {
          const postRef = doc(postsCol, requestId);
          await updateDoc(postRef, {
            type: 'official_chat_request',
            isOfficialRequest: true,
            status: 'pending',
            helperId: otherUserId,
            helperName: otherUserName,
            chatId: chatId,
            updatedAt: serverTimestamp(),
          });
        }
      }

      // Immediately send the message
      await handleSend();
      
    } catch (error) {
      console.error('Error saving/sending official request:', error);
      Alert.alert('Error', 'Failed to send official request. Please try again.');
    }
  };

  const handleAcceptReject = async (action: 'accept' | 'reject', reason?: string) => {
    try {
      if (!chatId || !currentUserId || !otherUserId) return;

      // Find the request for this chat
      const requestsQuery = query(
        collection(db, 'requests'),
        where('chatId', '==', chatId),
        where('status', '==', 'pending')
      );
      
      const querySnapshot = await getDocs(requestsQuery);
      if (querySnapshot.empty) return;

      const requestDoc = querySnapshot.docs[0];
      const requestData = requestDoc.data() as HelpRequest;

      // Check if user can accept/reject
      if (action === 'accept' && !canUserAcceptRequest(requestData, currentUserId)) {
        Alert.alert('Error', 'You cannot accept this request.');
        return;
      }

      if (action === 'accept') {
        console.log('Attempting to accept request:', { requestDoc: requestDoc.id, currentUserId });
        
        try {
          // Update request status to accepted (ongoing)
          const updateData = {
            status: 'ongoing',
            acceptedAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          console.log('Updating request with data:', updateData);
          
          await updateDoc(requestDoc.ref, updateData);
          console.log('Request status updated successfully');
        } catch (error) {
          console.error('Error updating request status:', error);
          console.error('Error details:', {
            code: error.code,
            message: error.message,
            requestId: requestDoc.id,
            currentUserId: currentUserId
          });
          Alert.alert('Error', `Failed to accept request: ${error.message}`);
          return;
        }

        // Update original post if it exists (optional - don't fail if this fails)
        if (requestData.chatId) {
          try {
            const postsQuery = query(
              postsCol,
              where('chatId', '==', requestData.chatId)
            );
            const postSnapshot = await getDocs(postsQuery);
            if (!postSnapshot.empty) {
              await updateDoc(postSnapshot.docs[0].ref, {
                status: 'ongoing',
                helperId: currentUserId,
                helperName: auth.currentUser?.displayName,
                updatedAt: serverTimestamp(),
              });
              console.log('Post status updated successfully');
            }
          } catch (postError) {
            console.warn('Warning: Could not update post status (non-critical):', postError);
            // Don't fail the whole operation if post update fails
          }
        }

        try {
          // Send acceptance message
          const messagesRef = collection(db, 'chats', chatId, 'messages');
          await addDoc(messagesRef, {
            text: 'Request accepted! I\'m ready to help you with your request.',
            senderId: currentUserId,
            timestamp: serverTimestamp(),
            read: false,
            isSystemMessage: true
          });
          console.log('Acceptance message sent successfully');
        } catch (messageError) {
          console.error('Error sending acceptance message:', messageError);
          // Continue anyway since the main request was accepted
        }

        setRequestStatus('ongoing');
        // Only show complete button for the requester
        if (isRequester) {
          setShowCompleteButton(true);
        }
        
      } else if (action === 'reject') {
        console.log('Attempting to reject request:', { requestDoc: requestDoc.id, currentUserId, reason });
        
        try {
          // Update request status to rejected
          const updateData = {
            status: 'rejected',
            rejectedAt: serverTimestamp(),
            rejectedBy: currentUserId,
            rejectionReason: reason,
            updatedAt: serverTimestamp(),
          };
          console.log('Updating request with data:', updateData);
          
          await updateDoc(requestDoc.ref, updateData);
          console.log('Request rejected successfully');
        } catch (error) {
          console.error('Error rejecting request:', error);
          console.error('Error details:', {
            code: error.code,
            message: error.message,
            requestId: requestDoc.id,
            currentUserId: currentUserId
          });
          Alert.alert('Error', `Failed to reject request: ${error.message}`);
          return;
        }

        // Update original post if it exists (optional - don't fail if this fails)
        if (requestData.chatId) {
          try {
            const postsQuery = query(
              postsCol,
              where('chatId', '==', requestData.chatId)
            );
            const postSnapshot = await getDocs(postsQuery);
            if (!postSnapshot.empty) {
              await updateDoc(postSnapshot.docs[0].ref, {
                status: 'open', // Reset to open so others can help
                helperId: null,
                helperName: null,
                updatedAt: serverTimestamp(),
              });
              console.log('Post status reset to open successfully');
            }
          } catch (postError) {
            console.warn('Warning: Could not update post status (non-critical):', postError);
            // Don't fail the whole operation if post update fails
          }
        }

        try {
          // Send rejection message
          const messagesRef = collection(db, 'chats', chatId, 'messages');
          await addDoc(messagesRef, {
            text: `Request declined. Reason: ${reason}`,
            senderId: currentUserId,
            timestamp: serverTimestamp(),
            read: false,
            isSystemMessage: true
          });
          console.log('Rejection message sent successfully');
        } catch (messageError) {
          console.error('Error sending rejection message:', messageError);
          // Continue anyway since the main request was rejected
        }

        setRequestStatus('rejected');
        setShowCompleteButton(false);
        setIsCompleted(true);
      }

    } catch (error) {
      console.error('Error handling accept/reject:', error);
      Alert.alert('Error', 'Failed to process request. Please try again.');
    }
  };

  const handleCompleteRequest = async (ratingData: any) => {
    try {
      if (!chatId || !currentUserId || !otherUserId) return;

      // Find the request to complete
      const requestsQuery = query(
        collection(db, 'requests'),
        where('chatId', '==', chatId),
        where('status', 'in', ['ongoing'])
      );
      
      const querySnapshot = await getDocs(requestsQuery);
      if (querySnapshot.empty) return;

      const requestDoc = querySnapshot.docs[0];
      const requestData = requestDoc.data() as HelpRequest;

      // Check if user can complete
      if (!canUserCompleteRequest(requestData, currentUserId)) {
        Alert.alert('Error', 'Only the original requester can complete the request.');
        return;
      }

      // Send completion message
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      await addDoc(messagesRef, {
        text: `Request completed! Thank you for your help.\n\nRating: ${ratingData.rating}/5`,
        senderId: currentUserId,
        timestamp: serverTimestamp(),
        read: false,
        isSystemMessage: true
      });

      // Prepare review data for rating service
      const reviewData: ReviewData = {
        rating: ratingData.rating,
        comment: ratingData.feedback || '',
        tags: ratingData.tags || [],
        reviewerName: auth.currentUser?.displayName || 'User',
        reviewerUid: currentUserId,
        revieweeName: otherUserName || 'Helper',
        revieweeUid: otherUserId,
        requestTitle: requestTitle || 'Help Request',
        requestId: requestId || '',
        chatId: chatId,
        createdAt: serverTimestamp()
      };

      // Save review and update user profiles using the rating service
      await saveReviewAndUpdateProfiles(reviewData);

      // Update request status to completed
      await updateDoc(requestDoc.ref, {
        status: 'completed',
        completedAt: serverTimestamp(),
        rating: ratingData.rating,
        feedback: ratingData.feedback,
        ratingTags: ratingData.tags || [],
        updatedAt: serverTimestamp(),
      });

      // Update original post if it exists
      if (requestData.chatId) {
        const postsQuery = query(
          postsCol,
          where('chatId', '==', requestData.chatId)
        );
        const postSnapshot = await getDocs(postsQuery);
        if (!postSnapshot.empty) {
          await updateDoc(postSnapshot.docs[0].ref, {
            status: 'completed',
            completedAt: serverTimestamp(),
            rating: ratingData.rating,
            feedback: ratingData.feedback,
            ratingTags: ratingData.tags || [],
            updatedAt: serverTimestamp(),
          });
        }
      }

      // Update chat status
      const chatRef = doc(db, 'chats', chatId);
      await updateDoc(chatRef, {
        isCompleted: true,
        completedAt: serverTimestamp()
      });

      setIsCompleted(true);
      setShowCompleteButton(false);
      setShowCompleteModal(false);
      
    } catch (error) {
      console.error('Error completing request:', error);
      Alert.alert('Error', 'Failed to complete request. Please try again.');
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isCurrentUser = item.senderId === currentUserId;
    const isOfficial = item.isOfficialRequest;
    const isSystem = (item as any).isSystemMessage;
    
    if (isSystem) {
      return (
        <View style={styles.systemMessageContainer}>
          <Text style={[styles.systemMessageText, { color: colors.text.secondary, backgroundColor: colors.background.secondary }]}>{item.text}</Text>
        </View>
      );
    }
    
    return (
      <View 
        style={[
          styles.messageBubble,
          isCurrentUser ? [styles.currentUserBubble, { backgroundColor: colors.primary }] : [styles.otherUserBubble, { backgroundColor: colors.surface.card }],
          isOfficial && [styles.officialRequestBubble, { borderColor: colors.primary }]
        ]}
      >
        {isOfficial && (
          <View style={[styles.officialBadge, { backgroundColor: colors.primary + '20' }]}>
            <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
            <Text style={[styles.officialBadgeText, { color: colors.primary }]}>Official Request</Text>
          </View>
        )}
        <Text style={[
          styles.messageText,
          isCurrentUser ? [styles.currentUserText, { color: colors.text.inverse }] : [styles.otherUserText, { color: colors.text.primary }],
          isOfficial && styles.officialRequestText
        ]}>
          {item.text}
        </Text>
        <Text style={[
          styles.timestamp,
          isCurrentUser ? [styles.currentUserTimestamp, { color: 'rgba(255,255,255,0.7)' }] : [styles.otherUserTimestamp, { color: colors.text.secondary }]
        ]}>
          {item.timestamp?.toDate?.().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.innerContainer}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <TouchableOpacity 
                style={[styles.backButton, { backgroundColor: colors.surface.card }]} 
                onPress={() => navigation.goBack()}
              >
                <Ionicons name="chevron-back" size={20} color={colors.primary} />
              </TouchableOpacity>
              
              <View style={styles.headerContent}>
                <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
                  {otherUserName || 'Chat'}
                </Text>
                {requestTitle && (
                  <Text style={[styles.headerSubtitle, { color: colors.text.secondary }]} numberOfLines={1}>
                    {requestTitle}
                  </Text>
                )}
                {requestStatus === 'pending' && (
                  <View style={[styles.requestStatusContainer, { backgroundColor: colors.warning + '20' }]}>
                    <Ionicons name="time" size={12} color={colors.warning} />
                    <Text style={[styles.requestStatusText, { color: colors.warning }]}>Pending Response</Text>
                  </View>
                )}
                {requestStatus === 'ongoing' && showCompleteButton && !isCompleted && (
                  <View style={[styles.requestStatusContainer, { backgroundColor: colors.success + '20' }]}>
                    <Ionicons name="checkmark-circle" size={12} color={colors.success} />
                    <Text style={[styles.requestStatusText, { color: colors.success }]}>Request Accepted</Text>
                  </View>
                )}
                {requestStatus === 'rejected' && (
                  <View style={[styles.requestStatusContainer, { backgroundColor: colors.error + '20' }]}>
                    <Ionicons name="close-circle" size={12} color={colors.error} />
                    <Text style={[styles.requestStatusText, { color: colors.error }]}>Request Declined</Text>
                  </View>
                )}
              </View>
              
              <HeaderEnvelopeButton
                onPress={() => {
                  // Check if user should be requester
                  const shouldBeRequester = !requestId || currentUserId === requestData?.ownerUid;
                  
                  // Set as requester if not already
                  if (!isRequester && shouldBeRequester) {
                    setIsRequester(true);
                  }
                  
                  // Show appropriate modal
                  if (requestStatus === 'ongoing' && showCompleteButton && !isCompleted && isRequester) {
                    setShowCompleteModal(true);
                  } else if (!isCompleted && !requestStatus && shouldBeRequester) {
                    setShowRequestModal(true);
                  }
                }}
                hasActiveRequest={requestStatus === 'ongoing' && showCompleteButton}
                isCompleted={isCompleted || requestStatus === 'rejected'}
                isPending={requestStatus === 'pending'}
                visible={true}
              />
            </View>

            {/* Messages List */}
            <View style={styles.messagesWrapper}>
              <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item.id}
                renderItem={renderMessage}
                contentContainerStyle={styles.messagesContainer}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
        
        {/* Input Section - Fixed at bottom */}
        <View style={[styles.inputWrapper, { borderTopColor: colors.border }]}>
          {/* Regular Message Input - Hide when completed */}
          {!isCompleted && (
            <View>
              <View style={[styles.messageInputContainer, { backgroundColor: colors.surface.card, borderColor: colors.border }]}>
                <TextInput
                  style={[styles.input, { color: colors.text.primary }]}
                  value={message}
                  onChangeText={setMessage}
                  placeholder="Type a message..."
                  placeholderTextColor={colors.text.placeholder}
                  multiline
                />
                <TouchableOpacity 
                  style={[styles.sendButton, message.trim() && { backgroundColor: colors.primary }]} 
                  onPress={handleSend}
                  disabled={!message.trim()}
                >
                  <Ionicons 
                    name="send" 
                    size={24} 
                    color={message.trim() ? colors.text.inverse : colors.text.secondary} 
                  />
                </TouchableOpacity>
              </View>
              
              {/* Accept/Reject Buttons for pending requests (visible to non-requester) */}
              {requestStatus === 'pending' &&
               !isCompleted &&
               !isRequester && (
                <AcceptRejectButton
                  onRequestAction={handleAcceptReject}
                  disabled={false}
                  visible={true}
                  userName={otherUserName || 'User'}
                  requestTitle={requestTitle || 'Help Request'}
                />
              )}
            </View>
          )}
          
          {/* Completed Status */}
          {isCompleted && (
            <View style={[styles.completedContainer, { borderTopColor: colors.border }]}>
              <Ionicons name="checkmark-circle" size={24} color={colors.success} />
              <Text style={[styles.completedText, { color: colors.success }]}>
                This request has been completed
              </Text>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* Request Sticker Animation */}
      <RequestSticker
        visible={showRequestSticker}
        onComplete={() => setShowRequestSticker(false)}
      />

      {/* Help Request Modal */}
      <HelpRequestButton
        onRequestSent={handleOfficialRequest}
        disabled={false}
        visible={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        recentRequest={recentRequest}
      />

      {/* Complete Request Modal */}
      <CompleteRequestButton
        onCompleteRequest={handleCompleteRequest}
        disabled={false}
        userName={otherUserName}
        visible={showCompleteModal}
        onClose={() => setShowCompleteModal(false)}
        requestId={requestId || ''}
        requestTitle={requestData?.title || 'Help Request'}
        helperId={otherUserId || ''}
        chatId={chatId || ''}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  innerContainer: {
    flex: 1,
  },
  messagesWrapper: {
    flex: 1,
  },
  inputWrapper: {
    borderTopWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
  },
  headerContent: {
    flex: 1,
    marginLeft: 8,
    marginRight: 8,
  },
  headerTitle: {
    ...typography.h3,
    textAlign: 'center',
  },
  headerSubtitle: {
    ...typography.caption,
    textAlign: 'center',
    marginTop: 2,
  },
  requestStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'center',
  },
  requestStatusText: {
    ...typography.caption,
    fontWeight: '600',
    fontSize: 11,
  },
  messagesContainer: {
    padding: 16,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  currentUserBubble: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  otherUserBubble: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    ...typography.body,
  },
  currentUserText: {
  },
  otherUserText: {
  },
  timestamp: {
    ...typography.caption,
    marginTop: 4,
    textAlign: 'right',
  },
  inputContainer: {
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    maxHeight: 120,
    marginRight: 8,
    ...typography.body,
  },
  sendButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  actionButtonsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  messageInputContainer: {
    flexDirection: 'row',
    padding: 8,
    borderTopWidth: 1,
  },
  completedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderTopWidth: 1,
    gap: 8,
  },
  completedText: {
    ...typography.body,
    fontWeight: '600',
  },
  systemMessageContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  systemMessageText: {
    ...typography.caption,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    textAlign: 'center',
  },
  officialRequestBubble: {
    borderWidth: 2,
  },
  officialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  officialBadgeText: {
    ...typography.caption,
    fontWeight: '600',
    fontSize: 11,
  },
  officialRequestText: {
    fontWeight: '700',
  },
  currentUserTimestamp: {
    ...typography.caption,
    marginTop: 4,
    textAlign: 'right',
  },
  otherUserTimestamp: {
    ...typography.caption,
    marginTop: 4,
    textAlign: 'right',
  },
});

export default ChatScreen;
