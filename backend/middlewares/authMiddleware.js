const jwt = require('jsonwebtoken');

// Verifica se o usuário está logado (tem um token válido)
const verificarToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader) {
        return res.status(403).json({ erro: 'Nenhum token fornecido. Faça login.' });
    }

    const token = authHeader.split(' ')[1]; // Pega apenas o token, ignorando a palavra "Bearer"

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ erro: 'Token inválido ou expirado.' });
        }
        
        // Salva os dados do usuário na requisição para usarmos nas próximas rotas
        req.userId = decoded.id;
        req.userRole = decoded.role;
        next();
    });
};

// Verifica se o usuário logado é Admin (Marcelli)
const verificarAdmin = (req, res, next) => {
    if (req.userRole !== 'admin') {
        return res.status(403).json({ erro: 'Acesso negado. Área restrita para administradores.' });
    }
    next();
};

module.exports = { verificarToken, verificarAdmin };