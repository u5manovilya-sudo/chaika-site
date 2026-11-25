import React, { useState, useEffect } from 'react';
import './App.css';
import Header from './components/Header';
import Footer from './components/Footer';
import Main from './views/Main';
import Basket from './views/Basket';
import ModalBox from './components/ModalBox';
import Login from './components/Login';
import Registration from './components/Registration';

function App() {
    const [page, setPage] = useState('Main');
    const [modalBox, setModalBox] = useState('none');
    const [token, setToken] = useState('');

    // Подгружаем токен из localStorage при старте
    useEffect(() => {
        const saved = localStorage.getItem('token');
        if (saved) setToken(saved);
    }, []);

    const handleLogin = (newToken) => {
        localStorage.setItem('token', newToken);
        setToken(newToken);
        setModalBox('none');
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        setToken('');
        setPage('Main');
    };

    const pages = {
        Main: <Main token={token} />,
        Basket: <Basket token={token} />
    };

    const modalBoxes = {
        none: null,
        Login: (
            <ModalBox setModalBox={setModalBox}>
                <Login onLogin={handleLogin} />
            </ModalBox>
        ),
        Registration: (
            <ModalBox setModalBox={setModalBox}>
                <Registration />
            </ModalBox>
        )
    };

    return (
        <div className="App">
            <Header
                setPage={setPage}
                setModalBox={setModalBox}
                token={token}
                onLogout={handleLogout}
            />
            {pages[page]}
            {modalBoxes[modalBox]}
            <Footer />
        </div>
    );
}

export default App;