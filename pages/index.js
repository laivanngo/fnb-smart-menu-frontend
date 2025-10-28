// Tệp: pages/index.js (NÂNG CẤP)
// Mục đích: Thêm "bộ nhớ" (state) và "Hộp Tùy chọn" (Modal)

import Head from 'next/head';
import { useState } from 'react'; // 1. Import "bộ nhớ" (useState) từ React
import ProductModal from '../components/ProductModal'; // 2. Import "Hộp Tùy chọn"
import CartDisplay from '../components/CartDisplay';

// --- PHẦN 1: Giao diện (HTML/JSX) ---
export default function HomePage({ menuData, error }) {
  
  // === THÊM DÒNG NÀY ĐỂ KIỂM TRA ===
  console.log("Dữ liệu Menu nhận được:", menuData);
  // ===================================

  // 3. Tạo "bộ nhớ" (state)
  // Ban đầu rỗng (null), chưa chọn sản phẩm nào
  const [selectedProduct, setSelectedProduct] = useState(null);

  // (Phần xử lý lỗi giữ nguyên)
  if (error) {
    return (
      <div className="container" style={{ color: 'red', textAlign: 'center' }}>
        <h1>Lỗi khi tải Menu</h1>
        <p>{error}</p>
        <p>Hãy đảm bảo "Bộ não" (Backend) của bạn đang chạy ở http://122.0.0.1:8000</p>
      </div>
    );
  }

  // Nếu không có lỗi, "vẽ" menu
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
                
                // 4. THÊM SỰ KIỆN onClick VÀO ĐÂY
                // Khi bấm vào thẻ này...
                <div 
                  key={product.id} 
                  className="product-card"
                  onClick={() => setSelectedProduct(product)} // ...hãy "bỏ" sản phẩm này vào "bộ nhớ"
                >
                  
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

      {/* 5. "HỘP TÙY CHỌN" 🎁 */}
      {/* Nó sẽ "lắng nghe" "bộ nhớ" (selectedProduct).
        Nếu "bộ nhớ" có sản phẩm (không phải null), nó sẽ hiện ra.
      */}
      {selectedProduct && (
        <ProductModal 
          product={selectedProduct} // Gửi sản phẩm vào Hộp
          onClose={() => setSelectedProduct(null)} // Gửi hàm "dọn dẹp bộ nhớ" khi đóng
        />
      )}

      <CartDisplay />

    </div>
  );
}

// --- PHẦN 2: Lấy Dữ liệu (Logic) ---
// (Giữ nguyên, không thay đổi)
export async function getServerSideProps() {
  try {
    const res = await fetch('http://127.0.0.1:8000/menu');

    if (!res.ok) {
      throw new Error(`Kết nối "Bộ não" thất bại! (Status: ${res.status})`);
    }
    const menuData = await res.json();
    return {
      props: {
        menuData: menuData,
        error: null,
      },
    };
  } catch (err) {
    console.error("Lỗi khi gọi API /menu:", err.message);
    return {
      props: {
        menuData: [],
        error: err.message,
      },
    };
  }
}