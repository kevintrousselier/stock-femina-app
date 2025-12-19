import dynamic from 'next/dynamic';

// Charger le composant uniquement côté client (pas de SSR)
const StockApp = dynamic(() => import('./StockApp'), {
  ssr: false,
  loading: () => (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: '#FCE4F2',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
        <div style={{ color: '#E91E8C', fontWeight: '600' }}>Chargement...</div>
      </div>
    </div>
  ),
});

export default function Home() {
  return <StockApp />;
}
