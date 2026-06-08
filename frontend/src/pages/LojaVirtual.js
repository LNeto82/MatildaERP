import React, { useState, useEffect } from 'react';
import api from '../services/api';
<link rel="manifest" href="/manifest.json" />
const customStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap');
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
  }

  /* ========== FUNDO COM EFEITO ESPELHADO E GRADIENTE SUTIL ========== */
  .page-container {
    min-height: 100vh;
    position: relative;
    overflow-x: hidden;
    background: linear-gradient(145deg, #f8f9fc 0%, #e9ecef 100%);
  }

  /* EFEITO DE ESPELHAMENTO/REFLEXO NA PARTE SUPERIOR */
  .page-container::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 300px;
    background: linear-gradient(180deg, rgba(212, 175, 55, 0.15) 0%, rgba(212, 175, 55, 0) 100%);
    pointer-events: none;
    z-index: 0;
  }

  /* ========== GLASSMORPHISM PERFEITO COM BLUR INTENSO ========== */
  .glass-panel {
    background: rgba(255, 255, 255, 0.45);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    border-radius: 28px;
    border: 1px solid rgba(255, 255, 255, 0.5);
    box-shadow: 0 20px 40px -12px rgba(0, 0, 0, 0.1), 
                0 1px 1px rgba(255, 255, 255, 0.6) inset;
    transition: all 0.4s cubic-bezier(0.2, 0.9, 0.4, 1.1);
  }

  .glass-panel:hover {
    background: rgba(255, 255, 255, 0.6);
    backdrop-filter: blur(24px) saturate(200%);
    box-shadow: 0 24px 48px -16px rgba(0, 0, 0, 0.15);
  }

  /* ========== GRADIENTES INSTAGRAM STORY (PERFEITOS) ========== */
  .btn-gradient {
    background: linear-gradient(115deg, #D4AF37 0%, #FFD93D 25%, #F5E56B 50%, #D4AF37 75%, #B8860B 100%);
    background-size: 250% 100%;
    color: #1a1a1a;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 1.2px;
    border: none;
    padding: 14px 28px;
    border-radius: 50px;
    cursor: pointer;
    transition: all 0.4s ease;
    position: relative;
    overflow: hidden;
    box-shadow: 0 4px 15px rgba(212, 175, 55, 0.35);
  }

  .btn-gradient::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
    transition: left 0.6s ease;
  }

  .btn-gradient:hover::before {
    left: 100%;
  }

  .btn-gradient:hover {
    background-position: 100% 0;
    transform: translateY(-3px);
    box-shadow: 0 8px 25px rgba(212, 175, 55, 0.5);
  }

  .btn-gradient:active {
    transform: translateY(1px);
  }

  /* BOTÃO SECUNDÁRIO COM VIDRO */
  .btn-glass {
    background: rgba(0, 0, 0, 0.65);
    backdrop-filter: blur(12px);
    color: #D4AF37;
    font-weight: 600;
    border: 1px solid rgba(212, 175, 55, 0.4);
    padding: 12px 24px;
    border-radius: 50px;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .btn-glass:hover {
    background: rgba(0, 0, 0, 0.8);
    border-color: #D4AF37;
    transform: scale(1.02);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  }

  /* ========== LAYOUT PRINCIPAL ========== */
  .split-layout {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 32px;
    padding: 32px 5%;
    max-width: 1400px;
    margin: 0 auto;
    position: relative;
    z-index: 2;
  }

  /* LISTA DE PRODUTOS */
  .coffee-list {
    display: flex;
    flex-direction: column;
    gap: 18px;
    max-height: 70vh;
    overflow-y: auto;
    padding-right: 8px;
  }

  .coffee-list::-webkit-scrollbar {
    width: 4px;
  }

  .coffee-list::-webkit-scrollbar-track {
    background: rgba(212, 175, 55, 0.1);
    border-radius: 10px;
  }

  .coffee-list::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, #D4AF37, #FFD700);
    border-radius: 10px;
  }

  /* CARD DE PRODUTO */
  .coffee-card {
    padding: 20px 24px;
    cursor: pointer;
    transition: all 0.35s cubic-bezier(0.2, 0.9, 0.4, 1.1);
    position: relative;
    border: 1px solid rgba(212, 175, 55, 0.15);
  }

  .coffee-card:hover {
    transform: translateX(12px) translateY(-4px);
    border-color: rgba(212, 175, 55, 0.4);
    box-shadow: 0 20px 35px -12px rgba(0, 0, 0, 0.2);
  }

  .coffee-card.active {
    background: linear-gradient(135deg, rgba(212, 175, 55, 0.18), rgba(255, 215, 0, 0.1));
    border-left: 4px solid #D4AF37;
    border-top-left-radius: 28px;
    border-bottom-left-radius: 28px;
  }

  /* PAINEL DE DETALHES */
  .details-panel {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 48px 36px;
    text-align: center;
    position: sticky;
    top: 100px;
    background: rgba(255, 255, 255, 0.5);
    backdrop-filter: blur(20px) saturate(180%);
    border: 1px solid rgba(212, 175, 55, 0.25);
  }

  /* HEADER */
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 18px 5%;
    background: rgba(255, 255, 255, 0.55);
    backdrop-filter: blur(20px) saturate(180%);
    border-bottom: 1px solid rgba(212, 175, 55, 0.2);
    position: sticky;
    top: 0;
    z-index: 100;
  }

  /* MODAL */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(12px);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    animation: fadeIn 0.25s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; backdrop-filter: blur(0px); }
    to { opacity: 1; backdrop-filter: blur(12px); }
  }

  /* INPUTS GLASS */
  .input-glass {
    width: 100%;
    padding: 14px 20px;
    margin-bottom: 16px;
    background: rgba(255, 255, 255, 0.85);
    border: 1.5px solid rgba(212, 175, 55, 0.25);
    border-radius: 50px;
    color: #1a1a1a;
    font-family: 'Montserrat', sans-serif;
    font-weight: 500;
    outline: none;
    transition: all 0.3s ease;
    font-size: 0.95rem;
  }

  .input-glass:focus {
    border-color: #D4AF37;
    box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.15);
    background: white;
  }

  /* BOTÃO PIX */
  .btn-pix {
    background: linear-gradient(135deg, #1a1a1a, #0a0a0a);
    color: #D4AF37;
    font-weight: 700;
    border: 1px solid rgba(212, 175, 55, 0.5);
    padding: 12px 24px;
    border-radius: 50px;
    cursor: pointer;
    transition: all 0.3s ease;
    width: 100%;
  }

  .btn-pix:hover {
    background: linear-gradient(135deg, #2a2a2a, #1a1a1a);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(212, 175, 55, 0.25);
  }

  /* BADGE CARRINHO */
  .cart-badge {
    position: relative;
  }

  .cart-count {
    position: absolute;
    top: -8px;
    right: -12px;
    background: linear-gradient(135deg, #D4AF37, #FFD700);
    color: #000;
    font-size: 11px;
    font-weight: 800;
    min-width: 20px;
    padding: 2px 6px;
    border-radius: 30px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  }

  /* 🌟 SELETOR DE QUANTIDADE PREMIUM VITRINE */
  .qty-selector {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 12px 0;
    background: rgba(255, 255, 255, 0.7);
    padding: 6px 14px;
    border-radius: 50px;
    border: 1px solid rgba(212, 175, 55, 0.25);
    width: fit-content;
  }

  .btn-qty {
    background: #D4AF37;
    color: #1a1a1a;
    border: none;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    font-weight: 900;
    font-size: 1rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }

  .btn-qty:hover {
    background: #B8860B;
    color: #fff;
    transform: scale(1.1);
  }

  .qty-value {
    font-weight: 800;
    font-size: 0.95rem;
    color: #1a1a1a;
    min-width: 18px;
    text-align: center;
  }

  /* ANIMAÇÕES */
  @keyframes pulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.08); opacity: 0.9; }
  }

  .coffee-icon {
    animation: pulse 3s ease-in-out infinite;
  }

  /* RESPONSIVO */
  @media (max-width: 900px) {
    .split-layout {
      grid-template-columns: 1fr;
      gap: 24px;
    }
    .details-panel {
      position: relative;
      top: 0;
    }
    .btn-gradient {
      padding: 10px 20px;
      font-size: 13px;
    }
  }
