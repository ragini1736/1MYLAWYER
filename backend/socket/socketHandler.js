import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";

/**
 * socketHandler.js
 * ----------------
 * PURPOSE:
 *   Owns all Socket.io real-time event logic for the chat system.
 *   Called once from server.js: initSocket(io)
 *
 * WHY A SEPARATE FILE (not inside server.js)?
 *   server.js is already responsible for Express setup, middleware,
 *   routes, and startup. Adding 200+ lines of socket logic there
 *   violates Single Responsibility.
 *   This file has one job: handle all socket events.
 *
 * ARCHITECTURE:
 *   REST APIs  (chatController.js) → history, chat list, file upload
 *   Socket.io  (this file)         → real-time delivery, typing, read receipts
 *   Both share the same MongoDB collections (Message, Conversation).
 *
 * onlineUsers MAP:
 *   Key:   userId (string)
 *   Value: socketId (string)
 *   Purpose: maps a userId to their current socket connection.
 *   Used to check online status and deliver targeted events.
 *
 *   WHY Map not plain object?
 *     Map.has(), Map.get(), Map.delete() are O(1) and semantically clear.
 *     For high-frequency add/remove during connect/disconnect, Map is ideal.
 *
 *   LIMITATION: Works for single-server deployments.
 *   For multi-server (horizontal scaling), replace with Redis adapter:
 *     npm install @socket.io/redis-adapter
 *     io.adapter(createAdapter(pubClient, subClient))
 */

// In-memory store: userId (string) → socketId (string)
// Lives for the lifetime of the server process
const onlineUsers = new Map();

/**
 * initSocket
 * ----------
 * Initialises all Socket.io event listeners.
 * Called once from server.js after io is created.
 *
 * @param {import("socket.io").Server} io — the Socket.io server instance
 */
