import React from 'react';
import './UserBox.css';

function UserBox({ setModalBox, token, onLogout }) {
    return (
        <div className="UserBox">
            {token ? (
                <button onClick={onLogout}>Выйти</button>
            ) : (
                <>
                    <button onClick={() => setModalBox('Login')}>Вход</button>
                    <button onClick={() => setModalBox('Registration')}>Регистрация</button>
                </>
            )}
        </div>
    );
}

export default UserBox;