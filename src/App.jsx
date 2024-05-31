import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./tailwind.css";

import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import AboutUs from "./pages/AboutUs";
import OurCollections from "./pages/OurCollections";
import EachCollection from "./pages/EachCollection";
import DocumentViewer from "./pages/DocumentViewer";
import Blogs from "./pages/Blogs";
import BlogArticle from "./pages/BlogArticle";
import OnlineResources from "./pages/OnlineResources";

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
              <Route path="/our-collections" element={<OurCollections />} />
              <Route
                path="/our-collections/:collectionId"
                element={<EachCollection />}
              />
              <Route
                path="/our-collections/:collectionId/:documentId"
                element={<DocumentViewer />}
              />
              <Route path="/blogs" element={<Blogs />} />
              <Route path="/blogs/:id" element={<BlogArticle />} />
              <Route path="/online-resources" element={<OnlineResources />} />
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
