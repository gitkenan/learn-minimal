import Auth from '@/components/Auth';

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-full max-w-md bg-surface p-8 rounded-lg shadow-claude">
        <h1 className="text-2xl font-semibold mb-6 text-center">
          Sign In to Learn Minimal
        </h1>
        <Auth />
      </div>
    </div>
  );
}

AuthPage.noLayout = true
