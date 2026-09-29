import { API_URL } from "./config.js";
import { io } from "socket.io-client";


const socket = io(API_URL || undefined, { // undefined = connect to the current origin (dev proxy)
    withCredentials: true
});

export default socket;
