import FormWrapper from '@shared/component/form/FormWrapper';
import BaseInput from '@shared/component/input/BaseInput';
import BaseTextArea from '@shared/component/input/BaseTextArea';
import BaseSelect from '@shared/component/input/BaseSelect';
import RaisedButton from '@shared/component/button/RaisedButton';

import { usePublishWorkForm } from '@feature/contact';

const WORK_TYPE_OPTIONS = [
    { value: '', label: 'Selecione o tipo de trabalho' },
    { value: 'manga', label: 'Manga' },
    { value: 'webtoon', label: 'Webtoon' },
    { value: 'fanfic', label: 'Fanfic' },
    { value: 'fanart', label: 'Fanart' },
    { value: 'other', label: 'Outro' },
];

const ContactForm = () => {
    const { draft, errors, isSubmitting, updateField, handleSubmit } =
        usePublishWorkForm();

    return (
        <FormWrapper
            onFormSubmit={handleSubmit}
            title="Formulário de Publicação"
            subtitle="Preencha os campos abaixo para enviar sua solicitação de publicação."
        >
            <BaseInput
                label="Nome:"
                type="text"
                placeholder="Seu nome completo"
                value={draft.name}
                onChange={e => updateField('name', e.target.value)}
                disabled={isSubmitting}
                error={errors.name}
                name="name"
            />
            <BaseInput
                label="Email:"
                type="email"
                placeholder="seu@email.com"
                value={draft.email}
                onChange={e => updateField('email', e.target.value)}
                disabled={isSubmitting}
                error={errors.email}
                name="email"
            />
            <BaseSelect
                label="Tipo de trabalho:"
                options={WORK_TYPE_OPTIONS}
                value={draft.workType}
                onChange={e => updateField('workType', e.target.value)}
                disabled={isSubmitting}
                error={errors.workType}
                name="workType"
            />
            <BaseInput
                label="Título do trabalho:"
                type="text"
                placeholder="Nome da sua obra"
                value={draft.workTitle}
                onChange={e => updateField('workTitle', e.target.value)}
                disabled={isSubmitting}
                error={errors.workTitle}
                name="workTitle"
            />
            <BaseTextArea
                label="Sinopse:"
                placeholder="Descreva brevemente a história ou conceito do seu trabalho"
                value={draft.synopsis}
                onChange={e => updateField('synopsis', e.target.value)}
                disabled={isSubmitting}
                error={errors.synopsis}
                name="synopsis"
                rows={4}
            />
            <BaseInput
                label="Link do portfólio (opcional):"
                type="url"
                placeholder="https://seu-portfolio.com"
                value={draft.portfolioLink}
                onChange={e => updateField('portfolioLink', e.target.value)}
                disabled={isSubmitting}
                error={errors.portfolioLink}
                name="portfolioLink"
            />
            <BaseTextArea
                label="Mensagem:"
                placeholder="Conte-nos mais sobre seu trabalho e por que deseja publicá-lo conosco"
                value={draft.message}
                onChange={e => updateField('message', e.target.value)}
                disabled={isSubmitting}
                error={errors.message}
                name="message"
                rows={6}
            />
            <RaisedButton
                text={isSubmitting ? 'Enviando...' : 'Enviar solicitação'}
            />
        </FormWrapper>
    );
};

export default ContactForm;
