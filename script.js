// Подключаем Firebase через надежный сервис jsDelivr, где нет проблем с CORS
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

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
// --- ДОБАВЛЯЕМ НЕДОСТАЮЩИЙ РАЗДЕЛ ПОИСКА ЛЮДЕЙ ---
document.getElementById('search-btn').addEventListener('click', async () => {
    // 1. Берем ник, который вы ввели в поле поиска, убираем пробелы и делаем буквы маленькими
    const searchName = document.getElementById('search-user').value.trim().toLowerCase();
    const resultsDiv = document.getElementById('search-results');
    
    // Пишем временный статус, чтобы вы видели, что кнопка среагировала
    resultsDiv.innerHTML = 'Идет поиск...';

    if (!searchName) {
        resultsDiv.innerHTML = 'Пожалуйста, введите ник!';
        return;
    }

    try {
        // 2. Делаем запрос в Firebase Firestore в папку "users" к документу с этим ником
        const userDocRef = doc(db, "users", searchName);
        const docSnap = await getDoc(userDocRef);

        // 3. Проверяем, существует ли такой пользователь в базе данных
        if (docSnap.exists()) {
            // Если нашли человека в вашей папке users
            resultsDiv.innerHTML = `
                <div class="user-item">
                    <span>Найдено: <b>${searchName}</b></span>
                    <button id="start-chat-btn">Написать</button>
                </div>
            `;
            
            // Логика для кнопки "Написать" (пока просто уведомление)
            document.getElementById('start-chat-btn').addEventListener('click', () => {
                alert(`Открываем личный чат с пользователем: ${searchName}`);
            });

        } else {
            // Если в вашей коллекции users на Firebase нет такого имени
            resultsDiv.innerHTML = 'Пользователь не найден';
        }

    } catch (error) {
        // Если база данных заблокирует запрос, вы увидите ошибку прямо на экране
        console.error(error);
        resultsDiv.innerHTML = 'Ошибка поиска: ' + error.message;
    }
});

