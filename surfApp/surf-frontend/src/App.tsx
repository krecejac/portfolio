import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import SpotDetailPage from "./pages/SpotDetailPage";
import AboutPage from "./pages/AboutPage";
import LearnPage from "./pages/LearnPage";
import MapsPage from "./pages/MapsPage";
import CamsPage from "./pages/CamsPage";

// Route table. The Layout route wraps every page (shared navbar/footer/auth);
// its children render into the Layout's <Outlet/> depending on the URL:
//   "/"          -> HomePage
//   "/spot/:id"  -> SpotDetailPage  (:id is read from the URL)
function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="/spot/:id" element={<SpotDetailPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/learn" element={<LearnPage />} />
        <Route path="/maps" element={<MapsPage />} />
        <Route path="/cams" element={<CamsPage />} />
      </Route>
    </Routes>
  );
}

export default App;
