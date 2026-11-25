import React from 'react';
import './Product.css';

function Product({ id, header, image, price, onAddToCart }) {
    return (
        <div className="Product">
            <img src={image} alt={header} />
            <h1>{header}</h1>
            <p>{`${price} руб`}</p>
            <button onClick={() => onAddToCart(id)}>В корзину</button>
        </div>
    );
}

export default Product;