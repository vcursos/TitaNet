import React, { useState } from 'react';

interface PermissionItem {
    id: string;
    name: string;
    granted: boolean;
}

const initialPermissions: PermissionItem[] = [
    { id: 'dashboard', name: 'Acessar dashboard', granted: true },
    { id: 'customers', name: 'Gerenciar clientes', granted: false },
    { id: 'technicians', name: 'Gerenciar técnicos', granted: false },
];

const Permissions: React.FC = () => {
    const [permissions, setPermissions] = useState<PermissionItem[]>(initialPermissions);

    const handlePermissionChange = (id: string, value: boolean) => {
        setPermissions((prev) =>
            prev.map((p) => (p.id === id ? { ...p, granted: value } : p)),
        );
    };

    const handleSave = () => {
        // No backend yet; just log for now.
        console.log('Permissões salvas (mock):', permissions);
        alert('Permissões salvas (exemplo). Integração real virá depois.');
    };

    return (
        <div style={{ padding: '1rem' }}>
            <h1>Permissões de Usuário</h1>
            <ul>
                {permissions.map((permission) => (
                    <li key={permission.id}>
                        <label>
                            <input
                                type="checkbox"
                                checked={permission.granted}
                                onChange={(e) => handlePermissionChange(permission.id, e.target.checked)}
                            />
                            {permission.name}
                        </label>
                    </li>
                ))}
            </ul>
            <button onClick={handleSave}>Salvar alterações</button>
        </div>
    );
};

export default Permissions;