import Header from "@/components/dashboard/global/header";
import Footer from "@/components/shared/global/footer";
import { useEffect } from "react";

export default function DashboardLayout({ children }: Readonly<{ children: React.ReactNode; }>) {
  useEffect(() => {
    const script = document.createElement('script');
         
    script.src = "https://srv5.chatmix.com.br/_widgets/init.js";
    script.setAttribute('onload', `init('0fe990ce-b4b7-4b07-8e02-da812b6bc529')`);
    script.async = true;
    script.defer = true;
     
    document.body.appendChild(script);
     
    return () => {
      document.body.removeChild(script);
    }
  }, []);

  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}
