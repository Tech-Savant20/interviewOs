import { API_URL } from "../config.js";
import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Typography,
  Avatar,
  TextField,
  IconButton,
  Divider,
  Paper,
  Badge,
} from "@mui/material";

import SendIcon from "@mui/icons-material/Send";
import MailIcon from "@mui/icons-material/Mail";
import socket from "../socket.js";

export default function StudentMessageInbox() {
  const [selectedUser, setSelectedUser] = useState(null);
  const [input, setInput] = useState("");
  const [totalInterviewrs, setTotalInterviewers] = useState([]);
  const [conversations, setConversations] = useState({});
  const [unread, setUnread] = useState({});
  const [myId, setMyId] = useState(null);

  const bottomRef = useRef(null);
  const selectedUserRef = useRef(null);
  const myIdRef = useRef(null);

  useEffect(() => {
    selectedUserRef.current = selectedUser;
  }, [selectedUser]);

  useEffect(() => {
    myIdRef.current = myId;
  }, [myId]);

  // ✅ FIX 1: Simplified normalizeMessage — matches exactly what backend/socket sends
  const normalizeMessage = (msg) => {
    return {
      senderId: String(msg.senderId || msg.sender_id),
      receiverId: String(msg.receiverId || msg.receiver_id),
      text: msg.text || msg.message || msg.content,
    };
  };

  const getChatMessages = async (userId) => {
    try {
      const res = await fetch(`${API_URL}/api/chat/${userId}`, {
        method: "GET",
        credentials: "include",
      });

      const data = await res.json();
      console.log("Chat messages 👉", data);

      if (data.success) {
        const normalized = (data.messages || []).map(normalizeMessage);

        setConversations((prev) => ({
          ...prev,
          [String(userId)]: normalized,
        }));
      }
    } catch (error) {
      console.log("Failed to fetch chat messages", error);
    }
  };

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await fetch(`${API_URL}/api/me`, {
          credentials: "include",
        });

        const data = await res.json();

        const id =
          data.user_id ||
          data.id ||
          data.user?.id ||
          data.user?.user_id;

        if (id) {
          setMyId(String(id));
          socket.emit("join", String(id));
        }
      } catch (error) {
        console.log("Failed to fetch current user", error);
      }
    };

    fetchMe();
  }, []);

  useEffect(() => {
    const fetchInterviewers = async () => {
      try {
        const res = await fetch(
          `${API_URL}/api/student-inbox-users`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        const data = await res.json();
        console.log("Interviewers for inbox 👉", data);

        if (data.success) {
          setTotalInterviewers(data.users || []);
        }
      } catch (error) {
        console.error("Error fetching interviewers:", error);
      }
    };

    fetchInterviewers();
  }, []);

  // ✅ FIX 2: Receive message handler — mirrors Message.jsx exactly
  useEffect(() => {
    if (!myId) return;

    const handler = (data) => {
      console.log("Incoming message 👉", data);

      // Ignore messages we sent ourselves
      if (String(data.senderId) === String(myIdRef.current)) return;

      const chatUserId = String(data.senderId);

      setConversations((prev) => ({
        ...prev,
        [chatUserId]: [
          ...(prev[chatUserId] || []),
          { senderId: chatUserId, text: data.text },
        ],
      }));

      if (
        !selectedUserRef.current ||
        String(selectedUserRef.current.user_id) !== chatUserId
      ) {
        setUnread((prev) => ({
          ...prev,
          [chatUserId]: (prev[chatUserId] || 0) + 1,
        }));
      }
    };

    socket.on("receive_message", handler);

    return () => {
      socket.off("receive_message", handler);
    };
  }, [myId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversations, selectedUser]);

  const openChat = (user) => {
    setSelectedUser(user);

    setUnread((prev) => ({
      ...prev,
      [String(user.user_id)]: 0,
    }));

    getChatMessages(user.user_id);
  };

  // ✅ FIX 3: sendMessage — fire socket immediately (don't await fetch first)
  // and include senderId in socket payload to match what the server expects
  const sendMessage = () => {
    if (!input.trim() || !selectedUser || !myId) return;

    const messageText = input.trim();
    const receiverId = String(selectedUser.user_id);

    const newMsg = {
      senderId: String(myId),
      receiverId,
      text: messageText,
    };

    // Optimistically add to local chat
    setConversations((prev) => ({
      ...prev,
      [receiverId]: [...(prev[receiverId] || []), newMsg],
    }));

    setInput("");

    // ✅ FIX 4: Emit socket FIRST (before await), so real-time is never delayed by fetch
    socket.emit("send_message", {
      senderId: String(myId),
      receiverId,
      text: messageText,
    });

    // Save to DB in background — don't block real-time on this
    fetch(`${API_URL}/api/save-message`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        receiverId,
        text: messageText,
      }),
    })
      .then((res) => res.json())
      .then((data) => console.log("Message saved 👉", data))
      .catch((error) => console.log("Send Message Error:", error));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const currentChat = selectedUser
    ? conversations[String(selectedUser.user_id)] || []
    : [];

  return (
    <Box sx={{ display: "flex", height: "90vh", backgroundColor: "#f5f7fb" }}>
      <Box
        sx={{
          width: "320px",
          backgroundColor: "#fff",
          borderRight: "1px solid #ddd",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box sx={{ p: 2, display: "flex", alignItems: "center", gap: 2 }}>
          <Badge
            badgeContent={Object.values(unread).reduce((a, b) => a + b, 0)}
            color="error"
          >
            <MailIcon sx={{ color: "#1976d2", fontSize: 32 }} />
          </Badge>

          <Typography variant="h6" fontWeight="bold">
            Inbox
          </Typography>
        </Box>

        <Divider />

        <Box sx={{ flexGrow: 1, overflowY: "auto" }}>
          {totalInterviewrs.map((user) => (
            <Box
              key={user.user_id}
              onClick={() => openChat(user)}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                padding: "14px 18px",
                cursor: "pointer",
                backgroundColor:
                  selectedUser?.user_id === user.user_id
                    ? "#eef4ff"
                    : "transparent",
                "&:hover": {
                  backgroundColor: "#f3f6ff",
                },
              }}
            >
              <Badge
                badgeContent={unread[String(user.user_id)] || 0}
                color="error"
                invisible={!unread[String(user.user_id)]}
              >
                <Avatar sx={{ bgcolor: "#1976d2" }}>
                  {user.username?.[0]}
                </Avatar>
              </Badge>

              <Box sx={{ flexGrow: 1 }}>
                <Typography fontWeight="bold">{user.username}</Typography>

                <Typography variant="body2" color="text.secondary" noWrap>
                  {conversations[String(user.user_id)]?.at(-1)?.text ||
                    "Click to open chat"}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>

      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderBottom: "1px solid #ddd",
            display: "flex",
            alignItems: "center",
            gap: 2,
            borderRadius: 0,
          }}
        >
          <Avatar sx={{ bgcolor: "#1976d2" }}>
            {selectedUser?.username?.[0] || "U"}
          </Avatar>

          <Box>
            <Typography fontWeight="bold">
              {selectedUser ? selectedUser.username : "Select a user"}
            </Typography>

            {selectedUser && (
              <Typography variant="body2" color="green">
                Online
              </Typography>
            )}
          </Box>
        </Paper>

        <Box
          sx={{
            flexGrow: 1,
            p: 3,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 1,
          }}
        >
          {!selectedUser && (
            <Typography color="text.secondary" sx={{ textAlign: "center", mt: 4 }}>
              Select an interviewer to start chat
            </Typography>
          )}

          {selectedUser && currentChat.length === 0 && (
            <Typography color="text.secondary" sx={{ textAlign: "center", mt: 4 }}>
              No messages yet
            </Typography>
          )}

          {currentChat.map((msg, index) => {
            const isMe = String(msg.senderId) === String(myId);

            return (
              <Box
                key={index}
                sx={{
                  display: "flex",
                  justifyContent: isMe ? "flex-end" : "flex-start",
                }}
              >
                <Box
                  sx={{
                    backgroundColor: isMe ? "#1976d2" : "#fff",
                    color: isMe ? "#fff" : "#000",
                    padding: "10px 16px",
                    borderRadius: "12px",
                    maxWidth: "60%",
                    wordBreak: "break-word",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  }}
                >
                  <Typography>{msg.text}</Typography>
                </Box>
              </Box>
            );
          })}

          <div ref={bottomRef} />
        </Box>

        <Box
          sx={{
            p: 2,
            borderTop: "1px solid #ddd",
            display: "flex",
            gap: 2,
            backgroundColor: "#fff",
          }}
        >
          <TextField
            fullWidth
            placeholder={selectedUser ? "Type your message..." : "Select a user first"}
            variant="outlined"
            size="small"
            value={input}
            disabled={!selectedUser}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />

          <IconButton
            onClick={sendMessage}
            disabled={!selectedUser || !input.trim()}
            sx={{
              backgroundColor: "#1976d2",
              color: "#fff",
              "&:hover": {
                backgroundColor: "#1565c0",
              },
              "&.Mui-disabled": {
                backgroundColor: "#ccc",
                color: "#fff",
              },
            }}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
}
