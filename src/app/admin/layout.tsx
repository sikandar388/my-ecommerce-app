export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-6xl mx-auto p-6">
      <div>{children}</div>
    </div>
  );
}
