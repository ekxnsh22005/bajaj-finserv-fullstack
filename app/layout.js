import './globals.css';

export const metadata = {
  title: 'Node Hierarchy Analyzer',
  description: 'Parse directed edges into hierarchical trees',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
