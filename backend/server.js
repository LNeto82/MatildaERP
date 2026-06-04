import React, { useState, useEffect } from 'react';
import api from '../services/api';

// ==========================================
// ESTILOS AVANÇADOS (GLASS + GRADIENTES INSTAGRAM)
// ==========================================
const customStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;800&display=swap');
  @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css');

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body, html {
    margin: 0;
    padding: 0;
    background: #0a0a0a;
    font-family: 'Montserrat', sans-serif;
    color: #111111;
  }

  /* FUNDO COM GRADIENTE INSTAGRAM-STYLE */
  .page-container {
    min-height: 100vh;
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    position: relative;
    overflow-x: hidden;
  }

  /* EFEITO DE VIDRO COM BRILHO (GLASSMORPHISM MELHORADO) */
  .glass-panel {
    background: rgba(255, 255, 255, 0.75);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 24px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.4);
    transition: all 0.3s ease;
  }

  .glass-panel:hover {
    background: rgba(255, 255, 255, 0.85);
    box-shadow: 0 12px 48px rgba(0, 0, 0, 0.15);
  }

  /* EFEITO INSTAGRAM STORY GRADIENT */
  .gradient-border {
    position: relative;
    background: linear-gradient(white, white) padding-box,
                linear-gradient(135deg, #D4AF37, #FFD700, #F3E5AB, #D4AF37) border-box;
    border: 2px solid transparent;
    border-radius: 24px;
  }

  /* BOTÃO COM GRADIENTE INSTAGRAM-STYLE (STORY HIGHLIGHT) */
  .btn-instagram {
    background: linear-gradient(135deg, #D4AF37, #FFD700, #B8860B, #D4AF37);
    background-size: 300% auto;
    color: #000000;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    border: none;
    padding: 14px 28px;
    border-radius: 40px;
    cursor: pointer;
    box-shadow: 0 4px 15px rgba(212, 175, 55, 0.3);
    transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    position: relative;
    overflow: hidden;
  }

  .btn-instagram::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    transition: left 0.5s ease;
  }

  .btn-instagram:hover::before {
    left: 100%;
  }

  .btn-instagram:hover {
    background-position: right center;
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(212, 175, 55, 0.5);
  }

  .btn-instagram:active {
    transform: translateY(0px);
  }

  /* BOTÃO SECUNDÁRIO */
  .btn-secondary {
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(8px);
    color: #D4AF37;
    font-weight: 600;
    border: 1px solid rgba(212, 175, 55, 0.5);
    padding: 12px 24px;
    border-radius: 40px;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .btn-secondary:hover {
    background: rgba(0, 0, 0, 0.85);
    transform: scale(1.02);
    border-color: #D4AF37;
  }

  /* LAYOUT 50/50 */
  .split-layout {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 30px;
    padding: 30px 5%;
    flex: 1;
    max-width: 1400px;
    margin: 0 auto;
  }

  .coffee-list {
    display: flex;
    flex-direction: column;
    gap: 20px;
    max-height: 75vh;
    overflow-y: auto;
    padding-right: 10px;
  }

  .coffee-list::-webkit-scrollbar {
    width: 6px;
  }

  .coffee-list::-webkit-scrollbar-track {
    background: rgba(212, 175, 55, 0.1);
    border-radius: 10px;
  }

  .coffee-list::-webkit-scrollbar-thumb {
    background: linear-gradient(135deg, #D4AF37, #FFD700);
    border-radius: 10px;
  }

  /* CARD DE PRODUTO ESTILO INSTAGRAM */
  .coffee-card {
    padding: 20px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    position: relative;
    overflow: hidden;
  }

  .coffee-card::after {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.1), transparent);
    transition: left 0.5s ease;
  }

  .coffee-card:hover::after {
    left: 100%;
  }

  .coffee-card:hover {
    transform: translateX(8px) translateY(-4px);
    background: rgba(255, 255, 255, 0.9);
    box-shadow: 0 12px 28px rgba(0, 0, 0, 0.15);
  }

  .coffee-card.active {
    background: linear-gradient(135deg, rgba(212, 175, 55, 0.2), rgba(255, 215, 0, 0.15));
    border-left: 4px solid #D4AF37;
    box-shadow: 0 8px 20px rgba(212, 175, 55, 0.2);
  }

  .details-panel {
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 40px;
    text-align: center;
    position: sticky;
    top: 30px;
    height: fit-content;
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(16px);
    border: 1px solid rgba(212, 175, 55, 0.3);
  }

  /* HEADER ESTILO INSTAGRAM */
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 5%;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(16px);
    border-bottom: 1px solid rgba(212, 175, 55, 0.2);
    position: sticky;
    top: 0;
    z-index: 100;
  }

  /* MODAL COM EFEITO GLASS */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(12px);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    animation: fadeIn 0.3s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  /* INPUTS ESTILO GLASS */
  .input-glass {
    width: 100%;
    padding: 14px 18px;
    margin-bottom: 16px;
    background: rgba(255, 255, 255, 0.9);
    border: 1.5px solid rgba(212, 175, 55, 0.3);
    border-radius: 40px;
    color: #111;
    font-family: 'Montserrat', sans-serif;
    font-weight: 500;
    outline: none;
    transition: all 0.3s ease;
    box-sizing: border-box;
  }

  .input-glass:focus {
    border-color: #D4AF37;
    box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.1);
    background: #ffffff;
  }

  select.input-glass {
    cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23D4AF37' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
    background-repeat: no-repeat;
    background-position: right 18px center;
    background-size: 16px;
  }

  /* BOTÃO PIX */
  .btn-pix-copiar {
    background: linear-gradient(135deg, #1a1a1a, #0a0a0a);
    color: #D4AF37;
    font-weight: bold;
    border: 1px solid rgba(212, 175, 55, 0.5);
    padding: 12px 24px;
    border-radius: 40px;
    cursor: pointer;
    transition: all 0.3s ease;
    width: 100%;
  }

  .btn-pix-copiar:hover {
    background: linear-gradient(135deg, #2a2a2a, #1a1a1a);
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(212, 175, 55, 0.3);
  }

  /* ANIMAÇÃO DE ÍCONES */
  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }

  .animated-icon {
    animation: pulse 2s ease-in-out infinite;
  }

  /* BADGE DE CARRINHO */
  .cart-badge {
    position: relative;
  }

  .cart-count {
    position: absolute;
    top: -8px;
    right: -8px;
    background: linear-gradient(135deg, #D4AF37, #FFD700);
    color: #000;
    font-size: 11px;
    font-weight: bold;
    padding: 2px 7px;
    border-radius: 20px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  }

  /* RESPONSIVIDADE */
  @media (max-width: 900px) {
    .split-layout {
      grid-template-columns: 1fr;
      gap: 20px;
    }
    .details-panel {
      position: relative;
      top: 0;
    }
    .btn-instagram {
      padding: 10px 18px;
      font-size: 12px;
    }
  }

  /* EFEITO DE BRILHO NOS ÍCONES */
  .icon-glow {
    filter: drop-shadow(0 0 8px rgba(212, 175, 55, 0.5));
    transition: all 0.3s ease;
  }

  .icon-glow:hover {
    filter: drop-shadow(0 0 12px rgba(212, 175, 55, 0.8));
    transform: scale(1.05);
  }
`;

const formatarMoeda = (valor) => Number(valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// =========================================================================
// CONFIGURAÇÕES REAIS DA LOJA
// =========================================================================
const WHATSAPP_LOJA = "5541988495454";
const CHAVE_PIX_ALEATORIA = "00020126580014br.gov.bcb.pix0136COLOQUE-SUA-CHAVE-AQUI-5204000053039865802BR5925Marcelli Matilda Cafe6009Curitiba62070503***63040000";
// =========================================================================

const LojaVirtual = () => {
  const [produtos, setProdutos] = useState([]);
  const [selecionado, setSelecionado] = useState(null);
  const [carrinho, setCarrinho] = useState([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [sucessoCheckout, setSucessoCheckout] = useState(null);
  const [formCheckout, setFormCheckout] = useState({ cliente_nome: '', cliente_whats: '', metodo_pagamento: 'pix' });

  useEffect(() => {
    api.get('/products')
      .then(res => {
        setProdutos(res.data);
        if (res.data.length > 0) setSelecionado(res.data[0]);
      })
      .catch(err => console.error(err));
  }, []);

  const adicionarAoCarrinho = () => {
    if (!selecionado) return;
    const itemExistente = carrinho.find(item => item.product_id === selecionado.id);

    if (itemExistente) {
      setCarrinho(carrinho.map(item => item.product_id === selecionado.id ? { ...item, quantidade: item.quantidade + 1 } : item));
    } else {
      setCarrinho([...carrinho, { product_id: selecionado.id, nome: selecionado.nome, preco_venda: selecionado.preco_venda, quantidade: 1 }]);
    }

    // Efeito visual no botão
    const btn = document.activeElement;
    btn.style.transform = 'scale(0.95)';
    setTimeout(() => { btn.style.transform = ''; }, 200);
  };

  const removerDoCarrinho = (productId) => {
    setCarrinho(carrinho.map(item => {
      if (item.product_id === productId) {
        return { ...item, quantidade: item.quantidade - 1 };
      }
      return item;
    }).filter(item => item.quantidade > 0));
  };

  const totalCarrinho = carrinho.reduce((acc, item) => acc + (parseFloat(item.preco_venda) * item.quantidade), 0);

  const finalizarCompra = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/orders', { items: carrinho, ...formCheckout });

      setSucessoCheckout({
        pedido_id: res.data.orderId,
        total: res.data.total,
        metodo: formCheckout.metodo_pagamento,
        nome_cliente: formCheckout.cliente_nome
      });

      setCarrinho([]);
      setFormCheckout({ cliente_nome: '', cliente_whats: '', metodo_pagamento: 'pix' });
    } catch (error) {
      alert(error.response?.data?.erro || 'Erro ao finalizar pedido.');
    }
  };

  const copiarChavePix = () => {
    navigator.clipboard.writeText(CHAVE_PIX_ALEATORIA)
      .then(() => alert('✨ Chave PIX copiada! Cole no app do seu banco.'))
      .catch(() => alert('Erro ao copiar a chave PIX.'));
  };

  const enviarParaWhatsApp = () => {
    if (!sucessoCheckout) return;

    const texto = `☕ Olá, Marcelli! Sou ${sucessoCheckout.nome_cliente}.\n\nAcabei de registrar o Pedido *#${sucessoCheckout.pedido_id}* na loja virtual.\n\n*Valor Total:* R$ ${formatarMoeda(sucessoCheckout.total)}\n*Pagamento:* ${sucessoCheckout.metodo.toUpperCase()}.\n\nEstou enviando esta mensagem para confirmar meu pedido. Aguardo as instruções!`;
    const linkWhats = `https://wa.me/${WHATSAPP_LOJA}?text=${encodeURIComponent(texto)}`;

    window.open(linkWhats, '_blank');
    setSucessoCheckout(null);
    setModalAberto(false);
  };

  const fecharModalGeral = () => {
    setModalAberto(false);
    setSucessoCheckout(null);
  };

  return (
    <div className="page-container">
      <style>{customStyles}</style>

      {/* HEADER ESTILO INSTAGRAM */}
      <header className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <i className="fas fa-coffee" style={{ fontSize: '2rem', color: '#D4AF37', filter: 'drop-shadow(0 2px 4px rgba(212,175,55,0.3))' }}></i>
          <h1 style={{ margin: 0, fontWeight: 900, background: 'linear-gradient(135deg, #D4AF37, #B8860B)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '2px' }}>
            MATILDA CAFÉ
          </h1>
        </div>

        <button className="btn-instagram cart-badge" onClick={() => setModalAberto(true)}>
          <i className="fas fa-shopping-cart" style={{ marginRight: '8px' }}></i>
          Carrinho
          {carrinho.length > 0 && <span className="cart-count">{carrinho.length}</span>}
        </button>
      </header>

      {/* LAYOUT 50/50 */}
      <main className="split-layout">
        <div className="coffee-list">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <i className="fas fa-fire" style={{ color: '#D4AF37', fontSize: '24px' }}></i>
            <h2 style={{ color: '#D4AF37', margin: 0 }}>NOSSAS OPÇÕES</h2>
          </div>

          {produtos.length === 0 ? (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
              <i className="fas fa-spinner fa-pulse" style={{ fontSize: '2rem', color: '#D4AF37', marginBottom: '15px' }}></i>
              <p>Carregando produtos...</p>
            </div>
          ) : (
            produtos.map(p => (
              <div
                key={p.id}
                className={`glass-panel coffee-card ${selecionado?.id === p.id ? 'active' : ''}`}
                onClick={() => setSelecionado(p)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: '0 0 5px 0', fontWeight: 800 }}>{p.nome}</h3>
                    <span style={{ fontSize: '0.8rem', color: '#D4AF37', fontWeight: 600 }}>
                      <i className="fas fa-tag" style={{ marginRight: '5px', fontSize: '10px' }}></i>
                      {p.tipo === 'sache' ? 'Sachê / Drip' : p.tipo === 'drip_coffee' ? 'Drip Coffee ☕' : 'Pacote 250g'}
                    </span>
                  </div>
                  <div style={{ fontWeight: 900, color: '#D4AF37', fontSize: '1.3rem' }}>
                    R$ {formatarMoeda(p.preco_venda)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="details-panel glass-panel">
          {selecionado ? (
            <>
              <div style={{ marginBottom: '30px' }}>
                <i className="fas fa-coffee animated-icon" style={{ fontSize: '5rem', color: '#D4AF37', marginBottom: '20px', display: 'inline-block' }}></i>
                <h1 style={{ fontWeight: 900, fontSize: '2.2rem', margin: '0 0 10px 0', background: 'linear-gradient(135deg, #D4AF37, #B8860B)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {selecionado.nome}
                </h1>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#D4AF37', margin: '0 0 20px 0' }}>
                  R$ {formatarMoeda(selecionado.preco_venda)}
                </div>

                <div style={{ background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.08), rgba(255, 215, 0, 0.05))', padding: '20px', borderRadius: '20px', border: '1px solid rgba(212, 175, 55, 0.3)', marginBottom: '30px' }}>
                  <p style={{ lineHeight: '1.8', margin: 0, fontSize: '1rem', color: '#333' }}>
                    <i className="fas fa-quote-left" style={{ color: '#D4AF37', marginRight: '10px', opacity: 0.7 }}></i>
                    {selecionado.descricao || 'Café especial 100% Arábica, torrado artesanalmente para você.'}
                  </p>
                </div>
              </div>

              <button className="btn-instagram" style={{ fontSize: '1.1rem', padding: '16px', width: '100%' }} onClick={adicionarAoCarrinho}>
                <i className="fas fa-cart-plus" style={{ marginRight: '10px' }}></i>
                ADICIONAR AO CARRINHO
              </button>
            </>
          ) : (
            <div style={{ color: '#999', textAlign: 'center' }}>
              <i className="fas fa-hand-pointer" style={{ fontSize: '4rem', marginBottom: '20px', color: '#D4AF37' }}></i>
              <h3>Selecione um produto ao lado</h3>
              <p style={{ marginTop: '10px' }}>para ver os detalhes</p>
            </div>
          )}
        </div>
      </main>

      {/* MODAL DE CHECKOUT */}
      {modalAberto && (
        <div className="modal-overlay">
          <div className="glass-panel" style={{ width: '100%', maxWidth: '550px', padding: '35px', maxHeight: '85vh', overflowY: 'auto', animation: 'fadeIn 0.3s ease' }}>

            {/* ESTÁGIO 1: SUCESSO E PIX */}
            {sucessoCheckout ? (
              <div style={{ textAlign: 'center' }}>
                <i className="fas fa-check-circle" style={{ fontSize: '4rem', color: '#25D366', marginBottom: '15px' }}></i>
                <h2 style={{ color: '#000', fontWeight: 900 }}>Pedido #{sucessoCheckout.pedido_id}</h2>
                <p style={{ color: '#D4AF37', fontWeight: 600, marginBottom: '20px' }}>✓ Registrado com sucesso!</p>

                {sucessoCheckout.metodo === 'pix' ? (
                  <div style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.1), rgba(255,215,0,0.05))', padding: '20px', borderRadius: '20px', margin: '20px 0' }}>
                    <h3 style={{ margin: '0 0 15px 0', color: '#D4AF37' }}>
                      <i className="fas fa-qrcode" style={{ marginRight: '8px' }}></i> Pague via PIX
                    </h3>

                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(CHAVE_PIX_ALEATORIA)}`}
                      alt="QR Code PIX"
                      style={{ borderRadius: '16px', marginBottom: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}
                    />

                    <button className="btn-pix-copiar" type="button" onClick={copiarChavePix}>
                      <i className="fas fa-copy" style={{ marginRight: '8px' }}></i>
                      COPIAR CHAVE PIX
                    </button>

                    <p style={{ margin: '15px 0 0 0', fontSize: '1.2rem', color: '#25D366', fontWeight: 'bold' }}>
                      Valor: R$ {formatarMoeda(sucessoCheckout.total)}
                    </p>
                  </div>
                ) : (
                  <div style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.1), rgba(255,215,0,0.05))', padding: '20px', borderRadius: '20px', margin: '20px 0' }}>
                    <h3 style={{ margin: '0', color: '#D4AF37' }}>
                      <i className="fas fa-money-bill-wave" style={{ marginRight: '8px' }}></i>
                      Pagamento na Entrega
                    </h3>
                    <p style={{ marginTop: '10px' }}>Valor: R$ {formatarMoeda(sucessoCheckout.total)}</p>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px' }}>
                  <button className="btn-instagram" style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)', color: '#fff' }} onClick={enviarParaWhatsApp}>
                    <i className="fab fa-whatsapp" style={{ marginRight: '10px' }}></i> CONFIRMAR NO WHATSAPP
                  </button>
                  <button className="btn-secondary" onClick={fecharModalGeral}>
                    FECHAR
                  </button>
                </div>
              </div>

              /* ESTÁGIO 2: CARRINHO VAZIO */
            ) : carrinho.length === 0 ? (
              <div style={{ textAlign: 'center' }}>
                <i className="fas fa-shopping-cart" style={{ fontSize: '4rem', color: '#ccc', marginBottom: '20px' }}></i>
                <h2 style={{ color: '#000', fontWeight: 900, marginBottom: '15px' }}>Carrinho vazio</h2>
                <p style={{ color: '#666', marginBottom: '25px' }}>Adicione produtos para continuar</p>
                <button className="btn-instagram" style={{ width: '100%', background: '#E2E8F0', color: '#333' }} onClick={fecharModalGeral}>
                  VOLTAR PARA LOJA
                </button>
              </div>

              /* ESTÁGIO 3: FORMULÁRIO DE COMPRA */
            ) : (
              <form onSubmit={finalizarCompra}>
                <h2 style={{ textAlign: 'center', color: '#000', fontWeight: 900, marginBottom: '25px' }}>
                  <i className="fas fa-clipboard-list" style={{ color: '#D4AF37', marginRight: '10px' }}></i>
                  Finalizar Pedido
                </h2>

                <div style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.08), rgba(255,215,0,0.04))', padding: '18px', borderRadius: '20px', marginBottom: '20px' }}>
                  <h4 style={{ margin: '0 0 12px 0', color: '#D4AF37' }}>
                    <i className="fas fa-receipt" style={{ marginRight: '8px' }}></i> Resumo do Pedido
                  </h4>

                  {carrinho.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', fontSize: '0.9rem', fontWeight: 600, padding: '8px 0', borderBottom: '1px solid rgba(212,175,55,0.15)' }}>
                      <span style={{ color: '#000' }}>
                        <i className="fas fa-coffee" style={{ color: '#D4AF37', marginRight: '8px', fontSize: '11px' }}></i>
                        {item.quantidade}x {item.nome}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <span style={{ color: '#D4AF37', fontWeight: 800 }}>R$ {formatarMoeda(item.preco_venda * item.quantidade)}</span>
                        <button
                          type="button"
                          onClick={() => removerDoCarrinho(item.product_id)}
                          style={{ background: 'transparent', border: 'none', color: '#FF6B6B', cursor: 'pointer', padding: '5px', fontSize: '1rem', transition: '0.2s' }}
                          title="Remover"
                        >
                          <i className="fas fa-times-circle"></i>
                        </button>
                      </div>
                    </div>
                  ))}

                  <div style={{ marginTop: '15px', paddingTop: '12px', borderTop: '2px solid rgba(212,175,55,0.3)', textAlign: 'right' }}>
                    <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#D4AF37' }}>
                      TOTAL: R$ {formatarMoeda(totalCarrinho)}
                    </span>
                  </div>
                </div>

                <input
                  className="input-glass"
                  type="text"
                  placeholder="Seu nome completo"
                  value={formCheckout.cliente_nome}
                  onChange={e => setFormCheckout({ ...formCheckout, cliente_nome: e.target.value })}
                  required
                />

                <input
                  className="input-glass"
                  type="tel"
                  placeholder="WhatsApp (apenas números)"
                  value={formCheckout.cliente_whats}
                  onChange={e => setFormCheckout({ ...formCheckout, cliente_whats: e.target.value })}
                  required
                />

                <select
                  className="input-glass"
                  value={formCheckout.metodo_pagamento}
                  onChange={e => setFormCheckout({ ...formCheckout, metodo_pagamento: e.target.value })}
                >
                  <option value="pix">💳 Pagamento via PIX</option>
                  <option value="dinheiro">💰 Dinheiro na Entrega</option>
                </select>

                <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                  <button type="submit" className="btn-instagram" style={{ flex: 2 }}>
                    <i className="fas fa-check" style={{ marginRight: '8px' }}></i> FINALIZAR
                  </button>
                  <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={fecharModalGeral}>
                    VOLTAR
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LojaVirtual;