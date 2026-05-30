import { useState } from 'react';
import Login from '@app/route/login/Login';
import SignUp from '@app/route/sign-up/SignUp';
import ForgotPassword from '@app/route/forgot-password/ForgotPassword';

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
            <div className="flex gap-3 border-b border-mr-border px-6 py-3">
                {VIEWS.map(v => (
                    <button
                        key={v.key}
                        type="button"
                        onClick={() => setView(v.key)}
                        className={`text-mr-small font-mr-bold transition-colors ${view === v.key ? 'text-mr-accent' : 'text-mr-fg-subtle hover:text-mr-fg'}`}
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
