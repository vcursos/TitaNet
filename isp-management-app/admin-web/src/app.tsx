import React from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';

const App: React.FC = () => {
  return (
    <Router>
      <Switch>
        <Route path="/">
          <div style={{ fontFamily: 'sans-serif', padding: '1rem' }}>
            <h1>ISP Admin Web</h1>
            <p>Painel administrativo inicial. Em breve vamos adicionar dashboard, clientes, técnicos, rede e faturamento.</p>
          </div>
        </Route>
      </Switch>
    </Router>
  );
};

export default App;
