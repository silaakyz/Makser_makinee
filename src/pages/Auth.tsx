import { useState, type FormEvent } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signIn, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if already logged in
  if (user) {
    navigate('/');
    return null;
  }

  const handleSignIn = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      toast({
        title: 'Giriş Hatası',
        description: error.message === 'Invalid login credentials' 
          ? 'Email veya şifre hatalı' 
          : error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Başarılı',
        description: 'Giriş yapıldı',
      });
      navigate('/');
    }

    setLoading(false);
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0A1128] via-[#0D1533] to-[#1a1f3a] p-4">
      <Card className="w-full max-w-md border-border/40 bg-card/95 backdrop-blur">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-center">
            <img 
              src="/logo.png" 
              alt="Makser Makina Logo" 
              className="h-20 w-auto object-contain"
            />
          </div>
          <div className="text-center">
            <CardTitle className="text-2xl font-bold">Fabrika Yönetim</CardTitle>
            <CardDescription>Personel Giriş Sistemi</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="ornek@fabrika.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="text-foreground"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Şifre</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="text-foreground"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}