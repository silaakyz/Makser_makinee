import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ROLE_NAMES } from "@/config/rolePermissions";
import type { AppRole } from "@/config/rolePermissions";
import { Users } from "lucide-react";

interface PersonelData {
  id: string;
  ad: string | null;
  soyad: string | null;
  email: string | null;
  role: AppRole;
}

export default function Personel() {
  const [personelList, setPersonelList] = useState<PersonelData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPersonel();
  }, []);

  const fetchPersonel = async () => {
    try {
      setLoading(true);
      
      // Tüm profilleri çek
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) throw profilesError;

      // Tüm rolleri çek
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      // Profil ve rolleri birleştir
      const combinedData: PersonelData[] = profiles?.map(profile => {
        const userRole = roles?.find(r => r.user_id === profile.id);
        return {
          id: profile.id,
          ad: profile.ad,
          soyad: profile.soyad,
          email: profile.email,
          role: userRole?.role || 'uretim_personeli' as AppRole
        };
      }) || [];

      setPersonelList(combinedData);
    } catch (error: any) {
      console.error('Personel listesi yüklenirken hata:', error);
      toast.error('Personel listesi yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Users className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Personel Yönetimi</h1>
            <p className="text-muted-foreground">Tüm personellerin listesi ve görevleri</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Personel Listesi</CardTitle>
            <CardDescription>Toplam {personelList.length} personel</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ad</TableHead>
                    <TableHead>Soyad</TableHead>
                    <TableHead>E-posta</TableHead>
                    <TableHead>Görev</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {personelList.map((personel) => (
                    <TableRow key={personel.id}>
                      <TableCell className="font-medium">{personel.ad || '-'}</TableCell>
                      <TableCell>{personel.soyad || '-'}</TableCell>
                      <TableCell>{personel.email || '-'}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          {ROLE_NAMES[personel.role]}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                  {personelList.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        Henüz kayıtlı personel bulunmamaktadır
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
