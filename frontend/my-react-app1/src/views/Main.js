import React, { useState, useEffect } from 'react';
import './Main.css';
import Product from '../components/Product';

function Main({ token }) {
    const [products, setProducts] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    // Загрузка товаров
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await fetch('http://localhost:9001/products');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const result = await response.json();
                // Сервер отдаёт массив
                setProducts(Array.isArray(result) ? result : []);
            } catch (err) {
                console.error('Fetch products error:', err);
                setError('Не удалось загрузить товары. Проверьте соединение с сервером.');
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    // Добавление в корзину
    const handleAddToCart = async (productId) => {
        if (!token) {
            alert('Для добавления в корзину необходимо авторизоваться');
            return;
        }
        try {
            const response = await fetch('http://localhost:9001/basket/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ productId })
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Ошибка');
            }
            alert(data.message || 'Товар добавлен в корзину');
        } catch (err) {
            console.error('Add to cart error:', err);
            alert('Ошибка при добавлении в корзину: ' + err.message);
        }
    };

    if (loading) return <div className="Main loading">Загрузка товаров...</div>;
    if (error) return <div className="Main error">{error}</div>;

    return (
        <div className="Main">
            {products.length === 0 ? (
                <p>Товары не найдены</p>
            ) : (
                products.map(item => (
                    <Product
                        key={item._id}
                        id={item._id}
                        header={item.header}
                        image={item.image}
                        price={item.price}
                        onAddToCart={handleAddToCart}
                    />
                ))
            )}
        </div>
    );
}

export default Main;