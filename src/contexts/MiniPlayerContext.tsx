import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

interface MiniPlayerState {
  isActive: boolean;
  videoSrc: string;
  videoTitle: string;
  videoId: string;
  currentTime: number;
  isPlaying: boolean;
}

interface MiniPlayerContextType {
  state: MiniPlayerState;
  openMiniPlayer: (
    videoSrc: string,
    videoTitle: string,
    videoId: string,
    currentTime?: number,
    isPlaying?: boolean
  ) => void;
  closeMiniPlayer: () => void;
  updateCurrentTime: (time: number) => void;
  setIsPlaying: (playing: boolean) => void;
}

const MiniPlayerContext = createContext<MiniPlayerContextType | null>(null);

const initialState: MiniPlayerState = {
  isActive: false,
  videoSrc: "",
  videoTitle: "",
  videoId: "",
  currentTime: 0,
  isPlaying: false,
};

export function MiniPlayerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<MiniPlayerState>(initialState);

  const openMiniPlayer = useCallback(
    (
      videoSrc: string,
      videoTitle: string,
      videoId: string,
      currentTime = 0,
      isPlaying = true
    ) => {
      setState({
        isActive: true,
        videoSrc,
        videoTitle,
        videoId,
        currentTime,
        isPlaying,
      });
    },
    []
  );

  const closeMiniPlayer = useCallback(() => {
    setState(initialState);
  }, []);

  const updateCurrentTime = useCallback((time: number) => {
    setState((prev) => ({ ...prev, currentTime: time }));
  }, []);

  const setIsPlaying = useCallback((playing: boolean) => {
    setState((prev) => ({ ...prev, isPlaying: playing }));
  }, []);

  return (
    <MiniPlayerContext.Provider
      value={{
        state,
        openMiniPlayer,
        closeMiniPlayer,
        updateCurrentTime,
        setIsPlaying,
      }}
    >
      {children}
    </MiniPlayerContext.Provider>
  );
}

export function useMiniPlayer() {
  const context = useContext(MiniPlayerContext);
  if (!context) {
    throw new Error("useMiniPlayer must be used within a MiniPlayerProvider");
  }
  return context;
}
