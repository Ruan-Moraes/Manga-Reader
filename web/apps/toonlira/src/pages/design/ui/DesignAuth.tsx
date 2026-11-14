import { useState } from 'react';
import { Login } from '@pages/login';
import { SignUp } from '@pages/sign-up';
import { ForgotPassword } from '@pages/forgot-password';

type View = 'login' | 'signup' | 'forgot';

const VIEWS: { key: View; label: string }[] = [
    { key: 'login', label: 'Login' },
    { key: 'signup', label: 'Cadastro' },
    { key: 'forgot', label: 'Esqueci senha' },
];

const DesignAuth = () => {
    const [view, setView] = useState<View>('login');

    return (
        <div>
            <div className="flex gap-3 border-b border-ui-border px-6 py-3">
                {VIEWS.map(v => (
                    <button
                        key={v.key}
                        type="button"
                        onClick={() => setView(v.key)}
                        className={`text-ui-small font-ui-bold transition-colors ${view === v.key ? 'text-ui-accent-fg' : 'text-ui-fg-subtle hover:text-ui-fg'}`}
                    >
                        {v.label}
                    </button>
                ))}
            </div>
            {view === 'login' && <Login />}
            {view === 'signup' && <SignUp />}
            {view === 'forgot' && <ForgotPassword />}
        </div>
    );
};

export default DesignAuth;
