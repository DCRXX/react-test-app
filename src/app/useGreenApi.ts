'use client'

import React, { FormEvent, useEffect, useRef, useState } from 'react';
import { normalizePhone, upsertChat } from './utils/phone';

const API_URL = 'https://4100.api.green-api.com';

// Типы 
interface Chat {
  id: string
  phone: string
  name?: string
}
interface Message {
  text: string;
  isMine: boolean;
}

interface Creds {
  idInstance: string;
  apiToken: string;
}

export default function chatLogic() {
  // Модалки
  const [openModalcontact, setModelOpenContact] = useState(false)
  const [openModelRegist, setModelOpenRegist] = useState(false)

  // Авторизация
  const [idInstance, setIdInstance] = useState('')
  const [apiToken, setApiToken] = useState('')
  const [auth, setAuth] = useState<Creds | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('green-api-tg');
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  })
  const [authError, setAuthError] = useState('')

  // Сообщения
  const [chats, setChats] = useState<Chat[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('chats');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  })
  const [activeChats, setActiveChats] = useState<string | null>(null)
  const [message, setMessage] = useState<Record<string, Message[]>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('message');
      return saved ? JSON.parse(saved) : {};
    }
    return {};
  });
  const [text, setText] = useState('')

  // Телефон
  const [phone, setPhone] = useState('')

  // URL
  const getURL = (method: string): string => `${API_URL}/waInstance${auth?.idInstance}/${method}/${auth?.apiToken}`



  // Последнее сообщение
  const getLastMessage = (phoneKey: string): string => {
    const msgs = message[phoneKey];
    if (!msgs || msgs.length === 0) return '';
    const last = msgs[msgs.length - 1].text;
    return last.length > 35 ? last.slice(0, 35) + '…' : last;
  };

  // Сохранение в локальную память
  useEffect(() => {
    if (message) localStorage.setItem('message', JSON.stringify(message));
  }, [message]);

  useEffect(() => {
    if (chats) localStorage.setItem('chats', JSON.stringify(chats));
  }, [chats]);



  //Отправка сообщений
  const handelSend = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()
    if (!text.trim() || !activeChats || !auth) return

    const chat = chats.find((c) => c.phone === activeChats)
    if (!chat) return

    try {
      const res = await fetch(getURL('sendMessage'), {
        method: 'POST',
        headers: { 'Content-type': 'application/json' },
        body: JSON.stringify({ chatId: chat.id, message: text })
      })

      if (!res.ok) return

      setMessage((prev) => ({
        ...prev,
        [activeChats]: [...(prev[activeChats] || []), { text, isMine: true }]
      }))
      setText('')
    } catch (err) {
      console.error('Ошибка отправки:', err)
    }
  }



  // Удалить чат
  const handelDeleteChat = (): void => {
    if (!activeChats) return;
    if (!confirm('Удалить этот чат?')) return;

    setChats((prev) => prev.filter((c) => c.phone !== activeChats));

    setMessage((prev) => {
      const next = { ...prev };
      delete next[activeChats];
      return next;
    });
    setActiveChats(null);
  };

  // Получение сообщений
  const receiving = useRef(false)

  useEffect(() => {
    if (!auth) return

    const poll = async () => {
      if (receiving.current) return
      receiving.current = true

      try {
        const res = await fetch(getURL('receiveNotification'))
        if (!res.ok) return

        const note = await res.json()

        if (!note) return

        const body = note.body
        const isIncoming = body?.typeWebhook === 'incomingMessageReceived'
        const isOutgoing = body?.typeWebhook === 'outgoingMessageReceived'

        if (
          (isIncoming || isOutgoing) &&
          body.messageData?.typeMessage === 'textMessage'
        ) {
          const chatId = body.senderData?.chatId;
          const senderPhone = body.senderData?.senderPhoneNumber;
          const msg = body.messageData.textMessageData?.textMessage;
          const senderName = body.senderData?.senderName;

          if (chatId && msg) {
            const phoneKey = normalizePhone(String(senderPhone ?? chatId));

            setMessage((prev) => ({
              ...prev,
              [phoneKey]: [
                ...(prev[phoneKey] || []),
                { text: msg, isMine: isOutgoing },
              ],
            }));

            setChats((prev) =>
              upsertChat(prev, chatId, String(senderPhone ?? chatId), senderName)
            )
          }
        } else if (body?.typeWebhook) {
          console.log('НЕОБРАБОТАННЫЙ WEBHOOK', body.typeWebhook, body);
        }

        if (note.receiptId) {
          await fetch(`${getURL('deleteNotification')}/${note.receiptId}`, {
            method: 'DELETE',
          });
        }
      } catch (err) {
        console.error('Ошибка получения:', err);
      } finally {
        receiving.current = false
      }
    }

    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, [auth])



  // Авторизация
  const handelAuth = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()
    setAuthError('')
    try {
      const res = await fetch(`${API_URL}/waInstance${idInstance}/getStateInstance/${apiToken}`)

      if (!res.ok) {
        setAuthError('Неверный idInstance или apiToken')
        return
      }

      const creds = { idInstance, apiToken }
      localStorage.setItem('green-api-tg', JSON.stringify(creds))
      setAuth(creds)
      setModelOpenRegist(false)
    } catch {
      setAuthError('Ошибка сети. Попробуйте еще раз')
    }
    console.log('успешная авторизация')
  }



  // Добавление контакта
  const handelAddContact = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()
    const phoneNumber = normalizePhone(phone)
    const chatId = `${phoneNumber}@c.us`

    let name = phoneNumber
    try {
      const res = await fetch(getURL('getContactInfo'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId })
      })
      const data = await res.json()
      if (data.name) name = data.name
    } catch { }

    setChats((prev) => upsertChat(prev, chatId, phoneNumber, name))
    setActiveChats(phoneNumber);
    setPhone('');
    setModelOpenContact(false);
  }

  return {
    // Состояния
    auth,
    authError,
    chats,
    message,
    activeChats,

    // Сеттеры для UI-инпутов
    idInstance, setIdInstance,
    apiToken, setApiToken,
    setActiveChats,

    // Действия
    handelAuth,
    handelSend,
    handelAddContact,
    handelDeleteChat,
    getLastMessage,

    // Модалки
    setModelOpenRegist,
    setModelOpenContact,
    openModalcontact,
    openModelRegist,

    // Сообщение чата
    text,
    setText,

    // Телефон
    phone,
    setPhone
  }
}