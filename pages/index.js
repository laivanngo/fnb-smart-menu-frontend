// Tệp: fnb-smart-menu-frontend/pages/index.js (Nâng cấp "Hiển thị Ảnh thật")

import Head from 'next/head';
import { useState } from 'react';
import ProductModal from '../components/ProductModal';
import CartDisplay from '../components/CartDisplay';

// Lấy địa chỉ API public (dùng cho ảnh)
const publicApiUrl = process.env.NEXT_PUBLIC_API_URL;

// --- PHẦN 1: Giao diện (HTML/JSX) ---
export default function HomePage({ menuData, error }) {
  
  const [selectedProduct, setSelectedProduct] = useState(null);

  if (error) {
    return (
      <div className="container" style={{ color: 'red', textAlign: 'center', padding: '50px' }}>
        <h1>Lỗi khi tải Menu</h1>
        <p>{error}</p>
        <p>Vui lòng đảm bảo "Bộ não" (Backend) đang chạy và "Mặt tiền" (Frontend) đã được cấu hình API URL chính xác.</p>
        <p>Nếu bạn đang chạy local, hãy đảm bảo file .env.local có `NEXT_PUBLIC_API_URL=http://127.0.0.1:8000`</p>
      </div>
    );
  }

  // === HÀM MỚI: Quyết định URL ảnh ===
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return null; // Không có ảnh
    // Nếu là link ngoài (vd: http...) hoặc emoji (không bắt đầu bằng /)
    if (imageUrl.startsWith('http') || !imageUrl.startsWith('/')) {
        return imageUrl; // Dùng chính nó
    }
    // Nếu là đường dẫn /static/...
    // (publicApiUrl đã có http://... ở đầu)
    return `${publicApiUrl}${imageUrl}`; // Nối với API URL công khai
  };
  
  // === HÀM MỚI: Hiển thị ảnh hoặc emoji ===
  const renderImage = (product) => {
      const url = getImageUrl(product.image_url);
      
      // Nếu là emoji (ngắn và không phải link)
      if (url && url.length < 5 && !url.startsWith('http')) {
          return <div className="product-image emoji-image">{url}</div>;
      }
      // Nếu là link ảnh thật
      if (url) {
          return (
              <div 
                  className="product-image real-image" 
                  style={{backgroundImage: `url(${url})`}}
              ></div>
          );
      }
      // Fallback nếu không có gì
      return <div className="product-image emoji-image">🥤</div>;
  };

  return (
    <div className="container">
      <Head>
        <title>Trà Sữa & Cà Phê Express - Đặt hàng</title>
      </Head>

      <header className="header">
        ☕ Trà Sữa Express
      </header>

      <main>
        {menuData.map((category) => (
          <section key={category.id} className="category-section">
            
            <h2 className="category-title">{category.name}</h2>
            
            <div className="products-grid">
              {category.products.map((product) => (
                
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
                  
                  {/* === SỬA Ở ĐÂY: Gọi hàm renderImage === */}
                  {renderImage(product)}
                  
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

      {/* Modal và CartDisplay */}
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
// (Sử dụng API_URL cho Server-side)
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