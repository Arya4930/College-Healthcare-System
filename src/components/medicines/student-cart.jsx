import React, { useEffect, useState } from 'react';
import '../css/medicine-home.css';
import { APIBASE } from '../../config.js';

export default function Student_cart() {
    const [cart, setCart] = useState([]);

    const loadCart = () => {
        const savedCart = localStorage.getItem('cartItems');
        if (savedCart) {
            setCart(JSON.parse(savedCart));
        }
    };


    useEffect(() => {
        loadCart();
    }, []);

    const saveCart = (updatedCart) => {
        localStorage.setItem('cartItems', JSON.stringify(updatedCart));
    };

    const removeFromCart = (medicineId) => {
        const updatedCart = cart.filter(item => item.id !== medicineId);
        setCart(updatedCart);
        saveCart(updatedCart);
    };

    const updateCartQuantity = (medicineId, newQuantity) => {
        if (newQuantity < 1) {
            removeFromCart(medicineId);
            return;
        }
        const updatedCart = cart.map(item =>
            item.id === medicineId
                ? { ...item, quantity: newQuantity }
                : item
        );
        setCart(updatedCart);
        saveCart(updatedCart);
    };

    const getTotalPrice = () => {
        return cart.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2);
    };

    const checkout = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${APIBASE}/api/medicine/checkout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ cartItems: cart }),
            });
            if(!res.ok) {
                throw new Error('Checkout failed');
            }
            alert('Checkout successful! Your order has been placed.');
            setCart([]);
            saveCart([]);
        } catch (error) {
            console.error('Error during checkout:', error);
        }
    }

    return (
        <div className="cart-section">
            <h2>Shopping Cart</h2>
            {cart.length === 0 ? (
                <p className="empty-cart">Your cart is empty!</p>
            ) : (
                <>
                    <div className="cart-items">
                        {cart.map(item => (
                            <div key={item.id} className="cart-item">
                                <img src={item.image} alt={item.name} />
                                <div className="cart-item-info">
                                    <h4>{item.name}</h4>
                                    <p>₹{item.price.toFixed(2)}</p>
                                </div>
                                <div className="cart-item-quantity">
                                    <input
                                        type="number"
                                        min="1"
                                        value={item.quantity}
                                        onChange={(e) => updateCartQuantity(item.id, parseInt(e.target.value))}
                                    />
                                </div>
                                <div className="cart-item-total">
                                    ₹{(item.price * item.quantity).toFixed(2)}
                                </div>
                                <button
                                    className="remove-btn"
                                    onClick={() => removeFromCart(item.id)}
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className="cart-summary">
                        <h3>Total: ₹{getTotalPrice()}</h3>
                        <button className="checkout-btn" onClick={() => checkout()}>Proceed to Checkout</button>
                    </div>
                </>
            )}
        </div>
    )
}