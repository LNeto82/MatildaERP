import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const Login = () => {
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/auth/login', { email, senha });
            
            // 1. Salva a "chave" de que você é o Admin no navegador
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            
            // 2. Trava de segurança: Espera 100ms para garantir que salvou antes de mudar de tela
            setTimeout(() => {
                if (res.data.user.role === 'admin') {
                    navigate('/dashboard'); // Vai para o Painel
                } else {
                    navigate('/'); // Vai para a Loja
                }
            }, 100);

        } catch (error) {
            alert('Acesso negado. Verifique seu email ou senha.');
        }
    };

    return (
        <div style={{ background: '#050505', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: 'sans-serif' }}>
            <div style={{ background: '#0A0A0A', padding: '3rem', borderRadius: '20px', border: '1px solid #D4AF37', width: '100%', maxWidth: '400px', textAlign: 'center', boxShadow: '0 0 30px rgba(212,175,55,0.1)' }}>
                <i className="fas fa-crown" style={{ fontSize: '3rem', color: '#D4AF37', marginBottom: '1rem' }}></i>
                <h2 style={{ color: '#fff', letterSpacing: '2px', marginBottom: '5px' }}>ÁREA RESTRITA</h2>
                <p style={{ color: '#94A3B8', fontSize: '0.9rem', marginBottom: '2rem' }}>Cantinho da Matilda</p>

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <input type="email" placeholder="Seu E-mail de Admin" value={email} onChange={e => setEmail(e.target.value)} required style={{ background: '#000', border: '1px solid #333', color: '#fff', padding: '15px', borderRadius: '10px', outline: 'none' }} />
                    <input type="password" placeholder="Sua Senha" value={senha} onChange={e => setSenha(e.target.value)} required style={{ background: '#000', border: '1px solid #333', color: '#fff', padding: '15px', borderRadius: '10px', outline: 'none' }} />
                    <button type="submit" style={{ background: 'linear-gradient(135deg, #D4AF37, #B8860B)', color: '#000', border: 'none', padding: '15px', borderRadius: '10px', fontWeight: '900', cursor: 'pointer', marginTop: '10px', textTransform: 'uppercase' }}>Entrar no Painel</button>
                </form>
                <button onClick={() => navigate('/')} style={{ background: 'transparent', border: 'none', color: '#666', marginTop: '20px', cursor: 'pointer', textDecoration: 'underline' }}>Voltar para a Loja</button>
            </div>
        </div>
    );
};

export default Login;