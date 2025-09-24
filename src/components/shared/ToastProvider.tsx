import React from 'react';
import { ToastContainer, Bounce } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useToastSettings } from '../../context/toastSettings';
import { useMediaQuery } from '../../hooks/useMediaQuery';

interface ToastProviderProps {
  children: React.ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const { settings } = useToastSettings();
  const { isMobile } = useMediaQuery();

  const getToastContainerStyle = () => {
    const topOffset = isMobile ? '50px' : '80px';
    
    const baseStyle: React.CSSProperties = {
      zIndex: 9999,
    };

    if (settings.position.startsWith('top')) {
      baseStyle.top = topOffset;
    }

    return baseStyle;
  };

  return (
    <>
      {children}
      {settings.enabled && (
        <ToastContainer
          position={settings.position}
          autoClose={settings.autoClose}
          hideProgressBar={!settings.showProgress}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          limit={5}
          pauseOnHover={settings.pauseOnHover}
          theme={settings.theme}
          transition={Bounce}
          stacked={true}
          icon={false}
          style={getToastContainerStyle()}
          toastClassName={(context) => {
            const baseClasses = 'relative flex p-4 rounded-md justify-between overflow-hidden cursor-pointer bg-white shadow transition-transform duration-200 hover:scale-105 hover:shadow-xl';

            if (context?.defaultClassName?.includes('toast-document-request')) {
              return `${baseClasses} bg-blue-50 border-l-4 border-blue-500 text-blue-800`;
            }
            
            return context?.defaultClassName || baseClasses;
          }}
          progressClassName={(context) => {
            if (context?.defaultClassName?.includes('toast-document-request')) {
              return "bg-blue-500";
            }
            return "";
          }}
        />
      )}
    </>
  );
};
