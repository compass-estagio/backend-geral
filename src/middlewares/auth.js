import jwt from 'jsonwebtoken';
import config from '../config/index.js';

/**
 * Middleware de autenticação JWT
 * Verifica se o token JWT é válido
 */
export const authenticateToken = (req, res, next) => {
  // Busca o token no header Authorization
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      error: 'Token não fornecido',
      message: 'Acesso negado. Token de autenticação não encontrado.',
    });
  }

  try {
    // Verifica e decodifica o token
    const decoded = jwt.verify(token, config.jwtSecret);

    // Adiciona os dados do usuário na requisição
    req.user = {
      id: decoded.id,
      cpf: decoded.cpf,
      email: decoded.email,
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expirado',
        message: 'Seu token expirou. Por favor, faça login novamente.',
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({
        error: 'Token inválido',
        message: 'Token de autenticação inválido.',
      });
    }

    return res.status(500).json({
      error: 'Erro no servidor',
      message: 'Erro ao validar token de autenticação.',
    });
  }
};

/**
 * Middleware opcional de autenticação
 * Permite acesso sem token, mas adiciona dados do usuário se token válido
 */
export const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = {
      id: decoded.id,
      cpf: decoded.cpf,
      email: decoded.email,
    };
  } catch (error) {
    // Ignora erros de token em autenticação opcional
  }

  next();
};