const initSocket = (io) => {

  // ─────────────────────────────────────────────
  // CONNECTION
  // ─────────────────────────────────────────────

  io.on("connection", (socket) => {
    /**
     * socket.user is set by socketAuthMiddleware — contains { id, role }
     * Every event handler below trusts socket.user.id as the authenticated userId.
     */
    const userId = socket.user.id;

    // Store this user's socket connection
    onlineUsers.set(userId, socket.id);

    console.log(`🟢 Socket connected: user ${userId} (socket ${socket.id})`);

    /**
     * Broadcast online status to ALL connected clients.
     * Frontend: update the green dot on the contact's avatar in the chat list.
     * socket.broadcast.emit sends to everyone EXCEPT this socket.
     */
    socket.broadcast.emit("user_online", { userId });

    /**
     * Send the full online users list back to the newly connected user.
     * Frontend uses this to show which contacts are currently online
     * when the chat page first loads.
     */
    socket.emit("online_users", { onlineUsers: Array.from(onlineUsers.keys()) });


    // ─────────────────────────────────────────────
    // JOIN CONVERSATION ROOM
    // ─────────────────────────────────────────────

    /**
     * join_conversation
     * -----------------
     * Client emits this when user opens a chat window.
     * Server adds the socket to a Socket.io room named after conversationId.
     *
     * WHY ROOMS?
     *   io.to(conversationId).emit(...) delivers to everyone in the room.
     *   Both participants join the same room — messages reach both instantly.
     *   Without rooms, you'd need to look up each participant's socketId manually.
     *
     * Payload: { conversationId }
     */
    socket.on("join_conversation", ({ conversationId }) => {
      if (!conversationId) return;

      // Join the room — socket receives all events emitted to this room
      socket.join(conversationId);

      console.log(`💬 User ${userId} joined conversation room: ${conversationId}`);
    });


    // ─────────────────────────────────────────────
    // LEAVE CONVERSATION ROOM
    // ─────────────────────────────────────────────

    /**
     * leave_conversation
     * ------------------
     * Client emits when user navigates away from a chat window.
     * Removes socket from the room — stops receiving events for this conversation.
     *
     * Payload: { conversationId }
     */
    socket.on("leave_conversation", ({ conversationId }) => {
      if (!conversationId) return;
      socket.leave(conversationId);
      console.log(`🚪 User ${userId} left conversation room: ${conversationId}`);
    });


    // ─────────────────────────────────────────────
    // SEND MESSAGE
    // ─────────────────────────────────────────────

    /**
     * send_message
     * ------------
     * Core event — handles real-time message delivery.
     *
     * Flow:
     *   1. Validate payload
     *   2. Save Message to MongoDB
     *   3. Update Conversation: lastMessage, lastMessageAt, unreadCounts
     *   4. Emit "receive_message" to the conversation room
     *      (both sender and receiver get it — sender sees it confirmed in their UI)
     *   5. If receiver is online but NOT in this room, emit directly to their socket
     *      (ensures delivery even if they haven't opened the chat window)
     *
     * Payload: { conversationId, receiverId, content, messageType?, fileUrl?, fileName?, fileSize? }
     *
     * Emits:
     *   "receive_message" → to conversationId room (both participants)
     *   "message_error"   → back to sender only on failure
     */
    socket.on("send_message", async ({
      conversationId,
      receiverId,
      content,
      messageType = "text",
      fileUrl = "",
      fileName = "",
      fileSize = 0,
    }) => {
      try {
        // Validate required fields
        if (!conversationId || !receiverId) {
          socket.emit("message_error", {
            message: "conversationId and receiverId are required",
          });
          return;
        }

        if (messageType === "text" && !content?.trim()) {
          socket.emit("message_error", {
            message: "Message content cannot be empty",
          });
          return;
        }

        // Save message to MongoDB
        const newMessage = await Message.create({
          conversationId,
          sender: userId,
          receiver: receiverId,
          content: content?.trim() || "",
          messageType,
          fileUrl,
          fileName,
          fileSize,
          isRead: false,
        });

        // Populate sender info for the response
        // Frontend needs sender name and profilePhoto to render the message bubble
        const populatedMessage = await Message.findById(newMessage._id)
          .populate("sender", "name profilePhoto")
          .populate("receiver", "name profilePhoto");

        // Determine preview text for the conversation list
        // Shows meaningful text for each message type
        let lastMessagePreview = content?.trim() || "";
        if (messageType === "image") lastMessagePreview = "📷 Image";
        if (messageType === "file") lastMessagePreview = `📎 ${fileName || "File"}`;

        /**
         * Update Conversation metadata atomically
         *
         * $inc on unreadCounts.receiverId:
         *   Increments the unread counter for the receiver.
         *   If the key doesn't exist yet, $inc creates it starting from 1.
         *   The dot notation "unreadCounts.{receiverId}" targets the Map entry.
         */
        await Conversation.findByIdAndUpdate(conversationId, {
          lastMessage: lastMessagePreview,
          lastMessageAt: new Date(),
          lastMessageSender: userId,
          [`unreadCounts.${receiverId}`]:
            // $inc would require a separate update — use direct set with current value
            // We fetch current count and increment, or default to 1
            (await Conversation.findById(conversationId))
              ?.unreadCounts?.get(receiverId) + 1 || 1,
        });

        /**
         * Emit to the conversation room
         * Both participants receive this if they've joined the room.
         * socket.to(room) broadcasts to everyone in the room EXCEPT the sender.
         * io.to(room) broadcasts to everyone INCLUDING the sender.
         * We use io.to() here so the sender's UI also confirms the message was saved.
         */
        io.to(conversationId).emit("receive_message", {
          message: populatedMessage,
          conversationId,
        });

        /**
         * Direct delivery fallback
         * If receiver is online but hasn't joined the conversation room
         * (chat list is open but this specific chat window is not),
         * emit directly to their socket so they see the notification badge.
         */
        const receiverSocketId = onlineUsers.get(receiverId);
        if (receiverSocketId && receiverSocketId !== socket.id) {
          io.to(receiverSocketId).emit("new_message_notification", {
            conversationId,
            senderId: userId,
            preview: lastMessagePreview,
          });
        }

      } catch (error) {
        console.error(`❌ send_message error: ${error.message}`);
        socket.emit("message_error", { message: "Failed to send message" });
      }
    });


    // ─────────────────────────────────────────────
    // TYPING INDICATORS
    // ─────────────────────────────────────────────

    /**
     * typing_start
     * ------------
     * Emitted when user starts typing (keydown event in frontend input).
     * Server forwards to the OTHER participant in the conversation.
     *
     * socket.to(conversationId) broadcasts to the room EXCLUDING the sender.
     * This is intentional — the sender doesn't need to see their own typing indicator.
     *
     * Payload: { conversationId, receiverId }
     *
     * Emits: "typing_indicator" → to conversationId room (excluding sender)
     *   { senderId, isTyping: true }
     */
    socket.on("typing_start", ({ conversationId, receiverId }) => {
      if (!conversationId) return;

      // Broadcast to room, excluding the sender
      socket.to(conversationId).emit("typing_indicator", {
        senderId: userId,
        receiverId,
        isTyping: true,
      });
    });

    /**
     * typing_stop
     * -----------
     * Emitted when user stops typing (blur or timeout in frontend).
     * Frontend should debounce this — emit after 1-2 seconds of no keystrokes.
     *
     * Payload: { conversationId, receiverId }
     *
     * Emits: "typing_indicator" → to conversationId room (excluding sender)
     *   { senderId, isTyping: false }
     */
    socket.on("typing_stop", ({ conversationId, receiverId }) => {
      if (!conversationId) return;

      socket.to(conversationId).emit("typing_indicator", {
        senderId: userId,
        receiverId,
        isTyping: false,
      });
    });


    // ─────────────────────────────────────────────
    // READ RECEIPTS
    // ─────────────────────────────────────────────

    /**
     * mark_read
     * ---------
     * Emitted when the receiver opens a conversation (marks all messages as read).
     *
     * Flow:
     *   1. Bulk-update all unread messages in this conversation where receiver = userId
     *   2. Reset unreadCounts for userId in the Conversation document
     *   3. Emit "messages_read" to the sender so their double-tick updates
     *
     * WHY updateMany (not a loop)?
     *   A conversation can have 50 unread messages.
     *   50 individual save() calls = 50 DB round-trips.
     *   updateMany = 1 DB round-trip. Always use bulk for bulk operations.
     *
     * Payload: { conversationId, senderId }
     *
     * Emits: "messages_read" → to sender's socket (if online)
     *   { conversationId, readBy: userId, readAt }
     */
    socket.on("mark_read", async ({ conversationId, senderId }) => {
      try {
        if (!conversationId || !senderId) return;

        const readAt = new Date();

        // Bulk update all unread messages in this conversation sent to this user
        await Message.updateMany(
          {
            conversationId,
            receiver: userId,   // Only mark messages addressed TO this user
            isRead: false,
          },
          {
            isRead: true,
            readAt,
          }
        );

        // Reset this user's unread count in the conversation to 0
        await Conversation.findByIdAndUpdate(conversationId, {
          [`unreadCounts.${userId}`]: 0,
        });

        /**
         * Notify the sender their messages were read.
         * Deliver directly to the sender's socket (not to the room)
         * because read receipts are private — only the sender should see them.
         */
        const senderSocketId = onlineUsers.get(senderId);
        if (senderSocketId) {
          io.to(senderSocketId).emit("messages_read", {
            conversationId,
            readBy: userId,
            readAt,
          });
        }

      } catch (error) {
        console.error(`❌ mark_read error: ${error.message}`);
      }
    });


    // ─────────────────────────────────────────────
    // DISCONNECT
    // ─────────────────────────────────────────────

    /**
     * disconnect
     * ----------
     * Fires automatically when a socket connection is lost.
     * Reasons: browser tab closed, network lost, server restart, explicit disconnect.
     *
     * Flow:
     *   1. Remove user from onlineUsers Map
     *   2. Broadcast "user_offline" to all remaining connected clients
     *
     * socket.broadcast.emit sends to everyone EXCEPT the disconnected socket
     * (which no longer exists — sending to it would error).
     */
    socket.on("disconnect", (reason) => {
      onlineUsers.delete(userId);

      console.log(`🔴 Socket disconnected: user ${userId} (reason: ${reason})`);

      // Notify all clients this user is now offline
      // Frontend: remove green dot from this user's avatar
      socket.broadcast.emit("user_offline", { userId });
    });

  }); // end io.on("connection")

}; // end initSocket

/**
 * getOnlineUsers
 * --------------
 * Exported utility — allows controllers or other modules to check
 * if a specific user is currently online.
 *
 * Usage in chatController:
 *   import { getOnlineUsers } from "../socket/socketHandler.js";
 *   const isOnline = getOnlineUsers().has(userId);
 */
export const getOnlineUsers = () => onlineUsers;

export default initSocket;
