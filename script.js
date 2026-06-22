// Подключаем Firebase через надежный сервис jsDelivr, где нет проблем с CORS
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, addDoc, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

// КОПИРУЙТЕ ЭТИ ДАННЫЕ ИЗ КОНСОЛИ FIREBASE (Project Settings -> Web App)
const firebaseConfig = {
    apiKey: "AIzaSyCkO-4vOJs-cX8S0G1g4XcDlYWvuJfB4LU",
    authDomain: "timonikichats.firebaseapp.com",
    projectId: "timonikichats",
    storageBucket: "timonikichats.firebasestorage.app",
    messagingSenderId: "718992542002",
    appId: "1:718992542002:web:15d3d81253f8d8ce126f2b",
    measurementId: "G-RTJQ9R2R2X"
};

// Запускаем сервисы
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- КНОПКА РЕГИСТРАЦИИ ---
document.getElementById('register-btn').addEventListener('click', async () => {
    const nick = document.getElementById('username').value.trim().toLowerCase();
    const pass = document.getElementById('password').value;

    if (!nick || pass.length < 6) {
        return alert('Ник не должен быть пустым, а пароль должен быть от 6 символов!');
    }

    try {
        // 1. Проверяем в базе данных Firestore, занят ли ник
        const userDocRef = doc(db, "users", nick);
        const docSnap = await getDoc(userDocRef);

        if (docSnap.exists()) {
            return alert('Этот никнейм уже занят!');
        }

        // 2. Если ник свободен, создаем аккаунт в Authentication
        // Создаем фейковый email (nick@mychat.com), так как Firebase требует почту
        const fakeEmail = `${nick}@mychat.com`;
        await createUserWithEmailAndPassword(auth, fakeEmail, pass);

        // 3. Записываем ник в базу данных, чтобы его больше никто не занял
        await setDoc(userDocRef, { 
            username: nick, 
            createdAt: new Date() 
        });

        alert('Вы успешно зарегистрировались!');
        showChat();

    } catch (error) {
        console.error(error);
        alert('Ошибка при регистрации: ' + error.message);
    }
});

// --- КНОПКА ВХОДА ---
document.getElementById('login-btn').addEventListener('click', async () => {
    const nick = document.getElementById('username').value.trim().toLowerCase();
    const pass = document.getElementById('password').value;

    if (!nick || !pass) return alert('Заполните все поля!');

    try {
        const fakeEmail = `${nick}@mychat.com`;
        await signInWithEmailAndPassword(auth, fakeEmail, pass);
        
        alert('Вы успешно вошли!');
        showChat();
    } catch (error) {
        alert('Неверный ник или пароль!');
    }
});

function showChat() {
    document.getElementById('auth-block').style.display = 'none';
    document.getElementById('chat-block').style.display = 'flex';
}
// Глобальные переменные, чтобы код помнил, с кем мы сейчас общаемся
let currentChatPartner = ""; 
let unsubscribeMessages = null; // Функция для отключения от старого чата

// --- ОБНОВЛЕННЫЙ ПОИСК ЛЮДЕЙ ---
document.getElementById('search-btn').addEventListener('click', async () => {
    const searchName = document.getElementById('search-user').value.trim().toLowerCase();
    const resultsDiv = document.getElementById('search-results');
    
    resultsDiv.innerHTML = 'Идет поиск...';

    if (!searchName) {
        resultsDiv.innerHTML = 'Введите ник!';
        return;
    }

    // Проверяем, чтобы пользователь не искал сам себя
    const myNick = auth.currentUser.email.split('@')[0];
    if (searchName === myNick) {
        resultsDiv.innerHTML = 'Вы не можете писать самому себе!';
        return;
    }

    try {
        const userDocRef = doc(db, "users", searchName);
        const docSnap = await getDoc(userDocRef);

        if (docSnap.exists()) {
            resultsDiv.innerHTML = `
                <div class="user-item">
                    <span>Найдено: <b>${searchName}</b></span>
                    <button id="start-chat-btn">Написать</button>
                </div>
            `;
            
            // Нажатие на кнопку «Написать» теперь запускает чат!
            document.getElementById('start-chat-btn').addEventListener('click', () => {
                openChatWith(searchName);
            });

        } else {
            resultsDiv.innerHTML = 'Пользователь не найден';
        }

    } catch (error) {
        console.error(error);
        resultsDiv.innerHTML = 'Ошибка: ' + error.message;
    }
});

// --- ФУНКЦИЯ ОТКРЫТИЯ ЧАТА С ПОЛЬЗОВАТЕЛЕМ ---
function openChatWith(partnerNick) {
    currentChatPartner = partnerNick;
    
    // Меняем заголовок чата, чтобы видеть, кому пишем
    document.getElementById('messages').innerHTML = `<div style="text-align:center; color:gray;">Чат с пользователем <b>${partnerNick}</b> открыт</div>`;
    
    // Слушаем сообщения для этого чата
    listenForMessages();
}

// --- ОТПРАВКА СООБЩЕНИЯ В FIREBASE ---
document.getElementById('send-btn').addEventListener('click', async () => {
    const msgText = document.getElementById('msg-input').value.trim();
    if (!msgText || !currentChatPartner) return; // Если текст пустой или собеседник не выбран

    // Узнаем наш собственный ник из почты аккаунта
    const myNick = auth.currentUser.email.split('@')[0];

    // Создаем уникальный ID комнаты (чтобы у Никиты и Тимура чат был в одной папке)
    // Сортируем ники по алфавиту: "nikita_timur" всегда будет одинаковым для обоих
    const chatId = [myNick, currentChatPartner].sort().join('_');

    try {
        // Сохраняем сообщение в Firebase в коллекцию "chats -> ID_комнаты -> messages"
        await addDoc(collection(db, "chats", chatId, "messages"), {
            sender: myNick,
            text: msgText,
            createdAt: new Date()
        });

        // Очищаем поле ввода
        document.getElementById('msg-input').value = '';
    } catch (error) {
        alert('Не удалось отправить сообщение: ' + error.message);
    }
});

// --- ПОЛУЧЕНИЕ СООБЩЕНИЙ В РЕАЛЬНОМ ВРЕМЕНИ ---
function listenForMessages() {
    // Если мы уже были подключены к какому-то чату — отключаемся от него
    if (unsubscribeMessages) unsubscribeMessages();

    const myNick = auth.currentUser.email.split('@')[0];
    const chatId = [myNick, currentChatPartner].sort().join('_');

    // Делаем запрос в Firebase и сортируем сообщения по времени отправки
    const messagesQuery = query(
        collection(db, "chats", chatId, "messages"),
        orderBy("createdAt", "asc")
    );

    // onSnapshot автоматически обновляет экран, как только в Firebase падает новое сообщение
    unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
        const messagesBox = document.getElementById('messages');
        messagesBox.innerHTML = ''; // Очищаем экран перед выводом списка

        snapshot.forEach((messageDoc) => {
            const msgData = messageDoc.data();
            
            // Проверяем, кто отправил сообщение — мы или собеседник
            const isMyMsg = msgData.sender === myNick;

            // Создаем визуальный блок сообщения
            const msgHtml = `
                <div class="message ${isMyMsg ? 'my-msg' : ''}">
                    <b>${msgData.sender}:</b> ${msgData.text}
                </div>
            `;
            messagesBox.insertAdjacentHTML('beforeend', msgHtml);
        });

        // Прокручиваем чат в самый вниз к последнему сообщению
        messagesBox.scrollTop = messagesBox.scrollHeight;
    });
}

