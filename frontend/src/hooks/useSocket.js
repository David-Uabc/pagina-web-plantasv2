import { useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";
import { getAccessToken } from "../api";

const BACKEND_URL = process.env.REACT_APP_API_URL || "https://riego-iot-backend.onrender.com";

let socketInstance = null;
let lifecycleBound = false;

function getSocket() {
  if (!socketInstance || socketInstance.disconnected) {
    socketInstance = io(BACKEND_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 2500,
      reconnectionAttempts: 8,
      autoConnect: true,
      auth: {
        token: getAccessToken() ? `Bearer ${getAccessToken()}` : "",
      },
    });
  }

  if (socketInstance && !lifecycleBound) {
    lifecycleBound = true;
    socketInstance.on("disconnect", () => {});
    socketInstance.on("connect_error", () => {});
  }

  return socketInstance;
}

export function useSocket({
  onPlantUpdate,
  onPlantDeleted,
  onDeviceHeartbeat,
  onValveCommand,
  onScheduleTriggered,
  onAlert,
} = {}) {
  const socketRef = useRef(null);
  const handlersRef = useRef({});

  handlersRef.current = {
    onPlantUpdate,
    onPlantDeleted,
    onDeviceHeartbeat,
    onValveCommand,
    onScheduleTriggered,
    onAlert,
  };

  useEffect(() => {
    const socket = getSocket();
    socket.auth = {
      token: getAccessToken() ? `Bearer ${getAccessToken()}` : "",
    };
    socketRef.current = socket;

    const handlers = {
      "plant:update": (data) => handlersRef.current.onPlantUpdate?.(data),
      "plant:deleted": (data) => handlersRef.current.onPlantDeleted?.(data),
      "plant:alert": (data) => handlersRef.current.onAlert?.(data),
      "device:heartbeat": (data) => handlersRef.current.onDeviceHeartbeat?.(data),
      "valve:command": (data) => handlersRef.current.onValveCommand?.(data),
      "schedule:triggered": (data) => handlersRef.current.onScheduleTriggered?.(data),
    };

    Object.entries(handlers).forEach(([event, fn]) => socket.on(event, fn));

    return () => {
      Object.entries(handlers).forEach(([event, fn]) => socket.off(event, fn));
    };
  }, []);

  const emit = useCallback((event, data) => {
    socketRef.current?.emit(event, data);
  }, []);

  return { socket: socketRef.current, emit };
}

export default useSocket;
