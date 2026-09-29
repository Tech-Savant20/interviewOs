import { API_URL } from "../config.js";
import React, { use, useEffect, useRef } from "react";
import socket from "../socket.js";
import {
  Box, List, ListItemButton, ListItemAvatar, ListItemText,
  Avatar, Typography, TextField, IconButton, Divider,
  Drawer, useMediaQuery, Badge,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import MenuIcon from "@mui/icons-material/Menu";


export default function Message({ selectedApplicant }) {
  const [selectedUser, setSelectedUser] = React.useState(selectedApplicant);
  const [input, setInput] = React.useState("");
  const [openDrawer, setOpenDrawer] = React.useState(false);
  const [users, setUsers] = React.useState([]);
  const [conversations, setConversations] = React.useState({});
  const [unread, setUnread] = React.useState({});
  const [myId, setMyId] = React.useState(null);
  const [error, setError] = React.useState("");

  const isMobile = useMediaQuery("(max-width:768px)");
  const bottomRef = useRef(null);
  const selectedUserRef = useRef(null);
  const myIdRef = useRef(null);

  useEffect(() => { selectedUserRef.current = selectedUser; }, [selectedUser]);
  useEffect(() => { myIdRef.current = myId; }, [myId]);


  const getChatMessages = async (userId) => {
    try {
      const response = await fetch(`${API_URL}/api/chat/${userId}`, {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();
      console.log("RAW data from backend:", data);

      if (data.success) {
        const normalized = (data.messages || []).map((msg) => ({
          senderId: String(msg.senderId),
          receiverId: String(msg.receiverId),
          text: msg.text,
        }));

        console.log("normalized messages:", normalized);

        setConversations((prev) => ({
          ...prev,
          [String(userId)]: normalized,
        }));
      }
    } catch (err) {
      console.log("Failed to fetch chat messages", err);
    }
  };

  useEffect(() => {
    if (selectedApplicant?.user_id) {
      setSelectedUser(selectedApplicant);
      getChatMessages(selectedApplicant.user_id);
    } else {
      return;
    }
  }, [selectedApplicant])


  // ✅ FIXED: handle all possible key names from /api/me
  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch(`${API_URL}/api/me`, { credentials: "include" });
      const data = await response.json();

      console.log("FULL /api/me response:", data); // remove after confirming

      // ✅ covers data.id, data.user_id, data.user.id, data.user.user_id
      const id = data.user_id || data.id || data.user?.id || data.user?.user_id;
      setMyId(String(id));

      if (!response.ok) setError(data.message || "Failed to fetch user data");
    };
    fetchData();
  }, []);

  // ✅ Fetch users
  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch(`${API_URL}/api/interviewer-inbox-users`, { credentials: "include" });
      const res = await response.json();
      if (res.success) {
        setUsers(res.users);
      } else {
        setError(res.message || "Failed to fetch users");
      }
    };
    fetchData();

  }, []);

  // ✅ Receive message
  useEffect(() => {
    if (!myId) return;

    const handler = (data) => {
      console.log("incoming:", data);

      if (String(data.senderId) === myIdRef.current) return;

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
    return () => socket.off("receive_message", handler);
  }, [myId]);

  // ✅ Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversations, selectedUser]);

  const currentChat = selectedUser
    ? conversations[String(selectedUser.user_id)] || []
    : [];

  // ✅ Send message
  const sendMessage = () => {
    if (!input.trim() || !selectedUser || !myId) return;

    try {
      fetch(`${API_URL}/api/save-message`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: selectedUser.user_id,
          text: input.trim(),
        }),
      });
    } catch (err) {
      console.log(err);
    }

    const msg = { senderId: String(myId), text: input.trim() };

    setConversations((prev) => ({
      ...prev,
      [String(selectedUser.user_id)]: [
        ...(prev[String(selectedUser.user_id)] || []),
        msg,
      ],
    }));

    socket.emit("send_message", {
      receiverId: String(selectedUser.user_id),
      text: input.trim(),
    });

    setInput("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const openChat = (user) => {
    setSelectedUser(user);
    setUnread((prev) => ({ ...prev, [String(user.user_id)]: 0 }));
    setOpenDrawer(false);
    getChatMessages(user.user_id);
  };

  const Contacts = (
    <Box sx={{ width: 300, height: "100%", display: "flex", flexDirection: "column" }}>
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" fontWeight="bold">Applicants</Typography>
      </Box>
      <Divider />
      <Box sx={{ flexGrow: 1, overflowY: "auto" }}>
        <List>
          {users.map((user) => (
            <ListItemButton
              key={user.user_id}
              selected={selectedUser?.user_id === user.user_id}
              onClick={() => openChat(user)}
            >
              <ListItemAvatar>
                <Badge
                  badgeContent={unread[String(user.user_id)] || 0}
                  color="error"
                  invisible={!unread[String(user.user_id)]}
                >
                  <Avatar>{user.username?.[0]}</Avatar>
                </Badge>
              </ListItemAvatar>
              <ListItemText
                primary={user.username}
                secondary={conversations[String(user.user_id)]?.at(-1)?.text || "No messages"}
              />
            </ListItemButton>
          ))}
        </List>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", height: "85vh" }}>
      {!isMobile && (
        <Box sx={{ width: 300, borderRight: "1px solid #ddd" }}>{Contacts}</Box>
      )}

      <Drawer open={openDrawer} onClose={() => setOpenDrawer(false)}>
        {Contacts}
      </Drawer>

      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <Box sx={{ p: 2, borderBottom: "1px solid #ddd", display: "flex", alignItems: "center", gap: 2 }}>
          {isMobile && (
            <IconButton onClick={() => setOpenDrawer(true)}><MenuIcon /></IconButton>
          )}
          {selectedUser ? (
            <>
              <Avatar>{selectedUser.username?.[0]}</Avatar>
              <Typography fontWeight="bold">{selectedUser.username}</Typography>
            </>
          ) : (
            <Typography color="text.secondary">Select a conversation</Typography>
          )}
        </Box>

        {/* Messages */}
        <Box sx={{ flexGrow: 1, p: 2, overflowY: "auto", backgroundColor: "#fafafa" }}>
          {currentChat.length === 0 && selectedUser && (
            <Typography color="text.secondary" sx={{ textAlign: "center", mt: 4 }}>
              No messages yet. Say hello! 👋
            </Typography>
          )}

          {currentChat.map((msg, i) => {
            const isMe = String(msg.senderId) === String(myId);

            console.log(`msg[${i}] senderId="${msg.senderId}" myId="${myId}" isMe=${isMe}`);

            return (
              <Box
                key={i}
                sx={{
                  display: "flex",
                  justifyContent: isMe ? "flex-end" : "flex-start",
                  mb: 1,
                }}
              >
                <Box
                  sx={{
                    bgcolor: isMe ? "#ef5350" : "#eee",
                    color: isMe ? "#fff" : "#000",
                    p: 1,
                    px: 1.5,
                    borderRadius: 2,
                    maxWidth: "60%",
                    wordBreak: "break-word",
                  }}
                >
                  {msg.text}
                </Box>
              </Box>
            );
          })}
          <div ref={bottomRef} />
        </Box>

        {/* Input */}
        <Box sx={{ p: 2, borderTop: "1px solid #ddd", display: "flex", gap: 1 }}>
          <TextField
            fullWidth
            placeholder={selectedUser ? "Type a message..." : "Select a user to chat"}
            value={input}
            disabled={!selectedUser}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <IconButton
            onClick={sendMessage}
            disabled={!selectedUser || !input.trim()}
            sx={{
              bgcolor: "#ef5350",
              color: "#fff",
              "&:hover": { bgcolor: "#d32f2f" },
              "&.Mui-disabled": { bgcolor: "#ccc", color: "#fff" },
            }}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
}
