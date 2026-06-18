"use client";

import { useEffect, useMemo, useState } from "react";

function formatPrice(value) {
  return Number(value || 0).toLocaleString("ko-KR") + "원";
}

export default function HomePage() {
  const [mode, setMode] = useState("login");
  const [user, setUser] = useState(null);
  const [authForm, setAuthForm] = useState({ email: "", password: "", name: "" });
  const [restaurants, setRestaurants] = useState([]);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function fetchJson(url, options = {}) {
    const response = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || "요청 처리 중 오류가 발생했습니다.");
    }

    return data;
  }

  async function loadMe() {
    try {
      const data = await fetchJson("/api/auth/me");
      setUser(data.user);
    } catch {
      setUser(null);
    }
  }

  async function loadRestaurants() {
    const data = await fetchJson("/api/restaurants");
    setRestaurants(data.restaurants);
  }

  async function loadCart() {
    try {
      const data = await fetchJson("/api/cart");
      setCart(data.items);
    } catch {
      setCart([]);
    }
  }

  async function loadOrders() {
    try {
      const data = await fetchJson("/api/orders");
      setOrders(data.orders);
    } catch {
      setOrders([]);
    }
  }

  async function loadAll() {
    setLoading(true);
    setError("");
    try {
      await loadMe();
      await loadRestaurants();
      await loadCart();
      await loadOrders();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function handleAuth(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      const url = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const data = await fetchJson(url, {
        method: "POST",
        body: JSON.stringify(authForm),
      });

      setUser(data.user);
      setAuthForm({ email: "", password: "", name: "" });
      setMessage(mode === "login" ? "로그인되었습니다." : "회원가입이 완료되었습니다.");
      await loadCart();
      await loadOrders();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleLogout() {
    setError("");
    setMessage("");

    try {
      await fetchJson("/api/auth/logout", { method: "POST" });
      setUser(null);
      setCart([]);
      setOrders([]);
      setMessage("로그아웃되었습니다.");
    } catch (err) {
      setError(err.message);
    }
  }

  async function addToCart(menuId) {
    setError("");
    setMessage("");

    try {
      await fetchJson("/api/cart", {
        method: "POST",
        body: JSON.stringify({ menuId, quantity: 1 }),
      });

      setMessage("장바구니에 담았습니다.");
      await loadCart();
    } catch (err) {
      setError(err.message);
    }
  }

  async function removeCartItem(cartItemId) {
    setError("");
    setMessage("");

    try {
      await fetchJson("/api/cart", {
        method: "DELETE",
        body: JSON.stringify({ cartItemId }),
      });

      setMessage("장바구니에서 삭제했습니다.");
      await loadCart();
    } catch (err) {
      setError(err.message);
    }
  }

  async function placeOrder() {
    setError("");
    setMessage("");

    try {
      await fetchJson("/api/orders", { method: "POST" });
      setMessage("주문이 완료되었습니다.");
      await loadCart();
      await loadOrders();
    } catch (err) {
      setError(err.message);
    }
  }

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

  if (loading) {
    return (
      <main className="container">
        <div className="card">앱을 불러오는 중입니다...</div>
      </main>
    );
  }

  return (
    <main className="container">
      <header className="header">
        <div>
          <h1 className="title">배달 앱 최종</h1>
          <p className="subtitle">회원가입부터 주문내역까지 확인할 수 있는 배달앱입니다.</p>
        </div>
        {user && (
          <button className="button secondary" onClick={handleLogout}>
            로그아웃
          </button>
        )}
      </header>

      {message && <div className="success">{message}</div>}
      {error && <div className="notice">{error}</div>}

      {!user ? (
        <section className="card auth-box">
          <h2 className="section-title">로그인 / 회원가입</h2>
          <div className="tabs">
            <button
              className={mode === "login" ? "tab active" : "tab"}
              onClick={() => setMode("login")}
            >
              로그인
            </button>
            <button
              className={mode === "register" ? "tab active" : "tab"}
              onClick={() => setMode("register")}
            >
              회원가입
            </button>
          </div>

          <form className="form" onSubmit={handleAuth}>
            {mode === "register" && (
              <input
                className="input"
                placeholder="이름"
                value={authForm.name}
                onChange={(event) =>
                  setAuthForm({ ...authForm, name: event.target.value })
                }
              />
            )}
            <input
              className="input"
              type="email"
              placeholder="이메일"
              value={authForm.email}
              onChange={(event) =>
                setAuthForm({ ...authForm, email: event.target.value })
              }
              required
            />
            <input
              className="input"
              type="password"
              placeholder="비밀번호"
              value={authForm.password}
              onChange={(event) =>
                setAuthForm({ ...authForm, password: event.target.value })
              }
              required
            />
            <button className="button" type="submit">
              {mode === "login" ? "로그인하기" : "회원가입하기"}
            </button>
          </form>
        </section>
      ) : (
        <div className="grid">
          <section>
            <div className="card">
              <h2 className="section-title">식당 · 메뉴 목록</h2>
              <p className="muted">
                현재 로그인 사용자: {user.name || user.email}
              </p>

              {restaurants.map((restaurant) => (
                <article className="restaurant" key={restaurant.id}>
                  <span className="badge">{restaurant.category || "식당"}</span>
                  <h3>{restaurant.name}</h3>
                  <p className="muted">{restaurant.description}</p>

                  <div className="menu-list">
                    {restaurant.menus.map((menu) => (
                      <div className="menu-item" key={menu.id}>
                        <div>
                          <div className="menu-name">{menu.name}</div>
                          <div className="muted">{menu.description}</div>
                        </div>
                        <div>
                          <div className="price">{formatPrice(menu.price)}</div>
                          <button className="button" onClick={() => addToCart(menu.id)}>
                            담기
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <aside className="cart-list">
            <section className="card">
              <h2 className="section-title">장바구니</h2>
              {cart.length === 0 ? (
                <p className="muted">장바구니가 비어 있습니다.</p>
              ) : (
                <>
                  {cart.map((item) => (
                    <div className="cart-item" key={item.id}>
                      <div>
                        <div className="menu-name">{item.menu_name}</div>
                        <div className="muted">
                          {item.restaurant_name} · 수량 {item.quantity}
                        </div>
                      </div>
                      <div>
                        <div className="price">
                          {formatPrice(item.price * item.quantity)}
                        </div>
                        <button
                          className="button secondary"
                          onClick={() => removeCartItem(item.id)}
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  ))}
                  <hr />
                  <p>
                    <strong>총 금액: {formatPrice(cartTotal)}</strong>
                  </p>
                  <button className="button" onClick={placeOrder}>
                    주문하기
                  </button>
                </>
              )}
            </section>

            <section className="card">
              <h2 className="section-title">내 주문 내역</h2>
              {orders.length === 0 ? (
                <p className="muted">아직 주문 내역이 없습니다.</p>
              ) : (
                <div className="order-list">
                  {orders.map((order) => (
                    <article className="restaurant" key={order.id}>
                      <h3>주문 #{order.id}</h3>
                      <p className="muted">
                        {new Date(order.created_at).toLocaleString("ko-KR")} · {order.status}
                      </p>
                      <p>
                        <strong>{formatPrice(order.total_price)}</strong>
                      </p>
                      {order.items.map((item) => (
                        <div className="order-item" key={item.id}>
                          <span>
                            {item.menu_name} × {item.quantity}
                          </span>
                          <span>{formatPrice(item.price * item.quantity)}</span>
                        </div>
                      ))}
                    </article>
                  ))}
                </div>
              )}
            </section>
          </aside>
        </div>
      )}
    </main>
  );
}
