import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  // Verificar si hay una sesión activa al cargar o recargar la aplicación en el navegador
  const verificarSesion = async () => {
    try {
      const res = await api.get('/api/auth/me');
      if (res.ok && res.usuario) {
        setUsuario(res.usuario);
      } else {
        setUsuario(null);
      }
    } catch {
      // Si la cookie no existe o expiró, simplemente el usuario no está autenticado
      setUsuario(null);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    verificarSesion();
  }, []);

  // Función de inicio de sesión
  const login = async (nombreUsuario, password) => {
    const res = await api.post('/api/auth/login', {
      usuario: nombreUsuario,
      password,
    });
    if (res.ok && res.usuario) {
      setUsuario(res.usuario);
      return res.usuario;
    }
    throw new Error(res.mensaje || 'Error al iniciar sesión.');
  };

  // Función de cierre de sesión
  const logout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (err) {
      console.warn('Error al cerrar sesión en el servidor:', err.message);
    } finally {
      setUsuario(null);
    }
  };

  // Actualizar datos del usuario en memoria (ej. cambio de foto de perfil)
  const actualizarUsuarioLocal = (datosNuevos) => {
    setUsuario((prev) => (prev ? { ...prev, ...datosNuevos } : null));
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        cargando,
        estaAutenticado: !!usuario,
        esAdmin: usuario?.rol === 'admin',
        login,
        logout,
        actualizarUsuarioLocal,
        verificarSesion,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Hook personalizado para consumir el contexto de autenticación
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider.');
  }
  return context;
}

export default AuthContext;
