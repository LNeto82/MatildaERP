import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import LojaVirtual from './pages/LojaVirtual';
import Login from './pages/Login';
import DashboardAdmin from './pages/DashboardAdmin';

function App() {
  return (
    <Router>
      <Routes>
        {/* A Rota Principal (/) DEVE carregar a Loja Virtual */}
        <Route path="/" element={<LojaVirtual />} />

        {/* A Tela de Login */}
        <Route path="/login" element={<Login />} />

        {/* O Painel de Controle */}
        <Route path="/dashboard" element={<DashboardAdmin />} />
      </Routes>
    </Router>
  );
}

export default App;