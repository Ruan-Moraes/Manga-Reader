import { useTranslation } from 'react-i18next';

export default function Footer() {
    const { t } = useTranslation();

    return (
        <footer className="border-t border-secondary py-8 text-center text-sm text-tertiary">
            © {new Date().getFullYear()} Manga Reader.{' '}
            {t('footer.rights_reserved')}
        </footer>
    );
}
