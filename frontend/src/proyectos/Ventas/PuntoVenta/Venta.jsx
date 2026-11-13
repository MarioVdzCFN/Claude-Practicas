import React, { useState } from 'react';

const INITIAL_PRODUCTS = [
  { id: 1, name: 'Café Americano', price: 35.0, category: 'Bebidas' },
  { id: 2, name: 'Cappuccino', price: 48.0, category: 'Bebidas' },
  { id: 3, name: 'Croissant Mantequilla', price: 42.0, category: 'Panadería' },
  { id: 4, name: 'Muffin de Arándanos', price: 38.0, category: 'Panadería' },
  { id: 5, name: 'Sándwich Jamón y Queso', price: 75.0, category: 'Alimentos' },
  { id: 6, name: 'Ensalada César', price: 85.0, category: 'Alimentos' },
  { id: 7, name: 'Jugo Natural Naranja', price: 40.0, category: 'Bebidas' },
  { id: 8, name: 'Rebanada Pastel Chocolate', price: 60.0, category: 'Panadería' },
];

export default function PuntoDeVenta() {
  const [products] = useState(INITIAL_PRODUCTS);
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const categories = ['Todos', 'Bebidas', 'Panadería', 'Alimentos'];

  const addToCart = (product) => {
    setCart((prev) => {
      const exists = prev.find((i) => i.id === product.id);
      if (exists) {
        return prev.map((i) => (i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id, delta) => {
    setCart((prev) =>
      prev
        .map((item) => (item.id === id ? { ...item, quantity: item.quantity + delta } : item))
        .filter((item) => item.quantity > 0)
    );
  };

  const clearCart = () => setCart([]);

  const filteredProducts = products.filter((item) => {
    const matchesCategory = selectedCategory === 'Todos' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const tax = subtotal * 0.16;
  const total = subtotal + tax;

  return (
    <div style={styles.container}>
      {/* Panel Izquierdo: Catálogo */}
      <section style={styles.catalogSection}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Punto de Venta</h1>
            <span style={styles.subtitle}>Terminal #01</span>
          </div>
          <input
            type="text"
            placeholder="Buscar producto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.input}
          />
        </div>

        {/* Categorías */}
        <div style={styles.categoryBar}>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              style={{
                ...styles.categoryBtn,
                backgroundColor: selectedCategory === category ? '#18181b' : '#f4f4f5',
                color: selectedCategory === category ? '#ffffff' : '#3f3f46',
              }}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Grilla de Productos */}
        <div style={styles.grid}>
          {filteredProducts.map((p) => (
            <div
              key={p.id}
              onClick={() => addToCart(p)}
              style={styles.card}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#71717a')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#e4e4e7')}
            >
              <div>
                <span style={styles.categoryBadge}>{p.category}</span>
                <p style={styles.productName}>{p.name}</p>
              </div>
              <p style={styles.price}>${p.price.toFixed(2)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Panel Derecho: Ticket de Cobro */}
      <aside style={styles.cartSection}>
        <div style={styles.cartHeader}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#18181b', margin: 0 }}>
            Orden Actual
          </h2>
          {cart.length > 0 && (
            <button onClick={clearCart} style={styles.linkBtn}>
              Vaciar
            </button>
          )}
        </div>

        <div style={styles.cartList}>
          {cart.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#a1a1aa', marginTop: '40px' }}>
              No hay productos agregados
            </p>
          ) : (
            cart.map((item) => (
              <div key={item.id} style={styles.cartItem}>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontWeight: '600', fontSize: '14px', color: '#27272a' }}>
                    {item.name}
                  </p>
                  <span style={{ fontSize: '12px', color: '#71717a' }}>${item.price.toFixed(2)} c/u</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button onClick={() => updateQuantity(item.id, -1)} style={styles.qtyBtn}>-</button>
                  <span style={{ width: '20px', textAlign: 'center', fontWeight: 'bold' }}>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)} style={styles.qtyBtn}>+</button>
                  <span style={{ width: '65px', textAlign: 'right', fontWeight: '700' }}>
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        <div style={styles.footer}>
          <div style={styles.summaryRow}><span>Subtotal:</span><span>${subtotal.toFixed(2)}</span></div>
          <div style={styles.summaryRow}><span>IVA (16%):</span><span>${tax.toFixed(2)}</span></div>
          <div style={{ ...styles.summaryRow, borderTop: '1px dashed #d4d4d8', paddingTop: '10px', fontSize: '18px', fontWeight: 'bold', color: '#18181b' }}>
            <span>Total:</span>
            <span>${total.toFixed(2)}</span>
          </div>

          <button
            disabled={cart.length === 0}
            onClick={() => setIsCheckoutOpen(true)}
            style={{
              ...styles.payBtn,
              backgroundColor: cart.length === 0 ? '#d4d4d8' : '#18181b',
              cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            Cobrar ${total.toFixed(2)}
          </button>
        </div>
      </aside>

      {/* Modal de Pago */}
      {isCheckoutOpen && (
        <div style={styles.modalBackdrop}>
          <div style={styles.modalBox}>
            <h3 style={{ margin: 0, fontSize: '18px', color: '#18181b' }}>Confirmar Pago</h3>
            <p style={{ margin: '15px 0', fontSize: '15px', color: '#52525b' }}>
              Total a cobrar: <strong style={{ color: '#000' }}>${total.toFixed(2)}</strong>
            </p>
            <button
              onClick={() => {
                alert('¡Cobro exitoso!');
                clearCart();
                setIsCheckoutOpen(false);
              }}
              style={{ ...styles.payBtn, marginBottom: '8px' }}
            >
              Registrar Venta
            </button>
            <button onClick={() => setIsCheckoutOpen(false)} style={styles.cancelBtn}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    width: '100%',
    minHeight: '85vh',
    height: '100%',
    backgroundColor: '#ffffff',
    color: '#18181b',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
    overflow: 'hidden',
    boxSizing: 'border-box',
  },
  catalogSection: {
    flex: 1,
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    borderRight: '1px solid #e4e4e7',
    boxSizing: 'border-box',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    gap: '16px',
  },
  title: { margin: 0, fontSize: '24px', fontWeight: '800', color: '#18181b' },
  subtitle: { fontSize: '12px', color: '#71717a' },
  input: {
    padding: '8px 14px',
    borderRadius: '8px',
    border: '1px solid #d4d4d8',
    outline: 'none',
    fontSize: '14px',
    width: '240px',
  },
  categoryBar: { display: 'flex', gap: '8px', marginBottom: '20px' },
  categoryBtn: {
    border: 'none',
    padding: '6px 14px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  grid: {
    flex: 1,
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap: '14px',
    overflowY: 'auto',
  },
  card: {
    border: '1px solid #e4e4e7',
    borderRadius: '10px',
    padding: '14px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    cursor: 'pointer',
    backgroundColor: '#ffffff',
    transition: 'border-color 0.2s',
  },
  categoryBadge: { fontSize: '10px', textTransform: 'uppercase', color: '#a1a1aa', fontWeight: 'bold' },
  productName: { margin: '6px 0 12px 0', fontSize: '14px', fontWeight: '600', color: '#27272a' },
  price: { margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#09090b' },
  cartSection: {
    width: '340px',
    padding: '24px',
    backgroundColor: '#fafafa',
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
  },
  cartHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  linkBtn: { background: 'none', border: 'none', color: '#ef4444', fontSize: '13px', cursor: 'pointer', fontWeight: 'bold' },
  cartList: { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' },
  cartItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    border: '1px solid #e4e4e7',
  },
  qtyBtn: {
    width: '24px',
    height: '24px',
    border: '1px solid #d4d4d8',
    backgroundColor: '#f4f4f5',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  footer: { borderTop: '1px solid #e4e4e7', paddingTop: '16px', marginTop: '16px' },
  summaryRow: { display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: '#52525b' },
  payBtn: {
    width: '100%',
    padding: '12px',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  modalBackdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  modalBox: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '24px',
    width: '300px',
    textAlign: 'center',
    boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
  },
  cancelBtn: {
    width: '100%',
    padding: '10px',
    border: '1px solid #d4d4d8',
    backgroundColor: '#ffffff',
    color: '#3f3f46',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer',
  },
};