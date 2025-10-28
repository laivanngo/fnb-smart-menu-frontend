// Tệp: components/ProductModal.js (ĐÃ SỬA LỖI LOGIC LẦN CUỐI)
// Mục đích: Đồng bộ với "Bộ não" (Backend) - Tìm "CHON_1"

import React, { useState, useEffect, useMemo } from 'react';
import { useCart } from '../context/CartContext';

export default function ProductModal({ product, onClose }) {
    if (!product) return null;

    const [quantity, setQuantity] = useState(1);
    const [selectedOptions, setSelectedOptions] = useState({});
    const [note, setNote] = useState("");
    const { addToCart } = useCart();

    // 2. Hàm này chạy 1 lần khi Hộp thoại mở ra
    useEffect(() => {
        const defaults = {};
        product.options.forEach(option => {
            
            // === SỬA LỖI LOGIC Ở ĐÂY ===
            // So sánh với "CHON_1" (giá trị thực tế từ API)
            if (option.type === 'CHON_1' && option.values.length > 0) {
                // Tự động chọn giá trị đầu tiên (Vd: Size M, 50% đường)
                defaults[option.id] = option.values[0].id; 
            } else {
                // Với "chọn nhiều" (Topping), ban đầu là 1 mảng rỗng
                defaults[option.id] = [];
            }
        });
        setSelectedOptions(defaults);
    }, [product]);

    // 3. Hàm xử lý khi khách thay đổi lựa chọn (tick/bỏ tick)
    const handleOptionChange = (option, value) => {
        const optionId = option.id;
        const valueId = value.id;

        setSelectedOptions(prev => {
            const newState = { ...prev };

            // === SỬA LỖI LOGIC Ở ĐÂY ===
            if (option.type === 'CHON_1') {
                // Nếu là "chọn 1" (Radio), chỉ cần gán giá trị
                newState[optionId] = valueId;
            } else {
                // Nếu là "chọn nhiều" (Checkbox)
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

    // 4. Hàm "thần kỳ" để tính toán tổng giá
    const totalPrice = useMemo(() => {
        let itemPrice = product.base_price; 

        Object.keys(selectedOptions).forEach(optionId => {
            const selected = selectedOptions[optionId];
            
            const optionGroup = product.options.find(o => o.id == optionId);
            if (!optionGroup) return;
            
            if (Array.isArray(selected)) {
                // "chọn nhiều" (Topping)
                selected.forEach(valueId => {
                    const value = optionGroup.values.find(v => v.id == valueId);
                    if (value) itemPrice += value.price_adjustment;
                });
            } else {
                // "chọn 1" (Size, Đường)
                const value = optionGroup.values.find(v => v.id == selected);
                if (value) itemPrice += value.price_adjustment;
            }
        });
        
        return itemPrice * quantity;
    }, [product, selectedOptions, quantity]);

    // 5. Hàm xử lý khi bấm nút "Thêm vào giỏ"
    const handleAddToCart = () => {
        const allOptionValueIds = Object.values(selectedOptions).flat();
        const itemPrice = totalPrice / quantity;
        
        let optionsDisplay = [];
        product.options.forEach(option => {
            const selected = selectedOptions[option.id];
            
            if (Array.isArray(selected) && selected.length > 0) { // Topping
                selected.forEach(valueId => {
                    const value = option.values.find(v => v.id == valueId);
                    if(value) optionsDisplay.push(value.name);
                });
            } else if (!Array.isArray(selected) && selected) { // Size, Đường... (thêm check 'selected')
                const value = option.values.find(v => v.id == selected);
                if(value) optionsDisplay.push(value.name);
            }
        });

        const cartItem = {
            product_id: product.id,
            quantity: quantity,
            note: note,
            options: allOptionValueIds, 
            _display: {
                name: product.name,
                image: product.image_url,
                itemPrice: itemPrice,
                optionsText: optionsDisplay.join(', ')
            }
        };

        addToCart(cartItem);
        onClose(); 
    };

    // 6. Giao diện (HTML/JSX)
    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>×</button>
                
                <h2 className="modal-title">{product.name}</h2>
                <p className="modal-description">{product.description}</p>
                <div className="modal-image">{product.image_url || '🥤'}</div>

                <div className="modal-options">
                    {product.options.map(option => (
                        <div key={option.id} className="option-group">
                            
                            {/* === SỬA LỖI LOGIC Ở ĐÂY === */}
                            <h4>{option.name} {option.type === 'CHON_1' ? '(Chọn 1)' : '(Chọn nhiều)'}</h4>
                            
                            {option.values.map(value => (
                                <div key={value.id} className="option-item">
                                    <label>
                                        
                                        {/* === SỬA LỖI LOGIC Ở ĐÂY === */}
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

                <div className="option-group">
                    <h4>Ghi chú</h4>
                    <textarea 
                        className="note-input"
                        placeholder="Vd: Ít đá, nhiều đường..."
                        value={note}
                        onChange={(e) => setNote(e.g.value)}
                    />
                </div>

                <div className="modal-footer">
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