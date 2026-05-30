import type { CSSProperties, ReactNode } from 'react';

import Header from '@app/layout/Header';
import Main from '@app/layout/Main';
import Footer from '@app/layout/Footer';

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
