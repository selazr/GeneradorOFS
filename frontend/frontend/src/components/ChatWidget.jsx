import React, { useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import axios from 'axios';

const ChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [chats, setChats] = useState({});
  const [message, setMessage] = useState('');
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    axios
      .get('http://localhost:3000/usuarios/list', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => setUsers(res.data))
      .catch(err => console.error(err));
  }, []);

  const handleSend = () => {
    if (!message.trim() || !selectedUser) return;
    setChats(prev => {
      const msgs = prev[selectedUser.id] || [];
      return { ...prev, [selectedUser.id]: [...msgs, { sender: 'me', text: message }] };
    });
    setMessage('');
  };

  const messages = selectedUser ? chats[selectedUser.id] || [] : [];

  return (
    <>
      <button
        className="fixed bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg"
        onClick={() => {
          if (selectedUser) {
            setSelectedUser(null);
          } else {
            setOpen(prev => !prev);
          }
        }}
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {open && !selectedUser && (
        <div className="fixed bottom-20 right-4 bg-white w-64 rounded-lg shadow-lg overflow-hidden">
          {users.map(u => (
            <div
              key={u.id}
              className="flex items-center p-2 cursor-pointer hover:bg-gray-100"
              onClick={() => {
                setSelectedUser(u);
                setOpen(true);
              }}
            >
              <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center mr-2 overflow-hidden">
                {u.avatar ? (
                  <img src={`http://localhost:3000${u.avatar}`} alt={u.nombre} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm font-medium text-gray-700">{u.nombre.charAt(0)}</span>
                )}
              </div>
              <span className="text-gray-800">{u.nombre}</span>
            </div>
          ))}
        </div>
      )}

      {selectedUser && (
        <div className="fixed bottom-20 right-4 bg-white w-72 sm:w-80 h-96 rounded-lg shadow-lg flex flex-col">
          <div className="flex items-center border-b p-2">
            <button className="mr-2 text-sm text-gray-600" onClick={() => setSelectedUser(null)}>
              &#8592;
            </button>
            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center mr-2 overflow-hidden">
              {selectedUser.avatar ? (
                <img src={`http://localhost:3000${selectedUser.avatar}`} alt={selectedUser.nombre} className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-medium text-gray-700">{selectedUser.nombre.charAt(0)}</span>
              )}
            </div>
            <span className="text-gray-800 font-medium">{selectedUser.nombre}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.sender === 'me' ? 'justify-end' : ''}`}>
                <div className={`${m.sender === 'me' ? 'bg-blue-500 text-white' : 'bg-gray-200'} px-3 py-1 rounded-full text-sm`}>{m.text}</div>
              </div>
            ))}
          </div>
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSend();
            }}
            className="flex p-2 border-t"
          >
            <input
              className="flex-1 border rounded-l-full px-3 py-1 text-sm focus:outline-none"
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Escribe un mensaje"
            />
            <button
              type="submit"
              className="ml-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-full text-sm"
            >
              Enviar
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default ChatWidget;
