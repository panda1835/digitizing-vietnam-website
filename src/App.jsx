import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { I18nextProvider } from "react-i18next";
import i18n from "./utils/i18n";

import "./tailwind.css";

import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import AboutUs from "./pages/AboutUs";
import OurCollections from "./pages/OurCollections";
import EachCollection from "./pages/EachCollection";
import CollectionItemViewer from "./pages/CollectionItemViewer";
import Tools from "./pages/Tools";
import Blogs from "./pages/Blogs";
import BlogArticle from "./pages/BlogArticle";
import OnlineResources from "./pages/OnlineResources";
import GachBongTop from "./components/GachBongTop";
import GachBongBottom from "./components/GachBongBottom";

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
    <I18nextProvider i18n={i18n}>
      <div className="page">
        <BrowserRouter>
          <QueryClientProvider client={queryClient}>
            <div className="page-content">
              <Header />
              <GachBongTop />
              <div className="mb-10"></div>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/about-us" element={<AboutUs />} />
                <Route path="/our-collections" element={<OurCollections />} />
                <Route
                  path="/our-collections/:collectionId"
                  element={<EachCollection />}
                />
                <Route
                  path="/our-collections/:collectionId/:documentId"
                  element={<CollectionItemViewer />}
                />
                <Route path="/tools" element={<Tools />} />
                <Route path="/blogs" element={<Blogs />} />
                <Route path="/blogs/:id" element={<BlogArticle />} />
                <Route path="/online-resources" element={<OnlineResources />} />
              </Routes>
            </div>
            <GachBongBottom />
            <Footer />
          </QueryClientProvider>
        </BrowserRouter>
      </div>
    </I18nextProvider>
  );
};

const container = document.getElementById("root");
const root = createRoot(container);
root.render(<App />);
