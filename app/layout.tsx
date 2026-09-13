import './globals.css';
export const metadata={title:'LG Agenda',description:'Agenda inteligente para barbearias'};
export const viewport={width:'device-width',initialScale:1,viewportFit:'cover'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="pt-BR"><body>{children}</body></html>}
