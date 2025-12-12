import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Layout } from "./components/layout";
import { MiniPlayerProvider, VideoPlayerProvider } from "./contexts";
import { HomePage, VideoPage, CreateVideoPage } from "./pages";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AppLayout() {
  const location = useLocation();
  const isVideoPage = /^\/video\/[^/]+$/.test(location.pathname);

  return (
    <Layout
      hideHeader={isVideoPage}
      hideFooter={isVideoPage}
      noPadding={isVideoPage}
    >
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/video/:id" element={<VideoPage />} />
        <Route path="/create" element={<CreateVideoPage />} />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <MiniPlayerProvider>
          <VideoPlayerProvider>
            <AppLayout />
          </VideoPlayerProvider>
        </MiniPlayerProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
