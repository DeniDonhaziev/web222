import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './app/AppShell';
import { ProtectedRoute } from './app/ProtectedRoute';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { CustomerOrders } from './pages/customer/CustomerOrders';
import { NewOrder } from './pages/customer/NewOrder';
import { OrderTracking } from './pages/customer/OrderTracking';
import { ExecutorDashboard } from './pages/executor/ExecutorDashboard';
import { Drones } from './pages/executor/Drones';
import { OrderDelivery } from './pages/executor/OrderDelivery';
import { Earnings } from './pages/executor/Earnings';
import { AdminOverview } from './pages/admin/AdminOverview';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminExecutorVerification } from './pages/admin/AdminExecutorVerification';
import { AdminOrders } from './pages/admin/AdminOrders';
import { AdminLiveMap } from './pages/admin/AdminLiveMap';

export default function App() {
  return (
    <Routes>
      {/* Live-карта — полноэкранная, без общего хедера/контейнера AppShell */}
      <Route element={<ProtectedRoute allow={['admin']} />}>
        <Route path="/admin/live" element={<AdminLiveMap />} />
      </Route>

      <Route element={<AppShell />}>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<ProtectedRoute allow={['customer']} />}>
          <Route path="/customer" element={<CustomerOrders />} />
          <Route path="/customer/new-order" element={<NewOrder />} />
          <Route path="/customer/orders/:id" element={<OrderTracking />} />
        </Route>

        <Route element={<ProtectedRoute allow={['executor']} />}>
          <Route path="/executor" element={<ExecutorDashboard />} />
          <Route path="/executor/drones" element={<Drones />} />
          <Route path="/executor/orders/:id" element={<OrderDelivery />} />
          <Route path="/executor/earnings" element={<Earnings />} />
        </Route>

        <Route element={<ProtectedRoute allow={['admin']} />}>
          <Route path="/admin" element={<AdminOverview />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/executors" element={<AdminExecutorVerification />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
