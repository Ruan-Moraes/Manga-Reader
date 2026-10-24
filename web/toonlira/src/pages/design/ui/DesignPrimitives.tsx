import CompositesSection from './parts/CompositesSection';
import ContentCardsSection from './parts/ContentCardsSection';
import LayoutsSection from './parts/LayoutsSection';
import PrimitivesSection from './parts/PrimitivesSection';

export default function DesignPrimitives() {
    return (
        <div className="mx-auto max-w-4xl px-6 py-10">
            <PrimitivesSection />
            <CompositesSection />
            <LayoutsSection />
            <ContentCardsSection />
        </div>
    );
}
