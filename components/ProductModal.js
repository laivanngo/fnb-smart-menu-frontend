// Tệp: fnb-smart-menu-frontend/components/ProductModal.js
// Mục đích: "Hộp Tùy chọn" (Modal)
// ĐÃ SỬA LỖI: Thêm logic hiển thị ảnh thật

import React, { useState, useEffect, useMemo } from 'react';
import { useCart } from '../context/CartContext';

// 1. Lấy địa chỉ API public (dùng cho ảnh)
const publicApiUrl = process.env.NEXT_PUBLIC_API_URL;

export default function ProductModal({ product, onClose }) {
    if (!product) return null;

    // (Các state: quantity, selectedOptions, note, addToCart... giữ nguyên)
    const [quantity, setQuantity] = useState(1);
    const [selectedOptions, setSelectedOptions] = useState({});
    const [note, setNote] = useState("");
    const { addToCart } = useCart();

    // (useEffect, handleOptionChange, totalPrice, handleAddToCart... giữ nguyên)
    useEffect(() => {
        const defaults = {};
        product.options.forEach(option => {
            if (option.type === 'CHON_1' && option.values.length > 0) {
                defaults[option.id] = option.values[0].id; 
            } else {
                defaults[option.id] = [];
            }
        });
        setSelectedOptions(defaults);
    }, [product]);

    const handleOptionChange = (option, value) => {
        const optionId = option.id;
        const valueId = value.id;
        setSelectedOptions(prev => {
            const newState = { ...prev };
            if (option.type === 'CHON_1') {
                newState[optionId] = valueId;
            } else {
                const currentSelection = prev[optionId] || [];
                if (currentSelection.includes(valueId)) {
                    newState[optionId] = currentSelection.filter(id => id !== valueId);
                } else {
                    newState[optionId] = [...currentSelection, valueId];
                }
            }
            return newState;
        });
    };

    const totalPrice = useMemo(() => {
        let itemPrice = product.base_price; 
        Object.keys(selectedOptions).forEach(optionId => {
            const selected = selectedOptions[optionId];
            const optionGroup = product.options.find(o => o.id == optionId);
            if (!optionGroup) return;
            if (Array.isArray(selected)) {
                selected.forEach(valueId => {
                    const value = optionGroup.values.find(v => v.id == valueId);
                    if (value) itemPrice += value.price_adjustment;
                });
            } else {
                const value = optionGroup.values.find(v => v.id == selected);
                if (value) itemPrice += value.price_adjustment;
            }
        });
        return itemPrice * quantity;
    }, [product, selectedOptions, quantity]);

    const handleAddToCart = () => {
        const allOptionValueIds = Object.values(selectedOptions).flat();
        const itemPrice = totalPrice / quantity;
        let optionsDisplay = [];
        product.options.forEach(option => {
            const selected = selectedOptions[option.id];
            if (Array.isArray(selected) && selected.length > 0) {
                selected.forEach(valueId => {
                    const value = option.values.find(v => v.id == valueId);
                    if(value) optionsDisplay.push(value.name);
                });
            } else if (!Array.isArray(selected) && selected) {
                const value = option.values.find(v => v.id == selected);
                if(value) optionsDisplay.push(value.name);
            }
        });
        const cartItem = {
            product_id: product.id, quantity: quantity, note: note, options: allOptionValueIds, 
            _display: { name: product.name, image: product.image_url, itemPrice: itemPrice, optionsText: optionsDisplay.join(', ') }
        };
        addToCart(cartItem);
        onClose(); 
    };

    // === 2. THÊM CÁC HÀM XỬ LÝ ẢNH (Giống index.js) ===
    const getImageUrl = (imageUrl) => {
        if (!imageUrl) return null;
        if (imageUrl.startsWith('http') || !imageUrl.startsWith('/')) {
            return imageUrl;
        }
        // Nối apiUrl (đã lấy ở đầu file)
        return `${publicApiUrl}${imageUrl}`; 
    };

    const renderImage = (product) => {
        const url = getImageUrl(product.image_url);
        if (url && url.length < 5 && !url.startsWith('http')) {
            return <div className="modal-image emoji-image">{url}</div>;
        }
        if (url) {
            return (
                <div 
                    className="modal-image real-image" 
                    style={{backgroundImage: `url(${url})`}}
                ></div>
            );
        }
        return <div className="modal-image emoji-image">🥤</div>;
    };
    // ===============================================

    // 6. Giao diện (HTML/JSX)
    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>×</button>
                
                <h2 className="modal-title">{product.name}</h2>
                <p className="modal-description">{product.description}</p>
                
                {/* === 3. SỬA DÒNG NÀY === */}
                {renderImage(product)} 
                {/* ======================= */}

                <div className="modal-options">
                    {/* ... (Các tùy chọn giữ nguyên) ... */}
                    {product.options.map(option => (
                        <div key={option.id} className="option-group">
                            <h4>{option.name} {option.type === 'CHON_1' ? '(Chọn 1)' : '(Chọn nhiều)'}</h4>
                            {option.values.map(value => (
                                <div key={value.id} className="option-item">
                                    <label>
                                        <input
                                            type={option.type === 'CHON_1' ? 'radio' : 'checkbox'}
                                            name={`option-${option.id}`}
                                            checked={
                                                option.type === 'CHON_1'
                                                    ? selectedOptions[option.id] === value.id
                                                    : selectedOptions[option.id]?.includes(value.id)
                                            }
                                            onChange={() => handleOptionChange(option, value)}
                                        />
                                        <span className="option-name">{value.name}</span>
                                        <span className="option-price">
                                            +{value.price_adjustment.toLocaleString('vi-VN')}đ
                                        </span>
                                    </label>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>

                <div className="option-group" style={{padding: '0 20px'}}> {/* Thêm padding cho Ghi chú */}
                    <h4>Ghi chú</h4>
                    <textarea 
                        className="note-input"
                        placeholder="Vd: Ít đá, nhiều đường..."
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                    />
                </div>

                <div className="modal-footer">
                    {/* ... (Footer giữ nguyên) ... */}
                    <div className="quantity-selector">
                        <button onClick={() => setQuantity(q => Math.max(1, q - 1))}>-</button>
                        <span>{quantity}</span>
                        <button onClick={() => setQuantity(q => q + 1)}>+</button>
                    </div>
                    <button className="add-to-cart-btn" onClick={handleAddToCart}>
                        Thêm ({totalPrice.toLocaleString('vi-VN')}đ)
                    </button>
                </div>

            </div>
        </div>
    );
}