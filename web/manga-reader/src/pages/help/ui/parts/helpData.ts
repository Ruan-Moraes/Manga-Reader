import { BookOpen, Shield, Settings, Users, MessageCircle, AlertTriangle, Globe } from 'lucide-react';

export const CATEGORIES = [
    { slug: 'account', icon: Users, count: 12 },
    { slug: 'reading', icon: BookOpen, count: 8 },
    { slug: 'library', icon: BookOpen, count: 7 },
    { slug: 'community', icon: MessageCircle, count: 9 },
    { slug: 'settings', icon: Settings, count: 6 },
    { slug: 'privacy', icon: Shield, count: 5 },
    { slug: 'billing', icon: Globe, count: 4 },
    { slug: 'technical', icon: AlertTriangle, count: 11 },
] as const;

export const ARTICLES = [
    { id: '1', cat: 'account', views: 14200, helpful: 97 },
    { id: '2', cat: 'reading', views: 9800, helpful: 94 },
    { id: '3', cat: 'account', views: 8600, helpful: 99 },
    { id: '4', cat: 'settings', views: 7200, helpful: 92 },
    { id: '5', cat: 'billing', views: 6500, helpful: 88 },
    { id: '6', cat: 'technical', views: 5800, helpful: 81 },
] as const;

export const FAQ_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8'] as const;

export const STATUS_TILES = [
    { key: 'reader', status: 'operating' as const },
    { key: 'search', status: 'operating' as const },
    { key: 'auth', status: 'operating' as const },
    { key: 'notifications', status: 'degraded' as const },
    { key: 'payments', status: 'operating' as const },
    { key: 'api', status: 'operating' as const },
] as const;

export type StatusKey = 'operating' | 'degraded' | 'idle' | 'maintenance';

export const fmt = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n));
