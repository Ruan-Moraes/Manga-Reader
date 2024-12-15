const ContactForm = () => {
  return (
    <section>
      <div>
        <h3>Entre em Contato</h3>
      </div>
      <div>
        <form className="flex flex-col gap-4">
          <div>
            <label htmlFor="name">Nome:</label>
            <input id="name" name="name" type="text" />
          </div>
          <div>
            <label htmlFor="email">E-mail:</label>
            <input id="email" name="email" type="email" />
          </div>
          <div>
            <label htmlFor="message">Mensagem:</label>
            <textarea id="message" name="message" rows={4} />
          </div>
          <div>
            <button type="submit">Enviar</button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default ContactForm;
