import React, { useState, useEffect } from 'react';
import './Basket.css';
import ModalBox from '../components/ModalBox';

function Basket({ token }) {
    const [basket, setBasket] = useState([]);
    const [modal, setModal] = useState('none');
    const [orderStatus, setOrderStatus] = useState('');
    const [loading, setLoading] = useState(true);

    // Загрузка корзины
    useEffect(() => {
        if (!token) {
            setLoading(false);
            return;
        }
        fetch('http://localhost:9001/basket', {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => setBasket(data.products || []))
            .catch(err => console.error('Basket load error:', err))
            .finally(() => setLoading(false));
    }, [token]);

    // Удаление одной позиции
    const handleRemove = async (productId) => {
        try {
            const response = await fetch('http://localhost:9001/basket/remove', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ productId })
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Ошибка удаления');
            }
            // Обновляем локальный стейт: удаляем один экземпляр
            setBasket(prev => {
                const idx = prev.findIndex(p => p._id === productId);
                if (idx === -1) return prev;
                const copy = [...prev];
                copy.splice(idx, 1);
                return copy;
            });
        } catch (err) {
            console.error('Remove from basket error:', err);
            alert('Ошибка при удалении: ' + err.message);
        }
    };

    // Оформление заказа
    const handleOrder = async (formData) => {
        try {
            const response = await fetch('http://localhost:9001/order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });
            const data = await response.json();
            setOrderStatus(data.message);
            setModal('none');
            if (response.ok) setBasket([]);
        } catch (err) {
            console.error('Order error:', err);
            setModal('none');
            setOrderStatus('Ошибка при оформлении заказа');
        }
    };

    if (!token) {
        return (
            <div className="Basket">
                <h1>Корзина</h1>
                <p>Войдите, чтобы увидеть корзину</p>
            </div>
        );
    }

    if (loading) {
        return <div className="Basket"><h1>Загрузка...</h1></div>;
    }

    return (
        <div className="Basket">
            <h1>Корзина</h1>

            {orderStatus ? (
                <h2>{orderStatus}</h2>
            ) : (
                <>
                    {basket.length === 0 && <p>Корзина пуста</p>}

                    {basket.map(item => (
                        <div key={item._id} className="basket-item">
                            <div className="basket-item-info">
                                <h3>{item.header}</h3>
                                <p>{item.price} руб.</p>
                            </div>
                            <button
                                className="basket-remove"
                                onClick={() => handleRemove(item._id)}
                                title="Удалить из корзины"
                            >
                                Удалить
                            </button>
                        </div>
                    ))}

                    {basket.length > 0 && (
                        <button
                            className="basket-buy"
                            onClick={() => setModal('order')}
                        >
                            Купить
                        </button>
                    )}
                </>
            )}

            {modal === 'order' && (
                <ModalBox setModalBox={setModal}>
                    <OrderForm onSubmit={handleOrder} />
                </ModalBox>
            )}
        </div>
    );
}

const OrderForm = ({ onSubmit }) => {
    const [form, setForm] = useState({
        fullName: '',
        address: '',
        email: '',
        phone: ''
    });

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(form);
    };

    return (
        <form onSubmit={handleSubmit}>
            <h2>Оформление заказа</h2>
            <input name="fullName" type="text" placeholder="ФИО" value={form.fullName} onChange={handleChange} required />
            <input name="address" type="text" placeholder="Адрес" value={form.address} onChange={handleChange} required />
            <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
            <input name="phone" type="tel" placeholder="Телефон" value={form.phone} onChange={handleChange} required />
            <button type="submit">Подтвердить</button>
        </form>
    );
};

export default Basket;