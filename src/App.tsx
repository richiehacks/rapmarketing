import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@/contexts/ThemeProvider';
import { Layout } from '@/components/layout/Layout';
import { Dashboard } from '@/pages/Dashboard';
import { DataManagement } from '@/pages/DataManagement';
import { LinkedInCampaigns } from '@/pages/LinkedInCampaigns';
import { EmailCampaigns } from '@/pages/EmailCampaigns';
import { Webinars } from '@/pages/Webinars';
import { OtherCampaigns } from '@/pages/OtherCampaigns';
import { DataUpload } from '@/pages/DataUpload';
import { Settings } from '@/pages/Settings';
import { Toaster } from '@/components/ui/sonner';
import './App.css';

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="rap-ui-theme">
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/data" element={<DataManagement />} />
            <Route path="/linkedin" element={<LinkedInCampaigns />} />
            <Route path="/email" element={<EmailCampaigns />} />
            <Route path="/webinars" element={<Webinars />} />
            <Route path="/campaigns" element={<OtherCampaigns />} />
            <Route path="/upload" element={<DataUpload />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Layout>
        <Toaster />
      </Router>
    </ThemeProvider>
  );
}

export default App;