`;
const formatarMoeda = (valor) => Number(valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const WHATSAPP_LOJA = "5541997186301";
const CHAVE_PIX_ALEATORIA = "62482735000156";

const LojaVirtual = () => {
  const [produtos, setProdutos] = useState([]);
  const [selecionado, setSelecionado] = useState(null);
  const [carrinho, setCarrinho] = useState([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [sucessoCheckout, setSucessoCheckout] = useState(null);
  
  // 🌟 NOVO ESTADO: Controla a quantidade de pacotes do item ativo (Começa em 1)
  const [quantidadeItem, setQuantidadeItem] = useState(1);

  // 🌟 ATUALIZADO: Inclui o novo campo de método de envio exigido
  const [formCheckout, setFormCheckout] = useState({ 
    cliente_nome: '', 
    cliente_whats: '', 
    metodo_pagamento: 'pix',
    metodo_envio: '' 
  });

  useEffect(() => {
    api.get('/products')
      .then(res => {
        setProdutos(res.data);
        if (res.data.length > 0) setSelecionado(res.data[0]);
      })
      .catch(err => console.error(err));
  }, []);

  // 🌟 NOVO: Reseta o contador para 1 toda vez que clicar em outro café da lista
  useEffect(() => {
    setQuantidadeItem(1);
  }, [selecionado]);

  // 🌟 ATUALIZADO: Adiciona multiplicando pela quantidade escolhida nos botões + e -
  const adicionarAoCarrinho = () => {
    if (!selecionado) return;
    const itemExistente = carrinho.find(item => item.product_id === selecionado.id);

    if (itemExistente) {
      setCarrinho(carrinho.map(item => 
        item.product_id === selecionado.id 
          ? { ...item, quantidade: item.quantidade + quantidadeItem } 
          : item
      ));
    } else {
      setCarrinho([...carrinho, { 
        product_id: selecionado.id, 
        nome: selecionado.nome, 
        preco_venda: selecionado.preco_venda, 
        quantidade: quantidadeItem 
      }]);
    }
    setQuantidadeItem(1); // Reseta a prateleira de detalhes de volta para 1
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
  const totalItensNoCarrinho = carrinho.reduce((acc, item) => acc + item.quantidade, 0);  
  // 🌟 NOVO: Calcula dinamicamente o total de itens físicos na sacola para o botão do cabeçalho
  

  // 🌟 ATUALIZADO: Envia o método de envio e carimba o sucesso do checkout
  const finalizarCompra = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/orders', { items: carrinho, ...formCheckout });
      setSucessoCheckout({
        pedido_id: res.data.orderId,
        total: res.data.total,
        metodo: formCheckout.metodo_pagamento,
        nome_cliente: formCheckout.cliente_nome,
        metodo_envio: formCheckout.metodo_envio
      });
      setCarrinho([]);
      setFormCheckout({ cliente_nome: '', cliente_whats: '', metodo_pagamento: 'pix', metodo_envio: '' });
    } catch (error) {
      alert(error.response?.data?.erro || 'Erro ao finalizar pedido.');
    }
  };
 
  const copiarChavePix = () => {
    navigator.clipboard.writeText(CHAVE_PIX_ALEATORIA)
      .then(() => alert('✨ Chave PIX copiada com sucesso!'))
      .catch(() => alert('Erro ao copiar a chave PIX.'));
  };

  // 🌟 ATUALIZADO: Monta o texto do Whats com os itens e a opção de frete/uber/retirada
  const enviarParaWhatsApp = () => {
    if (!sucessoCheckout) return;
    
    const envioLabel = sucessoCheckout.metodo_envio === 'retirada' 
      ? '🛍️ Retirar no Mercado Municipal' 
      : '🚗 Entrega a combinar via WhatsApp (Uber / Troca de endereços)';

    const texto = `☕ *NOVO PEDIDO - MATILDA CAFÉ*\n\n` +
                  `👤 *Cliente:* ${sucessoCheckout.nome_cliente}\n` +
                  `🔢 *Pedido:* #${sucessoCheckout.pedido_id}\n` +
                  `💰 *Total:* R$ ${formatarMoeda(sucessoCheckout.total)}\n` +
                  `💳 *Pagamento:* ${sucessoCheckout.metodo.toUpperCase()}\n` +
                  `📦 *Forma de Envio:* ${envioLabel}`;
    
    const linkWhats = `https://wa.me/${WHATSAPP_LOJA}?text=${encodeURIComponent(texto)}`;
    window.open(linkWhats, '_blank');
    setSucessoCheckout(null);
    setModalAberto(false);
  };

  const fecharModalGeral = () => {
    setModalAberto(false);
    setSucessoCheckout(null);
  };

  const getTipoIcone = (tipo) => {
    if (tipo === 'drip_coffee') return 'fa-mug-hot';
    if (tipo === 'sache') return 'fa-bag-shopping';
    return 'fa-coffee';
  };

  const getTipoLabel = (tipo) => {
    if (tipo === 'drip_coffee') return '☕ Drip Coffee (10g)';
    if (tipo === 'sache') return 'Sachê / Drip';
    return 'Pacote 250g';
  };return (
    <div className="page-container">
      <style>{customStyles}</style>

      {/* HEADER */}
      <header className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <i className="fas fa-coffee coffee-icon" style={{ fontSize: '2rem', color: '#D4AF37' }}></i>
          <h1 style={{ margin: 0, fontWeight: 900, fontSize: '1.6rem', background: 'linear-gradient(135deg, #D4AF37, #8B6914)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            MATILDA CAFÉ
          </h1>
        </div>
        {/* 🌟 ATUALIZADO: Mostra a soma total de pacotes/itens físicos na sacola */}
        <button className="btn-gradient cart-badge" onClick={() => setModalAberto(true)}>
          <i className="fas fa-shopping-cart" style={{ marginRight: '8px' }}></i>
    
          CARRINHO ({totalItensNoCarrinho})
        </button>
      </header>

      <main className="split-layout">
        <div className="coffee-list">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', paddingLeft: '8px' }}>
            <i className="fas fa-crown" style={{ color: '#D4AF37', fontSize: '20px' }}></i>
            <h2 style={{ color: '#D4AF37', margin: 0, fontWeight: 700, letterSpacing: '-0.5px' }}>NOSSAS OPÇÕES</h2>
          </div>

          {produtos.length === 0 ? (
            <div className="glass-panel" style={{ padding: '50px', textAlign: 'center' }}>
              <i className="fas fa-spinner fa-pulse" style={{ fontSize: '2.5rem', color: '#D4AF37' }}></i>
              <p style={{ marginTop: '15px' }}>Carregando produtos...</p>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <i className={`fas ${getTipoIcone(p.tipo)}`} style={{ color: '#D4AF37', fontSize: '14px' }}></i>
                      <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1rem' }}>{p.nome}</h3>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: '#D4AF37', fontWeight: 600, opacity: 0.8 }}>
                      {getTipoLabel(p.tipo)}
                    </span>
                  </div>
                  <div style={{ fontWeight: 900, color: '#D4AF37', fontSize: '1.2rem' }}>
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
              <div style={{ marginBottom: '20px' }}>
                <i className={`fas ${getTipoIcone(selecionado.tipo)} coffee-icon`} style={{ fontSize: '5rem', color: '#D4AF37', marginBottom: '24px', display: 'inline-block' }}></i>
                <h1 style={{ fontWeight: 900, fontSize: '2rem', margin: '0 0 8px 0', color: '#1a1a1a' }}>
                  {selecionado.nome}
                </h1>
                <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#D4AF37', margin: '0 0 15px 0' }}>
                  R$ {formatarMoeda(selecionado.preco_venda)}
                </div>
                
                {/* 🌟 NOVO: Seletor de quantidade iniciando obrigatoriamente em 1 */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
                  <span style={{ fontSize: '0.8rem', color: '#666', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '5px' }}>Quantidade</span>
                  <div className="qty-selector">
                    <button type="button" className="btn-qty" onClick={() => setQuantidadeItem(Math.max(1, quantidadeItem - 1))}>-</button>
                    <span className="qty-value">{quantidadeItem}</span>
                    <button type="button" className="btn-qty" onClick={() => setQuantidadeItem(quantidadeItem + 1)}>+</button>
                  </div>
                </div>

                <div style={{ background: 'rgba(212, 175, 55, 0.08)', padding: '20px', borderRadius: '20px', marginBottom: '20px' }}>
                  <p style={{ lineHeight: '1.6', margin: 0, fontSize: '0.95rem', color: '#444' }}>
                    <i className="fas fa-quote-left" style={{ color: '#D4AF37', marginRight: '10px', opacity: 0.6 }}></i>
                    {selecionado.descricao || 'Café especial 100% Arábica, torrado artesanalmente para você.'}
                  </p>
                </div>
              </div>
              <button className="btn-gradient" style={{ width: '100%', fontSize: '1rem', padding: '16px' }} onClick={adicionarAoCarrinho}>
                <i className="fas fa-cart-plus" style={{ marginRight: '10px' }}></i>
                ADICIONAR AO CARRINHO
              </button>
            </>
          ) : (
            <div style={{ textxlign: 'center' }}>
              <i className="fas fa-hand-peace" style={{ fontSize: '4rem', color: '#D4AF37', marginBottom: '20px', opacity: 0.5 }}></i>
              <h3>Selecione um produto</h3>
              <p style={{ marginTop: '8px', opacity: 0.6 }}>para ver os detalhes</p>
            </div>
          )}
        </div>
      </main>

      {/* MODAL */}
      {modalAberto && (
        <div className="modal-overlay">
          <div className="glass-panel" style={{ width: '100%', maxWidth: '520px', padding: '32px', maxHeight: '85vh', overflowY: 'auto' }}>
            {sucessoCheckout ? (
              <div style={{ textAlign: 'center' }}>
                <i className="fas fa-check-circle" style={{ fontSize: '3.5rem', color: '#25D366', marginBottom: '12px' }}></i>
                <h2 style={{ fontWeight: 900 }}>Pedido #{sucessoCheckout.pedido_id}</h2>
                <p style={{ color: '#D4AF37', fontWeight: 600, marginBottom: '20px' }}>✓ Registrado!</p>
                {sucessoCheckout.metodo === 'pix' ? (
                  <div style={{ background: 'rgba(212,175,55,0.1)', padding: '20px', borderRadius: '20px', margin: '16px 0' }}>
                    <h3 style={{ marginBottom: '12px', color: '#D4AF37' }}>Pague via PIX</h3>
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(CHAVE_PIX_ALEATORIA)}`} alt="QR Code" style={{ borderRadius: '16px', marginBottom: '12px' }} />
                    <button className="btn-pix" onClick={copiarChavePix}>
                      <i className="fas fa-copy" style={{ marginRight: '8px' }}></i> COPIAR CHAVE PIX
                    </button>
                    <p style={{ marginTop: '12px', fontSize: '1.1rem', fontWeight: 'bold', color: '#25D366' }}>R$ {formatarMoeda(sucessoCheckout.total)}</p>
                  </div>
                ) : (
                  <div style={{ background: 'rgba(212,175,55,0.1)', padding: '20px', borderRadius: '20px', margin: '16px 0' }}>
                    <p>Pagamento na Entrega</p>
                    <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>R$ {formatarMoeda(sucessoCheckout.total)}</p>
                  </div>
                )}
                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                  <button className="btn-gradient" style={{ flex: 1, background: 'linear-gradient(135deg, #25D366, #128C7E)', color: 'white' }} onClick={enviarParaWhatsApp}>
                    <i className="fab fa-whatsapp"></i> WHATSAPP
                  </button>
                  <button className="btn-glass" onClick={fecharModalGeral}>FECHAR</button>
                </div>
              </div>
            ) : carrinho.length === 0 ? (
              <div style={{ textAlign: 'center' }}>
                <i className="fas fa-shopping-cart" style={{ fontSize: '3.5rem', color: '#ccc', marginBottom: '16px' }}></i>
                <h2>Carrinho vazio</h2>
                <button className="btn-gradient" style={{ marginTop: '20px', width: '100%' }} onClick={fecharModalGeral}>VOLTAR</button>
              </div>
            ) : (
              <form onSubmit={finalizarCompra}>
                <h2 style={{ textAlign: 'center', marginBottom: '20px', fontWeight: 900 }}>Finalizar Pedido</h2>
                <div style={{ background: 'rgba(212,175,55,0.08)', padding: '16px', borderRadius: '20px', marginBottom: '20px' }}>
                  <h4 style={{ marginBottom: '12px', color: '#D4AF37' }}>Resumo</h4>
                  {carrinho.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', padding: '6px 0', borderBottom: '1px solid rgba(212,175,55,0.15)' }}>
                      <span>{item.quantidade}x {item.nome}</span>
                      <div>
                        <span style={{ marginRight: '12px', color: '#D4AF37', fontWeight: 700 }}>R$ {formatarMoeda(item.preco_venda * item.quantidade)}</span>
                        <button type="button" onClick={() => removerDoCarrinho(item.product_id)} style={{ background: 'none', border: 'none', color: '#FF6B6B', cursor: 'pointer' }}>
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                  <div style={{ textAlign: 'right', marginTop: '12px', paddingTop: '8px', borderTop: '2px solid rgba(212,175,55,0.3)' }}>
                    <strong style={{ color: '#D4AF37' }}>TOTAL: R$ {formatarMoeda(totalCarrinho)}</strong>
                  </div>
                </div>
                <input className="input-glass" type="text" placeholder="Seu nome completo" value={formCheckout.cliente_nome} onChange={e => setFormCheckout({...formCheckout, cliente_nome: e.target.value})} required />
                <input className="input-glass" type="tel" placeholder="WhatsApp (apenas números)" value={formCheckout.cliente_whats} onChange={e => setFormCheckout({...formCheckout, cliente_whats: e.target.value})} required />
                
                <select className="input-glass" value={formCheckout.metodo_pagamento} onChange={e => setFormCheckout({...formCheckout, metodo_pagamento: e.target.value})}>
                  <option value="pix">💳 PIX</option>
                  <option value="dinheiro">💰 Dinheiro na Entrega</option>
                </select>

                {/* 🌟 NOVO: Seleção obrigatória do método de entrega negociada */}
                <select className="input-glass" value={formCheckout.metodo_envio} onChange={e => setFormCheckout({...formCheckout, metodo_envio: e.target.value})} required>
                  <option value="">Como deseja receber seu café?</option>
                  <option value="retirada">🛍️ Retirar no Mercado Municipal</option>
                  <option value="entrega">🚗 Entrega (A combinar endereço/Uber via WhatsApp)</option>
                </select>

                <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                  <button type="submit" className="btn-gradient" style={{ flex: 2 }}>FINALIZAR</button>
                  <button type="button" className="btn-glass" onClick={fecharModalGeral}>VOLTAR</button>
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