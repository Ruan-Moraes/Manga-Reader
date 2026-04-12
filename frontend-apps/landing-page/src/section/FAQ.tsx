import { useTranslation } from "react-i18next";
import Accordion from "@/shared/component/Accordion";

export default function FAQ() {
  const { t } = useTranslation();
  const items = t("faq.items", { returnObjects: true }) as Array<{
    question: string;
    answer: string;
  }>;

  return (
    <section id="faq" className="py-24 px-4">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-white mb-12">
          {t("faq.title")}
        </h2>
        <Accordion items={items} />
      </div>
    </section>
  );
}
