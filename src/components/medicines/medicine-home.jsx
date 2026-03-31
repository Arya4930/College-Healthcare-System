import React, { useState, useEffect } from 'react';
import { medicinesData } from './medicine-data';
import '../css/medicine-home.css';
import { Link } from 'react-router-dom';

const MedicineHome = () => {
    const [medicines, setMedicines] = useState([]);
    const [cart, setCart] = useState([]);
    const [quantities, setQuantities] = useState({});

    const initializeQuantities = () => {
        const qty = {};
        medicinesData.forEach(medicine => {
            qty[medicine.id] = 1;
        });
        setQuantities(qty);
    };

    const loadCart = () => {
        const savedCart = localStorage.getItem('cartItems');
        if (savedCart) {
            setCart(JSON.parse(savedCart));
        }
    };

    useEffect(() => {
        setMedicines(medicinesData);
        initializeQuantities();
        loadCart();
    }, []);

    const saveCart = (updatedCart) => {
        localStorage.setItem('cartItems', JSON.stringify(updatedCart));
    };

    const handleQuantityChange = (e, medicineId) => {
        const value = Math.max(1, parseInt(e.target.value) || 1);
        setQuantities(prev => ({
            ...prev,
            [medicineId]: value
        }));
    };

    const addToCart = (medicine) => {
        const quantity = quantities[medicine.id] || 1;
        const existingItem = cart.find(item => item.id === medicine.id);

        let updatedCart;
        if (existingItem) {
            updatedCart = cart.map(item =>
                item.id === medicine.id
                    ? { ...item, quantity: item.quantity + quantity }
                    : item
            );
        } else {
            updatedCart = [...cart, { ...medicine, quantity }];
        }

        setCart(updatedCart);
        saveCart(updatedCart);
        alert(`${medicine.name} added to cart!`);
        setQuantities(prev => ({
            ...prev,
            [medicine.id]: 1
        }));
    };

    const getTotalPrice = () => {
        return cart.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2);
    };

    const getTotalItems = () => {
        return cart.reduce((total, item) => total + item.quantity, 0);
    };

    return (
        <div className="medicine-home">
            <div className="medicine-header">
                <Link to="/medicines/student-cart" className='cart-link'>
                    ({getTotalItems()}) - ₹{getTotalPrice()}
                </Link>
                <p>
                    Ordering from XYZ Medicos ( +91 98765 43210 )
                </p>
            </div>

            <div className="medicines-grid">
                {medicines.map(medicine => (
                    <div key={medicine.id} className="medicine-card">
                        <div className="medicine-image">
                            <img src={medicine.image} alt={medicine.name} />
                        </div>
                        <div className="medicine-info">
                            <h3>{medicine.name}</h3>
                            <p className="description">{medicine.description}</p>
                            <p className="stock">In Stock: {medicine.stock}</p>
                            <p className="price">₹{medicine.price.toFixed(2)}</p>
                            <div className="medicine-actions">
                                <input
                                    type="number"
                                    min="1"
                                    max={medicine.stock}
                                    value={quantities[medicine.id] || 1}
                                    onChange={(e) => handleQuantityChange(e, medicine.id)}
                                    className="quantity-input"
                                />
                                <button
                                    className="add-to-cart-btn"
                                    onClick={() => addToCart(medicine)}
                                >
                                    Add to Cart
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MedicineHome;