import mongoose from "mongoose";

/**
 * Conversation.js
 * ---------------
 * PURPOSE:
 *   Represents a unique one-to-one chat thread between two users.
 *   Stores ONLY thread metadata — never message content.
 *
 * WHY SEPARATE FROM Message?
 *   The chat list needs: other person's name, last message preview,
 *   timestamp, and unread count — for EVERY conversation.
 *   If messages were embedded here, loading the chat list would
 *   fetch thousands of messages just to show a preview.
 *   Two collections: Conversation (metadata) + Message (content).
 *   Chat list query: Conversation.find({ participants: userId })
 *   Message history query: Message.find({ conversationId })
 *   This is the standard WhatsApp / Telegram architecture.
 *
 * DUPLICATE PREVENTION:
 *   The compound unique index on participants ensures only ONE
 *   conversation can exist between any two users.
 *   findOrCreate pattern: check first, create only if not found.
 */
const conversationSchema = new mongoose.Schema(
  {
    /**
     * participants — the two users in this conversation
     *
     * Always exactly 2 ObjectIds.
     * The unique compound index prevents duplicate conversations
     * between the same pair of users.
     *
     * WHY ARRAY and not two separate fields (user1, user2)?
     *   Array + $all query is cleaner:
     *     Conversation.findOne({ participants: { $all: [userA, userB] } })
     *   Two separate fields would require checking both orderings:
     *     WHERE (user1=A AND user2=B) OR (user1=B AND user2=A)
     */
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],

    /**
     * lastMessage — preview text shown in the chat list
     *
     * Updated on every new message via findByIdAndUpdate.
     * Stored as plain string (not a reference) so the preview
     * survives even if the original message is deleted.
     * For file messages: "📎 Sent a file" or "🖼 Sent an image"
     */
    lastMessage: {
      type: String,
      default: "",
    },

    /**
     * lastMessageAt — timestamp of the most recent message
     *
     * Used to sort the chat list by recency (most recent at top).
     * Separate from updatedAt because updatedAt changes on any
     * field update — lastMessageAt only changes when a message is sent.
     */
    lastMessageAt: {
      type: Date,
      default: null,
    },

    /**
     * lastMessageSender — who sent the last message
     *
     * Frontend uses this to show "You: Hello" vs "Rahul: Hello"
     * by comparing lastMessageSender with the logged-in user's ID.
     */
    lastMessageSender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    /**
     * unreadCounts — per-user unread message counter
     *
     * WHY Map and not a fixed schema field?
     *   Keys are dynamic (user IDs change per conversation).
     *   Map<userId, count> is the correct MongoDB type for dynamic keys.
     *
     * Usage:
     *   When User A sends to User B:
     *     unreadCounts.set(userB._id.toString(), current + 1)
     *   When User B opens the chat:
     *     unreadCounts.set(userB._id.toString(), 0)
     *
     * Frontend reads: unreadCounts.get(myUserId) > 0 → show badge
     */
    unreadCounts: {
      type: Map,
      of: Number,
      default: {},
    },

    /**
     * isActive — soft-disable flag
     *
     * false = conversation is hidden (blocked or archived).
     * Preserves message history while hiding the thread from lists.
     */
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// ─────────────────────────────────────────────
// INDEXES
// ─────────────────────────────────────────────

/**
 * Compound unique index on participants array.
 *
 * WHAT IT DOES:
 *   Guarantees only one conversation exists between any two users.
 *   findOneAndUpdate with { participants: { $all: [A, B] } } either
 *   finds the existing one or creates a new one — never duplicates.
 *
 * WHY NOT unique: true on the field itself?
 *   unique on an array field in Mongoose checks each element uniquely,
 *   not the combination. A compound index on the whole array is correct.
 */
conversationSchema.index({ participants: 1 });

/**
 * Sort index for chat list.
 * GET /api/chat/conversations sorts by lastMessageAt descending.
 * This index makes that sort fast even with thousands of conversations.
 */
conversationSchema.index({ lastMessageAt: -1 });

const Conversation = mongoose.model("Conversation", conversationSchema);

export default Conversation;
