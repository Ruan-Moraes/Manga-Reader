import type { CSSProperties, ReactNode } from 'react';

import Header from '@widgets/header/Header';
import Main from '@widgets/layouts/Main';
import Footer from '@widgets/footer/Footer';

type PageShellProps = {
    children: ReactNode;
    showAuth?: boolean;
    showSearch?: boolean;
    mainClassName?: string;
    footerShowLinks?: boolean;
    footerStyles?: CSSProperties;
};

const PageShell = ({ children, showAuth, showSearch, mainClassName, footerShowLinks, footerStyles }: PageShellProps) => {
    return (
        <>
            <Header showAuth={showAuth} showSearch={showSearch} />
            <Main className={mainClassName}>{children}</Main>
            <Footer showLinks={footerShowLinks} styles={footerStyles} />
        </>
    );
};

export default PageShell;
