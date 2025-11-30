export type AppRole = 
  | 'sirket_sahibi'
  | 'genel_mudur'
  | 'muhasebe'
  | 'uretim_sefi'
  | 'teknisyen'
  | 'servis_personeli'
  | 'saha_montaj'
  | 'uretim_personeli';

export interface RoutePermission {
  path: string;
  name: string;
  allowedRoles: AppRole[];
  icon?: any;
}

// Rol bazlı sayfa erişim haritası
export const ROUTE_PERMISSIONS: Record<string, AppRole[]> = {
  '/': ['sirket_sahibi', 'genel_mudur', 'muhasebe', 'uretim_sefi', 'teknisyen', 'servis_personeli', 'saha_montaj', 'uretim_personeli'],
  '/uretim': ['sirket_sahibi', 'genel_mudur', 'uretim_sefi', 'uretim_personeli'],
  '/yeni-uretim': ['sirket_sahibi', 'genel_mudur', 'uretim_sefi', 'uretim_personeli'],
  '/makine': ['sirket_sahibi', 'genel_mudur', 'uretim_sefi', 'teknisyen', 'servis_personeli'],
  '/stoklar': ['sirket_sahibi', 'genel_mudur', 'muhasebe', 'uretim_sefi'],
  '/siparisler': ['sirket_sahibi', 'genel_mudur', 'muhasebe', 'saha_montaj'],
  '/finansal': ['sirket_sahibi', 'genel_mudur', 'muhasebe'],
  '/uyarilar': ['sirket_sahibi', 'genel_mudur', 'uretim_sefi', 'teknisyen'],
  '/personel': ['sirket_sahibi', 'genel_mudur'],
};

export const ROLE_NAMES: Record<AppRole, string> = {
  sirket_sahibi: 'Şirket Sahibi',
  genel_mudur: 'Genel Müdür',
  muhasebe: 'Muhasebe',
  uretim_sefi: 'Üretim Şefi',
  teknisyen: 'Teknisyen',
  servis_personeli: 'Servis Personeli',
  saha_montaj: 'Saha Montaj',
  uretim_personeli: 'Üretim Personeli',
};