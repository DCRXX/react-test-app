'use client'
import React, { FormEvent, useEffect, useRef, useState } from 'react';
import './Home.css'
import delet from './public/delete.svg'
import user from './public/person.svg'
import close from './public/close.svg'
import attachFile from './public/attach_file.svg'
import mic from './public/mic.svg'
import mood from './public/mood.svg'
import userCircle from './public/account_circle.svg'
import useGreenApi from './useGreenApi';



export default function Home() {
  const {
    auth, authError, chats, message, activeChats,
    idInstance, setIdInstance, phone, setPhone,
    apiToken, setApiToken, text, setText,
    setActiveChats, getLastMessage,
    handelAuth, handelSend, handelAddContact, handelDeleteChat, setModelOpenRegist, setModelOpenContact, openModalcontact, openModelRegist
  } = useGreenApi();
  const activeChat = chats.find((c) => c.phone === activeChats) || null;



  return (
    <main>
      <header className="contactsPanel">
        <section className="searchBlock">
          <div className='user'>
            {auth ? (
              <img className='personImgCircle' src={userCircle.src}></img>
            ) : (
              <img className='personImg' src={user.src} onClick={() => setModelOpenRegist(true)} />
            )}
          </div>
          <input className="search"
            placeholder="Поиск"
          />
        </section>
        <div className='Chats'>
          {chats.map((c) => (
            <div
              key={c.phone}
              className={activeChats === c.phone ? 'chatItem active' : 'chatItem'}
              onClick={() => setActiveChats(c.phone)}
            >
              <div className='Avatar'><p>{(c.name || c.phone).charAt(0)}</p></div>
              <div className='NameContact'>
                <p>{c.name || c.phone}</p>
              </div>
              <div className='lastMessage'>
                <p>{getLastMessage(c.phone)}</p>
              </div>
            </div>
          ))}
        </div>
        <button className='addContact' onClick={() => setModelOpenContact(true)}>
          <p>Добавить контакт</p>
        </button>
      </header>
      {activeChats ? (
        <section className='chatWindow'>
          <header className='chatHeader'>
            <div className='Avatar'>
              <p>{(activeChat?.name || activeChat?.phone || '').charAt(0)}</p>
            </div>
            <div className='nameContact'>
                <p>{activeChat?.name || activeChat?.phone}</p>
            </div>
            <div className='close'>
              <img onClick={() => setActiveChats(null)} src={close.src} />
            </div>
            <button className='deleteChat' onClick={handelDeleteChat}>
              <img src={delet.src} />
            </button>
          </header>


          <section className='messages'>
            {(message[activeChats!] || []).map((m, i) => (
              <div key={i} className={m.isMine ? 'bubble mine' : 'bubble'}>
                <p>{m.text}</p>
              </div>
            ))}
          </section>


          <form className='messageForm' onSubmit={handelSend}>
            <img className='file' src={attachFile.src}></img>
            <input
              className='messageInput'
              placeholder='Сообщение'
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <img className='emogi' src={mood.src}></img>
            <button className='mic' type='submit'>
              <img src={mic.src}></img>
            </button>
          </form>
        </section>
      ) : (
        <div className='noChatSelected'>
          <p>Для авторизации нажмите на иконку пользователя</p>
          <p>Выберите или создайте чат, чтобы начать общение</p>
        </div>
      )}

      {openModelRegist && (
        <section className='Overley'>
          <div className='modalWindow'>
            <div className='headerModal'>
              <h1>Авторизация</h1>
              <img className='close' src={close.src} onClick={() => setModelOpenRegist(false)} />
            </div>
            <p className='description'>Пожалуйста введите данные от <span>GREEN-API</span></p>
            <form className='formRegistration' onSubmit={handelAuth}>
              <input className='idInstanse'
                placeholder='idInstanse'
                value={idInstance}
                onChange={(e) => setIdInstance(e.target.value)}
              />
              <input className='apiToken'
                placeholder='apiToken'
                value={apiToken}
                onChange={(e) => setApiToken(e.target.value)}
              />
              <button
                className='submittingForm'
                type='submit'

              >
                <p>Автозироваться</p>
              </button>
            </form>
          </div>
        </section>
      )}

      {openModalcontact && (
        <section className='Overley'>
          <div className='modalWindow'>
            <div className='headerModal'>
              <h1>Добавить контакт</h1>
              <img className='close' src={close.src} onClick={() => setModelOpenContact(false)} />
            </div>
            <p className='description'>Пожалуйста введите номер телефона нового контакта</p>
            <form className='FormAddContact' onSubmit={handelAddContact}>
              <input className='phoneNumber'
                placeholder='+7 999 999 99 99'
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <button
                className='submittingForm'
                type='submit'
              >
                <p>Добавить</p>
              </button>
            </form>
          </div>
        </section>
      )}
    </main>
  );
}
