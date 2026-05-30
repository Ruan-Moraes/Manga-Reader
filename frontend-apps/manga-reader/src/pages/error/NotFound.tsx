import { useTranslation } from 'react-i18next';
import useAppNavigate from '@shared/hook/useAppNavigate';
import { Home, Search } from 'lucide-react';
import { PageContainer } from '@ui/PageContainer';
import { EmptyState } from '@ui/EmptyState';
import { Button } from '@ui/Button';

const NotFound = () => {
    const navigate = useAppNavigate();
    const { t } = useTranslation('common');

    return (
        <PageContainer asMain paddingY="lg" className="flex items-center justify-center min-h-[60vh]">
            <EmptyState
                illustration="404"
                title={t('notFound.pageTitle')}
                description={t('notFound.pageDesc')}
                action={
                    <div className="flex flex-wrap justify-center gap-3">
                        <Button variant="primary" icon={Home} onClick={() => navigate('/')}>
                            {t('notFound.goHome')}
                        </Button>
                        <Button variant="ghost" icon={Search} onClick={() => navigate('/categories')}>
                            {t('notFound.searchWorks')}
                        </Button>
                    </div>
                }
            />
        </PageContainer>
    );
};

export default NotFound;
