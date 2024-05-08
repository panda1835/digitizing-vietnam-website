import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./tailwind.css";

import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import AboutUs from "./pages/AboutUs";
import OurCollection from "./pages/OurCollection";
import Blog from "./pages/Blog";
import ContactUs from "./pages/ContactUs";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      scaleTime: Infinity,
      cacheTime: Infinity,
    },
  },
});

const App = () => {
  return (
    <div className="page">
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <div className="page-content">
            <Header />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about-us" element={<AboutUs />} />
              <Route path="/our-collections" element={<OurCollection />} />
              <Route path="/blogs" element={<Blog />} />
              <Route path="/contact-us" element={<ContactUs />} />
            </Routes>
          </div>
          <Footer />
        </QueryClientProvider>
      </BrowserRouter>
    </div>
  );
};

const container = document.getElementById("root");
const root = createRoot(container);
root.render(<App />);
