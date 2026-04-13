import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MENU_ITEMS } from '../config/menu';
import { hasPermission, UserRole } from '../config/permissions';

const Forbidden: React.FC = () => {
  const fallbackPath = useMemo(() => {
    const saved = window.localStorage.getItem('mock-user-role');
    const role: UserRole = saved === 'financeiro' || saved === 'suporte' ? saved : 'admin';

    const firstAllowed = MENU_ITEMS.find((item) => hasPermission(role, item.permission));
    return firstAllowed?.path || '/';
  }, []);

  return (
    <div style={{ padding: '1.25rem', maxWidth: 720 }}>
      <h1>Acesso negado</h1>
      <p>Seu perfil atual não tem permissão para acessar esta área.</p>
      <p>Troque o perfil no canto superior direito para simular outro nível de acesso.</p>

      <div style={{ marginTop: '1rem', display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
        <Link
          to={fallbackPath}
          style={{
            textDecoration: 'none',
            background: '#0f766e',
            color: '#fff',
            padding: '0.45rem 0.7rem',
            borderRadius: 8,
            fontWeight: 600,
          }}
        >
          Voltar para área permitida
        </Link>
      </div>
    </div>
  );
};

export default Forbidden;
