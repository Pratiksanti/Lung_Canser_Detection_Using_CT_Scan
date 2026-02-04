import { Routes, Route } from "react-router-dom";
import Navbar from "./Components/Navbar/Navbar";
import HomeContent from "./Components/HomeContent/HomeContent";
import Footer from "./Components/Footer/Footer";
import Upload from "./Components/Upload/Upload";
import Login from "./Components/Login/Login";
import Contact from "./Components/Contact/Contact";
import Symptoms from "./Components/Symptoms/symptoms";
import Research from "./Components/Research/Research";
import Prevention from "./Components/Preventation/preventation";
import DoctorRoute from "./Components/Doctor/DoctorRoute";
import Result from "./Components/Result/Result";
import SaveReport from "./Components/SaveReport/SaveReport";

import "./App.css";

function App() {
  return (
    <div className="app">
      <Navbar />

      <main>
        <Routes>
          <Route path="/" element={<HomeContent />} />

          {/* Upload Page */}
          <Route
            path="/upload"
            element={
              <DoctorRoute>
                <Upload />
              </DoctorRoute>
            }
          />

          {/* Result Page */}
          <Route
            path="/result"
            element={
              <DoctorRoute>
                <Result />
              </DoctorRoute>
            }
          />
          <Route
            path="/save-report"
            element={
              <DoctorRoute>
                <SaveReport />
              </DoctorRoute>
            }
          />

          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/symptoms" element={<Symptoms />} />
          <Route path="/research" element={<Research />} />
          <Route path="/prevention" element={<Prevention />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

export default App;
