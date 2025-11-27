import React, { useEffect, useState, useRef, useMemo } from 'react';
import { MessageCircle, SendHorizonal, ArrowLeft, WifiOff } from 'lucide-react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { API_BASE_URL } from '../api';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles/ChatWidget.css';

const ChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [users, setUsers] = useState([]);
  const [myId, setMyId] = useState(null);
  const [unread, setUnread] = useState({});
  const [connectionError, setConnectionError] = useState(null);
  const messagesEndRef = useRef(null);

  const socketUrl = useMemo(() => {
    if (process.env.REACT_APP_SOCKET_URL) return process.env.REACT_APP_SOCKET_URL;
    if (API_BASE_URL?.startsWith('http')) return API_BASE_URL;
    return window.location.origin;
  }, []);

  const decodeToken = (token) => {
    try {
      const payload = token.split('.')[1];
      const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
      const decoded = atob(normalized);
      return JSON.parse(decoded);
    } catch (error) {
      console.error('No se pudo decodificar el token', error);
      return null;
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const payload = decodeToken(token);
    if (!payload?.id) return;
    setMyId(payload.id);

    axios
      .get(`${API_BASE_URL}/usuarios/list`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(res => setUsers(res.data))
      .catch(err => console.error(err));

    axios
      .get(`${API_BASE_URL}/conversaciones/unread`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(res => {
        const counts = {};
        res.data.forEach(r => {
          if (r.total > 0) counts[r.usuario_id] = true;
        });
        setUnread(counts);
      })
      .catch(err => console.error(err));

    const newSocket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      path: '/socket.io',
      reconnectionAttempts: 5,
    });
    setSocket(newSocket);

    const handleError = (err) => {
      console.error('Error de socket', err);
      setConnectionError('Sin conexión al chat');
    };

    newSocket.on('connect', () => setConnectionError(null));
    newSocket.on('connect_error', handleError);
    newSocket.on('error', handleError);

    return () => {
      newSocket.off('connect', handleError);
      newSocket.off('connect_error', handleError);
      newSocket.off('error', handleError);
      newSocket.disconnect();
    };
  }, [socketUrl]);

  useEffect(() => {
    if (!socket) return;

    const handler = msg => {
      if (msg.remitente_id === myId) {
        if (msg.conversacion_id === conversationId) {
          setMessages(prev => [...prev, msg]);
        }
        return;
      }
      if (msg.conversacion_id === conversationId) {
        setMessages(prev => [...prev, msg]);
      } else {
        setUnread(prev => ({ ...prev, [msg.remitente_id]: true }));
      }
    };

    socket.on('private message', handler);
    return () => socket.off('private message', handler);
  }, [socket, conversationId, myId]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const openConversation = async (user) => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.post(
        `${API_BASE_URL}/conversaciones`,
        { usuarioId: user.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setConversationId(res.data.id);
      setSelectedUser(user);
      setUnread(prev => ({ ...prev, [user.id]: false }));
      const resMsgs = await axios.get(
        `${API_BASE_URL}/conversaciones/${res.data.id}/mensajes`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages(resMsgs.data);
      await axios.put(
        `${API_BASE_URL}/conversaciones/${res.data.id}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleSend = () => {
    if (!socket || !message.trim() || !conversationId || !selectedUser) return;
    socket.emit('private message', {
      to: selectedUser.id,
      conversacionId: conversationId,
      mensaje: message,
    });
    setMessage('');
  };

  return (
    <>
      <button
        className="chat-launcher"
        onClick={() => {
          if (selectedUser) {
            setSelectedUser(null);
            setConversationId(null);
            setMessages([]);
          } else {
            setOpen(prev => !prev);
          }
        }}
      >
        <MessageCircle />
        {Object.values(unread).some(Boolean) && (
          <span className="notification-dot"></span>
        )}
      </button>

      {open && !selectedUser && (
        <div className="chat-panel">
          <div className="chat-panel__header">
            <div>
              <p className="chat-panel__title">Chat interno</p>
              <span className={`chat-status ${connectionError ? 'offline' : 'online'}`}>
                {connectionError ? 'Desconectado' : 'En línea'}
              </span>
            </div>
            {connectionError && <WifiOff size={18} className="text-danger" />}
          </div>
          <div className="chat-panel__body">
            {users.map(user => (
              <button
                key={user.id}
                className="chat-user"
                onClick={() => openConversation(user)}
              >
                <div className="chat-user__avatar">
                  {user.avatar ? (
                    <img src={`${API_BASE_URL}${user.avatar}`} alt={user.nombre} />
                  ) : (
                    <span>{user.nombre.charAt(0)}</span>
                  )}
                </div>
                <div className="chat-user__info">
                  <span className="chat-user__name">{user.nombre}</span>
                  <span className="chat-user__badge">Disponible</span>
                </div>
                {unread[user.id] && <span className="notification-dot"></span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedUser && (
        <div className="chat-conversation">
          <div className="chat-conversation__header">
            <button
              className="chat-icon-btn"
              onClick={() => {
                setSelectedUser(null);
                setConversationId(null);
                setMessages([]);
              }}
              aria-label="Volver"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="chat-conversation__user">
              <div className="chat-user__avatar">
                {selectedUser.avatar ? (
                  <img src={`${API_BASE_URL}${selectedUser.avatar}`} alt={selectedUser.nombre} />
                ) : (
                  <span>{selectedUser.nombre.charAt(0)}</span>
                )}
              </div>
              <div>
                <p className="chat-user__name mb-0">{selectedUser.nombre}</p>
                <small className="text-muted">Conversación segura</small>
              </div>
            </div>
          </div>
          <div className="chat-conversation__body">
            {messages.map((m, i) => (
              <div key={i} className={`chat-bubble-row ${m.remitente_id === myId ? 'me' : 'other'}`}>
                <div className={`chat-message ${m.remitente_id === myId ? 'me' : 'other'}`}>{m.mensaje}</div>
              </div>
            ))}
            <div ref={messagesEndRef}></div>
          </div>
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSend();
            }}
            className="chat-conversation__footer"
          >
            <input
              type="text"
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Escribe un mensaje..."
            />
            <button type="submit" className="chat-icon-btn primary" aria-label="Enviar mensaje">
              <SendHorizonal size={18} />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default ChatWidget;
