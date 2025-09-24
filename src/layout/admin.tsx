import Header from "@/components/admin/global/header";
import Footer from "@/components/shared/global/footer";

export default function AdminLayout({ children, sessionId }: Readonly<{ 
  children: React.ReactNode;
  sessionId?: string;
}>) {
  return (
    <>
      <Header sessionId={sessionId} />
      {children}
      <Footer />
    </>
  );
}
