import type { CSSProperties, ReactNode } from 'react';

import { Header } from '@widgets/header';
import { Footer } from '@widgets/footer';
import Main from './Main';

type PageShellProps = {
    children: ReactNode;
    mainClassName?: string;
    footerShowLinks?: boolean;
    footerStyles?: CSSProperties;
};

const PageShell = ({ children, mainClassName, footerShowLinks, footerStyles }: PageShellProps) => {
    return (
        <>
            <Header />
            <Main className={mainClassName}>{children}</Main>
            <Footer showLinks={footerShowLinks} styles={footerStyles} />
        </>
    );
};

export default PageShell;
