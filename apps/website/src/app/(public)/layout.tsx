import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { ContactBubble } from "@/components/site/ContactBubble";
import { CategoriesProvider } from "@/components/prompts/CategoriesContext";
import { FreeCopyProvider } from "@/components/prompts/FreeCopyProvider";
import { getHeaderCta, getPromptCategories } from "@/lib/site-settings";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [categories, headerCta] = await Promise.all([
    getPromptCategories(),
    getHeaderCta(),
  ]);
  return (
    <CategoriesProvider categories={categories}>
      <FreeCopyProvider>
        <Header headerCta={headerCta} />
        <main className="flex-1">{children}</main>
        <Footer />
        <ContactBubble />
      </FreeCopyProvider>
    </CategoriesProvider>
  );
}
