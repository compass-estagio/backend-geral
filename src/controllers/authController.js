import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import config from '../config/index.js';

/**
 * Gera token JWT para o usuário
 * @param {Object} user - Dados do usuário
 * @returns {string} Token JWT
 */
const generateToken = (user) => {
  const payload = {
    id: user.id,
    cpf: user.cpf,
    email: user.email,
  };

  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
};

/**
 * Registro de novo usuário
 * @route POST /api/auth/register
 */
export const register = async (req, res) => {
  try {
    const { cpf, name, email, password } = req.body;

    // Validação dos campos obrigatórios
    if (!cpf || !name || !email || !password) {
      return res.status(400).json({
        error: 'Campos obrigatórios faltando',
        message: 'CPF, nome, email e senha são obrigatórios.',
      });
    }

    // Remove caracteres não numéricos do CPF
    const cleanCpf = cpf.replace(/\D/g, '');

    // Valida senha (mínimo 6 caracteres)
    if (password.length < 6) {
      return res.status(400).json({
        error: 'Senha fraca',
        message: 'A senha deve ter no mínimo 6 caracteres.',
      });
    }

    // Verifica se CPF já existe
    const existingUserByCpf = await User.findByCpf(cleanCpf);
    if (existingUserByCpf) {
      return res.status(409).json({
        error: 'CPF já cadastrado',
        message: 'Já existe um usuário com este CPF.',
      });
    }

    // Verifica se email já existe
    const existingUserByEmail = await User.findByEmail(email);
    if (existingUserByEmail) {
      return res.status(409).json({
        error: 'Email já cadastrado',
        message: 'Já existe um usuário com este email.',
      });
    }

    // Cria o usuário
    const user = await User.create({
      cpf: cleanCpf,
      name,
      email,
      password,
    });

    // Gera token
    const token = generateToken(user);

    res.status(201).json({
      message: 'Usuário criado com sucesso',
      user: {
        id: user.id,
        cpf: user.cpf,
        name: user.name,
        email: user.email,
        created_at: user.created_at,
      },
      token,
    });
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({
      error: 'Erro no servidor',
      message: 'Erro ao criar usuário. Tente novamente.',
    });
  }
};

/**
 * Login de usuário
 * @route POST /api/auth/login
 */
export const login = async (req, res) => {
  try {
    const { cpf, password } = req.body;

    // Validação dos campos obrigatórios
    if (!cpf || !password) {
      return res.status(400).json({
        error: 'Campos obrigatórios faltando',
        message: 'CPF e senha são obrigatórios.',
      });
    }

    // Remove caracteres não numéricos do CPF
    const cleanCpf = cpf.replace(/\D/g, '');

    // Busca usuário por CPF
    const user = await User.findByCpf(cleanCpf);
    if (!user) {
      return res.status(401).json({
        error: 'Credenciais inválidas',
        message: 'CPF ou senha incorretos.',
      });
    }

    // Verifica a senha
    const isPasswordValid = await User.comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Credenciais inválidas',
        message: 'CPF ou senha incorretos.',
      });
    }

    // Gera token
    const token = generateToken(user);

    res.status(200).json({
      message: 'Login realizado com sucesso',
      user: {
        id: user.id,
        cpf: user.cpf,
        name: user.name,
        email: user.email,
      },
      token,
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({
      error: 'Erro no servidor',
      message: 'Erro ao fazer login. Tente novamente.',
    });
  }
};

/**
 * Retorna dados do usuário autenticado
 * @route GET /api/auth/me
 */
export const getMe = async (req, res) => {
  try {
    // req.user é adicionado pelo middleware authenticateToken
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        error: 'Usuário não encontrado',
        message: 'Usuário não existe.',
      });
    }

    res.status(200).json({
      user: {
        id: user.id,
        cpf: user.cpf,
        name: user.name,
        email: user.email,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
    });
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({
      error: 'Erro no servidor',
      message: 'Erro ao buscar dados do usuário.',
    });
  }
};
