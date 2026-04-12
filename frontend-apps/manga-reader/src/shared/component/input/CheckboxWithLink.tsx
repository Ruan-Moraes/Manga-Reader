import AppLink from '@shared/component/link/element/AppLink';
import BaseCheckbox from '@shared/component/input/BaseCheckbox';

type CheckboxWithLinkTypes = {
    label: string;
    link: string;
    linkText: string;
    checked?: boolean;
    onChange?: (checked: boolean) => void;
};

const CheckboxWithLink = ({
    label,
    link,
    linkText,
    checked,
    onChange,
}: CheckboxWithLinkTypes) => {
    return (
        <div className="flex items-center gap-2">
            <BaseCheckbox label="" checked={checked} onChange={onChange} />
            <p className="text-sm cursor-pointer">
                <span>{label}</span>{' '}
                <span>
                    <AppLink
                        link={link}
                        className="font-bold underline"
                        text={linkText}
                    />
                </span>
            </p>
        </div>
    );
};

export default CheckboxWithLink;
