import React, { useState } from 'react';

function Login({ onLogin }) {
    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');

    function Log() {
        const data = { login, password };

        fetch('http://localhost:9001/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
            .then(res => res.json())
            .then(result => {
                console.log(result);
                if (result.token) {
                    onLogin(result.token);        // App сохранит в state + localStorage
                } else {
                    alert(result.message || 'Ошибка входа');
                }
            })
            .catch(err => console.error('Login error:', err));
    }

    return (
        <>
            <h1>Вход</h1>
            <input
                type="text"
                placeholder="Логин"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
            />
            <input
                type="password"
                placeholder="Пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            <button onClick={Log}>Войти</button>
        </>
    );
}

export default Login;