import "@/styles/app.css";
import localFont from "next/font/local";
import type { AppProps } from "next/app";
import favicon from '../../public/favicon.ico';
import Head from "next/head";
import { UserProvider } from "@/context/user";
import { ToastProvider } from "@/components/shared/ToastProvider";
import { ToastSettingsProvider } from "@/context/toastSettings";

const geistSans = localFont({
  src: "../fonts/GeistVF.woff",
  variable: "--font-sans",
  weight: "100 900",
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <UserProvider user={pageProps.user}>
      <ToastSettingsProvider>
        <ToastProvider>
          <Head>
            <title>Dr. Gorila App</title>
            <meta name="description" content="Aplicativo Dr. Gorila" />
            <link rel="icon" href={favicon.src} sizes="any" />
          </Head>
          <main className={`${geistSans.variable} font-body`}>
            <Component {...pageProps} />
          </main>
        </ToastProvider>
      </ToastSettingsProvider>
    </UserProvider>
  );
}
