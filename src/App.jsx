import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import Home from './pages/Home';
import AddMotor from './pages/AddMotor';
import AddService from './pages/AddService';
import MotorDetail from './pages/MotorDetail';
import Settings from './pages/Settings';
import AddOdometer from './pages/AddOdometer';
import { Statistics } from './pages/Statistics';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="add-motor" element={<AddMotor />} />
          <Route path="motor/:id" element={<MotorDetail />} />
          <Route path="add-service" element={<AddService />} />
          <Route path="add-odometer" element={<AddOdometer />} />
          <Route path="settings" element={<Settings />} />
          <Route path="statistics" element={<Statistics />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
