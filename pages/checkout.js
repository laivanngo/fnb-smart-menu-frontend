// Tệp: pages/checkout.js (HOÀN CHỈNH - Sửa Hydration & ClearCart & Voucher)
// Mục đích: Trang Thanh toán, thu thập thông tin và Đặt hàng

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useCart } from '../context/CartContext'; // Lấy "cái móc" của "Chiếc túi"
import { useRouter } from 'next/router';

export default function CheckoutPage() {
    const router = useRouter();
    // 1. Lấy giỏ hàng VÀ hàm "Xóa sạch" từ "Chiếc túi"
    const { cartItems, totalPrice, itemCount, clearCart } = useCart();

    // 2. "Bộ nhớ" (State) cho các biểu mẫu (form)
    const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '', address: '', note: '' });
    const [deliveryMethod, setDeliveryMethod] = useState('TIEU_CHUAN');
    const [paymentMethod, setPaymentMethod] = useState('TIEN_MAT');
    const [voucherCode, setVoucherCode] = useState(''); // State cho mã voucher

    // States cho logic
    const [calculation, setCalculation] = useState(null); // Kết quả tính toán từ backend
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false); // Loading khi đặt hàng
    const [isCalculating, setIsCalculating] = useState(false); // Loading khi tính toán

    // === 3. PHẦN SỬA LỖI HYDRATION ===
    const [hasMounted, setHasMounted] = useState(false);
    useEffect(() => {
        setHasMounted(true); // Đánh dấu là đã chạy trên client
    }, []);
    // === KẾT THÚC SỬA LỖI ===

    // 4. Hàm xử lý khi gõ vào ô thông tin
    const handleInfoChange = (e) => {
        setCustomerInfo({ ...customerInfo, [e.target.name]: e.target.value });
    };

    // 5. HÀM CHỐT GIÁ (Gọi API /orders/calculate)
    const fetchCalculation = async (currentVoucherCode) => {
        // Chỉ tính khi đã mount và có hàng
        if (!hasMounted || cartItems.length === 0) {
             setCalculation({ sub_total: 0, delivery_fee: 0, discount_amount: 0, total_amount: 0 });
            return;
        }

        setIsCalculating(true); // Bắt đầu loading tính toán
        setError(''); // Xóa lỗi cũ

        const itemsPayload = cartItems.map(item => ({
            product_id: item.product_id, quantity: item.quantity, options: item.options,
        }));

        try {
            const res = await fetch('http://127.0.0.1:8000/orders/calculate', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: itemsPayload,
                    voucher_code: currentVoucherCode || null, // Sử dụng voucher code được truyền vào
                    delivery_method: deliveryMethod,
                }),
            });
            // Ném lỗi nếu backend trả về lỗi (vd: voucher không hợp lệ)
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.detail || 'Không thể tính toán đơn hàng');
            }
            const data = await res.json();
            setCalculation(data);
        } catch (err) {
            setError(err.message);
            setCalculation(null); // Reset calculation nếu có lỗi
        } finally {
            setIsCalculating(false); // Kết thúc loading tính toán
        }
    };

    // 6. Tự động "Chốt giá" (Chỉ chạy sau khi "hasMounted")
    // Chạy khi mount, đổi deliveryMethod, hoặc cartItems thay đổi
    useEffect(() => {
        // Chỉ chạy các logic này sau khi "client" đã "mounted"
        if (hasMounted) {
            // Nếu giỏ rỗng, đẩy về trang chủ
            // Dùng router.isReady để chắc chắn router đã sẵn sàng trước khi kiểm tra pathname
            if (router.isReady && itemCount === 0 && router.pathname === '/checkout') {
                router.replace('/'); // Dùng replace để không lưu vào lịch sử
            } else if (itemCount > 0) { // Chỉ tính toán nếu có hàng
                fetchCalculation(voucherCode); // Gọi tính toán với voucher hiện tại
            } else if (itemCount === 0) { // Set calculation về 0 nếu giỏ trống
                setCalculation({ sub_total: 0, delivery_fee: 0, discount_amount: 0, total_amount: 0 });
            }
        }
    }, [hasMounted, deliveryMethod, cartItems, itemCount, router.isReady, router.pathname]); // Thêm router.isReady và pathname


    // --- Hàm xử lý khi bấm nút "Áp dụng" Voucher ---
    const handleApplyVoucher = () => {
        // Chỉ cần gọi lại fetchCalculation với voucherCode hiện tại trong state
        fetchCalculation(voucherCode);
    };


    // 7. HÀM ĐẶT HÀNG (Gọi API /orders)
    const handlePlaceOrder = async (e) => {
        e.preventDefault();
        if (!customerInfo.name || !customerInfo.phone || !customerInfo.address) { setError('Vui lòng nhập đủ Họ tên, SĐT và Địa chỉ'); return; }
        if (itemCount === 0) { setError('Giỏ hàng trống!'); return; }
        if (!calculation && !isCalculating) { setError('Đang chờ tính toán, vui lòng thử lại sau giây lát.'); fetchCalculation(voucherCode); return; }
        if (!calculation && isCalculating) { setError('Đang tính toán, vui lòng chờ...'); return; }

        setIsLoading(true); setError('');

        const orderPayload = {
            items: cartItems.map(item => ({ product_id: item.product_id, quantity: item.quantity, options: item.options, note: item.note })),
            voucher_code: calculation?.discount_amount > 0 ? voucherCode : null,
            delivery_method: deliveryMethod,
            customer_name: customerInfo.name, customer_phone: customerInfo.phone, customer_address: customerInfo.address, customer_note: customerInfo.note,
            payment_method: paymentMethod,
        };

        try {
            const res = await fetch('http://127.0.0.1:8000/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(orderPayload), });
            if (!res.ok) { const errData = await res.json(); throw new Error(errData.detail || 'Đặt hàng thất bại'); }

            const orderResult = await res.json();
            alert(`Đặt hàng thành công! Mã đơn hàng của bạn là #${orderResult.id}`);
            clearCart();
            router.push('/');
        } catch (err) { setError(err.message); }
        finally { setIsLoading(false); }
    };

    // 8. "CỔNG AN NINH" - Chống lỗi Hydration
    // Hiển thị loading cho đến khi client mount xong
    if (!hasMounted) {
        return (
            <div className="container" style={{textAlign: 'center', paddingTop: '50px'}}>
                <Head><title>Thanh toán</title></Head>
                <p>Đang tải giỏ hàng...</p>
            </div>
        );
    }

    // 9. Giao diện (HTML/JSX) - Chỉ render khi hasMounted = true
    return (
        <div className="container checkout-page">
            <Head><title>Thanh toán</title></Head>
            <header className="header">🛒 Thanh toán</header>

            <form onSubmit={handlePlaceOrder}>
                {/* --- Cột Thông tin --- */}
                <div className="checkout-form">
                     <h3>Thông tin Giao hàng</h3>
                    <input name="name" placeholder="Họ và Tên" onChange={handleInfoChange} required />
                    <input name="phone" placeholder="Số điện thoại" onChange={handleInfoChange} required />
                    <input name="address" placeholder="Địa chỉ" onChange={handleInfoChange} required />
                    <textarea name="note" placeholder="Ghi chú thêm (nếu có)" onChange={handleInfoChange} />

                    <h3>Phương thức Giao hàng</h3>
                    <div className="option-group-checkout">
                        <label> <input type="radio" name="delivery" value="TIEU_CHUAN" checked={deliveryMethod === 'TIEU_CHUAN'} onChange={(e) => setDeliveryMethod(e.target.value)} /> Giao Tiêu chuẩn (20-30 phút) </label>
                        <label> <input type="radio" name="delivery" value="NHANH" checked={deliveryMethod === 'NHANH'} onChange={(e) => setDeliveryMethod(e.target.value)} /> Giao Nhanh (10-15 phút) </label>
                    </div>

                    <h3>Phương thức Thanh toán</h3>
                    <div className="option-group-checkout">
                        <label> <input type="radio" name="payment" value="TIEN_MAT" checked={paymentMethod === 'TIEN_MAT'} onChange={(e) => setPaymentMethod(e.target.value)} /> 💵 Tiền mặt </label>
                        <label> <input type="radio" name="payment" value="MOMO" checked={paymentMethod === 'MOMO'} onChange={(e) => setPaymentMethod(e.target.value)} /> 📱 MoMo </label>
                    </div>
                </div>

                {/* --- Cột Đơn hàng & Tổng tiền --- */}
                <div className="checkout-summary">
                    {/* Hiển thị itemCount an toàn vì đã qua cổng hasMounted */}
                    <h3>Đơn hàng của bạn ({itemCount})</h3>

                    <div className="cart-items-list-checkout">
                        {cartItems.map(item => (
                            <div key={item.cartId} className="cart-item-checkout">
                                <span className="item-qty">{item.quantity}x</span>
                                <div className="item-details">
                                    <strong>{item._display.name}</strong>
                                    <small>{item._display.optionsText}</small>
                                </div>
                                <span className="item-price"> {(item._display.itemPrice * item.quantity).toLocaleString('vi-VN')}đ </span>
                            </div>
                        ))}
                    </div>

                    {/* --- Ô Voucher --- */}
                    <div className="voucher-input-group">
                        <input type="text" placeholder="Nhập mã giảm giá (nếu có)" value={voucherCode} onChange={(e) => setVoucherCode(e.target.value.toUpperCase())} style={styles.voucherInput} />
                        <button type="button" onClick={handleApplyVoucher} style={styles.applyButton} disabled={isCalculating}> Áp dụng </button>
                    </div>

                    {/* --- Phần Tổng tiền --- */}
                    <div className="checkout-total">
                        {isCalculating ? ( <p style={{textAlign: 'center', color: '#555'}}>Đang tính toán...</p> )
                         : calculation ? (
                            <>
                                <div className="total-row"><span>Tạm tính:</span><span>{calculation.sub_total.toLocaleString('vi-VN')}đ</span></div>
                                <div className="total-row"><span>Phí giao hàng:</span><span>{calculation.delivery_fee > 0 ? calculation.delivery_fee.toLocaleString('vi-VN')+'đ' : 'Miễn phí'}</span></div>
                                {calculation.discount_amount > 0 && ( <div className="total-row discount"><span>Giảm giá ({voucherCode}):</span><span>-{calculation.discount_amount.toLocaleString('vi-VN')}đ</span></div> )}
                                <div className="total-row final"><span>Tổng cộng:</span><span>{calculation.total_amount.toLocaleString('vi-VN')}đ</span></div>
                            </>
                         ) : ( error ? null : <p style={{textAlign: 'center', color: '#888'}}>Vui lòng chọn P.thức giao hàng</p> )} {/* Chỉ hiện nếu chưa tính và không có lỗi */}
                    </div>

                    {error && <p className="error-message">{error}</p>}

                    <button type="submit" className="place-order-btn" disabled={isLoading || isCalculating || !calculation || itemCount === 0}> {/* Thêm disable nếu giỏ rỗng */}
                        {isLoading ? 'Đang xử lý...' : '📦 ĐẶT HÀNG'}
                    </button>
                </div>
            </form>
        </div>
    );
}

// --- CSS nội bộ ---
const styles = {
    voucherInput: { flexGrow: 1, padding: '10px', border: '1px solid #ddd', borderRadius: '4px 0 0 4px', fontSize: '0.9rem' },
    applyButton: { padding: '10px 15px', border: '1px solid #ddd', borderLeft: 'none', background: '#eee', borderRadius: '0 4px 4px 0', cursor: 'pointer', fontSize: '0.9rem' }
};