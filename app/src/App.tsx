import { Routes, Route } from 'react-router-dom';
import { AppProvider } from './store/AppContext';
import { DeviceListPage } from './pages/DeviceListPage';
import { AddDevicePage } from './pages/AddDevicePage';
import { InputPage } from './pages/InputPage';
import { SettingsPage } from './pages/SettingsPage';

function App() {
  return (
    <AppProvider>
      <div className="app">
        <Routes>
          <Route path="/" element={<DeviceListPage />} />
          <Route path="/add-device" element={<AddDevicePage />} />
          <Route path="/input/:deviceId" element={<InputPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </div>
    </AppProvider>
  );
}

export default App;
