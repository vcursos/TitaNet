import React, { useEffect, useMemo, useState } from 'react';
import {
    BrowserRouter as Router,
    Link,
    Redirect,
    Route,
    Switch,
    useHistory,
    useLocation,
} from 'react-router-dom';
import { MENU_ITEMS } from '../../config/menu';
import { hasPermission, ROLE_LABELS, UserRole } from '../../config/permissions';
import Dashboard from '../../pages/dashboard';
import Customers from '../../pages/customers';
import Orders from '../../pages/orders';
import Technicians from '../../pages/technicians';
import Network from '../../pages/network';
import Billing from '../../pages/billing';
import Plans from '../../pages/plans';
import Stock from '../../pages/stock';
import Reports from '../../pages/reports';
import Permissions from '../../pages/permissions';
import Users from '../../pages/users';
import Integrations from '../../pages/integrations';
import Forbidden from '../../pages/forbidden';

interface SideMenuProps {
    role: UserRole;
}

interface ProtectedRouteProps {
    role: UserRole;
    permission: string;
    path: string;
    exact?: boolean;
    component: React.ComponentType<any>;
}

const SideMenu: React.FC<SideMenuProps> = ({ role }) => {
    const location = useLocation();
    const allowedItems = useMemo(
        () => MENU_ITEMS.filter((item) => hasPermission(role, item.permission)),
        [role],
    );

    return (
        <nav>
            {allowedItems.length === 0 && (
                <div
                    style={{
                        background: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: 8,
                        padding: '0.7rem',
                        marginBottom: '0.8rem',
                        color: '#cbd5e1',
                        fontSize: '0.85rem',
                    }}
                >
                    Este perfil não possui módulos liberados.
                </div>
            )}

            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.5rem' }}>
                {allowedItems.map((item) => {
                    const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);

                    return (
                        <li key={item.key}>
                            <Link
                                style={{
                                    display: 'block',
                                    color: isActive ? '#0f172a' : '#cbd5e1',
                                    background: isActive ? '#e2e8f0' : 'transparent',
                                    borderRadius: 6,
                                    padding: '0.4rem 0.55rem',
                                    textDecoration: 'none',
                                    fontWeight: isActive ? 700 : 500,
                                }}
                                to={item.path}
                                title={item.permission}
                            >
                                {item.label}
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
};

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    role,
    permission,
    path,
    exact,
    component: Component,
}) => {
    return (
        <Route
            exact={exact}
            path={path}
            render={(props) =>
                hasPermission(role, permission)
                    ? <Component {...props} />
                    : <Redirect to="/forbidden" />
            }
        />
    );
};

const LayoutContent: React.FC = () => {
    const history = useHistory();
    const location = useLocation();
    const [role, setRole] = useState<UserRole>(() => {
        const saved = window.localStorage.getItem('mock-user-role');
        if (saved === 'admin' || saved === 'financeiro' || saved === 'suporte') {
            return saved;
        }
        return 'admin';
    });

    const allowedItems = useMemo(
        () => MENU_ITEMS.filter((item) => hasPermission(role, item.permission)),
        [role],
    );

    const firstAllowedPath = allowedItems[0]?.path || '/forbidden';

    useEffect(() => {
        window.localStorage.setItem('mock-user-role', role);
    }, [role]);

    useEffect(() => {
        if (location.pathname === '/' || location.pathname === '/forbidden') {
            return;
        }

        const currentMenu = MENU_ITEMS.find((item) => item.path === location.pathname);
        if (!currentMenu) {
            return;
        }

        if (!hasPermission(role, currentMenu.permission)) {
            history.replace('/forbidden');
        }
    }, [history, location.pathname, role]);

    return (
        <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Segoe UI, sans-serif' }}>
            <aside style={{ width: '240px', background: '#0f172a', color: '#e2e8f0', padding: '1rem' }}>
                <h2 style={{ marginTop: 0, color: '#fff' }}>ISP Admin</h2>
                <p style={{ fontSize: '0.85rem', opacity: 0.85 }}>Painel administrativo</p>
                <SideMenu role={role} />
            </aside>

            <main style={{ flex: 1, background: '#f8fafc' }}>
                <header
                    style={{
                        borderBottom: '1px solid #e2e8f0',
                        padding: '0.9rem 1.2rem',
                        background: '#fff',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '1rem',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <strong>Provedor ISP 2.0</strong>
                        <span
                            style={{
                                fontSize: '0.78rem',
                                padding: '0.2rem 0.45rem',
                                borderRadius: 999,
                                background: '#e2e8f0',
                                color: '#334155',
                                textTransform: 'uppercase',
                                letterSpacing: '0.03em',
                                fontWeight: 700,
                            }}
                        >
                            {ROLE_LABELS[role]}
                        </span>
                    </div>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ color: '#475569', fontSize: '0.9rem' }}>Perfil mock:</span>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value as UserRole)}
                            style={{ padding: '0.35rem 0.5rem' }}
                        >
                            {(Object.keys(ROLE_LABELS) as UserRole[]).map((roleKey) => (
                                <option key={roleKey} value={roleKey}>
                                    {ROLE_LABELS[roleKey]}
                                </option>
                            ))}
                        </select>
                    </label>
                </header>

                <Switch>
                    <Route exact path="/">
                        <Redirect to={firstAllowedPath} />
                    </Route>

                    <ProtectedRoute role={role} path="/dashboard" permission="dashboard:view" component={Dashboard} />
                    <ProtectedRoute role={role} path="/customers" permission="customers:view" component={Customers} />
                    <ProtectedRoute role={role} path="/orders" permission="orders:view" component={Orders} />
                    <ProtectedRoute role={role} path="/technicians" permission="technicians:view" component={Technicians} />
                    <ProtectedRoute role={role} path="/network" permission="network:view" component={Network} />
                    <ProtectedRoute role={role} path="/billing" permission="billing:view" component={Billing} />
                    <ProtectedRoute role={role} path="/plans" permission="plans:view" component={Plans} />
                    <ProtectedRoute role={role} path="/stock" permission="stock:view" component={Stock} />
                    <ProtectedRoute role={role} path="/reports" permission="reports:view" component={Reports} />
                    <ProtectedRoute role={role} path="/permissions" permission="permissions:view" component={Permissions} />
                    <ProtectedRoute role={role} path="/users" permission="users:view" component={Users} />
                    <ProtectedRoute role={role} path="/integrations" permission="integrations:view" component={Integrations} />

                    <Route path="/forbidden" component={Forbidden} />
                    <Redirect to={firstAllowedPath} />
                </Switch>
            </main>
        </div>
    );
};

const Layout: React.FC = () => {
    return (
        <Router>
            <LayoutContent />
        </Router>
    );
};

export default Layout;