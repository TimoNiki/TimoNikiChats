// Импортируем нужные функции из официального облака Google (Firebase)
import { initializeApp } from "https://gstatic.com";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://gstatic.com";
import { getFirestore, doc, getDoc, setDoc } from "https://gstatic.com";

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
