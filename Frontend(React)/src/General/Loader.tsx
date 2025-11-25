import React from "react";
import { createRoot } from "react-dom/client";

let container: HTMLDivElement | null = null;
let root: any = null;
let timerId: NodeJS.Timeout | null = null;

const LoadingPopup: React.FC<{ duration?: number }> = ({ duration = 2000 }) => {
  React.useEffect(() => {
    if (duration > 0) {
      timerId = setTimeout(() => {
        closeLoading();
      }, duration);
    }
    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [duration]);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[999999] bg-black/40 backdrop-blur-sm">
      <div className="flex flex-col items-center bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg w-60">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent border-b-transparent rounded-full animate-spin mb-4"></div>
        <span className="text-gray-900 dark:text-white font-medium">Loading . . .</span>
      </div>
    </div>
  );
};

export const showLoading = (duration = 2000) => {
  if (!container) {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  }
  root.render(<LoadingPopup duration={duration} />);
};

export const closeLoading = () => {
  if (root && container) {
    root.unmount();
    document.body.removeChild(container);
    container = null;
    root = null;
  }
};
