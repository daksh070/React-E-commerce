

import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Row, Col, Card, Button, Badge, Modal, Form, InputGroup } from 'react-bootstrap';

export default function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [categories, setCategories] = useState([]);

  const [selected, setSelected] = useState(null); // product for quick view
  const [showCart, setShowCart] = useState(false);

  const [cart, setCart] = useState(() => {
    try {
      const raw = localStorage.getItem('rb_cart_v1');
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  });

  // Fetch products
  useEffect(() => {
    let mounted = true;
    async function fetchProducts() {
      try {
        setLoading(true);
        const res = await fetch('https://fakestoreapi.com/products');
        if (!res.ok) throw new Error('API error ' + res.status);
        const data = await res.json();
        if (mounted) {
          setProducts(data);
          // derive categories
          const cats = Array.from(new Set(data.map(p => p.category)));
          setCategories(cats);
        }
      } catch (err) {
        console.error(err);
        setError(err.message || 'Unknown error');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchProducts();
    return () => { mounted = false; };
  }, []);

  // Persist cart
  useEffect(() => {
    localStorage.setItem('rb_cart_v1', JSON.stringify(cart));
  }, [cart]);

  function addToCart(product, qty = 1) {
    setCart(prev => {
      const copy = { ...prev };
      if (!copy[product.id]) copy[product.id] = { product, qty: 0 };
      copy[product.id].qty += qty;
      return copy;
    });
  }

  function removeFromCart(productId) {
    setCart(prev => {
      const copy = { ...prev };
      delete copy[productId];
      return copy;
    });
  }

  function setQty(productId, qty) {
    setCart(prev => {
      const copy = { ...prev };
      if (!copy[productId]) return prev;
      copy[productId].qty = Math.max(1, Math.round(qty));
      return copy;
    });
  }

  function clearCart() {
    setCart({});
  }

  const cartCount = Object.values(cart).reduce((s, it) => s + it.qty, 0);
  const cartTotal = Object.values(cart).reduce((s, it) => s + it.qty * it.product.price, 0).toFixed(2);

  const filtered = products
    .filter(p => category === 'all' || p.category === category)
    .filter(p => p.title.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <div>
      <header className="bg-dark text-light py-3">
        <Container>
          <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap">
            <h3 className="m-0">MyStore</h3>
            <div className="d-flex align-items-center gap-2">
              <InputGroup style={{ minWidth: 260 }}>
                <Form.Control
                  placeholder="Search products..."
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                />
                <Button variant="secondary" onClick={() => setQuery('')}>Clear</Button>
              </InputGroup>

              <Button variant="outline-light" onClick={() => setShowCart(true)}>
                Cart <Badge bg="light" text="dark" className="ms-2">{cartCount}</Badge>
              </Button>
            </div>
          </div>
        </Container>
      </header>

      <main className="py-4">
        <Container>
          <Row className="mb-3 align-items-center">
            <Col xs={12} md={4} className="mb-2 mb-md-0">
              <div className="d-flex gap-2">
                <Form.Select value={category} onChange={e => setCategory(e.target.value)}>
                  <option value="all">All Categories</option>
                  {categories.map(cat => (
                    <option value={cat} key={cat}>{cat}</option>
                  ))}
                </Form.Select>
                <Button variant="outline-secondary" onClick={() => { setCategory('all'); setQuery(''); }}>Reset</Button>
              </div>
            </Col>

            <Col xs={12} md={8} className="text-md-end">
              <small className="text-muted">{loading ? 'Loading products...' : `${filtered.length} product(s)`}</small>
            </Col>
          </Row>

          {error && <div className="alert alert-danger">Error: {error}</div>}

          <Row xs={1} sm={2} md={3} lg={4} className="g-3">
            {filtered.map(product => (
              <Col key={product.id}>
                <Card className="h-100 shadow-sm">
                  <div className="ratio ratio-1x1" style={{ maxHeight: 240 }}>
                    <img src={product.image} alt={product.title} className="card-img-top p-3" style={{ objectFit: 'contain' }} />
                  </div>
                  <Card.Body className="d-flex flex-column">
                    <Card.Title style={{ fontSize: '1rem' }}>{product.title}</Card.Title>
                    <Card.Text className="text-muted small mb-2">{product.category}</Card.Text>
                    <div className="mt-auto d-flex gap-2 align-items-center">
                      <div>
                        <strong>${product.price.toFixed(2)}</strong>
                      </div>
                      <Button variant="primary" size="sm" onClick={() => addToCart(product)}>
                        Add to cart
                      </Button>
                      <Button variant="outline-secondary" size="sm" onClick={() => setSelected(product)}>
                        Quick view
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>

          {!loading && filtered.length === 0 && (
            <div className="mt-4 text-center text-muted">No products match your search or filter.</div>
          )}
        </Container>
      </main>

      <footer className="bg-light py-3 mt-4 border-top">
        <Container className="d-flex justify-content-between">
          <small>© MyStore — Daksh app</small>
          <small>Cart total: <strong>${cartTotal}</strong></small>
        </Container>
      </footer>

      {/* Quick view modal */}
      <Modal show={!!selected} onHide={() => setSelected(null)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{selected?.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selected && (
            <Row>
              <Col md={5} className="d-flex align-items-center justify-content-center">
                <img src={selected.image} alt={selected.title} style={{ maxWidth: '100%', maxHeight: 320, objectFit: 'contain' }} />
              </Col>
              <Col md={7}>
                <h5>${selected.price.toFixed(2)}</h5>
                <p className="text-muted">Category: {selected.category}</p>
                <p>{selected.description}</p>
                <div className="d-flex gap-2">
                  <Button onClick={() => { addToCart(selected); setSelected(null); }}>Add to cart</Button>
                  <Button variant="outline-secondary" onClick={() => setSelected(null)}>Close</Button>
                </div>
              </Col>
            </Row>
          )}
        </Modal.Body>
      </Modal>

      {/* Cart modal */}
      <Modal show={showCart} onHide={() => setShowCart(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Your Cart ({cartCount})</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {cartCount === 0 ? (
            <div className="text-center text-muted py-4">Your cart is empty.</div>
          ) : (
            <div>
              <Row className="gy-3">
                {Object.values(cart).map(item => (
                  <Col xs={12} key={item.product.id} className="border rounded p-2">
                    <div className="d-flex gap-3 align-items-center">
                      <img src={item.product.image} alt={item.product.title} style={{ width: 64, height: 64, objectFit: 'contain' }} />
                      <div className="flex-grow-1">
                        <strong>{item.product.title}</strong>
                        <div className="text-muted small">${item.product.price.toFixed(2)} each</div>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <Form.Control
                          type="number"
                          value={item.qty}
                          onChange={e => setQty(item.product.id, Number(e.target.value))}
                          style={{ width: 80 }}
                        />
                        <Button variant="outline-danger" onClick={() => removeFromCart(item.product.id)}>Remove</Button>
                      </div>
                    </div>
                  </Col>
                ))}
              </Row>

              <div className="mt-3 d-flex justify-content-between align-items-center">
                <div>
                  <Button variant="secondary" onClick={() => clearCart()}>Clear cart</Button>
                </div>
                <div className="text-end">
                  <div className="fw-bold">Subtotal: ${cartTotal}</div>
                  <small className="text-muted">Shipping & taxes calculated at checkout (demo)</small>
                  <div className="mt-2">
                    <Button onClick={() => alert('Proceed to checkout (demo)')} className="me-2">Checkout</Button>
                    <Button variant="outline-secondary" onClick={() => setShowCart(false)}>Continue shopping</Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
}
