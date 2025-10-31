// Tệp: fnb-smart-menu-frontend/pages/index.js (Nâng cấp "Hết hàng")

import Head from 'next/head';
import { useState } from 'react';
import ProductModal from '../components/ProductModal';
import CartDisplay from '../components/CartDisplay';

// --- PHẦN 1: Giao diện (HTML/JSX) ---
export default function HomePage({ menuData, error }) {
  
  const [selectedProduct, setSelectedProduct] = useState(null);

  if (error) { /* (Phần xử lý lỗi giữ nguyên) */ }

  return (
    <div className="container">
      <Head><title>Trà Sữa & Cà Phê Express - Đặt hàng</title></Head>
      <header className="header">☕ Trà Sữa Express</header>
      
      <main>
        {menuData.map((category) => (
          <section key={category.id} className="category-section">
            <h2 className="category-title">{category.name}</h2>
            <div className="products-grid">
              {category.products.map((product) => (
                
                // === SỬA LỖI LOGIC CLICK ===
                <div 
                  key={product.id} 
                  // Thêm class 'disabled' nếu hết hàng
                  className={`product-card ${product.is_out_of_stock ? 'out-of-stock' : ''}`}
                  // Chỉ cho phép click nếu còn hàng
                  onClick={() => !product.is_out_of_stock && setSelectedProduct(product)}
                >
                  
                  {/* === THÊM OVERLAY HẾT HÀNG === */}
                  {product.is_out_of_stock && (
                    <div className="stock-overlay">
                      <span>Tạm hết hàng</span>
                    </div>
                  )}
                  
                  <div className="product-image">{product.image_url || '🥤'}</div>
                  <div className="product-info">
                    <h3 className="product-name">{product.name}</h3>
                    <p className="product-description">{product.description}</p>
                    <div className="product-footer">
                      <span className="product-price">
                        {product.base_price.toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </main>
      
      {/* (Modal và CartDisplay giữ nguyên) */}
      {selectedProduct && (
        <ProductModal 
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
      <CartDisplay />
    </div>
  );
}


// --- PHẦN 2: Lấy Dữ liệu (Logic) ---
export async function getServerSideProps(context) {
  // Dùng API_URL (biến server-side) mà docker-compose cung cấp
  const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL; // Dùng API_URL, nếu không có thì dùng NEXT_PUBLIC

  if (!apiUrl) {
    console.error("LỖI: Biến môi trường API_URL hoặc NEXT_PUBLIC_API_URL chưa được cấu hình!");
    return { props: { menuData: [], error: "Lỗi cấu hình hệ thống (API URL not set)." } };
  }

  try {
    const res = await fetch(`${apiUrl}/menu`);
    if (!res.ok) {
      throw new Error(`Kết nối "Bộ não" thất bại! (Status: ${res.status}) - URL: ${apiUrl}/menu`);
    }
    const menuData = await res.json();
    return { props: { menuData: menuData, error: null } };
  } catch (err) {
    console.error("Lỗi khi gọi API /menu:", err.message);
    return { props: { menuData: [], error: err.message } };
  }
}