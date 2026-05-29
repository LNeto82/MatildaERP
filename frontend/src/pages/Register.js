import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const Register = () => {
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [telefone, setTelefone] = useState('');
    const [mensagem, setMensagem] = useState('');
    const [erro, setErro] = useState('');
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        setErro(''); setMensagem('');
        try {
            await api.post('/auth/register', { nome, email, senha, telefone });
            setMensagem('Cadastro realizado! Redirecionando...');
            setTimeout(() => navigate('/login'), 2000);
        } catch (error) {
            setErro(error.response?.data?.erro || 'Erro ao cadastrar.');
        }
    };

    const inputDarkStyle = { background: 'var(--dark)', border: '1px solid var(--glass-border)', color: 'var(--light)', padding: '1rem', borderRadius: '8px', width: '100%', marginBottom: '15px', outline: 'none' };

    return (
        <div className="fade-in-up" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
            <div className="glass-card" style={{ width: '100%', maxWidth: '450px', padding: '3rem', borderTop: '4px solid var(--secondary)' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{ fontSize: '3rem', color: 'var(--secondary)', marginBottom: '1rem' }}><i className="fas fa-user-plus"></i></div>
                    <h2 className="card-title-ultra" style={{ fontSize: '2rem' }}>Criar Conta</h2>
                    <p style={{ color: 'var(--gray)' }}>Junte-se aos amantes de café</p>
                </div>
                
                {erro && <div style={{ background: 'rgba(255, 107, 107, 0.1)', border: '1px solid var(--accent)', color: 'var(--accent)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', textAlign: 'center' }}>{erro}</div>}
                {mensagem && <div style={{ background: 'rgba(0, 212, 170, 0.1)', border: '1px solid var(--primary)', color: 'var(--primary)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', textAlign: 'center' }}>{mensagem}</div>}
                
                <form onSubmit={handleRegister}>
                    <input type="text" placeholder="Nome Completo" value={nome} onChange={(e) => setNome(e.target.value)} required style={inputDarkStyle} />
                    <input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputDarkStyle} />
                    <input type="password" placeholder="Senha" value={senha} onChange={(e) => setSenha(e.target.value)} required style={inputDarkStyle} />
                    <input type="text" placeholder="WhatsApp (Ex: 41999999999)" value={telefone} onChange={(e) => setTelefone(e.target.value)} required style={inputDarkStyle} />
                    
                    <button type="submit" className="btn btn-primary" style={{ background: 'var(--secondary)', width: '100%', padding: '1rem', fontSize: '1.1rem', marginTop: '10px' }}>
                        <i className="fas fa-check-circle"></i> Cadastrar
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '2rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem' }}>
                    <span style={{ color: 'var(--gray)' }}>Já tem uma conta? </span>
                    <Link to="/login" style={{ color: 'var(--secondary)', textDecoration: 'none', fontWeight: '600' }}>Faça Login</Link>
                </div>
            </div>
        </div>
    );
};

export default Register;