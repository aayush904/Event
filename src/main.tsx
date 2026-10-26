import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './styles/global.css';
import './styles/pages.css';
import { StoreProvider } from './lib/store';
import { ToastProvider } from './components/Toast';
import Layout, { RequireAuth } from './components/Layout';
import Home from './pages/Home';
import Search from './pages/Search';
import EventPage from './pages/EventPage';
import OrganizerPage from './pages/OrganizerPage';
import { Login, Signup } from './pages/Auth';
import { Tickets, TicketDetail } from './pages/Tickets';
import { Likes, Following } from './pages/Saved';
import Account from './pages/Account';
import ManageEvents from './pages/organizer/ManageEvents';
import EventEditor from './pages/organizer/EventEditor';
import EventDashboard from './pages/organizer/EventDashboard';
import OrganizerProfile from './pages/organizer/OrganizerProfile';
import { Help, Pricing, NotFound } from './pages/Static';

const auth = (el: JSX.Element) => <RequireAuth>{el}</RequireAuth>;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <StoreProvider>
        <ToastProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="search" element={<Search />} />
              <Route path="e/:id" element={<EventPage />} />
              <Route path="o/:id" element={<OrganizerPage />} />
              <Route path="login" element={<Login />} />
              <Route path="signup" element={<Signup />} />
              <Route path="tickets" element={auth(<Tickets />)} />
              <Route path="tickets/:orderId" element={auth(<TicketDetail />)} />
              <Route path="likes" element={auth(<Likes />)} />
              <Route path="following" element={auth(<Following />)} />
              <Route path="account" element={auth(<Account />)} />
              <Route path="organizer/events" element={auth(<ManageEvents />)} />
              <Route path="organizer/events/new" element={auth(<EventEditor />)} />
              <Route path="organizer/events/:id/edit" element={auth(<EventEditor />)} />
              <Route path="organizer/events/:id" element={auth(<EventDashboard />)} />
              <Route path="organizer/profile" element={auth(<OrganizerProfile />)} />
              <Route path="help" element={<Help />} />
              <Route path="pricing" element={<Pricing />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </ToastProvider>
      </StoreProvider>
    </BrowserRouter>
  </StrictMode>,
);
